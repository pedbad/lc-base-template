/**
 * RateButtons — Again and Got it under a flipped card (maintainer, 2026-10-09). Each
 * carries the face its progress circle will show: sad for Again, happy for Got it, so
 * a rating and its circle read as one thing. Got it keeps the solid Check look.
 */
import { Frown, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EXERCISE_BUTTONS } from '../lib/exercise-buttons';
import type { SrsGrade } from './srs-scheduler';

interface RateButtonsProps {
  onRate: (grade: SrsGrade) => void;
}

export function RateButtons({ onRate }: RateButtonsProps) {
  return (
    <>
      <Button variant="outline" size="lg" onClick={() => onRate('again')}>
        <Frown aria-hidden="true" />
        Again
      </Button>
      <Button size="lg" className={EXERCISE_BUTTONS.check.className} onClick={() => onRate('good')}>
        <Smile aria-hidden="true" />
        Got it
      </Button>
    </>
  );
}
