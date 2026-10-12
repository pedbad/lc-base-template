/**
 * ClearProgress — forgets a deck's saved progress (maintainer, 2026-10-12). Shown only
 * when the deck saves progress (`srs`). Reset keeps that memory; this is the separate,
 * rarer action, so it is a quiet ghost button and asks first, in place: what will be
 * lost, then Clear or Cancel. Focus moves to Cancel, the safe choice, and returns to
 * the button afterwards.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EXERCISE_BUTTONS } from '../lib/exercise-buttons';

interface ClearProgressProps {
  onClear: () => void;
  /** Render asking (tests). */
  defaultConfirming?: boolean;
}

export function ClearProgress({ onClear, defaultConfirming = false }: ClearProgressProps) {
  const [isConfirming, setIsConfirming] = useState(defaultConfirming);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Skip the first run, so nothing takes focus on load.
  const hasToggled = useRef(false);

  useEffect(() => {
    if (!hasToggled.current) return;
    (isConfirming ? cancelRef : triggerRef).current?.focus();
  }, [isConfirming]);

  const setConfirming = (next: boolean) => {
    hasToggled.current = true;
    setIsConfirming(next);
  };

  if (!isConfirming) {
    return (
      <Button ref={triggerRef} variant="ghost" onClick={() => setConfirming(true)}>
        Clear saved progress
      </Button>
    );
  }

  return (
    <div className="flashcards-clear-confirm" role="group" aria-label="Clear saved progress">
      <p>This forgets which cards you found hard.</p>
      <Button
        {...EXERCISE_BUTTONS.reset}
        onClick={() => {
          onClear();
          setConfirming(false);
        }}
      >
        Clear
      </Button>
      <Button ref={cancelRef} variant="ghost" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </div>
  );
}
