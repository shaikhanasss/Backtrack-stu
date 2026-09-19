# BackTrack — Full Application Build Plan

**Project type:** Academic / college project
**Stack direction:** Next.js 15 fullstack (public site + student app + admin panel in one codebase)
**Status:** Planning document — no code written yet
**Prepared:** 2026-09-02

---

## 1. What we are building

BackTrack is a study platform for Maharashtra-board school students covering
**SSC (Class 10)** and **HSC (Class 11–12)**. It provides chapter-wise notes,
previous year question papers (PYQs), quizzes, a study calendar, and real
progress tracking.

The existing repository is a **UI prototype only** — 4 pages, fake in-memory
login, hardcoded emoji cards, no backend, no database, no content. This plan
turns it into a complete three-surface web application.

### The three surfaces

| Surface | Who uses it | Purpose |
|---|---|---|
| **Public site** | Anyone, Google crawlers | Landing page, browsable notes/PYQ catalog, free previews |
| **Student app** | Logged-in students | Read notes, take quizzes, track progress, streaks, calendar |
| **Admin panel** | You (the admin) | Upload PDFs, build the subject tree, author quizzes, manage users, view analytics |

The admin panel is not optional polish. Until it exists, content can only be
added by editing source code — which is exactly the trap the current prototype
is stuck in.

---

## 2. Scope decisions for an academic project

Because this is a college project graded on demonstration and explanation,
scope is deliberately trimmed:

### In scope
- Full authentication with roles (Student / Admin)
- Complete content hierarchy: Board → Class → Stream → Subject → Chapter → Note
- PDF upload and viewing for notes and PYQs
- Working quiz engine with scoring, review, and stored attempts
- Real progress tracking and study streaks (replacing hardcoded 70% / 45 / 🔥7)
- Search across notes and PYQs
- Study calendar
- Full admin CRUD panel with analytics dashboard
- Server-rendered public pages (demonstrates SSR understanding — a strong viva point)

### Deliberately out of scope
- **Payments / premium tiers** — adds Razorpay complexity with no academic value.
  Keep an `isPremium` boolean on the schema and mention it as "future scope."
- **AI features** — the original tagline mentions AI. Do not build it. If asked,
  describe it as a planned enhancement.
- **Mobile app** — the web app will be responsive; that is sufficient.
- **Email verification flows** — optional. Add only if time remains.
- **Real-time features** — no websockets, no live leaderboards.

### The scope trap to avoid
The landing page currently advertises *"SSC • HSC • PYQs • Quiz • AI • Games."*
Six pillars is too many. Build **Notes, PYQs, and Quiz** properly. A working
three-feature app beats six half-features in any evaluation.

---

## 3. Technology stack and justification

Every choice below has a one-line defence — useful when an examiner asks *"why
did you choose this?"*

| Layer | Technology | Justification for viva |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server-side rendering makes notes pages indexable by Google; API routes remove the need to deploy a separate backend |
| Language | **TypeScript** | Compile-time type safety; catches errors before runtime |
| Database | **PostgreSQL** (Neon free tier) | The data is highly relational — subjects, chapters, attempts. Relational integrity matters more than schema flexibility here |
| ORM | **Prisma** | Type-safe queries, versioned migrations, and the schema file doubles as ER documentation |
| Auth | **Auth.js v5 (NextAuth)** | Industry standard, supports credentials + Google OAuth, free and self-hosted |
| Styling | **Tailwind CSS + shadcn/ui** | Utility-first CSS with accessible prebuilt components (tables, dialogs, forms) needed for admin |
| Server state | **TanStack Query** | Handles caching, refetching, and loading states declaratively |
| Forms | **React Hook Form + Zod** | One Zod schema validates on both client and server — no duplicated rules |
| File storage | **Cloudflare R2** | S3-compatible with **zero egress fees** — critical when many students download the same PDF |
| PDF viewing | **react-pdf** | Renders PDFs in-browser so students never leave the app |
| Charts | **Recharts** | Admin analytics; React-native API, minimal setup |
| Hosting | **Vercel** | Zero-config Next.js deploys, free tier, live URL for demo day |

