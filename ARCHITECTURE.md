# CEFIS Tutor IA — Documentação Técnica

## Visão Geral

CEFIS Tutor IA é uma plataforma de tutoria personalizada por IA para estudantes de concursos públicos que usam a plataforma CEFIS. O sistema consome a API real da CEFIS (v1 e v3) para autenticar o usuário, importar seus certificados e acessar o catálogo de cursos, cruzando esses dados com um índice vetorial de 18.344 trechos de transcrições reais de aulas para gerar respostas com embasamento real no conteúdo.

O diferencial técnico está em três camadas integradas: (1) diagnóstico automático de lacunas de conhecimento calculado a partir dos certificados do aluno na CEFIS, (2) chat com RAG (Retrieval-Augmented Generation) sobre 7.447 transcrições de aulas indexadas com pgvector, e (3) geração de podcasts de ~1 minuto narrados via ElevenLabs, acionados por tool calling diretamente do chat sem sair do contexto da conversa.

A arquitetura segue o padrão Next.js 16 App Router com Server Components como padrão, event handlers isolados em Client Components, autenticação via cookie httpOnly sem banco de sessão próprio, e processamento assíncrono pesado (TTS, GPT-4o) via `after()` do Next.js após o response já ter sido enviado ao cliente.

## Stack Completo

### Framework e Runtime
| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `next` | 16.2.6 | Framework full-stack (App Router, Server Components, proxy.ts) |
| `react` / `react-dom` | 19.2.4 | UI runtime |
| `typescript` | ^5 | Linguagem (strict mode, ES2017 target) |

### AI / LLM
| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `ai` | ^6.0.191 | Vercel AI SDK v6 — streamText, tool(), convertToModelMessages |
| `@ai-sdk/openai` | ^3.0.65 | Provider OpenAI para o AI SDK |
| `@ai-sdk/react` | ^3.0.193 | useChat hook com DefaultChatTransport |
| `openai` | ^6.39.0 | SDK direto para embeddings e GPT-4o (podcast, auto-título) |

### Database e Storage
| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `@supabase/supabase-js` | ^2.106.2 | Cliente Supabase (DB, Storage, RPC) |
| `@supabase/ssr` | ^0.10.3 | Integração SSR com cookies Next.js |

### UI e Animação
| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `tailwindcss` | ^4 | Utilitários CSS (v4 com CSS-native config) |
| `framer-motion` | ^12.40.0 | Animações (stagger, AnimatePresence, spring) |
| `lucide-react` | ^1.16.0 | Ícones SVG |
| `shadcn` / componentes ui | —— | Primitivos: Button, Input, Textarea, Skeleton, etc. |
| `wavesurfer.js` | ^7.12.7 | Player de áudio com waveform (import dinâmico no client) |
| `sonner` | ^2.0.7 | Sistema de toasts (topo direito, rich colors) |
| `react-markdown` | ^10.1.0 | Renderização de markdown nas respostas do chat |
| `remark-gfm` | ^4.0.1 | Suporte a GFM no markdown (tabelas, checkboxes) |
| `next-themes` | ^0.4.6 | Suporte a temas (dark mode forçado) |

### Validação
| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `zod` | ^4.4.3 | Schemas de validação de entrada nas routes |

### Outros
| Pacote | Versão | Propósito |
|--------|--------|-----------|
| `clsx` / `tailwind-merge` | latest | Utilitários de className |
| `class-variance-authority` | ^0.7.1 | Variantes de componentes shadcn |
| `tw-animate-css` | ^1.4.0 | Animações CSS adicionais |

## Estrutura de Pastas

