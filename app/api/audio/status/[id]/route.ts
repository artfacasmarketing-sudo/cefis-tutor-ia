import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = createSupabaseAdmin()

  const { data } = await supabase
    .from('generated_audios')
    .select('status, storage_path, error_message')
    .eq('id', id)
    .single()

  if (!data) return Response.json({ status: 'error' }, { status: 404 })

  let url: string | null = null
  if (data.status === 'ready' && data.storage_path) {
    const { data: signed } = await supabase.storage
      .from('tutor-audios')
      .createSignedUrl(data.storage_path, 60 * 60 * 24) // 24h
    url = signed?.signedUrl ?? null
  }

  return Response.json({ status: data.status as string, url, error: data.error_message as string | null })
}