### Why not the "MERN" stack we were taught?
Worth preparing an answer for. MongoDB is a poor fit because the content model
is a strict hierarchy with foreign-key relationships and aggregate queries
("average score per chapter"). Postgres enforces that integrity; Mongo would
require manual consistency checks. Next.js replaces Express because API routes
and pages deploy as one unit — simpler to operate, and it adds SSR that a
plain React SPA cannot provide.

---

## 4. Database schema (Prisma)

This is the most consequential part of the project. Get it right first.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------- Enums ----------

enum Role {
  STUDENT
  ADMIN
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum ProgressStatus {
  IN_PROGRESS
  COMPLETED
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

// ---------- Users & auth ----------

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String?   // null for Google OAuth users
  image         String?
  role          Role      @default(STUDENT)
  emailVerified DateTime?

  // Student profile — what they are studying
  boardId     String?
  board       Board?  @relation(fields: [boardId], references: [id])
  classLevel  Int?    // 10, 11 or 12
  streamId    String?
  stream      Stream? @relation(fields: [streamId], references: [id])

  // Streak tracking
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)
  lastActiveOn  DateTime?

  accounts     Account[]
  sessions     Session[]
  noteProgress NoteProgress[]
  quizAttempts QuizAttempt[]
  bookmarks    Bookmark[]
  studyEvents  StudyEvent[]
  auditLogs    AuditLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([role])
}

// Auth.js required models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ---------- Content hierarchy ----------

model Board {
  id       String    @id @default(cuid())
  name     String    @unique   // "SSC" | "HSC"
  slug     String    @unique   // "ssc" | "hsc"
  subjects Subject[]
  streams  Stream[]
  users    User[]
}

// Streams apply to HSC only — SSC subjects leave streamId null
model Stream {
  id       String    @id @default(cuid())
  name     String    // "Science" | "Commerce" | "Arts"
  slug     String
  boardId  String
  board    Board     @relation(fields: [boardId], references: [id], onDelete: Cascade)
  subjects Subject[]
  users    User[]

  @@unique([boardId, slug])
}

model Subject {
  id         String  @id @default(cuid())
  name       String  // "Mathematics", "Science", "English"
  slug       String
  icon       String? // emoji, reused from the current prototype
  classLevel Int     // 10, 11 or 12

  boardId  String
  board    Board   @relation(fields: [boardId], references: [id], onDelete: Cascade)
  streamId String?
  stream   Stream? @relation(fields: [streamId], references: [id])

  chapters Chapter[]
  pyqs     Pyq[]
  quizzes  Quiz[]

  createdAt DateTime @default(now())

  @@unique([boardId, classLevel, slug])
  @@index([boardId, classLevel])
}

model Chapter {
  id        String @id @default(cuid())
  number    Int    // display order, e.g. Chapter 3
  title     String
  slug      String
  subjectId String
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  notes   Note[]
  quizzes Quiz[]

  @@unique([subjectId, slug])
  @@index([subjectId, number])
}

