import { ReviewStage } from '@prisma/client';

// Spaced repetition intervals (in days)
export const REVIEW_INTERVALS: Record<ReviewStage, number> = {
  LEARNED_TODAY: 0,       // Same day
  REVIEW_TOMORROW: 1,     // After 1 day
  REVIEW_WEEK: 7,         // After 7 days
  REVIEW_TWO_WEEKS: 14,   // After 14 days
  REVIEW_MONTH: 30,       // After 30 days
  MASTERED: Infinity,     // Completed
};

// Stage progression map
export const NEXT_STAGE: Record<ReviewStage, ReviewStage> = {
  LEARNED_TODAY: 'REVIEW_TOMORROW',
  REVIEW_TOMORROW: 'REVIEW_WEEK',
  REVIEW_WEEK: 'REVIEW_TWO_WEEKS',
  REVIEW_TWO_WEEKS: 'REVIEW_MONTH',
  REVIEW_MONTH: 'MASTERED',
  MASTERED: 'MASTERED',
};

// Stage display names
export const STAGE_LABELS: Record<ReviewStage, string> = {
  LEARNED_TODAY: 'Appris aujourd\'hui',
  REVIEW_TOMORROW: 'Révision demain',
  REVIEW_WEEK: 'Révision semaine',
  REVIEW_TWO_WEEKS: 'Révision deux semaines',
  REVIEW_MONTH: 'Révision mois',
  MASTERED: 'Maîtrisé',
};

// Stage colors for badges
export const STAGE_COLORS: Record<ReviewStage, string> = {
  LEARNED_TODAY: 'bg-blue-100 text-blue-800',
  REVIEW_TOMORROW: 'bg-yellow-100 text-yellow-800',
  REVIEW_WEEK: 'bg-orange-100 text-orange-800',
  REVIEW_TWO_WEEKS: 'bg-purple-100 text-purple-800',
  REVIEW_MONTH: 'bg-pink-100 text-pink-800',
  MASTERED: 'bg-green-100 text-green-800',
};

// App configuration
export const WORDS_PER_SESSION = 10;
export const TOTAL_VOCABULARY_COUNT = 2100; // 2000 words + 100 fillers
