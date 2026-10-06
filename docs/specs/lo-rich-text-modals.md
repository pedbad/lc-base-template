# LO Rich Text + Modal Popups (spec)

**Status:** accepted 2026-08-04. Implemented in the same session — see §11 for the test plan
that guards it. **Extended 2026-10-06** with block entries (lists, tables, the audio player)
in popups AND page prose — see §14, which amends R4 and R7.

**Problem.** Authored LO prose is plain text today: `TextBlockContentSchema.text` is a
`string[]` and `TextBlock` renders `<p>{paragraph}</p>`, escaped. So an authored
`<strong>` renders as visible literal markup, and there is nowhere to put a glossary
popup link. The reference implementation (`pedbad/French-Basic-2026`) solves this with
inline HTML plus a modal launched from `<a class="modal-link">` — but it does so via
`dangerouslySetInnerHTML`, which this repo has deliberately never used (see the note in
`src/exercises/lib/charDiff.ts`).

**This spec** adds inline rich text and modal popups **without** injecting raw HTML:
authors write HTML, the loader parses it into a typed node tree, and React renders that
tree. Audio icons therefore work as real components, not as post-mount DOM surgery.

Companion to `docs/specs/lo-semantic-structure.md` (the page skeleton). Modal content is
governed by §3 of that spec (`instructions`, `lang`) and §2's heading rules.

---

## 1. Decisions (locked)

| #   | Decision                                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Authors write **HTML strings**. The loader parses them to a typed node tree. React renders nodes.                                                                   |
| R2  | **No `dangerouslySetInnerHTML`, no sanitiser dependency.** A strict allowlist + loud failure.                                                                       |
| R3  | Modal content lives in **`modals/<id>/modal.json`**, mirroring `blocks/` and `exercises/`.                                                                          |
| R4  | Each array entry is a paragraph of inline rich text **or one whole block** (list, table, audio player — §14). Never a `<p>` tag; the array is the paragraph break.  |
| R5  | Parsing happens **at load** for modals, so a bad tag fails with the file path. Block prose parses via its per-type schema at render — see §5 for the split and why. |
| R6  | Modal state lives in **React context** with a single `ModalHost`, not one `<Dialog>` per link.                                                                      |
| R7  | The parser is **hand-rolled**. See §9 for why, and the swap point if the grammar grows.                                                                             |

---

## 2. Authoring format

### Inline rich text

Any `string` in a rich-text field may contain these tags and nothing else:

| Authored                                             | Renders as                         | Notes                              |
| ---------------------------------------------------- | ---------------------------------- | ---------------------------------- |
| plain text                                           | text                               | entities decoded (§4)              |
| `<strong>…</strong>`                                 | `<strong>`                         | **not** `<b>` — see below          |
| `<em>…</em>`                                         | `<em>`                             | **not** `<i>` — see below          |
| `<br>`                                               | `<br />`                           | `<br/>` and `<br />` also accepted |
| `<a class="modal-link" data-modal-target="id">…</a>` | a `<button>` that opens modal `id` | see §7                             |
| `<span data-audio="path"></span>`                    | an `<AudioClip>` speaker icon      | see §6                             |

`<b>` and `<i>` are **rejected with an error**, not silently accepted — enforcing
carry-forward anti-pattern #16 (`docs/process/FUTURE_PROJECTS.md`: use semantic
`<strong>`/`<em>`, never presentational tags). Any other tag is also rejected. The
allowlist is closed by design: a typo like `<storng>` must fail loudly rather than
vanish from the page.

Nesting is allowed (`<strong>très <em>très</em> formel</strong>`). Unclosed and
mismatched tags are errors.

### Where rich text is accepted

- `blocks/<ref>/block.json` → `content.text[]` for `type: "prose"` and `type: "grammar"`
- `modals/<id>/modal.json` → `content[]`

Plain strings remain valid — a string with no markup parses to a single text node, so
every LO authored before this spec keeps working unchanged.

### Modal file

