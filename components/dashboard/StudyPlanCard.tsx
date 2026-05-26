'use client'

import { motion } from 'framer-motion'
import { ExternalLink, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react'
import type { StudyItem } from '@/types/domain'
import { cn } from '@/lib/utils'

interface StudyPlanCardProps { item: StudyItem; rank: number }

export function StudyPlanCard({ item, rank }: StudyPlanCardProps) {
  const high = item.priority === 'high'

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: rank * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn(
        'group flex items-start gap-4 rounded-xl border p-4 transition-all duration-200 cursor-pointer',
        high
          ? 'border-rose-500/15 bg-rose-500/[0.04] hover:border-rose-500/30 hover:bg-rose-500/[0.07]'
          : 'border-white/[0.07] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]',
      )}
    >
      <div className="shrink-0 flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-bold text-white/25 tabular-nums">#{rank}</span>
        {item.thumbnail ? (
          <img src={item.thumbnail} alt="" className="w-12 h-9 rounded-lg object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />
        ) : (
          <div className="w-12 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <BookOpen className="h-3.5 w-3.5 text-white/20" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-2">
          <p className="text-sm font-medium text-white/85 leading-snug flex-1 group-hover:text-white transition-colors">
            {item.title}
          </p>
          <ExternalLink className="h-3 w-3 text-white/20 shrink-0 mt-0.5 group-hover:text-white/50 transition-colors" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5',
            high ? 'text-rose-400 bg-rose-500/10' : 'text-amber-400 bg-amber-500/10',
          )}>
            {high ? <AlertTriangle className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
            {high ? 'Prioridade alta' : 'Recomendado'}
          </span>
          <span className="text-[10px] text-white/25">{item.category}</span>
          {item.lessonsCount > 0 && (
            <span className="text-[10px] text-white/25">{item.lessonsCount} aulas</span>
          )}
        </div>
        {item.gapAccuracy > 0 && item.gapAccuracy < 100 && (
          <p className="text-[10px] text-white/20 mt-1.5">
            Seu acerto atual: {Math.round(item.gapAccuracy)}%
          </p>
        )}
      </div>
    </motion.a>
  )
}
