import { ExternalLink, BookOpen, AlertTriangle, TrendingUp } from 'lucide-react'
import type { StudyItem } from '@/types/domain'
import { cn } from '@/lib/utils'

interface StudyPlanCardProps {
  item: StudyItem
  rank: number
}

export function StudyPlanCard({ item, rank }: StudyPlanCardProps) {
  const isHighPriority = item.priority === 'high'

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-start gap-4 rounded-xl border p-4 bg-white hover:shadow-md transition-all',
        isHighPriority
          ? 'border-red-200 hover:border-red-300'
          : 'border-zinc-200 hover:border-zinc-300',
      )}
    >
      {/* Rank + Thumbnail */}
      <div className="shrink-0 flex flex-col items-center gap-1">
        <span className="text-xs font-bold text-zinc-400 w-6 text-center">
          #{rank}
        </span>
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="w-14 h-10 rounded-lg object-cover bg-zinc-100"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-zinc-400" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <p className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-700 leading-snug flex-1">
            {item.title}
          </p>
          <ExternalLink className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5 group-hover:text-zinc-600 transition-colors" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5',
              isHighPriority
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200',
            )}
          >
            {isHighPriority ? (
              <AlertTriangle className="h-2.5 w-2.5" />
            ) : (
              <TrendingUp className="h-2.5 w-2.5" />
            )}
            {isHighPriority ? 'Alta prioridade' : 'Recomendado'}
          </span>

          <span className="text-[10px] text-zinc-400">
            {item.category}
          </span>

          {item.lessonsCount > 0 && (
            <span className="text-[10px] text-zinc-400">
              {item.lessonsCount} aulas
            </span>
          )}
        </div>

        {item.gapAccuracy > 0 && item.gapAccuracy < 100 && (
          <p className="text-[10px] text-zinc-400 mt-1">
            Seu acerto atual nessa área: {Math.round(item.gapAccuracy)}%
          </p>
        )}
      </div>
    </a>
  )
}
