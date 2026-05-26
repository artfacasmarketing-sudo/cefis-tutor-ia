'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
import { MessageBubble } from './MessageBubble'

const T = 'rgba(245,240,235,'

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 h-11"
              style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: '#e06b49' }}
                  animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -3, 0] }}
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
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div
                className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5 h-11"
                style={{ background: '#242424', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: '#e06b49' }}
                    animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -3, 0] }}
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
        className="shrink-0 border-t px-4 py-4"
        style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-2xl mx-auto">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Responda ao tutor… (Enter para enviar)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none min-h-[44px] max-h-32 rounded-2xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
            style={{
              background: '#242424',
              border: '1px solid rgba(255,255,255,0.08)',
              color: `${T}0.85)`,
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(224,107,73,0.35)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            style={{
              background: '#e06b49',
              color: '#f5f0eb',
              boxShadow: input.trim() ? '0 0 16px rgba(224,107,73,0.3)' : 'none',
            }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
