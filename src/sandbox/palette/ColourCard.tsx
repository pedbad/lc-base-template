/**
 * ColourCard — ② of the brand board (§E19): one primitive as a client reads it. The
 * swatch shows "Aa" in the colour's partner; then the name, the job, the live HEX and
 * RGB, and the contrast with the partner. The token name — what a designer edits — is
 * one fold away, so a stakeholder is not handed `--cam-blue` first.
 *
 * Values are "—" until the page has been read (`live` is null in a server render).
 */
import { FOCUS_OUTLINE } from '@/components/shell/focus-outline';
import type { PrimitiveColour } from '../sandbox-catalog';
import { toHex, toRgbText } from './colour-math';
import { ContrastBadge, PLACEHOLDER } from './ContrastBadge';
import type { LiveColours } from './live-colours';
import { tokenValue } from './token-value';

interface ColourCardProps {
  readonly colour: PrimitiveColour;
  /** The partner's plain name, for the badge ("with Cambridge Dark Blue"). */
  readonly partnerName: string;
  readonly live: LiveColours | null;
}

export function ColourCard({ colour, partnerName, live }: ColourCardProps) {
  const rgb = live?.get(colour.token);
  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div
        aria-hidden="true"
        className="flex h-24 items-end border-b border-border p-3 font-heading text-3xl"
        style={{ background: tokenValue(colour.token), color: tokenValue(colour.partner) }}
      >
        Aa
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 text-sm">
        <h5 className="font-heading text-base font-semibold">{colour.name}</h5>
        <p className="text-muted-foreground">{colour.job}</p>
        <p className="font-mono text-xs tabular-nums">
          <span data-slot="hex">{rgb ? toHex(rgb) : PLACEHOLDER}</span>
          <span className="text-muted-foreground"> · {rgb ? toRgbText(rgb) : PLACEHOLDER}</span>
        </p>
        <ContrastBadge a={rgb} b={live?.get(colour.partner)} withName={partnerName} />
        <details className="mt-auto text-xs text-muted-foreground">
          <summary className={`w-fit cursor-pointer rounded-sm ${FOCUS_OUTLINE}`}>Token</summary>
          <p className="mt-1">
            <code>{colour.token}</code> in <code>src/styles/palette.css</code>
          </p>
        </details>
      </div>
    </li>
  );
}
