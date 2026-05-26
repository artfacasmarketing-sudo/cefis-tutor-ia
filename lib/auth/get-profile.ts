import { cookies } from 'next/headers'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export interface AuthProfile {
  userId: string
  profileId: string
}

export async function getAuthProfile(): Promise<AuthProfile | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!userId) return null

  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('cefis_user_id', userId)
    .single()

  if (!data?.id) return null
  return { userId, profileId: data.id }
}
