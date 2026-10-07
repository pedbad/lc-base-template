/**
 * exercise-buttons.ts — the exercise footer's three button looks, one per semantic
 * token: Show answer a --primary tint, Reset the --destructive variant (itself a
 * tint), Check solid --success. Its own module so `ExerciseFooter` and the debug
 * sandbox's button reference render the same objects, not a copy.
 */
export const EXERCISE_BUTTONS = {
  showAnswer: { variant: 'ghost', className: 'bg-primary/10 text-primary hover:bg-primary/20' },
  reset: { variant: 'destructive' },
  check: { className: 'bg-success text-success-foreground hover:bg-success/90' },
} as const;
