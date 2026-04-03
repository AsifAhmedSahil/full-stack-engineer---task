import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// Create a comment on a post
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, content } = await req.json()
  if (!postId || !content?.trim()) {
    return NextResponse.json({ error: 'postId and content are required' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: { content: content.trim(), postId, authorId: user.id },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } } },
      replies: {
        select: {
          id: true, content: true, createdAt: true,
          author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } } },
        },
      },
    },
  })

  return NextResponse.json({ comment }, { status: 201 })
}
