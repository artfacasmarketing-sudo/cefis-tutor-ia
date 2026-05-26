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
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-white/35 hover:text-white/70 hover:bg-white/5 transition-all duration-150 cursor-pointer"
      aria-label="Sair da conta"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Sair</span>
    </button>
  )
}
