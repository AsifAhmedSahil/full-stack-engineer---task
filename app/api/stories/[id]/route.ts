
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const story = await prisma.story.findUnique({ where: { id } })
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }
    if (story.authorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    
    await prisma.storyReaction.deleteMany({ where: { storyId: id } })
    await prisma.story.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE /api/stories/[id] error:', err)
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 })
  }
}