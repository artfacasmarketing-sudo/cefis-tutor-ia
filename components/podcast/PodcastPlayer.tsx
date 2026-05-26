'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PodcastPlayerProps { url: string; title: string }

export function PodcastPlayer({ url, title }: PodcastPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wsRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      if (!containerRef.current) return
      const ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: 'rgba(99,102,241,0.35)',
        progressColor: 'rgba(129,140,248,0.9)',
        cursorColor: 'rgba(99,102,241,0.8)',
        url,
        height: 80,
        barWidth: 2,
        barGap: 2,
        barRadius: 10,
        normalize: true,
        interact: true,
        backend: 'WebAudio',
      })
      ws.on('ready', () => { setDuration(ws.getDuration()); setIsReady(true) })
      ws.on('play', () => setIsPlaying(true))
      ws.on('pause', () => setIsPlaying(false))
      ws.on('finish', () => setIsPlaying(false))
      ws.on('timeupdate', (t: number) => setCurrentTime(t))
      wsRef.current = ws
    })
    return () => { wsRef.current?.destroy(); wsRef.current = null }
  }, [url])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 0 60px rgba(99,102,241,0.12), 0 0 120px rgba(99,102,241,0.05)' }}
    >
      {/* Hero header */}
      <div
        className="px-6 py-7 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)' }}
      >
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.4) 0%, transparent 60%)'
        }} />
        <div className="relative z-10">
          <p className="text-[10px] font-semibold text-indigo-300/60 uppercase tracking-widest mb-2">
            CEFIS Tutor · Podcast personalizado
          </p>
          <p className="text-white font-semibold text-base leading-snug max-w-sm">{title}</p>
        </div>
      </div>

      {/* Controls + Waveform */}
      <div className="bg-[#0f0e27] px-6 py-5 space-y-5">
        {/* Progress bar */}
        <div className="h-0.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-indigo-400"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Play */}
          <motion.button
            onClick={() => wsRef.current?.playPause()}
            disabled={!isReady}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all',
              isReady ? 'bg-indigo-600 hover:bg-indigo-500 cursor-pointer' : 'bg-white/10 cursor-not-allowed',
            )}
            style={isReady ? { boxShadow: '0 0 20px rgba(99,102,241,0.4)' } : {}}
          >
            {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white ml-0.5" />}
          </motion.button>

          {/* Time */}
          <span className="text-xs font-mono text-white/40 w-24 shrink-0">
            {fmt(currentTime)} <span className="text-white/20">/</span> {fmt(duration)}
          </span>

          {/* Restart */}
          <button
            onClick={() => wsRef.current?.seekTo(0)}
            disabled={!isReady}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-all disabled:opacity-20 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="flex-1" />

          {/* Download */}
          <a
            href={url}
            download
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
            title="Baixar MP3"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Waveform */}
        <div className="relative min-h-[80px]">
          <div ref={containerRef} className={cn('w-full', !isReady && 'hidden')} />
          {!isReady && (
            <div className="h-20 flex items-center justify-center gap-[3px]">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-indigo-500/30"
                  animate={{ height: [`${Math.sin(i * 0.35) * 20 + 16}px`, `${Math.sin(i * 0.35 + 1) * 20 + 16}px`, `${Math.sin(i * 0.35) * 20 + 16}px`] }}
                  transition={{ duration: 1.8, delay: i * 0.025, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