```
cefis-tutor-ia/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # Página de login (Server Component)
│   ├── (app)/
│   │   ├── layout.tsx              # Auth guard (verifica cookie, renderiza AppShell)
│   │   ├── dashboard/page.tsx      # Dashboard principal (Server Component)
│   │   ├── chat/page.tsx           # Chat (Server Component, carrega histórico da conversation)
│   │   ├── onboarding/page.tsx     # Onboarding conversacional (Server Component)
│   │   └── podcast/
│   │       ├── page.tsx            # Lista de podcasts gerados
│   │       ├── generate/page.tsx   # Formulário de geração
│   │       └── [id]/page.tsx       # Player de podcast (Client Component)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST — autentica na CEFIS, seta cookies
│   │   │   ├── logout/route.ts     # POST — limpa cookies
│   │   │   └── me/route.ts         # GET — retorna usuário atual da CEFIS
│   │   ├── chat/route.ts           # POST streaming — RAG + tool gerar_podcast
│   │   ├── conversations/
│   │   │   ├── route.ts            # GET lista / POST cria
│   │   │   └── [id]/
│   │   │       ├── route.ts        # DELETE / PATCH title
│   │   │       └── messages/route.ts # GET messages como UIMessage[]
│   │   ├── onboarding/
│   │   │   ├── chat/route.ts       # POST streaming — coleta perfil via tool
│   │   │   └── status/route.ts     # GET — retorna onboarding_completed
│   │   ├── podcast/
│   │   │   ├── generate/route.ts   # POST — dispara geração (fire & forget via after())
│   │   │   └── [id]/route.ts       # GET — status + signed URL (7 dias)
│   │   ├── audio/
│   │   │   └── status/[id]/route.ts # GET — polling de status leve (24h)
│   │   └── ingest/route.ts         # POST (admin) — processa VTTs → pgvector
│   ├── globals.css                  # CSS variables, utilitários glass/glow
│   ├── layout.tsx                   # Root layout (dark class, Geist font, Toaster)
│   └── page.tsx                     # Redirect → /login ou /dashboard
│
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx            # Formulário de login (Client Component)
│   ├── chat/
│   │   ├── ChatContext.tsx           # Context para compartilhar sendMessage
│   │   ├── ChatLayout.tsx            # Layout chat: sidebar + área de mensagens
│   │   ├── ChatMessage.tsx           # Renderiza mensagem (detecta Flash Mode e tool-gerar_podcast)
│   │   ├── ConversationsSidebar.tsx  # Sidebar de conversas estilo Claude.ai
│   │   ├── FlashModeCard.tsx         # Card interativo do Modo Flash com quiz
│   │   ├── PodcastInlineCard.tsx     # Card de podcast inline com polling
│   │   └── TutorChat.tsx             # Componente principal do chat (useChat, context)
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx       # Cabeçalho com saudação e CTAs (Client Component)
│   │   ├── DomainMap.tsx             # Grid de cards por categoria (verde/amarelo/coral)
│   │   ├── StatsCards.tsx            # 3 cards com animação countUp
│   │   └── StudyPlanCard.tsx         # Card de curso recomendado
│   ├── layout/
│   │   ├── AppShell.tsx              # Shell global (detecta /chat, oculta Sidebar)
│   │   ├── LogoutButton.tsx          # Botão de logout (Client Component)
│   │   └── Sidebar.tsx               # Sidebar principal (Dashboard/Chat/Podcasts)
│   ├── onboarding/
│   │   ├── MessageBubble.tsx         # Bubble de mensagem do onboarding
│   │   └── OnboardingChat.tsx        # Chat de onboarding com auto-init __init__
│   ├── podcast/
│   │   ├── GenerateButton.tsx        # Botão de geração com loading state
│   │   └── PodcastPlayer.tsx         # Player completo com wavesurfer.js
│   └── ui/
│       ├── animated.tsx              # Wrappers Framer Motion (Stagger, FadeUp, SlideUp)
│       └── [shadcn components]       # Button, Input, Textarea, Skeleton, etc.
│
├── hooks/
│   └── usePodcast.ts                 # Polling de status de podcast a cada 3s
│
├── lib/
│   ├── ai/
│   │   ├── embeddings.ts             # embed(text) → number[] via text-embedding-3-small
│   │   ├── openai.ts                 # Instância @ai-sdk/openai configurada
│   │   ├── podcast-generator.ts      # generatePodcastBackground() — GPT-4o + ElevenLabs + Storage
│   │   └── rag.ts                    # matchTranscripts() + formatRagContext()
│   ├── auth/
│   │   └── get-profile.ts            # getAuthProfile() → { userId, profileId } | null
│   ├── cefis/
│   │   ├── client.ts                 # Funções de API CEFIS v1/v3 com retry e timeout
│   │   └── types.ts                  # Interfaces: CefisUser, CefisCourse, CefisCertificate, etc.
│   ├── ingest/
│   │   ├── chunk.ts                  # chunkText() — 500 tokens, 60 overlap
│   │   ├── embed.ts                  # embedAndStore() — batch 100 embeddings, upsert 50
│   │   └── parse.ts                  # parseTranscripts() — lê VTTs da pasta data/output/
│   ├── prompts/
│   │   ├── onboarding.ts             # buildOnboardingPrompt(user, certs)
│   │   ├── podcast.ts                # buildPodcastSystemPrompt(firstName) + buildPodcastUserPrompt(ctx)
│   │   └── tutor.ts                  # buildTutorPrompt(ctx) — sistema warm/Mari + Flash Mode
│   ├── schemas/
│   │   ├── auth.ts                   # loginSchema (email + password)
│   │   ├── chat.ts                   # chatSchema (messages array)
│   │   └── onboarding.ts             # saveProfileSchema (objetivo + horas + estilo)
│   ├── diagnosis.ts                  # detectCategory() + buildDomainMap() + getStudyPlan()
│   ├── supabase/server.ts            # createSupabaseAdmin() — service role, no session
│   └── utils.ts                      # cn() (clsx + tailwind-merge)
│
├── types/
│   ├── conversation.ts               # Conversation, ConversationListItem, ConversationMessage
│   └── domain.ts                     # DomainMap, DomainCategory, StudyItem
│
├── proxy.ts                          # Route guard (substitui middleware.ts no Next.js 16)
├── vercel.json                       # Config de deploy
└── package.json
```

