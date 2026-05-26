'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, MessageSquare, Mic } from 'lucide-react'
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
    <nav className="bg-white border-b border-zinc-200 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-50">
      {/* Brand + Links */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/dashboard"
          className="text-sm font-bold text-zinc-900 mr-2 sm:mr-4 shrink-0"
        >
          CEFIS Tutor
        </Link>

        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 transition-colors',
              isActive(href, exact)
                ? 'bg-zinc-900 text-white font-medium'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <Link
          href="/podcast/generate"
          className={cn(
            'hidden md:flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors',
            pathname === '/podcast/generate'
              ? 'bg-zinc-200 text-zinc-900'
              : 'bg-zinc-900 text-white hover:bg-zinc-700',
          )}
        >
          <Mic className="h-3.5 w-3.5" />
          Gerar Podcast
        </Link>
        <LogoutButton />
      </div>
    </nav>
  )
}
