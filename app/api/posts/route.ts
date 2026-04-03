import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const postSelect = {
  id: true,
  content: true,
  imageUrl: true,
  visibility: true,
  createdAt: true,
  authorId: true,
  author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } } },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      content: true,
      createdAt: true,
      authorId: true,
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } } },
      replies: {
        orderBy: { createdAt: 'asc' as const },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          likes: { select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } } },
        },
      },
    },
  },
  _count: { select: { comments: true, likes: true } },
}

// PATCH /api/posts/[id] — edit post (author only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { content, visibility } = await req.json()

  if (!content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (existing.authorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const post = await prisma.post.update({
    where: { id },
    data: {
      content: content.trim(),
      visibility: visibility === 'private' ? 'private' : 'public',
    },
    select: postSelect,
  })

  return NextResponse.json({ post })
}

// DELETE /api/posts/[id] — delete post (author only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { authorId: true },
  })
  if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (existing.authorId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.post.delete({ where: { id } })

  return NextResponse.json({ success: true })
}