'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Play, Pause, Loader2, ExternalLink } from 'lucide-react'

type Status = 'generating' | 'ready' | 'error'

interface State { status: Status; url: string | null; error: string | null }

function useAudioStatus(audioId: string) {
  const [state, setState] = useState<State>({ status: 'generating', url: null, error: null })
  const settled = useRef(false)

  useEffect(() => {
    if (settled.current) return

    async function poll() {
      try {
        const res = await fetch(`/api/audio/status/${audioId}`)
        const data = await res.json() as { status: Status; url: string | null; error: string | null }
        setState(data)
        if (data.status === 'ready' || data.status === 'error') {
          settled.current = true
          clearInterval(interval)
        }
      } catch { /* retry next tick */ }
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [audioId])

  return state
}

function MiniPlayer({ url, topico }: { url: string; topico: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsRef = useRef<any>(null)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      if (!containerRef.current) return
      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: 'rgba(224,107,73,0.35)',
        progressColor: '#e06b49',
        height: 36,
        barWidth: 2,
        barGap: 2,
        barRadius: 4,
        normalize: true,
        url,
      })
      ws.on('ready', () => { setDuration(ws.getDuration()); setReady(true) })
      ws.on('play', () => setPlaying(true))
      ws.on('pause', () => setPlaying(false))
      ws.on('finish', () => setPlaying(false))
      ws.on('timeupdate', (t: number) => setCurrent(t))
      wsRef.current = ws
    })
    return () => { wsRef.current?.destroy(); wsRef.current = null }
  }, [url])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <motion.button
          onClick={() => wsRef.current?.playPause()}
          disabled={!ready}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
          style={{ background: '#e06b49', boxShadow: ready ? '0 0 14px rgba(224,107,73,0.35)' : 'none' }}
        >
          {playing
            ? <Pause className="h-4 w-4 text-white" />
            : <Play className="h-4 w-4 text-white ml-0.5" />}
        </motion.button>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'rgba(245,240,235,0.85)' }}>
            {topico}
          </p>
          <p className="text-[10px]" style={{ color: 'rgba(245,240,235,0.35)' }}>
            {fmt(current)} / {fmt(duration)}
          </p>
        </div>

        <a
          href={url}
          download
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
          style={{ color: 'rgba(245,240,235,0.3)' }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div ref={containerRef} className={ready ? 'block' : 'hidden'} />
      {!ready && (
        <div className="h-9 rounded-lg flex items-center justify-center gap-1"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-0.5 rounded-full"
              style={{ background: 'rgba(224,107,73,0.4)' }}
              animate={{ height: [`${Math.sin(i * 0.6) * 8 + 10}px`, `${Math.sin(i * 0.6 + 1) * 8 + 10}px`] }}
              transition={{ duration: 1.2, delay: i * 0.04, repeat: Infinity, repeatType: 'reverse' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface PodcastInlineCardProps {
  audioId: string
  topico: string
  mensagem: string
}

export function PodcastInlineCard({ audioId, topico, mensagem }: PodcastInlineCardProps) {
  const { status, url } = useAudioStatus(audioId)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl rounded-bl-sm overflow-hidden"
      style={{
        background: '#242424',
        border: '1px solid rgba(224,107,73,0.2)',
        borderLeft: '3px solid #e06b49',
        maxWidth: '85%',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(224,107,73,0.12)' }}>
          <Mic className="h-3.5 w-3.5" style={{ color: '#e06b49' }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#e06b49' }}>
          Podcast
        </span>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          {status === 'generating' && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" style={{ color: '#e06b49' }} />
              <p className="text-xs" style={{ color: 'rgba(245,240,235,0.6)' }}>{mensagem}</p>
            </motion.div>
          )}

          {status === 'ready' && url && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <MiniPlayer url={url} topico={topico} />
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs" style={{ color: 'rgba(224,107,73,0.7)' }}>
                Não consegui gerar o podcast. Tente novamente.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
