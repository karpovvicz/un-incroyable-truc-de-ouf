'use server';

import prisma from './prisma';
import { WordType, ReviewStage, Word, Review } from '@prisma/client';
import { getToday, addDaysToDate } from './utils';
import { WORDS_PER_SESSION, NEXT_STAGE, REVIEW_INTERVALS } from './constants';
import { revalidatePath } from 'next/cache';

type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type LearningMode = 'WORD' | 'FILLER' | 'MIX';

// Get new words for today's learning session
export async function getNewWordsForToday(
  mode: LearningMode = 'WORD'
): Promise<ActionResponse<Word[]>> {
  try {
    const today = getToday();

    // Get all word IDs that already have reviews
    const existingReviews = await prisma.review.groupBy({
      by: ['wordId'],
    });

    const learnedWordIds = existingReviews.map((r) => r.wordId);

    // Determine word type filter based on mode
    let typeFilter: { type: WordType } | { type: { in: WordType[] } } | {} = {};

    if (mode === 'WORD') {
      typeFilter = { type: WordType.WORD };
    } else if (mode === 'FILLER') {
      typeFilter = { type: WordType.FILLER };
    } // MIX mode: no filter

    // Find unlearned words
    const words = await prisma.word.findMany({
      where: {
        AND: [
          typeFilter,
          {
            id: {
              notIn: learnedWordIds,
            },
          },
        ],
      },
      orderBy: [
        { type: 'asc' }, // Words first, then fillers
        { rank: 'asc' }, // By frequency rank
      ],
      take: WORDS_PER_SESSION,
    });

    return { success: true, data: words };
  } catch (error) {
    console.error('Error fetching new words:', error);
    return { success: false, error: 'Failed to fetch new words' };
  }
}

// Mark a word as learned today
export async function markAsLearned(wordId: string): Promise<ActionResponse<Review>> {
  try {
    const today = getToday();
    const tomorrow = addDaysToDate(today, 1);

    // Create a review record
    const review = await prisma.review.create({
      data: {
        wordId,
        learnedDate: today,
        stage: ReviewStage.LEARNED_TODAY,
        nextReviewAt: tomorrow,
      },
    });

    // Update or create daily session
    await prisma.dailySession.upsert({
      where: {
        date: today,
      },
      update: {
        wordsLearned: {
          increment: 1,
        },
      },
      create: {
        date: today,
        wordsLearned: 1,
      },
    });

    revalidatePath('/');
    revalidatePath('/learn');

    return { success: true, data: review };
  } catch (error) {
    console.error('Error marking word as learned:', error);
    return { success: false, error: 'Failed to mark word as learned' };
  }
}

// Manually add a word to today's learning queue
export async function addWordToTodayQueue(wordId: string): Promise<ActionResponse<Review>> {
  try {
    // Check if this word already has an active review
    const existingReview = await prisma.review.findFirst({
      where: {
        wordId,
        completedAt: null,
      },
    });

    if (existingReview) {
      return {
        success: false,
        error: 'This word is already in your review queue',
      };
    }

    // Create a new review for today
    const result = await markAsLearned(wordId);

    revalidatePath('/');
    revalidatePath('/learn');
    revalidatePath('/progress');

    return result;
  } catch (error) {
    console.error('Error adding word to today queue:', error);
    return { success: false, error: 'Failed to add word to queue' };
  }
}

// Get all reviews due today
export async function getDueReviews(): Promise<ActionResponse<Array<Review & { word: Word }>>> {
  try {
    const today = getToday();

    const reviews = await prisma.review.findMany({
      where: {
        nextReviewAt: {
          lte: today,
        },
        completedAt: null,
      },
      include: {
        word: true,
      },
      orderBy: [
        { stage: 'asc' },
        { nextReviewAt: 'asc' },
      ],
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error('Error fetching due reviews:', error);
    return { success: false, error: 'Failed to fetch due reviews' };
  }
}

// Submit a review response
export async function submitReview(
  reviewId: string,
  remembered: boolean
): Promise<ActionResponse<Review>> {
  try {
    const today = getToday();

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return { success: false, error: 'Review not found' };
    }

    if (remembered) {
      // User remembered - advance to next stage
      const nextStage = NEXT_STAGE[review.stage];
      const daysUntilNext = REVIEW_INTERVALS[nextStage];
      const nextReviewDate = daysUntilNext === Infinity
        ? today
        : addDaysToDate(review.learnedDate, daysUntilNext);

      // Update the review
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          stage: nextStage,
          nextReviewAt: nextReviewDate,
          completedAt: new Date(),
          remembered: true,
        },
      });

      // Update daily session
      await prisma.dailySession.upsert({
        where: { date: today },
        update: {
          wordsReviewed: { increment: 1 },
          wordsRemembered: { increment: 1 },
        },
        create: {
          date: today,
          wordsReviewed: 1,
          wordsRemembered: 1,
        },
      });

      revalidatePath('/');
      revalidatePath('/review');

      return { success: true, data: updatedReview };
    } else {
      // User forgot - reset to LEARNED_TODAY with tomorrow's review
      const tomorrow = addDaysToDate(today, 1);

      // Use a transaction to mark the old review as completed (forgotten)
      // and create a new review starting the cycle over
      const result = await prisma.$transaction(async (tx) => {
        // Mark current review as completed (forgotten)
        await tx.review.update({
          where: { id: reviewId },
          data: {
            completedAt: new Date(),
            remembered: false,
          },
        });

        // Create a new review starting from LEARNED_TODAY
        const newReview = await tx.review.create({
          data: {
            wordId: review.wordId,
            learnedDate: today,
            stage: ReviewStage.LEARNED_TODAY,
            nextReviewAt: tomorrow,
          },
        });

        // Update daily session
        await tx.dailySession.upsert({
          where: { date: today },
          update: {
            wordsReviewed: { increment: 1 },
            wordsForgotten: { increment: 1 },
          },
          create: {
            date: today,
            wordsReviewed: 1,
            wordsForgotten: 1,
          },
        });

        return newReview;
      });

      revalidatePath('/');
      revalidatePath('/review');

      return { success: true, data: result };
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error: 'Failed to submit review' };
  }
}
