'use client'

import { useState, useRef, useEffect } from 'react'
import CommentSection from './CommentSection'

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
  id: string; content: string; createdAt: string
  author: { id: string; firstName: string; lastName: string; avatar?: string | null }
  likes: LikeUser[]
}
interface Comment {
  id: string; content: string; imageUrl: string | null; createdAt: string; authorId: string
  author: { id: string; firstName: string; lastName: string; avatar?: string | null }
  likes: LikeUser[]; replies: Reply[]
}
interface Post {
  id: string; content: string; imageUrl?: string | null
  imageUrls?: string[]        
  visibility: string; createdAt: string; authorId: string
  author: { id: string; firstName: string; lastName: string; avatar?: string | null }
  likes: LikeUser[]; comments: Comment[]
  _count: { likes: number; comments: number }
}
interface CurrentUser {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string | null
}

interface Props { post: Post; currentUserId: string; currentUser:CurrentUser, onDeleted?: (id: string) => void }

function SmallAvatar({ avatar, firstName, lastName, size = 28 }: {
  avatar?: string | null; firstName: string; lastName: string; size?: number
}) {
  if (avatar) return <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg2,#fff)', marginLeft: -6, flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#1890FF', color: '#fff', fontWeight: 700, fontSize: Math.floor(size * 0.35), display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg2,#fff)', marginLeft: -6, flexShrink: 0 }}>
      {firstName[0]}{lastName[0]}
    </div>
  )
}
function PostAvatar({ avatar, firstName, lastName }: { avatar?: string | null; firstName: string; lastName: string }) {
  if (avatar) return <img src={avatar} alt="" className="_post_img" style={{ borderRadius: '50%', objectFit: 'cover' }} />
  return <div className="_post_img" style={{ background: '#1890FF', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{firstName[0]}{lastName[0]}</div>
}

/* Image grid — same as CreatePost */
function ImageGrid({ urls, onRemove }: { urls: string[]; onRemove?: (i: number) => void }) {
  if (urls.length === 0) return null
  const gridStyle: React.CSSProperties = urls.length === 1
    ? { gridTemplateColumns: '1fr', gridTemplateRows: '300px' }
    : urls.length === 2
    ? { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '250px' }
    : urls.length === 3
    ? { gridTemplateColumns: '2fr 1fr', gridTemplateRows: '200px 200px' }
    : urls.length === 4
    ? { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '200px 200px' }
    : { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '160px 160px' }

  const cellStyle = (i: number): React.CSSProperties => urls.length === 3 && i === 0 ? { gridRow: '1 / 3' } : {}

  return (
    <div style={{ display: 'grid', gap: 3, borderRadius: 10, overflow: 'hidden', marginTop: 10, ...gridStyle }}>
      {urls.slice(0, 5).map((url, i) => (
        <div key={i} style={{ position: 'relative', overflow: 'hidden', ...cellStyle(i) }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {i === 4 && urls.length > 5 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 700 }}>+{urls.length - 4}</div>
          )}
          {onRemove && (
            <button onClick={() => onRemove(i)} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          )}
        </div>
      ))}
    </div>
  )
}

/* Share Modal */
function ShareModal({ postId, onClose, onShared }: { postId: string; onClose: () => void; onShared: () => void }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/feed?post=${postId}` : `/feed?post=${postId}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(url) } catch { }
    setCopied(true); onShared(); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--bg2,#fff)', borderRadius: 12, padding: 24, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h4 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--color6,#212121)' }}>Share Post</h4>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#666', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 20 }}>
          {/* Copy Link */}
          <button onClick={copy} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#1890FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span style={{ fontSize: 12, color: 'var(--color,#444)', fontWeight: 500 }}>{copied ? '✓ Copied!' : 'Copy Link'}</span>
          </button>
       
          <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e7f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
            </div>
            <span style={{ fontSize: 12, color: 'var(--color,#444)', fontWeight: 500 }}>Facebook</span>
          </button>
          {/* WhatsApp */}
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e7fce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            </div>
            <span style={{ fontSize: 12, color: 'var(--color,#444)', fontWeight: 500 }}>WhatsApp</span>
          </button>
        </div>
        {/* URL bar */}
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg3,#F0F2F5)', borderRadius: 8, padding: '8px 12px', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#666', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
          <button onClick={copy} style={{ background: '#1890FF', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      </div>
    </div>
  )
}

