import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { postId, content, imageUrl } = await req.json()
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 })
  if (!content?.trim() && !imageUrl) return NextResponse.json({ error: 'Content or image required' }, { status: 400 })

  // Verify post exists and is visible
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      OR: [{ visibility: 'public' }, { authorId: user.id }],
    },
    select: { id: true },
  })
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const comment = await prisma.comment.create({
    data: {
      content: content?.trim() || '📷',
      imageUrl: imageUrl || null,
      postId,
      authorId: user.id,
    },
    select: {
      id: true, content: true, imageUrl: true, createdAt: true, authorId: true,
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      replies: {
        select: {
          id: true, content: true, imageUrl: true, createdAt: true,
          author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
        },
      },
    },
  })

  return NextResponse.json({ comment }, { status: 201 })
}