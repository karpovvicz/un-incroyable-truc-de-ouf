import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsGrid } from '@/components/stats-grid';
import { getDashboardStats } from '@/lib/queries';
import { formatDateFrench, formatDateShort } from '@/lib/utils';
import { BookOpen, RotateCcw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const stats = await getDashboardStats();
  const today = new Date();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-2 font-serif text-5xl md:text-6xl text-foreground">
          Un Truc de Ouf Incroyable!
        </h1>
        <p className="text-lg text-muted-foreground capitalize">
          {formatDateFrench(today)}
        </p>
      </div>

      {/* Today's Agenda */}
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Link href="/learn" className="group block transition-transform hover:scale-[1.02]">
          <Card className="h-full border-2 transition-colors hover:border-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {stats.unlearnedCount > 0 ? (
                      <>Apprendre aujourd&apos;hui</>
                    ) : (
                      <>Apprentissage terminé</>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {stats.unlearnedCount > 0 ? (
                      <>{stats.unlearnedCount} nouveaux mots disponibles</>
                    ) : (
                      <>Vous avez tout appris! 🎉</>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {stats.unlearnedCount > 0 && (
              <CardContent>
                <Button className="w-full" size="lg">
                  Commencer la leçon
                </Button>
              </CardContent>
            )}
          </Card>
        </Link>

        <Link href="/review" className="group block transition-transform hover:scale-[1.02]">
          <Card className="h-full border-2 transition-colors hover:border-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-burgundy/10 p-3">
                  <RotateCcw className="h-6 w-6 text-burgundy" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {stats.dueReviewsCount > 0 ? (
                      <>Réviser aujourd&apos;hui</>
                    ) : (
                      <>Aucune révision</>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {stats.dueReviewsCount > 0 ? (
                      <>{stats.dueReviewsCount} mots à réviser</>
                    ) : (
                      <>Tout est à jour! 👍</>
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            {stats.dueReviewsCount > 0 && (
              <CardContent>
                <Button className="w-full" variant="outline" size="lg">
                  Commencer les révisions
                </Button>
              </CardContent>
            )}
          </Card>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-8">
        <StatsGrid
          unlearnedCount={stats.unlearnedCount}
          dueReviewsCount={stats.dueReviewsCount}
          currentStreak={stats.currentStreak}
          masteredCount={stats.masteredCount}
          totalLearned={stats.totalLearned}
        />
      </div>

      {/* Recent Activity */}
      {stats.recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Vos 5 dernières sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSessions.map((session) => (
                <div
                  key={session.date.toString()}
                  className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {formatDateShort(session.date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.wordsLearned > 0 && (
                        <span>{session.wordsLearned} appris · </span>
                      )}
                      {session.wordsReviewed > 0 && (
                        <span>{session.wordsReviewed} révisés</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    {session.wordsRemembered > 0 && (
                      <span className="text-green-600">
                        ✓ {session.wordsRemembered}
                      </span>
                    )}
                    {session.wordsForgotten > 0 && (
                      <span className="text-red-600">
                        ✗ {session.wordsForgotten}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
