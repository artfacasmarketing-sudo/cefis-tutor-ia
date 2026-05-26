'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function GenerateButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/podcast/generate', { method: 'POST' })
      const data = await res.json() as { audioId?: string; error?: string }

      if (!res.ok || !data.audioId) {
        toast.error(data.error ?? 'Falha ao iniciar geração do podcast')
        return
      }

      router.push(`/podcast/${data.audioId}`)
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      size="lg"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {loading ? 'Iniciando geração...' : 'Gerar Podcast'}
    </Button>
  )
}
