import { z } from 'zod'

export const saveProfileSchema = z.object({
  objective: z.string().min(1).describe('Objetivo/concurso principal do aluno'),
  availableHoursWeek: z
    .number()
    .int()
    .min(1)
    .max(84)
    .describe('Horas disponíveis por semana para estudar'),
  learningStyle: z
    .enum(['visual', 'auditivo', 'leitura', 'pratico'])
    .describe('Estilo de aprendizagem preferido'),
})

export type SaveProfileInput = z.infer<typeof saveProfileSchema>
