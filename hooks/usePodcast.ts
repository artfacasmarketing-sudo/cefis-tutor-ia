'use client'

import { useState, useEffect, useRef } from 'react'

type PodcastStatus = 'generating' | 'ready' | 'error'

export interface PodcastState {
  status: PodcastStatus
  url: string | null
  title: string | null
  script: string | null
  topics: string[]
  error: string | null
}

export function usePodcast(audioId: string | null) {
  const [state, setState] = useState<PodcastState>({
    status: 'generating',
    url: null,
    title: null,
    script: null,
    topics: [],
    error: null,
  })
  const settled = useRef(false)

  useEffect(() => {
    if (!audioId || settled.current) return

    async function poll() {
      try {
        const res = await fetch(`/api/podcast/${audioId}`)
        if (!res.ok) return
        const data = await res.json() as {
          status: PodcastStatus
          url: string | null
          title: string
          script: string
          topics: string[]
          error: string | null
        }

        setState({
          status: data.status,
          url: data.url,
          title: data.title,
          script: data.script,
          topics: data.topics,
          error: data.error,
        })

        if (data.status === 'ready' || data.status === 'error') {
          settled.current = true
          clearInterval(interval)
        }
      } catch {
        // Network error — keep polling
      }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [audioId])

  return state
}