```json
{
  "title": "tu vs vous",
  "lang": "fr",
  "content": [
    "French has two words for <em>you</em>. <strong>tu</strong> is informal…",
    "Listen to the difference: <span data-audio=\"audio/lo-00-example/tu.mp3\"></span>"
  ]
}
```

- `title` — required, non-empty. Becomes the dialog's accessible name (`DialogTitle`).
- `content` — required, non-empty array; one entry per paragraph, each parsed as inline
  rich text and wrapped in `<p>`. Same "the author knows where the breaks belong"
  reasoning as `TextBlockContentSchema.text` — the renderer never splits prose itself.
- `lang` — optional. Set it when the modal body is target-language content (WCAG 3.1.2,
  semantic-structure spec §3). Omit for UI-language commentary.

### Manifest

`lo.json` gains an optional top-level `modals`:

```json
{
  "title": "Example Learning Object",
  "sections": [...],
  "modals": ["tuvous"]
}
```

Declared explicitly rather than discovered by globbing the folder, for the same reason
sections are explicit (Part C decision D1): an undeclared file is then a detectable
authoring mistake instead of silently-live content. `modals` sits at the top level, not
inside a section, because a modal is not page structure — it has no heading in the
document outline and can be linked from any section.

---

## 3. On-disk contract

As shipped in the example LO:

```
lo-config/lo-00-example/
  lo.json                              ← sections[] + modals: ["example-popup"]
  blocks/01-grammar/block.json         ← prose containing the modal link + an audio icon
  exercises/01-select/exercise.json
  modals/example-popup/modal.json      ← NEW
public/audio/lo-00-example/
  placeholder.m4a                      ← NEW (a placeholder clip, not real course audio)
```

`modals/` mirrors `blocks/` and `exercises/` exactly, so both readers extend by one glob
/ one directory read and `assembleLo` resolves refs through the machinery it already has
(`requireFile` + `parseFile`, which name the offending path on failure).

Audio referenced from an LO lives under `public/audio/<lo-slug>/`, kept separate from the
`public/audio/showcase-demo/` quarantine established by commit `4653917` so real course
audio never mixes with demo clips. Guarded by a test (§11).

---

## 4. Node types

```ts
type RichTextNode =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'strong'; readonly children: readonly RichTextNode[] }
  | { readonly kind: 'em'; readonly children: readonly RichTextNode[] }
  | { readonly kind: 'break' }
  | {
      readonly kind: 'modalLink';
      readonly target: string;
      readonly children: readonly RichTextNode[];
    }
  | { readonly kind: 'audio'; readonly soundFile: string; readonly label?: string };
```

Entity decoding covers the five XML entities (`&amp; &lt; &gt; &quot; &apos;`), `&nbsp;`,
and numeric references (`&#233;` / `&#xe9;`). An unrecognised `&foo;` is **left
verbatim** rather than guessed at — it is far more likely to be an author writing a bare
`&` than a named entity we forgot, and silently dropping text is worse than rendering it.

---

## 5. Parse-at-load contract

`assembleLo` parses every rich-text string while it validates. Consequences:

- A bad tag fails at load with the author-facing path, exactly like a bad schema does:
  `lo-config/lo-00-example/modals/tuvous/modal.json: unknown tag <storng> …`
- `AssembledLo` carries `RichTextNode[]`, never raw strings, so renderers cannot
  accidentally re-introduce an injection path.
- Part D's `renderToString` pre-render gets the same validated tree with no
  browser APIs involved — the parser is plain string work, no `DOMParser`.

`AssembledLo` gains `modals: Readonly<Record<string, ModalContent>>`, keyed by id.

**Where each field is parsed — an honest split (as built).** Modal content is parsed in
`assembleLo`, so R5 holds fully for modals. Block prose is parsed by
`TextBlockContentSchema`'s Zod `.transform()`, which runs where that per-type schema runs
— at RENDER, via `parseBlockContent`. That is a deliberate consequence of `BlockConfig.content`
being deliberately loose (Part C): the assembler does not know which block types carry
rich text, and teaching it would duplicate knowledge that already lives next to each
type's schema. Declaring the transform on the field keeps "this field is rich text" in
exactly one place per type.

