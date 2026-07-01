import { expect, test } from 'bun:test';
import { TARGET_LANG } from './lang';
import { courseConfig } from '../config/course.config';

test('TARGET_LANG mirrors the course languageCode', () => {
  expect(TARGET_LANG).toBe(courseConfig.languageCode);
});

test('TARGET_LANG is a non-empty language code', () => {
  expect(TARGET_LANG.length).toBeGreaterThanOrEqual(2);
});
