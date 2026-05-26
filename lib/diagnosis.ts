import type { CefisCertificate } from '@/lib/cefis/types'
import type { DomainMap, StudyItem } from '@/types/domain'
import { cefisGetCourses } from '@/lib/cefis/client'

// Order matters: more specific patterns first
const CATEGORIES: [string, RegExp][] = [
  ['Direito Constitucional', /constitucional|constituição|direitos fundamentais|controle de constitucionalidade/i],
  ['Direito Administrativo', /administrativo|administração pública|licitação|atos administrativos|poderes da administração/i],
  ['Direito Penal', /penal|crime\b|criminologia|legislação penal|código penal/i],
  ['Direito Civil', /\bcivil\b|família|obrigações|responsabilidade civil|código civil/i],
  ['Direito Processual', /processual|processo (civil|penal)|cpc\b|cpp\b|procedimento (judicial|penal)/i],
  ['Direito Tributário', /tributário|tribut|fiscal\b|imposto|contribuição previdenciária/i],
  ['Contabilidade', /contabilidade|contábil|balanço|patrimônio|ativo\b|passivo\b|débito e crédito/i],
  ['Português', /português|língua portuguesa|gramática|redação|ortografia|interpretação de texto/i],
  ['Raciocínio Lógico', /raciocínio lógico|lógica\b|matemática|estatística|probabilidade/i],
  ['Informática', /informática|computação|tecnologia da informação|excel|word\b|sistemas operacionais/i],
  ['Gestão Pública', /gestão pública|gestão de pessoas|gestão de processos|planejamento estratégico|qualidade/i],
  ['Legislação Específica', /lei\b.*\d|decreto|resolução|estatuto|regimento/i],
]

export function detectCategory(title: string): string {
  for (const [category, pattern] of CATEGORIES) {
    if (pattern.test(title)) return category
  }
  return 'Outros'
}

export function buildDomainMap(certificates: CefisCertificate[]): DomainMap {
  const map: DomainMap = {}

  for (const cert of certificates) {
    const cat = detectCategory(cert.course_title)
    if (!map[cat]) {
      map[cat] = { accuracy: 0, count: 0, gap: false, courses: [] }
    }
    const entry = map[cat]!
    entry.courses.push(cert.course_title)
    // incremental mean
    entry.accuracy =
      (entry.accuracy * entry.count + cert.accuracy) / (entry.count + 1)
    entry.count++
  }

  for (const entry of Object.values(map)) {
    entry.accuracy = Math.round(entry.accuracy * 10) / 10
    entry.gap = entry.accuracy < 70
  }

  return map
}

interface GapCategory {
  name: string
  accuracy: number
}

export async function getStudyPlan(
  key: string,
  domainMap: DomainMap,
): Promise<StudyItem[]> {
  // Sort gaps by severity: no cert first, then lowest accuracy
  const gaps: GapCategory[] = Object.entries(domainMap)
    .filter(([, v]) => v.gap)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, 4)
    .map(([name, v]) => ({ name, accuracy: v.accuracy }))

  if (gaps.length === 0) {
    // No gaps: recommend advanced topics from any category
    gaps.push({ name: '', accuracy: 100 })
  }

  // Search CEFIS courses for each gap in parallel
  const results = await Promise.all(
    gaps.map(async (gap) => {
      try {
        const res = await cefisGetCourses(key, {
          search: gap.name || 'concurso público',
          count: 3,
        })
        return { gap, courses: res.data.slice(0, 3) }
      } catch {
        return { gap, courses: [] }
      }
    }),
  )

  const seen = new Set<number>()
  const items: StudyItem[] = []

  for (const { gap, courses } of results) {
    for (const course of courses) {
      if (seen.has(course.id)) continue
      seen.add(course.id)
      items.push({
        id: course.id,
        title: course.title,
        category: gap.name || detectCategory(course.title),
        priority: gap.accuracy < 60 ? 'high' : 'medium',
        url: `https://cefis.com.br/cursos/${course.slug ?? course.id}`,
        thumbnail: course.thumbnail ?? null,
        lessonsCount: course.lessons_count,
        gapAccuracy: gap.accuracy,
      })
    }
  }

  return items
}
