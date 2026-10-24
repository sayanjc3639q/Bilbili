# Bilbili - Text-First Educational Knowledge Repository

Bilbili is a clean, text-first educational blog and curriculum platform built with Next.js (App Router, TypeScript), Tailwind CSS, Firebase Authentication, and Cloud Firestore. It is engineered with strict priority on reading clarity, maximum speed, and architectural simplicity.

---

## Key Features & Highlights

1. **Design System & Aesthetics**
   - **Text-First & Distraction-Free:** No gradients anywhere. No emojis anywhere. Flat solid colours with borders instead of drop-shadows.
   - **Theme Engine:** Instant light and dark mode with manual toggle and zero-flash inline script.
   - **Typography:** Inter via `next/font`, 17-18px body desktop (16px mobile), line-height 1.7, reading column capped at 720px.
   - **3-Column Desktop Layout:**
     - Left: 260px sticky curriculum tree sidebar (auto-expanded to active path).
     - Center: Max 720px focused reading column.
     - Right: 220px sticky table of contents with scroll-spy highlighting and top reading progress bar.
   - **Mobile-Responsive:** Below 1024px, the table of contents collapses above the article; curriculum browsing opens via an accessible slide-over drawer. Tables scroll inside their own container.

2. **Hierarchical Topic Model**
   - **Unlimited Depth Hierarchy:** Topics support levels 0, 1, 2, ... with parent pointers and ancestor arrays.
   - **Guaranteed Unique 6-Character IDs:** Every subtopic receives a 6-character alphanumeric ID (`[0-9a-zA-Z]`) generated via `crypto.getRandomValues`. Written inside a Firestore transaction with collision verification against the `subtopic_ids` collection.
   - **Single Read Sidebar:** A denormalized document at `meta/topicTree` caches the entire topic tree, eliminating multiple collection scans.

3. **Rich Educational Block Renderer**
   - 9 supported block types:
     1. `subtitle`: Section headings with anchor links.
     2. `paragraph`: Body text with typography tokens.
     3. `bullet_list`: Unordered technical lists.
     4. `numbered_list`: Sequential steps or proofs.
     5. `table`: Tabular data with horizontal scroll isolation and optional header row.
     6. `image`: Responsive image with mandatory accessibility alt text and captions.
     7. `code`: Monospace syntax block with one-click copy button and filename badge.
     8. `callout`: Dedicated note (`#EEF2FF` / `#161D2F`) and warning (`#FEF3C7` / `#291F0A`) solid alert boxes.
     9. `equation`: Mathematical formulas rendered via KaTeX (lazy-loaded).

4. **Reader Experience (No Login Required)**
   - **Instant Search:** Compact client search index (`search-index.json`) fetched on search focus, 150ms debounce, fuzzy scoring, keyboard navigation (`/` shortcut, arrow keys, Enter), and term highlighting.
   - **Bookmarks & History:** Articles saved locally in browser `localStorage` and accessible via the `/saved` reading library.
   - **Article Utilities:** Native Web Share / Copy Link, Back-to-Top button, and print-optimized stylesheet.

5. **Secure Administrative Portal (`/admin`)**
   - Protected by Firebase Auth + Next.js Proxy/Middleware + Server-Side Session Verification with custom claim (`admin == true`).
   - Exchange ID token for secure `httpOnly` session cookies via `/api/admin/session`.
   - Automatic rate-limiting on consecutive failed login attempts.
   - **Topics Manager:** Tree visualization, create main topic, create subtopic under any node, one-click 6-character ID copy, rename, move (re-parenting with batched ancestor updates), and deletion safety checks.
   - **Blog Editor:** Title, auto-slug generator, instant 6-character ID validation showing resolved breadcrumb path, 9 block editors, table editor, image client-side compression (<200KB WebP), references list, optional acknowledgements, live preview, autosave to `localStorage`, and zod validation.
   - Tag-based on-demand ISR revalidation (`blog:{slug}`, `topic:{id}`, `tree`, `latest`).

6. **SEO & Accessibility**
   - Semantic HTML5, visible focus rings, touch targets >= 44px, and skip-to-content links.
   - Open Graph tags, canonical URLs, and JSON-LD structured data (`Article` and `BreadcrumbList`).
   - Auto-generated `sitemap.xml`, `robots.txt`, and RSS 2.0 XML feed at `/rss.xml`.

---

## Project Structure

