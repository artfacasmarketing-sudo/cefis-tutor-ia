'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, X, ExternalLink } from 'lucide-react'

const T = (a: number) => `rgba(245,240,235,${a})`

export interface SourceChunk {
  id: string
  lessonId: string
  lessonTitle: string
  courseId: string
  courseTitle: string
  contentSnippet: string
  similarity: number
}

interface SourcePreviewModalProps {
  source: SourceChunk | null
  onClose: () => void
}

export function SourcePreviewModal({ source, onClose }: SourcePreviewModalProps) {
  return (
    <AnimatePresence>
      {source && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-[640px] max-h-[80vh] overflow-y-auto flex flex-col rounded-[20px]"
            style={{
              background: '#242424',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
              style={{ background: '#242424', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(224,107,73,0.12)' }}
                >
                  <BookOpen className="h-3.5 w-3.5" style={{ color: '#e06b49' }} />
                </div>
                <span className="text-sm font-semibold" style={{ color: T(0.9) }}>
                  Fonte CEFIS
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                  style={{
                    color: source.similarity >= 0.85 ? '#4ade80' : source.similarity >= 0.75 ? '#e06b49' : T(0.45),
                    background: source.similarity >= 0.85 ? 'rgba(74,222,128,0.1)' : source.similarity >= 0.75 ? 'rgba(224,107,73,0.1)' : 'rgba(255,255,255,0.06)',
                  }}
                >
                  {Math.round(source.similarity * 100)}% relevância
                </span>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-white/10"
                  style={{ color: T(0.4) }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Curso */}
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1"
                  style={{ color: T(0.3) }}
                >
                  Curso
                </p>
                <p className="text-sm font-semibold" style={{ color: '#e06b49' }}>
                  {source.courseTitle}
                </p>
              </div>

              {/* Separador */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* Aula */}
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1"
                  style={{ color: T(0.3) }}
                >
                  Aula
                </p>
                <p className="text-sm" style={{ color: T(0.8) }}>
                  {source.lessonTitle}
                </p>
              </div>

              {/* Separador */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* Trecho */}
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2"
                  style={{ color: T(0.3) }}
                >
                  Trecho da transcrição
                </p>
                <p
                  className="text-sm leading-[1.75]"
                  style={{ color: T(0.7) }}
                >
                  {source.contentSnippet}
                  {source.contentSnippet.length >= 600 && (
                    <span style={{ color: T(0.35) }}> …</span>
                  )}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <a
                href={`https://cefis.com.br/cursos/${source.courseId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors hover:opacity-80"
                style={{ color: '#e06b49' }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Acessar curso completo na CEFIS
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
