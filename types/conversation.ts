export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ConversationListItem extends Conversation {
  messageCount: number
  lastMessageAt: string
  lastUserMessage: string | null
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  parts: unknown[] | null
  createdAt: string
}
