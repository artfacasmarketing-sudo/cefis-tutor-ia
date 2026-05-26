import OpenAI from 'openai'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import type { RawTranscriptChunk } from './parse'
import { chunkText } from './chunk'

const EMBED_BATCH = 100
const UPSERT_BATCH = 50

interface EmbedRow {
  lesson_id: string
  course_id: string
  lesson_title: string
  course_title: string
  chunk_index: number
  content: string
  embedding: number[]
}

export async function embedAndStore(
  rawChunks: RawTranscriptChunk[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const supabase = createSupabaseAdmin()

  // Expand raw transcripts into text chunks
  const rows: Omit<EmbedRow, 'embedding'>[] = []
  for (const raw of rawChunks) {
    const textChunks = chunkText(raw.text)
    textChunks.forEach((content, i) => {
      rows.push({
        lesson_id: raw.lessonId,
        course_id: raw.courseId,
        lesson_title: raw.lessonTitle,
        course_title: raw.courseTitle,
        chunk_index: i,
        content,
      })
    })
  }

  const total = rows.length
  let done = 0

  // Process in embed batches
  for (let i = 0; i < rows.length; i += EMBED_BATCH) {
    const batch = rows.slice(i, i + EMBED_BATCH)
    const texts = batch.map(r => r.content)

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: 1536,
    })

    const embedRows: EmbedRow[] = batch.map((row, idx) => ({
      ...row,
      embedding: response.data[idx]!.embedding,
    }))

    // Upsert in smaller batches to stay within Supabase request size
    for (let j = 0; j < embedRows.length; j += UPSERT_BATCH) {
      const upsertBatch = embedRows.slice(j, j + UPSERT_BATCH)
      const { error } = await supabase.from('transcripts').upsert(
        upsertBatch.map(r => ({
          lesson_id: r.lesson_id,
          course_id: r.course_id,
          lesson_title: r.lesson_title,
          course_title: r.course_title,
          chunk_index: r.chunk_index,
          content: r.content,
          embedding: JSON.stringify(r.embedding),
        })),
        { ignoreDuplicates: false },
      )
      if (error) throw new Error(`Supabase upsert error: ${error.message}`)
    }

    done += batch.length
    onProgress?.(done, total)
  }

  return total
}
