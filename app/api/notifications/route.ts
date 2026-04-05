// app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Build notifications from likes and comments on user's posts
  const [postLikes, postComments, commentLikes] = await Promise.all([
    // Someone liked my post
    prisma.like.findMany({
      where: {
        post: { authorId: user.id },
        userId: { not: user.id }, // exclude self
        postId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        post: { select: { id: true, content: true } },
      },
    }),

    // Someone commented on my post
    prisma.comment.findMany({
      where: {
        post: { authorId: user.id },
        authorId: { not: user.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        post: { select: { id: true, content: true } },
      },
    }),

    // Someone liked my comment
    prisma.like.findMany({
      where: {
        comment: { authorId: user.id },
        userId: { not: user.id },
        commentId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        comment: { select: { id: true, content: true, postId: true } },
      },
    }),
  ])

  // Merge and format
  const notifications = [
    ...postLikes.map(l => ({
      id: `like_${l.id}`,
      type: 'post_like' as const,
      actor: l.user,
      postId: l.post?.id,
      preview: l.post?.content?.slice(0, 50),
      createdAt: l.createdAt.toISOString(),
    })),
    ...postComments.map(c => ({
      id: `comment_${c.id}`,
      type: 'post_comment' as const,
      actor: c.author,
      postId: c.post?.id,
      preview: c.content?.slice(0, 50),
      createdAt: c.createdAt.toISOString(),
    })),
    ...commentLikes.map(l => ({
      id: `clike_${l.id}`,
      type: 'comment_like' as const,
      actor: l.user,
      postId: l.comment?.postId,
      preview: l.comment?.content?.slice(0, 50),
      createdAt: l.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30)

  return NextResponse.json({ notifications })
}