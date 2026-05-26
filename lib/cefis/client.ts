import type {
  CefisLoginResponse,
  CefisUser,
  CefisCoursesResponse,
  CefisCertificate,
  CefisLesson,
  CefisTrack,
} from './types'

const V1_BASE = 'https://cefis.com.br/api/v1'
const V3_BASE = 'https://api-v3.cefis.com.br'
const TIMEOUT_MS = 8_000
const MAX_RETRIES = 2

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timer)

    if (!res.ok && retries > 0 && res.status >= 500) {
      await new Promise<void>(r => setTimeout(r, 500))
      return fetchWithRetry(url, options, retries - 1)
    }

    return res
  } catch (err) {
    clearTimeout(timer)
    if (retries > 0 && (err as Error).name !== 'AbortError') {
      await new Promise<void>(r => setTimeout(r, 500))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw err
  }
}

export async function cefisLogin(
  email: string,
  password: string,
): Promise<CefisLoginResponse> {
  const res = await fetchWithRetry(`${V1_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pass: password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string }
    throw new Error(data.message ?? `Login falhou: ${res.status}`)
  }

  return res.json() as Promise<CefisLoginResponse>
}

export async function cefisGetMe(key: string): Promise<CefisUser> {
  const res = await fetchWithRetry(`${V1_BASE}/user/me`, {
    headers: { Authorization: key },
  })

  if (!res.ok) throw new Error(`Falha ao buscar usuário: ${res.status}`)

  const data = await res.json() as { data?: CefisUser } | CefisUser
  return ('data' in data && data.data ? data.data : data) as CefisUser
}

export async function cefisGetCourses(
  key: string,
  params?: { search?: string; categories?: string; page?: number; count?: number },
): Promise<CefisCoursesResponse> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.categories) qs.set('categories', params.categories)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.count) qs.set('count', String(params.count))

  const res = await fetchWithRetry(`${V3_BASE}/courses?${qs}`, {
    headers: { Authorization: `Bearer ${key}` },
  })

  if (!res.ok) throw new Error(`Falha ao buscar cursos: ${res.status}`)
  return res.json() as Promise<CefisCoursesResponse>
}

export async function cefisGetCourseLessons(
  key: string,
  courseId: number,
): Promise<CefisLesson[]> {
  const res = await fetchWithRetry(`${V3_BASE}/courses/${courseId}/lessons`, {
    headers: { Authorization: `Bearer ${key}` },
  })

  if (!res.ok) throw new Error(`Falha ao buscar aulas: ${res.status}`)
  const data = await res.json() as { data?: CefisLesson[] } | CefisLesson[]
  return (Array.isArray(data) ? data : data.data ?? []) as CefisLesson[]
}

export async function cefisGetCertificates(key: string): Promise<CefisCertificate[]> {
  const res = await fetchWithRetry(`${V3_BASE}/performance/certificates`, {
    headers: { Authorization: `Bearer ${key}` },
  })

  if (!res.ok) throw new Error(`Falha ao buscar certificados: ${res.status}`)
  const data = await res.json() as { data?: CefisCertificate[] } | CefisCertificate[]
  return (Array.isArray(data) ? data : data.data ?? []) as CefisCertificate[]
}

export async function cefisGetTracks(key: string): Promise<CefisTrack[]> {
  const res = await fetchWithRetry(`${V3_BASE}/tracks`, {
    headers: { Authorization: `Bearer ${key}` },
  })

  if (!res.ok) throw new Error(`Falha ao buscar trilhas: ${res.status}`)
  const data = await res.json() as { data?: CefisTrack[] } | CefisTrack[]
  return (Array.isArray(data) ? data : data.data ?? []) as CefisTrack[]
}