## Camadas da Aplicação

### Camada de Apresentação

#### Páginas (Server Components)

| Rota | Componente | Função |
|------|-----------|--------|
| `/` | `app/page.tsx` | Redirect: sem cookie → `/login`; com cookie → `/dashboard` ou `/onboarding` |
| `/login` | `(auth)/login/page.tsx` | Formulário de login CEFIS com gradiente coral |
| `/dashboard` | `(app)/dashboard/page.tsx` | Mapa de domínio + plano de estudos + stats |
| `/onboarding` | `(app)/onboarding/page.tsx` | Chat conversacional para montar perfil inicial |
| `/chat` | `(app)/chat/page.tsx` | Chat com RAG, suporte a histórico por conversation |
| `/podcast` | `(app)/podcast/page.tsx` | Lista de podcasts gerados (filtrado por status ≠ error) |
| `/podcast/generate` | `(app)/podcast/generate/page.tsx` | Preview dos gaps + botão de geração |
| `/podcast/[id]` | `(app)/podcast/[id]/page.tsx` | Player com estado animado (gerando/pronto/erro) |

#### Design System

**Paleta (CSS custom properties no `:root`):**
```css
--background: #1a1a1a   /* charcoal quente */
--card:       #242424   /* superfície elevada */
--secondary:  #2a2a2a   /* hover/input */
--primary:    #e06b49   /* coral — accent e CTAs */
--foreground: #f5f0eb   /* creme quente — texto */
--muted-foreground: rgba(245,240,235,0.5)
--border: rgba(255,255,255,0.08)
```

**Utilitários CSS customizados:**
- `.glass` — `background: #242424; border: 1px solid rgba(255,255,255,0.08)`
- `.glass-elevated` — glass com `box-shadow: 0 4px 24px rgba(0,0,0,0.4)`
- `.glow-coral` / `.glow-coral-sm` — box-shadow em coral
- `.text-gradient` — gradient cream-to-faded
- `.text-coral` / `.bg-coral` — shorthand de cores

**Tipografia:** Geist Sans (variável CSS `--font-geist-sans`), anti-aliased, feature-settings `cv11 ss01`

**Animação (Framer Motion):**
- Easing padrão: `[0.25, 0.1, 0.25, 1]` (ease-out-cubic)
- Stagger padrão: 80ms entre filhos
- Primitivos em `components/ui/animated.tsx`: `Stagger`, `FadeUp`, `SlideUp`, `FadeIn`, `ScaleIn`

### Camada de API

