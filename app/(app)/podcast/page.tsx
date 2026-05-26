import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Mic, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export const metadata = { title: 'Meus Podcasts — CEFIS Tutor' }
export const dynamic = 'force-dynamic'

const T = (a: number) => `rgba(245,240,235,${a})`

type AudioStatus = 'pending' | 'generating' | 'ready' | 'error'
interface AudioRow { id: string; title: string; status: AudioStatus; topics: string[]; created_at: string }

function StatusDot({ status }: { status: AudioStatus }) {
  if (status === 'ready') return <CheckCircle className="h-4 w-4" style={{ color: '#4ade80' }} />
  if (status === 'error') return <XCircle className="h-4 w-4" style={{ color: '#e05555' }} />
  return <Loader2 className="h-4 w-4 animate-spin" style={{ color: T(0.3) }} />
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
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
    .neq('status', 'error')
    .order('created_at', { ascending: false })
    .limit(20)

  const list = (audios ?? []) as AudioRow[]

  return (
    <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
      {list.length === 0 ? (
        <div
          className="rounded-2xl p-16 flex flex-col items-center text-center gap-5"
          style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(224,107,73,0.1)', border: '1px solid rgba(224,107,73,0.15)' }}
          >
            <Mic className="h-6 w-6" style={{ color: '#e06b49' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: T(0.8) }}>Nenhum podcast ainda</p>
            <p className="text-xs mt-1" style={{ color: T(0.4) }}>
              Gere seu primeiro episódio personalizado com base nas suas lacunas
            </p>
          </div>
          <a
            href="/podcast/generate"
            className="flex items-center gap-2 text-sm font-semibold rounded-2xl px-5 py-2.5 transition-all cursor-pointer"
            style={{
              background: '#e06b49',
              color: '#f5f0eb',
              boxShadow: '0 0 16px rgba(224,107,73,0.25)',
            }}
          >
            <Mic className="h-4 w-4" />
            Gerar primeiro podcast
          </a>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map(audio => (
            <a
              key={audio.id}
              href={`/podcast/${audio.id}`}
              className="flex items-start gap-4 rounded-2xl p-4 transition-all duration-200"
              style={{
                background: '#242424',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                cursor: audio.status === 'ready' ? 'pointer' : 'default',
                opacity: audio.status === 'error' ? 0.6 : 1,
              }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: audio.status === 'ready' ? 'rgba(224,107,73,0.12)' : 'rgba(255,255,255,0.05)',
                  border: audio.status === 'ready' ? '1px solid rgba(224,107,73,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {audio.status === 'ready'
                  ? <Mic className="h-4 w-4" style={{ color: '#e06b49' }} />
                  : <StatusDot status={audio.status} />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug" style={{ color: T(0.85) }}>
                    {audio.title}
                  </p>
                  <StatusDot status={audio.status} />
                </div>

                {(audio.topics as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(audio.topics as string[]).map(t => (
                      <span
                        key={t}
                        className="text-[10px] rounded-full px-2 py-0.5"
                        style={{ background: 'rgba(255,255,255,0.05)', color: T(0.4) }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-2 text-[11px]" style={{ color: T(0.3) }}>
                  <Clock className="h-3 w-3" />
                  {formatDate(audio.created_at)}
                  {audio.status === 'generating' && (
                    <span style={{ color: '#fbbf24' }} className="font-medium">· Gerando...</span>
                  )}
                  {audio.status === 'error' && (
                    <span style={{ color: '#e05555' }} className="font-medium">· Falha</span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
