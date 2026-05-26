# CEFIS Tutor IA

> Tutor de IA personalizado para concursos públicos — baseado no conteúdo real das suas aulas CEFIS.

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-green?logo=openai)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ecf8e?logo=supabase)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-TTS-orange)

---

## ✨ Features

- **Chat com RAG** — respostas baseadas em 18.344 chunks de transcrições reais das aulas CEFIS, com citação da fonte
- **Mapa de Domínio** — diagnóstico automático de lacunas calculado a partir dos seus certificados CEFIS
- **Plano de Estudo** — cursos reais do catálogo CEFIS recomendados pelas suas áreas de menor acerto
- **Podcast personalizado** — script gerado com GPT-4o sobre seus gaps, narrado com ElevenLabs, jogado inline no chat
- **Modo Flash ⚡** — detecta urgência de estudo e entrega resumo + 5 questões objetivas com gabarito em segundos
- **Onboarding conversacional** — AI extrai objetivo, tempo e estilo de aprendizagem sem formulário
- **Histórico de conversas** — sidebar estilo Claude.ai com conversas persistidas e título auto-gerado
- **Integração CEFIS real** — login com credenciais CEFIS, dados reais de certificados e catálogo de cursos

---

## 🎯 O Problema

Concurseiros CEFIS têm acesso a centenas de cursos, mas nenhuma ferramenta que analise onde realmente estão suas lacunas e diga exatamente o que estudar — baseado no seu histórico real de desempenho, não em recomendações genéricas.

O chat ao vivo da CEFIS responde dúvidas, mas sem contexto das aulas específicas do aluno. O aluno não sabe se a resposta veio de algum material do curso ou foi inventada. E não existe forma de consumir conteúdo no caminho da prova — a plataforma exige atenção visual total.

Além disso, a maioria dos tutores de IA para concurso trabalham com conteúdo genérico. Nenhum acessa as transcrições reais das aulas que o aluno já está fazendo, o que cria um descompasso entre o que a IA explica e o que o professor da CEFIS ensina.

---

## 💡 A Solução

CEFIS Tutor IA conecta na API real da CEFIS com as credenciais do aluno. No primeiro acesso, o sistema importa automaticamente todos os certificados e calcula o mapa de domínio: quais áreas o aluno domina (≥80% de acerto), quais são parciais (60–79%) e quais são lacunas críticas (<60%).

O chat responde dúvidas usando RAG sobre 18.344 trechos de transcrições de 7.447 aulas reais da CEFIS — indexadas com pgvector e buscadas por similaridade semântica. Cada resposta cita a aula de origem, provando que o conteúdo vem do material que o aluno já estuda.

Quando o aluno está com pouco tempo ("tenho 15 min, prova amanhã"), o Modo Flash detecta a urgência e entrega um resumo focado + 5 questões objetivas com gabarito interativo. Quando quer ouvir, digita "me faz um podcast sobre Contabilidade" e em ~30s um áudio narrado de 1 minuto aparece inline no chat — sem sair da conversa.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router                │
│                                                          │
│  Server Components          Client Components           │
│  ─────────────────          ──────────────────          │
│  dashboard/page.tsx ──────► DomainMap (framer)          │
│  chat/page.tsx ───────────► TutorChat (useChat)         │
│  podcast/[id]/page.tsx ───► PodcastPlayer (wavesurfer)  │
└───────────────┬─────────────────────────────────────────┘
                │ API Routes (App Router)
                ▼
┌──────────────────────────────────────────────────────────┐
│  /api/chat ────► buildTutorPrompt() + streamText()       │
│     │           ├── RAG: matchTranscripts() (pgvector)   │
│     │           ├── Tool: gerar_podcast()                │
│     │           └── after(): generatePodcastBackground() │
│     ▼                                                    │
│  Supabase (PostgreSQL + pgvector + Storage)              │
│  ├── student_profiles + domain_map (JSONB)               │
│  ├── conversations + tutor_messages (parts JSONB)        │
│  ├── generated_audios                                    │
│  └── transcripts (18.344 embeddings, vector(1536))       │
└───────────────────┬──────────────────────────────────────┘
                    │ Integrações externas
                    ▼
         ┌──────────────────────┐
         │  CEFIS API v1 + v3   │  (certificados, catálogo, perfil)
         │  OpenAI API           │  (gpt-4o-mini chat, gpt-4o podcast, embeddings)
         │  ElevenLabs API       │  (TTS: eleven_multilingual_v2)
         └──────────────────────┘
```

---

## 🛠️ Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16.2.6 (App Router) |
| UI | React 19.2.4 + Tailwind v4 + Framer Motion |
| AI Chat | Vercel AI SDK v6 (streamText, useChat, tool calling) |
| LLM | GPT-4o-mini (chat) + GPT-4o (podcast scripts) |
| Embeddings | text-embedding-3-small (1536d) |
| Vector DB | Supabase PostgreSQL + pgvector (IVFFlat) |
| TTS | ElevenLabs (eleven_multilingual_v2) |
| Storage | Supabase Storage (bucket tutor-audios) |
| Auth | CEFIS API + cookies httpOnly |
| Audio Player | wavesurfer.js v7 |
| Linguagem | TypeScript (strict mode) |
| Deploy | Vercel |

---

## 🚀 Como Rodar Localmente

```bash
# 1. Clone o repositório
git clone <url-do-repo>
cd cefis-tutor-ia

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves (ver seção abaixo)

# 4. Rode o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

> **Nota:** O login usa credenciais reais da sua conta CEFIS (cefis.com.br).

---

## 📦 Variáveis de Ambiente

Crie um `.env.local` na raiz com:

```env
# OpenAI — platform.openai.com/api-keys
OPENAI_API_KEY=

# Supabase — app.supabase.com → projeto → Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ElevenLabs — elevenlabs.io → Profile → API Keys
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# Ingest (admin) — qualquer string aleatória
INGEST_SECRET=
```

---

## 🤖 Integrações

### CEFIS API
- **v1** (`cefis.com.br/api/v1`): autenticação, perfil do usuário
- **v3** (`api-v3.cefis.com.br`): cursos, aulas, certificados, trilhas
- Auth: `cefis_key` direta na v1, `Bearer {key}` na v3

### OpenAI
- **gpt-4o-mini**: chat do tutor, onboarding, auto-títulos de conversa
- **gpt-4o**: geração de scripts de podcast (~150 palavras, 1 minuto)
- **text-embedding-3-small**: embedding de queries e chunks (1536 dimensões)

### Supabase
- **PostgreSQL + pgvector**: 18.344 chunks indexados com IVFFlat para busca vetorial
- **Storage**: bucket `tutor-audios` para arquivos MP3 gerados
- **RPC**: `match_transcripts()` para busca por similaridade de cosseno

### ElevenLabs
- **Modelo**: `eleven_multilingual_v2` — suporte nativo a PT-BR
- **Configuração**: `stability: 0.5, similarity_boost: 0.75`

---

## 📊 Métricas

| Métrica | Valor |
|---------|-------|
| Aulas processadas | 7.447 VTTs |
| Chunks indexados | 18.344 (vector 1536d) |
| Tempo médio de geração de podcast | ~30-45 segundos |
| Latência de busca RAG (pgvector) | ~2ms |
| Tempo primeira resposta do chat | ~1-2 segundos |
| Tamanho médio de chunk | ~500 tokens (2000 chars) |

---

## 🎥 Demo

**Produção:** https://cefis-tutor-ia.vercel.app

---

## 📝 Licença

Desenvolvido para o Hackathon CEFIS 2026.
