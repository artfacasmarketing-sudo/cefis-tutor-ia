'use client'

import { motion } from 'framer-motion'
import { ExternalLink, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react'
import type { StudyItem } from '@/types/domain'

interface StudyPlanCardProps { item: StudyItem; rank: number }

export function StudyPlanCard({ item, rank }: StudyPlanCardProps) {
  const high = item.priority === 'high'

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: rank * 0.05, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group flex items-start gap-4 rounded-2xl p-4 transition-all duration-200 cursor-pointer"
      style={{
        background: '#242424',
        border: high ? '1px solid rgba(224,107,73,0.2)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <div className="shrink-0 flex flex-col items-center gap-1.5">
        <span className="text-[10px] font-bold tabular-nums" style={{ color: 'rgba(245,240,235,0.25)' }}>
          #{rank}
        </span>
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="w-12 h-9 rounded-lg object-cover opacity-70 group-hover:opacity-90 transition-opacity"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <BookOpen className="h-3.5 w-3.5" style={{ color: 'rgba(245,240,235,0.2)' }} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-2">
          <p
            className="text-sm font-medium leading-snug flex-1 transition-colors"
            style={{ color: 'rgba(245,240,235,0.85)' }}
          >
            {item.title}
          </p>
          <ExternalLink
            className="h-3 w-3 shrink-0 mt-0.5 transition-colors"
            style={{ color: 'rgba(245,240,235,0.2)' }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5"
            style={high
              ? { color: '#e06b49', background: 'rgba(224,107,73,0.12)' }
              : { color: '#fbbf24', background: 'rgba(251,191,36,0.1)' }
            }
          >
            {high ? <AlertTriangle className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
            {high ? 'Alta prioridade' : 'Recomendado'}
          </span>
          <span className="text-[10px]" style={{ color: 'rgba(245,240,235,0.3)' }}>{item.category}</span>
          {item.lessonsCount > 0 && (
            <span className="text-[10px]" style={{ color: 'rgba(245,240,235,0.3)' }}>
              {item.lessonsCount} aulas
            </span>
          )}
        </div>

        {item.gapAccuracy > 0 && item.gapAccuracy < 100 && (
          <p className="text-[10px] mt-1.5" style={{ color: 'rgba(245,240,235,0.2)' }}>
            Seu acerto atual: {Math.round(item.gapAccuracy)}%
          </p>
        )}
      </div>
    </motion.a>
  )
}
