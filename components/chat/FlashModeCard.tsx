'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Zap, BookOpen, CheckCircle, XCircle, Mic } from 'lucide-react'
import { useChatContext } from './ChatContext'

const T = (a: number) => `rgba(245,240,235,${a})`

interface Question {
  id: number
  text: string
  options: { letter: string; text: string }[]
  answer: string
}

function parseQuestions(raw: string): Question[] {
  const qRegex = /\*\*Q(\d+)\*\*:/g
  const questions: Question[] = []
  let match

  // Simpler line-by-line parser
  const lines = raw.split('\n')
  let current: Partial<Question> | null = null

  for (const line of lines) {
    const qMatch = line.match(/^\*\*Q(\d+)\*\*:\s*(.+)/)
    if (qMatch) {
      if (current?.text) questions.push(current as Question)
      current = { id: parseInt(qMatch[1]!), text: qMatch[2]!, options: [], answer: '' }
      continue
    }

    // Options: "a) texto | b) texto | c) texto | d) texto | **Resposta: X**"
    // Or multi-line: "a) texto"
    if (current) {
      const answerMatch = line.match(/\*\*Resposta:\s*([A-Da-d])\*\*/)
      if (answerMatch) {
        current.answer = answerMatch[1]!.toLowerCase()
        continue
      }

      // Inline options with pipes
      if (line.includes('|') && (line.includes('a)') || line.includes('b)'))) {
        const parts = line.split('|').map(p => p.trim())
        for (const part of parts) {
          const optMatch = part.match(/^([a-d])\)\s*(.+)/)
          if (optMatch) {
            current.options = current.options ?? []
            current.options.push({ letter: optMatch[1]!, text: optMatch[2]!.trim() })
          }
          // Inline answer
          const inlineAns = part.match(/\*\*Resposta:\s*([A-Da-d])\*\*/)
          if (inlineAns) current.answer = inlineAns[1]!.toLowerCase()
        }
        continue
      }

      // Line option
      const optMatch = line.match(/^([a-d])\)\s*(.+)/)
      if (optMatch && current) {
        current.options = current.options ?? []
        current.options.push({ letter: optMatch[1]!, text: optMatch[2]!.trim() })
      }
    }
  }
  if (current?.text) questions.push(current as Question)
  void qRegex

  return questions.filter(q => q.options.length >= 2 && q.answer)
}

