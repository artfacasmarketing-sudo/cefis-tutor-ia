import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { MessageSquare, Mic, TrendingUp, Award, Clock, Zap } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { cefisGetMe, cefisGetCertificates } from '@/lib/cefis/client'
import { buildDomainMap, getStudyPlan } from '@/lib/diagnosis'
import { DomainMap } from '@/components/dashboard/DomainMap'
import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard'
import { Stagger, FadeUp, SlideUp } from '@/components/ui/animated'

export const metadata = { title: 'Dashboard — CEFIS Tutor' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const key = cookieStore.get('cefis_key')?.value
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!key || !userId) redirect('/login')

  const supabase = createSupabaseAdmin()

  const [{ data: profile }, user, certificates] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('id, name, objective, learning_style, onboarding_completed, available_hours_week')
      .eq('cefis_user_id', userId)
      .single(),
    cefisGetMe(key).catch(() => null),
    cefisGetCertificates(key).catch(() => []),
  ])

  if (!profile?.onboarding_completed) redirect('/onboarding')

  const displayName = profile?.name ?? user?.name ?? 'Aluno'
  const firstName = displayName.split(' ')[0]
  const domainMap = buildDomainMap(certificates)

  const [studyPlan] = await Promise.all([
    getStudyPlan(key, domainMap),
    supabase.from('student_profiles').update({ domain_map: domainMap }).eq('cefis_user_id', userId),
  ])

  const totalCerts = certificates.length
  const avgAccuracy = totalCerts > 0
    ? Math.round(certificates.reduce((s, c) => s + c.accuracy, 0) / totalCerts)
    : 0
  const gapCount = Object.values(domainMap).filter(d => d.gap).length

  const stats = [
    { icon: Award, label: 'Certificados', value: String(totalCerts), color: 'emerald' },
    { icon: TrendingUp, label: 'Acerto médio', value: `${avgAccuracy}%`, color: 'indigo' },
    { icon: Clock, label: 'Horas / semana', value: profile?.available_hours_week ? `${profile.available_hours_week}h` : '—', color: 'amber' },
  ]

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 space-y-10">

      {/* Welcome + CTAs */}
      <SlideUp delay={0.05}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-white/35 mb-1">
              Painel do estudante
            </p>
            <h1 className="text-2xl font-semibold text-gradient tracking-tight">
              Olá, {firstName}
            </h1>
            {profile?.objective && (
              <p className="mt-1.5 text-sm text-white/45">{profile.objective}</p>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <a
              href="/chat"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat de Dúvidas</span>
            </a>
            <a
              href="/podcast/generate"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 cursor-pointer"
              style={{ boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}
            >
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Gerar Podcast</span>
            </a>
          </div>
        </div>
      </SlideUp>

      {/* Stats bento */}
      <Stagger className="grid grid-cols-3 gap-3" delay={0.1}>
        {stats.map(({ icon: Icon, label, value, color }) => (
          <FadeUp key={label}>
            <div className="glass rounded-2xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' :
                color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-white tabular-nums">{value}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{label}</p>
              </div>
            </div>
          </FadeUp>
        ))}
      </Stagger>

      {/* Domain Map */}
      <SlideUp delay={0.2}>
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white/80">Mapa de Domínio</h2>
              <p className="text-[11px] text-white/35 mt-0.5">
                {totalCerts} certificado{totalCerts !== 1 ? 's' : ''} analisado{totalCerts !== 1 ? 's' : ''}
                {gapCount > 0 && ` · ${gapCount} lacuna${gapCount !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-[10px] text-white/30">
              {[['emerald', '≥80%'], ['amber', '60–79%'], ['rose', '<60%']].map(([c, label]) => (
                <span key={c} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full bg-${c}-400`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          {totalCerts === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <Zap className="h-8 w-8 text-white/15 mx-auto mb-3" />
              <p className="text-sm text-white/40">Complete cursos na CEFIS para ver seu mapa</p>
            </div>
          ) : (
            <DomainMap domainMap={domainMap} />
          )}
        </section>
      </SlideUp>

      {/* Study Plan */}
      {studyPlan.length > 0 && (
        <SlideUp delay={0.3}>
          <section>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white/80">Plano de Estudo</h2>
              <p className="text-[11px] text-white/35 mt-0.5">
                Cursos recomendados pelas suas lacunas — clique para acessar na CEFIS
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {studyPlan.map((item, i) => (
                <StudyPlanCard key={item.id} item={item} rank={i + 1} />
              ))}
            </div>
          </section>
        </SlideUp>
      )}
    </main>
  )
}
