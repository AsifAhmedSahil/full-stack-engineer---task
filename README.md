# BuddyScript — Full-Stack Social Feed Application

BuddyScript is a modern social media platform built as a full-stack technical assignment. It converts static HTML/CSS designs into a fully dynamic, secure, and production-ready web application — preserving pixel-perfect fidelity to the original design system.

---

## 🚀 Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Bootstrap 5 + Custom CSS (`main.css`, `common.css`, `responsive.css`) |
| **Backend** | Next.js API Routes (Serverless) |
| **Database** | PostgreSQL via [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | JWT with HttpOnly Cookies |
| **Password Hashing** | bcryptjs |
| **File Storage** | [Cloudinary](https://cloudinary.com/) (images, avatars) |
| **State** | React `useState` + Optimistic UI |

---

## ✨ Key Features

### 1. Authentication & Security
- **Registration** — First name, last name, email, password, optional profile photo (uploaded to Cloudinary)
- **Login** — Email + password with persistent session via JWT in HttpOnly cookie
- **Protected Routes** — Server-side middleware redirects unauthenticated users from `/feed` to `/login`
- **Cookie Security** — `HttpOnly`, `SameSite: Strict`, `Secure` in production

### 2. Feed & Posts
- **Dynamic Feed** — Public posts from all users + the author's own private posts, ordered newest first
- **Create Posts** — Text content with multiple image uploads (Facebook-style grid layout, up to 5+)
- **Visibility Control** — Toggle between `Public` (visible to all) and `Private` (author only)
- **Edit Posts** — Update content, swap or add images, change visibility — author-only
- **Delete Posts** — Author-only, instant removal from feed

### 3. Engagement System
- **Like / Unlike** — Posts, comments, and replies — with optimistic UI update (avatar appears instantly)
- **Like Avatars** — Stacked user avatars shown next to like count
- **Comments** — Text + optional image, Facebook-style bubble design
- **Nested Replies** — Reply to comments (and replies), with show/hide toggle
- **Comment Count** — Tracks direct comments + all replies as total

### 4. Notifications
- **Real Notifications** — Aggregates post likes, post comments, and comment likes on your posts
- **Unread Badge** — Shows count of unseen notifications on the bell icon
- **Auto-Poll** — Refreshes every 30 seconds in the background
- **Seen Tracking** — Notification seen state stored in `localStorage`

### 5. Stories
- **Photo Stories** — Upload an image, stored via Cloudinary
- **Text Stories** — Write text with a custom background color picker (7 colors)
- **View Modal** — Full-screen dark overlay with 5-second auto-progress bar
- **Persistence** — Stored in `database`, visible for 24 hours
- **Demo Stories** — Template stories always visible alongside user stories

### 6. Dark Mode
- **Toggle** — Applies `_dark_wrapper` class to both `<html>` and `<body>`
- **Persist on Reload** — Inline `<script>` in `layout.tsx` applies dark mode before React hydrates — no flash
- **Full Support** — All CSS variables in `main.css` adapt to dark mode automatically

### 7. UI / UX
- **Left Sidebar** — Explore links, Suggested People, Events section (matching `feed.html` exactly)
- **Navbar** — Profile dropdown, notifications dropdown, dark mode toggle
- **Responsive** — Mobile-friendly layout using Bootstrap grid + responsive CSS
- **Share Modal** — Copy link, share to Facebook or WhatsApp
- **No Scroll Auth Pages** — Login and Register pages fit any screen without overflow

---

## 🏗️ Architecture

```
buddyscript/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── logout/route.ts
│   │   ├── posts/
│   │   │   ├── route.ts              # GET (paginated) + POST
│   │   │   └── [id]/
│   │   │       ├── route.ts          # PATCH + DELETE
│   │   │       └── like/route.ts
│   │   ├── comments/
│   │   │   ├── route.ts
│   │   │   └── [id]/like/route.ts
│   │   ├── replies/
│   │   │   ├── route.ts
│   │   │   └── [id]/like/route.ts
│   │   ├── notifications/route.ts
│   │   └── uploadcloudinary/route.ts
│   ├── feed/
│   │   ├── page.tsx                  # Server component — fetches posts + user
│   │   └── components/
│   │       ├── FeedClient.tsx
│   │       ├── PostCard.tsx
│   │       ├── CommentSection.tsx
│   │       ├── CreatePost.tsx
│   │       ├── Stories.tsx
│   │       ├── Navbar.tsx
│   │       ├── DarkModeToggle.tsx
│   │       └── LeftSidebar.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── lib/
│   ├── auth.ts                       # JWT sign/verify, cookie helpers
│   └── prisma.ts                     # Prisma client singleton
├── middleware.ts                      # Route protection
└── prisma/
    └── schema.prisma
```

### Data Flow
```
Browser → Next.js API Route → Prisma → PostgreSQL
                ↓
           Cloudinary (image upload)
                ↓
        JWT cookie (auth state)
                ↓
        Database (stories, dark mode, notif seen)
```

---

## 🗃️ Database Schema (Key Models)

```prisma
model User {
  id        String   @id @default(cuid())
  firstName String
  lastName  String
  email     String   @unique
  password  String
  avatar    String?
  posts     Post[]
  comments  Comment[]
  likes     Like[]
}

model Post {
  id         String    @id @default(cuid())
  content    String
  imageUrl   String?
  imageUrls  String[]  @default([])
  visibility String    @default("public")
  authorId   String
  author     User      @relation(fields: [authorId], references: [id])
  comments   Comment[]
  likes      Like[]
  createdAt  DateTime  @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  imageUrl  String?
  authorId  String
  postId    String
  author    User     @relation(...)
  post      Post     @relation(...)
  replies   Reply[]
  likes     Like[]
  createdAt DateTime @default(now())
}

model Reply {
  id        String   @id @default(cuid())
  content   String
  imageUrl  String?
  commentId String
  author    User     @relation(...)
  likes     Like[]
  createdAt DateTime @default(now())
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String?
  commentId String?
  replyId   String?
  createdAt DateTime @default(now())
  @@unique([userId, postId])
  @@unique([userId, commentId])
  @@unique([userId, replyId])
}
```

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v20+
- PostgreSQL database
- Cloudinary account (free tier works)

### Step-by-Step

**1. Clone the repository**
```bash
git clone <repository-url>
cd buddyscript
```

**2. Install dependencies**
```bash
npm install
```

**3. Create `.env` file**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/buddyscript"
JWT_SECRET="your_very_secure_random_secret_min_32_chars"

```

**4. Initialize the database**
```bash
npx prisma generate
npx prisma db push
```

**5. Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

---

## 🔐 Security Highlights

- **SQL Injection** — Prevented via Prisma's parameterized queries
- **XSS** — JWT stored in `HttpOnly` cookies, not `localStorage`
- **CSRF** — `SameSite: Strict` cookie policy
- **Auth validation** — Every API route calls `getCurrentUser()` server-side before any DB operation
- **Authorization** — Edit/Delete endpoints verify `post.authorId === currentUser.id`
- **Password** — bcryptjs with cost factor 12

---

## 📌 Design Decisions

### Pixel-Perfect Fidelity
The original `feed.html`, `login.html`, and `registration.html` templates were treated as the source of truth. All Bootstrap classes, custom CSS variables, and dark mode rules from `main.css` were preserved exactly — no CSS framework was swapped out.

### Optimistic UI
Like buttons apply the state change immediately to the UI (adding/removing the user avatar and toggling color) and then sync with the server. If the server request fails, the state reverts. This makes the app feel instant.

### Image Strategy
Posts support multiple images stored as `imageUrls String[]` in the database, with `imageUrl` kept as the first image for backward compatibility. A Facebook-style CSS grid adapts layout based on image count (1–5+).

### Stories Without a Backend Table
Stories are stored in `database` with a 24-hour TTL. This avoids a database table for ephemeral content while still giving a realistic UX. Demo stories are always present in the array alongside user-created ones.

### Dark Mode Without Flash
A small inline `<script>` in `layout.tsx` runs synchronously before React hydrates. It reads `localStorage.getItem('darkMode')` and applies `_dark_wrapper` to `<html>` immediately — eliminating the white flash that occurs when dark mode is applied inside `useEffect`.

---

## 📦 Environment Variables Reference

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens (min 32 chars) |