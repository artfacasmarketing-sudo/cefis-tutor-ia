'use client'

import { MessageSquare, Mic } from 'lucide-react'
import { motion } from 'framer-motion'

interface DashboardHeaderProps {
  firstName: string
  objective?: string | null
}

export function DashboardHeader({ firstName, objective }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="border-b px-4 sm:px-6 py-8"
      style={{
        background: 'linear-gradient(180deg, #242424 0%, #1a1a1a 100%)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2"
            style={{ color: 'rgba(245,240,235,0.35)' }}
          >
            Painel do estudante
          </p>
          <h1 className="text-[26px] font-semibold tracking-tight text-gradient leading-none">
            Olá, {firstName}
          </h1>
          {objective && (
            <p className="mt-2 text-sm" style={{ color: 'rgba(245,240,235,0.5)' }}>
              {objective}
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <a
            href="/chat"
            className="group flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer"
            style={{
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(245,240,235,0.6)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#f5f0eb'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.14)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(245,240,235,0.6)'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)'
            }}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat de Dúvidas</span>
          </a>

          <a
            href="/podcast/generate"
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
            style={{
              background: '#e06b49',
              color: '#f5f0eb',
              boxShadow: '0 0 20px rgba(224,107,73,0.3), 0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Gerar Podcast</span>
          </a>
        </div>
      </div>
    </motion.div>
  )
}
