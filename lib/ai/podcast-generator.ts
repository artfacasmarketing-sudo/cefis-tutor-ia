import OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { matchTranscripts } from '@/lib/ai/rag'
import { buildPodcastSystemPrompt, buildPodcastUserPrompt } from '@/lib/prompts/podcast'

export async function generatePodcastBackground(
  audioId: string,
  topico: string,
  profileId: string,
  supabase: SupabaseClient,
): Promise<void> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('name, objective')
      .eq('id', profileId)
      .single()

    const firstName = (profile?.name ?? 'Aluno').split(' ')[0]!
    const chunks = await matchTranscripts(topico, { threshold: 0.68, count: 3 })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildPodcastSystemPrompt(firstName) },
        {
          role: 'user',
          content: buildPodcastUserPrompt({
            studentName: firstName,
            objective: profile?.objective ?? null,
            topics: [topico],
            chunks,
          }),
        },
      ],
      max_tokens: 600,
      temperature: 0.75,
    })

    const script = completion.choices[0]?.message?.content ?? ''
    await supabase.from('generated_audios').update({ script }).eq('id', audioId)

    // TTS
    const voiceId = process.env.ELEVENLABS_VOICE_ID!
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
    })
    if (!ttsRes.ok) throw new Error(`ElevenLabs ${ttsRes.status}`)

    const buffer = Buffer.from(await ttsRes.arrayBuffer())
    const storagePath = `${profileId}/${audioId}.mp3`
    const { error: uploadErr } = await supabase.storage
      .from('tutor-audios')
      .upload(storagePath, buffer, { contentType: 'audio/mpeg', upsert: true })
    if (uploadErr) throw new Error(`Storage: ${uploadErr.message}`)

    await supabase
      .from('generated_audios')
      .update({ storage_path: storagePath, status: 'ready' })
      .eq('id', audioId)

  } catch (err) {
    await supabase
      .from('generated_audios')
      .update({ status: 'error', error_message: (err as Error).message })
      .eq('id', audioId)
  }
}