#### Endpoints e Schemas

**Auth**

```
POST /api/auth/login
  Input:  { email: string, password: string }  (loginSchema Zod)
  Output: { ok: true, user: CefisUser }
  Efeitos: seta cefis_key (httpOnly) + cefis_user_id; upsert student_profiles

POST /api/auth/logout
  Output: { ok: true }
  Efeitos: maxAge=0 em ambos os cookies

GET /api/auth/me
  Output: CefisUser
  Auth:   cefis_key cookie
```

**Onboarding**

```
POST /api/onboarding/chat  (maxDuration: 30s)
  Input:  { messages: UIMessage[] }
  Output: ReadableStream (toUIMessageStreamResponse)
  Tool:   saveProfile({ objective, availableHoursWeek, learningStyle })
  Fetches: cefisGetMe() + cefisGetCertificates() em paralelo

GET /api/onboarding/status
  Output: { completed: boolean }
```

**Chat**

```
POST /api/chat  (maxDuration: 45s)
  Input:  { messages: UIMessage[], conversationId?: string }
  Output: ReadableStream + header x-conversation-id
  Auth:   cefis_key + cefis_user_id
  RAG:    matchTranscripts(lastUserText, { threshold: 0.70, count: 5 })
  Tool:   gerar_podcast({ topico: string })
  after(): generatePodcastBackground() + auto-título GPT-4o-mini
  onFinish: salva em tutor_messages com parts JSONB
```

**Conversations**

```
GET /api/conversations
  Output: ConversationListItem[] (max 30, by updated_at DESC)

POST /api/conversations
  Output: { id: string }

DELETE /api/conversations/[id]
  Output: { ok: true }  (verifica ownership)

PATCH /api/conversations/[id]
  Input:  { title: string }
  Output: { ok: true }

GET /api/conversations/[id]/messages
  Output: UIMessage[] (max 100, convertido de parts JSONB ou fallback content)
```

**Podcast**

```
POST /api/podcast/generate  (maxDuration: 30s)
  Output: { audioId: string, status: 'generating' }
  after(): RAG → GPT-4o script (600 tokens) → ElevenLabs TTS → Storage upload

GET /api/podcast/[id]
  Output: { id, title, status, url (signed 7d), script, topics, error, createdAt }

GET /api/audio/status/[id]
  Output: { status, url (signed 24h), error }
  Uso:    polling a cada 3s pelo PodcastInlineCard
```

**Admin**

```
POST /api/ingest  (maxDuration: 300s)
  Input:  { secret: string }  (valida INGEST_SECRET)
  Output: { ok, transcriptsProcessed, chunksEmbedded, timeMs }
```

### Camada de Domínio

#### lib/ai/ — Pipeline de IA

**RAG (`lib/ai/rag.ts`)**
```typescript
matchTranscripts(query: string, opts?: { threshold?: number; count?: number })
  → embed(query)                               // text-embedding-3-small, 1536d
  → supabase.rpc('match_transcripts', { ... }) // pgvector cosine similarity
  → RagChunk[]  // { id, lessonId, courseId, lessonTitle, courseTitle, content, similarity }

formatRagContext(chunks: RagChunk[]) → string
  // Formata como: [Fonte N] Curso: "X" | Aula: "Y"\n{content}
  // Separados por \n\n---\n\n
```

**Embeddings (`lib/ai/embeddings.ts`)**
```typescript
embed(text: string) → Promise<number[]>
  // OpenAI text-embedding-3-small, dimensions: 1536, input max: 8191 chars
  // Singleton client
```

**Geração de Podcast (`lib/ai/podcast-generator.ts`)**
```typescript
generatePodcastBackground(audioId, topico, profileId, supabase)
  1. Busca nome/objetivo do aluno no DB
  2. matchTranscripts(topico, { threshold: 0.68, count: 3 })
  3. GPT-4o → script ~150 palavras (max_tokens: 600, temp: 0.75)
  4. Salva script em generated_audios
  5. POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
     Headers: xi-api-key, Accept: audio/mpeg
     Body: { text, model_id: "eleven_multilingual_v2",
             voice_settings: { stability: 0.5, similarity_boost: 0.75 } }
  6. Upload → supabase.storage.from('tutor-audios').upload('{profileId}/{audioId}.mp3')
  7. UPDATE generated_audios SET status='ready', storage_path=...
  // Em caso de erro: SET status='error', error_message=...
```

