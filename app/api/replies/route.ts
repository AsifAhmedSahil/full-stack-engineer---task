import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Create a reply to a comment
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentId, content } = await req.json()
  if (!commentId || !content?.trim()) {
    return NextResponse.json({ error: 'commentId and content are required' }, { status: 400 })
  }

  const reply = await prisma.reply.create({
    data: { content: content.trim(), commentId, authorId: user.id },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } } },
    },
  })

  return NextResponse.json({ reply }, { status: 201 })
}
