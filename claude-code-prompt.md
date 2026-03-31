# CLAUDE CODE PROMPT — "Un Truc de Ouf Incroyable"

## French Spaced-Repetition Learning Tool

---

## IDENTITY & CONTEXT

You are an expert senior software architect building a personal French vocabulary learning tool called **"Un Truc de Ouf Incroyable"**. This is a solo-user daily learning app — no auth needed. One user, one database, one mission: learn French beautifully.

---

## TECH STACK (non-negotiable)

- **Framework**: Next.js 15+ (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma ORM
- **Database**: Prisma Postgres (deployed via Vercel Marketplace — free tier: 100k ops, 1GiB storage, zero cold starts)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Deployment**: Vercel
- **Package Manager**: pnpm
- **Fonts**: Load 1 distinctive display font + 1 clean body font from Google Fonts via `next/font`. NO Inter, Roboto, Arial. Think: `DM Serif Display` + `DM Sans`, or `Fraunces` + `Outfit`, or `Playfair Display` + `Source Sans 3`. Pick a pairing that feels luxury/editorial.

---

## DESIGN PHILOSOPHY — "BMW × Apple × Hermès"

The UI must feel like opening a €300 leather-bound notebook. Every pixel intentional.

### Design Direction: **Quiet Luxury / Editorial Minimalism**

- **Color palette**: Use a refined, muted palette. Think warm ivory/cream background (`#FEFCF8` or similar), deep near-black text (`#1A1A1A`), one signature accent color (deep French blue `#1E3A5F` or burgundy `#6B1D2A`), and gold/brass for success states (`#B8860B`). Define all as CSS variables.
- **Typography**: Large, confident serif headings. Clean sans-serif body. Generous letter-spacing on labels. French words displayed prominently — they're the hero.
- **Spacing**: Breathe. 32px+ section gaps. Cards with 24px+ padding. Nothing cramped.
- **Micro-interactions**: Subtle. Card flip animations (CSS transforms). Smooth progress bar fills. Gentle fade-ins on page load (staggered 50ms delays). Hover states that feel tactile — slight scale(1.02) + shadow lift.
- **Cards**: Minimal borders. Soft shadows (`0 1px 3px rgba(0,0,0,0.08)`). Rounded corners (12px). White card on cream background.
- **Icons**: Use Lucide icons sparingly. They're accents, not decoration.
- **Dark mode**: NOT required. This is a warm, daytime learning tool.
- **Mobile-first**: Must be beautiful on iPhone. 390px viewport minimum.

### What to AVOID
- Gradients (unless extremely subtle)
- Neon/bright colors
- Heavy borders
- Cluttered dashboards
- Gamification cheese (no cartoon badges, no confetti)
- Generic flashcard app aesthetics

---

## DATA MODEL

### Seed Data

Two source files are provided and must be parsed and seeded into the database:

1. **`2000_most_common_french_words.txt`** — Format: `RANK | FRENCH | ENGLISH` (pipe-delimited, with header rows to skip). Parse lines matching pattern `^\d+ \| .+ \| .+$`.

2. **`100_french_conversation_fillers.txt`** — Format: numbered entries like `1. euh - uh, um (THE most common...)`. Parse the number, French term, English meaning, and optionally the parenthetical note as a usage hint. Also capture the CATEGORY each filler belongs to (e.g., "Hesitation Fillers", "Starting a Sentence", etc.).

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// The master vocabulary pool
model Word {
  id          String   @id @default(cuid())
  french      String
  english     String
  rank        Int?              // frequency rank (1-2000 for words, null for fillers)
  type        WordType           // WORD or FILLER
  category    String?            // filler category (e.g., "Hesitation", "Emphasis")
  hint        String?            // usage note / context tip
  createdAt   DateTime @default(now())

  reviews     Review[]
  
  @@unique([french, type])
}

enum WordType {
  WORD
  FILLER
}

// Each time a word enters a learning session
model Review {
  id            String       @id @default(cuid())
  wordId        String
  word          Word         @relation(fields: [wordId], references: [id])
  learnedDate   DateTime     @db.Date    // the date it was first learned
  stage         ReviewStage  @default(LEARNED_TODAY)
  nextReviewAt  DateTime     @db.Date    // when this review is due
  completedAt   DateTime?                // when the review was actually done
  remembered    Boolean?                 // did the user remember it?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([nextReviewAt])
  @@index([stage])
  @@index([wordId])
}

enum ReviewStage {
  LEARNED_TODAY       // Stage 0: just learned
  REVIEW_TOMORROW     // Stage 1: review after 1 day
  REVIEW_WEEK         // Stage 2: review after 7 days
  REVIEW_TWO_WEEKS    // Stage 3: review after 14 days
  REVIEW_MONTH        // Stage 4: review after 30 days
  MASTERED            // Stage 5: completed all reviews
}

// Track daily sessions for the progress dashboard
model DailySession {
  id              String   @id @default(cuid())
  date            DateTime @db.Date @unique
  wordsLearned    Int      @default(0)
  wordsReviewed   Int      @default(0)
  wordsRemembered Int      @default(0)
  wordsForgotten  Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Spaced Repetition Logic (CRITICAL)

When 10 words are learned today (date D):
- `LEARNED_TODAY` → `nextReviewAt = D` (today, just learned)
- After today's session completes → advance to `REVIEW_TOMORROW`, set `nextReviewAt = D + 1`
- After tomorrow's review:
  - If **remembered** → advance to `REVIEW_WEEK`, `nextReviewAt = D + 7`
  - If **forgotten** → reset: treat as newly learned today, restart the cycle
- After week review:
  - If **remembered** → `REVIEW_TWO_WEEKS`, `nextReviewAt = D + 14`
  - If **forgotten** → reset to today's learned list
- After two-week review:
  - If **remembered** → `REVIEW_MONTH`, `nextReviewAt = D + 30`
  - If **forgotten** → reset to today's learned list
- After month review:
  - If **remembered** → `MASTERED` 🎉
  - If **forgotten** → reset to today's learned list

**Key rule**: ANY time a user marks a word as "forgotten" at ANY stage, that word gets added back to today's learning queue as if freshly learned. The cycle restarts completely.

---

## APP STRUCTURE & ROUTES

```
app/
├── layout.tsx                 # Root layout: fonts, global styles, nav
├── page.tsx                   # Dashboard / Home
├── learn/
│   └── page.tsx               # Daily learning session (pick 10 new words)
├── review/
│   └── page.tsx               # Review due words (flashcard interface)
├── progress/
│   └── page.tsx               # Progress tracker & statistics
├── api/
│   └── seed/
│       └── route.ts           # POST endpoint to seed data from files
└── lib/
    ├── prisma.ts              # Singleton Prisma client
    ├── actions.ts             # Server Actions (all DB mutations)
    ├── queries.ts             # Server-side data fetching functions
    ├── constants.ts           # Review intervals, config
    └── utils.ts               # Date helpers, parsers
```

---

## PAGE SPECIFICATIONS

### 1. DASHBOARD (`/`)

The nerve center. At a glance, the user knows exactly what to do today.

**Layout:**
- **Hero section**: App title "Un Truc de Ouf Incroyable" in display font. Subtitle: today's date in French format (e.g., "mardi 31 mars 2026").
- **Today's agenda card**: 
  - "🆕 X new words to learn" (or "✅ Today's learning complete" if done)
  - "🔄 X words to review today" (grouped by stage: tomorrow reviews, week reviews, etc.)
  - Both are clickable, linking to `/learn` and `/review`
- **Streak counter**: How many consecutive days the user has completed a session
- **Overall progress bar**: X / 2100 total items learned (2000 words + 100 fillers)
- **Recent activity**: Last 5 days' sessions in a minimal timeline

**Data needed** (fetch via server component):
- Count of unlearned words remaining
- Count of reviews due today (`nextReviewAt <= today AND completedAt IS NULL`)
- Current streak (consecutive days with a DailySession)
- Total mastered count

### 2. LEARN (`/learn`)

Daily session where the user learns 10 new words.

**Flow:**
1. User arrives → sees "Today's Lesson" with count indicator (1/10)
2. One word at a time, displayed as a card:
   - French word in large display font (48px+)
   - Word type badge: "Mot" or "Expression"
   - Tap/click to reveal English translation (card flip animation)
   - For fillers: show category + usage hint below translation
   - "Got it" button to advance to next word
3. After all 10 → success screen: "Bien joué! See you tomorrow for review."
4. Creates Review records with `stage: LEARNED_TODAY` and `nextReviewAt: tomorrow`

**Word selection logic:**
- Pull from the pool in frequency rank order (most common first for words)
- Fillers can be mixed in — e.g., every 3rd session, include 2-3 fillers instead of words
- Skip words that already have a Review record (already in the system)
- Allow user to choose: "Words only", "Fillers only", or "Mix" via a toggle at top

**User can also manually add any word to today's session** — a search/browse feature at bottom of the page. This covers requirement #5 (re-adding forgotten words manually).

### 3. REVIEW (`/review`)

Flashcard review interface for due words.

**Flow:**
1. Fetch all Reviews where `nextReviewAt <= today AND completedAt IS NULL`
2. Group and label by stage ("Tomorrow Review", "Week Review", "Two-Week Review", "Month Review")
3. Show one card at a time:
   - French word displayed prominently
   - User tries to recall the English meaning
   - Tap to reveal
   - Two buttons: **"Je me souviens" (I remember)** ✓ and **"J'ai oublié" (I forgot)** ✗
4. **If remembered**: advance stage, calculate next `nextReviewAt`, mark `completedAt = now`, `remembered = true`
5. **If forgotten**: mark `remembered = false`, `completedAt = now`, then create a NEW Review record for this word with `stage: LEARNED_TODAY`, `learnedDate: today`, `nextReviewAt: tomorrow` (full reset)
6. After all reviews done → summary card:
   - "X remembered, Y forgotten"
   - "Y words added back to tomorrow's review"
   - Link back to dashboard

**UI details:**
- Progress bar at top showing X/total reviewed
- Current stage badge on each card (color-coded)
- Swipe gestures on mobile: swipe right = remember, swipe left = forgot (optional enhancement)

### 4. PROGRESS (`/progress`)

Analytics and progress visualization.

**Sections:**
- **Mastery overview**: Donut/ring chart showing distribution across stages (LEARNED_TODAY through MASTERED)
- **Calendar heatmap**: GitHub-style grid showing activity per day (last 90 days). Color intensity = words reviewed.
- **Statistics grid**: 
  - Total words mastered
  - Total words in progress
  - Words remaining (unlearned)
  - Current streak
  - Longest streak
  - Average retention rate (remembered / total reviews)
- **Word list browser**: Searchable, filterable table of all 2100 items. Columns: French, English, Type, Current Stage, Last Reviewed. Filter by stage, type, search by French/English text.

---

## SERVER ACTIONS (`lib/actions.ts`)

Implement these as Next.js Server Actions (`"use server"`):

```typescript
// Start a daily learning session — returns 10 unlearned words
async function getNewWordsForToday(mode: 'WORD' | 'FILLER' | 'MIX'): Promise<Word[]>

// Mark a word as learned today — creates Review record
async function markAsLearned(wordId: string): Promise<Review>

// Process a review response
async function submitReview(reviewId: string, remembered: boolean): Promise<Review>

// Manually add a word to today's learning queue
async function addWordToTodayQueue(wordId: string): Promise<Review>

// Get all reviews due today
async function getDueReviews(): Promise<(Review & { word: Word })[]>

// Get dashboard stats
async function getDashboardStats(): Promise<DashboardStats>

// Get progress data
async function getProgressData(): Promise<ProgressData>

// Seed the database from source files
async function seedDatabase(): Promise<{ words: number, fillers: number }>
```

---

## SEED SCRIPT

Create `prisma/seed.ts` that:
1. Reads both `.txt` files from a `data/` directory in the project root
2. Parses the 2000 words (skip header lines, parse `RANK | FRENCH | ENGLISH`)
3. Parses the 100 fillers (extract number, french, english, category, hint)
4. Upserts all 2100 records into the Word table
5. Configure in `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`

Copy both data files into `data/2000_most_common_french_words.txt` and `data/100_french_conversation_fillers.txt` in the project.

---

## IMPLEMENTATION RULES

### Code Quality
- **Zero `any` types.** Everything typed.
- **Server Components by default.** Only add `"use client"` for interactive elements (card flip, buttons, filters).
- **Colocate client interactivity.** Extract small client components (e.g., `FlashCard`, `ReviewButtons`, `FilterToggle`). Keep pages as server components that fetch data and pass it down.
- **Server Actions for mutations.** No API routes for CRUD. Use `"use server"` actions called from client components via `useTransition` or form actions.
- **Error handling**: Every server action wrapped in try/catch. Return `{ success: boolean, error?: string, data?: T }` pattern.
- **Loading states**: Use `Suspense` boundaries with skeleton components. Use `useTransition` for action pending states.
- **Date handling**: Use `date-fns` for all date math. Store dates as UTC. Display in user's local timezone.

### Prisma Best Practices
- Singleton pattern in `lib/prisma.ts` (with dev hot-reload guard)
- Use `prisma.$transaction` for operations that must be atomic (e.g., marking review + creating new review on forget)
- Add `"postinstall": "prisma generate"` to `package.json`
- Create a `prisma/migrations` folder — use `prisma migrate dev` locally, `prisma migrate deploy` in production

### Component Architecture
- Use shadcn/ui `Card`, `Button`, `Badge`, `Progress`, `Table`, `Input`, `Tabs` components
- Install only what's needed: `npx shadcn@latest add card button badge progress table input tabs`
- Custom components: `FlashCard`, `ReviewCard`, `StageProgress`, `CalendarHeatmap`, `WordBrowser`

### Performance
- Static generation where possible (progress page can be dynamic)
- `revalidatePath('/')` after mutations to refresh dashboard
- Minimize client-side JS — most of the app should work without JS (progressive enhancement)

---

## FILE STRUCTURE — COMPLETE

```
un-truc-de-ouf/
├── .env                          # DATABASE_URL
├── .env.example
├── package.json
├── pnpm-lock.yaml
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── data/
│   ├── 2000_most_common_french_words.txt
│   └── 100_french_conversation_fillers.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard
│   │   ├── globals.css
│   │   ├── learn/
│   │   │   └── page.tsx
│   │   ├── review/
│   │   │   └── page.tsx
│   │   └── progress/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── flash-card.tsx        # Flip card (client component)
│   │   ├── review-card.tsx       # Review interface (client component)
│   │   ├── learn-session.tsx     # Learning flow (client component)
│   │   ├── stage-badge.tsx       # Color-coded stage indicator
│   │   ├── nav.tsx               # Bottom navigation bar
│   │   ├── stats-grid.tsx        # Dashboard stats
│   │   ├── calendar-heatmap.tsx  # Activity heatmap (client component)
│   │   ├── word-browser.tsx      # Searchable word table (client component)
│   │   └── progress-ring.tsx     # Donut chart (client component)
│   └── lib/
│       ├── prisma.ts
│       ├── actions.ts
│       ├── queries.ts
│       ├── constants.ts
│       └── utils.ts
```

---

## NAVIGATION

Bottom navigation bar (mobile-app style, fixed to bottom on mobile):
- **Accueil** (Home icon) → `/`
- **Apprendre** (BookOpen icon) → `/learn`  
- **Réviser** (RotateCcw icon) → `/review`
- **Progrès** (BarChart3 icon) → `/progress`

Active state: accent color + filled icon. Inactive: muted gray.
On desktop (768px+): convert to a minimal left sidebar or top nav.

---

## DEPLOYMENT CHECKLIST

1. Push to GitHub
2. Connect repo to Vercel
3. In Vercel dashboard → Storage → Add Prisma Postgres (free tier)
4. Connect database to project (auto-sets `DATABASE_URL`)
5. Add `"postinstall": "prisma generate"` to package.json
6. Add build command override if needed: `prisma migrate deploy && next build`
7. Deploy

---

## EXECUTION ORDER

Build the app in this exact order:

1. **Scaffold**: `pnpm create next-app@latest un-truc-de-ouf --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` then `cd un-truc-de-ouf`
2. **Install deps**: `pnpm add prisma @prisma/client date-fns` and `pnpm add -D tsx`
3. **Setup Prisma**: `npx prisma init` → paste schema → `npx prisma migrate dev --name init`
4. **Setup shadcn**: `npx shadcn@latest init` → add components
5. **Copy data files** into `data/`
6. **Build seed script** → run `npx prisma db seed`
7. **Build lib/** (prisma.ts, constants.ts, utils.ts, queries.ts, actions.ts)
8. **Build layout + nav** (fonts, global styles, navigation)
9. **Build Dashboard** (`/`)
10. **Build Learn** (`/learn`)
11. **Build Review** (`/review`)
12. **Build Progress** (`/progress`)
13. **Polish**: animations, loading states, error boundaries, responsive refinements
14. **Test locally**: full flow — learn 10 words, verify review schedule, test forget flow

---

## CRITICAL BEHAVIORS TO TEST

- [ ] Learning 10 words creates 10 Review records with correct dates
- [ ] Reviews due tomorrow show up the next day
- [ ] Forgetting a word at any stage resets it to LEARNED_TODAY with new dates
- [ ] A word can only be learned once (no duplicates in Review for same learning cycle)
- [ ] Manual "add to today" works from progress/word browser
- [ ] Dashboard counts are accurate
- [ ] Streak calculation handles gaps correctly (missed day = streak reset)
- [ ] Words are served in frequency order (rank 1 first, then 2, etc.)
- [ ] The app is usable and beautiful on a 390px wide iPhone screen
