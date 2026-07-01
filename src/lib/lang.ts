/**
 * lang.ts — the course's TARGET language code, in ONE place.
 *
 * WHAT: Re-exports `courseConfig.languageCode` as `TARGET_LANG` so every exercise
 * engine imports a single constant instead of reaching into course.config.
 *
 * WHY (WCAG 3.1.2 — Language of Parts): `<html lang="en">` in index.html declares
 * the UI-chrome language. Learner-facing content is the TARGET language (e.g. "es"),
 * so screen readers must be told to switch pronunciation for it. Engines wrap only
 * their target-language content subtrees in `lang={TARGET_LANG}`; UI chrome
 * (Check/Reset/status/aria) inherits `lang="en"`.
 *
 * Spec: docs/specs/lo-semantic-structure.md §3.
 */
import { courseConfig } from '../config/course.config';

/** The language being taught (e.g. "es"). Wrap learner content, never UI chrome. */
export const TARGET_LANG = courseConfig.languageCode;
