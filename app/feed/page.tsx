import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/feed/Navbar'
import FeedClient from '@/components/feed/FeedClient'
import Stories from '@/components/feed/Stories'
import DarkModeToggle from '@/components/feed/DarkModeToggle'

export default async function FeedPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const rawPosts = await prisma.post.findMany({
    where: {
      OR: [{ visibility: 'public' }, { authorId: user.id }],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true, content: true, imageUrl: true,imageUrls:true, visibility: true, createdAt: true, authorId: true,
      author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      likes: { select: { userId: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true, content: true,imageUrl: true, createdAt: true, authorId: true,
          author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          likes: { select: { userId: true } },
          replies: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true, content: true,imageUrl: true, createdAt: true,
              author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              likes: { select: { userId: true } },
            },
          },
        },
      },
      _count: { select: { comments: true, likes: true } },
    },
  })

  const posts = JSON.parse(JSON.stringify(rawPosts))

  return (
    <div className="_layout _layout_main_wrapper">
      {/* Dark mode floating toggle - sits OUTSIDE _main_layout, same as feed.html */}
      <DarkModeToggle />
      <div className="_main_layout">
        <Navbar user={user} />

        {/* Mobile Menu (hidden on desktop) */}
        <div className="_header_mobile_menu">
          <div className="_header_mobile_menu_wrap">
            <div className="container">
              <div className="_header_mobile_menu">
                <div className="row">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                    <div className="_header_mobile_menu_top_inner">
                      <div className="_header_mobile_menu_logo">
                        <a href="/feed" className="_mobile_logo_link">
                          <img src="/assets/images/logo.svg" alt="Logo" className="_nav_logo" />
                        </a>
                      </div>
                      <div className="_header_mobile_menu_right">
                        <form className="_header_form_grp">
                          <a href="#0" className="_header_mobile_search">
                            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 17 17">
                              <circle cx="7" cy="7" r="6" stroke="#666" />
                              <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3" />
                            </svg>
                          </a>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout - matches feed.html exactly */}
        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              {/* Left Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <div className="_layout_left_sidebar_wrap">
                  <LeftSidebar />
                </div>
              </div>

              {/* Center Feed */}
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    <Stories currentUser={user}/>
                    {/* <Stories /> */}
                    <FeedClient initialPosts={posts} currentUser={user} />
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <div className="_layout_right_sidebar_wrap">
                  <RightSidebar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// এটা feed/page.tsx এ LeftSidebar function replace করো

