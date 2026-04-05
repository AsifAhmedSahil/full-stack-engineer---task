'use client'

import { useState } from 'react'

import CreatePost from './CreatePost'
import PostCard from './PostCard'

interface LikeUser {
  userId: string
  user?: { id: string; firstName: string; lastName: string ;avatar:string}
}

interface Reply {
  id: string
  content: string
  imageUrl: string | null
  createdAt: string
  author: { id: string; firstName: string; lastName: string; avatar?: string | null }
  likes: LikeUser[]
}

interface Comment {
  id: string
  content: string
  imageUrl: string | null
  createdAt: string
  authorId: string
  author: { id: string; firstName: string; lastName: string; avatar?: string | null }
  likes: LikeUser[]
  replies: Reply[]
}

export interface Post {
  id: string
  content: string
  imageUrl?: string | null
  visibility: string
  createdAt: string
  authorId: string
  author: { id: string; firstName: string; lastName: string; avatar?: string | null }
  likes: LikeUser[]
  comments: Comment[]
  _count: { likes: number; comments: number }
}

interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string | null
}

interface Props {
  initialPosts: Post[]
  currentUser: CurrentUser
}

export default function FeedClient({ initialPosts, currentUser }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev])
  }

  const handlePostDeleted = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  
console.log(posts)
  return (
    <div>
      <CreatePost currentUser={currentUser} onPost={handlePostCreated} />

      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUser.id}
          onDeleted={handlePostDeleted}
          currentUser={currentUser}
        />
      ))}

      {posts.length === 0 && (
        <div className="_feed_inner_timeline_post_area _b_radious6 _padd_t24 _padd_b24 _padd_l24 _padd_r24" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📝</p>
          <p className="_feed_inner_timeline_post_box_para">No posts yet. Be the first to share something!</p>
        </div>
      )}
    </div>
  )
}