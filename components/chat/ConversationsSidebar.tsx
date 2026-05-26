'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { PenSquare, Trash2, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversationListItem } from '@/types/conversation'

const T = (a: number) => `rgba(245,240,235,${a})`

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}min atrás`
  if (h < 24) return `${h}h atrás`
  if (d === 1) return 'ontem'
  if (d < 7) return `${d} dias atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function SkeletonItem() {
  return (
    <div className="px-3 py-2.5 rounded-xl flex flex-col gap-1.5">
      <div className="h-3 rounded-full animate-pulse w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="h-2.5 rounded-full animate-pulse w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

interface SidebarContentProps {
  onClose?: () => void
}

function SidebarContent({ onClose }: SidebarContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeId = searchParams.get('c')

  const [conversations, setConversations] = useState<ConversationListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      if (res.ok) setConversations(await res.json() as ConversationListItem[])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchConversations() }, [fetchConversations])

  async function handleNew() {
    const res = await fetch('/api/conversations', { method: 'POST' })
    const data = await res.json() as { id: string }
    onClose?.()
    router.push(`/chat?c=${data.id}`)
    void fetchConversations()
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    setDeletingId(id)
    await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) router.push('/chat')
    setDeletingId(null)
  }

  function handleSelect(id: string) {
    onClose?.()
    router.push(`/chat?c=${id}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T(0.3) }}>
            Conversas
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer"
              style={{ color: T(0.35) }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={handleNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: '#e06b49', color: '#f5f0eb', boxShadow: '0 0 14px rgba(224,107,73,0.2)' }}
        >
          <PenSquare className="h-3.5 w-3.5" />
          Nova conversa
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {loading && (
          <div className="space-y-0.5">
            {[1, 2, 3].map(i => <SkeletonItem key={i} />)}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageSquare className="h-6 w-6" style={{ color: T(0.15) }} />
            <p className="text-xs text-center" style={{ color: T(0.3) }}>
              Nenhuma conversa ainda
            </p>
          </div>
        )}

        <AnimatePresence>
          {conversations.map((conv, i) => {
            const isActive = conv.id === activeId
            const isDeleting = conv.id === deletingId
            const isHovered = conv.id === hoveredId

            return (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                onClick={() => handleSelect(conv.id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={isDeleting}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer relative group',
                  isDeleting && 'opacity-40',
                )}
                style={{
                  background: isActive
                    ? 'rgba(224,107,73,0.1)'
                    : isHovered
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                  borderLeft: isActive ? '2px solid #e06b49' : '2px solid transparent',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate leading-tight"
                      style={{ color: isActive ? '#e06b49' : T(0.75) }}
                    >
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] shrink-0" style={{ color: T(0.3) }}>
                        {relativeTime(conv.lastMessageAt)}
                      </p>
                      {conv.lastUserMessage && isHovered && (
                        <p className="text-[10px] truncate" style={{ color: T(0.25) }}>
                          · {conv.lastUserMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {isHovered && !isDeleting && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={e => handleDelete(e, conv.id)}
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 cursor-pointer"
                      style={{ color: T(0.35), background: 'rgba(255,255,255,0.06)' }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </motion.button>
                  )}
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Desktop: fixed sidebar (280px), Mobile: sheet drawer
interface ConversationsSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

const SIDEBAR_BG: React.CSSProperties = {
  background: '#161616',
  borderRight: '1px solid rgba(255,255,255,0.06)',
}

export function ConversationsSidebar({ mobileOpen, onMobileClose }: ConversationsSidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden md:flex fixed left-[224px] top-0 h-screen w-[280px] flex-col z-30"
        style={SIDEBAR_BG}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full w-[280px] flex flex-col"
              style={SIDEBAR_BG}
            >
              <SidebarContent onClose={onMobileClose} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
