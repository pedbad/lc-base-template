/**
 * exercise-buttons.ts — the exercise footer's three button looks, one per semantic
 * token: Show answer a --primary tint, Reset the --destructive variant (a tint,
 * lettered in --destructive-text by the variant itself), Check solid --success. Its own module so
 * `ExerciseFooter` and the debug sandbox's button reference render the same objects,
 * not a copy.
 */
import './exercise-buttons.css';

export const EXERCISE_BUTTONS = {
  showAnswer: { variant: 'ghost', className: 'bg-primary/10 text-primary hover:bg-primary/20' },
  // The variant letters it in --destructive-text since 2026-10-08 (button.tsx); this
  // override carried that fix until then.
  reset: { variant: 'destructive' },
  // Hover pulls the green toward --foreground (exercise-buttons.css), away from its
  // label in both themes; `bg-success/90` faded it, 4.28:1 under white (TODO §D14).
  check: {
    className: 'exercise-check bg-success text-success-foreground hover:bg-(--check-hover)',
  },
} as const;
