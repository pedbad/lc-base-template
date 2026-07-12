import { test, expect } from 'vitest';
import { courseConfig } from './course.config';

// Importing courseConfig runs CourseConfigSchema.parse() at module load.
// If raw config is invalid, that parse throws here and this suite fails —
// which is the "config drift fails fast" guarantee, proven in CI/pre-commit.
test('course.config: validates and loads at import', () => {
  expect(courseConfig.courseTitle.length).toBeGreaterThan(0);
  expect(courseConfig.languageCode.length).toBeGreaterThanOrEqual(2);
});

test('course.config: optional subheading is a real string when present', () => {
  const { subheading } = courseConfig.landingCopy;
  if (subheading !== undefined) {
    expect(subheading.length).toBeGreaterThan(0);
  }
});
