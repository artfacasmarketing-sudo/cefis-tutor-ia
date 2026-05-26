import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { OnboardingChat } from '@/components/onboarding/OnboardingChat'

export const metadata = {
  title: 'Boas-vindas — CEFIS Tutor',
}

export default async function OnboardingPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value

  if (!userId) redirect('/login')

  // If already completed, skip onboarding
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('student_profiles')
    .select('onboarding_completed')
    .eq('cefis_user_id', userId)
    .single()

  if (data?.onboarding_completed) redirect('/dashboard')

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Slim onboarding header */}
      <div className="bg-white border-b border-zinc-100 px-6 py-3 shrink-0 text-center">
        <p className="text-xs text-zinc-500">
          Vamos personalizar sua experiência de estudo — responda algumas perguntas rápidas
        </p>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col overflow-hidden">
        <OnboardingChat />
      </div>
    </div>
  )
}
