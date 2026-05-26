import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { TutorChat } from '@/components/chat/TutorChat'
import type { UIMessage } from 'ai'

export const metadata = { title: 'Chat — CEFIS Tutor' }

interface DbMessage {
  id: string
  role: string
  content: string
  created_at: string
}

function toUIMessages(rows: DbMessage[]): UIMessage[] {
  return rows.map(row => ({
    id: row.id,
    role: row.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: row.content }],
    metadata: { created_at: row.created_at },
  }))
}

export default async function ChatPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!userId) redirect('/login')

  const supabase = createSupabaseAdmin()

  const [{ data: profile }, { data: rawMessages }] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('id, onboarding_completed')
      .eq('cefis_user_id', userId)
      .single(),
    // Empty array placeholder while profile loads
    supabase
      .from('student_profiles')
      .select('id')
      .eq('cefis_user_id', userId)
      .single()
      .then(async ({ data: p }) => {
        if (!p?.id) return { data: [] }
        return supabase
          .from('tutor_messages')
          .select('id, role, content, created_at')
          .eq('student_profile_id', p.id)
          .in('role', ['user', 'assistant'])
          .order('created_at', { ascending: true })
          .limit(50)
      }),
  ])

  if (!profile?.onboarding_completed) redirect('/onboarding')

  const historyMessages = toUIMessages((rawMessages as DbMessage[] | null) ?? [])
  const lastHistoryAt = historyMessages.at(-1)
    ? (historyMessages.at(-1)!.metadata as { created_at: string }).created_at
    : null

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Sub-header */}
      <div className="shrink-0 border-b px-6 py-3"
        style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs" style={{ color: 'rgba(245,240,235,0.35)' }}>
            Respostas baseadas nas transcrições reais das aulas CEFIS · 18.344 chunks indexados
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col overflow-hidden">
        <TutorChat
          historyMessages={historyMessages}
          historyCount={historyMessages.length}
          lastHistoryAt={lastHistoryAt}
        />
      </div>
    </div>
  )
}
