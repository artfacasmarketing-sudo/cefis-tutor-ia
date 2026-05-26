export interface DomainCategory {
  accuracy: number  // 0–100 (0 = sem certificado)
  count: number     // nº de certificados nessa categoria
  gap: boolean      // true se accuracy < 70 ou count === 0
  courses: string[] // títulos dos cursos certificados
}

export type DomainMap = Record<string, DomainCategory>

export interface StudyItem {
  id: number
  title: string
  category: string
  priority: 'high' | 'medium'
  url: string
  thumbnail: string | null
  lessonsCount: number
  gapAccuracy: number // accuracy do gap que originou esta recomendação
}
