import prisma from './prisma';
import { WordType, ReviewStage } from '@prisma/client';
import { getToday } from './utils';
import { TOTAL_VOCABULARY_COUNT } from './constants';

export interface DashboardStats {
  unlearnedCount: number;
  dueReviewsCount: number;
  currentStreak: number;
  masteredCount: number;
  totalLearned: number;
  recentSessions: Array<{
    date: Date;
    wordsLearned: number;
    wordsReviewed: number;
    wordsRemembered: number;
    wordsForgotten: number;
  }>;
}

export interface ProgressData {
  stageDistribution: Record<ReviewStage, number>;
  totalMastered: number;
  totalInProgress: number;
  totalRemaining: number;
  currentStreak: number;
  longestStreak: number;
  averageRetentionRate: number;
  recentActivity: Array<{
    date: Date;
    count: number;
  }>;
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  const today = getToday();

  // Count unlearned words (words not in any review)
  const totalWords = await prisma.word.count();
  const learnedWords = await prisma.review.groupBy({
    by: ['wordId'],
  });
  const unlearnedCount = totalWords - learnedWords.length;

  // Count reviews due today or earlier that haven't been completed
  const dueReviewsCount = await prisma.review.count({
    where: {
      nextReviewAt: {
        lte: today,
      },
      completedAt: null,
    },
  });

  // Count mastered words
  const masteredCount = await prisma.review.count({
    where: {
      stage: ReviewStage.MASTERED,
    },
  });

  // Get recent sessions (last 5 days)
  const recentSessions = await prisma.dailySession.findMany({
    orderBy: {
      date: 'desc',
    },
    take: 5,
  });

  // Calculate current streak
  const allSessions = await prisma.dailySession.findMany({
    orderBy: {
      date: 'desc',
    },
  });

  let currentStreak = 0;
  const todayDate = getToday();

  for (let i = 0; i < allSessions.length; i++) {
    const expectedDate = new Date(todayDate);
    expectedDate.setDate(expectedDate.getDate() - i);

    const sessionDate = new Date(allSessions[i].date);

    if (
      sessionDate.getFullYear() === expectedDate.getFullYear() &&
      sessionDate.getMonth() === expectedDate.getMonth() &&
      sessionDate.getDate() === expectedDate.getDate()
    ) {
      currentStreak++;
    } else {
      break;
    }
  }

  return {
    unlearnedCount,
    dueReviewsCount,
    currentStreak,
    masteredCount,
    totalLearned: learnedWords.length,
    recentSessions,
  };
}

// Get progress data for the progress page
export async function getProgressData(): Promise<ProgressData> {
  // Get stage distribution
  const reviews = await prisma.review.findMany({
    select: {
      stage: true,
      remembered: true,
    },
  });

  const stageDistribution: Record<ReviewStage, number> = {
    LEARNED_TODAY: 0,
    REVIEW_TOMORROW: 0,
    REVIEW_WEEK: 0,
    REVIEW_TWO_WEEKS: 0,
    REVIEW_MONTH: 0,
    MASTERED: 0,
  };

  reviews.forEach((review) => {
    stageDistribution[review.stage]++;
  });

  const totalMastered = stageDistribution.MASTERED;
  const totalInProgress = reviews.length - totalMastered;
  const totalRemaining = TOTAL_VOCABULARY_COUNT - reviews.length;

  // Calculate streaks
  const allSessions = await prisma.dailySession.findMany({
    orderBy: {
      date: 'desc',
    },
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const todayDate = getToday();

  for (let i = 0; i < allSessions.length; i++) {
    const expectedDate = new Date(todayDate);
    expectedDate.setDate(expectedDate.getDate() - i);

    const sessionDate = new Date(allSessions[i].date);

    if (
      sessionDate.getFullYear() === expectedDate.getFullYear() &&
      sessionDate.getMonth() === expectedDate.getMonth() &&
      sessionDate.getDate() === expectedDate.getDate()
    ) {
      currentStreak++;
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Calculate average retention rate
  const completedReviews = reviews.filter((r) => r.remembered !== null);
  const rememberedCount = completedReviews.filter((r) => r.remembered === true).length;
  const averageRetentionRate = completedReviews.length > 0
    ? (rememberedCount / completedReviews.length) * 100
    : 0;

  // Get recent activity (last 90 days)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const recentActivity = await prisma.dailySession.findMany({
    where: {
      date: {
        gte: ninetyDaysAgo,
      },
    },
    select: {
      date: true,
      wordsReviewed: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  return {
    stageDistribution,
    totalMastered,
    totalInProgress,
    totalRemaining,
    currentStreak,
    longestStreak,
    averageRetentionRate,
    recentActivity: recentActivity.map((s) => ({
      date: s.date,
      count: s.wordsReviewed,
    })),
  };
}

// Get all words with their current review status (for word browser)
export async function getAllWordsWithStatus() {
  const words = await prisma.word.findMany({
    include: {
      reviews: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: [
      { type: 'asc' },
      { rank: 'asc' },
    ],
  });

  return words.map((word) => ({
    ...word,
    currentReview: word.reviews[0] || null,
  }));
}
