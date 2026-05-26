# Plano de Execução — CEFIS Tutor IA (Hackathon, deadline 26/05 23h59 EST)

**Stack observada:** Next.js 16.2.6 · React 19 · ai@6.0.191 · @ai-sdk/openai@3.0.65 · Supabase local init · shadcn base-nova · Tailwind v4

---

## 1. Estrutura completa de pastas

```
cefis-tutor-ia/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx                   # Root layout, metadados, fontes
│   ├── page.tsx                     # Redirect → /login ou /dashboard
│   │
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # Server page: form de login CEFIS
│   │
│   ├── (app)/
│   │   ├── layout.tsx               # Protected layout: valida cookie, AppShell
│   │   ├── onboarding/
│   │   │   └── page.tsx             # Chat conversacional de onboarding
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Mapa de domínio + plano de estudo
│   │   ├── chat/
│   │   │   └── page.tsx             # Tutor chat com RAG
│   │   ├── plano/
│   │   │   └── page.tsx             # Plano de estudo detalhado
│   │   └── podcast/
│   │       └── page.tsx             # Geração e player de podcast
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts       # POST — autentica na CEFIS, seta cookie
│       │   ├── logout/route.ts      # POST — limpa cookie
│       │   └── me/route.ts          # GET  — retorna perfil CEFIS atual
│       ├── onboarding/
│       │   ├── chat/route.ts        # POST streaming — conversa de onboarding
│       │   └── complete/route.ts    # POST — salva perfil completo no Supabase
│       ├── diagnosis/
│       │   └── route.ts             # GET  — analisa certificates, retorna domain_map
│       ├── study-plan/
│       │   └── route.ts             # GET  — gera plano combinando catálogo + gaps
│       ├── chat/
│       │   └── route.ts             # POST streaming — tutor chat com RAG
│       ├── podcast/
│       │   ├── generate/route.ts    # POST — gera script (gpt-4o) + TTS + upload
│       │   └── [id]/route.ts        # GET  — status/URL do podcast gerado
│       └── ingest/
│           └── route.ts             # POST — admin: processa transcricoes → pgvector
│
├── components/
│   ├── ui/                          # shadcn (já existente)
│   ├── auth/
│   │   └── LoginForm.tsx            # "use client" — form com estado + submit
│   ├── onboarding/
│   │   ├── OnboardingChat.tsx       # "use client" — useChat wrapper
│   │   └── MessageBubble.tsx        # Render de mensagem com markdown
│   ├── chat/
│   │   ├── TutorChat.tsx            # "use client" — chat principal
│   │   ├── ChatMessage.tsx          # Render markdown + citações
│   │   └── SourceCitation.tsx       # Badge com aula/curso de origem
│   ├── dashboard/
│   │   ├── DomainMap.tsx            # Gráfico de domínio por categoria
│   │   ├── StudyPlanCard.tsx        # Card de item do plano
│   │   └── ProgressCard.tsx         # Card de progresso/certificados
│   ├── podcast/
│   │   ├── PodcastPlayer.tsx        # "use client" — wavesurfer.js player
│   │   └── GenerateButton.tsx       # "use client" — trigger + polling de status
│   └── layout/
│       ├── AppShell.tsx             # Server — shell com sidebar + topbar
│       ├── Sidebar.tsx              # Server — navegação lateral
│       └── TopBar.tsx               # "use client" — avatar, logout
│
├── lib/
│   ├── utils.ts                     # cn() (já existente)
│   ├── cefis/
│   │   ├── client.ts                # Cliente CEFIS v1+v3 com retry/timeout
│   │   └── types.ts                 # Tipos: CefisUser, Course, Lesson, Certificate
│   ├── supabase/
│   │   ├── server.ts                # createServerClient (cookies())
│   │   └── client.ts                # createBrowserClient (singleton)
│   ├── ai/
│   │   ├── openai.ts                # Instância OpenAI (não o ai-sdk, o SDK direto)
│   │   ├── embeddings.ts            # embed(text): Promise<number[]>
│   │   └── rag.ts                   # matchTranscripts(query, k): Promise<Chunk[]>
│   ├── prompts/
│   │   ├── onboarding.ts            # System prompt do onboarding
│   │   ├── tutor.ts                 # System prompt do tutor chat
│   │   ├── podcast.ts               # Prompt de geração de script de podcast
│   │   └── diagnosis.ts             # Prompt de análise de lacunas
│   ├── schemas/
│   │   ├── auth.ts                  # z.object({ email, password })
│   │   ├── onboarding.ts            # z.object({ message, profileId? })
│   │   ├── chat.ts                  # z.object({ messages, profileId })
│   │   └── podcast.ts               # z.object({ profileId, topics? })
│   └── ingest/
│       ├── parse.ts                 # Lê/descomprime transcricoes, retorna chunks raw
│       ├── chunk.ts                 # Divide texto em chunks ~500 tokens com overlap
│       └── embed.ts                 # Itera chunks, embed, upsert Supabase
│
├── hooks/
│   ├── useStreamingChat.ts          # Wrapper tipado sobre useChat do ai@6
│   └── usePodcast.ts                # Poll GET /api/podcast/:id até status=ready
│
├── types/
│   ├── cefis.ts                     # Re-exports de lib/cefis/types.ts
│   ├── database.ts                  # Tipos gerados/manual das tabelas Supabase
│   └── domain.ts                    # DomainMap, Gap, StudyItem
│
├── middleware.ts                    # Protege (app)/* — redireciona se sem cookie
├── .env.local                       # Vars de ambiente (ver seção 3 do plano)
└── supabase/
    └── migrations/
        └── 001_initial.sql          # Schema completo (ver seção 2)
```

