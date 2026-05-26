import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  if (!cookieStore.has('cefis_key')) redirect('/login')
  return <>{children}</>
}
