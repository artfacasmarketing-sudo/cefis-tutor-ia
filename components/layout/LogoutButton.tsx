'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs transition-all duration-150 cursor-pointer"
      style={{ color: 'rgba(245,240,235,0.3)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,235,0.65)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,235,0.3)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      aria-label="Sair da conta"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Sair</span>
    </button>
  )
}
