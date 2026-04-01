'use client';

import { useState, FormEvent } from 'react';
import { Word, Review, WordType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { STAGE_LABELS } from '@/lib/constants';
import { Check, X } from 'lucide-react';

interface ReviewCardProps {
  review: Review & { word: Word };
  onSubmit: (remembered: boolean) => void;
  isPending: boolean;
}

// Simple function to check if answer is close enough
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
}

function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const normalized = normalizeText(userAnswer);
  const correct = normalizeText(correctAnswer);
  return normalized === correct || correct.includes(normalized) || normalized.includes(correct);
}

export function ReviewCard({ review, onSubmit, isPending }: ReviewCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleCheck = (e: FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const correct = isAnswerCorrect(userAnswer, review.word.english);
    setIsCorrect(correct);
    setIsRevealed(true);
  };

  const handleReveal = () => {
    setIsRevealed(true);
    setIsCorrect(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative h-[500px] w-full md:h-[550px]">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-lg">
          <Badge variant="outline" className="mb-6 text-sm font-medium">
            {STAGE_LABELS[review.stage]}
          </Badge>

          <h2 className="mb-8 font-serif text-5xl text-foreground md:text-7xl">
            {review.word.french}
          </h2>

          {review.word.type === WordType.FILLER && !isRevealed && (
            <Badge variant="secondary" className="mb-6">
              Expression
            </Badge>
          )}

          {!isRevealed ? (
            <form onSubmit={handleCheck} className="w-full max-w-md space-y-4">
              <div>
                <label htmlFor="translation" className="mb-2 block text-sm font-medium text-muted-foreground">
                  Tapez la traduction en anglais:
                </label>
                <Input
                  id="translation"
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="text-lg"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Vérifier
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={handleReveal}
              >
                Je ne sais pas - Révéler la réponse
              </Button>
            </form>
          ) : (
            <div className="w-full max-w-md space-y-6">
              {/* Show result */}
              <div
                className={cn(
                  'rounded-lg p-6 text-center',
                  isCorrect
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-orange-50 border-2 border-orange-200'
                )}
              >
                {userAnswer && (
                  <p className="mb-2 text-sm text-muted-foreground">
                    Votre réponse: <span className="font-medium">{userAnswer}</span>
                  </p>
                )}

                <p className="text-xl font-medium text-foreground">
                  Traduction: <span className="text-primary">{review.word.english}</span>
                </p>

                {review.word.type === WordType.FILLER && review.word.category && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Catégorie: {review.word.category}
                  </p>
                )}

                {review.word.hint && (
                  <p className="mt-2 text-sm italic text-muted-foreground">
                    {review.word.hint}
                  </p>
                )}
              </div>

              {/* Review buttons */}
              <p className="text-center text-sm text-muted-foreground">
                Vous souvenez-vous de ce mot?
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={() => onSubmit(false)}
                  disabled={isPending}
                  variant="outline"
                  size="lg"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="mr-2 h-5 w-5" />
                  J&apos;ai oublié
                </Button>
                <Button
                  onClick={() => onSubmit(true)}
                  disabled={isPending}
                  size="lg"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-5 w-5" />
                  Je me souviens
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
