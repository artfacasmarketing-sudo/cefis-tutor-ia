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
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-base font-semibold text-zinc-900">CEFIS Tutor</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Vamos personalizar sua experiência de estudo
          </p>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col" style={{ height: 'calc(100vh - 73px)' }}>
        <OnboardingChat />
      </div>
    </div>
  )
}
