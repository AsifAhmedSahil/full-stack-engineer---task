'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string | null
}

interface Notification {
  id: string
  type: 'post_like' | 'post_comment' | 'comment_like'
  actor: { id: string; firstName: string; lastName: string; avatar?: string | null }
  postId?: string
  preview?: string
  createdAt: string
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} minutes ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function notifText(n: Notification) {
  const name = `${n.actor.firstName} ${n.actor.lastName}`
  if (n.type === 'post_like') return `${name} liked your post`
  if (n.type === 'post_comment') return `${name} commented on your post`
  if (n.type === 'comment_like') return `${name} liked your comment`
  return ''
}

function Avatar({ avatar, firstName, lastName, size = 56 }: { avatar?: string | null; firstName: string; lastName: string; size?: number }) {
  if (avatar) return <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#1890FF', color: '#fff', fontWeight: 700, fontSize: size * 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {firstName[0]}{lastName[0]}
    </div>
  )
}

export default function Navbar({ user }: { user: User }) {
  const [showProfileDrop, setShowProfileDrop] = useState(false)
  const [showNotifDrop, setShowNotifDrop] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const notifRef = useRef<HTMLLIElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)


  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
       
        const saved = localStorage.getItem('seen_notif_ids')
        const seen = saved ? new Set<string>(JSON.parse(saved)) : new Set<string>()
        setSeenIds(seen)
        setUnreadCount(data.notifications.filter((n: Notification) => !seen.has(n.id)).length)
      }
    } catch { }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) 
    return () => clearInterval(interval)
  }, [])


  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifDrop(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openNotifDrop = () => {
    setShowNotifDrop(v => !v)
    if (!showNotifDrop) {
     
      const ids = notifications.map(n => n.id)
      const newSeen = new Set([...Array.from(seenIds), ...ids])
      setSeenIds(newSeen)
      setUnreadCount(0)
      localStorage.setItem('seen_notif_ids', JSON.stringify(Array.from(newSeen)))
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch { }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light _header_nav _padd_t10">
      <div className="container _custom_container">

        {/* Logo */}
        <div className="_logo_wrap">
          <Link href="/feed" className="navbar-brand">
            <img src="/assets/images/logo.svg" alt="BuddyScript" className="_nav_logo" id="nav-logo" />
          </Link>
        </div>

        {/* Mobile toggler */}
        <button className="navbar-toggler bg-light" type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`navbar-collapse${isMobileMenuOpen ? ' show' : ''}`} id="navbarSupportedContent"
          style={{ display: isMobileMenuOpen ? 'block' : 'flex', flexBasis: 'auto', flexGrow: 1, alignItems: 'center' }}>

          <div className="_header_form ms-auto">
            <form className="_header_form_grp">
              <svg className="_header_form_svg" xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 17 17">
                <circle cx="7" cy="7" r="6" stroke="#666" />
                <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3" />
              </svg>
              <input className="form-control me-2 _inpt1" type="search" placeholder="input search text" aria-label="Search" />
            </form>
          </div>

   
          <ul className="navbar-nav mb-2 mb-lg-0 _header_nav_list ms-auto _mar_r8">
          
            <li className="nav-item _header_nav_item">
              <Link href="/feed" className="nav-link _header_nav_link_active _header_nav_link">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="21" fill="none" viewBox="0 0 18 21">
                  <path className="_home_active" stroke="#000" strokeWidth="1.5" strokeOpacity=".6" d="M1 9.924c0-1.552 0-2.328.314-3.01.313-.682.902-1.187 2.08-2.196l1.143-.98C6.667 1.913 7.732 1 9 1c1.268 0 2.333.913 4.463 2.738l1.142.98c1.179 1.01 1.768 1.514 2.081 2.196.314.682.314 1.458.314 3.01v4.846c0 2.155 0 3.233-.67 3.902-.669.67-1.746.67-3.901.67H5.57c-2.155 0-3.232 0-3.902-.67C1 18.002 1 16.925 1 14.77V9.924z" />
                  <path className="_home_active" stroke="#000" strokeOpacity=".6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.857 19.341v-5.857a1 1 0 00-1-1H7.143a1 1 0 00-1 1v5.857" />
                </svg>
              </Link>
            </li>

          
            <li className="nav-item _header_nav_item">
              <a className="nav-link _header_nav_link" href="#0">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="20" fill="none" viewBox="0 0 26 20">
                  <path fill="#000" fillOpacity=".6" fillRule="evenodd" d="M12.79 12.15h.429c2.268.015 7.45.243 7.45 3.732 0 3.466-5.002 3.692-7.415 3.707h-.894c-2.268-.015-7.452-.243-7.452-3.727 0-3.47 5.184-3.697 7.452-3.711l.297-.001h.132zm0 1.75c-2.792 0-6.12.34-6.12 1.962 0 1.585 3.13 1.955 5.864 1.976l.255.002c2.792 0 6.118-.34 6.118-1.958 0-1.638-3.326-1.982-6.118-1.982zM12.789 0c2.96 0 5.368 2.392 5.368 5.33 0 2.94-2.407 5.331-5.368 5.331h-.031a5.329 5.329 0 01-3.782-1.57 5.253 5.253 0 01-1.553-3.764C7.423 2.392 9.83 0 12.789 0zm0 1.75c-1.987 0-3.604 1.607-3.604 3.58a3.526 3.526 0 001.04 2.527 3.58 3.58 0 002.535 1.054l.03.875v-.875c1.987 0 3.605-1.605 3.605-3.58S14.777 1.75 12.789 1.75z" clipRule="evenodd" />
                </svg>
              </a>
            </li>

            
            <li className="nav-item _header_nav_item" ref={notifRef} style={{ position: 'relative' }}>
              <span className="nav-link _header_nav_link _header_notify_btn" style={{ cursor: 'pointer' }} onClick={openNotifDrop}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" fill="none" viewBox="0 0 20 22">
                  <path fill="#000" fillOpacity=".6" fillRule="evenodd" d="M7.547 19.55c.533.59 1.218.915 1.93.915.714 0 1.403-.324 1.938-.916a.777.777 0 011.09-.056c.318.284.344.77.058 1.084-.832.917-1.927 1.423-3.086 1.423h-.002c-1.155-.001-2.248-.506-3.077-1.424a.762.762 0 01.057-1.083.774.774 0 011.092.057zM9.527 0c4.58 0 7.657 3.543 7.657 6.85 0 1.702.436 2.424.899 3.19.457.754.976 1.612.976 3.233-.36 4.14-4.713 4.478-9.531 4.478-4.818 0-9.172-.337-9.528-4.413-.003-1.686.515-2.544.973-3.299l.161-.27c.398-.679.737-1.417.737-2.918C1.871 3.543 4.948 0 9.528 0z" clipRule="evenodd" />
                </svg>
                {unreadCount > 0 && (
                  <span className="_counting">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}

               
                {showNotifDrop && (
                  <div className="_notification_dropdown show" style={{ display: 'block' }} onClick={e => e.stopPropagation()}>
                    <div className="_notifications_content">
                      <h4 className="_notifications_content_title">Notifications</h4>
                    </div>
                    <div className="_notifications_all">
                      {notifications.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888', padding: '20px 0', fontSize: 14 }}>No notifications yet</p>
                      ) : (
                        notifications.slice(0, 15).map(n => (
                          <div key={n.id} className="_notification_box" style={{ cursor: 'pointer' }}>
                            <div className="_notification_image">
                              <Avatar avatar={n.actor.avatar} firstName={n.actor.firstName} lastName={n.actor.lastName} size={56} />
                            </div>
                            <div className="_notification_txt">
                              <p className="_notification_para">
                                <span className="_notify_txt_link">{n.actor.firstName} {n.actor.lastName}</span>{' '}
                                {n.type === 'post_like' && 'liked your post'}
                                {n.type === 'post_comment' && 'commented on your post'}
                                {n.type === 'comment_like' && 'liked your comment'}
                                {n.preview && (
                                  <span style={{ color: '#888', fontSize: 12 }}> — "{n.preview.slice(0, 40)}{n.preview.length > 40 ? '…' : ''}"</span>
                                )}
                              </p>
                              <div className="_nitification_time">
                                <span>{timeAgo(n.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </span>
            </li>

        
            <li className="nav-item _header_nav_item">
              <a className="nav-link _header_nav_link" href="#0">
                <svg xmlns="http://www.w3.org/2000/svg" width="23" height="22" fill="none" viewBox="0 0 23 22">
                  <path fill="#000" fillOpacity=".6" fillRule="evenodd" d="M11.43 0c2.96 0 5.743 1.143 7.833 3.22 4.32 4.29 4.32 11.271 0 15.562C17.145 20.886 14.293 22 11.405 22c-1.575 0-3.16-.33-4.643-1.012-.437-.174-.847-.338-1.14-.338-.338.002-.793.158-1.232.308-.9.307-2.022.69-2.852-.131-.826-.822-.445-1.932-.138-2.826.152-.44.307-.895.307-1.239 0-.282-.137-.642-.347-1.161C-.57 11.46.322 6.47 3.596 3.22A11.04 11.04 0 0111.43 0z" clipRule="evenodd" />
                </svg>
                <span className="_counting">2</span>
              </a>
            </li>
          </ul>

          {/* Profile dropdown */}
          <div className="_header_nav_profile" ref={profileRef} onClick={() => setShowProfileDrop(v => !v)} style={{ cursor: 'pointer', position: 'relative' }}>
            <div
  className="_header_nav_profile_image"
  style={{
    width: 40,
    height: 40,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}
>
  {user.avatar ? (
    <img
      src={user.avatar}
      alt="Profile"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#1890FF',
        color: '#fff',
        fontWeight: 700,
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {user.firstName[0]}
      {user.lastName[0]}
    </div>
  )}
</div>
            <div className="_header_nav_dropdown">
              <p className="_header_nav_para">{user.firstName} {user.lastName}</p>
              <button className="_header_nav_dropdown_btn _dropdown_toggle" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" fill="none" viewBox="0 0 10 6">
                  <path fill="#112032" d="M5 5l.354.354L5 5.707l-.354-.353L5 5zm4.354-3.646l-4 4-.708-.708 4-4 .708.708zm-4.708 4l-4-4 .708-.708 4 4-.708.708z" />
                </svg>
              </button>
            </div>

            {showProfileDrop && (
              <div className="_nav_profile_dropdown _profile_dropdown show">
                <div className="_nav_profile_dropdown_info">
                  <div className="_nav_profile_dropdown_image">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Profile" className="_nav_drop_img" style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div className="_nav_drop_img" style={{ background: '#1890FF', color: '#fff', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: 44, height: 44 }}>
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                    )}
                  </div>
                  <div className="_nav_profile_dropdown_info_txt">
                    <h4 className="_nav_dropdown_title">{user.firstName} {user.lastName}</h4>
                    <a href="#0" className="_nav_drop_profile">View Profile</a>
                  </div>
                </div>
                <hr />
                <ul className="_nav_dropdown_list">
                  <li className="_nav_dropdown_list_item">
                    <button onClick={logout} className="_nav_dropdown_link" style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', padding: 0, cursor: 'pointer' }}>
                      <div className="_nav_drop_info flex items-center">
                        <span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="none" viewBox="0 0 19 19">
                            <path stroke="#377DFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.667 18H2.889A1.889 1.889 0 011 16.111V2.89A1.889 1.889 0 012.889 1h3.778M13.277 14.222L18 9.5l-4.723-4.722M18 9.5H6.667" />
                          </svg>
                        </span>
                        Log Out
                      </div>
                      <span className="_nav_drop_btn_link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="6" height="10" fill="none" viewBox="0 0 6 10">
                          <path fill="#112032" d="M5 5l.354.354L5.707 5l-.353-.354L5 5zM1.354 9.354l4-4-.708-.708-4 4 .708.708zm4-4.708l-4-4-.708.708 4 4 .708-.708z" opacity=".5" />
                        </svg>
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}