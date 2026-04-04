'use client';

import { useState, useTransition } from 'react';
import { Word } from '@prisma/client';
import { FlashCard } from './flash-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { markAsLearned } from '@/lib/actions';
import { CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LearnSessionProps {
  words: Word[];
}

export function LearnSession({ words }: LearnSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  const handleNext = () => {
    // Mark current word as learned
    startTransition(async () => {
      await markAsLearned(currentWord.id);

      if (currentIndex < words.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsCompleted(true);
      }
    });
  };

  if (words.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            Aucun mot à apprendre pour le moment.
          </p>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="mt-4"
          >
            Retour au tableau de bord
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isCompleted) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-16 text-center">
          <CheckCircle2 className="mx-auto mb-6 h-16 w-16 text-green-600" />
          <h2 className="mb-4 font-serif text-4xl text-foreground">
            Bien joué!
          </h2>
          <p className="mb-2 text-lg text-muted-foreground">
            Vous avez appris {words.length} nouveaux mots aujourd&apos;hui.
          </p>
          <p className="mb-8 text-sm text-muted-foreground">
            Rendez-vous demain pour les réviser!
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/')} variant="outline">
              Tableau de bord
            </Button>
            <Button onClick={() => router.push('/review')}>
              Commencer les révisions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Safety check: ensure currentWord exists
  if (!currentWord) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            Chargement du mot...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            Mot {currentIndex + 1} sur {words.length}
          </span>
          <span className="font-medium text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flash card */}
      <div className="mb-8">
        <FlashCard word={currentWord} onCorrect={handleNext} />
      </div>

      {/* Helper text */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Tapez la traduction pour mieux mémoriser
      </p>
    </div>
  );
}
