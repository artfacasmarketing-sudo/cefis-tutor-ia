'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Mic,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',       icon: LayoutDashboard, exact: true  },
  { href: '/chat',      label: 'Chat de Dúvidas', icon: MessageSquare,   exact: false },
  { href: '/podcast',   label: 'Podcasts',        icon: Mic,             exact: false },
]

const T = (a: number) => `rgba(245,240,235,${a})`

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-4 py-5 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl shrink-0"
            style={{
              background: 'rgba(224,107,73,0.12)',
              border: '1px solid rgba(224,107,73,0.22)',
            }}
          >
            <GraduationCap className="h-4 w-4" style={{ color: '#e06b49' }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: '#f5f0eb' }}>
            CEFIS Tutor
          </span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 cursor-pointer"
              style={{
                background: active ? 'rgba(224,107,73,0.1)' : 'transparent',
                color: active ? '#e06b49' : T(0.45),
                fontWeight: active ? 500 : 400,
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Gerar Podcast CTA */}
      <div className="px-3 pb-3 shrink-0">
        <Link
          href="/podcast/generate"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer"
          style={{
            background: '#e06b49',
            color: '#f5f0eb',
            boxShadow: '0 0 16px rgba(224,107,73,0.22)',
          }}
        >
          <Mic className="h-4 w-4" />
          Gerar Podcast
        </Link>
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-sm transition-all duration-150 cursor-pointer hover:bg-white/5"
          style={{ color: T(0.3) }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair da conta
        </button>
      </div>
    </div>
  )
}

const SIDEBAR_STYLE: React.CSSProperties = {
  background: '#1a1a1a',
  borderRight: '1px solid rgba(255,255,255,0.07)',
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* ── Desktop: fixed sidebar ────────────────────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-56 flex-col z-40"
        style={SIDEBAR_STYLE}
      >
        <SidebarInner />
      </aside>

      {/* ── Mobile: floating hamburger ───────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        className="fixed top-3 left-3 z-50 md:hidden flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer"
        style={{
          background: '#242424',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        <Menu className="h-4 w-4" style={{ color: '#f5f0eb' }} />
      </button>

      {/* ── Mobile: slide-in overlay ─────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <aside
            className="absolute left-0 top-0 h-full w-56 flex flex-col"
            style={SIDEBAR_STYLE}
          >
            {/* Close button */}
            <div className="flex justify-end p-3 shrink-0">
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                style={{ color: T(0.4), background: 'rgba(255,255,255,0.05)' }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarInner onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
