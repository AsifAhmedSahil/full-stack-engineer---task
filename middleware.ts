import { NextRequest, NextResponse } from 'next/server'


const protectedPaths = ['/feed']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('auth_token')?.value
  // We only check if the token exists here. 
  // The actual JWT signature verification is done securely in the Server Components
  // (Node.js runtime) because 'jsonwebtoken' does not run on the Edge runtime.
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/feed/:path*'],
}
