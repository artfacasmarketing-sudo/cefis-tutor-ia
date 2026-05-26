# CEFIS Tutor IA 🎓

Tutor de aprendizado com inteligência artificial para o **Hackathon CEFIS 2026**.

## 🔗 Demo
> Em breve — deploy Vercel

## 🎯 O que faz

- **Onboarding conversacional** — o tutor já conhece você via API CEFIS
- **Diagnóstico automático** — detecta lacunas pelo accuracy dos certificados
- **Plano de estudos personalizado** — combina catálogo CEFIS + trilhas + IA
- **Chat de dúvidas com RAG** — responde com base nas transcrições reais (7.447 aulas indexadas)
- **Podcast personalizado** — GPT-4o roteiro + ElevenLabs narração

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui |
| IA | Vercel AI SDK, OpenAI GPT-4o/mini, text-embedding-3-small |
| RAG | Supabase pgvector, 18.344 chunks indexados |
| Audio | ElevenLabs Multilingual v2 |
| Deploy | Vercel |

## Como rodar

```bash
git clone https://github.com/SEU_USER/cefis-tutor-ia
cd cefis-tutor-ia
npm install
cp .env.example .env.local
npm run dev
```

## Variaveis necessarias

OPENAI_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, INGEST_SECRET
