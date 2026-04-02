-- CreateEnum
CREATE TYPE "WordType" AS ENUM ('WORD', 'FILLER');

-- CreateEnum
CREATE TYPE "ReviewStage" AS ENUM ('LEARNED_TODAY', 'REVIEW_TOMORROW', 'REVIEW_WEEK', 'REVIEW_TWO_WEEKS', 'REVIEW_MONTH', 'MASTERED');

-- CreateTable
CREATE TABLE "Word" (
    "id" TEXT NOT NULL,
    "french" TEXT NOT NULL,
    "english" TEXT NOT NULL,
    "rank" INTEGER,
    "type" "WordType" NOT NULL,
    "category" TEXT,
    "hint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "learnedDate" DATE NOT NULL,
    "stage" "ReviewStage" NOT NULL DEFAULT 'LEARNED_TODAY',
    "nextReviewAt" DATE NOT NULL,
    "completedAt" TIMESTAMP(3),
    "remembered" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySession" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "wordsLearned" INTEGER NOT NULL DEFAULT 0,
    "wordsReviewed" INTEGER NOT NULL DEFAULT 0,
    "wordsRemembered" INTEGER NOT NULL DEFAULT 0,
    "wordsForgotten" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Word_french_type_key" ON "Word"("french", "type");

-- CreateIndex
CREATE INDEX "Review_nextReviewAt_idx" ON "Review"("nextReviewAt");

-- CreateIndex
CREATE INDEX "Review_stage_idx" ON "Review"("stage");

-- CreateIndex
CREATE INDEX "Review_wordId_idx" ON "Review"("wordId");

-- CreateIndex
CREATE UNIQUE INDEX "DailySession_date_key" ON "DailySession"("date");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
