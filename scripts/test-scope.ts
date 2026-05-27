/**
 * Valida escopo rígido do tutor em 3 cenários.
 * Chama OpenAI diretamente com o system prompt construído por buildTutorPrompt.
 */
import OpenAI from 'openai'
import { buildTutorPrompt } from '@/lib/prompts/tutor'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const CTX_NO_RAG = {
  userName: 'Ana Beatriz Costa',
  objective: 'Analista do Banco do Brasil',
  learningStyle: 'pratico' as const,
  ragContext: '(sem trechos disponíveis para este tema)',
  hasChunks: false,
  topChunks: [] as Pick<import('@/lib/ai/rag').RagChunk, 'courseTitle' | 'lessonTitle'>[],
  domainMap: {
    'Contabilidade Geral':  { accuracy: 58, count: 2, gap: true, courses: [] },
    'Direito Administrativo': { accuracy: 71, count: 3, gap: true, courses: [] },
    'Português': { accuracy: 85, count: 5, gap: false, courses: [] },
  },
}

const CTX_WITH_RAG = {
  ...CTX_NO_RAG,
  ragContext: `[Fonte 1] Curso: "Direito Administrativo para BB" — Aula: "Princípios Constitucionais da Administração Pública"\n\nO princípio da legalidade no direito público difere do direito privado: enquanto o particular pode fazer tudo que a lei não proíbe, a Administração só pode fazer o que a lei autoriza expressamente. Esse é o cerne do princípio da legalidade estrita.`,
  hasChunks: true,
  topChunks: [
    { courseTitle: 'Direito Administrativo para BB', lessonTitle: 'Princípios Constitucionais da Administração Pública' },
  ],
}

const TESTS = [
  {
    label: 'TESTE 1 — Fora do escopo (LangChain)',
    ctx: CTX_NO_RAG,
    msg: 'Oq é LangChain?',
    expectRedirect: true,
  },
  {
    label: 'TESTE 2 — Dentro do escopo com RAG (Princípio da Legalidade)',
    ctx: CTX_WITH_RAG,
    msg: 'Me explica o princípio da legalidade',
    expectRedirect: false,
  },
  {
    label: 'TESTE 3 — Fora do escopo (Pizza)',
    ctx: CTX_NO_RAG,
    msg: 'Me ensina a fazer pizza',
    expectRedirect: true,
  },
]

async function runTest(label: string, ctx: typeof CTX_NO_RAG, msg: string, expectRedirect: boolean) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`${label}`)
  console.log(`Pergunta: "${msg}"`)
  console.log('═'.repeat(60))

  const systemPrompt = buildTutorPrompt(ctx)

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: msg },
    ],
    max_tokens: 200,
    temperature: 0.3,
  })

  const reply = res.choices[0]?.message?.content ?? ''
  console.log('\nResposta:')
  console.log(reply)

  // Heurísticas simples de validação
  const mentionsOutOfScope = /fora do que cubro|fora do escopo|programação|concurso|gap/i.test(reply)
  const mentionsCEFIS = /curso|aula|CEFIS/i.test(reply)
  const hasCitation = /aula|curso.*professor|professor.*curso/i.test(reply)

  if (expectRedirect) {
    if (mentionsOutOfScope) {
      console.log('\n✅ PASS — Redirecionou corretamente para escopo de concurso')
    } else {
      console.log('\n❌ FAIL — Respondeu fora do escopo sem redirecionar')
    }
  } else {
    if (mentionsCEFIS || hasCitation) {
      console.log('\n✅ PASS — Respondeu com citação de aula CEFIS')
    } else {
      console.log('\n⚠️  PARCIAL — Respondeu dentro do escopo, mas sem citar aula específica')
    }
  }
}

async function main() {
  console.log('\nCEFIS Tutor IA — Teste de Escopo Rígido')
  console.log('Model: gpt-4o-mini | Aluno: Ana Beatriz Costa\n')

  for (const t of TESTS) {
    await runTest(t.label, t.ctx, t.msg, t.expectRedirect)
  }

  console.log('\n' + '═'.repeat(60))
  console.log('Teste concluído.')
  console.log('═'.repeat(60) + '\n')
}

main().catch(console.error)
