# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**"Un Truc de Ouf Incroyable"** is a French vocabulary spaced-repetition learning app. Single-user, no authentication. Learn 10 words per day, review based on spaced repetition intervals.

**Tech Stack:**
- Next.js 15+ (App Router, Server Components, Server Actions)
- TypeScript (strict mode)
- Prisma ORM with PostgreSQL (Prisma Postgres via Vercel)
- shadcn/ui + Tailwind CSS 4
- pnpm package manager

## Common Commands

### Development
```bash
pnpm dev              # Start dev server with Turbopack
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Database
```bash
npx prisma generate                    # Generate Prisma Client
npx prisma migrate dev --name <name>   # Create and apply migration
npx prisma migrate deploy              # Apply migrations (production)
npx prisma db seed                     # Seed database from data/*.txt files
npx prisma studio                      # Open Prisma Studio GUI
```

## High-Level Architecture

### Spaced Repetition System

The core learning algorithm uses a 5-stage progression:
1. **LEARNED_TODAY** (Stage 0) - Just learned, review tomorrow
2. **REVIEW_TOMORROW** (Stage 1) - Review after 1 day
3. **REVIEW_WEEK** (Stage 2) - Review after 7 days
4. **REVIEW_TWO_WEEKS** (Stage 3) - Review after 14 days
5. **REVIEW_MONTH** (Stage 4) - Review after 30 days
6. **MASTERED** (Stage 5) - Completed

**Critical behavior:** If a user forgets a word at ANY stage, it resets completely. The old Review is marked as `remembered: false` and a NEW Review is created with `stage: LEARNED_TODAY`, `learnedDate: today`, `nextReviewAt: tomorrow`. This is implemented as a transaction in `src/lib/actions.ts:submitReview()`.

### Data Model

- **Word** - Master vocabulary pool (2000 words + 100 fillers)
- **Review** - Each learning instance of a word (tracks stage, dates, completion)
- **DailySession** - Aggregated daily stats (words learned, reviewed, remembered, forgotten)

Key relationships:
- One Word can have multiple Reviews (when forgotten and relearned)
- Each Review belongs to one Word
- Reviews track progression through stages via `learnedDate` + stage intervals

### Server Actions Pattern

All mutations happen via Next.js Server Actions in `src/lib/actions.ts`:
- `getNewWordsForToday(mode)` - Get 10 unlearned words
- `markAsLearned(wordId)` - Create Review for newly learned word
- `submitReview(reviewId, remembered)` - Process review result (advance or reset)
- `addWordToTodayQueue(wordId)` - Manually add word to learning queue
- `getDueReviews()` - Fetch reviews due today

All actions return `ActionResponse<T>` with `{ success, data?, error? }` pattern.

Queries are in `src/lib/queries.ts` and are called from Server Components.

### Date Handling

Dates are normalized to midnight UTC using `getToday()` in `src/lib/utils.ts`. All date comparisons use this normalized date. Review intervals are calculated from `learnedDate` (the date the current Review was created), NOT from the original word's first learn date.

**Important:** When advancing stages, `nextReviewAt` is calculated as `learnedDate + REVIEW_INTERVALS[nextStage]`, where `learnedDate` remains the date when this Review cycle started.

### File Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with fonts, nav
│   ├── page.tsx             # Dashboard (Server Component)
│   ├── learn/page.tsx       # Daily learning session
│   ├── review/page.tsx      # Review flashcards
│   └── progress/page.tsx    # Stats and word browser
├── components/
│   ├── ui/                  # shadcn components
│   ├── flash-card.tsx       # Client component for card flip
│   ├── review-card.tsx      # Client component for review UI
│   ├── learn-session.tsx    # Client component for learning flow
│   └── nav.tsx              # Bottom navigation
└── lib/
    ├── prisma.ts            # Singleton Prisma client
    ├── actions.ts           # Server Actions (mutations)
    ├── queries.ts           # Data fetching (for Server Components)
    ├── constants.ts         # Review intervals, stage maps
    └── utils.ts             # Date helpers
```

### Component Pattern

- **Pages are Server Components** - Fetch data via queries, pass to client components
- **Interactive components use `"use client"`** - Card flips, form submissions
- **Server Actions** - Called from client components via `useTransition` or form actions
- **Revalidation** - `revalidatePath('/')` after mutations to refresh dashboard

### Design Philosophy

"BMW × Apple × Hermès" - Quiet luxury, editorial minimalism. Warm ivory background (`#FEFCF8`), deep near-black text, French blue or burgundy accent. Large serif headings, clean sans-serif body. See `claude-code-prompt.md` for full design spec.

## Database Seeding

Seed data comes from two files in `data/`:
- `2000_most_common_french_words.txt` - Format: `RANK | FRENCH | ENGLISH`
- `100_french_conversation_fillers.txt` - Numbered entries with categories

Seed script: `prisma/seed.ts` parses these files and upserts into Word table.

## Important Constraints

- Zero `any` types - Everything must be typed
- Server Components by default - Only add `"use client"` when needed
- All DB mutations via Server Actions - No API routes
- Error handling - All actions wrapped in try/catch
- Use `date-fns` for all date operations
- Transactions for atomic operations (see `submitReview` forgot logic)