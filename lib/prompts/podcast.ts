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
- Escreva como fala humana natural — sem marcadores markdown, sem asteriscos, sem listas com hífens
- Estrutura: abertura calorosa (20s), desenvolvimento do tema (4 min), fechamento motivador (30s)
- Tom: professoral mas descontraído, como um professor particular empolgado
- Comece SEMPRE com: "Olá ${firstName}, bem-vindo a mais um episódio do seu Tutor CEFIS!"
- Use as transcrições das aulas como BASE — cite as fontes naturalmente: "Como vimos no curso de [tema]..."
- Alterne explicações teóricas com exemplos práticos de questões de concurso
- Use conectivos de podcast: "agora vamos falar sobre...", "e por que isso importa?", "veja bem..."
- Extensão: exatamente 800 palavras (±50) para gerar ~5 minutos de áudio
- Idioma: SOMENTE português brasileiro — sem termos em inglês`
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
