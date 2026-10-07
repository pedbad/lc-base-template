/**
 * exercise-buttons.ts — the exercise footer's three button looks, one per semantic
 * token: Show answer a --primary tint, Reset the --destructive variant (itself a
 * tint) lettered in --destructive-text, Check solid --success. Its own module so
 * `ExerciseFooter` and the debug sandbox's button reference render the same objects,
 * not a copy.
 */
export const EXERCISE_BUTTONS = {
  showAnswer: { variant: 'ghost', className: 'bg-primary/10 text-primary hover:bg-primary/20' },
  // The variant's tint, but its label in --destructive-text: the crest red itself is
  // 3.81:1 light / 2.74:1 dark on that tint, under the 4.5:1 text needs.
  reset: { variant: 'destructive', className: 'text-destructive-text' },
  check: { className: 'bg-success text-success-foreground hover:bg-success/90' },
} as const;
