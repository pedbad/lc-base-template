import { describe, expect, it } from 'vitest';
import { loSlug } from './lo-slug';

describe('loSlug', () => {
  it('strips the lo-NN- authoring-order prefix', () => {
    expect(loSlug('lo-00-example')).toBe('example');
  });

  it('keeps every segment of a multi-word slug', () => {
    expect(loSlug('lo-01-going-to-a-cafe')).toBe('going-to-a-cafe');
  });

  it('accepts an ordinal of any width', () => {
    expect(loSlug('lo-7-intro')).toBe('intro');
    expect(loSlug('lo-100-intro')).toBe('intro');
  });

  it('rejects a folder with no lo-NN- prefix, naming it', () => {
    expect(() => loSlug('example')).toThrow(/example/);
  });

  it('rejects a folder with no slug after the ordinal', () => {
    expect(() => loSlug('lo-00-')).toThrow(/lo-00-/);
  });

  it('rejects a slug that is not url-safe kebab-case', () => {
    expect(() => loSlug('lo-00-Example_One')).toThrow(/lo-00-Example_One/);
  });
});
