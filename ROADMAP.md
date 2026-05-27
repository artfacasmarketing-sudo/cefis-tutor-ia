# Roadmap — CEFIS Tutor IA

## Visão de longo prazo

O CEFIS Tutor IA começa como um chat com RAG. Mas a visão real é diferente: um tutor que aprende com o aluno ao longo de meses, recorda o que ele errou na última semana, adapta o tom conforme o nível de domínio, e responde por voz enquanto ele está no Uber às 7h da manhã antes da prova. Em dois anos, o produto não compete com outros chatbots educacionais — compete com a figura do professor particular que conhece cada aluno pelo nome, sabe onde ele trava, e nunca repete o que já foi dominado. A diferença técnica é uma camada de memória persistente que cresce a cada sessão, combinada com acesso ao corpus real das aulas que o aluno já pagou.

---

## Onde estamos hoje (v0.1 — Hackathon CEFIS)

- ✅ RAG sobre 18.344 chunks de 7.447 aulas reais (pgvector + cosine similarity, threshold 0.5)
- ✅ Modo Flash: urgência detectada no chat → resumo do conteúdo CEFIS + 5 questões CESPE/FCC interativas
- ✅ Podcast inline com tool calling: RAG → GPT-4o script → ElevenLabs TTS → player wavesurfer.js
- ✅ Sources citáveis com badge de similarity em cada resposta
- ✅ Persistência completa de conversações com rehidratação de tool calls (JSONB parts)
- ✅ Onboarding conversacional adaptativo (detecta objetivo, estilo de aprendizado)
- ✅ Mapa de domínio a partir de certificados reais via `/performance/certificates`
- ✅ Auto-title de conversas, ThinkingIndicator 3 fases, scroll inteligente com contador de não-lidas
- ✅ ConversationSkeleton durante navegação (Next.js loading boundary)

---

## Fase 1 — Próximas 4 semanas (production polish)

Polish e estabilidade. Sem mudanças arquiteturais.

### Memória cross-session

Hoje cada conversa é isolada. Próximo passo: vetor de longo prazo do que o aluno já perguntou, errou, e dominou.

