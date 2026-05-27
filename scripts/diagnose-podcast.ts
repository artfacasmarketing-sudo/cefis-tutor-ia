import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  console.log('=== QUERY A: últimas 5 mensagens assistant com tool-gerar_podcast ===\n')

  const { data: messages, error: msgError } = await supabase
    .from('tutor_messages')
    .select('id, conversation_id, parts, created_at')
    .eq('role', 'assistant')
    .filter('parts', 'cs', '[{"type":"tool-gerar_podcast"}]')
    .order('created_at', { ascending: false })
    .limit(5)

  if (msgError) {
    console.error('Erro Query A:', msgError.message)
  } else {
    console.dir(messages, { depth: null })
  }

  console.log('\n=== QUERY B: últimos 5 generated_audios ===\n')

  const { data: audios, error: audioError } = await supabase
    .from('generated_audios')
    .select('id, title, status, error_message, storage_path, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (audioError) {
    console.error('Erro Query B:', audioError.message)
  } else {
    console.dir(audios, { depth: null })
  }

  // Analisa a estrutura dos parts
  if (messages && messages.length > 0) {
    console.log('\n=== ANÁLISE: shape dos parts tool-gerar_podcast ===\n')
    for (const msg of messages) {
      const parts = msg.parts as Array<Record<string, unknown>>
      const podcastPart = parts?.find(p => p.type === 'tool-gerar_podcast')
      if (podcastPart) {
        console.log(`Mensagem ${msg.id.slice(0, 8)}... (${msg.created_at.slice(0, 16)}):`)
        console.log('  type:', podcastPart.type)
        console.log('  state:', podcastPart.state)
        console.log('  output:', podcastPart.output)
        console.log('  result:', (podcastPart as Record<string, unknown>).result)
        console.log('  input:', podcastPart.input)
        console.log('  args:', (podcastPart as Record<string, unknown>).args)
        const hasOutput = podcastPart.output !== undefined && podcastPart.output !== null
        const hasAudioId = hasOutput && (podcastPart.output as Record<string, unknown>)?.audioId
        console.log('  → output presente:', hasOutput, '| audioId presente:', !!hasAudioId)
        console.log()
      }
    }
  }
}

main().catch(console.error)