**Cross-reference guard:** every `modalLink.target` must resolve to a declared modal.
Enforced in two places, because of the split above:

- **At load** (`assembleLo`) for modal-to-modal links — a bad target throws naming the file.
- **In CI** (`lo-rich-text.test.ts`) for links authored in block prose, which the assembler
  cannot see. That test walks every LO, parses its rich-text blocks through the same schema
  the renderer uses, and asserts every target resolves — so a dead button fails the build
  even though it cannot fail at load.

A future tightening that would collapse this into one place: move per-type block `content`
validation from render to load. That is a larger change touching all block renderers, and
is not in scope here.

---

## 6. Audio inside modals

`<span data-audio="audio/lo-00-example/tu.mp3"></span>` renders as:

```tsx
<AudioClip soundFile={soundFile} className="super-compact-speaker" inline />
```

`AudioClip`'s `super-compact-speaker` variant is the animated click-to-play speaker icon
already used by the shipped exercise engines — the same control the French LOs use inline
in content. It routes through `AudioManager`, so opening a modal and playing its clip
stops any clip playing elsewhere on the page, with no extra wiring.

Nothing new is built for audio. The one addition is the authoring surface: a `data-audio`
span, which the parser turns into the existing component. `data-audio-label` overrides the
control's accessible name when the default is not specific enough.

The element must be **empty** (`<span data-audio="…"></span>`). A speaker icon has no
text content; allowing children would invite authors to put the label inside, which
`AudioClip` would then ignore — a silent failure. Non-empty is an error.

---

## 7. Modal launch mechanics

```
ModalProvider (context: openId, open(id), close())
  └── page content
        └── ModalLink  → <button onClick={open(target)}>
  └── ModalHost → <Dialog open={openId !== null}> … resolves content by id
```

- **One `ModalHost`,** rendered once by the provider. A modal linked from three places
  renders one dialog, not three.
- **Context, not prop-drilling** — carry-forward Component Rendering Architecture rule #3
  puts modal/dialog state in context.
- **No document-level click delegation.** The carry-forward rule
  (`FUTURE_PROJECTS.md` §262 item 6) prescribes a single capture-phase listener resolving
  `.modal-link` clicks. That rule exists **because the reference injects raw HTML**, so
  React cannot own the click. We parse to React, so the link _is_ a component: a global
  listener would be strictly worse here — untyped, harder to test, and reliant on DOM
  attributes we already decoded. The rule's _intent_ (never wire per-render, resolve in
  one place) is preserved by `ModalProvider`.
- **`ModalLink` renders `<button type="button">`, not `<a>`.** It opens a dialog; it does
  not navigate. The carry-forward Modal-Link Authoring Rule mandates `href="#content"`
  purely to stop validators reporting a broken same-page fragment — a workaround for
  having to be an `<a>` at all. Emitting a real button removes the problem at the source:
  no fake href, correct role, keyboard behaviour for free. Authors keep writing the
  familiar `<a class="modal-link" data-modal-target="…">` spelling; the renderer decides
  the element. `href` on an authored modal link is ignored, and `class` beyond
  `modal-link` is ignored — presentation is the renderer's job.

---

## 8. Accessibility contract

Inherited free from Base UI's `Dialog` (already vendored at `src/components/ui/dialog.tsx`):
focus trap while open, Escape to close, focus restored to the trigger on close, correct
`role="dialog"` + `aria-modal`.

This spec adds:

- **Accessible name** — `title` renders as `DialogTitle`. Required and non-empty, so a
  dialog can never be nameless.
- **No heading-outline pollution.** The dialog title is a `DialogTitle` inside a portal,
  not an `<h2>`/`<h3>` in the page's outline, so semantic-structure spec §2's fixed
  h1→h2→h3 chain is untouched whether the modal is open or closed.
