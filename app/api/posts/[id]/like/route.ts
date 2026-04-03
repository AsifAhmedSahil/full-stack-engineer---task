import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: postId } = await params

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
  } else {
    await prisma.like.create({ data: { userId: user.id, postId } })
  }

  const likes = await prisma.like.findMany({
    where: { postId },
    select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } },
  })

  return NextResponse.json({ liked: !existing, likes })
}
