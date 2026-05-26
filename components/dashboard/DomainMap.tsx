'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DomainMap } from '@/types/domain'

interface DomainMapProps { domainMap: DomainMap }

function getColors(accuracy: number, count: number) {
  if (count === 0) return {
    border: 'border-white/[0.07]',
    bg: 'bg-white/[0.03]',
    bar: 'bg-white/20',
    badge: 'text-white/30 bg-white/5',
    label: 'text-white/30',
    value: 'text-white/25',
  }
  if (accuracy >= 80) return {
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/[0.06]',
    bar: 'bg-emerald-400',
    badge: 'text-emerald-400 bg-emerald-500/10',
    label: 'text-emerald-400/70',
    value: 'text-emerald-300',
  }
  if (accuracy >= 60) return {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/[0.06]',
    bar: 'bg-amber-400',
    badge: 'text-amber-400 bg-amber-500/10',
    label: 'text-amber-400/70',
    value: 'text-amber-300',
  }
  return {
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/[0.06]',
    bar: 'bg-rose-400',
    badge: 'text-rose-400 bg-rose-500/10',
    label: 'text-rose-400/70',
    value: 'text-rose-300',
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

  if (entries.length === 0) {
    return (
      <p className="text-sm text-white/30 py-6">
        Nenhum certificado encontrado. Complete cursos na CEFIS para ver seu mapa.
      </p>
    )
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5"
    >
      {entries.map(([category, data]) => {
        const c = getColors(data.accuracy, data.count)
        return (
          <motion.div
            key={category}
            variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } } }}
            className={cn('rounded-xl border p-4 flex flex-col gap-3 transition-all hover:scale-[1.02] duration-200', c.border, c.bg)}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-medium text-white/70 leading-tight">{category}</p>
              <span className={cn('shrink-0 text-[9px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5', c.badge)}>
                {statusLabel(data.accuracy, data.count)}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <span className={cn('text-2xl font-bold leading-none tabular-nums', c.value)}>
                {data.count === 0 ? '—' : `${Math.round(data.accuracy)}%`}
              </span>
              <span className="text-[9px] text-white/25 tabular-nums">
                {data.count} cert{data.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', c.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${data.count === 0 ? 0 : data.accuracy}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay: 0.2 }}
              />
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