---

## 2. Schema SQL do Supabase

```sql
-- 001_initial.sql

-- Habilita pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Transcrições das aulas (RAG)
CREATE TABLE transcripts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     TEXT NOT NULL,
  course_id     TEXT NOT NULL,
  lesson_title  TEXT NOT NULL,
  course_title  TEXT NOT NULL,
  chunk_index   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  embedding     vector(1536),
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usar linear scan inicialmente (IVFFlat precisa >100 rows para ser útil)
-- Após ingest, trocar por: CREATE INDEX ... USING ivfflat (lists = 100)
CREATE INDEX transcripts_lesson_idx  ON transcripts (lesson_id);
CREATE INDEX transcripts_course_idx  ON transcripts (course_id);

-- Perfis dos alunos (chave: cefis_user_id)
CREATE TABLE student_profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cefis_user_id         TEXT UNIQUE NOT NULL,
  name                  TEXT,
  occupation            TEXT,
  nivel                 TEXT,
  is_premium            BOOLEAN NOT NULL DEFAULT FALSE,
  objective             TEXT,
  available_hours_week  INTEGER,
  learning_style        TEXT CHECK (learning_style IN ('visual','auditivo','leitura','pratico')),
  domain_map            JSONB NOT NULL DEFAULT '{}',
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mensagens do chat tutor
CREATE TABLE tutor_messages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  role               TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content            TEXT NOT NULL,
  metadata           JSONB NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tutor_messages_profile_idx
  ON tutor_messages (student_profile_id, created_at DESC);

-- Podcasts gerados
CREATE TABLE generated_audios (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_profile_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  script             TEXT NOT NULL,
  storage_path       TEXT,
  duration_seconds   INTEGER,
  topics             JSONB NOT NULL DEFAULT '[]',
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','generating','ready','error')),
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RPC para busca semântica (retorna similarity decrescente)
CREATE OR REPLACE FUNCTION match_transcripts(
  query_embedding  vector(1536),
  match_threshold  FLOAT DEFAULT 0.72,
  match_count      INTEGER DEFAULT 5
)
RETURNS TABLE (
  id            UUID,
  lesson_id     TEXT,
  course_id     TEXT,
  lesson_title  TEXT,
  course_title  TEXT,
  content       TEXT,
  similarity    FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    lesson_id,
    course_id,
    lesson_title,
    course_title,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM transcripts
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Storage bucket (executar via dashboard ou API após migration)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tutor-audios', 'tutor-audios', false);

-- Trigger para updated_at em student_profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Notas do schema:**
- Supabase Auth NÃO é usado: o ID do aluno é o `cefis_user_id` (id numérico/string retornado por `/user/me`). A key CEFIS fica só no cookie httpOnly — nunca no Supabase.
- RLS desabilitada intencionalmente: todas as queries são server-side com service role key. Para demo de hackathon, isso é suficiente e elimina horas de debugging de policies.
- IVFFlat index deve ser criado DEPOIS do ingest (precisa de no mínimo 100 vetores para ter ganho real). Enquanto a tabela está vazia ou pequena, o scan linear é mais rápido.

---

## 3. Route Handlers — Especificação

### `POST /api/auth/login`
- **Zod input:** `{ email: z.string().email(), password: z.string().min(1) }`
- **Lógica:** POST `https://cefis.com.br/api/v1/login` → recebe `{ data: { key, user } }` → seta cookie `cefis_key` httpOnly, Secure, SameSite=Lax, maxAge=7d → seta cookie `cefis_user_id` (não httpOnly, lido no client)
- **Output:** `{ ok: true, user: CefisUser }`
- **Feature:** Auth (1)

