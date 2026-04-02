import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { setAuthCookie, signToken } from '@/lib/auth'


export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const emailTrimmed = email.trim().toLowerCase()
    const user = await prisma.user.findUnique({ where: { email: emailTrimmed } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = signToken(user.id)
    const headers = setAuthCookie(token)

    return NextResponse.json(
      { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } },
      { status: 200, headers }
    )
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
