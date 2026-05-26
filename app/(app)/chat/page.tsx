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
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Chat de Dúvidas</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Respostas baseadas nas transcrições reais das aulas CEFIS
            </p>
          </div>
          <a
            href="/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Voltar
          </a>
        </div>
      </header>

      <div
        className="flex-1 max-w-4xl w-full mx-auto flex flex-col"
        style={{ height: 'calc(100vh - 73px)' }}
      >
        <TutorChat />
      </div>
    </div>
  )
}
