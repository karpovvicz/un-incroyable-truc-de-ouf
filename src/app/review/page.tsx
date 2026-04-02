import { getDueReviews } from '@/lib/actions';
import { ReviewSession } from '@/components/review-session';

export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  const result = await getDueReviews();

  if (!result.success || !result.data) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="mb-8 text-center font-serif text-4xl text-foreground md:text-5xl">
          Erreur
        </h1>
        <p className="text-center text-muted-foreground">
          {result.error || 'Impossible de charger les révisions'}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="mb-12 text-center font-serif text-4xl text-foreground md:text-5xl">
        Révisions du jour
      </h1>

      <ReviewSession reviews={result.data} />
    </main>
  );
}