### `POST /api/auth/logout`
- **Zod input:** nenhum
- **Lógica:** deleta cookies `cefis_key` e `cefis_user_id`
- **Output:** `{ ok: true }`
- **Feature:** Auth (1)

### `GET /api/auth/me`
- **Zod input:** nenhum (lê cookie)
- **Lógica:** lê `cefis_key` do cookie → GET `https://cefis.com.br/api/v1/user/me` → retorna user
- **Output:** `CefisUser` | 401
- **Feature:** Auth (1)

### `POST /api/onboarding/chat`
- **Zod input:** `{ messages: z.array(MessageSchema), profileId: z.string().optional() }`
- **Lógica:** streamText com gpt-4o-mini, system prompt de onboarding, tool `fetchUserData` (chama /user/me + /performance/certificates) → stream de volta
- **Output:** ReadableStream (Vercel AI SDK data stream protocol)
- **Feature:** Onboarding (2)

### `POST /api/onboarding/complete`
- **Zod input:** `{ objective: z.string(), availableHoursWeek: z.number(), learningStyle: LearningStyleEnum }`
- **Lógica:** upsert em `student_profiles` com `cefis_user_id` do cookie → seta `onboarding_completed = true`
- **Output:** `{ profileId: string }`
- **Feature:** Onboarding (2)

### `GET /api/diagnosis`
- **Zod input:** nenhum (query param `profileId` opcional)
- **Lógica:** GET `/performance/certificates` da CEFIS → agrupa por categoria → calcula accuracy média por área → identifica lacunas (< 70% accuracy ou sem certificado) → retorna domain_map → upserta em `student_profiles.domain_map`
- **Output:** `{ domainMap: Record<string, { accuracy: number, certified: boolean, gap: boolean }>, gaps: string[] }`
- **Feature:** Diagnóstico (3)

### `GET /api/study-plan`
- **Zod input:** `{ profileId: z.string() }` (query param)
- **Lógica:** lê `student_profiles` + domain_map → GET `/courses` (filtrando pelas categorias com gap) + GET `/tracks` → gpt-4o-mini ordena e monta plano semanal baseado em `available_hours_week` → retorna lista ordenada de itens
- **Output:** `{ plan: StudyItem[], totalWeeks: number }`
- **Feature:** Plano de estudo (4)

### `POST /api/chat`
- **Zod input:** `{ messages: z.array(MessageSchema), profileId: z.string() }`
- **Lógica:** embed última mensagem do user → `match_transcripts` → monta contexto com chunks → streamText gpt-4o-mini com system prompt do tutor + contexto RAG → tool `citeSources` emite as citações junto com a resposta
- **Output:** ReadableStream com citações em metadata
- **Feature:** Chat de dúvidas (5)

### `POST /api/podcast/generate`
- **Zod input:** `{ profileId: z.string(), topics: z.array(z.string()).optional() }` 
- **Lógica:** (1) insere `generated_audios` com status=pending → (2) busca perfil + domain gaps → (3) `match_transcripts` para os tópicos com gaps → (4) gpt-4o gera script narrativo PT-BR 800-1200 palavras → (5) ElevenLabs TTS → (6) upload mp3 para Storage `tutor-audios/{profileId}/{audioId}.mp3` → (7) atualiza `generated_audios` status=ready + storage_path → `export const maxDuration = 60`
- **Output:** `{ audioId: string, status: 'generating' }`
- **Feature:** Podcast (6)

### `GET /api/podcast/[id]`
- **Zod input:** `id` de path param
- **Lógica:** lê `generated_audios` por id → se status=ready, gera signed URL do Storage (1h TTL) → retorna
- **Output:** `{ status: string, url?: string, title?: string, duration?: number }`
- **Feature:** Podcast (6)

