'use client'

import { useState, useRef, useEffect, useCallback } from 'react'



interface StoryAuthor {
  id: string
  firstName: string
  lastName: string
  avatar?: string | null
}

interface StoryReaction {
  id: string
  emoji: string
  userId: string
  user: { id: string; firstName: string; lastName: string; avatar?: string | null }
}

interface Story {
  id: string
  type: 'photo' | 'text'
  imageUrl?: string | null
  text?: string | null
  bgColor?: string | null
  authorId: string
  author: StoryAuthor
  reactions: StoryReaction[]
  createdAt: string
  expiresAt: string
}

interface StoryGroup {
  authorId: string
  authorName: string
  authorAvatar?: string | null
  stories: Story[]
}



const BG_COLORS = ['#1890FF', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d']
const EMOJIS    = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥']


function groupStories(stories: Story[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>()
  for (const s of stories) {
    if (!map.has(s.authorId)) {
      map.set(s.authorId, {
        authorId: s.authorId,
        authorName: `${s.author.firstName} ${s.author.lastName}`,
        authorAvatar: s.author.avatar,
        stories: [],
      })
    }
    map.get(s.authorId)!.stories.push(s)
  }
  return Array.from(map.values())
}



export default function Stories({ currentUser }: {
  currentUser: { id: string; firstName: string; lastName: string; avatar?: string | null }
}) {
  const [stories,       setStories]       = useState<Story[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showAddModal,  setShowAddModal]  = useState(false)
  const [storyType,     setStoryType]     = useState<'photo' | 'text'>('photo')
  const [storyText,     setStoryText]     = useState('')
  const [storyBg,       setStoryBg]       = useState(BG_COLORS[0])
  const [storyFile,     setStoryFile]     = useState<File | null>(null)
  const [storyPreview,  setStoryPreview]  = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)

 
  const [viewingAuthorId,  setViewingAuthorId]  = useState<string | null>(null)
  const [viewingStoryIdx,  setViewingStoryIdx]  = useState(0)
  const [paused,           setPaused]           = useState(false)
  const [showEmojiPicker,  setShowEmojiPicker]  = useState(false)
  const [showReactors,     setShowReactors]     = useState(false)

  const fileRef   = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  
  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/stories')
      if (res.ok) {
        const data: Story[] = await res.json()
        setStories(data)
      }
    } catch (e) {
      console.error('Failed to fetch stories', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStories() }, [fetchStories])

  useEffect(() => {
    setPaused(showEmojiPicker || showReactors)
  }, [showEmojiPicker, showReactors])

  // Add story 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setStoryFile(f); setStoryPreview(URL.createObjectURL(f))
  }

  const handleAddStory = async () => {
    if (storyType === 'photo' && !storyFile) return
    if (storyType === 'text'  && !storyText.trim()) return
    setUploading(true)
    try {
      let imageUrl: string | null = null
      if (storyType === 'photo' && storyFile) {
        const fd = new FormData(); fd.append('file', storyFile)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) { const d = await res.json(); imageUrl = d.url }
      }

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: storyType,
          imageUrl,
          text: storyType === 'text' ? storyText.trim() : null,
          bgColor: storyType === 'text' ? storyBg : null,
        }),
      })

      if (res.ok) {
        const newStory: Story = await res.json()
        setStories(prev => [newStory, ...prev])
      }

      setShowAddModal(false); setStoryText(''); setStoryFile(null)
      if (storyPreview) URL.revokeObjectURL(storyPreview); setStoryPreview(null)
    } finally { setUploading(false) }
  }

 
  const handleDeleteStory = async (id: string) => {
    const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' })
    if (!res.ok) return

    setStories(prev => prev.filter(s => s.id !== id))

    if (viewingAuthorId) {
      const remaining = stories.filter(s => s.authorId === viewingAuthorId && s.id !== id)
      if (remaining.length === 0) {
        setViewingAuthorId(null)
      } else {
        setViewingStoryIdx(i => Math.min(i, remaining.length - 1))
      }
    }
  }

  const handleReact = async (storyId: string, emoji: string) => {
    const res = await fetch(`/api/stories/${storyId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji }),
    })
    if (!res.ok) return

    const { action } = await res.json()

   
    setStories(prev => prev.map(s => {
      if (s.id !== storyId) return s
      let reactions = [...s.reactions]
      if (action === 'removed') {
        reactions = reactions.filter(r => r.userId !== currentUser.id)
      } else if (action === 'updated') {
        reactions = reactions.map(r =>
          r.userId === currentUser.id ? { ...r, emoji } : r
        )
      } else {
        // created
        reactions = [...reactions, {
          id: Date.now().toString(),
          emoji,
          userId: currentUser.id,
          user: {
            id: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatar: currentUser.avatar,
          },
        }]
      }
      return { ...s, reactions }
    }))

    setShowEmojiPicker(false)
  }

 
  const openGroup = (group: StoryGroup) => {
    setViewingAuthorId(group.authorId)
    setViewingStoryIdx(0)
    setShowEmojiPicker(false)
    setShowReactors(false)
  }

  const goNextStory = () => {
    if (!viewingGroup) return
    setShowEmojiPicker(false); setShowReactors(false)
    if (viewingStoryIdx < viewingGroup.stories.length - 1) setViewingStoryIdx(i => i + 1)
    else setViewingAuthorId(null)
  }
  const goPrevStory = () => {
    setShowEmojiPicker(false); setShowReactors(false)
    if (viewingStoryIdx > 0) setViewingStoryIdx(i => i - 1)
  }

  const scrollCards = (dir: 'left' | 'right') =>
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 230 : -230, behavior: 'smooth' })

  // ── Derived ──
  const allGroups     = groupStories(stories)
  const myGroupIdx    = allGroups.findIndex(g => g.authorId === currentUser.id)
  const orderedGroups = myGroupIdx >= 0
    ? [allGroups[myGroupIdx], ...allGroups.filter((_, i) => i !== myGroupIdx)]
    : allGroups


  const viewingGroup   = viewingAuthorId ? orderedGroups.find(g => g.authorId === viewingAuthorId) ?? null : null
  const viewingStory   = viewingGroup?.stories[viewingStoryIdx] ?? null
  const isOwnStory     = viewingStory?.authorId === currentUser.id
  const myCurrentReact = viewingStory?.reactions.find(r => r.userId === currentUser.id)?.emoji ?? null

  const reactorsByEmoji = viewingStory
    ? viewingStory.reactions.reduce<Record<string, StoryReaction[]>>((acc, r) => {
        acc[r.emoji] = [...(acc[r.emoji] ?? []), r]; return acc
      }, {})
    : {}

  const totalReactCount = viewingStory?.reactions.length ?? 0
  const topEmojis       = Object.keys(reactorsByEmoji).slice(0, 3)

  return (
    <>
      <style>{`
        @keyframes storyProgress { from { width:0% } to { width:100% } }
        @keyframes emojiPop { from { opacity:0; transform:translateX(-50%) translateY(10px) scale(0.85) } to { opacity:1; transform:translateX(-50%) translateY(0) scale(1) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }

        ._stories_row_outer { position:relative; padding:0; }
        ._stories_scroll_wrap {
          display:flex; gap:10px; overflow-x:auto;
          scroll-snap-type:x mandatory; scrollbar-width:none; padding-bottom:2px;
        }
        ._stories_scroll_wrap::-webkit-scrollbar { display:none; }

        ._story_card_wrap {
          flex:0 0 140px; width:140px; height:200px; border-radius:10px;
          overflow:hidden; position:relative; cursor:pointer; scroll-snap-align:start;
        }
        ._story_img_fill { width:100%; height:100%; object-fit:cover; display:block; }
        ._story_overlay_txt {
          position:absolute; bottom:0; left:0; right:0; padding:20px 8px 8px;
          background:linear-gradient(to top,rgba(0,0,0,0.65),transparent);
        }
        ._story_mini_avatar {
          position:absolute; top:8px; left:8px; width:30px; height:30px;
          border-radius:50%; border:2.5px solid #1890FF; overflow:hidden;
        }
        ._story_count_badge {
          position:absolute; top:8px; right:8px; background:#1890FF; color:#fff;
          font-size:10px; font-weight:700; border-radius:10px; padding:2px 6px;
        }
        ._scroll_arrow_btn {
          position:absolute; top:50%; transform:translateY(-50%);
          width:28px; height:28px; border-radius:50%;
          background:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.25);
          border:none; cursor:pointer; z-index:10;
          display:flex; align-items:center; justify-content:center;
        }
        ._scroll_arrow_btn:hover { background:#f0f2f5; }
        ._scroll_arrow_left  { left:4px; }
        ._scroll_arrow_right { right:4px; }

        ._reactors_modal_overlay {
          position:fixed; inset:0; z-index:10001;
          background:rgba(0,0,0,0.5);
          display:flex; align-items:flex-end; justify-content:center;
        }
        ._reactors_sheet {
          background:var(--bg2,#fff); border-radius:20px 20px 0 0;
          width:100%; max-width:420px; max-height:65vh;
          display:flex; flex-direction:column;
          animation:fadeUp .22s ease;
        }
        ._reactors_handle { width:36px; height:4px; border-radius:2px; background:#ddd; margin:12px auto 0; }
        ._reactors_tabs {
          display:flex; padding:12px 16px 0; border-bottom:1px solid #f0f0f0;
          overflow-x:auto; scrollbar-width:none; gap:4px;
        }
        ._reactors_tabs::-webkit-scrollbar { display:none; }
        ._reactor_tab {
          padding:6px 14px; border:none; background:none; cursor:pointer;
          font-size:14px; font-weight:500; color:#888;
          border-bottom:2px solid transparent; white-space:nowrap;
        }
        ._reactor_tab.active { color:#1890FF; border-bottom-color:#1890FF; }
        ._reactors_list { overflow-y:auto; padding:6px 16px 24px; flex:1; }
        ._reactor_row {
          display:flex; align-items:center; gap:12px;
          padding:10px 0; border-bottom:1px solid #f5f5f5;
        }
        ._reactor_row:last-child { border-bottom:none; }
        ._reactor_avatar {
          width:38px; height:38px; border-radius:50%; overflow:hidden; flex-shrink:0;
          background:#1890FF; display:flex; align-items:center; justify-content:center;
          color:#fff; font-weight:700; font-size:14px;
        }
      `}</style>

    
      <div className="_feed_inner_ppl_card _mar_b16" style={{ overflow:'visible', position:'relative' }}>
        <div className="_stories_row_outer" style={{ overflow:'visible', position:'relative' }}>

          <button className="_scroll_arrow_btn _scroll_arrow_left" onClick={() => scrollCards('left')} style={{ display: canScrollLeft ? 'flex' : 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" fill="none" viewBox="0 0 9 8"><path fill="#444" d="M1 4l-.366-.341L.316 4l.318.341L1 4zm7-.5a.5.5 0 010 1v-1zM3.434.659l-2.8 3 .732.682 2.8-3-.732-.682zm-2.8 3.682l2.8 3 .732-.682-2.8-3-.732.682zM1 4.5H8v-1H1v1z"/></svg>
          </button>
          <button className="_scroll_arrow_btn _scroll_arrow_right" onClick={() => scrollCards('right')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" fill="none" viewBox="0 0 9 8"><path fill="#444" d="M8 4l.366-.341.318.341-.318.341L8 4zm-7 .5a.5.5 0 010-1v1zM5.566.659l2.8 3-.732.682-2.8-3L5.566.66zm2.8 3.682l-2.8 3-.732-.682 2.8-3 .732.682zM8 4.5H1v-1h7v1z"/></svg>
          </button>

          <div className="_stories_scroll_wrap" ref={scrollRef} onScroll={() => setCanScrollLeft((scrollRef.current?.scrollLeft ?? 0) > 0)}>

            
            <div className="_story_card_wrap" onClick={() => setShowAddModal(true)} style={{ background:'#d6e8ff' }}>
              {currentUser.avatar
                ? <img src={currentUser.avatar} alt="" className="_story_img_fill" style={{ opacity:0.72 }}/>
                : <div style={{ width:'100%', height:'100%', background:'#c4dcff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <span style={{ fontSize:34, fontWeight:700, color:'#1890FF' }}>{currentUser.firstName[0]}{currentUser.lastName[0]}</span>
                  </div>
              }
              <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', width:26, height:26, borderRadius:'50%', background:'#1890FF', display:'flex', alignItems:'center', justifyContent:'center', border:'3px solid #fff', zIndex:2 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10"><path stroke="#fff" strokeLinecap="round" d="M.5 4.884h9M4.884 9.5v-9"/></svg>
              </div>
              <div className="_story_overlay_txt">
                <p style={{ color:'#fff', fontWeight:600, fontSize:11, margin:0, textAlign:'center' }}>Your Story</p>
              </div>
            </div>

          
            {loading
              ? [1,2,3].map(i => (
                  <div key={i} className="_story_card_wrap" style={{ background:'#e0e0e0', animation:'pulse 1.5s infinite' }}/>
                ))
              : orderedGroups.map(group => (
                  <GroupCard key={group.authorId} group={group} currentUserId={currentUser.id} onView={() => openGroup(group)} />
                ))
            }
          </div>
        </div>
      </div>

      
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowAddModal(false)}>
          <div style={{ background:'var(--bg2,#fff)', borderRadius:16, width:360, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'20px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h4 style={{ margin:0, fontSize:18, fontWeight:700, color:'var(--color6,#212121)' }}>Create Story</h4>
              <button onClick={() => setShowAddModal(false)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#888' }}>×</button>
            </div>
            <div style={{ display:'flex', gap:8, padding:'0 20px', marginBottom:16 }}>
              {(['photo','text'] as const).map(t => (
                <button key={t} onClick={() => setStoryType(t)} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:14, background: storyType===t?'#1890FF':'var(--bg3,#F0F2F5)', color: storyType===t?'#fff':'var(--color7,#666)' }}>
                  {t==='photo'?'📷 Photo':'✏️ Text'}
                </button>
              ))}
            </div>
            {storyType==='photo' && (
              <div style={{ padding:'0 20px 16px' }}>
                <div onClick={() => fileRef.current?.click()} style={{ width:'100%', height:200, borderRadius:10, border:'2px dashed #1890FF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', background:'var(--bg3,#F0F2F5)' }}>
                  {storyPreview
                    ? <img src={storyPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    : <div style={{ textAlign:'center', color:'#1890FF' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#1890FF" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <p style={{ margin:'8px 0 0', fontSize:14, fontWeight:500 }}>Click to add photo</p>
                      </div>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange}/>
              </div>
            )}
            {storyType==='text' && (
              <div style={{ padding:'0 20px 16px' }}>
                <div style={{ width:'100%', height:200, borderRadius:10, background:storyBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, padding:16, boxSizing:'border-box' }}>
                  <p style={{ color:'#fff', fontWeight:700, fontSize:18, textAlign:'center', wordBreak:'break-word', margin:0 }}>{storyText||'Your story...'}</p>
                </div>
                <textarea className="form-control" placeholder="Write your story..." value={storyText} onChange={e => setStoryText(e.target.value)} rows={3} style={{ marginBottom:12, borderRadius:8, fontSize:14, resize:'none' }}/>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {BG_COLORS.map(c => (
                    <div key={c} onClick={() => setStoryBg(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', outline: storyBg===c?`3px solid ${c}`:'none', outlineOffset:2, border:'2px solid #fff', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }}/>
                  ))}
                </div>
              </div>
            )}
            <div style={{ padding:'0 20px 20px' }}>
              <button onClick={handleAddStory} disabled={uploading||(storyType==='photo'?!storyFile:!storyText.trim())} className="_feed_inner_text_area_btn_link" style={{ width:'100%', padding:'12px 0', fontSize:15 }}>
                {uploading?'Posting…':'Share Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {viewingGroup && viewingStory && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => { setViewingAuthorId(null); setShowEmojiPicker(false) }}>
          <div style={{ width:340, borderRadius:16, overflow:'visible', position:'relative', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>

            
            <div style={{ borderRadius:16, overflow:'hidden' }}>
              {viewingStory.type==='photo' && viewingStory.imageUrl
                ? <img src={viewingStory.imageUrl} alt="" style={{ width:'100%', height:520, objectFit:'cover', display:'block' }}/>
                : <div style={{ height:520, background:viewingStory.bgColor||'#1890FF', display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
                    <p style={{ color:'#fff', fontWeight:700, fontSize:24, textAlign:'center', wordBreak:'break-word', margin:0, lineHeight:1.4 }}>{viewingStory.text}</p>
                  </div>
              }
            </div>

          
            <div style={{ position:'absolute', top:10, left:10, right:10, zIndex:15, display:'flex', gap:4 }}>
              {viewingGroup.stories.map((_, i) => (
                <div key={i} style={{ flex:1, height:3, background:'rgba(255,255,255,0.3)', borderRadius:3, overflow:'hidden' }}>
                  {i===viewingStoryIdx
                    ? <div key={`${viewingGroup.authorId}-${viewingStoryIdx}`} style={{ height:'100%', background:'#fff', borderRadius:3, animationName:'storyProgress', animationDuration:'5s', animationTimingFunction:'linear', animationFillMode:'forwards', animationPlayState: paused?'paused':'running' }} onAnimationEnd={goNextStory}/>
                    : <div style={{ height:'100%', background: i<viewingStoryIdx?'#fff':'transparent', borderRadius:3 }}/>
                  }
                </div>
              ))}
            </div>

          
            <div style={{ position:'absolute', top:22, left:0, right:0, zIndex:14, display:'flex', alignItems:'center', gap:10, padding:'0 14px' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', border:'2px solid #fff', overflow:'hidden', flexShrink:0 }}>
                {viewingGroup.authorAvatar
                  ? <img src={viewingGroup.authorAvatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <div style={{ width:'100%', height:'100%', background:'#1890FF', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13 }}>{viewingGroup.authorName[0]}</div>
                }
              </div>
              <p style={{ color:'#fff', fontWeight:600, fontSize:13, margin:0, flex:1, textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>{viewingGroup.authorName}</p>
              {isOwnStory && (
                <button onClick={() => handleDeleteStory(viewingStory.id)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', marginRight:4 }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              )}
              <button onClick={() => { setViewingAuthorId(null); setShowEmojiPicker(false) }} style={{ background:'none', border:'none', color:'#fff', fontSize:24, cursor:'pointer', lineHeight:1 }}>×</button>
            </div>

            
            {showEmojiPicker && (
              <div style={{
                position:'absolute', bottom:74, left:'50%',
                transform:'translateX(-50%)',
                zIndex:30, display:'flex', gap:4, padding:'10px 16px',
                background:'rgba(18,18,18,0.96)', borderRadius:40,
                boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
                animation:'emojiPop .18s ease',
                whiteSpace:'nowrap',
              }}>
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={e => { e.stopPropagation(); handleReact(viewingStory.id, emoji) }}
                    style={{
                      fontSize:26, cursor:'pointer', border:'none',
                      background: myCurrentReact===emoji ? 'rgba(255,255,255,0.22)' : 'transparent',
                      borderRadius:'50%', width:44, height:44,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      transform: myCurrentReact===emoji ? 'scale(1.25)' : 'scale(1)',
                      transition:'transform .15s, background .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform='scale(1.4)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = myCurrentReact===emoji?'scale(1.25)':'scale(1)' }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            
            <div style={{
              position:'absolute', bottom:0, left:0, right:0, zIndex:12,
              padding:'14px 14px 16px',
              background:'linear-gradient(to top,rgba(0,0,0,0.75) 60%,transparent)',
              borderRadius:'0 0 16px 16px',
              display:'flex', alignItems:'center', gap:8,
            }}>
              
              {totalReactCount > 0 && (
                <button onClick={() => { setShowReactors(true) }} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.18)', borderRadius:20, padding:'5px 12px', cursor:'pointer', border:'none', color:'#fff', fontWeight:500, backdropFilter:'blur(4px)' }}>
                  <span style={{ fontSize:15 }}>{topEmojis.join('')}</span>
                  <span style={{ fontSize:12 }}>{totalReactCount}</span>
                </button>
              )}

             
              {!isOwnStory && (
                <button
                  onClick={e => { e.stopPropagation(); setShowEmojiPicker(p => !p) }}
                  style={{
                    marginLeft:'auto',
                    background: myCurrentReact ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    border: myCurrentReact ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid rgba(255,255,255,0.2)',
                    borderRadius:22, padding:'7px 16px',
                    color:'#fff', cursor:'pointer',
                    backdropFilter:'blur(6px)',
                    display:'flex', alignItems:'center', gap:7,
                    fontWeight:600, zIndex:13,
                    transition:'background .15s',
                  }}
                >
                  <span style={{ fontSize:20, lineHeight:1 }}>{myCurrentReact ?? '😊'}</span>
                  <span style={{ fontSize:12 }}>{myCurrentReact ? 'Reacted' : 'React'}</span>
                </button>
              )}
            </div>

         
            <div style={{ position:'absolute', top:0, left:0, width:'40%', height:'78%', zIndex:8, cursor:'pointer' }} onClick={() => { setShowEmojiPicker(false); goPrevStory() }}/>
            <div style={{ position:'absolute', top:0, right:0, width:'40%', height:'78%', zIndex:8, cursor:'pointer' }} onClick={() => { setShowEmojiPicker(false); goNextStory() }}/>
          </div>
        </div>
      )}

     
      {showReactors && viewingStory && (
        <div className="_reactors_modal_overlay" style={{ zIndex:10001 }} onClick={() => setShowReactors(false)}>
          <div className="_reactors_sheet" onClick={e => e.stopPropagation()}>
            <div className="_reactors_handle"/>
            <div style={{ padding:'14px 16px 4px', fontWeight:700, fontSize:15, color:'var(--color6,#212121)' }}>Reactions</div>
            <ReactorsPanel reactions={viewingStory.reactions} />
          </div>
        </div>
      )}
    </>
  )
}

// ─── Reactors system implement ────────────────────────────────────────────────────────────

function ReactorsPanel({ reactions }: { reactions: StoryReaction[] }) {
  const [activeTab, setActiveTab] = useState('all')

  const byEmoji = reactions.reduce<Record<string, StoryReaction[]>>((acc, r) => {
    acc[r.emoji] = [...(acc[r.emoji] ?? []), r]; return acc
  }, {})

  const displayed = activeTab === 'all' ? reactions : (byEmoji[activeTab] ?? [])

  if (reactions.length === 0) {
    return <div style={{ padding:'24px', color:'#aaa', textAlign:'center', fontSize:14 }}>No reactions yet</div>
  }

  return (
    <>
      <div className="_reactors_tabs">
        <button className={`_reactor_tab${activeTab==='all'?' active':''}`} onClick={() => setActiveTab('all')}>
          All {reactions.length}
        </button>
        {Object.entries(byEmoji).map(([emoji, users]) => (
          <button key={emoji} className={`_reactor_tab${activeTab===emoji?' active':''}`} onClick={() => setActiveTab(emoji)}>
            {emoji} {users.length}
          </button>
        ))}
      </div>
      <div className="_reactors_list">
        {displayed.map((r, i) => (
          <div key={i} className="_reactor_row">
            <div className="_reactor_avatar">
              {r.user.avatar
                ? <img src={r.user.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : `${r.user.firstName[0]}${r.user.lastName[0]}`
              }
            </div>
            <span style={{ flex:1, fontWeight:500, fontSize:14, color:'var(--color6,#212121)' }}>
              {r.user.firstName} {r.user.lastName}
            </span>
            <span style={{ fontSize:22 }}>{r.emoji}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── GroupCard ────────────────────────────────────────────────────────────────
function GroupCard({ group, currentUserId, onView }: { group: StoryGroup; currentUserId: string; onView: () => void }) {
  const latest    = group.stories[0]
  const allReacts = group.stories.flatMap(s => s.reactions)
  const topEmojis = [...new Set(allReacts.map(r => r.emoji))].slice(0, 2).join('')
  const isMe      = group.authorId === currentUserId

  return (
    <div className="_story_card_wrap" onClick={onView} style={{ outline: isMe ? '2px solid #1890FF' : 'none', outlineOffset:2 }}>
      {latest.type==='photo' && latest.imageUrl
        ? <img src={latest.imageUrl} alt="" className="_story_img_fill"/>
        : <div style={{ width:'100%', height:'100%', background:latest.bgColor||'#1890FF', display:'flex', alignItems:'center', justifyContent:'center', padding:10, boxSizing:'border-box' }}>
            <p style={{ color:'#fff', fontWeight:600, fontSize:12, textAlign:'center', margin:0, wordBreak:'break-word' }}>{latest.text}</p>
          </div>
      }
      <div className="_story_mini_avatar">
        {group.authorAvatar
          ? <img src={group.authorAvatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <div style={{ width:'100%', height:'100%', background:'#1890FF', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700 }}>{group.authorName[0]}</div>
        }
      </div>
      {group.stories.length > 1 && <div className="_story_count_badge">{group.stories.length}</div>}
      <div className="_story_overlay_txt">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ color:'#fff', fontWeight:600, fontSize:11, margin:0 }}>{isMe ? 'Your Story' : group.authorName}</p>
          {topEmojis && <span style={{ fontSize:13 }}>{topEmojis}</span>}
        </div>
      </div>
    </div>
  )
}