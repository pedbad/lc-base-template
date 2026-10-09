import { test, expect } from 'vitest';
import { courseConfig } from './course.config';

// Importing courseConfig runs CourseConfigSchema.parse() at module load.
// If raw config is invalid, that parse throws here and this suite fails —
// which is the "config drift fails fast" guarantee, proven in CI/pre-commit.
test('course.config: validates and loads at import', () => {
  expect(courseConfig.courseTitle.length).toBeGreaterThan(0);
  expect(courseConfig.languageCode.length).toBeGreaterThanOrEqual(2);
});

// Decision B (2026-08-06): the `lo-NN-` folder ordinal is the ONLY source of course
// order. A `loOrder` list here would be a second source for the same fact, free to
// drift from the folders silently — so its absence is asserted, not assumed.
test('course.config: carries no LO order list — the folder ordinal is the order', () => {
  expect(courseConfig).not.toHaveProperty('loOrder');
});

test('course.config: optional subheading is a real string when present', () => {
  const { subheading } = courseConfig.landingCopy;
  if (subheading !== undefined) {
    expect(subheading.length).toBeGreaterThan(0);
  }
});

// The progress meter's icon (ProgressMeter, 2026-10-09): optional — a plain dot
// without it — and a real %BASE_URL%-relative path when present.
test('course.config: optional progressIcon is a relative asset path when present', () => {
  const { progressIcon } = courseConfig;
  if (progressIcon !== undefined) {
    expect(progressIcon.length).toBeGreaterThan(0);
    expect(progressIcon.startsWith('/')).toBe(false);
  }
});
