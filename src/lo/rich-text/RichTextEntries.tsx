/**
 * RichTextEntries — render parsed rich-text array entries (spec §14).
 *
 * A paragraph becomes a `<p>` around `RichText`; a list, table or audio player becomes
 * its own block element, never wrapped in a `<p>` (a `<ul>` inside a `<p>` is invalid
 * HTML). Used by both consumers of authored rich text — page prose (`TextBlock`) and
 * popups (`ModalProvider`) — so the two cannot drift apart.
 *
 * TABLES: header `scope` comes from the parsed cell (derived from position, never
 * authored). The table sits in a horizontally scrollable region because a wide table
 * in a narrow popup must scroll sideways, and a scroll region must be reachable by
 * keyboard and named (axe `scrollable-region-focusable`) — the required caption is that
 * name. `useId` keeps the caption id identical in the prerender and the first client
 * render.
 *
 * Styling: rich-text.css.
 */
import { useId } from 'react';
import { AudioClip } from '@/components/audio/AudioClip';
import { RichText } from './RichText';
import type { RichTextEntry, TableCell, TableEntry } from './rich-text-nodes';
import './rich-text.css';

function Cell({ cell }: { cell: TableCell }) {
  const body = <RichText nodes={cell.children} />;
  return cell.header ? <th scope={cell.scope}>{body}</th> : <td>{body}</td>;
}

function Rows({ rows }: { rows: readonly (readonly TableCell[])[] }) {
  // Static authored config, never reordered — index keys are stable.
  return rows.map((row, rowIndex) => (
    <tr key={rowIndex}>
      {row.map((cell, cellIndex) => (
        <Cell key={cellIndex} cell={cell} />
      ))}
    </tr>
  ));
}

function TableView({ entry }: { entry: TableEntry }) {
  const captionId = useId();
  return (
    // A focusable, named scroll region is the documented pattern for overflow content;
    // the region role is what makes the tab stop meaningful to assistive tech.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard-scrollable region (axe scrollable-region-focusable)
    <div className="rich-text-table-scroll" role="region" aria-labelledby={captionId} tabIndex={0}>
      <table className="rich-text-table">
        <caption id={captionId}>
          <RichText nodes={entry.caption} />
        </caption>
        {entry.head.length > 0 && (
          <thead>
            <Rows rows={entry.head} />
          </thead>
        )}
        <tbody>
          <Rows rows={entry.body} />
        </tbody>
      </table>
    </div>
  );
}

function EntryView({
  entry,
  paragraphClassName,
}: {
  entry: RichTextEntry;
  paragraphClassName?: string;
}) {
  switch (entry.kind) {
    case 'paragraph':
      return (
        <p className={paragraphClassName}>
          <RichText nodes={entry.children} />
        </p>
      );
    case 'list': {
      const List = entry.ordered ? 'ol' : 'ul';
      return (
        <List className="rich-text-list">
          {entry.items.map((item, index) => (
            // Static authored config, never reordered — index keys are stable.
            <li key={index}>
              <RichText nodes={item} />
            </li>
          ))}
        </List>
      );
    }
    case 'table':
      return <TableView entry={entry} />;
    case 'audioPlayer':
      return (
        <div className="rich-text-player">
          <AudioClip soundFile={entry.soundFile} listenText={entry.label} />
        </div>
      );
  }
}

interface RichTextEntriesProps {
  entries: readonly RichTextEntry[];
  /** Applied to paragraph `<p>`s only — the page and the popup style prose differently. */
  paragraphClassName?: string;
}

/** Render entries in authored order. */
export function RichTextEntries({ entries, paragraphClassName }: RichTextEntriesProps) {
  return entries.map((entry, index) => (
    // Static authored config, never reordered — index keys are stable.
    <EntryView key={index} entry={entry} paragraphClassName={paragraphClassName} />
  ));
}
