import { GraduationCap } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: 'Entrar — CEFIS Tutor' }

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#020617]">
      {/* Radial gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(139,92,246,0.08) 0%, transparent 50%)',
        }}
      />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm px-6 py-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/30 backdrop-blur-sm glow-indigo-sm">
            <GraduationCap className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="text-center">
            <h1 className="text-gradient text-2xl font-semibold tracking-tight">
              CEFIS Tutor
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Seu tutor de IA personalizado
            </p>
          </div>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-6 glow-indigo">
          <p className="mb-5 text-xs text-white/50 text-center tracking-wide uppercase font-medium">
            Acesse com sua conta CEFIS
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-[11px] text-white/25">
          Suas credenciais CEFIS são usadas apenas para autenticação local
        </p>
      </div>
    </div>
  )
}
