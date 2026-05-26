'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DomainMap } from '@/types/domain'

interface DomainMapProps { domainMap: DomainMap }

interface Colors {
  border: string
  bg: string
  bar: string
  badge: string
  badgeBg: string
  value: string
}

function getColors(accuracy: number, count: number): Colors {
  if (count === 0) return {
    border: 'rgba(255,255,255,0.06)',
    bg: 'rgba(255,255,255,0.02)',
    bar: 'rgba(255,255,255,0.15)',
    badge: 'rgba(245,240,235,0.3)',
    badgeBg: 'rgba(255,255,255,0.05)',
    value: 'rgba(245,240,235,0.25)',
  }
  if (accuracy >= 80) return {
    border: 'rgba(74,222,128,0.2)',
    bg: 'rgba(74,222,128,0.06)',
    bar: '#4ade80',
    badge: '#4ade80',
    badgeBg: 'rgba(74,222,128,0.1)',
    value: '#4ade80',
  }
  if (accuracy >= 60) return {
    border: 'rgba(251,191,36,0.2)',
    bg: 'rgba(251,191,36,0.06)',
    bar: '#fbbf24',
    badge: '#fbbf24',
    badgeBg: 'rgba(251,191,36,0.1)',
    value: '#fbbf24',
  }
  return {
    border: 'rgba(224,107,73,0.25)',
    bg: 'rgba(224,107,73,0.07)',
    bar: '#e06b49',
    badge: '#e06b49',
    badgeBg: 'rgba(224,107,73,0.12)',
    value: '#e06b49',
  }
}

function statusLabel(accuracy: number, count: number) {
  if (count === 0) return 'Sem dados'
  if (accuracy >= 80) return 'Dominado'
  if (accuracy >= 60) return 'Parcial'
  return 'Lacuna'
}

export function DomainMap({ domainMap }: DomainMapProps) {
  const entries = Object.entries(domainMap).sort(([, a], [, b]) => a.accuracy - b.accuracy)

  if (entries.length === 0) return null

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5"
    >
      {entries.map(([category, data]) => {
        const c = getColors(data.accuracy, data.count)
        return (
          <motion.div
            key={category}
            variants={{
              initial: { opacity: 0, y: 10 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
            }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rounded-2xl p-4 flex flex-col gap-3 cursor-default"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium leading-tight" style={{ color: 'rgba(245,240,235,0.75)' }}>
                {category}
              </p>
              <span
                className="shrink-0 text-[9px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5 whitespace-nowrap"
                style={{ color: c.badge, background: c.badgeBg }}
              >
                {statusLabel(data.accuracy, data.count)}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <span className="text-2xl font-semibold tabular-nums leading-none" style={{ color: c.value }}>
                {data.count === 0 ? '—' : `${Math.round(data.accuracy)}%`}
              </span>
              <span className="text-[9px] tabular-nums" style={{ color: 'rgba(245,240,235,0.3)' }}>
                {data.count} cert{data.count !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: c.bar }}
                initial={{ width: 0 }}
                animate={{ width: `${data.count === 0 ? 0 : data.accuracy}%` }}
                transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
              />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
