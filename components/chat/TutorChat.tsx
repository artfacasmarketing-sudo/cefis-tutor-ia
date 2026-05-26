'use client'

import { useEffect, useRef, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  function handleSuggestion(text: string) {
    if (isLoading) return
    sendMessage({ text })
  }

  const showSuggestions = messages.length === 0 && !isLoading

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {showSuggestions && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900">Tutor CEFIS</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Tire dúvidas com base nas aulas reais do seu curso
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-left text-sm text-zinc-700 bg-white border border-zinc-200 rounded-xl px-4 py-3 hover:border-zinc-400 hover:bg-zinc-50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <ChatMessageSkeleton />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white px-4 py-3 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Qual é a sua dúvida? (Enter para enviar, Shift+Enter para nova linha)"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none min-h-[44px] max-h-36 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0 h-11 w-11"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
