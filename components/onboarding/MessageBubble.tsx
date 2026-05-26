'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'

const T = 'rgba(245,240,235,'

interface MessageBubbleProps { message: UIMessage }

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const text = message.parts.filter(isTextUIPart).map(p => p.text).join('')
  if (text === '__init__') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {isUser ? (
        <div
          className="max-w-[72%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed"
          style={{ background: '#e06b49', color: '#f5f0eb', boxShadow: '0 0 16px rgba(224,107,73,0.2)' }}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      ) : (
        <div
          className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3.5"
          style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="text-sm leading-[1.75] mb-1.5 last:mb-0" style={{ color: `${T}0.82)` }}>{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold" style={{ color: '#f5f0eb' }}>{children}</strong>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      )}
    </motion.div>
  )
}
