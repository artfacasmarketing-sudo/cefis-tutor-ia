import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Entrar — CEFIS Tutor',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-sm px-6 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            CEFIS Tutor
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Entre com sua conta CEFIS para continuar
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
