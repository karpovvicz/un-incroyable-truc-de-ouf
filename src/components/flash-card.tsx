'use client';

import { useState, FormEvent } from 'react';
import { Word, WordType } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface FlashCardProps {
  word: Word;
  onCorrect: () => void;
}

// Simple function to check if answer is close enough (removes punctuation, case insensitive)
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
}

function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const normalized = normalizeText(userAnswer);
  const correct = normalizeText(correctAnswer);

  // Check if they match exactly or if user answer contains the correct answer
  return normalized === correct || correct.includes(normalized) || normalized.includes(correct);
}

export function FlashCard({ word, onCorrect }: FlashCardProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!userAnswer.trim()) return;

    const correct = isAnswerCorrect(userAnswer, word.english);
    setIsCorrect(correct);
    setIsSubmitted(true);
  };

  const handleContinue = () => {
    onCorrect();
    // Reset for next word
    setUserAnswer('');
    setIsSubmitted(false);
    setIsCorrect(null);
  };

  return (
    <div className="relative h-[500px] w-full md:h-[550px]">
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-white p-8 shadow-lg">
        <Badge
          variant="outline"
          className="mb-6 text-sm font-medium text-muted-foreground"
        >
          {word.type === WordType.WORD ? 'Mot' : 'Expression'}
          {word.rank && ` · Rang ${word.rank}`}
        </Badge>

        <h2 className="mb-8 font-serif text-5xl text-foreground md:text-7xl">
          {word.french}
        </h2>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
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
              onClick={() => {
                setIsSubmitted(true);
                setIsCorrect(false);
              }}
            >
              Je ne sais pas - Révéler la réponse
            </Button>
          </form>
        ) : (
          <div className="w-full max-w-md space-y-6 text-center">
            {/* Show result */}
            <div
              className={cn(
                'rounded-lg p-6',
                isCorrect
                  ? 'bg-green-50 border-2 border-green-200'
                  : 'bg-red-50 border-2 border-red-200'
              )}
            >
              <div className="mb-4 flex items-center justify-center gap-2">
                {isCorrect ? (
                  <>
                    <Check className="h-8 w-8 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">Correct!</span>
                  </>
                ) : (
                  <>
                    <X className="h-8 w-8 text-red-600" />
                    <span className="text-2xl font-bold text-red-600">
                      {userAnswer ? 'Pas tout à fait' : 'Réponse'}
                    </span>
                  </>
                )}
              </div>

              {userAnswer && (
                <p className="mb-2 text-sm text-muted-foreground">
                  Votre réponse: <span className="font-medium">{userAnswer}</span>
                </p>
              )}

              <p className="text-xl font-medium text-foreground">
                Traduction correcte: <span className="text-primary">{word.english}</span>
              </p>

              {word.type === WordType.FILLER && word.category && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Catégorie: {word.category}
                </p>
              )}

              {word.hint && (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  {word.hint}
                </p>
              )}
            </div>

            <Button onClick={handleContinue} size="lg" className="w-full">
              Continuer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
