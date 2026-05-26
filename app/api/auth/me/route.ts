import { cookies } from 'next/headers'
import { cefisGetMe } from '@/lib/cefis/client'

export async function GET() {
  const cookieStore = await cookies()
  const key = cookieStore.get('cefis_key')?.value

  if (!key) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  try {
    const user = await cefisGetMe(key)
    return Response.json(user)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 401 })
  }
}
