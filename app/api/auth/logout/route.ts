import { cookies } from 'next/headers'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.set('cefis_key', '', { maxAge: 0, path: '/' })
  cookieStore.set('cefis_user_id', '', { maxAge: 0, path: '/' })
  return Response.json({ ok: true })
}
