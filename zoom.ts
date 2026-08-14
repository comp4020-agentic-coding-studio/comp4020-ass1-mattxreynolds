export interface LayerFrame {
  t: number;
  scale: number;
  x: number;
  y: number;
  opacity: number;
}

export interface LayerState {
  scale: number;
  x: number;
  y: number;
  opacity: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpLayer(frames: LayerFrame[], t: number): LayerState {
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (t <= first.t) return { scale: first.scale, x: first.x, y: first.y, opacity: first.opacity };
  if (t >= last.t) return { scale: last.scale, x: last.x, y: last.y, opacity: last.opacity };

  let lower = first;
  let upper = last;
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].t >= t) {
      lower = frames[i - 1];
      upper = frames[i];
      break;
    }
  }

  const span = upper.t - lower.t;
  const localT = span === 0 ? 0 : (t - lower.t) / span;
  return {
    scale: lerp(lower.scale, upper.scale, localT),
    x: lerp(lower.x, upper.x, localT),
    y: lerp(lower.y, upper.y, localT),
    opacity: lerp(lower.opacity, upper.opacity, localT),
  };
}

export function clampProgress(p: number): number {
  return Math.min(Math.max(p, 0), 1);
}

// Decoupled from the Waypoint type — `from` (a rendering concern, not an
// intrinsic fact about the object) lives entirely in the generated
// schedule, so callers pass whatever shape they've merged it into.
export function currentWaypoint<T extends { from?: number }>(progress: number, waypoints: T[]): T {
  const staged = waypoints.filter((w) => w.from !== undefined);
  let current = staged[0];
  for (const waypoint of staged) {
    if ((waypoint.from ?? 0) <= progress) current = waypoint;
  }
  return current;
}
