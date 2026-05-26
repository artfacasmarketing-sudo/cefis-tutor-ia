'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
import { MessageBubble } from './MessageBubble'

export function OnboardingChat() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/onboarding/chat' }),
    onFinish: async () => {
      const res = await fetch('/api/onboarding/status')
      const data = await res.json() as { completed: boolean }
      if (data.completed) router.push('/dashboard')
    },
  })

  useEffect(() => {
    if (!started.current) { started.current = true; sendMessage({ text: '__init__' }) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isLoading = status === 'submitted' || status === 'streaming'

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

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 h-11">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-indigo-400/70"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {messages.map(m => <MessageBubble key={m.id} message={m} />)}

        <AnimatePresence>
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 h-11">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-indigo-400/70"
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t border-white/[0.06] px-4 py-4"
        style={{ background: 'rgba(2,6,23,0.9)', backdropFilter: 'blur(10px)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-2xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Responda ao tutor… (Enter para enviar)"
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
