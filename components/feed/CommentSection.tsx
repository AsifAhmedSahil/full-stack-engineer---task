'use client'

import { useState, useRef } from 'react'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface LikeUser {
  userId: string
  user?: { id: string; firstName: string; lastName: string; avatar?: string | null }
}

interface Reply {
  id: string
  content: string
  imageUrl?: string | null
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
interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string | null
}


interface Props {
  comments: Comment[]
  postId: string
  currentUserId: string
  currentUser:CurrentUser
  onCommentAdded: (comment: Comment) => void
  onReplyAdded?: () => void  // ← এটা যোগ করো
}
function MiniAvatar({ avatar, firstName, lastName, size = 32 }: {
  avatar?: string | null; firstName: string; lastName: string; size?: number
}) {
  if (avatar) {
    return <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#1890FF', color: '#fff', fontWeight: 700,
      fontSize: Math.floor(size * 0.35), display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0,
    }}>
      {firstName[0]}{lastName[0]}
    </div>
  )
}

/* ── LikeBadge ── */
function LikeBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div style={{
      position: 'absolute', bottom: -11, right: 8,
      background: 'var(--bg2, #fff)', borderRadius: 10,
      boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
      display: 'flex', alignItems: 'center', gap: 3,
      padding: '2px 6px',
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#1890FF">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color6, #212121)' }}>{count}</span>
    </div>
  )
}

/* ── Comment Input Box (reused for main + reply) ── */
function CommentInput({
  placeholder,
  value,
  onChange,
  onSubmit,
  submitting,
  imagePreview,
  onImageChange,
  onImageRemove,
  autoFocus = false,
  size = 'normal',
}: {
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  submitting: boolean
  imagePreview: string | null
  onImageChange: (file: File) => void
  onImageRemove: () => void
  autoFocus?: boolean
  size?: 'normal' | 'small'
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const isSmall = size === 'small'

  return (
    <div style={{ flex: 1 }}>
      {/* Image preview */}
      {imagePreview && (
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 6 }}>
          <img src={imagePreview} alt="" style={{
            width: isSmall ? 60 : 80, height: isSmall ? 60 : 80,
            objectFit: 'cover', borderRadius: 8, display: 'block',
          }} />
          <button onClick={onImageRemove} style={{
            position: 'absolute', top: -6, right: -6,
            background: '#444', color: '#fff', border: 'none',
            borderRadius: '50%', width: 18, height: 18, cursor: 'pointer',
            fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Image attach button */}
        <button type="button" onClick={() => fileRef.current?.click()} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: '#65676B', flexShrink: 0, display: 'flex', alignItems: 'center',
        }} title="Add image">
          <svg xmlns="http://www.w3.org/2000/svg" width={isSmall ? 16 : 18} height={isSmall ? 16 : 18} fill="none" viewBox="0 0 20 20">
            <path fill="#65676B" d="M13.916 0c3.109 0 5.18 2.429 5.18 5.914v8.17c0 3.486-2.072 5.916-5.18 5.916H5.999C2.89 20 .827 17.572.827 14.085v-8.17C.827 2.43 2.897 0 6 0h7.917zm0 1.504H5.999c-2.321 0-3.799 1.735-3.799 4.41v8.17c0 2.68 1.472 4.412 3.799 4.412h7.917c2.328 0 3.807-1.734 3.807-4.411v-8.17c0-2.678-1.478-4.411-3.807-4.411zm.65 8.68l.12.125 1.9 2.147a.803.803 0 01-.016 1.063.642.642 0 01-.894.058l-.076-.074-1.9-2.148a.806.806 0 00-1.205-.028l-.074.087-2.04 2.717c-.722.963-2.02 1.066-2.86.26l-.111-.116-.814-.91a.562.562 0 00-.793-.07l-.075.073-1.4 1.617a.645.645 0 01-.97.029.805.805 0 01-.09-.977l.064-.086 1.4-1.617c.736-.852 1.95-.897 2.734-.137l.114.12.81.905a.587.587 0 00.861.033l.07-.078 2.04-2.718c.81-1.08 2.27-1.19 3.205-.275zM6.831 4.64c1.265 0 2.292 1.125 2.292 2.51 0 1.386-1.027 2.511-2.292 2.511S4.54 8.537 4.54 7.152c0-1.386 1.026-2.51 2.291-2.51zm0 1.504c-.507 0-.918.451-.918 1.007 0 .555.411 1.006.918 1.006.507 0 .919-.451.919-1.006 0-.556-.412-1.007-.919-1.007z" />
          </svg>
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onImageChange(f) }} />

        {/* Text input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={value}
            autoFocus={autoFocus}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
            style={{ borderRadius: 20, paddingRight: 40, fontSize: isSmall ? 13 : 14, color: 'var(--color, #2D3748)' }}
          />
          <button type="button" disabled={submitting || (!value.trim() && !imagePreview)} onClick={onSubmit} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', padding: 0,
            cursor: (value.trim() || imagePreview) ? 'pointer' : 'default',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 14 13">
              <path fill={(value.trim() || imagePreview) ? '#1890FF' : '#ccc'} fillRule="evenodd" d="M6.37 7.879l2.438 3.955a.335.335 0 00.34.162c.068-.01.23-.05.289-.247l3.049-10.297a.348.348 0 00-.09-.35.341.341 0 00-.34-.088L1.75 4.03a.34.34 0 00-.247.289.343.343 0 00.16.347L5.666 7.17 9.2 3.597a.5.5 0 01.712.703L6.37 7.88z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Upload helper ── */
async function uploadImage(file: File): Promise<string | null> {
  if (!file) return null;

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await fetch('/api/uploadcloudinary', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Upload failed:', err)
      return null
    }

    const data = await res.json()
    return data.url || null
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    return null
  }
}

