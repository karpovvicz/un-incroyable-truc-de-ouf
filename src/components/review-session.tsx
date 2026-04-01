'use client';

import { useState, useTransition } from 'react';
import { Word, Review } from '@prisma/client';
import { ReviewCard } from './review-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { submitReview } from '@/lib/actions';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReviewSessionProps {
  reviews: Array<Review & { word: Word }>;
}

export function ReviewSession({ reviews }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState({ remembered: 0, forgotten: 0 });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const currentReview = reviews[currentIndex];
  const progress = ((currentIndex + 1) / reviews.length) * 100;

  const handleSubmit = (remembered: boolean) => {
    startTransition(async () => {
      await submitReview(currentReview.id, remembered);

      // Update stats
      if (remembered) {
        setStats((prev) => ({ ...prev, remembered: prev.remembered + 1 }));
      } else {
        setStats((prev) => ({ ...prev, forgotten: prev.forgotten + 1 }));
      }

      // Move to next or complete
      if (currentIndex < reviews.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsCompleted(true);
      }
    });
  };

  if (reviews.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-16 text-center">
          <p className="text-lg text-muted-foreground">
            Aucune révision pour aujourd&apos;hui!
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Revenez demain ou apprenez de nouveaux mots.
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
          <div className="mb-6 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <span className="text-3xl font-bold text-green-600">
                {stats.remembered}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-8 w-8 text-red-600" />
              <span className="text-3xl font-bold text-red-600">
                {stats.forgotten}
              </span>
            </div>
          </div>

          <h2 className="mb-4 font-serif text-4xl text-foreground">
            Session terminée!
          </h2>

          <p className="mb-2 text-lg text-muted-foreground">
            Vous avez révisé {reviews.length} mots.
          </p>

          {stats.forgotten > 0 && (
            <p className="mb-8 text-sm text-muted-foreground">
              {stats.forgotten} {stats.forgotten === 1 ? 'mot' : 'mots'}{' '}
              {stats.forgotten === 1 ? 'ajouté' : 'ajoutés'} aux révisions de
              demain.
            </p>
          )}

          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/')} variant="outline">
              Tableau de bord
            </Button>
            <Button onClick={() => router.push('/learn')}>
              Apprendre de nouveaux mots
            </Button>
          </div>
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
            Révision {currentIndex + 1} sur {reviews.length}
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              {stats.remembered}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="h-4 w-4" />
              {stats.forgotten}
            </span>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Review card */}
      <ReviewCard
        review={currentReview}
        onSubmit={handleSubmit}
        isPending={isPending}
      />
    </div>
  );
}