- **`lang` on the body** when `modal.lang` is set, wrapping only the content subtree —
  never the chrome, per semantic-structure §3.
- **Modal links are in the tab order** as buttons, and are reachable inside a collapsed
  accordion only when that accordion is open (native `<details>` handles this; no
  `aria-hidden` + CSS trap, per semantic-structure §5).
- **Audio controls** keep the accessible name `AudioClip` already gives them.

---

## 9. Why the parser is hand-rolled

`load-lo-glob.ts` runs **in the browser** (`import.meta.glob` inlines the JSON into the
bundle), so anything the loader imports ships to the client. `htmlparser2` — the obvious
battle-tested choice — brings four transitive deps (`domhandler`, `domelementtype`,
`domutils`, `entities`) to parse a six-tag inline grammar, against the performance rules'
bundle budget.

The mitigating design is R2's **closed allowlist with loud failure**: the parser's job is
to accept six known shapes and throw on everything else. It cannot silently mis-render
unknown input, because unknown input is an error. That makes a small hand-rolled parser
provable by tests in a way a general HTML parser would not need to be.

**Swap point:** if the grammar grows to block-level content — lists, tables, nested
structures (§12) — replace the tokenizer with `htmlparser2` and keep §4's node types and
the renderer unchanged. The node tree is the stable interface, not the parser.

---

## 10. Module layout

As built:

```
src/lo/rich-text/
  rich-text-nodes.ts       ← RichTextNode union (§4) + collectModalTargets / collectAudioPaths
  parse-rich-text.ts       ← HTML string → RichTextNode[], throws on anything off-allowlist
  RichText.tsx             ← RichTextNode[] → React
  modal/
    modal-context.ts       ← ModalContent + context + useModal (a .ts file, so the
                             react-refresh lint rule stays satisfied)
    ModalLink.tsx          ← <button> that opens a modal
    ModalProvider.tsx      ← open-id state + the single dialog host
src/config/lo-schema.ts    ← ModalConfigSchema + manifest `modals[]`
```

Two deviations from the first draft of this spec, both for consistency with what was
already there:

- `ModalConfigSchema` lives in `src/config/lo-schema.ts`, not a separate `modal-schema.ts`.
  Every other LO file schema (`BlockConfigSchema`, `ExerciseConfigSchema`, `LoManifestSchema`)
  is in that one module; a modal is one more LO file kind, so splitting it out would have
  been the odd one.
- There is no separate `ModalHost.tsx`. The host is ~20 lines of JSX that only ever renders
  from the provider's own state, so a second module would add a seam with nothing on the
  other side of it.

Rich text is its own folder rather than living under `blocks/`, because modals consume it
too and neither owns it.

---

## 11. Test plan

