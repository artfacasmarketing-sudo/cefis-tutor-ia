'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GraduationCap, LayoutDashboard, MessageSquare, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from './LogoutButton'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/chat', label: 'Chat', icon: MessageSquare, exact: false },
  { href: '/podcast', label: 'Podcasts', icon: Mic, exact: false },
]

export function AppNav() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <nav
      className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] px-4 sm:px-6"
      style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(20px) saturate(180%)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-5">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/30 transition-all group-hover:ring-indigo-400/50">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-gradient hidden sm:block">
            CEFIS Tutor
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all duration-150 cursor-pointer',
                  active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-indigo-400' : '')} />
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
          className={cn(
            'hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer',
            pathname === '/podcast/generate'
              ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30'
              : 'bg-indigo-600 text-white hover:bg-indigo-500',
          )}
          style={pathname !== '/podcast/generate' ? { boxShadow: '0 0 12px rgba(99,102,241,0.3)' } : {}}
        >
          <Mic className="h-3.5 w-3.5" />
          Gerar Podcast
        </Link>
        <LogoutButton />
      </div>
    </nav>
  )
}
