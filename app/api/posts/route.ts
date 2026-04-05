import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const postSelect = {
  id: true,
  content: true,
  imageUrl: true,
  imageUrls: true, // ✅ added
  visibility: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
  likes: {
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar:true
        },
      },
    },
  },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      content: true,
      createdAt: true,
      imageUrl: true,
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      likes: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      replies: {
        orderBy: { createdAt: 'asc' as const },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          likes: {
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  },
  _count: {
    select: {
      comments: true,
      likes: true,
    },
  },
}

// ✅ GET POSTS
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const take = 10

  const where = user
    ? {
        OR: [
          { visibility: 'public' },
          { authorId: user.id },
        ],
      }
    : { visibility: 'public' }

  const posts = await prisma.post.findMany({
  where,
  orderBy: { createdAt: 'desc' },
  take,
  ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  select: postSelect,
})

// Calculate total comments including replies
const postsWithTotalComments = posts.map((post) => {
  const totalComments = post.comments.reduce((acc, comment) => {
    return acc + 1 + (comment.replies?.length || 0)
  }, 0)

  return { ...post, totalComments }
})

const nextCursor =
  posts.length === take ? posts[posts.length - 1].id : null

return NextResponse.json({ posts: postsWithTotalComments, nextCursor })
}

// ✅ CREATE POST (FIXED 🔥)
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { content, imageUrl, imageUrls, visibility } = await req.json()

  // ✅ allow post with only images
  if (!content?.trim() && (!imageUrls || imageUrls.length === 0)) {
    return NextResponse.json(
      { error: 'Content or images required' },
      { status: 400 }
    )
  }

  const post = await prisma.post.create({
    data: {
      content: content?.trim() || '📷 Shared photos',
      imageUrl: imageUrl || null,
      imageUrls: imageUrls || [], // ✅ main fix
      visibility: visibility === 'private' ? 'private' : 'public',
      authorId: user.id,
    },
    select: postSelect,
  })

  return NextResponse.json({ post }, { status: 201 })
}