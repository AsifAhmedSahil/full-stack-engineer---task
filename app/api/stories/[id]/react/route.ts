
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emoji } = await req.json()
    if (!emoji) {
      return NextResponse.json({ error: 'Emoji required' }, { status: 400 })
    }

    const existing = await prisma.storyReaction.findUnique({
      where: { storyId_userId: { storyId: id, userId: user.id } },
    })

    if (existing) {
      if (existing.emoji === emoji) {
        // Same emoji → toggle off - pore kaj korbo update
        await prisma.storyReaction.delete({ where: { id: existing.id } })
        return NextResponse.json({ action: 'removed', emoji })
      } else {
        
        const updated = await prisma.storyReaction.update({
          where: { id: existing.id },
          data: { emoji },
          select: {
            id: true, emoji: true, userId: true,
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
        })
        return NextResponse.json({ action: 'updated', reaction: updated })
      }
    } else {
      // New reaction count kora lagbe
      const created = await prisma.storyReaction.create({
        data: { storyId: id, userId: user.id, emoji },
        select: {
          id: true, emoji: true, userId: true,
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      })
      return NextResponse.json({ action: 'created', reaction: created })
    }
  } catch (err) {
    console.error('POST /api/stories/[id]/react error:', err)
    return NextResponse.json({ error: 'Failed to react' }, { status: 500 })
  }
}