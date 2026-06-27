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
        footnote: 'El verbo «ser» cambia según la persona.',
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
        footnote: 'Una frase puede tener varios huecos; cada uno se corrige por separado.',
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
        footnote: 'Elige la forma correcta del verbo «ser».',
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
        footnote: 'Cada pregunta tiene una sola respuesta correcta.',
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
        footnote: 'Pulsa Intro para saltar al siguiente hueco. Los acentos cuentan.',
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
        footnote: 'Pulsa cada altavoz para oír la frase (clips de demostración).',
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
        footnote: 'Demostración con clips de audio sintéticos (q1–q3).',
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
        footnote: 'Escribe el plural. Pulsa Intro para pasar a la siguiente fila.',
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
        footnote: 'Pulsa el altavoz para oír cada palabra (clips de demostración).',
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
        footnote:
          'Escribe lo que oyes. (Clips de demostración — escribe la respuesta para probar.)',
      },
    },
  },
];
