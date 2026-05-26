'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChat = pathname.startsWith('/chat')

  return (
    <div className="flex min-h-screen" style={{ background: '#1a1a1a' }}>
      {/* Main nav sidebar — hidden on /chat (ConversationsSidebar takes over) */}
      {!isChat && <Sidebar />}

      {/* Content area */}
      <div className={`flex-1 min-w-0 ${!isChat ? 'md:pl-56 pt-14 md:pt-0' : ''}`}>
        {children}
      </div>
    </div>
  )
}
