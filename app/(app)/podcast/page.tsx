import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Mic, Clock, CheckCircle, XCircle, Loader2, Plus } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Meus Podcasts — CEFIS Tutor',
}

export const dynamic = 'force-dynamic'

type AudioStatus = 'pending' | 'generating' | 'ready' | 'error'

interface AudioRow {
  id: string
  title: string
  status: AudioStatus
  topics: string[]
  created_at: string
}

function StatusIcon({ status }: { status: AudioStatus }) {
  switch (status) {
    case 'ready':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PodcastListPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!userId) redirect('/login')

  const supabase = createSupabaseAdmin()

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id, onboarding_completed')
    .eq('cefis_user_id', userId)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  const { data: audios } = await supabase
    .from('generated_audios')
    .select('id, title, status, topics, created_at')
    .eq('student_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const list = (audios ?? []) as AudioRow[]

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Meus Podcasts</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Episódios gerados com base nas suas lacunas de estudo
            </p>
          </div>
          <a
            href="/podcast/generate"
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-700 rounded-lg px-3 py-2 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Gerar novo
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center">
              <Mic className="h-7 w-7 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-700">Nenhum podcast ainda</p>
              <p className="text-xs text-zinc-400 mt-1">
                Gere seu primeiro episódio personalizado com base nas suas lacunas
              </p>
            </div>
            <a
              href="/podcast/generate"
              className="flex items-center gap-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-700 rounded-xl px-5 py-2.5 transition-colors"
            >
              <Mic className="h-4 w-4" />
              Gerar primeiro podcast
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(audio => (
              <a
                key={audio.id}
                href={`/podcast/${audio.id}`}
                className={cn(
                  'flex items-start gap-4 bg-white rounded-xl border p-4 transition-all',
                  audio.status === 'ready'
                    ? 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm cursor-pointer'
                    : 'border-zinc-100 cursor-default',
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                    audio.status === 'ready' ? 'bg-zinc-900' : 'bg-zinc-100',
                  )}
                >
                  {audio.status === 'ready' ? (
                    <Mic className="h-4.5 w-4.5 text-white" />
                  ) : (
                    <StatusIcon status={audio.status} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900 leading-snug">
                      {audio.title}
                    </p>
                    <StatusIcon status={audio.status} />
                  </div>

                  {(audio.topics as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(audio.topics as string[]).map(t => (
                        <span
                          key={t}
                          className="text-[10px] bg-zinc-100 text-zinc-500 rounded-full px-2 py-0.5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {formatDate(audio.created_at)}
                    {audio.status === 'generating' && (
                      <span className="text-amber-500 font-medium">· Gerando...</span>
                    )}
                    {audio.status === 'error' && (
                      <span className="text-red-500 font-medium">· Falha</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
