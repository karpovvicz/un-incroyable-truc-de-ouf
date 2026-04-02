import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getProgressData, getAllWordsWithStatus } from '@/lib/queries';
import { STAGE_LABELS, STAGE_COLORS, TOTAL_VOCABULARY_COUNT } from '@/lib/constants';
import { ReviewStage } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const [progressData, allWords] = await Promise.all([
    getProgressData(),
    getAllWordsWithStatus(),
  ]);

  const retentionRate = progressData.averageRetentionRate.toFixed(1);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="mb-12 text-center font-serif text-4xl text-foreground md:text-5xl">
        Votre Progrès
      </h1>

      {/* Statistics Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mots maîtrisés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {progressData.totalMastered}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              sur {TOTAL_VOCABULARY_COUNT}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {progressData.totalInProgress}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mots en apprentissage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Série actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gold">
              {progressData.currentStreak}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              jours (record: {progressData.longestStreak})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de rétention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {retentionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              mots mémorisés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stage Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Distribution par étape</CardTitle>
          <CardDescription>
            Répartition de vos mots selon leur niveau de maîtrise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(progressData.stageDistribution).map(([stage, count]) => {
              const stageKey = stage as ReviewStage;
              const percentage =
                progressData.totalInProgress + progressData.totalMastered > 0
                  ? (count /
                      (progressData.totalInProgress + progressData.totalMastered)) *
                    100
                  : 0;

              return (
                <div key={stage} className="flex items-center gap-4">
                  <Badge className={STAGE_COLORS[stageKey]}>
                    {STAGE_LABELS[stageKey]}
                  </Badge>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{count} mots</span>
                      <span className="text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Word Browser */}
      <Card>
        <CardHeader>
          <CardTitle>Tous les mots</CardTitle>
          <CardDescription>
            {allWords.length} mots au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Français
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Anglais
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="pb-3 text-left text-sm font-medium text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {allWords.slice(0, 100).map((word) => (
                  <tr key={word.id} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{word.french}</td>
                    <td className="py-3 text-muted-foreground">{word.english}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">
                        {word.type}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {word.currentReview ? (
                        <Badge className={STAGE_COLORS[word.currentReview.stage]}>
                          {STAGE_LABELS[word.currentReview.stage]}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Non appris</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allWords.length > 100 && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Affichage de 100 mots sur {allWords.length}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
