import { z } from 'zod'

export const chatSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      parts: z.array(z.unknown()),
      metadata: z.unknown().optional(),
    }),
  ).min(1),
})
