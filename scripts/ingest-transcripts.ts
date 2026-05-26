import * as fs from 'fs'
import * as path from 'path'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const DATA_DIR = path.join(process.cwd(), 'data', 'output')
const EMBED_BATCH = 100
const INSERT_BATCH = 50

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function parseVtt(content: string): string {
  return content.split('\n')
    .filter(l => !l.startsWith('WEBVTT') && !l.match(/^\d{2}:\d{2}:\d{2}/) && l.trim() !== '')
    .map(l => l.replace(/^- /, '').trim())
    .join(' ').replace(/\s+/g, ' ').trim()
}

function chunkText(text: string): string[] {
  const words = text.split(' ')
  const chunks: string[] = []
  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + 380).join(' ')
    if (chunk.trim().length > 80) chunks.push(chunk)
    i += 340
  }
  return chunks
}

function getMeta(courseId: string, lessonId: string) {
  let courseTitle = `Curso ${courseId}`, lessonTitle = `Aula ${lessonId}`
  try { courseTitle = JSON.parse(fs.readFileSync(path.join(DATA_DIR, courseId, 'details.json'), 'utf-8')).data?.title ?? courseTitle } catch {}
  try { lessonTitle = JSON.parse(fs.readFileSync(path.join(DATA_DIR, courseId, 'lessons', lessonId, 'details.json'), 'utf-8')).title ?? lessonTitle } catch {}
  return { courseTitle, lessonTitle }
}

function findVtts() {
  const results: { vttPath: string; courseId: string; lessonId: string }[] = []
  if (!fs.existsSync(DATA_DIR)) { console.error('❌ data/output não encontrado'); return results }
  for (const c of fs.readdirSync(DATA_DIR).filter(d => /^\d+$/.test(d))) {
    const ld = path.join(DATA_DIR, c, 'lessons')
    if (!fs.existsSync(ld)) continue
    for (const l of fs.readdirSync(ld).filter(d => /^\d+$/.test(d))) {
      const vtt = fs.readdirSync(path.join(ld, l)).find(f => f.startsWith('subtitle_pt') && f.endsWith('.vtt'))
      if (vtt) results.push({ vttPath: path.join(ld, l, vtt), courseId: c, lessonId: l })
    }
  }
  return results
}

async function main() {
  console.log('🔍 Mapeando transcrições...')
  const vtts = findVtts()
  console.log(`✅ ${vtts.length} VTTs encontrados`)

  const chunks: any[] = []
  for (const { vttPath, courseId, lessonId } of vtts) {
    const text = parseVtt(fs.readFileSync(vttPath, 'utf-8'))
    if (text.length < 80) continue
    const { courseTitle, lessonTitle } = getMeta(courseId, lessonId)
    chunkText(text).forEach((content, i) =>
      chunks.push({ course_id: courseId, course_title: courseTitle, lesson_id: lessonId, lesson_title: lessonTitle, chunk_index: i, content, metadata: {} })
    )
  }
  console.log(`📦 ${chunks.length} chunks | 💰 ~$${(chunks.length * 500 / 1_000_000 * 0.02).toFixed(3)}`)

  await supabase.from('transcripts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  let done = 0
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH)
    try {
      const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: batch.map((c: any) => c.content), dimensions: 1536 })
      const rows = batch.map((c: any, j: number) => ({ ...c, embedding: res.data[j].embedding }))
      for (let k = 0; k < rows.length; k += INSERT_BATCH) {
        const { error } = await supabase.from('transcripts').insert(rows.slice(k, k + INSERT_BATCH))
        if (error) console.error(`\n❌ ${error.message}`)
      }
    } catch (e: any) { console.error(`\n❌ Batch ${i}:`, e.message) }
    done += batch.length
    process.stdout.write(`\r⚡ ${done}/${chunks.length} (${((done/chunks.length)*100).toFixed(1)}%)`)
    await new Promise(r => setTimeout(r, 80))
  }

  const { count } = await supabase.from('transcripts').select('*', { count: 'exact', head: true })
  console.log(`\n✅ Ingestão completa — ${count} chunks no banco`)
}

main().catch(console.error)
