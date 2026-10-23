/**
 * ClaudeSkills — the sixth debug page (`claude-skills.html`, DEBUG=1 only): the Claude
 * skills in .claude/skills/, one card each, then the folder's README of the steps they
 * share (TODO §E40). The skills are the repo's recipes for its recurring jobs, and they
 * sit in a hidden folder, so this page is where a course author sees what Claude can do
 * for them and what to ask for.
 *
 * RENDERED, NOT COPIED, as the CULP syllabi page is: `virtual:sandbox-docs` reads every
 * SKILL.md at build time (src/build/claude-skills-docs.ts). A card's name and
 * description are the skill's own frontmatter, which is what Claude Code reads to decide
 * when to use it; the recipe below them is the rest of the file. Adding a skill folder
 * adds its card, with nothing to register.
 *
 * Each recipe sits in a closed `<details>`: eight recipes open would bury the cards, and
 * the description already says when the skill applies.
 */
import { DebugPageHeader } from '@/sandbox/DebugPageHeader';
import { CLAUDE_SKILLS, CLAUDE_SKILLS_SECTIONS } from './claude-skills-data';
import '@/sandbox/sandbox.css';

export default function ClaudeSkills() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DebugPageHeader
        title="Claude skills"
        description="The recipes Claude Code follows for this repo's recurring jobs: what each is for, how to call it, and its steps."
        navLabel="Claude skills sections"
        sections={CLAUDE_SKILLS_SECTIONS}
        jumpLabel="Jump to skill"
        current="skills"
      />

      <main className="page-frame py-10">
        <p className="max-w-(--measure) text-muted-foreground">
          Rendered from <code>.claude/skills/</code> itself, not a copy: each card is one{' '}
          <code>SKILL.md</code>. Claude Code picks a skill by itself when a request matches its
          description, or you can call one by name.
        </p>

        <div className="mt-8 grid gap-6">
          {CLAUDE_SKILLS.skills.map((skill) => (
            <section
              key={skill.id}
              id={skill.id}
              aria-labelledby={`${skill.id}-name`}
              className="rounded-lg border border-border bg-card p-6 text-card-foreground"
            >
              <h2 id={`${skill.id}-name`} className="font-mono text-xl font-semibold">
                {skill.name}
              </h2>
              <p className="mt-2 max-w-(--measure)">{skill.description}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Call it by name: <code>/{skill.name}</code>
              </p>
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Read the recipe</summary>
                {/* Build-time HTML from a repo-tracked markdown file, parsed with raw
                    HTML escaped (docs-markdown.ts). No runtime input reaches it. */}
                <div
                  className="doc-prose doc-page-prose mt-4"
                  dangerouslySetInnerHTML={{ __html: skill.html }}
                />
              </details>
            </section>
          ))}
        </div>

        {/* The README's own `#` title is the section's h2, its id the jump target. */}
        <article
          id={CLAUDE_SKILLS.readme.id}
          className="doc-prose doc-page-prose mt-12"
          dangerouslySetInnerHTML={{ __html: CLAUDE_SKILLS.readme.html }}
        />
      </main>
    </div>
  );
}
