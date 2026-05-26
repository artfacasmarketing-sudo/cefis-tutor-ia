import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: UIMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  const textContent = message.parts
    .filter(isTextUIPart)
    .map(p => p.text)
    .join('')

  // Hide internal init trigger
  if (textContent === '__init__') return null

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-zinc-900 text-white rounded-br-sm'
            : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm shadow-sm',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{textContent}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
            }}
          >
            {textContent}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
