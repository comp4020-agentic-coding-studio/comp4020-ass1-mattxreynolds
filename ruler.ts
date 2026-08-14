const YEAR_SECONDS = 365.25 * 24 * 3600;

export function unitRegime(lookbackYears: number): string {
  const seconds = lookbackYears * YEAR_SECONDS;
  if (seconds < 60) return "seconds";
  if (lookbackYears < 1) return "minutes";
  if (lookbackYears < 1_000) return "years";
  if (lookbackYears < 1_000_000) return "millennia";
  if (lookbackYears < 1_000_000_000) return "millions of years";
  return "billions of years";
}

// Ruler steps only need a `from` threshold — decoupled from the full
// Waypoint shape so callers (and tests) can pass minimal objects.
export interface RulerStep {
  from?: number;
}

function segmentIndex(progress: number, staged: RulerStep[]): number {
  let index = 0;
  for (let i = 0; i < staged.length; i++) {
    if ((staged[i].from ?? 0) <= progress) index = i;
  }
  return index;
}

// Maps track progress (0-1) to a position along the ruler where every
// waypoint occupies an equal-length segment, regardless of how many
// orders of magnitude its real lookback time spans.
export function rulerFraction(progress: number, staged: RulerStep[]): number {
  const n = staged.length;
  const i = segmentIndex(progress, staged);
  const from = staged[i].from ?? 0;
  const nextFrom = i < n - 1 ? (staged[i + 1].from ?? 1) : 1;
  const span = nextFrom - from;
  const local = span === 0 ? 0 : (progress - from) / span;
  return (i + local) / n;
}

// Exact inverse of rulerFraction, used to turn a ruler click/drag position
// back into a track progress value to scroll to.
export function progressForRulerFraction(fraction: number, staged: RulerStep[]): number {
  const n = staged.length;
  const scaled = Math.min(Math.max(fraction, 0), 1) * n;
  const i = Math.min(Math.floor(scaled), n - 1);
  const local = scaled - i;
  const from = staged[i].from ?? 0;
  const nextFrom = i < n - 1 ? (staged[i + 1].from ?? 1) : 1;
  return from + local * (nextFrom - from);
}
