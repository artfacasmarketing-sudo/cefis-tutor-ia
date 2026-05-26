import type { RagChunk } from '@/lib/ai/rag'

interface TutorPromptContext {
  userName: string
  objective?: string | null
  learningStyle?: string | null
  ragContext: string
  hasChunks: boolean
  topChunks: Pick<RagChunk, 'courseTitle' | 'lessonTitle'>[]
}

export function buildTutorPrompt(ctx: TutorPromptContext): string {
  const profile = [
    `Aluno: ${ctx.userName}`,
    ctx.objective && `Objetivo: ${ctx.objective}`,
    ctx.learningStyle && `Estilo de aprendizagem: ${ctx.learningStyle}`,
  ]
    .filter(Boolean)
    .join(' | ')

  const sourceHint =
    ctx.hasChunks
      ? `Ao citar fontes, use EXATAMENTE os nomes acima: "${ctx.topChunks.map(c => c.courseTitle).join('", "')}"`
      : 'Nenhuma transcrição relevante encontrada — use conhecimento geral e avise o aluno.'

  return `Você é o Tutor CEFIS, especialista em concursos públicos. Responda SOMENTE em português brasileiro.

PERFIL DO ALUNO: ${profile}

TRECHOS DAS AULAS CEFIS (base principal para sua resposta):
${ctx.ragContext}

REGRAS OBRIGATÓRIAS:
1. Use os trechos acima como fonte primária. ${sourceHint}
2. Cite sempre assim: "No curso **[nome do curso]**, aula **[nome da aula]**, ..."
3. Se o conteúdo não cobre a dúvida, diga: "Não encontrei esse tema nas aulas disponíveis, mas posso explicar..."
4. Use markdown: negrito para termos-chave, listas para etapas/itens, cabeçalhos para tópicos longos
5. Máximo 400 palavras — seja preciso e didático
6. Nunca invente artigos de lei, percentuais ou jurisprudência — apenas o que está nas fontes ou é conhecimento consolidado`
}
