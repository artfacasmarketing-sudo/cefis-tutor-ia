import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/onboarding', '/chat', '/plano', '/podcast']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasKey = request.cookies.has('cefis_key')

  if (PROTECTED.some(p => pathname.startsWith(p)) && !hasKey) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && hasKey) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/chat/:path*',
    '/plano/:path*',
    '/podcast/:path*',
    '/login',
  ],
}
