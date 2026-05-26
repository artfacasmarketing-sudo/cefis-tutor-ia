import { createSupabaseAdmin } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/auth/get-profile'
import type { UIMessage } from 'ai'

interface DbMessage {
  id: string
  role: string
  content: string
  parts: unknown[] | null
  created_at: string
}

function toUIMessage(row: DbMessage): UIMessage {
  // If parts are stored (new format), use them directly
  if (Array.isArray(row.parts) && row.parts.length > 0) {
    return {
      id: row.id,
      role: row.role as 'user' | 'assistant',
      parts: row.parts as UIMessage['parts'],
      metadata: { created_at: row.created_at },
    }
  }

  // Legacy fallback: content-only → text part
  return {
    id: row.id,
    role: row.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, text: row.content }],
    metadata: { created_at: row.created_at },
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await getAuthProfile()
  if (!auth) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createSupabaseAdmin()

  // Verify ownership via conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('student_profile_id', auth.profileId)
    .single()

  if (!conv) return Response.json({ error: 'Não encontrado' }, { status: 404 })

  const { data, error } = await supabase
    .from('tutor_messages')
    .select('id, role, content, parts, created_at')
    .eq('conversation_id', id)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const messages = (data as DbMessage[]).map(toUIMessage)
  return Response.json(messages)
}
