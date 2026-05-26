import type { RagChunk } from '@/lib/ai/rag'

export interface PodcastScriptContext {
  studentName: string
  objective: string | null
  topics: string[]
  chunks: RagChunk[]
}

export function buildPodcastSystemPrompt(firstName: string): string {
  return `Você é um roteirista de podcasts educacionais em português brasileiro. Cria scripts envolventes e didáticos no estilo de um podcast de estudos para concursos.

REGRAS DO SCRIPT:
- Escreva como fala humana natural — sem markdown, sem asteriscos, sem listas com hífens
- Estrutura: abertura calorosa (10s), desenvolvimento do tema (1 min), fechamento motivador (10s)
- Tom: professoral mas descontraído
- Comece SEMPRE com: "Olá ${firstName}, bem-vindo ao seu Tutor CEFIS!"
- Use as transcrições como BASE — cite naturalmente: "Como vimos no curso de [tema]..."
- MÁXIMO 150 palavras. Seja extremamente conciso. Script de 1 minuto.
- Idioma: SOMENTE português brasileiro`
}

export function buildPodcastUserPrompt(ctx: PodcastScriptContext): string {
  const topicsText = ctx.topics.join(', ')

  const sourcesText =
    ctx.chunks.length > 0
      ? ctx.chunks
          .map(
            (c, i) =>
              `[Fonte ${i + 1}] Curso: "${c.courseTitle}" — Aula: "${c.lessonTitle}"\n${c.content}`,
          )
          .join('\n\n---\n\n')
      : 'Sem trechos específicos — use conhecimento geral sobre o tema.'

  return `Gere o script de podcast para: ${ctx.studentName}${ctx.objective ? `, estudando para ${ctx.objective}` : ''}.

TEMAS DO EPISÓDIO (áreas com mais lacunas no desempenho do aluno):
${topicsText}

TRECHOS DAS AULAS CEFIS (use como conteúdo principal):
${sourcesText}

Escreva o script completo de ~800 palavras em português brasileiro. Apenas o texto do roteiro, sem indicações de cena ou formatação.`
}
