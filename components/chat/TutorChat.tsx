'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, BookOpen } from 'lucide-react'
import { ChatMessage, ChatMessageSkeleton } from './ChatMessage'

const SUGGESTIONS = [
  'Explica o princípio da legalidade no Direito Administrativo',
  'Qual a diferença entre cargo, emprego e função pública?',
  'Como funciona o processo administrativo disciplinar?',
  'Quais são os poderes da administração pública?',
]

export function TutorChat() {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

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
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent) }
  }

  const showSuggestions = messages.length === 0 && !isLoading

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-full gap-8 py-16"
            >
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%)', boxShadow: '0 0 30px rgba(99,102,241,0.15)' }}
                >
                  <BookOpen className="h-6 w-6 text-indigo-400" />
                </div>
                <h2 className="text-base font-semibold text-white/80">Tutor CEFIS</h2>
                <p className="text-sm text-white/35 mt-1 max-w-sm">
                  Tire dúvidas com base nas transcrições reais das suas aulas
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    onClick={() => !isLoading && sendMessage({ text: s })}
                    className="text-left text-xs text-white/55 glass rounded-xl px-4 py-3 hover:border-indigo-500/25 hover:text-white/75 hover:bg-indigo-500/[0.04] transition-all duration-200 cursor-pointer"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && <ChatMessageSkeleton />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t border-white/[0.06] px-4 py-4"
        style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(10px)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida… (Enter para enviar)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none min-h-[44px] max-h-32 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white/85 placeholder:text-white/25 outline-none transition-all focus:border-indigo-500/40 focus:bg-white/[0.06] disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-11 w-11 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center text-white transition-all hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{ boxShadow: input.trim() ? '0 0 15px rgba(99,102,241,0.3)' : 'none' }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