function QuizQuestion({ q, index }: { q: Question; index: number }) {
  const [selected, setSelected] = useState<string | null>(null)
  const revealed = selected !== null
  const correct = selected === q.answer

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="rounded-xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: T(0.85) }}>
        <span style={{ color: '#e06b49' }} className="font-bold mr-1">{index + 1}.</span>
        {q.text}
      </p>
      <div className="space-y-1.5">
        {q.options.map(opt => {
          const isSelected = selected === opt.letter
          const isCorrect = opt.letter === q.answer
          let bg = 'rgba(255,255,255,0.04)'
          let border = 'rgba(255,255,255,0.07)'
          let textColor = T(0.6)

          if (revealed) {
            if (isCorrect) { bg = 'rgba(74,222,128,0.12)'; border = 'rgba(74,222,128,0.3)'; textColor = '#4ade80' }
            else if (isSelected) { bg = 'rgba(224,107,73,0.12)'; border = 'rgba(224,107,73,0.3)'; textColor = '#e06b49' }
          } else if (isSelected) {
            bg = 'rgba(224,107,73,0.15)'; border = 'rgba(224,107,73,0.4)'; textColor = '#e06b49'
          }

          return (
            <motion.button
              key={opt.letter}
              onClick={() => !revealed && setSelected(opt.letter)}
              disabled={revealed}
              whileHover={!revealed ? { scale: 1.01 } : {}}
              whileTap={!revealed ? { scale: 0.99 } : {}}
              className="w-full text-left rounded-lg px-3 py-2 text-sm transition-all cursor-pointer disabled:cursor-default"
              style={{ background: bg, border: `1px solid ${border}`, color: textColor }}
            >
              <span className="font-semibold mr-2">{opt.letter.toUpperCase()})</span>
              {opt.text}
              {revealed && isCorrect && <CheckCircle className="inline h-3.5 w-3.5 ml-2 mb-0.5" />}
              {revealed && isSelected && !isCorrect && <XCircle className="inline h-3.5 w-3.5 ml-2 mb-0.5" />}
            </motion.button>
          )
        })}
      </div>
      <AnimatePresence>
        {revealed && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-2 text-xs font-medium"
            style={{ color: correct ? '#4ade80' : '#e06b49' }}
          >
            {correct ? '✓ Correto!' : `✗ Resposta correta: ${q.answer.toUpperCase()}`}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface FlashModeCardProps {
  content: string
}

const stagger = { animate: { transition: { staggerChildren: 0.12 } } }
const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export function FlashModeCard({ content }: FlashModeCardProps) {
  const { sendMessage } = useChatContext()

  // Parse sections
  const focoMatch = content.match(/###\s*Foco[:\s]*(.+?)\n([\s\S]+?)(?=###|$)/)
  const focoTitle = focoMatch?.[1]?.trim() ?? ''
  const focoBody = focoMatch?.[2]?.trim() ?? ''

  const testeSection = content.match(/###\s*Teste Rápido\n([\s\S]+?)(?=---|###|$)/)?.[1] ?? ''
  const questions = parseQuestions(testeSection)

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="w-full max-w-[90%] rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2a2018 0%, #242424 100%)',
        borderLeft: '4px solid #e06b49',
        border: '1px solid rgba(224,107,73,0.2)',
        borderLeftWidth: '4px',
        boxShadow: '0 0 30px rgba(224,107,73,0.08), 0 4px 24px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header badge */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-2 px-5 pt-4 pb-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
          style={{ background: 'rgba(224,107,73,0.15)', color: '#e06b49' }}
        >
          <Zap className="h-3 w-3" />
          Modo Flash
        </motion.div>
        <span className="text-xs" style={{ color: T(0.35) }}>
          Conteúdo baseado nas suas lacunas CEFIS
        </span>
      </motion.div>

      <div className="p-5 space-y-5">
        {/* Foco section */}
        {focoBody && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 shrink-0" style={{ color: '#e06b49' }} />
              <h3 className="text-sm font-semibold" style={{ color: '#f5f0eb' }}>
                {focoTitle || 'Resumo do Tópico'}
              </h3>
            </div>
            <div
              className="rounded-xl p-4 text-sm leading-[1.75] prose-sm"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: T(0.78),
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong style={{ color: '#f5f0eb', fontWeight: 600 }}>{children}</strong>,
                  li: ({ children }) => (
                    <li className="flex gap-2">
                      <span style={{ color: '#e06b49' }}>·</span>
                      <span>{children}</span>
                    </li>
                  ),
                }}
              >
                {focoBody}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Divider */}
        {questions.length > 0 && (
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        )}

        {/* Quiz section */}
        {questions.length > 0 && (
          <motion.div variants={fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T(0.35) }}>
              Teste rápido — {questions.length} questões
            </p>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuizQuestion key={q.id} q={q} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Podcast CTA */}
        <motion.div variants={fadeUp} className="flex items-center justify-between gap-4">
          <p className="text-xs" style={{ color: T(0.45) }}>
            Quer revisar ouvindo? Gero um podcast focado nesse tópico em ~45s.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => sendMessage({ text: `Gera um podcast sobre ${focoTitle || 'esse tópico'}` })}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shrink-0 cursor-pointer"
            style={{
              background: '#e06b49',
              color: '#f5f0eb',
              boxShadow: '0 0 14px rgba(224,107,73,0.25)',
            }}
          >
            <Mic className="h-3.5 w-3.5" />
            Gerar Podcast
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  )
}
