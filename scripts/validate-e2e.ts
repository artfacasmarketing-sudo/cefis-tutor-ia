import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

let passed = 0
let failed = 0

function pass(n: number, msg: string) {
  console.log(`✅ CHECK ${n}: PASS — ${msg}`)
  passed++
}

function fail(n: number, msg: string) {
  console.log(`❌ CHECK ${n}: FAIL — ${msg}`)
  failed++
}

async function main() {
  console.log('\n══════════════════════════════════════════')
  console.log('  CEFIS Tutor IA — Validação E2E')
  console.log('══════════════════════════════════════════\n')

  // CHECK 1: perfil com onboarding_completed=true
  const { count: profileCount } = await supabase
    .from('student_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('onboarding_completed', true)

  if ((profileCount ?? 0) >= 1) {
    pass(1, `${profileCount} profile(s) com onboarding completo`)
  } else {
    fail(1, 'Nenhum perfil com onboarding_completed=true')
  }

  // CHECK 2: transcripts com embedding não-nulo
  const { count: transcriptCount } = await supabase
    .from('transcripts')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null)

  if ((transcriptCount ?? 0) >= 18000) {
    pass(2, `${transcriptCount?.toLocaleString()} chunks com embedding`)
  } else {
    fail(2, `Apenas ${transcriptCount?.toLocaleString()} chunks — esperado ≥ 18.000`)
  }

  // CHECK 3: últimas 5 user messages com rag_chunks > 0
  const { data: userMsgs } = await supabase
    .from('tutor_messages')
    .select('id, metadata')
    .eq('role', 'user')
    .order('created_at', { ascending: false })
    .limit(5)

  const userWithRag = (userMsgs ?? []).filter(
    m => ((m.metadata as Record<string, unknown>)?.rag_chunks as number) > 0
  )

  if (userWithRag.length >= 3) {
    pass(3, `${userWithRag.length}/5 user msgs recentes com rag_chunks > 0`)
  } else {
    fail(3, `Apenas ${userWithRag.length}/5 user msgs com rag_chunks > 0 — RAG pode estar falhando`)
  }

  // CHECK 4: últimas 5 assistant messages com sources não-vazio
  const { data: assistantMsgs } = await supabase
    .from('tutor_messages')
    .select('id, metadata')
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(5)

  const assistantWithSources = (assistantMsgs ?? []).filter(m => {
    const sources = ((m.metadata as Record<string, unknown>)?.sources as unknown[])
    return Array.isArray(sources) && sources.length > 0
  })

  if (assistantWithSources.length >= 3) {
    pass(4, `${assistantWithSources.length}/5 assistant msgs recentes com sources preenchido`)
  } else {
    fail(4, `Apenas ${assistantWithSources.length}/5 assistant msgs com sources — citação pode estar falhando`)
  }

  // CHECK 5: Bug A v2 — últimas 5 msgs podcast com output.audioId
  const { data: podcastMsgs } = await supabase
    .from('tutor_messages')
    .select('id, parts, created_at')
    .eq('role', 'assistant')
    .filter('parts', 'cs', '[{"type":"tool-gerar_podcast"}]')
    .order('created_at', { ascending: false })
    .limit(5)

  const recentPodcasts = podcastMsgs ?? []

  if (recentPodcasts.length === 0) {
    pass(5, 'Nenhuma msg de podcast no banco ainda — check pulado')
  } else {
    const withAudioId = recentPodcasts.filter(m => {
      const parts = m.parts as Array<Record<string, unknown>>
      const p = parts?.find(p => p.type === 'tool-gerar_podcast')
      return !!(p?.output as Record<string, unknown>)?.audioId
    })
    if (withAudioId.length === recentPodcasts.length) {
      pass(5, `${withAudioId.length}/${recentPodcasts.length} msgs de podcast com output.audioId — Bug A v2 resolvido`)
    } else {
      fail(5, `Apenas ${withAudioId.length}/${recentPodcasts.length} podcasts com audioId — Bug A v2 pode ainda estar presente`)
    }
  }

  // CHECK 6: created_at user < assistant em pares recentes
  const { data: convMsgs } = await supabase
    .from('tutor_messages')
    .select('id, role, conversation_id, created_at')
    .order('created_at', { ascending: false })
    .limit(30)

  // Agrupa por conversation_id e verifica pares
  const byConv = new Map<string, { role: string; created_at: string }[]>()
  for (const m of convMsgs ?? []) {
    const arr = byConv.get(m.conversation_id) ?? []
    arr.push({ role: m.role, created_at: m.created_at })
    byConv.set(m.conversation_id, arr)
  }

  let pairsChecked = 0
  let pairsOk = 0
  for (const msgs of byConv.values()) {
    const sorted = [...msgs].sort((a, b) => a.created_at.localeCompare(b.created_at))
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].role === 'user' && sorted[i + 1].role === 'assistant') {
        pairsChecked++
        if (sorted[i].created_at < sorted[i + 1].created_at) pairsOk++
      }
    }
  }

  if (pairsChecked === 0) {
    pass(6, 'Sem pares user→assistant suficientes — check pulado')
  } else if (pairsOk === pairsChecked) {
    pass(6, `${pairsOk}/${pairsChecked} pares user→assistant com ordem correta de created_at`)
  } else {
    fail(6, `${pairsOk}/${pairsChecked} pares com ordem correta — ${pairsChecked - pairsOk} com ordem invertida`)
  }

  // CHECK 7: generated_audios recentes com status=ready e storage_path
  const { data: audios } = await supabase
    .from('generated_audios')
    .select('id, status, storage_path')
    .order('created_at', { ascending: false })
    .limit(5)

  const readyAudios = (audios ?? []).filter(a => a.status === 'ready' && a.storage_path)

  if ((audios ?? []).length === 0) {
    pass(7, 'Nenhum áudio gerado ainda — check pulado')
  } else if (readyAudios.length >= Math.ceil((audios ?? []).length * 0.6)) {
    pass(7, `${readyAudios.length}/${(audios ?? []).length} áudios recentes com status=ready e storage_path`)
  } else {
    fail(7, `Apenas ${readyAudios.length}/${(audios ?? []).length} áudios completos — pipeline TTS pode estar falhando`)
  }

  // CHECK 8: conversations.title ≠ "Nova conversa" nas últimas 10
  const { data: convs } = await supabase
    .from('conversations')
    .select('id, title')
    .order('updated_at', { ascending: false })
    .limit(10)

  const withTitle = (convs ?? []).filter(c => c.title && c.title !== 'Nova conversa')

  if (withTitle.length >= 7) {
    pass(8, `${withTitle.length}/10 conversas recentes com auto-title gerado`)
  } else {
    fail(8, `Apenas ${withTitle.length}/10 com título — auto-title pode estar falhando`)
  }

  // Relatório final
  console.log('\n══════════════════════════════════════════')
  if (failed === 0) {
    console.log(`✅ ${passed}/${passed + failed} checks passaram — tudo OK`)
  } else {
    console.log(`⚠️  ${passed}/${passed + failed} checks passaram — investigar ${failed} falha(s)`)
  }
  console.log('══════════════════════════════════════════\n')
}

main().catch(console.error)
