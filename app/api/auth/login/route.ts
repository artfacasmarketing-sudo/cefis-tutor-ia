import { cookies } from 'next/headers'
import { cefisLogin } from '@/lib/cefis/client'
import { loginSchema } from '@/lib/schemas/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
      { status: 400 },
    )
  }

  let loginData
  try {
    loginData = await cefisLogin(parsed.data.email, parsed.data.password)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 401 })
  }

  const { key, user } = loginData.data
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === 'production'

  cookieStore.set('cefis_key', key, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  cookieStore.set('cefis_user_id', String(user.id), {
    httpOnly: false,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  const supabase = createSupabaseAdmin()
  await supabase.from('student_profiles').upsert(
    {
      cefis_user_id: String(user.id),
      name: user.name,
      occupation: user.occupation,
      nivel: user.nivel,
      is_premium: user.is_premium,
    },
    { onConflict: 'cefis_user_id' },
  )

  return Response.json({ ok: true, user })
}
