'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { Send, BookOpen, PenSquare } from 'lucide-react'
import { ChatMessage, ChatMessageSkeleton } from './ChatMessage'

const SUGGESTIONS = [
  'Explica o princípio da legalidade no Direito Administrativo',
  'Qual a diferença entre cargo, emprego e função pública?',
  'Como funciona o processo administrativo disciplinar?',
  'Quais são os poderes da administração pública?',
]

const T = (a: number) => `rgba(245,240,235,${a})`

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

interface TutorChatProps {
  historyMessages?: UIMessage[]
  historyCount?: number
  lastHistoryAt?: string | null
}

export function TutorChat({
  historyMessages = [],
  historyCount = 0,
  lastHistoryAt = null,
}: TutorChatProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: historyMessages,
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const newMessageCount = messages.length - historyCount
  const hasHistory = historyCount > 0
  const showSuggestions = messages.length === 0 && !isLoading

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    sendMessage({ text })
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  function handleNewConversation() {
    setMessages([])
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {showSuggestions && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-full gap-8 py-16"
            >
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(224,107,73,0.12)', border: '1px solid rgba(224,107,73,0.2)' }}
                >
                  <BookOpen className="h-6 w-6" style={{ color: '#e06b49' }} />
                </div>
                <h2 className="text-base font-semibold" style={{ color: T(0.85) }}>
                  Tutor CEFIS
                </h2>
                <p className="text-sm mt-1.5 max-w-sm" style={{ color: T(0.4) }}>
                  Tire dúvidas com base nas transcrições reais das suas aulas
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    onClick={() => !isLoading && sendMessage({ text: s })}
                    className="text-left text-xs rounded-2xl px-4 py-3 transition-all duration-200 cursor-pointer"
                    style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)', color: T(0.55) }}
                    onMouseEnter={e => {
                      const el = e.currentTarget
                      el.style.borderColor = 'rgba(224,107,73,0.2)'
                      el.style.color = T(0.8)
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget
                      el.style.borderColor = 'rgba(255,255,255,0.08)'
                      el.style.color = T(0.55)
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History messages */}
        {messages.slice(0, historyCount).map(m => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {/* Separator between history and new messages */}
        {hasHistory && newMessageCount > 0 && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-[10px] font-medium px-2 rounded-full"
              style={{ color: T(0.3), background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {lastHistoryAt ? `Conversa anterior · ${formatDate(lastHistoryAt)}` : 'Conversa anterior'}
            </span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>
        )}

        {/* New messages */}
        {messages.slice(historyCount).map(m => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && <ChatMessageSkeleton />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t px-4 py-3"
        style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          {/* Nova conversa */}
          {messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleNewConversation}
              title="Nova conversa"
              className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center transition-all cursor-pointer"
              style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)', color: T(0.4) }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T(0.75) }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T(0.4) }}
            >
              <PenSquare className="h-4 w-4" />
            </motion.button>
          )}

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida… (Enter para enviar)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none min-h-[44px] max-h-32 rounded-2xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
            style={{
              background: '#242424',
              border: '1px solid rgba(255,255,255,0.08)',
              color: T(0.85),
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(224,107,73,0.35)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />

          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: '#e06b49',
              color: '#f5f0eb',
              boxShadow: input.trim() ? '0 0 20px rgba(224,107,73,0.3)' : 'none',
            }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
