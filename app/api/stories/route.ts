
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const storySelect = {
  id: true,
  type: true,
  imageUrl: true,
  text: true,
  bgColor: true,
  authorId: true,
  createdAt: true,
  expiresAt: true,
  author: {
    select: { id: true, firstName: true, lastName: true, avatar: true },
  },
  reactions: {
    select: {
      id: true,
      emoji: true,
      userId: true,
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  },
}

export async function GET() {
  try {
    const now = new Date()

    const stories = await prisma.story.findMany({
      where: { expiresAt: { gt: now } },
      select: storySelect,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(stories)
  } catch (err) {
    console.error('GET /api/stories error:', err)
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, imageUrl, text, bgColor } = await req.json()

    if (!type || (type === 'photo' && !imageUrl) || (type === 'text' && !text?.trim())) {
      return NextResponse.json({ error: 'Invalid story data' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) 

    const story = await prisma.story.create({
      data: {
        type,
        imageUrl: imageUrl ?? null,
        text: text?.trim() ?? null,
        bgColor: bgColor ?? null,
        authorId: user.id,
        expiresAt,
      },
      select: storySelect,
    })

    return NextResponse.json(story, { status: 201 })
  } catch (err) {
    console.error('POST /api/stories error:', err)
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
  }
}