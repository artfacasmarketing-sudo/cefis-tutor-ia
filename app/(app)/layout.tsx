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
    <div className="flex flex-col min-h-screen bg-[#020617]">
      <AppNav />
      <div className="flex-1 bg-[#020617]">
        {children}
      </div>
    </div>
  )
}
