import { NextRequest } from 'next/server'
import { join } from 'path'
import { parseTranscripts } from '@/lib/ingest/parse'
import { embedAndStore } from '@/lib/ingest/embed'

export const maxDuration = 300

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { secret?: string }

  if (body.secret !== process.env.INGEST_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dataDir = join(process.cwd(), 'data', 'output')
  const start = Date.now()

  try {
    const rawChunks = await parseTranscripts(dataDir)

    let lastLog = 0
    const totalChunks = await embedAndStore(rawChunks, (done, total) => {
      if (done - lastLog >= 500) {
        console.log(`Ingest progress: ${done}/${total}`)
        lastLog = done
      }
    })

    return Response.json({
      ok: true,
      transcriptsProcessed: rawChunks.length,
      chunksEmbedded: totalChunks,
      timeMs: Date.now() - start,
    })
  } catch (err) {
    console.error('Ingest error:', err)
    return Response.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
