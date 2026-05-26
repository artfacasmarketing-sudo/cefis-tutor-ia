'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'
import { FlashModeCard } from './FlashModeCard'
import { PodcastInlineCard } from './PodcastInlineCard'
import { SourcesChips } from './SourcesChips'
import type { SourceChunk } from './SourcePreviewModal'

const T = (a: number) => `rgba(245,240,235,${a})`

interface ChatMessageProps { message: UIMessage }

interface PodcastToolOutput {
  audioId: string | null
  topico: string
  mensagem: string
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const text = message.parts.filter(isTextUIPart).map(p => p.text).join('')

  // Detect podcast tool result (type is "tool-gerar_podcast", state is "output-available")
  const podcastPart = message.parts.find(p => {
    const part = p as { type: string; state?: string }
    return part.type === 'tool-gerar_podcast' && part.state === 'output-available'
  }) as { output?: PodcastToolOutput } | undefined

  if (podcastPart?.output?.audioId) {
    const { audioId, topico, mensagem } = podcastPart.output
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start"
      >
        <PodcastInlineCard audioId={audioId} topico={topico} mensagem={mensagem} />
      </motion.div>
    )
  }

  if (!text) return null

  // Detect Flash Mode
  const hasFlash = text.includes('---FLASH_MODE_START---')
  if (!isUser && hasFlash) {
    const flashContent = text
      .split('---FLASH_MODE_START---')[1]
      ?.split('---FLASH_MODE_END---')[0]
      ?.trim() ?? ''
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex justify-start w-full"
      >
        <FlashModeCard content={flashContent} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {isUser ? (
        <div
          className="max-w-[72%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed"
          style={{
            background: '#e06b49',
            color: '#f5f0eb',
            boxShadow: '0 0 20px rgba(224,107,73,0.2)',
          }}
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
                <p className="text-sm leading-[1.75] mb-2 last:mb-0" style={{ color: T(0.82) }}>{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold" style={{ color: '#f5f0eb' }}>{children}</strong>
              ),
              em: ({ children }) => (
                <em className="italic" style={{ color: T(0.65) }}>{children}</em>
              ),
              ul: ({ children }) => (
                <ul className="text-sm space-y-1.5 mb-2 list-none pl-0">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="text-sm space-y-1.5 mb-2 list-decimal list-inside">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="flex gap-2 leading-relaxed" style={{ color: T(0.72) }}>
                  <span style={{ color: '#e06b49', marginTop: '6px' }} className="shrink-0 text-xs">▸</span>
                  <span>{children}</span>
                </li>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-semibold mt-4 mb-1.5" style={{ color: '#f5f0eb' }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-medium mt-3 mb-1" style={{ color: T(0.9) }}>{children}</h3>
              ),
              blockquote: ({ children }) => (
                <blockquote
                  className="border-l-2 pl-3 my-2 text-sm italic py-1 rounded-r-lg"
                  style={{
                    borderColor: 'rgba(224,107,73,0.4)',
                    background: 'rgba(224,107,73,0.05)',
                    color: T(0.55),
                  }}
                >
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const block = className?.includes('language-')
                return block ? (
                  <pre
                    className="rounded-xl p-3 text-xs overflow-x-auto my-2 font-mono"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: T(0.7) }}
                  >
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code
                    className="rounded px-1.5 py-0.5 text-[11px] font-mono"
                    style={{ background: 'rgba(224,107,73,0.12)', color: '#e06b49' }}
                  >
                    {children}
                  </code>
                )
              },
            }}
          >
            {text}
          </ReactMarkdown>
          {/* SourcesChips: aparece após reload com metadata.sources do DB */}
          {(() => {
            const meta = message.metadata as { sources?: SourceChunk[] } | undefined
            const sources = meta?.sources
            return sources && sources.length > 0
              ? <SourcesChips sources={sources} />
              : null
          })()}
        </div>
      )}
    </motion.div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
      <div
        className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 h-11"
        style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: '#e06b49', opacity: 0.6 }}
            animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  )
}
