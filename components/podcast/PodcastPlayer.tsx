'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PodcastPlayerProps {
  url: string
  title: string
}

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
        waveColor: '#d4d4d8',
        progressColor: '#18181b',
        url,
        height: 72,
        barWidth: 2,
        barGap: 2,
        barRadius: 4,
        normalize: true,
        interact: true,
      })

      ws.on('ready', () => {
        setDuration(ws.getDuration())
        setIsReady(true)
      })
      ws.on('play', () => setIsPlaying(true))
      ws.on('pause', () => setIsPlaying(false))
      ws.on('finish', () => setIsPlaying(false))
      ws.on('timeupdate', (t: number) => setCurrentTime(t))

      wsRef.current = ws
    })

    return () => {
      wsRef.current?.destroy()
      wsRef.current = null
    }
  }, [url])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900 px-6 py-5">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-1">
          CEFIS Tutor · Podcast Personalizado
        </p>
        <p className="text-white font-semibold text-sm leading-snug">{title}</p>
      </div>

      {/* Controls + Waveform */}
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center gap-4">
          {/* Play/Pause */}
          <button
            onClick={() => wsRef.current?.playPause()}
            disabled={!isReady}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all',
              isReady
                ? 'bg-zinc-900 hover:bg-zinc-700 active:scale-95'
                : 'bg-zinc-200 cursor-not-allowed',
            )}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white" />
            ) : (
              <Play className="h-5 w-5 text-white ml-0.5" />
            )}
          </button>

          {/* Time */}
          <div className="text-xs text-zinc-500 font-mono w-20 shrink-0">
            {formatTime(currentTime)}
            <span className="text-zinc-300 mx-1">/</span>
            {formatTime(duration)}
          </div>

          {/* Restart */}
          <button
            onClick={() => wsRef.current?.seekTo(0)}
            disabled={!isReady}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="flex-1" />

          {/* Download */}
          <a
            href={url}
            download={`${title}.mp3`}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            title="Baixar MP3"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Waveform */}
        <div className="relative">
          <div
            ref={containerRef}
            className={cn('w-full cursor-pointer', !isReady && 'hidden')}
          />
          {!isReady && (
            <div className="h-[72px] rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center gap-1.5">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[2px] bg-zinc-200 rounded-full animate-pulse"
                  style={{
                    height: `${Math.sin(i * 0.4) * 20 + 24}px`,
                    animationDelay: `${(i % 5) * 100}ms`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
