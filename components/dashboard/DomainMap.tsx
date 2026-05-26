import { cn } from '@/lib/utils'
import type { DomainMap } from '@/types/domain'

interface DomainMapProps {
  domainMap: DomainMap
}

function getColor(accuracy: number, count: number) {
  if (count === 0) return 'border-zinc-200 bg-zinc-50'
  if (accuracy >= 80) return 'border-emerald-200 bg-emerald-50'
  if (accuracy >= 60) return 'border-amber-200 bg-amber-50'
  return 'border-red-200 bg-red-50'
}

function getTextColor(accuracy: number, count: number) {
  if (count === 0) return 'text-zinc-400'
  if (accuracy >= 80) return 'text-emerald-700'
  if (accuracy >= 60) return 'text-amber-700'
  return 'text-red-700'
}

function getBarColor(accuracy: number, count: number) {
  if (count === 0) return 'bg-zinc-200'
  if (accuracy >= 80) return 'bg-emerald-500'
  if (accuracy >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function StatusBadge({ accuracy, count }: { accuracy: number; count: number }) {
  if (count === 0)
    return (
      <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
        Sem dados
      </span>
    )
  if (accuracy >= 80)
    return (
      <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide">
        Dominado
      </span>
    )
  if (accuracy >= 60)
    return (
      <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">
        Parcial
      </span>
    )
  return (
    <span className="text-[10px] font-medium text-red-600 uppercase tracking-wide">
      Lacuna
    </span>
  )
}

export function DomainMap({ domainMap }: DomainMapProps) {
  const entries = Object.entries(domainMap).sort(
    ([, a], [, b]) => a.accuracy - b.accuracy,
  )

  if (entries.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4">
        Nenhum certificado encontrado. Complete cursos na CEFIS para ver seu mapa de domínio.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {entries.map(([category, data]) => (
        <div
          key={category}
          className={cn(
            'rounded-xl border p-4 flex flex-col gap-2 transition-shadow hover:shadow-sm',
            getColor(data.accuracy, data.count),
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-800 leading-tight">
              {category}
            </p>
            <StatusBadge accuracy={data.accuracy} count={data.count} />
          </div>

          <div className="flex items-end justify-between">
            <span
              className={cn(
                'text-2xl font-bold leading-none',
                getTextColor(data.accuracy, data.count),
              )}
            >
              {data.count === 0 ? '—' : `${Math.round(data.accuracy)}%`}
            </span>
            <span className="text-[10px] text-zinc-400">
              {data.count} cert{data.count !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Accuracy bar */}
          <div className="h-1.5 rounded-full bg-zinc-200 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', getBarColor(data.accuracy, data.count))}
              style={{ width: `${data.count === 0 ? 0 : data.accuracy}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
