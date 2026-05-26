'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'
import { cn } from '@/lib/utils'

interface ChatMessageProps { message: UIMessage }

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const text = message.parts.filter(isTextUIPart).map(p => p.text).join('')
  if (!text) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      {isUser ? (
        <div
          className="max-w-[72%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed text-white"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}
        >
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      ) : (
        <div className="max-w-[85%]">
          <div className="glass rounded-2xl rounded-bl-sm px-4 py-3.5">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="text-sm leading-[1.7] text-white/85 mb-2 last:mb-0">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-white/70">{children}</em>
                ),
                ul: ({ children }) => (
                  <ul className="text-sm text-white/75 space-y-1 mb-2 list-none pl-0">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-sm text-white/75 space-y-1 mb-2 list-decimal list-inside">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex gap-2 leading-relaxed">
                    <span className="text-indigo-400 mt-1.5 shrink-0">·</span>
                    <span>{children}</span>
                  </li>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-semibold text-white mt-4 mb-1.5">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-medium text-white/90 mt-3 mb-1">{children}</h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-indigo-500/40 pl-3 my-2 text-sm text-white/55 italic bg-indigo-500/5 py-1 rounded-r-lg">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const block = className?.includes('language-')
                  return block ? (
                    <pre className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3 text-xs overflow-x-auto my-2 font-mono text-white/70">
                      <code>{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-white/8 text-indigo-300 rounded px-1.5 py-0.5 text-[11px] font-mono">
                      {children}
                    </code>
                  )
                },
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start"
    >
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3.5 flex items-center gap-1.5 h-11">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-indigo-400/60"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  )
}
