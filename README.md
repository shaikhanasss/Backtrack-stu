# BackTrack

A centralized academic study platform for **SSC (Class 10)** and **HSC (Class 11–12)**
students of the Maharashtra State Board — chapter-wise notes, previous year
question papers (PYQs) and quizzes, with real progress tracking and a full
admin panel for managing content.

> **Learn Smart, Score Better**

---

## Quick start

```bash
./setup.sh     # checks tooling, installs, starts Postgres, migrates, seeds
./start.sh     # runs the app at http://localhost:3000
```

That is the whole setup. `setup.sh` verifies Node.js, npm, Docker and Docker
Compose, and tells you exactly what to install if anything is missing.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@backtrack.local` | `Admin@12345` |
| Student | `student@backtrack.local` | `Student@12345` |

Both are configurable via `SEED_*` in `.env`. **Change them before deploying
anywhere public.**

---

## Features

**Student**
- Browse Board → Class → Stream → Subject → Chapter → Study Material
- Read text notes, view PDFs inline, view image material
- Bookmark notes and question papers
- Mark material complete; last-viewed and streak tracking
- Take timed quizzes with question navigation, then review answers and explanations
- Progress dashboard with subject-wise breakdown, averages and quiz history
- Global search across notes, chapters, subjects, PYQs and quizzes
- Profile editing with avatar upload

**Admin**
- Dashboard with live counts and recently added content
- Full CRUD for boards, classes, streams, subjects and chapters
- Study material with text, PDF, thumbnail and image uploads
- PYQ management with question and solution PDFs
- Quiz builder: questions, four options, correct answer, explanation, marks
- Publish/unpublish and activate/deactivate throughout
- Search, filters, sorting and pagination on every list
- Read-only user list

---

## Technology stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Server components, Server Actions, one deployable unit |
| Language | **TypeScript** (strict) | Compile-time safety across the client/server boundary |
| Database | **PostgreSQL 16** | The content model is a strict hierarchy with aggregate reporting |
| ORM | **Prisma 6** | Type-safe queries and versioned migrations |
| Auth | **Auth.js v5** | Credentials (bcrypt) plus optional Google OAuth, role-based |
| Styling | **Tailwind CSS** + **shadcn/ui** | Utility-first CSS with accessible, owned-in-repo components |
| Forms | **React Hook Form** + **Zod** | One schema validates on the client *and* re-validates on the server |
| Tests | **node:test** + tsx | No extra test framework to install or configure |
| Local infra | **Docker Compose** | One container, one command, no local Postgres install |

---

## Architecture

```
Browser
  │
  ├─ middleware.ts ............ redirects unauthenticated users (UX layer only)
  │
  ├─ app/(auth)/* ............. login, signup
  ├─ app/page.tsx ............. public landing page
  ├─ app/dashboard/* .......... student area  — layout re-checks the session
  ├─ app/admin/* .............. admin area    — layout re-checks session + role
  └─ app/api/* ................ auth handlers, uploads, authorised file serving
        │
        ├─ server/queries.ts .......... admin/public reads
        ├─ server/student-queries.ts .. student reads
        ├─ server/admin-queries.ts .... admin list reads (search/sort/paginate)
        └─ server/actions/** .......... all writes, as Server Actions
              │
              └─ lib/prisma.ts ........ singleton PrismaClient
                    │
                    └─ PostgreSQL (Docker)
```

### Folder structure

```
backtrack/
├── setup.sh / start.sh / stop.sh / reset-db.sh   # one-command tooling
├── docker-compose.yml                            # PostgreSQL
├── .env.example
├── prisma/
│   ├── schema.prisma        # 16 models
│   ├── migrations/          # versioned SQL incl. hand-written constraints
│   └── seed.ts              # realistic SSC/HSC demo dataset
├── tests/
│   ├── unit.test.ts         # scoring, streak, validation (no database)
│   └── integration.test.ts  # constraints, cascades, visibility (database)
├── uploads/{pdfs,images}/   # runtime file storage (gitignored)
├── legacy/                  # the original Vite prototype, not compiled
└── src/
    ├── app/
    │   ├── (auth)/          # login, signup
    │   ├── dashboard/       # student area
    │   ├── admin/           # admin area
    │   ├── api/             # auth, upload, file serving
    │   ├── unauthorized/    # 403
    │   ├── not-found.tsx    # 404
    │   └── error.tsx        # error boundary
    ├── components/
    │   ├── ui/              # shadcn primitives
    │   ├── brand/           # BackTrack-specific
    │   ├── layout/          # header, footer, navigation
    │   ├── admin/           # admin CRUD kit
    │   └── student/         # bookmarks, viewers, breadcrumbs
    ├── lib/
    │   ├── auth.ts          # Auth.js + reusable guards
    │   ├── auth.config.ts   # edge-safe half, used by middleware
    │   ├── storage/         # StorageProvider interface + local disk
    │   ├── quiz-scoring.ts  # pure, unit-tested
    │   ├── streak-math.ts   # pure, unit-tested
    │   └── validators/      # Zod schemas
    ├── server/              # queries and Server Actions
    └── middleware.ts
```

---

## Database architecture

```
Board (SSC | HSC)
 ├─ Class   (SSC: 10 | HSC: 11, 12)
 ├─ Stream  (HSC only: Science | Commerce | Arts)   ← OPTIONAL
 └─ Subject (belongs to a Class, optionally narrowed by a Stream)
     ├─ Chapter
     │   ├─ Note ─ NoteImage ─ FileAsset
     │   └─ Quiz ─ QuizQuestion
     └─ Pyq ─ FileAsset

User ─ NoteProgress ─ Note
     ├ QuizAttempt  ─ Quiz
     └ Bookmark     ─ Note | Pyq
```

### Why `Stream` is optional

SSC has no streams at all, so every SSC subject carries `streamId = null`. Only
HSC defines Science / Commerce / Arts, and some HSC subjects (English) are
common to every stream, so they leave it null too. A stream hangs off the
**Board** rather than the Class, so a single "Science" row serves Class 11 and
12 instead of being duplicated.

### Constraints Prisma cannot express

Added as raw SQL in the migrations, and each covered by a test:

1. **Partial unique index on `subjects (classId, slug) WHERE streamId IS NULL`** —
   Postgres treats NULLs as distinct, so `@@unique` alone would not stop two
   stream-less subjects sharing a slug.
2. **Partial unique index on `subjects (code) WHERE code IS NOT NULL`** — codes
   are optional but unique when present.
3. **`CHECK num_nonnulls(noteId, pyqId) = 1` on `bookmarks`** — a bookmark
   points at exactly one item, never both, never neither.
4. **Partial unique indexes on `bookmarks`** — no duplicate bookmarks.
5. **`CHECK` on `quiz_questions`** — `correctIndex` must fall inside `options`.
6. **`CHECK` on `file_assets`** — declared `kind` must match `mimeType`, and
   size must be positive.

### Cascade behaviour

| Delete | Effect |
|---|---|
| Board / Class / Subject / Chapter | Cascades down to notes, quizzes and questions |
| Stream | Subjects **survive** and become stream-less (`SetNull`) |
| User | Cascades to their progress, bookmarks and attempts |
| FileAsset | Attachments become null (`SetNull`); content is not deleted |

---

## Authentication

Authorisation is checked in **two independent places**:

1. `src/middleware.ts` redirects unauthenticated visitors away from `/dashboard`
   and `/admin`. This is a **convenience layer**, not a boundary.
2. Every protected layout and Server Action re-reads the session with `auth()`
   and re-checks the role against the database.

The second check is the one that secures the app: **every export of a
`'use server'` module is a public HTTP endpoint**, so each action begins with
`requireUser()` or `requireAdmin()` rather than trusting the page that rendered
it. This is verified by a test that calls a mutation with no session and asserts
zero rows written.

`getCurrentUser()` reads the **database row**, not the JWT. The token carries
only `id` and `role`; everything else is fetched fresh (deduped per request with
React `cache()`), so a renamed profile or a revoked admin role takes effect on
the very next request instead of lingering until the token expires.

Passwords are hashed with **bcrypt, cost 12**, and never logged or returned.

---

## File management

Uploads go to `uploads/pdfs` and `uploads/images`, with metadata (original name,
MIME type, size, uploader, storage key) in the `file_assets` table.

The directory sits **outside `public/`** deliberately. Files are served by
`/api/files/[id]`, which checks the session and only lets students read files
attached to *published* content — draft material stays admin-only, and a user
can always read their own avatar. A public directory would make every upload
readable by URL guess.

Validation happens **before anything touches disk**: size limits (20 MB PDF,
5 MB image, 2 MB avatar), MIME allow-list, extension allow-list, and a
magic-byte check so a renamed file cannot pose as a PDF.

`src/lib/storage/` defines a `StorageProvider` interface with a local-disk
implementation. Moving to S3 or Cloudflare R2 means writing one class and
extending the factory in `index.ts` — no route, action or migration changes,
because `storageKey` is provider-relative.

---

## Installation

### Prerequisites

- **Node.js 20+**
- **Docker** and **Docker Compose** (Docker Desktop bundles both)

### Setup

```bash
./setup.sh
```

It will:

1. Check Node.js, npm, Docker and Docker Compose, with install instructions if
   anything is missing
2. Create `.env` from `.env.example`, generating a random `AUTH_SECRET` and
   database password
3. Install npm dependencies
4. Start PostgreSQL in Docker and wait until it accepts connections
5. Run `prisma generate` and apply migrations
6. Seed the demo dataset
7. Create the upload directories

### Running locally

```bash
./start.sh            # development server, hot reload
./start.sh --prod     # production build, then serve it
./stop.sh             # stop the app
./stop.sh --all       # stop the app and the database container
```

The database runs on port **5433** by default so it cannot collide with a
PostgreSQL you may already run on 5432.

### Resetting the database

```bash
./reset-db.sh
```

Asks for confirmation, then drops everything, re-applies migrations and re-seeds
the demo data. Useful right before a demo.

### Verifying the project

```bash
npm run verify     # lint + typecheck + prisma validate + unit tests + build
npm test           # unit and integration tests
```

### Building for production

```bash
npm run build
npm start
```

---

## How to add academic content

Sign in as the admin, then work down the hierarchy — each level needs its parent
to exist first:

1. **Boards** → create SSC or HSC
2. **Classes** → assign to a board (Class 10 under SSC)
3. **Streams** → HSC only; skip entirely for SSC
4. **Subjects** → pick a class, optionally a stream, set a code and order
5. **Chapters** → pick a subject, set the chapter number
6. **Study Material** → pick a chapter, write text and/or upload a PDF, a
   thumbnail and images, then publish
7. **PYQs** → pick a subject and year, upload the question paper and optionally
   a solution
8. **Quizzes** → create the quiz, open it, add questions with four options, mark
   the correct answer, add an explanation and marks, then publish

Content stays invisible to students until it is **published**, and a quiz cannot
be published until it has at least one question.

---

## How to Demonstrate This Project in Viva

A 10-minute flow that touches every part of the system.

**Prepare:** run `./reset-db.sh` beforehand so the data is clean and predictable.

### Part 1 — Admin: create content (≈5 min)

1. **Login as admin** — `admin@backtrack.local` / `Admin@12345`.
   Point out the dashboard's live counts; they are database queries, not constants.
2. **Add a subject** — Admin → Subjects → New subject. Pick HSC · Class 12.
   *Say this:* selecting a class filters the stream list to that board, and SSC
   offers no streams at all — the optional relation is enforced from the data,
   not a hardcoded board name.
3. **Add a chapter** — Admin → Chapters → New chapter under your subject.
4. **Upload study material** — Admin → Study Material → New material. Pick the
   chapter, type some text, upload a PDF, set status **Published**.
   *Say this:* the file is validated by size, MIME type and magic bytes before
   it reaches disk, and is stored outside `public/`.
5. **Create a PYQ** — Admin → PYQs → New paper. Upload a question PDF, publish.
6. **Create a quiz** — Admin → Quizzes → New quiz. Try to publish it with no
   questions — **it is refused**. Add a question with four options, mark the
   correct one, add an explanation, then publish.
7. **Logout.**

### Part 2 — Student: consume it (≈5 min)

8. **Login as student** — `student@backtrack.local` / `Student@12345`.
9. **Browse** — Notes → board → class → stream chip → subject → chapter.
   *Say this:* nothing in this path is hardcoded; every level is a query.
10. **Open the material** — read the text, view the PDF inline, hit Download.
    Bookmark it. Mark it complete.
11. **Take the quiz** — answer some questions right and one wrong, use the
    question navigator, submit.
    *Say this:* the correct answers are never sent to the browser during an
    attempt — grading happens server-side.
12. **View the result** — score, percentage, correct/incorrect marking and the
    explanation.
13. **Show progress** — the notes-completed count and quiz average have both
    changed. *Say this:* the prototype hardcoded "45 notes, 18/20, 🔥 7"; every
    number here is computed from this student's own rows.
14. **Show profile and bookmarks** — the bookmark from step 10 is there; upload
    a profile picture.

### Likely questions, and the answers

- *Why Next.js over plain React?* Server components query Postgres directly, and
  Server Actions remove the need for a separate API service.
- *Why PostgreSQL over MongoDB?* The content is a strict hierarchy with foreign
  keys and aggregate reporting; relational integrity matters more than schema
  flexibility.
- *How is the admin area secured?* Middleware for redirects, plus an independent
  session-and-role check inside every layout and Server Action.
- *Could a student call an admin action directly?* No — this is tested. Every
  `'use server'` export is a public endpoint, so each begins with `requireAdmin()`.
- *How is the quiz scored?* Server-side in `scoreAnswers`, which also discards
  any question id that is not on the quiz.
- *How does the streak work?* `nextStreak` compares `lastActiveOn` with today:
  same day is a no-op, consecutive days increment, a gap resets to 1.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Docker daemon unavailable` | Start Docker Desktop, or `sudo systemctl start docker` |
| `Port 5433 already allocated` | Change `POSTGRES_PORT` in `.env`, update `DATABASE_URL` to match, then `docker compose up -d` |
| Port 3000 in use | `PORT=3001 ./start.sh`, and set `AUTH_URL`/`NEXTAUTH_URL` to match |
| `Can't reach database server` | `docker compose up -d`, then `docker compose logs postgres` |
| Login always fails | `.env` `AUTH_SECRET` is empty or changed — set it and restart |
| Migrations out of sync | `./reset-db.sh` |
| Prisma client errors after a schema edit | `npx prisma generate` |
| Uploads 403 for students | Expected — the owning note or PYQ is still a draft. Publish it. |
| `Cannot find module './vendor-chunks/...'` and 500s | A production `next build` was run while `./start.sh` was already going — the build overwrites `.next` underneath the dev server. Stop the dev server, `rm -rf .next`, then restart. Never run `npm run build` or `npm run verify` while the dev server is up. |
| Fast Refresh reloads with "runtime error" | Usually the same `.next` collision as above. Restart the dev server. |
| `npm install` skipped Prisma scripts | `npm approve-scripts prisma @prisma/client @prisma/engines esbuild` |

---

## Known limitations

- **404 status codes in authenticated areas.** Render-time `notFound()` returns
  HTTP **200** with the correct not-found page, because a layout that reads
  cookies makes the route dynamic and Next.js 15 commits the status before the
  page throws. Routing-level misses (`/no-such-page`) return a real 404. The
  user-visible behaviour is correct and nothing leaks — requesting another
  student's attempt renders not-found, never their answers.
- **Admin user actions** — the user list is read-only; role changes and
  deactivation are not built.
- **Bulk import** — quiz questions are added one at a time; a CSV importer is
  the obvious next step for a real question bank.
- **Study calendar** — not implemented, and the route has been removed rather
  than left as a dead link.
- **Google OAuth** — wired but disabled unless `AUTH_GOOGLE_ID` and
  `AUTH_GOOGLE_SECRET` are set.
- **No email delivery** — password reset and verification are not built.

---

## What changed from the original prototype

| Prototype | Now |
|---|---|
| `AuthContext` — a `useState(false)` boolean accepting any password, reset on refresh | Auth.js with bcrypt hashes and persistent sessions |
| Signup fired `alert()` and saved nothing | A Server Action writes a real `User` row |
| Cards were inert (`to`/`actionLabel` never passed) | Every card navigates |
| Progress hardcoded to 70% / 45 / 18-20 / 🔥7 | Computed from `NoteProgress` and `QuizAttempt` |
| Search box stored text nothing read | Global search across five content types |
| `window.alert()` for feedback | Toasts |
| No 404, no error boundary | `not-found.tsx`, `error.tsx`, per-segment boundaries |
| 324-line global stylesheet | Tailwind theme + CSS variables, same palette |

The visual identity is unchanged: the `135deg` navy → blue gradient
(`#0f172a` → `#2563eb`), gold accent (`#ffd700`), translucent blurred cards and
pill controls all carry over from the original design.