| Guard                       | Asserts                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parse-rich-text.test.ts`   | each allowlisted tag; nesting; entity decode incl. numeric; `<b>`/`<i>` rejected with a message naming the semantic replacement; unknown tag rejected; unclosed/mismatched tag rejected; non-empty audio span rejected; plain string → single text node (back-compat)                                                                                 |
| `RichText.test.tsx`         | nodes → expected DOM; audio node mounts `AudioClip`; modal link renders a `<button>`, not an `<a>`                                                                                                                                                                                                                                                    |
| `lo-page-sections.test.tsx` | block prose renders as rich text, not escaped literal markup: authored `<strong>` becomes an element and a modal link becomes a `type="button"`                                                                                                                                                                                                       |
| `lo-rich-text.test.ts`      | repo-wide, per LO: every `data-modal-target` (in modals AND block prose) resolves to a declared modal; every `data-audio` path is under `audio/<slug>/` **and** resolves to a real file in `public/` — mirroring `showcase-audio-assets.test.ts`. Plus: the example LO declares a modal, links to it from prose, and that modal carries an audio icon |

**No `ModalProvider.test.tsx`, deliberately.** The first draft of this plan promised unit
tests for "link opens the dialog; Escape closes; focus returns to the link". The suite runs
`environment: 'node'` with no DOM and no testing-library (see the comment in
`vite.config.ts`), and all four of those behaviours are **Base UI's**, not ours — adding
jsdom plus two dependencies to re-test a vendored primitive is not worth it. What IS ours
(the link renders a button, the host resolves content by id, one host for N links) is
covered statically above.

Those four behaviours were instead verified in the browser on 2026-08-04, against
`lo-00-example`: the prose button opened the dialog (`role="dialog"`, accessible name
"Example popup"); the audio icon inside the modal fetched
`/audio/lo-00-example/placeholder.m4a` (`206 Partial Content`); Escape closed the dialog and
`document.activeElement` returned to the `.modal-link` button; console clean.

TDD order used: parser → renderer → schema/loader → block wiring → example LO.

---

## 12. Deliberately not in v1

Extension points, listed so they are added as decisions rather than drift:

- **Block-level content in modals** — lists (`<ul>`/`<ol>`), tables, images. §4's node
  union and §9's swap point are where these land. Not needed by the example LO, and
  guessing the shape now would be speculative generality.
- **Deep-linking a modal** (`?modal=tuvous` or a hash). `ModalProvider` holds the open id
  in one place, so a URL sync is a later addition to one module. Note carry-forward
  anti-pattern #26 first: content addressing belongs in path slugs, so a modal id is a
  query/hash concern at most, never a route.
- **Rich text in exercise content.** The 12 engines have their own per-engine schemas and
  their own text handling; extending them is a separate, larger migration.
- **Nested modals** (a modal link inside a modal). The context holds a single open id, so
  this currently replaces rather than stacks. Left unspecified until something needs it.

---

## 13. Rejected alternatives

- **Sanitised `dangerouslySetInnerHTML` + DOMPurify.** Closest to the reference. Rejected
  because audio icons then cannot be React components — they would need a post-mount DOM
  hydration walk, which cannot run under Part D's `renderToString` — plus a ~20kb
  dep, a JSDOM shim for Node, and reversing a deliberate repo-wide decision.
- **Typed inline-node array as the authoring format** (`[{kind:'strong',…}]`). Safest and
  smallest to build, but authors write verbose JSON instead of markup. Rejected on
  authoring ergonomics: 15 LOs of prose will be written by hand.
- **A `modals` map inside `lo.json`.** Fewer files, matches the reference's page-level
  map. Rejected because it grows the manifest with prose content and breaks the
  `blocks/`/`exercises/` folder symmetry the loader is built around.
- **Modal content inside the linking block.** Maximum locality, but prevents reuse — the
  French LOs link one glossary modal (`tuvous`) from several places.
- **A `<Dialog>` per `ModalLink`.** No context needed, but N links to one modal means N
  dialog instances in the DOM, and it contradicts carry-forward rule #3.
- **Restoring `DemoModal`.** A standalone filler-text dialog demos chrome the authoring
  format cannot produce. Deleted in `5c9f19f`; this spec replaces it with a modal the
  example LO actually declares. See the Part C handover §4 resolution.

---

## 14. Block entries — lists, tables, the audio player (v2, 2026-10-06)

**Decision (maintainer, 2026-10-06):** lists and tables, plus a full-width audio player
beside the inline speaker icon, in **both** popups (`modal.json` `content[]`) and page prose
(`block.json` `content.text[]` for `prose` and `grammar`). One rule for authors: anything a
popup accepts, page prose accepts.

### Authoring

Each array entry is EITHER a paragraph of inline rich text (unchanged, §2) OR exactly one
block element, spanning the whole entry:

```json
"<ul><li>first <em>item</em></li><li>second</li></ul>",
"<ol><li>step one</li><li>step two</li></ol>",
"<table><caption>Present tense of être</caption><thead><tr><th>Pronoun</th><th>Form</th></tr></thead><tbody><tr><th>je</th><td>suis <span data-audio=\"audio/<slug>/suis.m4a\"></span></td></tr></tbody></table>",
"<span data-audio-player=\"audio/<slug>/dialogue.m4a\" data-audio-label=\"Listen to the dialogue\"></span>"
```

| Entry                                       | Renders as                                       | Rules (each a loud load/parse failure)                                                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<ul>` / `<ol>`                             | `<ul>` / `<ol>`                                  | only `<li>` children, at least one; each `<li>` holds inline rich text; **no nested lists** in v2; no attributes                                                                                                              |
| `<table>`                                   | `<table>` in a keyboard-scrollable, named region | **`<caption>` required** (it names the table and its scroll region); optional `<thead>`; `<tbody>` optional; `<tr>` of `<th>`/`<td>` holding inline rich text; at least one body row; every row the same width; no attributes |
| `<span data-audio-player data-audio-label>` | `AudioClip`'s native player, labelled            | must be the WHOLE entry; empty; `data-audio-label` required (it is the visible label); same `audio/<slug>/` + file-exists guard as `data-audio`                                                                               |

