import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { commentId, content, imageUrl } = await req.json()
  if (!commentId) return NextResponse.json({ error: 'commentId required' }, { status: 400 })
  if (!content?.trim() && !imageUrl) return NextResponse.json({ error: 'Content or image required' }, { status: 400 })

  // Verify comment exists
  const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true } })
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 })

  const reply = await prisma.reply.create({
    data: {
      content: content?.trim() || '📷',
      imageUrl: imageUrl || null,
      commentId,
      authorId: user.id,
    },
    select: {
      id: true, content: true, imageUrl: true, createdAt: true,
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
    },
  })

  return NextResponse.json({ reply }, { status: 201 })
}