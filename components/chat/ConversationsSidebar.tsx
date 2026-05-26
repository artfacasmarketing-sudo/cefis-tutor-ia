'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  PenSquare, Trash2, MessageSquare, X,
  GraduationCap, LayoutDashboard, Mic, LogOut,
} from 'lucide-react'
import type { ConversationListItem } from '@/types/conversation'

const T = (a: number) => `rgba(245,240,235,${a})`

const SIDEBAR_STYLE: React.CSSProperties = {
  background: '#161616',
  borderRight: '1px solid rgba(255,255,255,0.06)',
}

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

interface SidebarContentProps { onClose?: () => void }

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
      if (res.ok) {
        setConversations(await res.json() as ConversationListItem[])
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string }
        console.error('[ConversationsSidebar] fetch failed:', res.status, body.error)
      }
    } catch (err) {
      console.error('[ConversationsSidebar] network error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchConversations() }, [fetchConversations])

  // Listen for new conversation events fired by TutorChat
  useEffect(() => {
    const handler = () => void fetchConversations()
    window.addEventListener('cefis:conversation-updated', handler)
    return () => window.removeEventListener('cefis:conversation-updated', handler)
  }, [fetchConversations])

  async function handleNew() {
    const res = await fetch('/api/conversations', { method: 'POST' })
    const data = await res.json() as { id: string }
    onClose?.()
    router.push(`/chat?c=${data.id}`)
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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  function handleSelect(id: string) {
    onClose?.()
    router.push(`/chat?c=${id}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header: Logo + Nova conversa ───────────────────── */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ background: 'rgba(224,107,73,0.12)', border: '1px solid rgba(224,107,73,0.2)' }}
          >
            <GraduationCap className="h-3.5 w-3.5" style={{ color: '#e06b49' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#f5f0eb' }}>
            CEFIS Tutor
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer"
              style={{ color: T(0.35) }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={handleNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: '#e06b49', color: '#f5f0eb', boxShadow: '0 0 14px rgba(224,107,73,0.2)' }}
        >
          <PenSquare className="h-3.5 w-3.5" />
          Nova conversa
        </button>
      </div>

      {/* ── Conversations list ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 min-h-0">
        {loading && <>{[1, 2, 3].map(i => <SkeletonItem key={i} />)}</>}

        {!loading && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <MessageSquare className="h-6 w-6" style={{ color: T(0.15) }} />
            <p className="text-xs text-center px-4" style={{ color: T(0.3) }}>
              Nenhuma conversa ainda.<br />
              Clique em &ldquo;Nova conversa&rdquo;.
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
                transition={{ delay: i * 0.03, duration: 0.22 }}
                onClick={() => handleSelect(conv.id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
                disabled={isDeleting}
                className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer"
                style={{
                  background: isActive
                    ? 'rgba(224,107,73,0.1)'
                    : isHovered
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                  borderLeft: `2px solid ${isActive ? '#e06b49' : 'transparent'}`,
                  opacity: isDeleting ? 0.4 : 1,
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
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: T(0.3) }}>
                      {relativeTime(conv.lastMessageAt)}
                      {isHovered && conv.lastUserMessage
                        ? ` · ${conv.lastUserMessage.slice(0, 40)}`
                        : ''}
                    </p>
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

      {/* ── Footer: nav links + logout ──────────────────────── */}
      <div
        className="shrink-0 px-3 py-3 space-y-0.5 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {[
          { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { href: '/podcast', icon: Mic, label: 'Podcasts' },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs transition-all duration-150 cursor-pointer hover:bg-white/5"
            style={{ color: T(0.4) }}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs transition-all duration-150 cursor-pointer hover:bg-white/5"
          style={{ color: T(0.3) }}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}

// ── Desktop fixed + Mobile drawer ───────────────────────────────────────────
interface ConversationsSidebarProps {
  mobileOpen: boolean
  onMobileClose: () => void
}

export function ConversationsSidebar({ mobileOpen, onMobileClose }: ConversationsSidebarProps) {
  return (
    <>
      {/* Desktop — fixed left-0 (no main sidebar on /chat) */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-[280px] flex-col z-30"
        style={SIDEBAR_STYLE}
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
              style={SIDEBAR_STYLE}
            >
              <SidebarContent onClose={onMobileClose} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