```
├── .env.example              # Environment variables template
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Composite indexes configuration
├── next.config.ts            # Turbopack, headers, and bundle analyzer config
├── scripts/
│   ├── seed-data.js          # Seeds sample topics, subtopics, and blogs
│   └── set-admin.js          # CLI script to grant admin custom claims
├── src/
│   ├── proxy.ts              # Next.js proxy/middleware protecting admin routes
│   ├── types/
│   │   └── index.ts          # TypeScript domain models (Blog, Topic, Blocks, Tree)
│   ├── lib/
│   │   ├── id-generator.ts   # 6-character ID generator & transactional safety
│   │   ├── zod-schemas.ts    # Zod validation schemas
│   │   ├── search.ts         # Fuzzy search scoring & highlight utility
│   │   ├── queries.ts        # Server Firestore queries with unstable_cache
│   │   ├── actions/
│   │   │   ├── topics.ts     # Server actions for topics management
│   │   │   └── blogs.ts      # Server actions for blog CRUD & revalidation
│   │   └── firebase/
│   │       ├── admin.ts      # Server-only Firebase Admin SDK initialization
│   │       ├── client.ts     # Admin-only Firebase Client SDK initialization
│   │       └── session.ts    # Session cookie verification & creation
│   ├── components/
│   │   ├── header.tsx        # Top navigation with search bar & theme toggle
│   │   ├── footer.tsx        # Minimal educational footer
│   │   ├── theme-toggle.tsx  # Light/dark mode toggle button
│   │   ├── search-bar.tsx    # Header instant search bar
│   │   ├── topic-sidebar.tsx # 260px desktop sidebar & mobile drawer
│   │   ├── table-of-contents.tsx # 220px sticky TOC with scroll-spy
│   │   ├── article-actions.tsx   # Save, share, and back-to-top buttons
│   │   ├── blocks/
│   │   │   ├── block-renderer.tsx # Dispatches all 9 block types
│   │   │   ├── code-block.tsx     # Monospace code with copy button
│   │   │   └── equation-block.tsx # KaTeX math renderer
│   │   └── admin/
│   │       ├── logout-button.tsx  # Admin sign-out button
│   │       ├── topics-manager.tsx # Interactive curriculum tree editor
│   │       ├── blogs-manager.tsx  # Blog list with search & filter
│   │       └── blog-editor.tsx    # Multi-block article editor
│   └── app/
│       ├── layout.tsx        # Root layout with Inter font & theme script
│       ├── page.tsx          # Homepage with topic cards & latest blogs
│       ├── not-found.tsx     # Custom 404 page
│       ├── error.tsx         # Segment error boundary
│       ├── loading.tsx       # Layout skeleton loader
│       ├── offline/page.tsx  # Offline reading fallback
│       ├── saved/page.tsx    # Saved bookmarks & reading history
│       ├── search/page.tsx   # Full search results page
│       ├── topic/[slug]/page.tsx # Topic & subtopic page
│       ├── blog/[slug]/page.tsx  # Article page with 3-column layout
│       ├── sitemap.ts        # Dynamic sitemap.xml
│       ├── robots.ts         # robots.txt
│       ├── rss.xml/route.ts  # RSS 2.0 XML feed endpoint
│       ├── api/
│       │   ├── blogs/route.ts        # Cursor pagination API
│       │   ├── search-index/route.ts # Compact search index API
│       │   └── admin/session/route.ts# Session cookie exchange API
│       └── admin/
│           ├── layout.tsx            # Admin layout with verification
│           ├── page.tsx              # Admin dashboard with metrics
│           ├── login/page.tsx        # Admin login page
│           ├── topics/page.tsx       # Topics management view
│           └── blogs/
│               ├── page.tsx          # Blog list view
│               ├── new/page.tsx      # New blog page
│               └── [id]/page.tsx     # Edit blog page
```

---

## Setup & Local Development

### 1. Prerequisites
- Node.js v18+ (tested on v24)
- npm or pnpm

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Firebase project credentials:
```bash
cp .env.example .env
```

Ensure the following variables are defined:
```env
# Client SDK (publicly accessible inside /admin)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Server SDK (server-only)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

SESSION_COOKIE_NAME=bilbili_session
SESSION_SECRET=a_very_long_random_session_secret_at_least_32_characters
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Curriculum & Initial Data
To populate sample main topics, subtopics with 6-character IDs, `meta/topicTree`, and sample technical articles:
```bash
npm run seed
```

### 5. Creating Your First Admin User
1. Create a user account in the Firebase Authentication console (or via email/password sign-up).
2. Run the `set-admin` script to assign the custom claim `admin: true`:
```bash
node scripts/set-admin.js your-admin-email@example.com
```
3. You can now log in at `/admin/login`.

### 6. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Production Build
```bash
npm run build
npm run start
```

---

## Deploying Firebase Rules & Indexes

Using the Firebase CLI:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
- `firestore.rules` enforces public read for published articles and topics, while restricting drafts and all write operations to authenticated tokens with `token.admin == true`.
- `firestore.indexes.json` defines composite indexes for topic queries, pagination, and sorting.
