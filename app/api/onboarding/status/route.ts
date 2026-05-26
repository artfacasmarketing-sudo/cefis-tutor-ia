import { cookies } from 'next/headers'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value

  if (!userId) {
    return Response.json({ completed: false })
  }

  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('student_profiles')
    .select('onboarding_completed')
    .eq('cefis_user_id', userId)
    .single()

  return Response.json({ completed: data?.onboarding_completed ?? false })
}
