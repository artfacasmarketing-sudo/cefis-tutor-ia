import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { TutorChat } from '@/components/chat/TutorChat'

export const metadata = {
  title: 'Chat — CEFIS Tutor',
}

export default async function ChatPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!userId) redirect('/login')

  const supabase = createSupabaseAdmin()
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('onboarding_completed, name')
    .eq('cefis_user_id', userId)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Page sub-header */}
      <div className="bg-white border-b border-zinc-100 px-6 py-3 shrink-0">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-zinc-500">
            Respostas baseadas nas transcrições reais das aulas CEFIS · 18.344 chunks indexados
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto flex flex-col overflow-hidden">
        <TutorChat />
      </div>
    </div>
  )
}
