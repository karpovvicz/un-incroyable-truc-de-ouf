import { getNewWordsForToday } from '@/lib/actions';
import { LearnSession } from '@/components/learn-session';

export default async function LearnPage() {
  const result = await getNewWordsForToday('WORD');

  if (!result.success || !result.data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="mb-8 text-center font-serif text-4xl text-foreground md:text-5xl">
          Erreur
        </h1>
        <p className="text-center text-muted-foreground">
          {result.error || 'Impossible de charger les mots'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="mb-12 text-center font-serif text-4xl text-foreground md:text-5xl">
        Leçon du jour
      </h1>

      <LearnSession words={result.data} />
    </main>
  );
}