#### lib/cefis/ — Integração CEFIS

**Endpoints consumidos:**
```
V1 Base: https://cefis.com.br/api/v1
  POST /login                 → { data: { key, user } }
  GET  /user/me (Auth: key)   → CefisUser  (header sem "Bearer")

V3 Base: https://api-v3.cefis.com.br  (todas: Authorization: Bearer {key})
  GET  /courses?search=&count=         → CefisCoursesResponse
  GET  /courses/:id/lessons            → CefisLesson[]
  GET  /performance/certificates       → CefisCertificate[]
  GET  /tracks                         → CefisTrack[]
```

**Retry/timeout (`fetchWithRetry`):**
- `TIMEOUT_MS: 8000`, `MAX_RETRIES: 2`, delay 500ms entre tentativas
- AbortController para timeout via signal; retry em erros de rede ou 5xx

#### lib/prompts/ — System Prompts

**Tutor (`buildTutorPrompt`):**
- Persona: "Tutor CEFIS — professor particular de {firstName}"
- Contexto injetado: gaps do domain_map ordenados por accuracy, matérias dominadas, estilo de aprendizagem
- Fonte RAG: top 5 chunks com nomes de curso e aula
- Modo Flash: seção injetada automaticamente quando domain_map tem gaps; detecta palavras-chave de urgência
- Tom: caloroso, PT-BR, termina SEMPRE com sugestão de próxima ação

**Podcast (`buildPodcastSystemPrompt`):**
- Max 150 palavras, 1 minuto de fala, PT-BR
- Abre com: `"Olá {firstName}, bem-vindo ao seu Tutor CEFIS!"`
- Proibido: markdown, asteriscos, listas

**Onboarding (`buildOnboardingPrompt`):**
- Coleta 3 dados em sequência: objetivo, horas/semana, estilo de aprendizagem
- Usa certificados do aluno para personalizar abertura
- Chama tool `saveProfile` automaticamente quando todos os dados coletados

#### lib/diagnosis.ts — Diagnóstico de Lacunas

```typescript
detectCategory(title: string) → string
  // 12 padrões regex ordenados por especificidade:
  // Direito Constitucional, Administrativo, Penal, Civil, Processual,
  // Tributário, Contabilidade, Português, Raciocínio Lógico,
  // Informática, Gestão Pública, Legislação Específica + "Outros"

buildDomainMap(certificates: CefisCertificate[]) → DomainMap
  // Média incremental de accuracy por categoria
  // gap: true quando accuracy < 70

getStudyPlan(key: string, domainMap: DomainMap) → StudyItem[]
  // Top 3 gaps (lowest accuracy first) → GET /courses?search={gap}&count=3
  // Deduplica por course ID
  // priority: 'high' se accuracy < 60, 'medium' caso contrário
  // url: https://cefis.com.br/cursos/{course.slug ?? course.id}
```

### Camada de Dados

#### Supabase — Schema Completo

**`student_profiles`**
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
cefis_user_id        TEXT UNIQUE NOT NULL
name                 TEXT
occupation           TEXT
nivel                TEXT
is_premium           BOOLEAN NOT NULL DEFAULT FALSE
objective            TEXT
available_hours_week INTEGER
learning_style       TEXT CHECK (learning_style IN ('visual','auditivo','leitura','pratico'))
domain_map           JSONB NOT NULL DEFAULT '{}'
onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- TRIGGER: atualiza updated_at em UPDATE
```

**`conversations`**
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
student_profile_id   UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE
title                TEXT NOT NULL DEFAULT 'Nova conversa'
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- INDEX: (student_profile_id, updated_at DESC)
```

