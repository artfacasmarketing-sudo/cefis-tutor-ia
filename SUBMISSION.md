# Formulário de Submissão — Hackathon CEFIS 2026

---

## Campo 1: DESCRIÇÃO DO PROJETO (~250 palavras)

Imagine um professor particular que assistiu todas as 7.447 aulas que você paga na CEFIS, leu seus 57 certificados, e te chama pelo nome. Esse é o CEFIS Tutor IA — e ele não inventa resposta: cita a aula de origem em cada explicação.

O sistema autentica com as credenciais CEFIS do usuário, importa automaticamente seus certificados e calcula um mapa de domínio preciso: quais áreas ele domina, quais são parciais e quais são lacunas críticas que precisam de atenção imediata. Esse diagnóstico alimenta um plano de estudo personalizado com cursos reais do catálogo CEFIS ordenados por prioridade.

O chat central responde dúvidas com base em 18.344 trechos de transcrições de 7.447 aulas reais da CEFIS — indexados com busca vetorial (pgvector) e citando a aula de origem em cada resposta. Quando o aluno menciona urgência ("tenho 15 minutos, prova amanhã"), o sistema ativa o Modo Flash: detecta o maior gap, gera um resumo do conteúdo CEFIS e monta 5 questões objetivas interativas em segundos.

A feature diferencial é a geração de podcasts diretamente do chat. O aluno digita "me faz um podcast sobre Contabilidade" e, sem sair da conversa, o agente chama uma tool que aciona o pipeline: busca o conteúdo relevante das aulas, gera um script de 1 minuto com GPT-4o, narra com ElevenLabs e entrega um player de áudio inline enquanto a conversa continua. O histórico de conversas é persistido com estrutura de threads, incluindo rehydratação completa de tool calls.

**Stack:** Next.js 16 · React 19 · Vercel AI SDK v6 · OpenAI (GPT-4o/mini + embeddings) · Supabase (pgvector) · ElevenLabs TTS · TypeScript strict

---

## Campo 2: POR QUE SEU PROJETO DEVE SER ESCOLHIDO (~300 palavras)

**1. Outros tutores de IA dão respostas com sabor de Wikipedia. O nosso cita a aula que o aluno tá pagando agora.**

O projeto não imita a CEFIS — ele se conecta à API real dela em duas versões (v1 e v3). O mapa de domínio é calculado a partir dos certificados reais do aluno (`/performance/certificates`), com média de acerto por categoria. O plano de estudo busca cursos reais do catálogo via `GET /courses?search={gap}`. O chat cita a aula e o curso de origem de cada resposta, porque o contexto vem de 18.344 chunks de transcrições reais indexados com pgvector — não de um PDF genérico sobre direito administrativo. Isso endereça diretamente o critério de Integração CEFIS (25 pts).

**2. 'Tenho 15 minutos antes da prova. Me salva.' — o Modo Flash responde isso em 5 segundos.**

Todo concurseiro já viveu "tenho 20 minutos antes da prova, o que revisar?". O Modo Flash detecta automaticamente essa urgência no chat, identifica o maior gap do aluno pelo domain_map, e entrega: resumo do conteúdo das aulas CEFIS + 5 questões objetivas no estilo CESPE/FCC com gabarito interativo. Nenhuma plataforma de estudos faz isso em segundos, baseado no gap real do aluno, com conteúdo rastreável às aulas que ele já faz. Isso demonstra Qualidade da IA (20 pts) e Inovação (15 pts) simultaneamente.

**3. A CEFIS prende o aluno na tela. Nosso podcast libera ele pro Uber, academia e antes de dormir — com áudio gerado das aulas que ele compra.**

A CEFIS é uma plataforma de vídeo — requer atenção visual. O podcast inline cria um novo momento de consumo de conteúdo CEFIS: no carro, na academia, no transporte. O aluno diz "quero ouvir sobre Princípio da Legalidade" dentro do próprio chat, e em ~30 segundos recebe um áudio narrado em PT-BR com conteúdo extraído das transcrições de aulas reais — não texto de internet. O pipeline completo (RAG → GPT-4o script → ElevenLabs TTS → Storage → player wavesurfer.js inline) está funcionando em produção, demonstrando maturidade técnica e diferencial competitivo real.
