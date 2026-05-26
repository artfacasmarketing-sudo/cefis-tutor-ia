import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  if (!cookieStore.has('cefis_key')) redirect('/login')

  return (
    <div className="flex min-h-screen" style={{ background: '#1a1a1a' }}>
      <Sidebar />
      {/* Main content: sidebar offset on desktop, hamburger offset on mobile */}
      <div className="flex-1 min-w-0 md:pl-56 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  )
}
