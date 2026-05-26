'use client'

import { createContext, useContext } from 'react'

interface ChatContextValue {
  sendMessage: (options: { text: string }) => void
}

const ChatContext = createContext<ChatContextValue>({
  sendMessage: () => {},
})

export const ChatContextProvider = ChatContext.Provider

export function useChatContext() {
  return useContext(ChatContext)
}
