/**
 * hover-context.ts — the LO's hover cards, keyed by id, for every HoverTerm on the page
 * (TODO §D17). Mirrors the modal context: assembleLo parses `hovers/<id>/hover.json`
 * at load; App mounts the provider once. No open state lives here — each term owns its
 * own card.
 */
import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { RichTextNode } from '../rich-text-nodes';

export interface HoverContent {
  /** The declared id, which `data-hover-target` refers to. */
  readonly id: string;
  readonly title?: string;
  /** A repo path, shown in words and drawn as a folder tree. */
  readonly path?: string;
  /** One line of inline rich text each, already parsed. */
  readonly content: readonly (readonly RichTextNode[])[];
  /** Set when the text is target-language content (WCAG 3.1.2). */
  readonly lang?: string;
}

type HoverCards = Readonly<Record<string, HoverContent>>;

const HoverContext = createContext<HoverCards>({});

/** Makes the LO's hover cards available to every HoverTerm below it. */
export function HoverProvider({ hovers, children }: { hovers: HoverCards; children: ReactNode }) {
  return createElement(HoverContext.Provider, { value: hovers }, children);
}

/** The card a term points at, or undefined when none is declared (a guard prevents it). */
export function useHoverCard(id: string): HoverContent | undefined {
  return useContext(HoverContext)[id];
}
