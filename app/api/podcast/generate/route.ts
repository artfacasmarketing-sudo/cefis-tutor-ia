import { after } from 'next/server'
import { cookies } from 'next/headers'
import OpenAI from 'openai'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { matchTranscripts } from '@/lib/ai/rag'
import { buildPodcastSystemPrompt, buildPodcastUserPrompt } from '@/lib/prompts/podcast'
import type { DomainMap } from '@/types/domain'

async function generateScript(
  openai: OpenAI,
  ctx: Parameters<typeof buildPodcastUserPrompt>[0],
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: buildPodcastSystemPrompt(ctx.studentName.split(' ')[0]) },
      { role: 'user', content: buildPodcastUserPrompt(ctx) },
    ],
    max_tokens: 1800,
    temperature: 0.75,
  })
  return completion.choices[0]?.message?.content ?? ''
}

async function generateAudio(script: string): Promise<Buffer> {
  const voiceId = process.env.ELEVENLABS_VOICE_ID!
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  )

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText)
    throw new Error(`ElevenLabs ${res.status}: ${err}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

export async function POST() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('cefis_user_id')?.value
  if (!userId) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  const supabase = createSupabaseAdmin()

  const { data: profile } = await supabase
    .from('student_profiles')
    .select('id, name, objective, domain_map')
    .eq('cefis_user_id', userId)
    .single()

  if (!profile) return Response.json({ error: 'Perfil não encontrado' }, { status: 404 })

  const domainMap = (profile.domain_map ?? {}) as DomainMap
  const gaps = Object.entries(domainMap)
    .filter(([, v]) => v.gap)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, 3)
    .map(([name]) => name)

  if (gaps.length === 0) {
    gaps.push(profile.objective ?? 'Direito Administrativo')
  }

  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
  const title = `${gaps[0]} e mais — ${dateStr}`

  const { data: audio, error: insertErr } = await supabase
    .from('generated_audios')
    .insert({
      student_profile_id: profile.id,
      title,
      script: '',
      status: 'generating',
      topics: gaps,
    })
    .select('id')
    .single()

  if (insertErr || !audio) {
    return Response.json({ error: 'Falha ao criar registro' }, { status: 500 })
  }

  // Kick off the full pipeline without blocking the response
  after(async () => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    try {
      // Fetch RAG chunks for all gap topics in parallel
      const chunkSets = await Promise.all(
        gaps.map(gap => matchTranscripts(gap, { threshold: 0.68, count: 3 })),
      )
      const chunks = chunkSets.flat()

      // Generate podcast script with GPT-4o
      const script = await generateScript(openai, {
        studentName: profile.name ?? 'Aluno',
        objective: profile.objective,
        topics: gaps,
        chunks,
      })

      // Save script immediately (useful for player to show text while audio generates)
      await supabase
        .from('generated_audios')
        .update({ script })
        .eq('id', audio.id)

      // Generate audio with ElevenLabs
      const audioBuffer = await generateAudio(script)

      // Upload to Supabase Storage
      const storagePath = `${userId}/${audio.id}.mp3`
      const { error: uploadErr } = await supabase.storage
        .from('tutor-audios')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        })

      if (uploadErr) throw new Error(`Storage: ${uploadErr.message}`)

      await supabase
        .from('generated_audios')
        .update({ storage_path: storagePath, status: 'ready' })
        .eq('id', audio.id)

    } catch (err) {
      console.error('Podcast generation error:', err)
      await supabase
        .from('generated_audios')
        .update({
          status: 'error',
          error_message: (err as Error).message,
        })
        .eq('id', audio.id)
    }
  })

  return Response.json({ audioId: audio.id, status: 'generating' })
}
