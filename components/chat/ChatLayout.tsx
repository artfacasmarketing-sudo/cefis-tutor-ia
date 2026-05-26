'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UIMessage } from 'ai'
import { ConversationsSidebar } from './ConversationsSidebar'
import { TutorChat } from './TutorChat'

interface ChatLayoutProps {
  conversationId: string | null
  initialMessages: UIMessage[]
}

export function ChatLayout({ conversationId, initialMessages }: ChatLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] relative">
      {/* Conversations sidebar */}
      <ConversationsSidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main chat — offset for ConversationsSidebar (left-0, w-[280px]) on desktop */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[280px] pt-14 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={conversationId ?? 'empty'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            <TutorChat
              conversationId={conversationId}
              initialMessages={initialMessages}
              onOpenSidebar={() => setMobileSidebarOpen(true)}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