/* ── Reply Item ── */
function ReplyItem({ reply, currentUserId, onReply }: {
  reply: Reply; currentUserId: string; onReply: () => void
}) {
  const [likes, setLikes] = useState(reply.likes)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const liked = likes.some(l => l.userId === currentUserId)

  const toggleLike = async () => {
    const res = await fetch(`/api/replies/${reply.id}/like`, { method: 'POST' })
    if (res.ok) { const data = await res.json(); setLikes(data.likes) }
  }

  // reply to reply → call parent's onReply to open the parent comment's reply box
  const handleReplyClick = () => {
    onReply()
  }

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 10, marginLeft: 44 }}>
      <MiniAvatar avatar={reply.author.avatar} firstName={reply.author.firstName} lastName={reply.author.lastName} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: 'var(--bg3, #F0F2F5)', borderRadius: '0 12px 12px 12px',
          padding: '7px 12px', display: 'inline-block', maxWidth: '100%', position: 'relative',
        }}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--color6, #212121)', margin: '0 0 2px' }}>
            {reply.author.firstName} {reply.author.lastName}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color, #2D3748)', margin: 0, wordBreak: 'break-word' }}>{reply.content}</p>
          {reply.imageUrl && (
            <img src={reply.imageUrl} alt="" style={{
              width: 80, height: 80, objectFit: 'cover', borderRadius: 6, marginTop: 6, display: 'block',
            }} />
          )}
          <LikeBadge count={likes.length} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: likes.length > 0 ? 14 : 5, paddingLeft: 2 }}>
          <button onClick={toggleLike} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 11, fontWeight: 700, color: liked ? '#1890FF' : '#65676B',
          }}>{liked ? 'Liked' : 'Like'}{likes.length > 0 ? ` · ${likes.length}` : ''}</button>
          <span style={{ color: '#65676B', fontSize: 11 }}>·</span>
          {/* Reply on a reply → opens parent comment's reply box */}
          <button onClick={handleReplyClick} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 11, fontWeight: 700, color: '#65676B',
          }}>Reply</button>
          <span style={{ color: '#65676B', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 11, color: '#65676B' }}>{timeAgo(reply.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

/* ── Comment Item ── */
function CommentItem({ comment, currentUserId, onNewReply ,onReplyAdded}: {
  comment: Comment; currentUserId: string
  onNewReply?: () => void , // unused externally but kept for consistency,
  onReplyAdded?: () => void
}) {
  const [likes, setLikes] = useState(comment.likes)
  const [replies, setReplies] = useState<Reply[]>(comment.replies)
  const [collapsed, setCollapsed] = useState(false)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const liked = likes.some(l => l.userId === currentUserId)

  const toggleLike = async () => {
    const res = await fetch(`/api/comments/${comment.id}/like`, { method: 'POST' })
    if (res.ok) { const data = await res.json(); setLikes(data.likes) }
  }

  const openReplyBox = () => {
    setShowReplyBox(true)
    setCollapsed(false)
  }

  const submitReply = async () => {
    const trimmed = replyText.trim()
    if ((!trimmed && !replyImage) || submitting) return
    setSubmitting(true)
    try {
      let imageUrl: string | null = null
      if (replyImage) imageUrl = await uploadImage(replyImage)

      const res = await fetch('/api/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id, content: trimmed || '📷', imageUrl }),
      })
     if (res.ok) {
  const data = await res.json()
  setReplies(prev => [...prev, data.reply])
  setCollapsed(false)
  setReplyText('')
  setReplyImage(null)
  setReplyImagePreview(null)
  setShowReplyBox(false)
  onReplyAdded?.()  // ← এটা যোগ করো
}
    } finally {
      setSubmitting(false)
    }
  }

  console.log(comment.imageUrl)

  return (
    <div className="_comment_main" style={{ marginBottom: 20, alignItems: 'flex-start' }}>
      <div className="_comment_image" style={{ flexShrink: 0 }}>
        <MiniAvatar avatar={comment.author.avatar} firstName={comment.author.firstName} lastName={comment.author.lastName} size={36} />
      </div>
      <div className="_comment_area" style={{ flex: 1, minWidth: 0 }}>
        {/* Bubble */}
        <div style={{
          background: 'var(--bg3, #F0F2F5)',
          borderRadius: '0 12px 12px 12px',
          padding: '10px 14px', display: 'inline-block', maxWidth: '100%', position: 'relative',
        }}>
          <h4 className="_comment_name_title" style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, color: 'var(--color6, #212121)' }}>
            {comment.author.firstName} {comment.author.lastName}
          </h4>
          <p className="_comment_status_text" style={{ fontSize: 13, margin: 0, color: 'var(--color, #2D3748)', wordBreak: 'break-word' }}>
            {comment.content}
          </p>
          {comment.imageUrl && (
            <img src={comment.imageUrl} alt="" style={{
              width: 100, height: 100, objectFit: 'cover', borderRadius: 8,
              marginTop: 8, display: 'block',
            }} />
          )}
          <LikeBadge count={likes.length} />
        </div>

        {/* Action row */}
        <div style={{ marginTop: likes.length > 0 ? 16 : 6, paddingLeft: 2 }}>
          <ul className="_comment_reply_list" style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0, margin: 0 }}>
            <li>
              <button onClick={toggleLike} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 12, fontWeight: 700, color: liked ? '#1890FF' : '#65676B',
              }}>{liked ? 'Liked' : 'Like'}</button>
            </li>
            <li><span style={{ color: '#65676B', fontSize: 12 }}>·</span></li>
            <li>
              <button onClick={openReplyBox} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 12, fontWeight: 700, color: '#65676B',
              }}>Reply</button>
            </li>
            <li><span style={{ color: '#65676B', fontSize: 12 }}>·</span></li>
            <li><span style={{ fontSize: 12, color: '#65676B' }}>{timeAgo(comment.createdAt)}</span></li>
          </ul>
        </div>

        {/* Replies toggle */}
        {replies.length > 0 && (
          <button onClick={() => setCollapsed(v => !v)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, color: '#65676B',
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, padding: 0,
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#65676B" strokeWidth="2.5">
              {collapsed
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              }
            </svg>
            {collapsed
              ? `View ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
              : 'Hide replies'
            }
          </button>
        )}

        {/* Replies list */}
        {!collapsed && replies.map(r => (
          <ReplyItem
            key={r.id}
            reply={r}
            currentUserId={currentUserId}
            onReply={openReplyBox} 
          />
        ))}

        {/* Reply input box */}
        {showReplyBox && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'flex-start' }}>
            <MiniAvatar avatar={null} firstName="Y" lastName="u" size={26} />
            <CommentInput
              placeholder="Write a reply…"
              value={replyText}
              onChange={setReplyText}
              onSubmit={submitReply}
              submitting={submitting}
              imagePreview={replyImagePreview}
              onImageChange={f => { setReplyImage(f); setReplyImagePreview(URL.createObjectURL(f)) }}
              onImageRemove={() => { setReplyImage(null); setReplyImagePreview(null) }}
              autoFocus
              size="small"
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main CommentSection ── */
export default function CommentSection({ 
  comments: initial, 
  postId, 
  currentUserId, 
  currentUser,
  onCommentAdded,
  onReplyAdded   // ← ADD THIS
}: Props) {
  const [comments, setComments] = useState<Comment[]>(initial)
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const submit = async () => {
    const trimmed = text.trim()
    if ((!trimmed && !image) || posting) return
    setPosting(true)
    try {
      let imageUrl: string | null = null
      if (image) imageUrl = await uploadImage(image)

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: trimmed || '📷', imageUrl }),
      })
      if (res.ok) {
        const data = await res.json()
        const newComment: Comment = { ...data.comment, replies: [], likes: [] }
        setComments(c => [...c, newComment])
        onCommentAdded(newComment)
        setText('')
        setImage(null)
        setImagePreview(null)
        setShowAll(true)
      }
    } finally {
      setPosting(false)
    }
  }

  const hiddenCount = comments.length - 3
  const visible = showAll ? comments : comments.slice(-3)

  console.log(visible)

  return (
    <div className="_feed_inner_timeline_cooment_area" style={{ paddingTop: 12 }}>
      {/* Main comment input */}
      <div className="_feed_inner_comment_box" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <MiniAvatar avatar={currentUser.avatar} firstName={currentUser.firstName} lastName={currentUser.lastName} size={34} />
        <CommentInput
          placeholder="Write a comment…"
          value={text}
          onChange={setText}
          onSubmit={submit}
          submitting={posting}
          imagePreview={imagePreview}
          onImageChange={f => { setImage(f); setImagePreview(URL.createObjectURL(f)) }}
          onImageRemove={() => { setImage(null); setImagePreview(null) }}
        />
      </div>

      {/* Comments list */}
      <div className="_timline_comment_main">
        {!showAll && hiddenCount > 0 && (
          <div className="_previous_comment" style={{ marginBottom: 10 }}>
            <button className="_previous_comment_txt"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#65676B' }}
              onClick={() => setShowAll(true)}>
              View {hiddenCount} previous comment{hiddenCount > 1 ? 's' : ''}
            </button>
          </div>
        )}
        {visible.map(c => (
  <CommentItem 
    key={c.id} 
    comment={c} 
    currentUserId={currentUserId}
    onReplyAdded={onReplyAdded} 
  />
))}
      </div>
    </div>
  )
}