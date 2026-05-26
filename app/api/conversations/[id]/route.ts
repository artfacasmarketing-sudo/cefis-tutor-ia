import { createSupabaseAdmin } from '@/lib/supabase/server'
import { getAuthProfile } from '@/lib/auth/get-profile'

async function getOwnedConversation(id: string, profileId: string) {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('student_profile_id', profileId)
    .single()
  return { supabase, owned: !!data }
}

// ── DELETE /api/conversations/[id] ─────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await getAuthProfile()
  if (!auth) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { supabase, owned } = await getOwnedConversation(id, auth.profileId)
  if (!owned) return Response.json({ error: 'Não encontrado' }, { status: 404 })

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

// ── PATCH /api/conversations/[id] ──────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const auth = await getAuthProfile()
  if (!auth) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const { supabase, owned } = await getOwnedConversation(id, auth.profileId)
  if (!owned) return Response.json({ error: 'Não encontrado' }, { status: 404 })

  const body = await request.json() as { title?: string }
  if (!body.title?.trim()) return Response.json({ error: 'Título obrigatório' }, { status: 400 })

  const { error } = await supabase
    .from('conversations')
    .update({ title: body.title.trim() })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
