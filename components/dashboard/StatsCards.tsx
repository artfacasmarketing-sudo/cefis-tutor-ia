'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Award, Clock } from 'lucide-react'

interface StatsDeps {
  totalCerts: number
  avgAccuracy: number | null
  hoursPerWeek: number | null
}

function useCountUp(target: number, duration = 900, delay = 0) {
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (target === 0) return
    const timeout = setTimeout(() => {
      const start = performance.now()
      function tick(now: number) {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(target * eased))
        if (progress < 1) raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf.current) }
  }, [target, duration, delay])

  return value
}

const T = (a: number) => `rgba(245,240,235,${a})`

export function StatsCards({ totalCerts, avgAccuracy, hoursPerWeek }: StatsDeps) {
  const certsCount = useCountUp(totalCerts, 800, 100)
  const accuracyCount = useCountUp(avgAccuracy ?? 0, 900, 250)

  const stats = [
    {
      icon: Award,
      label: 'Certificados',
      value: certsCount > 0 ? String(certsCount) : (totalCerts > 0 ? '...' : '0'),
      accent: '#4ade80',
      accentBg: 'rgba(74,222,128,0.1)',
    },
    {
      icon: TrendingUp,
      label: 'Acerto médio',
      value: avgAccuracy !== null
        ? (accuracyCount > 0 ? `${accuracyCount}%` : '...')
        : '—',
      accent: '#e06b49',
      accentBg: 'rgba(224,107,73,0.1)',
    },
    {
      icon: Clock,
      label: 'Horas / semana',
      value: hoursPerWeek ? `${hoursPerWeek}h` : '—',
      accent: '#fbbf24',
      accentBg: 'rgba(251,191,36,0.1)',
    },
  ]

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
      className="grid grid-cols-3 gap-3"
    >
      {stats.map(({ icon: Icon, label, value, accent, accentBg }) => (
        <motion.div
          key={label}
          variants={{
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
          }}
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: '#242424',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: accentBg, color: accent }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xl font-semibold tabular-nums" style={{ color: '#f5f0eb' }}>
              {value}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: T(0.4) }}>{label}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
