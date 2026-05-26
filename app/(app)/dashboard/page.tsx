import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Award } from 'lucide-react'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { cefisGetMe, cefisGetCertificates } from '@/lib/cefis/client'
import { buildDomainMap, getStudyPlan } from '@/lib/diagnosis'
import { DomainMap } from '@/components/dashboard/DomainMap'
import { StudyPlanCard } from '@/components/dashboard/StudyPlanCard'
import { SlideUp } from '@/components/ui/animated'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { StatsCards } from '@/components/dashboard/StatsCards'
import type { DomainMap as DomainMapType } from '@/types/domain'

export const metadata = { title: 'Dashboard — CEFIS Tutor' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const key = cookieStore.get('cefis_key')?.value
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!key || !userId) redirect('/login')

  const supabase = createSupabaseAdmin()

  // Include domain_map in profile select so we can use cached data
  const [{ data: profile }, user, certificates] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('id, name, objective, learning_style, onboarding_completed, available_hours_week, domain_map')
      .eq('cefis_user_id', userId)
      .single(),
    cefisGetMe(key).catch(() => null),
    cefisGetCertificates(key).catch(() => []),
  ])

  if (!profile?.onboarding_completed) redirect('/onboarding')

  const displayName = profile?.name ?? user?.name ?? 'Aluno'
  const firstName = displayName.split(' ')[0]

  // Domain map: prefer fresh build, fall back to cached from DB
  const cachedMap = (profile?.domain_map ?? {}) as DomainMapType
  const freshMap = certificates.length > 0 ? buildDomainMap(certificates) : null
  const freshHasData = freshMap !== null && Object.keys(freshMap).length > 0
  const domainMap: DomainMapType = freshHasData ? freshMap! : cachedMap

  const hasDomainData = Object.keys(domainMap).length > 0

  const [studyPlan] = await Promise.all([
    getStudyPlan(key, domainMap),
    // Persist only when fresh certs produced real data AND no cached data exists yet
    freshHasData && Object.keys(cachedMap).length === 0
      ? supabase.from('student_profiles').update({ domain_map: freshMap }).eq('cefis_user_id', userId)
      : Promise.resolve(null),
  ])

  // Stats: prefer live certs, fall back to domainMap aggregates
  const domainEntries = Object.values(domainMap)
  const totalCerts = certificates.length > 0
    ? certificates.length
    : domainEntries.reduce((s, c) => s + c.count, 0)
  const avgAccuracy = certificates.length > 0
    ? Math.round(certificates.reduce((s, c) => s + c.accuracy, 0) / certificates.length)
    : domainEntries.length > 0
      ? Math.round(domainEntries.reduce((s, c) => s + c.accuracy, 0) / domainEntries.length)
      : null
  const gapCount = domainEntries.filter(d => d.gap).length

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)]">

      {/* Dashboard header — client component (has event handlers) */}
      <DashboardHeader firstName={firstName} objective={profile?.objective} />

      {/* Content */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-10">

        {/* Stats with countUp animation */}
        <StatsCards
          totalCerts={totalCerts}
          avgAccuracy={avgAccuracy}
          hoursPerWeek={profile?.available_hours_week ?? null}
        />

        {/* Domain Map */}
        <SlideUp delay={0.15}>
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#f5f0eb]">Mapa de Domínio</h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(245,240,235,0.4)' }}>
                  {hasDomainData
                    ? `${totalCerts} certificado${totalCerts !== 1 ? 's' : ''} · ${gapCount} lacuna${gapCount !== 1 ? 's' : ''} identificada${gapCount !== 1 ? 's' : ''}`
                    : 'Complete cursos na CEFIS para ver seu mapa'
                  }
                </p>
              </div>
              {hasDomainData && (
                <div className="hidden sm:flex items-center gap-4 text-[10px]" style={{ color: 'rgba(245,240,235,0.3)' }}>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#4ade80]" />≥80%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#fbbf24]" />60–79%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#e06b49]" />&lt;60%</span>
                </div>
              )}
            </div>
            {hasDomainData ? (
              <DomainMap domainMap={domainMap} />
            ) : (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Award className="h-8 w-8 mx-auto mb-3" style={{ color: 'rgba(245,240,235,0.15)' }} />
                <p className="text-sm" style={{ color: 'rgba(245,240,235,0.4)' }}>
                  Complete cursos na CEFIS para ver seu mapa de domínio
                </p>
              </div>
            )}
          </section>
        </SlideUp>

        {/* Study Plan */}
        {studyPlan.length > 0 && (
          <SlideUp delay={0.25}>
            <section>
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[#f5f0eb]">Plano de Estudo</h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(245,240,235,0.4)' }}>
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
    </div>
  )
}
