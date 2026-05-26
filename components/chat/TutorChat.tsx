'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { Send, BookOpen, LayoutList } from 'lucide-react'
import { ChatMessage, ChatMessageSkeleton } from './ChatMessage'

const SUGGESTIONS = [
  'Explica o princípio da legalidade no Direito Administrativo',
  'Qual a diferença entre cargo, emprego e função pública?',
  'tenho 15 minutos, minha prova é amanhã de Contabilidade',
  'Quero ouvir um podcast sobre Direito Administrativo',
]

const T = (a: number) => `rgba(245,240,235,${a})`

interface TutorChatProps {
  conversationId: string | null
  initialMessages?: UIMessage[]
  onOpenSidebar?: () => void
}


export function TutorChat({ conversationId, initialMessages = [], onOpenSidebar }: TutorChatProps) {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [activeConvId, setActiveConvId] = useState(conversationId)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId: activeConvId },
      fetch: async (url, init) => {
        const res = await fetch(url, init)
        // Capture conversationId from response header
        const newConvId = res.headers.get('x-conversation-id')
        if (newConvId && newConvId !== activeConvId) {
          setActiveConvId(newConvId)
          // Update URL without full navigation
          window.history.replaceState(null, '', `/chat?c=${newConvId}`)
        }
        return res
      },
    }),
    messages: initialMessages,
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const showSuggestions = messages.length === 0 && !isLoading

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [input])

  // Keyboard shortcut: Cmd+K = new conversation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        router.push('/chat')
        setMessages([])
        setInput('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, setMessages])

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

  return (
    <div className="flex flex-col h-full">
      {/* Chat header bar */}
      <div
        className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer"
            style={{ color: T(0.4) }}
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <p className="text-xs" style={{ color: T(0.35) }}>
            Respostas baseadas em 18.344 transcrições CEFIS
          </p>
        </div>
        <kbd
          className="hidden sm:inline-flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5"
          style={{ background: 'rgba(255,255,255,0.05)', color: T(0.3), border: '1px solid rgba(255,255,255,0.08)' }}
        >
          ⌘K Nova
        </kbd>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {showSuggestions && (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
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
                  Tire dúvidas, peça revisão rápida ou gere um podcast para ouvir
                </p>
                <p className="text-xs mt-1" style={{ color: T(0.25) }}>
                  ⌘K para nova conversa
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

        {messages.map(m => <ChatMessage key={m.id} message={m} />)}
        {isLoading && messages[messages.length - 1]?.role === 'user' && <ChatMessageSkeleton />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="shrink-0 border-t px-4 py-3"
        style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida… (Enter para enviar, Shift+Enter nova linha)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none min-h-[44px] rounded-2xl px-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
            style={{
              background: '#242424',
              border: '1px solid rgba(255,255,255,0.08)',
              color: T(0.85),
              fontFamily: 'inherit',
              maxHeight: '120px',
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
              boxShadow: input.trim() ? '0 0 20px rgba(224,107,73,0.3)' : 'none',
            }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
