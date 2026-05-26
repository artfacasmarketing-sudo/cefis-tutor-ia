import { after } from 'next/server'
import { cookies } from 'next/headers'
import { streamText, convertToModelMessages, tool } from 'ai'
import type { UIMessage } from 'ai'
import { z } from 'zod'
import OpenAI from 'openai'
import { openai } from '@/lib/ai/openai'
import { matchTranscripts, formatRagContext } from '@/lib/ai/rag'
import { buildTutorPrompt } from '@/lib/prompts/tutor'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { generatePodcastBackground } from '@/lib/ai/podcast-generator'
import type { DomainMap } from '@/types/domain'

export const maxDuration = 45

// Convert streamText ContentPart array → UIMessage parts for storage
// Merges tool-call + tool-result into a single tool-{name} part
interface ContentPart {
  type: string
  text?: string
  toolCallId?: string
  toolName?: string
  args?: unknown
  result?: unknown
}

function contentToUIParts(content: ContentPart[]): unknown[] {
  const toolCalls = new Map<string, { toolName: string; args: unknown }>()
  const parts: unknown[] = []

  for (const part of content) {
    if (part.type === 'text' && part.text) {
      parts.push({ type: 'text', text: part.text })
    } else if (part.type === 'tool-call' && part.toolCallId) {
      toolCalls.set(part.toolCallId, { toolName: part.toolName!, args: part.args })
    } else if (part.type === 'tool-result' && part.toolCallId) {
      const call = toolCalls.get(part.toolCallId)
      if (call) {
        parts.push({
          type: `tool-${call.toolName}`,
          toolCallId: part.toolCallId,
          state: 'output-available',
          input: call.args,
          output: part.result,
        })
      }
    }
  }

  return parts
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const cefisKey = cookieStore.get('cefis_key')?.value
  const userId = cookieStore.get('cefis_user_id')?.value

  if (!cefisKey || !userId) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json() as { messages: UIMessage[]; conversationId?: string }
  const { messages } = body
  let conversationId = body.conversationId ?? null

  const supabase = createSupabaseAdmin()

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id, name, objective, learning_style, domain_map')
    .eq('cefis_user_id', userId)
    .single()

  if (!profile?.id) return Response.json({ error: 'Perfil não encontrado' }, { status: 404 })

  // Create conversation if none provided
  if (!conversationId) {
    const { data: newConv } = await supabase
      .from('conversations')
      .insert({ student_profile_id: profile.id, title: 'Nova conversa' })
      .select('id')
      .single()
    conversationId = newConv?.id ?? null
  }

  const lastUserText = [...messages]
    .reverse()
    .find(m => m.role === 'user')
    ?.parts
    .filter((p): p is { type: 'text'; text: string } => (p as { type: string }).type === 'text')
    .map(p => p.text)
    .join('') ?? ''

  const [ragChunks, modelMessages] = await Promise.all([
    lastUserText
      ? matchTranscripts(lastUserText, { threshold: 0.70, count: 5 })
      : Promise.resolve([]),
    convertToModelMessages(messages),
  ])

  const systemPrompt = buildTutorPrompt({
    userName: profile.name ?? 'Aluno',
    objective: profile.objective,
    learningStyle: profile.learning_style,
    ragContext: formatRagContext(ragChunks),
    hasChunks: ragChunks.length > 0,
    topChunks: ragChunks.map(c => ({ courseTitle: c.courseTitle, lessonTitle: c.lessonTitle })),
    domainMap: (profile.domain_map ?? undefined) as DomainMap | undefined,
  })

  // Capture whether this is the first message (for auto-title)
  const isFirstMessage = messages.filter(m => m.role === 'user').length === 1

  let podcastJob: { audioId: string; topico: string } | null = null

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: modelMessages,
    tools: {
      gerar_podcast: tool({
        description:
          'Gera um podcast personalizado de ~1 minuto sobre um tópico específico, narrado em PT-BR com voz natural. ' +
          'Use SEMPRE que o aluno pedir áudio, podcast, ou disser "quero ouvir", "no carro", "enquanto estudo", "caminho da prova".',
        inputSchema: z.object({
          topico: z.string().describe('Tema do podcast (ex: "Contabilidade Geral")'),
        }),
        execute: async ({ topico }) => {
          const { data: audio } = await supabase
            .from('generated_audios')
            .insert({
              student_profile_id: profile.id,
              status: 'generating',
              topics: [topico],
              title: `Podcast: ${topico}`,
              script: '',
            })
            .select('id')
            .single()

          if (audio?.id) podcastJob = { audioId: audio.id, topico }

          return {
            audioId: audio?.id ?? null,
            topico,
            mensagem: `Tô gerando seu podcast sobre "${topico}" agora. Em uns 30 segundos aparece aqui no chat — pode continuar perguntando!`,
          }
        },
      }),
    },
    onFinish: async ({ text, steps }) => {
      if (!conversationId) return

      const convId = conversationId
      const userParts = [{ type: 'text', text: lastUserText }]

      // Bug A fix: usar TODOS os steps para capturar tool-call+tool-result.
      // onFinish.content é só o último step — a tool call fica no step 1, o texto no step 2.
      const allContent = steps.flatMap(s => s.content as ContentPart[])
      const assistantParts = contentToUIParts(allContent)

      console.log('[chat/onFinish] steps:', steps.length, '| parts gerados:', JSON.stringify(assistantParts.map(p => (p as {type:string}).type)))

      await Promise.all([
        // Save user message with parts
        lastUserText
          ? supabase.from('tutor_messages').insert({
              student_profile_id: profile.id,
              conversation_id: convId,
              role: 'user',
              content: lastUserText,
              parts: userParts,
              metadata: { rag_chunks: ragChunks.length },
            })
          : Promise.resolve(),

        // Save assistant message with full parts (preserves tool invocations)
        supabase.from('tutor_messages').insert({
          student_profile_id: profile.id,
          conversation_id: convId,
          role: 'assistant',
          content: text,
          parts: assistantParts.length > 0 ? assistantParts : [{ type: 'text', text }],
          metadata: {
            sources: ragChunks.map(c => ({
              id: c.id,
              lessonId: c.lessonId,
              lessonTitle: c.lessonTitle,
              courseId: c.courseId,
              courseTitle: c.courseTitle,
              contentSnippet: c.content.slice(0, 600),
              similarity: c.similarity,
            })),
          },
        }),

        // Touch updated_at on conversation
        supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId),
      ])
    },
  })

  // Background work after stream completes
  after(async () => {
    // Generate podcast if tool was called
    if (podcastJob && profile.id) {
      await generatePodcastBackground(podcastJob.audioId, podcastJob.topico, profile.id, supabase)
    }

    // Auto-title from first user message
    if (isFirstMessage && conversationId && lastUserText) {
      const convId = conversationId
      try {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const completion = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Resuma essa mensagem em 4-6 palavras como título de conversa em português. Só o título, sem aspas:\n\n${lastUserText}`,
            },
          ],
          max_tokens: 20,
          temperature: 0.3,
        })
        const title = completion.choices[0]?.message?.content?.trim()
        if (title) {
          await supabase
            .from('conversations')
            .update({ title })
            .eq('id', convId)
        }
      } catch { /* title stays as 'Nova conversa' */ }
    }
  })

  // Return conversationId as header so client can persist it
  const response = result.toUIMessageStreamResponse()
  const headers = new Headers(response.headers)
  if (conversationId) headers.set('x-conversation-id', conversationId)

  return new Response(response.body, { status: response.status, headers })
}
