import { after } from 'next/server'
import { cookies } from 'next/headers'
import { streamText, convertToModelMessages, tool } from 'ai'
import type { UIMessage } from 'ai'
import { z } from 'zod'
import { openai } from '@/lib/ai/openai'
import { matchTranscripts, formatRagContext } from '@/lib/ai/rag'
import { buildTutorPrompt } from '@/lib/prompts/tutor'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { generatePodcastBackground } from '@/lib/ai/podcast-generator'
import type { DomainMap } from '@/types/domain'

export const maxDuration = 45

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const key = cookieStore.get('cefis_key')?.value
  const userId = cookieStore.get('cefis_user_id')?.value

  if (!key || !userId) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json() as { messages: UIMessage[] }
  const { messages } = body

  const lastUserText = [...messages]
    .reverse()
    .find(m => m.role === 'user')
    ?.parts
    .filter((p): p is { type: 'text'; text: string } => (p as { type: string }).type === 'text')
    .map(p => p.text)
    .join('') ?? ''

  const supabase = createSupabaseAdmin()

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id, name, objective, learning_style, domain_map')
    .eq('cefis_user_id', userId)
    .single()

  const [ragChunks, modelMessages] = await Promise.all([
    lastUserText
      ? matchTranscripts(lastUserText, { threshold: 0.70, count: 5 })
      : Promise.resolve([]),
    convertToModelMessages(messages),
  ])

  const systemPrompt = buildTutorPrompt({
    userName: profile?.name ?? 'Aluno',
    objective: profile?.objective,
    learningStyle: profile?.learning_style,
    ragContext: formatRagContext(ragChunks),
    hasChunks: ragChunks.length > 0,
    topChunks: ragChunks.map(c => ({ courseTitle: c.courseTitle, lessonTitle: c.lessonTitle })),
    domainMap: (profile?.domain_map ?? undefined) as DomainMap | undefined,
  })

  // Podcast job scheduled via tool execute — fired in after()
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
          topico: z.string().describe('Tema do podcast (ex: "Contabilidade Geral", "Princípio da Legalidade")'),
        }),
        execute: async ({ topico }) => {
          if (!profile?.id) return { audioId: null, topico, mensagem: 'Perfil não encontrado.' }

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

          if (audio?.id) {
            podcastJob = { audioId: audio.id, topico }
          }

          return {
            audioId: audio?.id ?? null,
            topico,
            mensagem: `Tô gerando seu podcast sobre "${topico}" agora. Em uns 30 segundos aparece aqui no chat — pode continuar perguntando!`,
          }
        },
      }),
    },
    onFinish: async ({ text }) => {
      if (!profile?.id || !lastUserText) return
      await supabase.from('tutor_messages').insert([
        { student_profile_id: profile.id, role: 'user', content: lastUserText, metadata: { rag_chunks: ragChunks.length } },
        { student_profile_id: profile.id, role: 'assistant', content: text, metadata: { sources: ragChunks.map(c => ({ course: c.courseTitle, lesson: c.lessonTitle })) } },
      ])
    },
  })

  // Runs after stream completes (tool execute already done by then)
  after(async () => {
    if (podcastJob && profile?.id) {
      await generatePodcastBackground(podcastJob.audioId, podcastJob.topico, profile.id, supabase)
    }
  })

  return result.toUIMessageStreamResponse()
}