model Note {
  id        String        @id @default(cuid())
  title     String
  slug      String
  body      String?       @db.Text // rich text / markdown, optional
  pdfUrl    String?       // Cloudflare R2 object URL
  pdfPages  Int?
  isPremium Boolean       @default(false) // future scope, unused for now
  status    ContentStatus @default(DRAFT)
  viewCount Int           @default(0)

  chapterId String
  chapter   Chapter @relation(fields: [chapterId], references: [id], onDelete: Cascade)

  progress  NoteProgress[]
  bookmarks Bookmark[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([chapterId, slug])
  @@index([status])
}

model Pyq {
  id             String        @id @default(cuid())
  year           Int           // 2024
  paperName      String        // "March 2024 — Board Paper"
  questionPdfUrl String
  solutionPdfUrl String?
  status         ContentStatus @default(DRAFT)
  downloadCount  Int           @default(0)

  subjectId String
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@index([subjectId, year])
}

// ---------- Quiz engine ----------

model Quiz {
  id          String        @id @default(cuid())
  title       String
  description String?
  durationMin Int           @default(10)
  status      ContentStatus @default(DRAFT)

  subjectId String
  subject   Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  chapterId String?  // null = subject-wide mixed quiz
  chapter   Chapter? @relation(fields: [chapterId], references: [id])

  questions Question[]
  attempts  QuizAttempt[]

  createdAt DateTime @default(now())

  @@index([subjectId])
}

model Question {
  id           String     @id @default(cuid())
  text         String     @db.Text
  options      String[]   // exactly 4 options
  correctIndex Int        // 0-3
  explanation  String?    @db.Text
  difficulty   Difficulty @default(MEDIUM)
  order        Int        @default(0)

  quizId String
  quiz   Quiz   @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@index([quizId, order])
}

model QuizAttempt {
  id          String    @id @default(cuid())
  score       Int       // correct answers
  totalMarks  Int       // total questions
  answers     Json      // { questionId: selectedIndex }
  startedAt   DateTime  @default(now())
  completedAt DateTime?

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  quizId String
  quiz   Quiz   @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@index([userId, completedAt])
  @@index([quizId])
}

// ---------- Student activity ----------

model NoteProgress {
  id         String         @id @default(cuid())
  status     ProgressStatus @default(IN_PROGRESS)
  lastReadAt DateTime       @default(now())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  noteId String
  note   Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@unique([userId, noteId])
  @@index([userId, status])
}

model Bookmark {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  noteId String
  note   Note   @relation(fields: [noteId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, noteId])
}

model StudyEvent {
  id      String   @id @default(cuid())
  title   String
  date    DateTime
  notes   String?
  isDone  Boolean  @default(false)

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
}

// ---------- Admin ----------

model AuditLog {
  id       String   @id @default(cuid())
  action   String   // "CREATE_NOTE", "DELETE_QUIZ"
  entity   String   // "Note"
  entityId String
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())

  @@index([createdAt])
}
```

### Schema notes worth explaining in a viva
- **`Stream` is nullable on `Subject`** because streams exist only for HSC.
  Forcing symmetry between SSC and HSC would corrupt the model.
- **`NoteProgress` has a compound unique key** `[userId, noteId]` so a student
  cannot have two progress rows for one note. This is what makes the
  "45 Notes Completed" stat real instead of hardcoded.
- **`QuizAttempt.answers` is `Json`** — a deliberate exception to normalisation.
  Answers are always read as a complete set, never queried individually, so a
  separate `AnswerRow` table would add joins for no benefit.
- **`ContentStatus`** gives a draft/publish workflow so half-written notes never
  reach students.
- **`AuditLog`** records admin actions — a small addition that demonstrates
  accountability thinking.

---

## 5. Project structure

```
backtrack/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                    # ports cardsData.js into real rows
├── public/
├── src/
│   ├── app/
│   │   ├── (public)/              # server-rendered, SEO-indexed
│   │   │   ├── page.tsx                    # landing
│   │   │   ├── notes/
│   │   │   │   ├── page.tsx                # board picker
│   │   │   │   └── [board]/[class]/[subject]/
│   │   │   │       ├── page.tsx            # chapter list
│   │   │   │       └── [chapter]/page.tsx  # note preview
│   │   │   ├── pyqs/page.tsx
│   │   │   ├── quiz/page.tsx
│   │   │   └── search/page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (student)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx                # real stats, not hardcoded
│   │   │       ├── notes/[noteId]/page.tsx # PDF reader
│   │   │       ├── quiz/[quizId]/
│   │   │       │   ├── page.tsx            # attempt screen
│   │   │       │   └── result/[attemptId]/page.tsx
│   │   │       ├── bookmarks/page.tsx
│   │   │       ├── calendar/page.tsx
│   │   │       └── profile/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx                  # role guard: ADMIN only
│   │   │   ├── page.tsx                    # analytics dashboard
│   │   │   ├── content/page.tsx            # subject/chapter tree editor
│   │   │   ├── notes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── pyqs/page.tsx
│   │   │   ├── quizzes/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/questions/page.tsx # question builder + CSV import
│   │   │   ├── users/page.tsx
│   │   │   └── logs/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── upload/route.ts             # presigned R2 URLs
│   │   │   ├── progress/route.ts
│   │   │   └── attempts/route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn primitives
│   │   ├── layout/                # Header, Footer, Sidebar
│   │   ├── content/               # SubjectCard, ChapterList, PdfViewer
│   │   ├── quiz/                  # QuestionCard, Timer, ScoreSummary
│   │   └── admin/                 # DataTable, UploadDropzone, TreeEditor
│   ├── lib/
│   │   ├── prisma.ts              # singleton client
│   │   ├── auth.ts                # Auth.js config
│   │   ├── r2.ts                  # storage helpers
│   │   ├── streak.ts              # streak calculation
│   │   └── validators/            # Zod schemas
│   ├── server/
│   │   └── actions/               # server actions: notes, quiz, admin
│   ├── types/
│   └── middleware.ts              # route protection
├── .env.example
└── package.json
```

### Why route groups
`(public)`, `(auth)`, `(student)`, and `admin` each get their own layout —
different navigation, different guards — without polluting the URL. A clean
structural point to raise during evaluation.

---

## 6. Authorization model

Three levels, enforced in two places (middleware for redirects, server actions
for actual security):

| Route pattern | Access |
|---|---|
| `/`, `/notes/**`, `/pyqs`, `/search` | Public — anyone, plus crawlers |
| `/dashboard/**` | Authenticated students |
| `/admin/**` | `role === ADMIN` only |

**Critical rule:** never trust the client. Middleware redirects are for user
experience; every server action must independently re-check the session and
role. This is the single most common security flaw in student projects and a
likely viva question.

---

## 7. Admin panel — feature specification

| Module | Features |
|---|---|
| **Dashboard** | Total users, notes, quizzes; signups over time; most-read chapters; recent activity |
| **Content tree** | Create/edit/delete Boards, Streams, Subjects, Chapters; reorder chapters; expand-collapse tree view |
| **Notes** | Table with search + filters; create/edit; PDF upload to R2 with progress bar; draft ↔ published toggle |
| **PYQs** | Upload question paper + optional solution; tag by subject and year |
| **Quiz builder** | Create quiz; add questions with 4 options and correct answer; set explanation and difficulty; reorder; **bulk CSV import** |
| **Users** | List, search, filter by role; promote to admin; deactivate |
| **Analytics** | Quiz difficulty report (questions most often answered wrong), popular content, active students |
| **Audit log** | Chronological record of admin actions |

**The CSV import is not a nice-to-have.** Typing 200 quiz questions through a
web form is how projects run out of time three days before submission. Build it
in Phase 5.

---

## 8. Build phases

Eight weeks of steady work. Each phase ends with something demonstrable.

### Phase 0 — Foundation (Week 1)
- Scaffold Next.js 15 + TypeScript + Tailwind; install shadcn/ui
- Provision Neon Postgres; write and migrate `schema.prisma`
- Write `seed.ts` — port `cardsData.js` plus 2 subjects, 5 chapters, 1 quiz
- Port the navy→blue gradient and gold `#ffd700` accent into a Tailwind theme
- **Deliverable:** database live and seeded, `npx prisma studio` shows real rows

### Phase 1 — Authentication (Week 2)
- Auth.js with credentials (bcrypt) + Google OAuth
- Real signup writing to the database
- Session persistence — **fixes the current refresh-logs-you-out bug**
- `middleware.ts` route guards; role-based redirects
- **Deliverable:** register, log out, close the browser, return still logged in

### Phase 2 — Admin panel, part 1 (Week 3)
- `/admin` layout with sidebar and ADMIN guard
- Content tree editor: Board → Stream → Subject → Chapter CRUD
- Reusable `DataTable` component
- **Deliverable:** build the whole subject hierarchy through the UI, no code edits

### Phase 3 — Content & uploads (Week 4)
- Cloudflare R2 bucket + presigned upload endpoint
- Note editor with PDF upload and draft/publish workflow
- PYQ management
- **Deliverable:** upload a real PDF through admin; it appears in storage

### Phase 4 — Student experience (Week 5)
- Dashboard with **real** stats computed from `NoteProgress` and `QuizAttempt`
- Notes browser and in-browser PDF reader (`react-pdf`)
- Auto-mark progress on open; bookmarks
- Streak logic in `lib/streak.ts`
- **Deliverable:** the fake 70% / 45 / 🔥7 numbers become genuine

### Phase 5 — Quiz engine (Week 6)
- Admin quiz builder + CSV bulk import
- Student attempt screen with countdown timer
- Scoring, result page with per-question explanations, attempt history
- **Deliverable:** full cycle — admin authors a quiz, student takes it, sees score

### Phase 6 — Public site & SEO (Week 7)
- Server-rendered public notes/PYQ catalog
- Full-text search (Postgres `tsvector`)
- Dynamic metadata, `sitemap.xml`, `robots.txt`
- Working landing search box (currently dead)
- **Deliverable:** view page source, see real content in the HTML — the SSR proof

### Phase 7 — Polish & submission (Week 8)
- Study calendar
- Loading skeletons, error boundaries, a real 404 page
- Mobile responsiveness pass
- Deploy to Vercel; seed demo data
- Write documentation: ER diagram, screenshots, README
- **Deliverable:** live URL plus submission report

---

## 9. What carries over from the current prototype

Nothing is wasted:

| Existing file | Becomes |
|---|---|
| `App.css` | Source for the Tailwind theme — the gradient and gold accent are a real brand identity worth keeping |
| `cardsData.js` | `prisma/seed.ts` — the same subjects, now as database rows |
| `Header.jsx` / `Footer.jsx` | `components/layout/` with minor TypeScript changes |
| `Card.jsx` | `components/content/SubjectCard.tsx` — **with the links actually wired up this time** |
| `ProgressSection.jsx` | Same markup, fed by real queries instead of constants |
| `AuthContext.jsx` | Deleted — replaced by Auth.js sessions |
| README conversion notes | Excellent raw material for the "methodology" section of the report |

---

## 10. Known risks

| Risk | Mitigation |
|---|---|
| **Content entry takes longer than coding** | Build CSV import early; seed a realistic demo set rather than a full syllabus |
| Scope creep toward AI and Games | Both are explicitly out of scope; list them as future scope in the report |
| Learning App Router while building | Phase 0 is deliberately light — spend the slack reading Next.js docs |
| R2 setup friction | Fall back to Vercel Blob or Supabase Storage; the interface in `lib/r2.ts` stays the same |
| Losing marks on the report | Write documentation continuously, not in the final week |

---

## 11. Viva preparation — likely questions

- *Why Next.js instead of plain React?* → SSR for SEO; unified API routes
- *Why Postgres instead of MongoDB?* → strictly hierarchical, relational data with
  aggregate reporting needs
- *How is the admin panel secured?* → middleware for redirects, plus an
  independent session-and-role check inside every server action
- *How are passwords stored?* → bcrypt hashes, never plaintext
- *Why is `answers` a JSON column?* → read as a complete set, never queried
  individually; avoids needless joins
- *How does the streak work?* → compare `lastActiveOn` with today; increment on
  consecutive days, reset when a day is skipped
- *How would this scale?* → indexed foreign keys, R2 CDN for PDFs, cached
  public pages via ISR

---

## 12. Immediate next steps

1. Review and approve this plan (especially the schema in §4)
2. Create the Neon Postgres database and Cloudflare R2 bucket
3. Decide: build in a fresh `backtrack/` directory, or convert this repo in place
4. Begin Phase 0

