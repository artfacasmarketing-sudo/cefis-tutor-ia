import { cookies } from 'next/headers'
import { streamText, convertToModelMessages } from 'ai'
import type { UIMessage } from 'ai'
import { openai } from '@/lib/ai/openai'
import { matchTranscripts, formatRagContext } from '@/lib/ai/rag'
import { buildTutorPrompt } from '@/lib/prompts/tutor'
import { createSupabaseAdmin } from '@/lib/supabase/server'

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

  // Extract last user message for RAG query
  const lastUserMsg = [...messages]
    .reverse()
    .find(m => m.role === 'user')

  const lastUserText = lastUserMsg?.parts
    .filter((p): p is { type: 'text'; text: string } => (p as { type: string }).type === 'text')
    .map(p => p.text)
    .join('') ?? ''

  const supabase = createSupabaseAdmin()

  // Load student profile for personalization
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id, name, objective, learning_style')
    .eq('cefis_user_id', userId)
    .single()

  // RAG: embed + search in parallel with message conversion
  const [ragChunks, modelMessages] = await Promise.all([
    lastUserText
      ? matchTranscripts(lastUserText, { threshold: 0.70, count: 5 })
      : Promise.resolve([]),
    convertToModelMessages(messages),
  ])

  const ragContext = formatRagContext(ragChunks)

  const systemPrompt = buildTutorPrompt({
    userName: profile?.name ?? 'Aluno',
    objective: profile?.objective,
    learningStyle: profile?.learning_style,
    ragContext,
    hasChunks: ragChunks.length > 0,
    topChunks: ragChunks.map(c => ({
      courseTitle: c.courseTitle,
      lessonTitle: c.lessonTitle,
    })),
  })

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text }) => {
      if (!profile?.id || !lastUserText) return

      await supabase.from('tutor_messages').insert([
        {
          student_profile_id: profile.id,
          role: 'user',
          content: lastUserText,
          metadata: { rag_chunks: ragChunks.length },
        },
        {
          student_profile_id: profile.id,
          role: 'assistant',
          content: text,
          metadata: {
            sources: ragChunks.map(c => ({
              course: c.courseTitle,
              lesson: c.lessonTitle,
              similarity: c.similarity,
            })),
          },
        },
      ])
    },
  })

  return result.toUIMessageStreamResponse()
}
