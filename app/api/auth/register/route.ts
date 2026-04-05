import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { setAuthCookie, signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password, avatar } = await req.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const emailTrimmed = email.trim().toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: emailTrimmed } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: emailTrimmed,
        password: hashed,
        avatar: avatar || null,   // ← optional profile photo
      },
    })

    const token = signToken(user.id)
    const headers = setAuthCookie(token)

    return NextResponse.json(
      { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, avatar: user.avatar } },
      { status: 201, headers }
    )
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}