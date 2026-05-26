export interface CefisLoginResponse {
  data: {
    key: string
    user: CefisUser
  }
}

export interface CefisUser {
  id: number
  name: string
  email: string
  occupation: string | null
  activities: string | null
  city: string | null
  state: string | null
  nivel: string | null
  is_premium: boolean
  avatar?: string | null
}

export interface CefisCourse {
  id: number
  title: string
  slug: string
  description: string | null
  thumbnail: string | null
  categories: string[]
  lessons_count: number
  duration: number | null
}

export interface CefisCoursesResponse {
  data: CefisCourse[]
  meta: {
    total: number
    page: number
    count: number
  }
}

export interface CefisStreamSource {
  url: string
  type: string
}

export interface CefisLesson {
  id: number
  title: string
  course_id: number
  description: string | null
  duration: number | null
  stream_sources: CefisStreamSource[]
  progress?: number | null
}

export interface CefisCertificate {
  id: number
  course_id: number
  course_title: string
  accuracy: number
  issued_at: string
  categories?: string[]
}

export interface CefisTrack {
  id: number
  title: string
  description: string | null
  courses: CefisCourse[]
}