### `POST /api/ingest`
- **Zod input:** `{ secret: z.string() }` — validado contra `INGEST_SECRET` env var
- **Lógica:** lê arquivos em `data/transcricoes/` → chunking → embed em lote (20 por vez para não explodir rate limit OpenAI) → upsert em `transcripts`
- **Output:** `{ chunksProcessed: number, timeMs: number }`
- **Feature:** RAG (infra, não exposta ao usuário)

---

## 4. Ordem de Implementação (blocos de ~1h)

### Bloco 0 — Setup de ambiente (30min)
- Preencher `.env.local` com todas as keys (ver lista abaixo)
- `supabase db push` com `001_initial.sql` no projeto remoto
- Criar bucket `tutor-audios` no Supabase Dashboard
- Verificar que `supabase status` está ok localmente
- Testar que o projeto Next.js sobe sem erros (`npm run dev`)

**ENV vars necessárias:**
```
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INGEST_SECRET=
```

### Bloco 1 — Auth (1h)
1. `lib/cefis/types.ts` — interfaces CefisUser, Course, Lesson, Certificate
2. `lib/cefis/client.ts` — CefisClient com v1/v3, retry 2x, timeout 8s, header correto por API
3. `lib/schemas/auth.ts` — Zod login schema
4. `lib/supabase/server.ts` e `client.ts`
5. `app/api/auth/login/route.ts`
6. `app/api/auth/logout/route.ts`
7. `middleware.ts` — protege `/app/*` e `/onboarding`, redireciona para `/login`
8. `app/(auth)/login/page.tsx` + `components/auth/LoginForm.tsx`

**Checkpoint:** login funciona, cookie setado, redirect acontece.

