import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { MessageSquare, Mic, TrendingUp, Award, Clock } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { cefisGetMe, cefisGetCertificates } from '@/lib/cefis/client'
import { buildDomainMap, getStudyPlan } from '@/lib/diagnosis'
import { DomainMap } from '@/components/dashboard/DomainMap'
import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard'

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
    supabase
      .from('student_profiles')
      .update({ domain_map: domainMap })
      .eq('cefis_user_id', userId),
  ])

  const totalCerts = certificates.length
  const avgAccuracy =
    totalCerts > 0
      ? Math.round(certificates.reduce((s, c) => s + c.accuracy, 0) / totalCerts)
      : 0
  const gapCount = Object.values(domainMap).filter(d => d.gap).length

  return (
    <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome + quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            Olá, {firstName} 👋
          </h1>
          {profile?.objective && (
            <p className="text-sm text-zinc-500 mt-1">{profile.objective}</p>
          )}
        </div>

        {/* Quick actions — primary CTAs */}
        <div className="flex gap-2 shrink-0">
          <a
            href="/chat"
            className="flex items-center gap-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl px-4 py-2.5 transition-all shadow-sm"
          >
            <MessageSquare className="h-4 w-4" />
            Chat de Dúvidas
          </a>
          <a
            href="/podcast/generate"
            className="flex items-center gap-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-700 rounded-xl px-4 py-2.5 transition-all shadow-sm"
          >
            <Mic className="h-4 w-4" />
            Gerar Podcast
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-zinc-900">{totalCerts}</p>
            <p className="text-xs text-zinc-500">Certificados</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-zinc-900">{avgAccuracy}%</p>
            <p className="text-xs text-zinc-500">Acerto médio</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-amber-600" />
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
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Mapa de Domínio</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {totalCerts} certificado{totalCerts !== 1 ? 's' : ''} analisado{totalCerts !== 1 ? 's' : ''}
              {gapCount > 0 && ` · ${gapCount} lacuna${gapCount !== 1 ? 's' : ''} identificada${gapCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[10px] text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />≥80%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />60–79%</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />&lt;60%</span>
          </div>
        </div>
        <DomainMap domainMap={domainMap} />

        {totalCerts === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
            <Award className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">
              Complete cursos na CEFIS para ver seu mapa de domínio
            </p>
          </div>
        )}
      </section>

      {/* Study Plan */}
      {studyPlan.length > 0 && (
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-zinc-900">Plano de Estudo Personalizado</h2>
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
    </main>
  )
}
