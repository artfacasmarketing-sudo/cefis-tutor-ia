import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { ChatLayout } from '@/components/chat/ChatLayout'
import type { UIMessage } from 'ai'

export const metadata = { title: 'Chat — CEFIS Tutor' }

interface DbMessage {
  id: string
  role: string
  content: string
  parts: unknown[] | null
  created_at: string
}

function toUIMessages(rows: DbMessage[]): UIMessage[] {
  return rows.map(row => ({
    id: row.id,
    role: row.role as 'user' | 'assistant',
    parts: Array.isArray(row.parts) && row.parts.length > 0
      ? row.parts as UIMessage['parts']
      : [{ type: 'text' as const, text: row.content }],
    metadata: { created_at: row.created_at },
  }))
}

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>
}) {
  const { c: conversationId } = await searchParams

  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!userId) redirect('/login')

  const supabase = createSupabaseAdmin()
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id, onboarding_completed')
    .eq('cefis_user_id', userId)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  // Load messages for the selected conversation
  let initialMessages: UIMessage[] = []

  if (conversationId && profile.id) {
    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('student_profile_id', profile.id)
      .single()

    if (conv) {
      const { data: msgs } = await supabase
        .from('tutor_messages')
        .select('id, role, content, parts, created_at')
        .eq('conversation_id', conversationId)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: true })
        .limit(100)

      initialMessages = toUIMessages((msgs as DbMessage[] | null) ?? [])
    }
  }

  return (
    <ChatLayout
      conversationId={conversationId ?? null}
      initialMessages={initialMessages}
    />
  )
}
