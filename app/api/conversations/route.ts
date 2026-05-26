import { createSupabaseAdmin } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/auth/get-profile'
import type { ConversationListItem } from '@/types/conversation'

// ── GET /api/conversations ──────────────────────────────────────────────────
export async function GET() {
  const auth = await getAuthProfile()
  if (!auth) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createSupabaseAdmin()

  // Query A: conversations sem join complexo (evita mistura count+colunas no PostgREST)
  const { data: convs, error: convsError } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('student_profile_id', auth.profileId)
    .order('updated_at', { ascending: false })
    .limit(30)

  if (convsError) {
    console.error('[GET /api/conversations] query error:', convsError.message)
    return Response.json({ error: convsError.message }, { status: 500 })
  }

  if (!convs || convs.length === 0) {
    return Response.json([])
  }

  // Query B: última mensagem do user por conversation (batch único, não N queries)
  const convIds = convs.map(c => c.id)
  const { data: lastMsgs, error: msgsError } = await supabase
    .from('tutor_messages')
    .select('conversation_id, content, created_at')
    .in('conversation_id', convIds)
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  if (msgsError) {
    console.error('[GET /api/conversations] messages query error:', msgsError.message)
    // Non-fatal — continue without preview
  }

  // Build preview map: primeiro resultado por conversation_id = mais recente
  const previewMap = new Map<string, string>()
  for (const msg of lastMsgs ?? []) {
    const cid = msg.conversation_id as string
    if (cid && !previewMap.has(cid)) {
      previewMap.set(cid, (msg.content as string).slice(0, 80))
    }
  }

  const items: ConversationListItem[] = convs.map(conv => ({
    id: conv.id,
    title: conv.title,
    createdAt: conv.created_at,
    updatedAt: conv.updated_at,
    messageCount: 0, // não bloqueamos a UI por isso — calculado no futuro se necessário
    lastMessageAt: conv.updated_at,
    lastUserMessage: previewMap.get(conv.id) ?? null,
  }))

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

  if (error) {
    console.error('[POST /api/conversations] insert error:', error.message)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ id: data.id }, { status: 201 })
}
