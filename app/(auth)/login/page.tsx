import { GraduationCap } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: 'Entrar — CEFIS Tutor' }

export default function LoginPage() {
  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#1a1a1a' }}
    >
      {/* Warm radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% -5%, rgba(224,107,73,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(224,107,73,0.06) 0%, transparent 50%)',
        }}
      />

      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(245,240,235,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,240,235,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6 py-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: 'rgba(224,107,73,0.12)',
              border: '1px solid rgba(224,107,73,0.25)',
              boxShadow: '0 0 20px rgba(224,107,73,0.15)',
            }}
          >
            <GraduationCap className="h-6 w-6" style={{ color: '#e06b49' }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-gradient">CEFIS Tutor</h1>
            <p className="mt-1 text-sm" style={{ color: 'rgba(245,240,235,0.4)' }}>
              Seu tutor de IA personalizado
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: '#242424',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 40px rgba(224,107,73,0.06)',
          }}
        >
          <p className="mb-5 text-center text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: 'rgba(245,240,235,0.35)' }}>
            Acesse com sua conta CEFIS
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-[11px]" style={{ color: 'rgba(245,240,235,0.2)' }}>
          Suas credenciais são usadas apenas para autenticação local
        </p>
      </div>
    </div>
  )
}
