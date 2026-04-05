'use client'

import { useState, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Story {
  id: string
  type: 'photo' | 'text'
  imageUrl?: string
  text?: string
  bgColor?: string
  authorName: string
  authorAvatar?: string | null
  authorId: string
  isDemo?: boolean
}

interface StoryGroup {
  authorId: string
  authorName: string
  authorAvatar?: string | null
  stories: Story[]
  isDemo?: boolean
}

// { storyId -> { userId -> { emoji, userName, userAvatar } } }
interface ReactionEntry {
  emoji: string
  userName: string
  userAvatar?: string | null
}
type ReactionsMap = Record<string, Record<string, ReactionEntry>>

// ─── Constants ────────────────────────────────────────────────────────────────

const BG_COLORS = ['#1890FF', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2', '#f5222d']
const EMOJIS    = ['❤️', '😂', '😮', '😢', '😡', '👍', '🔥']

const DEMO_STORIES: Story[] = [
  { id: 'demo1', type: 'photo', imageUrl: '/assets/images/card_ppl2.png', authorName: 'Ryan Roslansky', authorAvatar: '/assets/images/mini_pic.png', authorId: 'demo_ryan',  isDemo: true },
  { id: 'demo2', type: 'photo', imageUrl: '/assets/images/card_ppl3.png', authorName: 'Sarah Connor',   authorAvatar: '/assets/images/mini_pic.png', authorId: 'demo_sarah', isDemo: true },
  { id: 'demo3', type: 'photo', imageUrl: '/assets/images/card_ppl4.png', authorName: 'John Smith',     authorAvatar: '/assets/images/mini_pic.png', authorId: 'demo_john',  isDemo: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupStories(stories: Story[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>()
  for (const s of stories) {
    if (!map.has(s.authorId)) {
      map.set(s.authorId, { authorId: s.authorId, authorName: s.authorName, authorAvatar: s.authorAvatar, stories: [], isDemo: s.isDemo })
    }
    map.get(s.authorId)!.stories.push(s)
  }
  return Array.from(map.values())
}

function loadReactions(): ReactionsMap {
  try { const r = localStorage.getItem('bs_story_reactions'); return r ? JSON.parse(r) : {} } catch { return {} }
}
function saveReactions(r: ReactionsMap) {
  try { localStorage.setItem('bs_story_reactions', JSON.stringify(r)) } catch { }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Stories({ currentUser }: {
  currentUser: { id?: string; email?: string; firstName: string; lastName: string; avatar?: string | null }
}) {
  const currentUserId   = currentUser.id ?? currentUser.email ?? `${currentUser.firstName}_${currentUser.lastName}`
  const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`

  const [userStories,   setUserStories]   = useState<Story[]>([])
  const [showAddModal,  setShowAddModal]  = useState(false)
  const [storyType,     setStoryType]     = useState<'photo' | 'text'>('photo')
  const [storyText,     setStoryText]     = useState('')
  const [storyBg,       setStoryBg]       = useState(BG_COLORS[0])
  const [storyFile,     setStoryFile]     = useState<File | null>(null)
  const [storyPreview,  setStoryPreview]  = useState<string | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)

  // Viewer
  const [viewingGroup,    setViewingGroup]    = useState<StoryGroup | null>(null)
  const [viewingStoryIdx, setViewingStoryIdx] = useState(0)
  const [paused,          setPaused]          = useState(false)

  // Reactions
  const [reactions,      setReactions]      = useState<ReactionsMap>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReactors,    setShowReactors]    = useState(false) // modal: who reacted

  const fileRef   = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // ── Load ──
  useEffect(() => {
    try { const s = localStorage.getItem('bs_stories'); if (s) setUserStories(JSON.parse(s)) } catch { }
    setReactions(loadReactions())
  }, [])

  // pause progress when emoji picker is open
  useEffect(() => { setPaused(showEmojiPicker || showReactors) }, [showEmojiPicker, showReactors])

  // ── Story CRUD ──
  const saveUserStories = (u: Story[]) => { setUserStories(u); try { localStorage.setItem('bs_stories', JSON.stringify(u)) } catch { } }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    setStoryFile(f); setStoryPreview(URL.createObjectURL(f))
  }

  const handleAddStory = async () => {
    if (storyType === 'photo' && !storyFile) return
    if (storyType === 'text'  && !storyText.trim()) return
    setUploading(true)
    try {
      let imageUrl: string | undefined
      if (storyType === 'photo' && storyFile) {
        const fd = new FormData(); fd.append('file', storyFile)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (res.ok) { const d = await res.json(); imageUrl = d.url }
      }
      const newStory: Story = {
        id: Date.now().toString(), type: storyType, imageUrl,
        text: storyType === 'text' ? storyText.trim() : undefined,
        bgColor: storyType === 'text' ? storyBg : undefined,
        authorName: currentUserName, authorAvatar: currentUser.avatar, authorId: currentUserId,
      }
      saveUserStories([newStory, ...userStories])
      setShowAddModal(false); setStoryText(''); setStoryFile(null)
      if (storyPreview) URL.revokeObjectURL(storyPreview); setStoryPreview(null)
    } finally { setUploading(false) }
  }

  const handleDeleteStory = (id: string) => {
    const updated = userStories.filter(s => s.id !== id)
    saveUserStories(updated)
    if (viewingGroup) {
      const rem = viewingGroup.stories.filter(s => s.id !== id)
      if (rem.length === 0) setViewingGroup(null)
      else { setViewingGroup({ ...viewingGroup, stories: rem }); setViewingStoryIdx(i => Math.min(i, rem.length - 1)) }
    }
  }

  // ── Reactions ──
  const myReaction = (storyId: string) => reactions[storyId]?.[currentUserId]?.emoji ?? null

  const handleReact = (storyId: string, emoji: string) => {
    const updated = { ...reactions }
    if (!updated[storyId]) updated[storyId] = {}
    if (updated[storyId][currentUserId]?.emoji === emoji) {
      // toggle off
      delete updated[storyId][currentUserId]
    } else {
      updated[storyId][currentUserId] = { emoji, userName: currentUserName, userAvatar: currentUser.avatar }
    }
    setReactions(updated)
    saveReactions(updated)
    setShowEmojiPicker(false)
  }

  // All reactors for current story grouped by emoji
  const getReactorsByEmoji = (storyId: string): { emoji: string; users: ReactionEntry[] }[] => {
    const storyReactions = reactions[storyId] ?? {}
    const byEmoji: Record<string, ReactionEntry[]> = {}
    for (const entry of Object.values(storyReactions)) {
      if (!byEmoji[entry.emoji]) byEmoji[entry.emoji] = []
      byEmoji[entry.emoji].push(entry)
    }
    return Object.entries(byEmoji).map(([emoji, users]) => ({ emoji, users }))
  }

  const totalReactions = (storyId: string) => Object.keys(reactions[storyId] ?? {}).length

  // ── Viewer nav ──
  const openGroup = (group: StoryGroup) => { setViewingGroup(group); setViewingStoryIdx(0); setShowEmojiPicker(false); setShowReactors(false) }
  const goNextStory = () => {
    if (!viewingGroup) return
    setShowEmojiPicker(false); setShowReactors(false)
    if (viewingStoryIdx < viewingGroup.stories.length - 1) setViewingStoryIdx(i => i + 1)
    else setViewingGroup(null)
  }
  const goPrevStory = () => { setShowEmojiPicker(false); setShowReactors(false); if (viewingStoryIdx > 0) setViewingStoryIdx(i => i - 1) }

  const scrollCards = (dir: 'left' | 'right') => scrollRef.current?.scrollBy({ left: dir === 'right' ? 230 : -230, behavior: 'smooth' })

  // ── Derived ──
  const myStories    = userStories.filter(s => s.authorId === currentUserId)
  const demoGroups   = groupStories(DEMO_STORIES)
  const myGroup: StoryGroup | null = myStories.length > 0
    ? { authorId: currentUserId, authorName: currentUserName, authorAvatar: currentUser.avatar, stories: myStories }
    : null
  const visibleGroups: StoryGroup[] = [...(myGroup ? [myGroup] : []), ...demoGroups]
  const viewingStory = viewingGroup?.stories[viewingStoryIdx] ?? null
  const isOwnStory   = viewingStory?.authorId === currentUserId && !viewingStory?.isDemo

  // reaction summary for current story
  const reactorGroups   = viewingStory ? getReactorsByEmoji(viewingStory.id) : []
  const myCurrentReact  = viewingStory ? myReaction(viewingStory.id) : null
  const totalReactCount = viewingStory ? totalReactions(viewingStory.id) : 0

  return (
    <>
      <style>{`
        @keyframes storyProgress { from { width: 0% } to { width: 100% } }
        @keyframes emojiPop { from { opacity:0; transform: translateY(10px) scale(0.8) } to { opacity:1; transform: translateY(0) scale(1) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

        ._stories_row_outer { position: relative; padding: 0; }
        ._stories_scroll_wrap {
          display: flex; gap: 10px;
          overflow-x: auto; scroll-snap-type: x mandatory;
          scrollbar-width: none; -ms-overflow-style: none; padding-bottom: 2px;
        }
        ._stories_scroll_wrap::-webkit-scrollbar { display: none; }

        ._story_card_wrap {
          flex: 0 0 140px; width: 140px; height: 200px;
          border-radius: 10px; overflow: hidden;
          position: relative; cursor: pointer; scroll-snap-align: start;
        }
        ._story_img_fill { width: 100%; height: 100%; object-fit: cover; display: block; }
        ._story_overlay_txt {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 20px 8px 8px;
          background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
        }
        ._story_mini_avatar {
          position: absolute; top: 8px; left: 8px;
          width: 30px; height: 30px; border-radius: 50%;
          border: 2.5px solid #1890FF; overflow: hidden;
        }
        ._story_count_badge {
          position: absolute; top: 8px; right: 8px;
          background: #1890FF; color: #fff;
          font-size: 10px; font-weight: 700; border-radius: 10px; padding: 2px 6px;
        }
        ._scroll_arrow_btn {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 28px; height: 28px; border-radius: 50%;
          background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          border: none; cursor: pointer; z-index: 10;
          display: flex; align-items: center; justify-content: center;
        }
        ._scroll_arrow_btn:hover { background: #f0f2f5; }
        ._scroll_arrow_left  { left: 4px; }
        ._scroll_arrow_right { right: 4px; }

        /* ── Reaction bar ── */
        ._story_react_bar {
          position: absolute; bottom: 0; left: 0; right: 0; z-index: 12;
          padding: 10px 14px 14px;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 60%, transparent);
          display: flex; align-items: center; gap: 8px;
        }
        ._react_summary_pill {
          display: flex; align-items: center; gap: 4px;
          background: rgba(255,255,255,0.18); border-radius: 20px;
          padding: 4px 10px; cursor: pointer; border: none;
          font-size: 13px; color: #fff; font-weight: 500;
          backdrop-filter: blur(4px);
          transition: background .15s;
        }
        ._react_summary_pill:hover { background: rgba(255,255,255,0.28); }
        ._react_btn {
          margin-left: auto;
          background: ${''/* filled by myCurrentReact */}rgba(255,255,255,0.18);
          border: none; border-radius: 20px; padding: 6px 12px;
          color: #fff; font-size: 15px; cursor: pointer;
          backdrop-filter: blur(4px);
          display: flex; align-items: center; gap: 5px;
          font-weight: 600; transition: background .15s;
        }
        ._react_btn:hover { background: rgba(255,255,255,0.3); }
        ._react_btn.active { background: rgba(255,255,255,0.35); }

        /* emoji picker tray */
        ._emoji_picker {
          position: absolute; bottom: 64px; left: 50%; transform: translateX(-50%);
          z-index: 20; display: flex; gap: 6px; padding: 10px 14px;
          background: rgba(30,30,30,0.92); border-radius: 40px;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 24px rgba(0,0,0,0.5);
          animation: emojiPop .2s ease;
        }
        ._emoji_option {
          font-size: 22px; cursor: pointer; border: none; background: none;
          border-radius: 50%; width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          transition: transform .15s, background .15s;
        }
        ._emoji_option:hover { transform: scale(1.35); background: rgba(255,255,255,0.1); }
        ._emoji_option.selected { background: rgba(255,255,255,0.2); transform: scale(1.2); }

        /* reactors modal */
        ._reactors_modal_overlay {
          position: fixed; inset: 0; z-index: 10000;
          background: rgba(0,0,0,0.6); display: flex;
          align-items: flex-end; justify-content: center;
          animation: fadeIn .2s;
        }
        ._reactors_sheet {
          background: var(--bg2, #fff); border-radius: 20px 20px 0 0;
          width: 100%; max-width: 420px; max-height: 70vh;
          padding: 0 0 24px; overflow: hidden;
          display: flex; flex-direction: column;
        }
        ._reactors_handle {
          width: 36px; height: 4px; border-radius: 2px;
          background: #ddd; margin: 12px auto 0;
        }
        ._reactors_tabs {
          display: flex; gap: 0; padding: 12px 16px 0; border-bottom: 1px solid #f0f0f0;
          overflow-x: auto; scrollbar-width: none;
        }
        ._reactors_tabs::-webkit-scrollbar { display: none; }
        ._reactor_tab {
          padding: 6px 14px; border: none; background: none; cursor: pointer;
          font-size: 14px; font-weight: 500; color: #888;
          border-bottom: 2px solid transparent; white-space: nowrap;
          transition: color .15s;
        }
        ._reactor_tab.active { color: #1890FF; border-bottom-color: #1890FF; }
        ._reactors_list { overflow-y: auto; padding: 8px 16px; flex: 1; }
        ._reactor_row {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 0; border-bottom: 1px solid #f5f5f5;
        }
        ._reactor_row:last-child { border-bottom: none; }
        ._reactor_avatar {
          width: 38px; height: 38px; border-radius: 50%; overflow: hidden;
          flex-shrink: 0; background: #1890FF;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 14px;
        }
      `}</style>

      {/* ══════════════════ Story Row ══════════════════ */}
      <div className="_feed_inner_ppl_card _mar_b16" style={{ overflow: 'visible', position: 'relative' }}>
        <div className="_stories_row_outer" style={{ overflow: 'visible', position: 'relative' }}>

          <button className="_scroll_arrow_btn _scroll_arrow_left" onClick={() => scrollCards('left')} style={{ display: canScrollLeft ? 'flex' : 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" fill="none" viewBox="0 0 9 8">
              <path fill="#444" d="M1 4l-.366-.341L.316 4l.318.341L1 4zm7-.5a.5.5 0 010 1v-1zM3.434.659l-2.8 3 .732.682 2.8-3-.732-.682zm-2.8 3.682l2.8 3 .732-.682-2.8-3-.732.682zM1 4.5H8v-1H1v1z"/>
            </svg>
          </button>
          <button className="_scroll_arrow_btn _scroll_arrow_right" onClick={() => scrollCards('right')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="8" fill="none" viewBox="0 0 9 8">
              <path fill="#444" d="M8 4l.366-.341.318.341-.318.341L8 4zm-7 .5a.5.5 0 010-1v1zM5.566.659l2.8 3-.732.682-2.8-3L5.566.66zm2.8 3.682l-2.8 3-.732-.682 2.8-3 .732.682zM8 4.5H1v-1h7v1z"/>
            </svg>
          </button>

          <div className="_stories_scroll_wrap" ref={scrollRef} onScroll={() => setCanScrollLeft((scrollRef.current?.scrollLeft ?? 0) > 0)}>

            {/* Your Story card */}
            <div className="_story_card_wrap" onClick={() => setShowAddModal(true)} style={{ background: '#d6e8ff' }}>
              {currentUser.avatar
                ? <img src={currentUser.avatar} alt="" className="_story_img_fill" style={{ opacity: 0.72 }} />
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

            {/* Group cards */}
            {visibleGroups.map(group => (
              <GroupCard key={group.authorId} group={group} onView={() => openGroup(group)} reactions={reactions} />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════ Add Story Modal ══════════════════ */}
      {showAddModal && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowAddModal(false)}>
          <div style={{ background:'var(--bg2,#fff)', borderRadius:16, width:360, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding:'20px 20px 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h4 style={{ margin:0, fontSize:18, fontWeight:700, color:'var(--color6,#212121)' }}>Create Story</h4>
              <button onClick={() => setShowAddModal(false)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#888' }}>×</button>
            </div>
            <div style={{ display:'flex', gap:8, padding:'0 20px', marginBottom:16 }}>
              {(['photo','text'] as const).map(t => (
                <button key={t} onClick={() => setStoryType(t)} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:14, background: storyType===t ? '#1890FF' : 'var(--bg3,#F0F2F5)', color: storyType===t ? '#fff' : 'var(--color7,#666)' }}>
                  {t==='photo' ? '📷 Photo' : '✏️ Text'}
                </button>
              ))}
            </div>
            {storyType === 'photo' && (
              <div style={{ padding:'0 20px 16px' }}>
                <div onClick={() => fileRef.current?.click()} style={{ width:'100%', height:200, borderRadius:10, border:'2px dashed #1890FF', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', background:'var(--bg3,#F0F2F5)' }}>
                  {storyPreview
                    ? <img src={storyPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ textAlign:'center', color:'#1890FF' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#1890FF" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <p style={{ margin:'8px 0 0', fontSize:14, fontWeight:500 }}>Click to add photo</p>
                      </div>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange} />
              </div>
            )}
            {storyType === 'text' && (
              <div style={{ padding:'0 20px 16px' }}>
                <div style={{ width:'100%', height:200, borderRadius:10, background:storyBg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, padding:16, boxSizing:'border-box' }}>
                  <p style={{ color:'#fff', fontWeight:700, fontSize:18, textAlign:'center', wordBreak:'break-word', margin:0 }}>{storyText || 'Your story...'}</p>
                </div>
                <textarea className="form-control" placeholder="Write your story..." value={storyText} onChange={e => setStoryText(e.target.value)} rows={3} style={{ marginBottom:12, borderRadius:8, fontSize:14, resize:'none' }}/>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {BG_COLORS.map(c => (
                    <div key={c} onClick={() => setStoryBg(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', outline: storyBg===c ? `3px solid ${c}` : 'none', outlineOffset:2, border:'2px solid #fff', boxShadow:'0 1px 4px rgba(0,0,0,0.15)' }}/>
                  ))}
                </div>
              </div>
            )}
            <div style={{ padding:'0 20px 20px' }}>
              <button onClick={handleAddStory} disabled={uploading||(storyType==='photo'?!storyFile:!storyText.trim())} className="_feed_inner_text_area_btn_link" style={{ width:'100%', padding:'12px 0', fontSize:15 }}>
                {uploading ? 'Posting…' : 'Share Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ View Story Modal ══════════════════ */}
      {viewingGroup && viewingStory && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => { setViewingGroup(null); setShowEmojiPicker(false) }}>
          <div style={{ width:340, borderRadius:16, overflow:'hidden', position:'relative', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>

            {/* Progress bars */}
            <div style={{ position:'absolute', top:10, left:10, right:10, zIndex:15, display:'flex', gap:4 }}>
              {viewingGroup.stories.map((_, i) => (
                <div key={i} style={{ flex:1, height:3, background:'rgba(255,255,255,0.3)', borderRadius:3, overflow:'hidden' }}>
                  {i === viewingStoryIdx
                    ? <div key={`${viewingGroup.authorId}-${viewingStoryIdx}`} style={{ height:'100%', background:'#fff', borderRadius:3, animationPlayState: paused ? 'paused' : 'running', animation:'storyProgress 5s linear forwards' }} onAnimationEnd={goNextStory}/>
                    : <div style={{ height:'100%', background: i < viewingStoryIdx ? '#fff' : 'transparent', borderRadius:3 }}/>
                  }
                </div>
              ))}
            </div>

            {/* Author bar */}
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
              <button onClick={() => { setViewingGroup(null); setShowEmojiPicker(false) }} style={{ background:'none', border:'none', color:'#fff', fontSize:24, cursor:'pointer', lineHeight:1 }}>×</button>
            </div>

            {/* Story content */}
            {viewingStory.type === 'photo' && viewingStory.imageUrl
              ? <img src={viewingStory.imageUrl} alt="" style={{ width:'100%', height:520, objectFit:'cover', display:'block' }}/>
              : <div style={{ height:520, background: viewingStory.bgColor||'#1890FF', display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
                  <p style={{ color:'#fff', fontWeight:700, fontSize:24, textAlign:'center', wordBreak:'break-word', margin:0, lineHeight:1.4 }}>{viewingStory.text}</p>
                </div>
            }

            {/* ── Emoji picker tray ── */}
            {showEmojiPicker && (
              <div className="_emoji_picker">
                {EMOJIS.map(emoji => (
                  <button key={emoji} className={`_emoji_option${myCurrentReact === emoji ? ' selected' : ''}`} onClick={() => handleReact(viewingStory.id, emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* ── Reaction bar (bottom) ── */}
            <div className="_story_react_bar">
              {/* reaction summary pill — show only if there are reactions */}
              {totalReactCount > 0 && (
                <button className="_react_summary_pill" onClick={() => { setShowReactors(true); setPaused(true) }}>
                  {reactorGroups.slice(0, 3).map(g => g.emoji).join('')}
                  <span style={{ marginLeft:4, fontSize:12 }}>{totalReactCount}</span>
                </button>
              )}

              {/* React button — not shown on own story */}
              {!isOwnStory && (
                <button
                  className={`_react_btn${myCurrentReact ? ' active' : ''}`}
                  style={{ marginLeft: totalReactCount > 0 ? undefined : 'auto' }}
                  onClick={() => { setShowEmojiPicker(p => !p); setPaused(v => !v) }}
                >
                  <span style={{ fontSize:17 }}>{myCurrentReact ?? '😊'}</span>
                  <span style={{ fontSize:12 }}>{myCurrentReact ? 'Reacted' : 'React'}</span>
                </button>
              )}
            </div>

            {/* Tap zones */}
            <div style={{ position:'absolute', top:0, left:0, width:'40%', height:'75%', zIndex:8, cursor:'pointer' }} onClick={() => { setShowEmojiPicker(false); goPrevStory() }}/>
            <div style={{ position:'absolute', top:0, right:0, width:'40%', height:'75%', zIndex:8, cursor:'pointer' }} onClick={() => { setShowEmojiPicker(false); goNextStory() }}/>
          </div>
        </div>
      )}

      {/* ══════════════════ Reactors Bottom Sheet ══════════════════ */}
      {showReactors && viewingStory && (
        <div className="_reactors_modal_overlay" onClick={() => { setShowReactors(false); setPaused(false) }}>
          <div className="_reactors_sheet" onClick={e => e.stopPropagation()}>
            <div className="_reactors_handle"/>
            <div style={{ padding:'14px 16px 4px', fontWeight:700, fontSize:15, color:'var(--color6,#212121)' }}>Reactions</div>

            {/* tabs: All + per emoji */}
            <ReactorsTabs storyId={viewingStory.id} reactions={reactions} />
          </div>
        </div>
      )}
    </>
  )
}

// ─── ReactorsTabs ─────────────────────────────────────────────────────────────
function ReactorsTabs({ storyId, reactions }: { storyId: string; reactions: ReactionsMap }) {
  const [activeTab, setActiveTab] = useState('all')

  const storyReactions = reactions[storyId] ?? {}
  const allEntries = Object.values(storyReactions)

  const byEmoji: Record<string, ReactionEntry[]> = {}
  for (const e of allEntries) {
    if (!byEmoji[e.emoji]) byEmoji[e.emoji] = []
    byEmoji[e.emoji].push(e)
  }

  const displayed = activeTab === 'all' ? allEntries : (byEmoji[activeTab] ?? [])

  if (allEntries.length === 0) {
    return <div style={{ padding:'24px 16px', color:'#aaa', textAlign:'center', fontSize:14 }}>No reactions yet</div>
  }

  return (
    <>
      <div className="_reactors_tabs">
        <button className={`_reactor_tab${activeTab==='all'?' active':''}`} onClick={() => setActiveTab('all')}>
          All {allEntries.length}
        </button>
        {Object.entries(byEmoji).map(([emoji, users]) => (
          <button key={emoji} className={`_reactor_tab${activeTab===emoji?' active':''}`} onClick={() => setActiveTab(emoji)}>
            {emoji} {users.length}
          </button>
        ))}
      </div>
      <div className="_reactors_list">
        {displayed.map((entry, i) => (
          <div key={i} className="_reactor_row">
            <div className="_reactor_avatar">
              {entry.userAvatar
                ? <img src={entry.userAvatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                : entry.userName[0]
              }
            </div>
            <span style={{ flex:1, fontWeight:500, fontSize:14, color:'var(--color6,#212121)' }}>{entry.userName}</span>
            <span style={{ fontSize:20 }}>{entry.emoji}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// ─── GroupCard ────────────────────────────────────────────────────────────────
function GroupCard({ group, onView, reactions }: { group: StoryGroup; onView: () => void; reactions: ReactionsMap }) {
  const latest = group.stories[0]

  // collect unique emojis across all stories in this group
  const groupEmojis = new Set<string>()
  for (const s of group.stories) {
    for (const e of Object.values(reactions[s.id] ?? {})) groupEmojis.add(e.emoji)
  }
  const emojiPreview = [...groupEmojis].slice(0, 2).join('')

  return (
    <div className="_story_card_wrap" onClick={onView}>
      {latest.type === 'photo' && latest.imageUrl
        ? <img src={latest.imageUrl} alt="" className="_story_img_fill"/>
        : <div style={{ width:'100%', height:'100%', background: latest.bgColor||'#1890FF', display:'flex', alignItems:'center', justifyContent:'center', padding:10, boxSizing:'border-box' }}>
            <p style={{ color:'#fff', fontWeight:600, fontSize:12, textAlign:'center', margin:0, wordBreak:'break-word' }}>{latest.text}</p>
          </div>
      }
      <div className="_story_mini_avatar">
        {group.authorAvatar
          ? <img src={group.authorAvatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <div style={{ width:'100%', height:'100%', background:'#1890FF', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700 }}>{group.authorName[0]}</div>
        }
      </div>
      {group.stories.length > 1 && (
        <div className="_story_count_badge">{group.stories.length}</div>
      )}
      <div className="_story_overlay_txt">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ color:'#fff', fontWeight:600, fontSize:11, margin:0 }}>{group.authorName}</p>
          {emojiPreview && <span style={{ fontSize:14 }}>{emojiPreview}</span>}
        </div>
      </div>
    </div>
  )
}