### Bloco 2 — Schema + Ingest PIPELINE (1h) ← CRÍTICO, FAZER CEDO
1. Confirmar que `transcricoes.zip` existe em `data/` (ver Risco #1 abaixo — SE não existir, implementar fallback de dados do catálogo)
2. `lib/ingest/parse.ts` — extrai e lê arquivos de transcrição
3. `lib/ingest/chunk.ts` — divide em ~500 tokens, 50-token overlap
4. `lib/ingest/embed.ts` — batch de 20, `text-embedding-3-small`, upsert
5. `app/api/ingest/route.ts`
6. **DISPARAR O INGEST** via `curl -X POST .../api/ingest` — deixa rodando em background enquanto constrói o resto

### Bloco 3 — Onboarding conversacional (1h)
1. `lib/prompts/onboarding.ts` — system prompt que conduz conversa para extrair objetivo + tempo + estilo
2. `lib/schemas/onboarding.ts`
3. `app/api/onboarding/chat/route.ts` — streamText gpt-4o-mini com tool `fetchUserContext`
4. `app/api/onboarding/complete/route.ts`

### Bloco 4 — Diagnóstico (45min)
1. `lib/prompts/diagnosis.ts`
2. `app/api/diagnosis/route.ts` — analisa certificates, calcula domain_map

### Bloco 5 — RAG + Chat API (1h)
1. `lib/ai/openai.ts`
2. `lib/ai/embeddings.ts`
3. `lib/ai/rag.ts` — matchTranscripts, formata chunks como contexto
4. `lib/prompts/tutor.ts`
5. `lib/schemas/chat.ts`
6. `app/api/chat/route.ts` — streamText com RAG context

### Bloco 6 — Plano de estudos (45min)
1. `types/domain.ts` — StudyItem, DomainMap, Gap
2. `app/api/study-plan/route.ts`

### Bloco 7 — UI base + Dashboard (1.5h)
1. `app/layout.tsx` — atualiza metadata, providers
2. `components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`
3. `app/(app)/layout.tsx` — valida cookie server-side, passa dados ao AppShell
4. `app/(app)/dashboard/page.tsx`
5. `components/dashboard/DomainMap.tsx`, `StudyPlanCard.tsx`, `ProgressCard.tsx`

### Bloco 8 — UI Chat (1h)
1. `hooks/useStreamingChat.ts` — wrapper sobre useChat (ai@6 API)
2. `app/(app)/chat/page.tsx`
3. `components/chat/TutorChat.tsx`, `ChatMessage.tsx`, `SourceCitation.tsx`

### Bloco 9 — Onboarding UI (45min)
1. `components/onboarding/OnboardingChat.tsx`, `MessageBubble.tsx`
2. `app/(app)/onboarding/page.tsx`
3. `app/page.tsx` — redirect logic (onboarding completo → dashboard, senão → onboarding)

### Bloco 10 — DIFERENCIAL: Podcast (1.5h)
1. `lib/prompts/podcast.ts` — prompt narrativo PT-BR, 800-1200 palavras, ~5min de áudio
2. `app/api/podcast/generate/route.ts` — gpt-4o + ElevenLabs + Storage upload
3. `app/api/podcast/[id]/route.ts` — status + signed URL
4. `hooks/usePodcast.ts` — polling a cada 2s até status=ready
5. `components/podcast/PodcastPlayer.tsx` — wavesurfer.js com waveform
6. `components/podcast/GenerateButton.tsx`
7. `app/(app)/podcast/page.tsx`

### Bloco 11 — Deploy + polish (1h)
1. `vercel.json` se necessário (`maxDuration` para podcast route)
2. Todas as env vars no Vercel Dashboard
3. `vercel deploy --prod`
4. Teste e2e no domínio de produção: login → onboarding → dashboard → chat → podcast
5. Ajustes finais de UX (loading states, mensagens de erro)

---

## 5. Riscos Técnicos Específicos

### RISCO 1 (CRÍTICO): `data/transcricoes.zip` não existe
**Situação atual:** O diretório `data/` não existe no projeto. Sem as transcrições, o RAG (Chat de Dúvidas) não tem conteúdo real — perde ~15-20pts de Integração CEFIS + Qualidade da IA.

**Decisão imediata necessária antes de começar:** Onde está o arquivo? Já foi baixado? É um ZIP das aulas de alguma trilha específica?

**Fallback se não existir:** Usar o endpoint `/courses/:id/lessons` para buscar as descrições das aulas (campo `description` ou `summary`) e embeddá-las. Menos conteúdo, mas ainda "real CEFIS". Implementar `lib/ingest/from-api.ts` que faz a ingestão a partir do catálogo ao invés do ZIP.

**Por que times solo perdem 2h aqui:** Assumem que o arquivo existe, chegam no Bloco 2 sem ele, improvisar o fallback sob pressão leva tempo dobrado.

---

### RISCO 2 (ALTO): `ai@6` tem API completamente diferente do `ai@3/4`
**Situação:** Instalado `ai@6.0.191` e `@ai-sdk/openai@3.0.65`. O Vercel AI SDK v6 é um redesign — `useChat`, `streamText`, `generateText`, os imports, o data stream protocol, tudo pode ter mudado.

**Ações obrigatórias antes de escrever qualquer código de IA:**
- Ler `node_modules/ai/README.md` e `node_modules/@ai-sdk/openai/README.md`
- Verificar se `useChat` ainda existe ou foi substituído por outra primitiva
- Confirmar import paths: `import { streamText } from 'ai'`? ou `from '@ai-sdk/core'`?
- Verificar se o data stream protocol mudou (necessário para streaming funcionar no frontend)

**Sintoma de que erraste:** `useChat` não streama nada, ou o TypeScript reclama de tipos incompatíveis.

---

### RISCO 3 (ALTO): Next.js 16 breaking changes
**Situação:** AGENTS.md avisa explicitamente. Next.js 16 é pós-15 e pode ter mudado APIs de cookies, headers, route handlers, e o padrão de `export const maxDuration`.

**Ações obrigatórias:**
- Ler `node_modules/next/dist/docs/01-app/02-guides/` antes de escrever qualquer route handler
- Verificar como `cookies()` funciona em Next.js 16 (pode ser async agora)
- Verificar se `NextResponse` / `NextRequest` ainda são os objetos corretos
- Verificar o padrão atual de `export const runtime = 'edge'` vs `'nodejs'`

**Por que teams perdem 2h:** Copiam padrões do Next.js 14/15, tudo parece certo no TS mas quebra em runtime.

---

### RISCO 4 (MÉDIO): Vercel timeout no podcast
**Situação:** Gerar script (gpt-4o, ~15s) + TTS ElevenLabs (~20-40s para 5min de áudio) + upload Storage (~2-5s) = 37-60s total. Vercel tem limite de 10s no plano free, 60s no máximo com config explícita.

**Mitigação já planejada:** `export const maxDuration = 60` na route de podcast. MAS isso só funciona no plano Pro da Vercel. Verificar antes do deploy qual plano está sendo usado.

**Alternativa se timeout:** Retornar imediatamente com `audioId` e status=pending, processar em background com `waitUntil` (Next.js 16 suporta `after()` para trabalho pós-response). Isso é mais robusto e já está no design do endpoint.

---

### RISCO 5 (MÉDIO): pgvector IVFFlat vs linear scan
**Situação:** IVFFlat index com `lists=100` requer ao menos 1000+ vetores para ser útil; com menos, o scan linear é mais preciso E mais rápido. Schema planeja linear scan inicialmente.

**Ação:** Criar o IVFFlat index SOMENTE depois que o ingest completar e você souber quantos chunks tem. Se < 500 chunks, não criar o índice — o scan linear vai ser suficiente para demo.

**Sintoma de problema:** Queries de RAG demoram > 2s ou retornam resultados piores após criar o índice prematuro.

---

### RISCO 6 (MÉDIO): Rate limits da CEFIS API
**Situação:** Desconhecido. O onboarding faz 2 requests (/user/me + /performance/certificates). O estudo de plano pode fazer N requests de catálogo. Se a CEFIS rate-limitar, tudo quebra em demo.

**Mitigação:** Cache agressivo no Supabase. Após primeiro fetch de /user/me, salvar em `student_profiles`. Após fetch de certificates, salvar em `domain_map`. Após fetch do catálogo de cursos, salvar em JSONB em `student_profiles.domain_map.catalog_cache` com TTL de 24h. Verificar header `Retry-After` nas respostas da CEFIS.

---

### RISCO 7 (BAIXO/MONITORAR): Custo de tokens OpenAI
**Estimativa:**
- text-embedding-3-small: ~1000 chunks × 500 tokens = 500k tokens → $0.01
- gpt-4o-mini chat: ~50 mensagens × 2k tokens = 100k → $0.05
- gpt-4o podcast: 1 script × 3k tokens output = $0.09
- **Total estimado: < $1 para toda a sessão de desenvolvimento + demo**

Não é risco real, mas logar `usage` de cada chamada para ter visibilidade se algo escalar.

---

### RISCO 8 (BAIXO): Tailwind v4 vs v3 syntax
**Situação:** Tailwind v4 usa `@import "tailwindcss"` no CSS ao invés de `@tailwind base/components/utilities`. Não tem `tailwind.config.js` — config fica inline no CSS. O projeto já tem `globals.css` gerado pelo `create-next-app` com Tailwind v4, então deve estar correto.

**Verificar:** `globals.css` linha 1 deve ter `@import "tailwindcss"`. Se tiver `@tailwind base`, está em modo v3 compat e pode gerar warnings.

---

### RISCO 9 (ALERTAR): `@tremor/react` mencionado no briefing, mas NÃO instalado
**Situação:** `package.json` não tem `@tremor/react`. O plano usa shadcn/ui para todos os gráficos. Se quiser o `AreaChart` do Tremor para o DomainMap, precisa instalar antes. Alternativa: usar barras CSS puras com Tailwind — mais rápido, sem dependência.

**Recomendação:** Não instalar Tremor. Usar `Progress` do shadcn para barras de domínio — já está instalado, zero configuração.

---

## Critérios × Features (mapeamento de pontos)

| Critério | Pts | Features que entregam |
|----------|-----|----------------------|
| Funcionalidade | 30 | Auth + Chat (fluxo não trava) |
| Integração CEFIS | 25 | /user/me + /courses + /certificates + RAG nas transcrições reais |
| Qualidade da IA | 20 | RAG preciso + onboarding personalizado + diagnóstico por lacunas |
| Inovação | 15 | **Podcast personalizado** com waveform — esse é o diferencial |
| UX | 10 | Onboarding conversacional (sem formulário) + player de áudio |

**Estratégia de pontuação:** Auth + Chat funcional garante ~55 pts. Podcast + onboarding conversacional pode empurrar para 80+. Não sacrificar a estabilidade do fluxo principal tentando fazer tudo — se o tempo apertar, cortar `plano/page.tsx` (menos pontos) e priorizar o podcast (máximo inovação).
