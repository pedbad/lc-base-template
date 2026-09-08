# Theme tokens — Cambridge Slate

**The theming guide moved to [`DESIGNER.md`](../../DESIGNER.md) at the repo root**
(buildlist 29). It is the canonical source for the token chain, re-skinning,
the three presets, the fonts, and what guards f and g will fail on.

This stub is a pointer, not a summary — a second copy of those rules is exactly
the drift the guards exist to prevent, so there is only ever one.

## The files in this folder

| File                                  | Layer                 | Edit when…                                        |
| ------------------------------------- | --------------------- | ------------------------------------------------- |
| `palette.css`                         | 1 · primitives        | re-skinning — the **only** place raw hex may live |
| `tokens.css`                          | 2/3 · semantic ACTIVE | never by hand — a copy of one preset below        |
| `tokens-variant-a-cambridge-blue.css` | preset                | switching `--primary` / `--ring`                  |
| `tokens-variant-b-dark-blue.css`      | preset (default)      | switching `--primary` / `--ring`                  |
| `tokens-variant-c-warm-blue.css`      | preset                | switching `--primary` / `--ring`                  |

Enforced here: raw hex only in `palette.css` (**guard f**,
`src/guards/token-integrity.ts`); every rule inside `@layer`, zero `!important`
(**guard g**, `src/guards/layer-discipline.ts`).
