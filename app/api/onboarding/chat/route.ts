import { cookies } from 'next/headers'
import { streamText, convertToModelMessages, tool } from 'ai'
import type { UIMessage } from 'ai'
import { openai } from '@/lib/ai/openai'
import { cefisGetMe, cefisGetCertificates } from '@/lib/cefis/client'
import { buildOnboardingPrompt } from '@/lib/prompts/onboarding'
import { saveProfileSchema } from '@/lib/schemas/onboarding'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const key = cookieStore.get('cefis_key')?.value
  const userId = cookieStore.get('cefis_user_id')?.value

  if (!key || !userId) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json() as { messages: UIMessage[] }
  const { messages } = body

  const [user, certificates] = await Promise.all([
    cefisGetMe(key),
    cefisGetCertificates(key).catch(() => []),
  ])

  const systemPrompt = buildOnboardingPrompt(user, certificates)
  const modelMessages = await convertToModelMessages(messages)

  const supabase = createSupabaseAdmin()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: modelMessages,
    tools: {
      saveProfile: tool({
        description:
          'Salva o perfil do aluno após coletar objetivo, tempo disponível e estilo de aprendizagem. Chamar SOMENTE quando os 3 dados forem confirmados.',
        inputSchema: saveProfileSchema,
        execute: async ({ objective, availableHoursWeek, learningStyle }) => {
          const { error } = await supabase
            .from('student_profiles')
            .update({
              objective,
              available_hours_week: availableHoursWeek,
              learning_style: learningStyle,
              onboarding_completed: true,
            })
            .eq('cefis_user_id', userId)

          if (error) throw new Error(`Supabase: ${error.message}`)

          return { saved: true }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