export default function PostCard({ post, currentUserId, onDeleted,currentUser }: Props) {

  const getInitialImages = () => {
    const all: string[] = post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : []
    return all
  }


  const [likes, setLikes] = useState(post.likes)
  const [commentList, setCommentList] = useState(post.comments)
  console.log(commentList)
  const [shareCount, setShareCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [editVisibility, setEditVisibility] = useState(post.visibility)
  const [editImages, setEditImages] = useState<string[]>(getInitialImages())     
  const [editNewFiles, setEditNewFiles] = useState<{ file: File; preview: string }[]>([]) 
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState(post.content)
  const [visibility, setVisibility] = useState(post.visibility)
  const [imageUrls, setImageUrls] = useState<string[]>(getInitialImages())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)
  const isLiked = likes.some(l => l.userId === currentUserId)
  const isAuthor = post.authorId === currentUserId
  const likedUsers = likes.filter(l => l.user).slice(0, 5)
 const [replyCount, setReplyCount] = useState(
  post.comments.reduce((acc, c) => acc + (c.replies?.length || 0), 0)
)
const totalComments = commentList.length + replyCount

console.log(likes)
  

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLike = async () => {
    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
    if (res.ok) { const data = await res.json(); setLikes(data.likes) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
    if (res.ok) onDeleted?.(post.id)
    setShowDropdown(false)
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const items = files.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
    setEditNewFiles(prev => [...prev, ...items])
    if (editFileRef.current) editFileRef.current.value = ''
  }

  const removeExistingImage = (i: number) => setEditImages(prev => prev.filter((_, idx) => idx !== i))
  const removeNewImage = (i: number) => {
    setEditNewFiles(prev => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

const handleEdit = async () => {
  if (!editContent.trim() && editImages.length === 0 && editNewFiles.length === 0) return
  setSaving(true)

  try {
  
    const uploadedUrls: string[] = [...editImages]

   
    for (const item of editNewFiles) {
      const fd = new FormData()
      fd.append('file', item.file)

      const res = await fetch('/api/uploadcloudinary', {
        method: 'POST',
        body: fd,
      })

      if (res.ok) {
        const data = await res.json()
        uploadedUrls.push(data.url)
      } else {
        const errorData = await res.json()
        console.error('Image upload failed:', errorData)
      }
    }

    
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: editContent.trim() || (uploadedUrls.length > 0 ? '📷 Shared photos' : ''),
        visibility: editVisibility,
        imageUrls: uploadedUrls,
        imageUrl: uploadedUrls[0] || null, 
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const newUrls = data.post.imageUrls || []

      
      setContent(data.post.content)
      setVisibility(data.post.visibility)
      setImageUrls(newUrls)   
      setEditImages(newUrls)  
      setEditNewFiles([])     
      setEditing(false)
    }
  } finally {
    setSaving(false)
  }
}

  const allEditPreviews = [
    ...editImages,
    ...editNewFiles.map(f => f.preview),
  ]

  return (
    <>
      {showShareModal && <ShareModal postId={post.id} onClose={() => setShowShareModal(false)} onShared={() => setShareCount(c => c + 1)} />}

      <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
        <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">

          {/* Header */}
          <div className="_feed_inner_timeline_post_top">
            <div className="_feed_inner_timeline_post_box">
              <div className="_feed_inner_timeline_post_box_image"   style={{
    width: 42,
    height: 42,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
  }}>
                <PostAvatar avatar={post.author.avatar} firstName={post.author.firstName} lastName={post.author.lastName} />
              </div>
              <div className="_feed_inner_timeline_post_box_txt">
                <h4 className="_feed_inner_timeline_post_box_title">{post.author.firstName} {post.author.lastName}</h4>
                <p className="_feed_inner_timeline_post_box_para">
                  {timeAgo(post.createdAt)} · <span>{visibility === 'public' ? 'Public' : 'Private'}</span>
                </p>
              </div>
            </div>

          
            <div className="_feed_inner_timeline_post_box_dropdown" ref={dropdownRef}>
              <div className="_feed_timeline_post_dropdown">
                <button type="button" className="_feed_timeline_post_dropdown_link" onClick={() => setShowDropdown(v => !v)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="4" height="17" fill="none" viewBox="0 0 4 17">
                    <circle cx="2" cy="2" r="2" fill="#C4C4C4" /><circle cx="2" cy="8" r="2" fill="#C4C4C4" /><circle cx="2" cy="15" r="2" fill="#C4C4C4" />
                  </svg>
                </button>
              </div>
              {showDropdown && (
                <div className="_feed_timeline_dropdown _timeline_dropdown show">
                  <ul className="_feed_timeline_dropdown_list">
                    <li className="_feed_timeline_dropdown_item ">
                      <a href="#0" className="_feed_timeline_dropdown_link flex items-center" onClick={() => setShowDropdown(false)}>
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18"><path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 15.75L9 12l-5.25 3.75v-12a1.5 1.5 0 011.5-1.5h7.5a1.5 1.5 0 011.5 1.5v12z" /></svg></span>Save Post
                      </a>
                    </li>
                    <li className="_feed_timeline_dropdown_item">
                      <a href="#0" className="_feed_timeline_dropdown_link flex items-center" onClick={() => setShowDropdown(false)}>
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18"><path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M14.25 2.25H3.75a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V3.75a1.5 1.5 0 00-1.5-1.5zM6.75 6.75l4.5 4.5M11.25 6.75l-4.5 4.5" /></svg></span>Hide
                      </a>
                    </li>
                    {isAuthor && (
                      <>
                        <li className="_feed_timeline_dropdown_item">
                          <button className="_feed_timeline_dropdown_link flex items-center" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: 0 }} onClick={() => { setEditing(true); setShowDropdown(false) }}>
                            <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18"><path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M8.25 3H3a1.5 1.5 0 00-1.5 1.5V15A1.5 1.5 0 003 16.5h10.5A1.5 1.5 0 0015 15V9.75" /><path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M13.875 1.875a1.591 1.591 0 112.25 2.25L9 11.25 6 12l.75-3 7.125-7.125z" /></svg></span>Edit Post
                          </button>
                        </li>
                        <li className="_feed_timeline_dropdown_item">
                          <button className="_feed_timeline_dropdown_link flex items-center" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: 0 }} onClick={handleDelete}>
                            <span><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 18 18"><path stroke="#1890FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M2.25 4.5h13.5M6 4.5V3a1.5 1.5 0 011.5-1.5h3A1.5 1.5 0 0112 3v1.5m2.25 0V15a1.5 1.5 0 01-1.5 1.5h-7.5a1.5 1.5 0 01-1.5-1.5V4.5h10.5zM7.5 8.25v4.5M10.5 8.25v4.5" /></svg></span>Delete Post
                          </button>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Edit mode */}
          {editing ? (
            <div style={{ marginTop: 14 }}>
              <textarea className="form-control" value={editContent} onChange={e => setEditContent(e.target.value)} rows={3}
                style={{ marginBottom: 10, borderRadius: 8, fontSize: 14, color: 'var(--color,#2D3748)' }} />

              {/* Existing + new image previews combined grid */}
              {allEditPreviews.length > 0 && (
                <div style={{ display: 'grid', gap: 3, borderRadius: 10, overflow: 'hidden', marginBottom: 10, gridTemplateColumns: allEditPreviews.length === 1 ? '1fr' : '1fr 1fr', gridAutoRows: 150 }}>
                  {allEditPreviews.map((url, i) => (
                    <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => i < editImages.length ? removeExistingImage(i) : removeNewImage(i - editImages.length)}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="button" onClick={() => editFileRef.current?.click()} style={{ padding: '6px 14px', background: 'var(--bg3,#F0F2F5)', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                  📷 Add Images
                </button>
                <input ref={editFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleEditFileChange} />
                <select value={editVisibility} onChange={e => setEditVisibility(e.target.value)} className="form-control" style={{ width: 110, fontSize: 13 }}>
                  <option value="public">🌍 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
                <button onClick={handleEdit} disabled={saving} className="_feed_inner_text_area_btn_link" style={{ padding: '6px 20px', fontSize: 13 }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditContent(content); setEditVisibility(visibility); setEditImages(imageUrls); setEditNewFiles([]) }}
                  style={{ padding: '6px 14px', background: 'none', color: '#fff', border: '1px solid #ccc', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {content && <h4 className="_feed_inner_timeline_post_title" >{content}</h4>}
              <ImageGrid urls={imageUrls} />
            </>
          )}
        </div>

        {/* Like avatars + counts */}
        <div className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 " style={{padding: "16px 24px"}}>
          <div className="_feed_inner_timeline_total_reacts_image" style={{ display: 'flex', alignItems: 'center' }}>
            {likes.length > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: 6 }}>
                  {likedUsers.map(l => l.user && (
                    <SmallAvatar key={l.userId} avatar={l.user.avatar} firstName={l.user.firstName} lastName={l.user.lastName} size={26} />
                  ))}
                </div>
                <p className="_feed_inner_timeline_total_reacts_para" style={{ marginLeft: 6 }}>
                  {likes.length > 5 ? `+${likes.length - 5}` : likes.length}
                </p>
              </>
            )}
          </div>
          <div className="_feed_inner_timeline_total_reacts_txt">
            <div className="_feed_inner_timeline_total_reacts_para1">
              <p onClick={() => setShowComments(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666', fontSize: 14 }}>
                <span>{totalComments}</span> Comment{totalComments !== 1 ? 's' : ''}
              </p>
            </div>
            {shareCount > 0 && (
              <p className="_feed_inner_timeline_total_reacts_para2"><span>{shareCount}</span> Share{shareCount !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

       
        <div className="_feed_inner_timeline_reaction">
          <button className={`_feed_inner_timeline_reaction_emoji _feed_reaction${isLiked ? ' _feed_reaction_active' : ''}`} onClick={handleLike}>
            <span className="_feed_inner_timeline_reaction_link flex ">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? '#1890FF' : 'none'} stroke={isLiked ? '#1890FF' : '#555'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              <span style={{ marginLeft: 6 }}>Like</span>
            </span>
          </button>
          <button className="_feed_inner_timeline_reaction_comment _feed_reaction" onClick={() => setShowComments(v => !v)}>
            <span className="_feed_inner_timeline_reaction_link flex">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 21 21">
                <path stroke="#555" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5z" />
                <path stroke="#555" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
              </svg>
              <span style={{ marginLeft: 6 }}>Comment</span>
            </span>
          </button>
          <button className="_feed_inner_timeline_reaction_share _feed_reaction" onClick={() => setShowShareModal(true)}>
            <span className="_feed_inner_timeline_reaction_link flex">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 21">
                <path stroke="#555" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
              </svg>
              <span style={{ marginLeft: 6 }}>Share{shareCount > 0 ? ` (${shareCount})` : ''}</span>
            </span>
          </button>
        </div>

        {/* Comments */}
         {showComments && (
        <div className="_padd_r24 _padd_l24">
       <CommentSection
  postId={post.id}
  comments={commentList}
  currentUserId={currentUserId}
  currentUser={currentUser}
  onCommentAdded={(newComment) => {
    setCommentList(prev => [...prev, newComment])
  }}
  onReplyAdded={() => setReplyCount(c => c + 1)} 
/>
        </div>
      )}
      </div>
    </>
  )
}