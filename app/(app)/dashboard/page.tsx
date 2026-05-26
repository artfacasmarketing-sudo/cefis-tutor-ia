import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { MessageSquare, Mic, TrendingUp, Award, Clock } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { cefisGetMe, cefisGetCertificates } from '@/lib/cefis/client'
import { buildDomainMap, getStudyPlan } from '@/lib/diagnosis'
import { DomainMap } from '@/components/dashboard/DomainMap'
import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard'

export const metadata = {
  title: 'Dashboard — CEFIS Tutor',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const key = cookieStore.get('cefis_key')?.value
  const userId = cookieStore.get('cefis_user_id')?.value

  if (!key || !userId) redirect('/login')

  const supabase = createSupabaseAdmin()

  // Load profile + fetch fresh CEFIS data in parallel
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

  // Build domain map from fresh certificates
  const domainMap = buildDomainMap(certificates)

  // Fetch study plan + persist domain_map in parallel
  const [studyPlan] = await Promise.all([
    getStudyPlan(key, domainMap),
    supabase
      .from('student_profiles')
      .update({ domain_map: domainMap })
      .eq('cefis_user_id', userId),
  ])

  // Stats
  const totalCerts = certificates.length
  const avgAccuracy =
    totalCerts > 0
      ? Math.round(certificates.reduce((s, c) => s + c.accuracy, 0) / totalCerts)
      : 0
  const gapCount = Object.values(domainMap).filter(d => d.gap).length

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Olá, {displayName.split(' ')[0]}
              </p>
              {profile?.objective && (
                <p className="text-xs text-zinc-500 truncate max-w-xs">
                  {profile.objective}
                </p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <a
              href="/chat"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg px-3 py-2 transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Chat de Dúvidas
            </a>
            <a
              href="/podcast"
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-700 rounded-lg px-3 py-2 transition-colors"
            >
              <Mic className="h-3.5 w-3.5" />
              Gerar Podcast
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <Award className="h-4.5 w-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900">{totalCerts}</p>
              <p className="text-xs text-zinc-500">Certificados</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900">{avgAccuracy}%</p>
              <p className="text-xs text-zinc-500">Acerto médio</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
              <Clock className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-zinc-900">
                {profile?.available_hours_week ?? '—'}h
              </p>
              <p className="text-xs text-zinc-500">Por semana</p>
            </div>
          </div>
        </div>

        {/* Domain Map */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Mapa de Domínio
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Baseado nos seus {totalCerts} certificados CEFIS
                {gapCount > 0 && ` · ${gapCount} área${gapCount !== 1 ? 's' : ''} com lacuna`}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> ≥80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> 60–79%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" /> &lt;60%
              </span>
            </div>
          </div>
          <DomainMap domainMap={domainMap} />
        </section>

        {/* Study Plan */}
        {studyPlan.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-zinc-900">
                Plano de Estudo Personalizado
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Cursos recomendados com base nas suas lacunas — clique para acessar na CEFIS
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {studyPlan.map((item, i) => (
                <StudyPlanCard key={item.id} item={item} rank={i + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {totalCerts === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <Award className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-700">
              Nenhum certificado ainda
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Complete cursos na CEFIS para ver seu mapa de domínio e plano de estudo
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
