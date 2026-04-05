import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = ['/feed']
const authPaths = ['/login', '/register']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('auth_token')?.value

  const isProtected = protectedPaths.some((p) =>
    pathname.startsWith(p)
  )

  const isAuthPage = authPaths.some((p) =>
    pathname.startsWith(p)
  )

  // ❌ Not logged in → block protected pages
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ❌ Already logged in → block login/register
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/feed', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/feed/:path*', '/login', '/register'],
}