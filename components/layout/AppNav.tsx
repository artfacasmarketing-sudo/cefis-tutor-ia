'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, LayoutDashboard, MessageSquare, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'

const T = 'rgba(245,240,235,'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/chat', label: 'Chat', icon: MessageSquare, exact: false },
  { href: '/podcast', label: 'Podcasts', icon: Mic, exact: false },
]

export function AppNav() {
  const pathname = usePathname()
  const isActive = (href: string, exact: boolean) => exact ? pathname === href : pathname.startsWith(href)

  return (
    <nav
      className="sticky top-0 z-50 flex h-14 items-center justify-between px-4 sm:px-6"
      style={{
        background: 'rgba(26,26,26,0.92)',
        backdropFilter: 'blur(16px) saturate(150%)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Brand + links */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(224,107,73,0.12)', border: '1px solid rgba(224,107,73,0.2)' }}
          >
            <GraduationCap className="h-3.5 w-3.5" style={{ color: '#e06b49' }} />
          </div>
          <span className="text-sm font-semibold hidden sm:block" style={{ color: '#f5f0eb' }}>
            CEFIS Tutor
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition-all duration-150 cursor-pointer',
                )}
                style={{
                  background: active ? 'rgba(224,107,73,0.1)' : 'transparent',
                  color: active ? '#e06b49' : `${T}0.45)`,
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = `${T}0.75)`
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = `${T}0.45)`
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Link
          href="/podcast/generate"
          className="hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer"
          style={{
            background: pathname === '/podcast/generate' ? 'rgba(224,107,73,0.12)' : '#e06b49',
            color: pathname === '/podcast/generate' ? '#e06b49' : '#f5f0eb',
            border: pathname === '/podcast/generate' ? '1px solid rgba(224,107,73,0.2)' : 'none',
            boxShadow: pathname !== '/podcast/generate' ? '0 0 12px rgba(224,107,73,0.25)' : 'none',
          }}
        >
          <Mic className="h-3.5 w-3.5" />
          Gerar Podcast
        </Link>
        <LogoutButton />
      </div>
    </nav>
  )
}
