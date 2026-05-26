import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Mic, Clock, Zap } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { GenerateButton } from '@/components/podcast/GenerateButton'
import type { DomainMap } from '@/types/domain'

export const metadata = {
  title: 'Gerar Podcast — CEFIS Tutor',
}

export default async function GeneratePodcastPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!userId) redirect('/login')

  const supabase = createSupabaseAdmin()
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('name, objective, domain_map, onboarding_completed')
    .eq('cefis_user_id', userId)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  const domainMap = (profile.domain_map ?? {}) as DomainMap
  const gaps = Object.entries(domainMap)
    .filter(([, v]) => v.gap)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, 3)
    .map(([name, v]) => ({ name, accuracy: v.accuracy, count: v.count }))

  const topics =
    gaps.length > 0 ? gaps.map(g => g.name) : [profile.objective ?? 'Concursos Públicos']

  return (
    <div className="flex flex-col">
      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Preview card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Episódio personalizado para {profile.name?.split(' ')[0] ?? 'você'}
              </p>
              <p className="text-xs text-zinc-500">
                ~5 minutos · Narrado em PT-BR
              </p>
            </div>
          </div>

          {/* Topics */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
              Conteúdo do episódio
            </p>
            <div className="space-y-2">
              {topics.map((topic, i) => {
                const gap = gaps[i]
                return (
                  <div
                    key={topic}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400 w-4">{i + 1}.</span>
                      <span className="text-sm font-medium text-zinc-800">{topic}</span>
                    </div>
                    {gap && gap.count > 0 && (
                      <span className="text-xs text-red-500 font-medium">
                        {Math.round(gap.accuracy)}% acerto
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Process steps */}
          <div className="border-t border-zinc-100 pt-4 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: 'Script com GPT-4o', sub: '~15s' },
              { icon: Mic, label: 'Narração ElevenLabs', sub: '~30s' },
              { icon: Clock, label: 'Pronto para ouvir', sub: '~45s total' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto mb-1.5">
                  <Icon className="h-4 w-4 text-zinc-500" />
                </div>
                <p className="text-[11px] font-medium text-zinc-700">{label}</p>
                <p className="text-[10px] text-zinc-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex flex-col items-center gap-3">
          <GenerateButton />
          <p className="text-xs text-zinc-400 text-center">
            O podcast é gerado em background — você será redirecionado para o player
            e pode acompanhar o progresso em tempo real.
          </p>
        </div>
      </main>
    </div>
  )
}
