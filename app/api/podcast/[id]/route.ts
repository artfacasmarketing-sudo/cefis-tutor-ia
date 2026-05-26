import { cookies } from 'next/headers'
import { createSupabaseAdmin } from '@/lib/supabase/server'

const SIGNED_URL_TTL = 60 * 60 * 24 * 7 // 7 days

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!userId) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createSupabaseAdmin()

  const { data } = await supabase
    .from('generated_audios')
    .select('id, title, status, storage_path, error_message, script, topics, created_at')
    .eq('id', id)
    .single()

  if (!data) return Response.json({ error: 'Não encontrado' }, { status: 404 })

  let url: string | null = null
  if (data.status === 'ready' && data.storage_path) {
    const { data: signed } = await supabase.storage
      .from('tutor-audios')
      .createSignedUrl(data.storage_path, SIGNED_URL_TTL)
    url = signed?.signedUrl ?? null
  }

  return Response.json({
    id: data.id,
    title: data.title,
    status: data.status,
    url,
    script: data.script as string,
    topics: data.topics as string[],
    error: data.error_message as string | null,
    createdAt: data.created_at as string,
  })
}
