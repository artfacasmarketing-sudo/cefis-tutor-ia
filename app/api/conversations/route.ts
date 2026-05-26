import { createSupabaseAdmin } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/auth/get-profile'
import type { ConversationListItem } from '@/types/conversation'

// ── GET /api/conversations ──────────────────────────────────────────────────
export async function GET() {
  const auth = await getAuthProfile()
  if (!auth) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      title,
      created_at,
      updated_at,
      tutor_messages!left(
        count,
        role,
        content,
        created_at
      )
    `)
    .eq('student_profile_id', auth.profileId)
    .order('updated_at', { ascending: false })
    .limit(30)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const items: ConversationListItem[] = (data ?? []).map(row => {
    const msgs = (row.tutor_messages ?? []) as {
      count?: number
      role: string
      content: string
      created_at: string
    }[]

    // PostgREST returns aggregated count as first element when mixed with rows — handle both
    const totalCount = typeof msgs[0]?.count === 'number' ? msgs[0].count : msgs.length
    const userMsgs = msgs.filter(m => m.role === 'user')
    const lastUser = userMsgs.at(-1)

    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: totalCount,
      lastMessageAt: row.updated_at,
      lastUserMessage: lastUser?.content?.slice(0, 80) ?? null,
    }
  })

  return Response.json(items)
}

// ── POST /api/conversations ─────────────────────────────────────────────────
export async function POST() {
  const auth = await getAuthProfile()
  if (!auth) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      student_profile_id: auth.profileId,
      title: 'Nova conversa',
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ id: data.id }, { status: 201 })
}
