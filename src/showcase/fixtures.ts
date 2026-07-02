/**
 * fixtures.ts — the catalog the exercise showcase renders.
 *
 * One entry per showcase CARD. Most engines have one card; `select` will have two
 * (rows + inline) to prove both `layoutMode`s (spec §3). Each fixture is a small,
 * realistic, Zod-valid exercise config. As each engine is ported (Phase B) its
 * fixture(s) are appended here, so the showcase grows one card at a time.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §3, §8.
 */
import type { ExerciseType } from '@/config/exercise-types';

/** One showcase card: a titled, ready-to-render exercise config. */
export interface ShowcaseFixture {
  /** Unique card id (also the anchor), e.g. "select-rows". */
  id: string;
  /** Human-readable card title shown above the live exercise. */
  title: string;
  /** Which engine renders it (resolved via lazyRegistry). */
  type: ExerciseType;
  /** The exercise config (content + optional options/labels). Narrowed by the engine. */
  config: unknown;
}

/**
 * Fixtures grow one card at a time as engines are ported. Content is Cambridge
 * Spanish (the example course); blanks use `[a|*b|c]` where `*` marks the correct
 * option. `select` gets two cards to prove both layoutModes (spec §3).
 */
export const SHOWCASE_FIXTURES: ShowcaseFixture[] = [
  {
    id: 'select-rows',
    title: 'select — rows (shuffled)',
    type: 'select',
    config: {
      type: 'select',
      content: {
        layoutMode: 'rows',
        items: [
          { text: 'Yo [*soy|eres|es] de Madrid.' },
          { text: 'Tú [soy|*eres|es] muy amable.' },
          { text: 'Ella [soy|eres|*es] profesora de español.' },
        ],
        footnote: 'Demo hint line — pick the correct option for each blank.',
      },
      // shuffle on: option order randomizes and Reset re-shuffles (spec §5.2).
      options: { shuffle: true },
    },
  },
  {
    id: 'select-inline',
    title: 'select — inline passage (Spanish chrome)',
    type: 'select',
    config: {
      type: 'select',
      content: {
        layoutMode: 'inline-passage',
        // A narrative passage: order matters, so shuffle stays off (default).
        items: [
          { text: 'Me llamo Ana y [soy|*tengo|tienes] veinte años.' },
          { text: '[*Vivo|Vives|Vive] en Barcelona con mi familia.' },
          { text: 'Mi hermano [*habla|hablo|hablas] inglés y francés.' },
          { text: 'Nos [*gusta|gustan|gusto] mucho viajar juntos.' },
        ],
      },
      // Per-exercise chrome override (ui-strings Layer 2, §9).
      labels: { check: 'Comprobar', reset: 'Reiniciar', showAnswer: 'Ver respuestas' },
    },
  },
  {
    id: 'select-multi-blank',
    title: 'select — multiple blanks per sentence',
    type: 'select',
    config: {
      type: 'select',
      content: {
        layoutMode: 'rows',
        // Two dropdowns in ONE sentence: each blank is graded independently and the
        // row tick turns green only when BOTH are correct (spec §7). Proves the
        // parser/engine already handle several `[...]` blanks per item.
        items: [
          { text: 'Yo [*soy|eres|es] de Madrid y ella [vivo|vives|*vive] en París.' },
          {
            text: 'Nosotros [*tenemos|tienes|tiene] hambre y vosotros [tengo|*tenéis|tienen] sed.',
          },
        ],
        footnote: 'Demo hint line — a sentence can have several blanks; each is graded separately.',
      },
    },
  },
  {
    id: 'inline-choice',
    title: 'inline-choice — radio pills (shuffled)',
    type: 'inline-choice',
    config: {
      type: 'inline-choice',
      content: {
        items: [
          { text: 'Nosotros [*somos|sois|son] estudiantes.' },
          { text: 'Vosotros [somos|*sois|son] de México.' },
          { text: 'Ellas [somos|sois|*son] muy simpáticas.' },
        ],
        footnote: 'Demo hint line — choose the correct option.',
      },
      // shuffle on: pill order randomizes and Reset re-shuffles (spec §5.2).
      options: { shuffle: true },
    },
  },
  {
    id: 'radio-quiz',
    title: 'radio-quiz — comprehension questions (shuffled, explanations)',
    type: 'radio-quiz',
    config: {
      type: 'radio-quiz',
      content: {
        // Comprehension QUESTIONS, not fill-in blanks: each `prompt` is a real
        // question and each option is a candidate ANSWER (not a word you slot back
        // into the stem) — the visible contrast with inline-choice. The correct
        // option carries a leading `*`; the explanation shows only after a WRONG
        // check for that question (spec §7, engine decision).
        questions: [
          {
            prompt: '¿Cuál de estos saludos es formal?',
            options: ['¡Hola!', '*Buenos días', '¿Qué tal?'],
            explanation: '«Buenos días» es formal; «¡Hola!» y «¿Qué tal?» son informales.',
          },
          {
            prompt: 'En español, ¿qué palabra NO es un color?',
            options: ['rojo', '*martes', 'verde'],
            explanation: '«Martes» es un día de la semana; «rojo» y «verde» son colores.',
          },
          {
            prompt: '¿Qué significa «gracias» en inglés?',
            options: ['please', 'sorry', '*thank you'],
            explanation: '«Gracias» se traduce como «thank you».',
          },
          {
            prompt: 'Son las 14:00. ¿Cómo se dice la hora?',
            options: ['Es la una', '*Son las dos de la tarde', 'Son las cuatro'],
            explanation: 'Las 14:00 son «las dos de la tarde» (formato de 12 horas).',
          },
        ],
        footnote: 'Demo hint line — each question has one correct answer.',
      },
      // shuffle on: option order randomizes per question and Reset re-shuffles (§5.2).
      options: { shuffle: true },
    },
  },
  {
    id: 'inline-gap',
    title: 'inline-gap — typed cloze (type the verb)',
    type: 'inline-gap',
    config: {
      type: 'inline-gap',
      content: {
        // Typed blanks: `[expected::placeholder]`. The text before `::` is graded
        // (accent-strict via normalizeAnswer); the optional hint after `::` becomes
        // the input's placeholder. A wrong Check shows a character diff under the box.
        items: [
          {
            prompt: 'Conjuga «ser» y «llamarse» en presente.',
            text: 'Hola, yo me [llamo::llamarse] Ana y [soy::ser] de Madrid.',
          },
          { text: 'Nosotros [vivimos::vivir] en Barcelona desde 2020.' },
          { text: 'Mi hermana [tiene::tener] veinte años y [estudia::estudiar] medicina.' },
        ],
        footnote: 'Demo hint line — press Enter to jump to the next gap; accents count.',
      },
    },
  },
  {
    id: 'inline-gap-audio',
    title: 'inline-gap — per-row audio (independent clips)',
    type: 'inline-gap',
    config: {
      type: 'inline-gap',
      content: {
        // Each row carries its own clip → an independent click-to-play speaker
        // (AudioClip + useAudioClip). Starting one stops the others (AudioManager).
        items: [
          { text: 'Yo [soy::ser] de Madrid.', audio: 'audio/inline-gap/q1.wav' },
          { text: 'Tú [eres::ser] muy amable.', audio: 'audio/inline-gap/q2.wav' },
          { text: 'Ella [es::ser] profesora de español.', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — tap each speaker to hear the phrase (demo clips).',
      },
    },
  },
  {
    id: 'inline-gap-master',
    title: 'inline-gap — master playlist player (sequence)',
    type: 'inline-gap',
    config: {
      type: 'inline-gap',
      content: {
        // useSequenceAudioController → one master player (play/pause, scrubber,
        // volume, auto-advance) plays all clips as a timeline; each row's speaker
        // becomes a display driven by it, highlighting the active row.
        useSequenceAudioController: true,
        listenDescriptionText: 'Escucha la secuencia completa primero:',
        soundFile: 'audio/inline-gap/q1.wav',
        items: [
          { text: 'Hace [sol::el tiempo] hoy.', audio: 'audio/inline-gap/q1.wav' },
          { text: 'Mañana va a [llover::el tiempo].', audio: 'audio/inline-gap/q2.wav' },
          { text: 'En invierno hace [frío::temperatura].', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — synthetic demo audio clips (q1–q3).',
      },
    },
  },
  {
    id: 'typed-transform',
    title: 'typed-transform — type the transformed form',
    type: 'typed-transform',
    config: {
      type: 'typed-transform',
      content: {
        // A transform drill: read the singular cue, type the plural. Graded in
        // strict mode (normalizeAnswer): accents count, apostrophes/spacing forgive.
        columns: { prompt: 'Singular', answer: 'Plural' },
        rows: [
          { prompt: 'el gato', answer: 'los gatos' },
          { prompt: 'la casa', answer: 'las casas' },
          { prompt: 'el profesor', answer: 'los profesores' },
          { prompt: 'la canción', answer: 'las canciones' },
        ],
        footnote: 'Demo hint line — type the plural; press Enter for the next row.',
      },
    },
  },
  {
    id: 'typed-transform-audio',
    title: 'typed-transform — with per-row audio',
    type: 'typed-transform',
    config: {
      type: 'typed-transform',
      content: {
        columns: { prompt: 'Escucha', answer: 'Escribe' },
        rows: [
          { prompt: 'masculino', answer: 'alto', audio: 'audio/inline-gap/q1.wav' },
          { prompt: 'femenino', answer: 'alta', audio: 'audio/inline-gap/q2.wav' },
          { prompt: 'plural', answer: 'altos', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — tap the speaker to hear each word (demo clips).',
      },
    },
  },
  {
    id: 'dictation',
    title: 'dictation — listen and transcribe',
    type: 'dictation',
    config: {
      type: 'dictation',
      content: {
        // Audio-only rows (no prompt cue): the learner plays the clip and types what
        // they hear. Graded in dictation mode (normalizeForDictation): accents count,
        // punctuation and quotes are forgiven. Every row carries audio (schema-enforced).
        rows: [
          { answer: 'Buenos días', audio: 'audio/inline-gap/q1.wav' },
          { answer: '¿Cómo estás?', audio: 'audio/inline-gap/q2.wav' },
          { answer: 'Hasta luego', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — type what you hear (demo clips).',
      },
    },
  },
  {
    id: 'line-match',
    title: 'line-match — match each picture to its word',
    type: 'line-match',
    config: {
      type: 'line-match',
      content: {
        // Shape vocab: match each demo image to its Spanish name. The word bank is
        // always shuffled; pick the matching word for each picture. (7a layout:
        // picture + dropdown. The desktop SVG connector layout lands in 7b.)
        items: [
          {
            id: 'circulo',
            label: 'el círculo',
            image: 'images/line-match/circle.svg',
            localLanguage: 'circle',
          },
          {
            id: 'cuadrado',
            label: 'el cuadrado',
            image: 'images/line-match/square.svg',
            localLanguage: 'square',
          },
          {
            id: 'triangulo',
            label: 'el triángulo',
            image: 'images/line-match/triangle.svg',
            localLanguage: 'triangle',
          },
          {
            id: 'estrella',
            label: 'la estrella',
            image: 'images/line-match/star.svg',
            localLanguage: 'star',
          },
        ],
        footnote: 'Demo hint line — match each picture to its name.',
      },
    },
  },
  {
    id: 'word-spot',
    title: 'word-spot — click the part-words with the target sound',
    type: 'word-spot',
    config: {
      type: 'word-spot',
      content: {
        // Spanish phonics: click every part-word containing the "ch" sound. The
        // bracketed runs are the targets; clicking any other word scores a miss.
        // Own scoring model — no Check button, each click is graded live (spec §7).
        items: [
          { text: 'El [ch]ico [ch]ileno comió [ch]ocolate.' },
          { text: 'La [ch]ica escu[ch]a la canción.' },
          { text: 'Mu[ch]as gracias por la le[ch]e.' },
        ],
        footnote: 'Demo hint line — click each part that contains the target sound.',
      },
    },
  },
  {
    id: 'memory-match',
    title: 'memory-match — flip cards to pair each picture with its word (no audio)',
    type: 'memory-match',
    config: {
      type: 'memory-match',
      content: {
        // Shape vocab as a pairs game: flip cards to match each picture to its
        // Spanish word. Deck is always shuffled; a matched pair stays face-up.
        // Reuses the line-match demo SVGs. Own scoring model (spec §7).
        items: [
          { text: 'el círculo', image: 'images/line-match/circle.svg', localLanguage: 'circle' },
          { text: 'el cuadrado', image: 'images/line-match/square.svg', localLanguage: 'square' },
          {
            text: 'el triángulo',
            image: 'images/line-match/triangle.svg',
            localLanguage: 'triangle',
          },
          { text: 'la estrella', image: 'images/line-match/star.svg', localLanguage: 'star' },
        ],
        footnote: 'Demo hint line — flip the cards and match each picture to its word.',
      },
    },
  },
  {
    id: 'memory-match-audio',
    title: 'memory-match — with audio (speaker on match)',
    type: 'memory-match',
    config: {
      type: 'memory-match',
      content: {
        // Audio mode: each item's `audio` clip auto-plays on a correct match, and a
        // click-to-play speaker appears next to the word once its card is face-up.
        // Clips are AAC-in-MP4 (not WAV) — the format used in live deployment.
        items: [
          {
            text: 'el círculo',
            image: 'images/line-match/circle.svg',
            audio: 'audio/memory-match/circulo.mp4',
            localLanguage: 'circle',
          },
          {
            text: 'el cuadrado',
            image: 'images/line-match/square.svg',
            audio: 'audio/memory-match/cuadrado.mp4',
            localLanguage: 'square',
          },
          {
            text: 'el triángulo',
            image: 'images/line-match/triangle.svg',
            audio: 'audio/memory-match/triangulo.mp4',
            localLanguage: 'triangle',
          },
          {
            text: 'la estrella',
            image: 'images/line-match/star.svg',
            audio: 'audio/memory-match/estrella.mp4',
            localLanguage: 'star',
          },
        ],
        footnote: 'Demo hint line — flip the cards; matching a pair plays its audio.',
      },
    },
  },
  {
    id: 'word-order',
    title: 'word-order — click to select, click to swap',
    type: 'word-order',
    config: {
      type: 'word-order',
      content: {
        // Sequence/placement family (spec §7): `words` is the answer key, in
        // order. The engine always scrambles it for display (shuffle is N/A).
        words: ['Yo', 'como', 'una', 'manzana', 'todos', 'los', 'días'],
        footnote: 'Demo hint line — arrange the words to form the correct sentence.',
      },
    },
  },
  {
    id: 'phrase-reorder',
    title: 'phrase-reorder — reorder whole phrases (fixed prompt + audio per slot)',
    type: 'phrase-reorder',
    config: {
      type: 'phrase-reorder',
      content: {
        // Sequence/placement family (spec §7): `rows` order is the answer key. Each
        // slot's `prompt`/`audio` stay fixed in place; only `phrase` slides between
        // slots (spec §11, ported from french-lo-1's PhraseReorderExercise).
        rows: [
          { phrase: 'Buenos días', prompt: 'Good morning', audio: 'audio/inline-gap/q1.wav' },
          { phrase: '¿Cómo estás?', prompt: 'How are you?', audio: 'audio/inline-gap/q2.wav' },
          { phrase: 'Hasta luego', prompt: 'See you later', audio: 'audio/inline-gap/q3.wav' },
        ],
        footnote: 'Demo hint line — order the phrases as in a typical conversation.',
      },
    },
  },
  {
    id: 'drag-fill-gaps',
    title: 'drag-fill-gaps — drag word tiles into the blanks',
    type: 'drag-fill-gaps',
    config: {
      type: 'drag-fill-gaps',
      content: {
        // Sequence/placement family (spec §7): each `[bracketed]` blank becomes one
        // draggable tile in the shared bank below. Check locks correct placements
        // and bounces wrong ones back to the bank (spec §11, ported from
        // french-lo-1's DraggableFillGaps `phrases` variant).
        items: [
          { text: 'Yo [soy] de Madrid y ella [vive] en París.' },
          { text: 'Nosotros [tenemos] hambre y vosotros [tenéis] sed.' },
        ],
        footnote: 'Demo hint line — drag each word to its matching gap.',
      },
      // shuffle on: the bank order randomizes and Reset re-shuffles (spec §5.2).
      options: { shuffle: true },
    },
  },
];
