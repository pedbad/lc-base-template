/**
 * Showcase.tsx — the exercise showcase (dev artifact #2).
 *
 * Renders every entry in SHOWCASE_FIXTURES as an isolated card: a title plus the
 * live engine, resolved through the lazyRegistry. This is where each ported engine
 * is seen and tested in isolation before it is used in a real LO. Cards grow one at
 * a time as engines are ported (Phase B). Empty for now.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import { Suspense } from 'react';
import { getExercise } from '@/exercises/lazyRegistry';
import { SHOWCASE_FIXTURES } from './fixtures';

export default function Showcase() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Exercise Showcase</h1>
        <p className="mt-2 text-muted-foreground">
          Each interactive exercise engine, rendered in isolation for review and testing.
        </p>
      </header>

      {SHOWCASE_FIXTURES.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
          No exercises registered yet. Each engine adds its card here as it is ported.
        </p>
      ) : (
        <section className="flex flex-col gap-10">
          {SHOWCASE_FIXTURES.map((fixture) => {
            const Engine = getExercise(fixture.type);
            return (
              <article key={fixture.id} id={fixture.id} className="rounded-lg border p-6">
                <h2 className="mb-4 text-xl font-semibold">{fixture.title}</h2>
                {Engine ? (
                  <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
                    <Engine config={fixture.config} />
                  </Suspense>
                ) : (
                  <p className="text-destructive">
                    No engine registered for type <code>{fixture.type}</code>.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
