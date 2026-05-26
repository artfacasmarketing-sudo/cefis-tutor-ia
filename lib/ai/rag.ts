import { createSupabaseAdmin } from '@/lib/supabase/server'
import { embed } from './embeddings'

export interface RagChunk {
  id: string
  lessonId: string
  courseId: string
  lessonTitle: string
  courseTitle: string
  content: string
  similarity: number
}

interface RpcRow {
  id: string
  lesson_id: string
  course_id: string
  lesson_title: string
  course_title: string
  content: string
  similarity: number
}

export async function matchTranscripts(
  query: string,
  opts?: { threshold?: number; count?: number },
): Promise<RagChunk[]> {
  const embedding = await embed(query)
  const supabase = createSupabaseAdmin()

  const { data, error } = await supabase.rpc('match_transcripts', {
    query_embedding: embedding,
    match_threshold: opts?.threshold ?? 0.72,
    match_count: opts?.count ?? 5,
  })

  if (error) throw new Error(`RAG query failed: ${error.message}`)
  if (!data) return []

  return (data as RpcRow[]).map(row => ({
    id: row.id,
    lessonId: row.lesson_id,
    courseId: row.course_id,
    lessonTitle: row.lesson_title,
    courseTitle: row.course_title,
    content: row.content,
    similarity: row.similarity,
  }))
}

export function formatRagContext(chunks: RagChunk[]): string {
  if (chunks.length === 0) {
    return 'Nenhum trecho específico encontrado nas transcrições.'
  }

  return chunks
    .map(
      (c, i) =>
        `[Fonte ${i + 1}] Curso: "${c.courseTitle}" | Aula: "${c.lessonTitle}"\n${c.content}`,
    )
    .join('\n\n---\n\n')
}