function LeftSidebar() {
  return (
    <>
      {/* ── Explore ── */}
      <div className="_layout_left_sidebar_inner">
        <div className="_left_inner_area_explore _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <h4 className="_left_inner_area_explore_title _title5 _mar_b24">Explore</h4>
          <ul className="_left_inner_area_explore_list">
            {[
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path fill="#666" d="M10 0c5.523 0 10 4.477 10 10s-4.477 10-10 10S0 15.523 0 10 4.477 0 10 0zm0 1.395a8.605 8.605 0 100 17.21 8.605 8.605 0 000-17.21zm-1.233 4.65l.104.01c.188.028.443.113.668.203 1.026.398 3.033 1.746 3.8 2.563l.223.239.08.092a1.16 1.16 0 01.025 1.405c-.04.053-.086.105-.19.215l-.269.28c-.812.794-2.57 1.971-3.569 2.391-.277.117-.675.25-.865.253a1.167 1.167 0 01-1.07-.629c-.053-.104-.12-.353-.171-.586l-.051-.262c-.093-.57-.143-1.437-.142-2.347l.001-.288c.01-.858.063-1.64.157-2.147.037-.207.12-.563.167-.678.104-.25.291-.45.523-.575a1.15 1.15 0 01.58-.14zm.14 1.467l-.027.126-.034.198c-.07.483-.112 1.233-.111 2.036l.001.279c.009.737.053 1.414.123 1.841l.048.235.192-.07c.883-.372 2.636-1.56 3.23-2.2l.08-.087-.212-.218c-.711-.682-2.38-1.79-3.167-2.095l-.124-.045z" /></svg>, label: 'Learning', badge: 'New' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24"><path fill="#666" d="M14.96 2c3.101 0 5.159 2.417 5.159 5.893v8.214c0 3.476-2.058 5.893-5.16 5.893H6.989c-3.101 0-5.159-2.417-5.159-5.893V7.893C1.83 4.42 3.892 2 6.988 2h7.972zm0 1.395H6.988c-2.37 0-3.883 1.774-3.883 4.498v8.214c0 2.727 1.507 4.498 3.883 4.498h7.972c2.375 0 3.883-1.77 3.883-4.498V7.893c0-2.727-1.508-4.498-3.883-4.498z" /></svg>, label: 'Insights' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24"><path fill="#666" d="M9.032 14.456l.297.002c4.404.041 6.907 1.03 6.907 3.678 0 2.586-2.383 3.573-6.615 3.654l-.589.005c-4.588 0-7.203-.972-7.203-3.68 0-2.704 2.604-3.659 7.203-3.659zm0 1.5l-.308.002c-3.645.038-5.523.764-5.523 2.157 0 1.44 1.99 2.18 5.831 2.18 3.847 0 5.832-.728 5.832-2.159 0-1.44-1.99-2.18-5.832-2.18zM9.031 2c2.698 0 4.864 2.369 4.864 5.319 0 2.95-2.166 5.318-4.864 5.318-2.697 0-4.863-2.369-4.863-5.318C4.17 4.368 6.335 2 9.032 2zm0 1.5c-1.94 0-3.491 1.697-3.491 3.819 0 2.12 1.552 3.818 3.491 3.818 1.94 0 3.492-1.697 3.492-3.818 0-2.122-1.551-3.818-3.492-3.818z" /></svg>, label: 'Find friends' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="24" fill="none" viewBox="0 0 22 24"><path fill="#666" d="M13.704 2c2.8 0 4.585 1.435 4.585 4.258V20.33c0 .443-.157.867-.436 1.18-.279.313-.658.489-1.063.489a1.456 1.456 0 01-.708-.203l-5.132-3.134-5.112 3.14c-.615.36-1.361.194-1.829-.405l-.09-.126-.085-.155a1.913 1.913 0 01-.176-.786V6.434C3.658 3.5 5.404 2 8.243 2h5.46z" /></svg>, label: 'Bookmarks' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, label: 'Group' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#666" d="M12.616 2c.71 0 1.388.28 1.882.779.495.498.762 1.17.74 1.799l.009.147c.017.146.065.286.144.416.152.255.402.44.695.514.292.074.602.032.896-.137l.164-.082c1.23-.567 2.705-.117 3.387 1.043l.613 1.043a2.537 2.537 0 01-.884 3.204l-.257.159a1.093 1.093 0 00-.447 1.203c.078.287.27.53.56.695l.166.105c.505.346.869.855 1.028 1.439.18.659.083 1.36-.272 1.957l-.66 1.077c-.774 1.092-2.279 1.425-3.427.776l-.136-.069a1.128 1.128 0 00-1.578 1.054l-.008.171C15.12 20.971 13.985 22 12.616 22h-1.235c-1.449 0-2.623-1.15-2.622-2.525l-.008-.147a1.125 1.125 0 00-1.836-.941l-.177.087a2.674 2.674 0 01-1.794.129 2.606 2.606 0 01-1.57-1.215l-.637-1.078a2.527 2.527 0 011.03-3.296l.104-.065c.309-.21.494-.554.494-.923 0-.401-.219-.772-.6-.989l-.156-.097a2.542 2.542 0 01-.764-3.407l.65-1.045a2.646 2.646 0 013.552-.96l.134.07c.625 0 1.137-.492 1.146-1.124l.009-.194a2.54 2.54 0 01.752-1.593A2.642 2.642 0 0111.381 2h1.235zm-.613 5.284c1.842 0 3.336 1.463 3.336 3.268 0 1.805-1.494 3.268-3.336 3.268-1.842 0-3.336-1.463-3.336-3.268 0-1.805 1.494-3.268 3.336-3.268zm0 1.448c-1.026 0-1.858.815-1.858 1.82 0 1.005.832 1.82 1.858 1.82 1.026 0 1.858-.815 1.858-1.82 0-1.005-.832-1.82-1.858-1.82z" /></svg>, label: 'Settings' },
              { icon: <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>, label: 'Save post' },
            ].map(({ icon, label, badge }) => (
              <li key={label} className={`_left_inner_area_explore_item${badge ? ' _explore_item' : ''}`}>
                <a href="#0" className="_left_inner_area_explore_link">{icon}{label}</a>
                {badge && <span className="_left_inner_area_explore_link_txt">{badge}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Suggested People ── */}
      <div className="_layout_left_sidebar_inner">
        <div className="_left_inner_area_suggest _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_left_inner_area_suggest_content _mar_b24">
            <h4 className="_left_inner_area_suggest_content_title _title5">Suggested People</h4>
            <span className="_left_inner_area_suggest_content_txt">
              <a className="_left_inner_area_suggest_content_txt_link" href="#0">See All</a>
            </span>
          </div>
          {[
            { name: 'Steve Jobs', role: 'CEO of Apple', img: '/assets/images/people1.png', cls: '_info_img' },
            { name: 'Ryan Roslansky', role: 'CEO of Linkedin', img: '/assets/images/people2.png', cls: '_info_img1' },
            { name: 'Dylan Field', role: 'CEO of Figma', img: '/assets/images/people3.png', cls: '_info_img1' },
          ].map(p => (
            <div key={p.name} className="_left_inner_area_suggest_info">
              <div className="_left_inner_area_suggest_info_box">
                <div className="_left_inner_area_suggest_info_image">
                  <a href="#0"><img src={p.img} alt="Image" className={p.cls} /></a>
                </div>
                <div className="_left_inner_area_suggest_info_txt">
                  <a href="#0"><h4 className="_left_inner_area_suggest_info_title">{p.name}</h4></a>
                  <p className="_left_inner_area_suggest_info_para">{p.role}</p>
                </div>
              </div>
              <div className="_left_inner_area_suggest_info_link">
                <a href="#0" className="_info_link">Connect</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Events — exact feed.html design ── */}
      <div className="_layout_left_sidebar_inner">
        <div className="_left_inner_area_event _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_left_inner_event_content">
            <h4 className="_left_inner_event_title _title5">Events</h4>
            <a href="#0" className="_left_inner_event_link">See all</a>
          </div>

          {[
            { img: '/assets/images/feed_event1.png', day: '10', month: 'Jul', title: 'No more terrorism no more cry', going: 17 },
            { img: '/assets/images/feed_event1.png', day: '24', month: 'Aug', title: 'Tech Summit 2025 — Join us', going: 42 },
          ].map((event, i) => (
            <div key={i} className="_left_inner_event_card_link" >
              <div className="_left_inner_event_card">
                <div className="_left_inner_event_card_iamge">
                  <img src={event.img} alt="Image" className="_card_img" />
                </div>
                <div className="_left_inner_event_card_content">
                  <div className="_left_inner_card_date">
                    <p className="_left_inner_card_date_para">{event.day}</p>
                    <p className="_left_inner_card_date_para1">{event.month}</p>
                  </div>
                  <div className="_left_inner_card_txt">
                    <h4 className="_left_inner_event_card_title">{event.title}</h4>
                  </div>
                </div>
                <hr className="_underline" />
                <div className="_left_inner_event_bottom">
                  <p className="_left_iner_event_bottom">{event.going} People Going</p>
                  <a href="#0" className="_left_iner_event_bottom_link">Going</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function RightSidebar() {
  return (
    <>
      <div className="_layout_right_sidebar_inner">
        <div className="_right_inner_area_info _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_right_inner_area_info_content _mar_b24">
            <h4 className="_right_inner_area_info_content_title _title5">You Might Like</h4>
            <span className="_right_inner_area_info_content_txt">
              <a className="_right_inner_area_info_content_txt_link" href="#0">See All</a>
            </span>
          </div>
          <hr className="_underline" />
          <div className="_right_inner_area_info_ppl">
            <div className="_right_inner_area_info_box">
              <div className="_right_inner_area_info_box_image">
                <img src="/assets/images/Avatar.png" alt="Image" className="_ppl_img" />
              </div>
              <div className="_right_inner_area_info_box_txt">
                <h4 className="_right_inner_area_info_box_title">Radovan SkillArena</h4>
                <p className="_right_inner_area_info_box_para">Founder & CEO at Trophy</p>
              </div>
            </div>
            <div className="_right_info_btn_grp">
              <button type="button" className="_right_info_btn_link">Ignore</button>
              <button type="button" className="_right_info_btn_link _right_info_btn_link_active">Follow</button>
            </div>
          </div>
        </div>
      </div>

      <div className="_layout_right_sidebar_inner">
        <div className="_feed_right_inner_area_card _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
          <div className="_feed_top_fixed">
            <div className="_feed_right_inner_area_card_content _mar_b24">
              <h4 className="_feed_right_inner_area_card_content_title _title5">Your Friends</h4>
              <span className="_feed_right_inner_area_card_content_txt">
                <a className="_feed_right_inner_area_card_content_txt_link" href="#0">See All</a>
              </span>
            </div>
            <form className="_feed_right_inner_area_card_form">
              <svg className="_feed_right_inner_area_card_form_svg" xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 17 17">
                <circle cx="7" cy="7" r="6" stroke="#666"></circle>
                <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3"></path>
              </svg>
              <input className="form-control _feed_right_inner_area_card_form_inpt" type="search" placeholder="input search text" />
            </form>
          </div>
          <div className="_feed_bottom_fixed">
            {[
              { name: 'Steve Jobs', role: 'CEO of Apple', img: '/assets/images/people1.png', active: false, time: '5 minute ago' },
              { name: 'Ryan Roslansky', role: 'CEO of Linkedin', img: '/assets/images/people2.png', active: true },
              { name: 'Dylan Field', role: 'CEO of Figma', img: '/assets/images/people3.png', active: true },
              { name: 'Bill Gates', role: 'Founder of MS', img: '/assets/images/people1.png', active: false, time: '1 hour ago' },
            ].map((friend, i) => (
              <div key={i} className={`_feed_right_inner_area_card_ppl${!friend.active ? ' _feed_right_inner_area_card_ppl_inactive' : ''}`}>
                <div className="_feed_right_inner_area_card_ppl_box">
                  <div className="_feed_right_inner_area_card_ppl_image">
                    <img src={friend.img} alt="" className="_box_ppl_img" />
                  </div>
                  <div className="_feed_right_inner_area_card_ppl_txt">
                    <h4 className="_feed_right_inner_area_card_ppl_title">{friend.name}</h4>
                    <p className="_feed_right_inner_area_card_ppl_para">{friend.role}</p>
                  </div>
                </div>
                <div className="_feed_right_inner_area_card_ppl_side">
                  {friend.active ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 14 14">
                      <rect width="12" height="12" x="1" y="1" fill="#0ACF83" stroke="#fff" strokeWidth="2" rx="6" />
                    </svg>
                  ) : (
                    <span>{friend.time}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
