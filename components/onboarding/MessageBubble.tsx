'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'
import { cn } from '@/lib/utils'

interface MessageBubbleProps { message: UIMessage }

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const text = message.parts.filter(isTextUIPart).map(p => p.text).join('')

  if (text === '__init__') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      {isUser ? (
        <div
          className="max-w-[72%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 0 15px rgba(99,102,241,0.2)' }}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      ) : (
        <div className="max-w-[85%] glass rounded-2xl rounded-bl-sm px-4 py-3.5">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="text-sm leading-[1.7] text-white/80 mb-1.5 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      )}
    </motion.div>
  )
}
