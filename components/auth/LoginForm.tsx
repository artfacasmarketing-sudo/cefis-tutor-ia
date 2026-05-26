'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { toast.error(data.error ?? 'Erro ao fazer login'); return }
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-indigo-500/60 focus:bg-white/8 focus:ring-2 focus:ring-indigo-500/20'

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-wider text-white/40">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="seu@email.com"
          required
          autoComplete="email"
          disabled={loading}
          className={inputClass}
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium uppercase tracking-wider text-white/40">
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={loading}
          className={inputClass}
        />
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        style={{ boxShadow: '0 0 20px rgba(99,102,241,0.35)' }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Entrar
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </motion.button>
    </motion.form>
  )
}
