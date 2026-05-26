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
      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors py-1.5 px-2 rounded-lg hover:bg-zinc-100"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Sair</span>
    </button>
  )
}
