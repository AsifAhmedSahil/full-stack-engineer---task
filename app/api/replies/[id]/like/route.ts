import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: replyId } = await params

  const existing = await prisma.like.findUnique({
    where: { userId_replyId: { userId: user.id, replyId } },
  })

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } })
  } else {
    await prisma.like.create({ data: { userId: user.id, replyId } })
  }

  const likes = await prisma.like.findMany({
    where: { replyId },
    select: { userId: true, user: { select: { id: true, firstName: true, lastName: true } } },
  })

  return NextResponse.json({ liked: !existing, likes })
}
