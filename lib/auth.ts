import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const TOKEN_COOKIE = 'auth_token'

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_COOKIE)?.value
    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    })
    return user
  } catch {
    return null
  }
}

export function setAuthCookie(token: string): Record<string, string> {
  return {
    'Set-Cookie': `${TOKEN_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax`,
  }
}

export function clearAuthCookie(): Record<string, string> {
  return {
    'Set-Cookie': `${TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
  }
}
