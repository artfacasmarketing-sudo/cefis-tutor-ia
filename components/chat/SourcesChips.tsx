'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'
import { SourcePreviewModal, type SourceChunk } from './SourcePreviewModal'

const T = (a: number) => `rgba(245,240,235,${a})`

function similarityColor(s: number) {
  if (s >= 0.85) return { text: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' }
  if (s >= 0.75) return { text: '#e06b49', bg: 'rgba(224,107,73,0.1)', border: 'rgba(224,107,73,0.2)' }
  return { text: T(0.4), bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.08)' }
}

interface SourcesChipsProps {
  sources: SourceChunk[]
}

export function SourcesChips({ sources }: SourcesChipsProps) {
  const [selected, setSelected] = useState<SourceChunk | null>(null)

  if (!sources || sources.length === 0) return null

  const top = sources.slice(0, 5)

  return (
    <>
      <div className="mt-3 pt-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen className="h-3 w-3 shrink-0" style={{ color: T(0.35) }} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: T(0.3) }}>
            Fontes CEFIS
          </span>
        </div>

        {/* Chips — scroll horizontal no mobile */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {top.map((source, i) => {
            const c = similarityColor(source.similarity)
            return (
              <motion.button
                key={source.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 12px rgba(224,107,73,0.15)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelected(source)}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium shrink-0 cursor-pointer transition-all"
                style={{ background: c.bg, border: `1px solid ${c.border}`, color: T(0.65) }}
              >
                <span className="truncate max-w-[120px]">{source.courseTitle}</span>
                <span
                  className="shrink-0 font-semibold rounded-full px-1.5 py-px text-[9px]"
                  style={{ background: c.bg, color: c.text }}
                >
                  {Math.round(source.similarity * 100)}%
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      <SourcePreviewModal source={selected} onClose={() => setSelected(null)} />
    </>
  )
}