**`tutor_messages`**
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
student_profile_id   UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE
conversation_id      UUID REFERENCES conversations(id) ON DELETE CASCADE
role                 TEXT NOT NULL CHECK (role IN ('user','assistant','system'))
content              TEXT NOT NULL
parts                JSONB           -- UIMessage.parts completo (tool invocations incluídos)
metadata             JSONB NOT NULL DEFAULT '{}'
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- INDEX: (student_profile_id, created_at DESC)
-- INDEX: (conversation_id, created_at ASC)
```

**`generated_audios`**
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
student_profile_id   UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE
title                TEXT NOT NULL
script               TEXT NOT NULL DEFAULT ''
storage_path         TEXT
duration_seconds     INTEGER
topics               JSONB NOT NULL DEFAULT '[]'
status               TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','generating','ready','error'))
error_message        TEXT
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

**`transcripts`** (vetor)
```sql
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
lesson_id            TEXT NOT NULL
course_id            TEXT NOT NULL
lesson_title         TEXT NOT NULL
course_title         TEXT NOT NULL
chunk_index          INTEGER NOT NULL
content              TEXT NOT NULL
embedding            vector(1536)
metadata             JSONB NOT NULL DEFAULT '{}'
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- INDEX: (lesson_id), (course_id)
-- INDEX após ingest: USING ivfflat (embedding vector_cosine_ops) WITH (lists=50)
```

**RPC `match_transcripts`:**
```sql
CREATE OR REPLACE FUNCTION match_transcripts(
  query_embedding  vector(1536),
  match_threshold  FLOAT DEFAULT 0.72,
  match_count      INTEGER DEFAULT 5
) RETURNS TABLE (
  id UUID, lesson_id TEXT, course_id TEXT,
  lesson_title TEXT, course_title TEXT,
  content TEXT, similarity FLOAT
) AS $$
  SELECT id, lesson_id, course_id, lesson_title, course_title, content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM transcripts
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

**Storage:**
- Bucket: `tutor-audios` (privado)
- Path: `{cefis_user_id}/{audioId}.mp3`
- Acesso: signed URLs — 7 dias via `/api/podcast/[id]`, 24h via `/api/audio/status/[id]`

## Fluxos Principais

### Fluxo 1 — Onboarding
```
Login (/api/auth/login)
  └─ POST cefis.com.br/api/v1/login
  └─ SET cookies: cefis_key (httpOnly), cefis_user_id
  └─ UPSERT student_profiles

Redirect → /onboarding
  └─ Server: verifica onboarding_completed === false
  └─ Client: OnboardingChat envia "__init__" automático

/api/onboarding/chat (streaming)
  └─ Busca /user/me + /performance/certificates em paralelo
  └─ buildOnboardingPrompt(user, certs) → GPT-4o-mini
  └─ Tool saveProfile quando 3 dados coletados
      └─ UPDATE student_profiles SET objective, available_hours_week,
                                    learning_style, onboarding_completed=true
  └─ onFinish → client checa /api/onboarding/status → redirect /dashboard
```

### Fluxo 2 — Chat com RAG
```
Usuário digita mensagem → useChat → POST /api/chat
  │
  ├─ Busca student_profiles (domain_map para Flash Mode)
  ├─ embed(lastUserText) → 1536d vector
  ├─ match_transcripts(embedding, threshold=0.70, count=5)
  ├─ formatRagContext(chunks) → string com [Fonte N]
  ├─ buildTutorPrompt(ctx) → system prompt dinâmico
  ├─ streamText(gpt-4o-mini, system, messages, tools)
  │   └─ toUIMessageStreamResponse() → SSE para o cliente
  │
  ├─ onFinish:
  │   ├─ contentToUIParts(content[]) → UIMessage.parts (merge tool-call+result)
  │   ├─ INSERT tutor_messages (user + assistant, ambos com parts JSONB)
  │   └─ UPDATE conversations SET updated_at = now()
  │
  └─ after():
      ├─ Se tool chamada: generatePodcastBackground(audioId, topico, profileId)
      └─ Se 1ª mensagem: GPT-4o-mini gera título → UPDATE conversations

Cliente:
  └─ Captura header x-conversation-id → window.history.replaceState
  └─ dispatchEvent('cefis:conversation-updated') → ConversationsSidebar refetch
```

