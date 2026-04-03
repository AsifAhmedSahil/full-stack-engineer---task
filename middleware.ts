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


// ----------------------- middleware redirect for token----------------

// import { NextRequest, NextResponse } from 'next/server'

// const protectedPaths = ['/feed']
// const authPaths = ['/login', '/register']

// export function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl
//   const token = req.cookies.get('auth_token')?.value

//   // If logged-in user tries to access /login or /register → redirect to /feed
//   const isAuthPath = authPaths.some((p) => pathname.startsWith(p))
//   if (isAuthPath && token) {
//     return NextResponse.redirect(new URL('/feed', req.url))
//   }

//   // If unauthenticated user tries to access protected route → redirect to /login
//   const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
//   if (isProtected && !token) {
//     return NextResponse.redirect(new URL('/login', req.url))
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: ['/feed/:path*', '/login', '/register'],
// }