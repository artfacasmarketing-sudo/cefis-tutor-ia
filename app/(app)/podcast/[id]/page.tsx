'use client'

import { useParams } from 'next/navigation'
import { usePodcast } from '@/hooks/usePodcast'
import { PodcastPlayer } from '@/components/podcast/PodcastPlayer'
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function PodcastPlayerPage() {
  const params = useParams<{ id: string }>()
  const { status, url, title, script, topics, error } = usePodcast(params.id)
  const [showScript, setShowScript] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-semibold text-zinc-900">Player</h1>
          <a
            href="/podcast"
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← Meus podcasts
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Generating state */}
        {status === 'generating' && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-8 flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-white animate-spin" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Gerando seu podcast...</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                O script está sendo criado com GPT-4o baseado nas suas lacunas. A narração vem
                em seguida. Aguarde ~45 segundos.
              </p>
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {topics.map(t => (
                  <span
                    key={t}
                    className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-3 py-1"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error state */}
        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Falha na geração</p>
              <p className="text-xs text-red-600 mt-1">{error ?? 'Erro desconhecido'}</p>
              <a
                href="/podcast/generate"
                className="inline-block mt-3 text-xs font-medium text-red-700 hover:underline"
              >
                Tentar novamente →
              </a>
            </div>
          </div>
        )}

        {/* Ready state */}
        {status === 'ready' && url && title && (
          <>
            <PodcastPlayer url={url} title={title} />

            {/* Script expandable */}
            {script && (
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <button
                  onClick={() => setShowScript(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <span>Roteiro do episódio</span>
                  {showScript ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" />
                  )}
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200',
                    showScript ? 'max-h-[600px]' : 'max-h-0',
                  )}
                >
                  <div className="px-5 pb-5 border-t border-zinc-100 pt-4">
                    <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                      {script}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
