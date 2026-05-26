'use client'

import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { usePodcast } from '@/hooks/usePodcast'
import { PodcastPlayer } from '@/components/podcast/PodcastPlayer'
import { AlertCircle, ChevronDown, ChevronUp, Loader2, Mic } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function PodcastPlayerPage() {
  const params = useParams<{ id: string }>()
  const { status, url, title, script, topics, error } = usePodcast(params.id)
  const [showScript, setShowScript] = useState(false)

  return (
    <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 space-y-5">

      <AnimatePresence mode="wait">
        {/* Generating */}
        {status === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="glass rounded-2xl p-10 flex flex-col items-center text-center gap-5"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 ring-2 ring-[#020617]">
                <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-75" />
              </span>
            </div>
            <div>
              <p className="text-base font-semibold text-white/80">Gerando seu podcast...</p>
              <p className="text-sm text-white/35 mt-1.5 max-w-xs leading-relaxed">
                Script com GPT-4o baseado nas suas lacunas.
                Narração ElevenLabs logo após. ~45 segundos.
              </p>
            </div>
            {topics.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {topics.map(t => (
                  <span key={t} className="text-xs bg-indigo-500/10 text-indigo-300/70 rounded-full px-3 py-1 border border-indigo-500/15">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Error */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-rose-500/20 bg-rose-500/[0.05] rounded-2xl p-6 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-300">Falha na geração</p>
              <p className="text-xs text-rose-400/60 mt-1">{error ?? 'Erro desconhecido'}</p>
              <a href="/podcast/generate" className="inline-block mt-3 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors">
                Tentar novamente →
              </a>
            </div>
          </motion.div>
        )}

        {/* Ready */}
        {status === 'ready' && url && title && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <PodcastPlayer url={url} title={title} />

            {/* Script */}
            {script && (
              <div className="glass rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowScript(v => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-white/55 hover:text-white/80 hover:bg-white/[0.03] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Mic className="h-3.5 w-3.5 text-indigo-400" />
                    Roteiro do episódio
                  </span>
                  {showScript
                    ? <ChevronUp className="h-4 w-4 text-white/30" />
                    : <ChevronDown className="h-4 w-4 text-white/30" />}
                </button>
                <AnimatePresence>
                  {showScript && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-white/[0.06] pt-4">
                        <p className="text-sm text-white/50 leading-[1.8] whitespace-pre-wrap">
                          {script}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
