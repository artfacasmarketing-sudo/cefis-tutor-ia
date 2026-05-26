import { BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SourceCitationProps {
  courseTitle: string
  lessonTitle: string
  className?: string
}

export function SourceCitation({ courseTitle, lessonTitle, className }: SourceCitationProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 whitespace-nowrap',
        className,
      )}
    >
      <BookOpen className="h-3 w-3 shrink-0" />
      <span className="font-medium truncate max-w-[200px]">{courseTitle}</span>
      <span className="text-blue-400">·</span>
      <span className="truncate max-w-[140px]">{lessonTitle}</span>
    </span>
  )
}