- **Header scope is the renderer's job, not the author's.** A `<th>` in `<thead>` renders
  `scope="col"`; a `<th>` is allowed in a body row only as its FIRST cell and renders
  `scope="row"`. Authored attributes on structural tags are rejected (closed allowlist).
- **Why caption is required.** A wide table scrolls sideways inside a narrow popup, and a
  scroll region must be focusable and named (axe `scrollable-region-focusable`); the caption
  is that name, and also what a screen reader announces on entering the table.
- **Why `<span data-audio-player>` and not `<audio>`.** It is the same family as
  `<span data-audio>` (same attributes, same guard), and like `a.modal-link` → `<button>`
  (§7) the authored spelling is a hook, not the rendered element. An authored `<audio>`
  would invite `controls`/`autoplay`/`<source>`, each needing rejection.
- **A block element inside a paragraph is an error**, with a message saying it must be its
  own entry — never silently flattened.

### Node types

The inline union (§4) is unchanged. Entries wrap it:

```ts
type RichTextEntry =
  | { kind: 'paragraph'; children: RichTextNode[] }
  | { kind: 'list'; ordered: boolean; items: RichTextNode[][] }
  | { kind: 'table'; caption: RichTextNode[]; head: TableCell[][]; body: TableCell[][] }
  | { kind: 'audioPlayer'; soundFile: string; label: string };
type TableCell = { header: boolean; scope?: 'col' | 'row'; children: RichTextNode[] };
```

`AssembledLo.modals[id].content` and `TextBlockContentSchema.text` carry
`RichTextEntry[]`. `parseRichText` (one inline string) is untouched; the new
`parseRichTextEntry` decides paragraph vs block and hands each `<li>`, `<caption>`,
`<th>` and `<td>` body to `parseRichText`.

### Amends R7 — still hand-rolled

§9 named `htmlparser2` as the swap point once block content arrived. Not taken: JS has
~2.3 kB of headroom against the < 100 kB budget (`docs/TOOLING.md`), and the block grammar is
still closed and tiny (seven structural tags, no attributes). The entry parser reuses the
inline tokenizer; the node types stay the stable interface, so the swap remains available.

### Examples

- **Example LO:** a `conjugation` popup linked from the grammar block, holding a paragraph
  with an inline speaker, a `<ul>`, an `<ol>`, a captioned table with a speaker in a cell,
  and the audio player; the grammar block itself gains a list and the player, so page
  prose shows the same shapes.
- **Showcase:** a "Rich text & popups" section rendering every entry kind, plus a button
  opening the same content as a popup — the authoring reference.

### Tests

`parse-rich-text-entry.test.ts` (every entry kind and every failure rule above, incl. block
inside a paragraph, nested list, missing caption, ragged rows, body `<th>` not first,
player not whole / non-empty / unlabelled); `RichTextEntries.test.tsx` (markup: `scope`,
caption, scroll region named by the caption, native player labelled); `lo-rich-text.test.ts`
extended so player paths meet the same guards and the example LO demonstrates every kind.
