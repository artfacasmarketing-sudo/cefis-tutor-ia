import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppNav } from '@/components/layout/AppNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  if (!cookieStore.has('cefis_key')) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50">
      <AppNav />
      {children}
    </div>
  )
}
