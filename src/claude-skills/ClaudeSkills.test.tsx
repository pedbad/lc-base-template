/**
 * ClaudeSkills.test.tsx — the Claude skills debug page (TODO §E40): one card per skill in
 * .claude/skills/, built from its SKILL.md, then the folder's README of shared steps.
 * Every card and the README in the jump menu, every debug page in the nav with this one
 * current, and a heading outline that never skips a level.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { findHeadingViolations } from '@/guards/semantic-dom';
import ClaudeSkills from './ClaudeSkills';
import { CLAUDE_SKILLS, CLAUDE_SKILLS_SECTIONS } from './claude-skills-data';

const html = renderToStaticMarkup(<ClaudeSkills />);
const nav = /<nav[^>]*aria-label="Claude skills sections"[^>]*>.*?<\/nav>/s.exec(html)?.[0] ?? '';

describe('Claude skills page', () => {
  test('has a card per skill: its name as a heading, its description, how to call it', () => {
    expect(CLAUDE_SKILLS.skills.length).toBeGreaterThanOrEqual(8);
    CLAUDE_SKILLS.skills.forEach(({ id, name }) => {
      expect(html).toMatch(new RegExp(`<section[^>]*id="${id}"[^>]*>\\s*<h2[^>]*>${name}</h2>`));
      expect(html).toContain(`<code>/${name}</code>`);
    });
    expect(html).toContain('Use when someone wants to add a new lesson');
  });

  test('keeps each recipe behind a disclosure, rendered from its SKILL.md', () => {
    expect(html.match(/<details/g)).toHaveLength(CLAUDE_SKILLS.skills.length);
    expect(html.match(/<summary[^>]*>Read the recipe<\/summary>/g)).toHaveLength(
      CLAUDE_SKILLS.skills.length,
    );
    expect(html).toContain('id="skill-add-lo--add-a-lesson-learning-object"');
    expect(html).not.toContain('name: add-lo');
  });

  test("renders the folder's README after the cards, as the shared steps", () => {
    expect(html).toContain('id="skills--where-am-i"');
    expect(html.indexOf('id="skills--where-am-i"')).toBeGreaterThan(
      html.indexOf('id="skill-sync-from-template"'),
    );
  });

  test('offers one jump entry per skill and one for the shared steps', () => {
    expect(nav).toMatch(/aria-haspopup="menu"[^>]*>[^<]*Jump to skill/);
    expect(CLAUDE_SKILLS_SECTIONS.map((section) => section.label)).toEqual([
      ...CLAUDE_SKILLS.skills.map((skill) => skill.name),
      'Shared steps',
    ]);
    CLAUDE_SKILLS_SECTIONS.forEach(({ id }) => {
      expect(html).toContain(`id="${id}"`);
    });
  });

  test('links to every debug page and course home, marking itself current', () => {
    [
      'exercise-showcase',
      'debug-sandbox',
      'ui-showcase',
      'code-style',
      'culp-syllabi',
      'claude-skills',
    ].forEach((file) => {
      expect(nav).toContain(`href="/${file}.html"`);
    });
    expect(nav.match(/aria-current="page"/g)).toHaveLength(1);
    expect(nav).toMatch(/<a [^>]*href="\/claude-skills\.html"[^>]*aria-current="page"/);
    expect(nav).toContain('Course home');
  });

  test('has one h1 and an outline that never skips a level', () => {
    expect(html.match(/<h1[ >]/g)).toHaveLength(1);
    expect(findHeadingViolations(html)).toEqual([]);
  });

  test('applies the stored theme before first paint, like the other pages', () => {
    const shell = readFileSync(new URL('../../claude-skills.html', import.meta.url), 'utf-8');
    const head = shell.slice(0, shell.indexOf('</head>'));
    expect(head).toContain("localStorage.getItem('lc-theme')");
    expect(head).toContain("classList.add('dark')");
    expect(shell).toContain('src="/src/claude-skills/main.tsx"');
  });
});
