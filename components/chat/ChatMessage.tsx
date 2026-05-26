import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'
import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: UIMessage
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const text = message.parts
    .filter(isTextUIPart)
    .map(p => p.text)
    .join('')

  if (!text) return null

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-zinc-900 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="text-sm leading-relaxed text-zinc-800 mb-2 last:mb-0">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-zinc-900">{children}</strong>
              ),
              ul: ({ children }) => (
                <ul className="text-sm text-zinc-800 list-disc list-inside space-y-1 mb-2">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="text-sm text-zinc-800 list-decimal list-inside space-y-1 mb-2">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              h2: ({ children }) => (
                <h2 className="text-sm font-semibold text-zinc-900 mt-3 mb-1">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-medium text-zinc-900 mt-2 mb-1">{children}</h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-blue-300 pl-3 text-sm text-zinc-600 italic my-2">
                  {children}
                </blockquote>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.includes('language-')
                return isBlock ? (
                  <pre className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs overflow-x-auto my-2">
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code className="bg-zinc-100 text-zinc-800 rounded px-1 text-xs font-mono">
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
    </div>
  )
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex justify-start">
      <div className={cn(
        'bg-white border border-zinc-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm',
        'flex gap-1 items-center h-10',
      )}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
