import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TOTAL_VOCABULARY_COUNT } from '@/lib/constants';

interface StatsGridProps {
  unlearnedCount: number;
  dueReviewsCount: number;
  currentStreak: number;
  masteredCount: number;
  totalLearned: number;
}

export function StatsGrid({
  unlearnedCount,
  dueReviewsCount,
  currentStreak,
  masteredCount,
  totalLearned,
}: StatsGridProps) {
  const progress = (totalLearned / TOTAL_VOCABULARY_COUNT) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Nouveaux mots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {unlearnedCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            mots à apprendre
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Révisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {dueReviewsCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            à réviser aujourd&apos;hui
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Série
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gold">
            {currentStreak}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            jours consécutifs
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Maîtrisés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {masteredCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            mots complétés
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Progrès global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {totalLearned} / {TOTAL_VOCABULARY_COUNT} mots appris ({progress.toFixed(1)}%)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
