/**
 * LineMatchConnectors.tsx — the SVG curved connector lines for line-match's desktop
 * layout (engine #7, 7b). Presentational: given a measured layout (dot centre points)
 * and the current connections, it draws one cubic-bezier line per connection — green
 * once a connection is checked correct, accent otherwise — plus the recoil lines that
 * animate back toward their source when a wrong answer is checked.
 *
 * Ported from french-lo-1's renderDesktopConnectors, typed. Colours map the source's
 * --ex-active/--edu-affirm/--destructive to the template's --primary/--success/
 * --destructive (with color-mix glows). Pure render — all measurement, connection and
 * recoil state lives in the engine.
 *
 * Spec: docs/specs/2026-06-19-exercise-engines-design.md §7, §8.
 */
export interface Point {
  x: number;
  y: number;
}

export interface ConnectorLayout {
  width: number;
  height: number;
  sourcePoints: Record<string, Point>;
  targetPoints: Record<string, Point>;
}

export interface RecoilingConnection {
  sourceId: string;
  targetId: string;
}

const ACTIVE_STROKE = 'var(--primary)';
const ACTIVE_GLOW = 'color-mix(in oklab, var(--primary) 26%, transparent)';
const CORRECT_STROKE = 'var(--success)';
const CORRECT_GLOW = 'color-mix(in oklab, var(--success) 28%, transparent)';
const RECOIL_STROKE = 'var(--destructive)';
const RECOIL_GLOW = 'color-mix(in oklab, var(--destructive) 24%, transparent)';

/** A cubic bezier from source to target with horizontal control handles. */
const buildConnectorPath = (source: Point, target: Point): string => {
  const handle = Math.max(48, Math.abs(target.x - source.x) * 0.36);
  return [
    `M ${source.x} ${source.y}`,
    `C ${source.x + handle} ${source.y},`,
    `${target.x - handle} ${target.y},`,
    `${target.x} ${target.y}`,
  ].join(' ');
};

interface ConnectorPath {
  id: string;
  d: string;
  isCorrect: boolean;
}

interface LineMatchConnectorsProps {
  layout: ConnectorLayout | null;
  /** sourceId → targetId. */
  connections: Record<string, string>;
  checkedResults: Record<string, boolean>;
  recoiling: RecoilingConnection[];
  /** 0 → 1; the wrong line retracts from target back to source as this rises. */
  recoilProgress: number;
}

export function LineMatchConnectors({
  layout,
  connections,
  checkedResults,
  recoiling,
  recoilProgress,
}: LineMatchConnectorsProps) {
  if (!layout) return null;

  const paths: ConnectorPath[] = Object.entries(connections)
    .map(([sourceId, targetId]) => {
      const source = layout.sourcePoints[sourceId];
      const target = layout.targetPoints[targetId];
      if (!source || !target) return null;
      return {
        id: `${sourceId}-${targetId}`,
        d: buildConnectorPath(source, target),
        isCorrect: checkedResults[sourceId] === true,
      };
    })
    .filter((path): path is ConnectorPath => path !== null);

  const recoilPaths = recoiling
    .map(({ sourceId, targetId }) => {
      const source = layout.sourcePoints[sourceId];
      const target = layout.targetPoints[targetId];
      if (!source || !target) return null;
      const animatedTarget: Point = {
        x: target.x + (source.x - target.x) * recoilProgress,
        y: target.y + (source.y - target.y) * recoilProgress,
      };
      return { id: `${sourceId}-${targetId}`, d: buildConnectorPath(source, animatedTarget) };
    })
    .filter((path): path is { id: string; d: string } => path !== null);

  if (paths.length === 0 && recoilPaths.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      height={layout.height}
      width={layout.width}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
    >
      {paths.map((path) => (
        <g key={`connector-${path.id}`}>
          <path
            d={path.d}
            fill="none"
            strokeLinecap="round"
            strokeWidth="9"
            stroke={path.isCorrect ? CORRECT_GLOW : ACTIVE_GLOW}
          />
          <path
            d={path.d}
            fill="none"
            strokeLinecap="round"
            strokeWidth="4"
            stroke={path.isCorrect ? CORRECT_STROKE : ACTIVE_STROKE}
          />
        </g>
      ))}
      {recoilPaths.map((path) => (
        <g key={`recoil-${path.id}`}>
          <path d={path.d} fill="none" strokeLinecap="round" strokeWidth="9" stroke={RECOIL_GLOW} />
          <path
            d={path.d}
            fill="none"
            strokeLinecap="round"
            strokeWidth="4"
            stroke={RECOIL_STROKE}
          />
        </g>
      ))}
    </svg>
  );
}
