'use client'

import { motion } from 'framer-motion'

export function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
    >
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2"
        style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="block h-1.5 w-1.5 rounded-full"
              style={{ background: '#e06b49' }}
              animate={{ opacity: [0.3, 1, 0.3], scaleY: [1, 1.6, 1] }}
              transition={{ duration: 1, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 0.4, width: 'auto' }}
          transition={{ delay: 0.6, duration: 0.3 }}
          className="text-xs overflow-hidden whitespace-nowrap"
          style={{ color: 'rgba(245,240,235,0.4)' }}
        >
          Pensando…
        </motion.span>
      </div>
    </motion.div>
  )
}