### Fluxo 3 — Tool Calling: gerar_podcast
```
Usuário: "quero ouvir isso no carro"
  └─ GPT-4o-mini chama tool gerar_podcast({ topico })
      └─ execute():
          ├─ INSERT generated_audios(status='generating')
          └─ Return { audioId, topico, mensagem }

ChatMessage detecta part.type === 'tool-gerar_podcast' && state === 'output-available'
  └─ Renderiza PodcastInlineCard(audioId)
      └─ useAudioStatus → GET /api/audio/status/[id] a cada 3s

after() no servidor:
  └─ generatePodcastBackground()
      ├─ matchTranscripts(topico, count=3)
      ├─ GPT-4o → script 150 palavras
      ├─ ElevenLabs → audio/mpeg buffer
      ├─ Storage upload: tutor-audios/{userId}/{audioId}.mp3
      └─ UPDATE status='ready'

Status 'ready' → PodcastInlineCard → MiniPlayer (wavesurfer.js)
```

### Fluxo 4 — Modo Flash
```
Usuário: "tenho 15 minutos, minha prova é amanhã"

buildTutorPrompt injeta seção MODO FLASH quando gaps > 0
GPT-4o-mini responde com marcadores ---FLASH_MODE_START--- / ---FLASH_MODE_END---
  └─ Estrutura: ## Foco (conteúdo RAG) + 5 questões objetivas com gabarito

ChatMessage detecta hasFlash → renderiza FlashModeCard(content)
  ├─ parseQuestions() → Question[] (regex line-by-line)
  ├─ Quiz interativo: opção selecionada → verde/vermelho com animação
  └─ CTA "Gerar Podcast" → useChatContext().sendMessage({ text: 'Gera um podcast sobre {tópico}' })
      └─ Dispara tool gerar_podcast inline (sem redirect)
```

### Fluxo 5 — Conversations
```
Primeira mensagem sem conversationId:
  └─ /api/chat: INSERT conversations, captura id
  └─ Response: header x-conversation-id
  └─ TutorChat: history.replaceState(/chat?c={id}) + dispatchEvent('cefis:conversation-updated')
  └─ ConversationsSidebar: refetch lista

Carregar conversa existente (/chat?c={uuid}):
  └─ Server: SELECT tutor_messages WHERE conversation_id = uuid
  └─ toUIMessages(): rehydrata parts JSONB → UIMessage[]
      └─ tool invocations → { type: 'tool-gerar_podcast', state: 'output-available', output: { audioId } }
  └─ ChatLayout: AnimatePresence key=conversationId (fade entre conversas)
  └─ PodcastInlineCard rehidratado → polling retoma
```

## Decisões Técnicas Relevantes

**pgvector com IVFFlat `lists=50`:** Após ingest de 18.344 chunks, o scan linear seria O(n). IVFFlat com 50 listas oferece boa velocidade de query (~2ms) sem o custo de memória do HNSW. O índice foi criado pós-ingest pois IVFFlat requer ao menos 100 registros para funcionar corretamente.

**`after()` do Next.js para geração de podcast:** A geração completa (RAG + GPT-4o + ElevenLabs + Storage) leva 30-60s, excedendo qualquer timeout de Vercel em serverless. `after()` roda após a resposta HTTP ser enviada, no mesmo processo Node.js, sem necessidade de fila externa ou endpoint separado.

**`parts` JSONB para mensagens:** O formato UIMessage do ai@6 inclui tool invocations como partes do assistente (`{ type: 'tool-gerar_podcast', state: 'output-available', output: { audioId } }`). Serializar em JSONB permite rehydratação completa: ao recarregar a conversa, o `PodcastInlineCard` recebe o `audioId` correto e retoma o polling.

**Cookie httpOnly para auth CEFIS:** A chave CEFIS é um token de API longo prazo. Armazená-la em `localStorage` ou cookie não-httpOnly a expõe a ataques XSS. Como o backend precisa dela para cada request à CEFIS API, o cookie httpOnly é enviado automaticamente sem nunca ser acessível ao JavaScript do cliente.

**Supabase Auth não utilizado:** O usuário já tem conta na CEFIS. Criar outra credencial seria atrito desnecessário. A `cefis_key` retornada no login já é suficiente para autenticar todas as chamadas à API CEFIS e serve como token de sessão para o Supabase via `cefis_user_id`.
