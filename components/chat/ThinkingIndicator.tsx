'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PHASES = [
  { icon: '🔍', text: 'Buscando nas 18.344 aulas CEFIS...' },
  { icon: '📚', text: 'Analisando transcrições relevantes...' },
  { icon: '✍️', text: 'Escrevendo resposta personalizada...' },
] as const

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

export function ThinkingIndicator() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1500)
    const t2 = setTimeout(() => setPhase(2), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const { icon, text } = PHASES[phase]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
    >
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2.5"
        style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={`icon-${phase}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="text-sm leading-none"
          >
            {icon}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.span
            key={`text-${phase}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="text-xs whitespace-nowrap"
            style={{ color: 'rgba(245,240,235,0.5)' }}
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