**Tech relevante:** [Mem0](https://github.com/mem0ai/mem0) — memory layer for LLM apps. Integra com qualquer LLM, armazena em vector store, e expõe API de busca semântica de memórias. Pode ser sobreposto ao Supabase pgvector já existente no projeto.

### RAG re-ranking

Hoje top-5 por cosine similarity. Adicionar segundo estágio de re-ranking com cross-encoder para subir precisão de citação.

**Tech relevante:** [Cohere Rerank API](https://docs.cohere.com/docs/rerank-overview) (comercial, ~$1/1000 queries) ou [ColBERTv2 via RAGatouille](https://github.com/AnswerDotAI/RAGatouille) (open source, late-interaction — mais preciso que bi-encoder em queries complexas).

### Adaptive RAG router

Hoje toda query passa pelo mesmo pipeline. Router classifica complexity:
- Simples ("o que é X?") → RAG direto
- Comparativo ("X vs Y") → GraphRAG
- Multi-hop ("se X então Y, com base em Z") → Agentic RAG

**Tech relevante:** Pattern documentado em [LangGraph](https://github.com/langchain-ai/langgraph).

---

## Fase 2 — Próximas 12 semanas (capability expansion)

Funcionalidades novas que mudam a natureza do produto.

### Tutor que aprende com o aluno ao longo do tempo

A maior limitação atual: o tutor não evolui com cada conversa. Cada session é um reset parcial. Inspirado no [Hermes Agent](https://github.com/0xarkstar/awesome-hermes-agent) da Nous Research (64k+ stars no GitHub, lançado fev/2026), implementar:

- **Persistent memory** — vetor de longo prazo com tudo que o aluno aprendeu, errou, e domina
- **Self-improving skills** — quando o tutor resolve uma dúvida difícil de forma exemplar, salva como skill reutilizável
- **Skill curator autônomo** — cron job que consolida, prunes, e re-prioriza skills a cada 7 dias (padrão Hermes v0.12)

Resultado prático: na 10ª conversa, o tutor já sabe que esse aluno tende a errar questões de licitação, que prefere exemplos práticos a teoria pura, e que estuda melhor com áudio às quintas à noite.

### Voice-to-voice em tempo real

Hoje o podcast é pré-gerado (~30s de latência). Próximo passo: conversa por voz em tempo real com o tutor, latência < 500ms.

**Tech relevante:** [Pipecat AI](https://github.com/pipecat-ai/pipecat) (Daily.co) — framework Python open source que orquestra STT (Deepgram/Whisper) + LLM (OpenAI) + TTS (ElevenLabs/Cartesia) com pipeline de baixíssima latência via WebRTC.

Use case: "Liga o tutor enquanto vou pra prova" — modo conversa via WebRTC no browser, sem instalar nada.

### Multimodal RAG (vídeos das aulas, não só transcrições)

Hoje indexamos só o áudio transcrito. Próximo: indexar frames-chave das aulas (slides, esquemas no quadro) para responder com referência visual.

**Tech relevante:** CLIP embeddings para frames + vector search híbrida texto+imagem. Custo marginal por frame baixo; enriquece muito a qualidade de citação para conteúdo visual (diagramas de organograma, tabelas de competências).

### Plano de estudos generativo com state machine

Hoje "plano de estudos" é uma lista de cursos recomendados. Próximo: plano adaptativo que ajusta a cada quiz feito.

**Tech relevante:** [LangGraph](https://github.com/langchain-ai/langgraph) para state machine durável com checkpointing — plano vira um workflow multi-step que pausa, espera input, e retoma sem perder estado. Cada quiz concluído atualiza o `domain_map` e re-roteiriza o plano.

---

## Fase 3 — 6+ meses (moonshots)

Visão maior. Nenhum desses é trivial — listados como horizonte.

### Coach de carreira pós-aprovação

Após aprovar, o aluno vira servidor. Tutor evolui para coach de carreira: preparação para concursos internos, gestão de carreira pública, atualização em legislação relevante. O mesmo perfil de domínio e histórico de conversas se torna o ponto de partida.

### Comunidade peer-to-peer mediada por IA

Conectar alunos com perfis complementares (forte em X, fraco em Y) para estudo em dupla. Tutor IA medeia: gera pauta da sessão, sugere exercícios conjuntos, registra progresso de ambos.

### Geração de questões CESPE/FCC em escala

Modelo fine-tuned em milhares de provas anteriores que gera questões inéditas mas com o mesmo "feel" da banca. Banco infinito de questões personalizadas ao gap individual — alimentado pelo `domain_map` em tempo real.

---

## Tech stack atual e direção

| Camada | Hoje (v0.1) | Próxima evolução |
|---|---|---|
| LLM | GPT-4o-mini + GPT-4o | Claude Sonnet 4.6 (longer context, tool use nativo) |
| Embeddings | text-embedding-3-small | Voyage-3 ou contextual retrieval (Anthropic) |
| Vector DB | Supabase pgvector (IVFFlat) | + GraphRAG para queries relacionais |
| Voice | ElevenLabs TTS (pré-gerado) | + Pipecat para conversa em tempo real |
| Memory | Conversation-local | Mem0 ou Hermes-style persistent memory |
| Agent | Vercel AI SDK v6 tools | LangGraph para workflows complexos e duráveis |
| Frontend | Next.js 16 + Tailwind v4 | Manter — base sólida, performance comprovada |

---

## Métricas para mensurar evolução

- **Precisão de citação:** % de respostas onde a aula citada realmente contém a informação (atual: ~80% estimado, threshold 0.5)
- **Retenção sessão-a-sessão:** % de alunos que voltam em 7 dias (baseline a estabelecer pós-lançamento)
- **Tempo até primeira resposta útil:** alvo < 1.5s (atual: ~1–2s)
- **Taxa de podcasts ouvidos até o final:** alvo > 70% (proxy de qualidade de roteiro)
- **NPS específico de Modo Flash:** alvo > 60 (signature feature, diferencial competitivo central)
