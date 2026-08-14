import type { LayerFrame } from "./zoom";

/**
 * How a waypoint arrives. "none" is for a waypoint that starts the track
 * already settled (nothing precedes it to fade in from) — currently only
 * the very first slot. "sibling" is the oversized, laterally-offset
 * entrance converging to centred/1x. "field-reveal" is the same shape but
 * centred throughout (no lateral offset) — used at the two category jumps
 * (star-field-as-galaxy, galaxy-as-cluster) per PLAN.md's two entrance
 * grammars.
 */
export type EntranceStyle = "none" | "sibling" | "field-reveal";

/** "none" is for a waypoint that holds forever once settled (currently only the last slot). */
export type ExitStyle = "none" | "shrink";

export interface SlotSpec {
  id: string;
  entrance: EntranceStyle;
  exit: ExitStyle;
  /** Which side a "sibling" entrance sweeps in from. Required (and only meaningful) for that style. */
  sign?: 1 | -1;
}

export interface PhaseDurations {
  /** vh: oversized, opacity 0 -> 1. */
  fadeIn: number;
  /** vh: scale/position converge to settled (1x, centred); opacity stays 1. */
  converge: number;
  /** vh: fully settled and readable. */
  hold: number;
  /** vh: settled -> vanishing point, fading out. */
  exitShrink: number;
}

export interface GapConfig {
  /**
   * vh between one waypoint's exit-shrink ending and the next's fade-in
   * starting, for a "sibling" entrance. Negative means the next slot starts
   * fading in before the previous one's exit-shrink finishes — a deliberate
   * small overlap rather than a hard empty gap.
   */
  sibling: number;
  /** Same, but for a "field-reveal" entrance. */
  fieldReveal: number;
}

interface RawFrame {
  vh: number;
  scale: number;
  x: number;
  y: number;
  opacity: number;
}

export interface RawSchedule {
  frames: Record<string, RawFrame[]>;
  /** Each waypoint's HUD/card settle point, in vh — the midpoint of its own fade-in-end and converge-end, matching how the hand-tuned schedule this replaces was already implicitly timed. */
  from: Map<string, number>;
  /** Total vh consumed so far — feed this back in as the next call's startVh to append more slots (e.g. reionization fog, the CMB, a closing layer) before normalising. */
  endVh: number;
}

export interface Schedule {
  frames: Record<string, LayerFrame[]>;
  from: Map<string, number>;
}

const OVERSIZED_SCALE: Record<"sibling" | "field-reveal", number> = { sibling: 2.2, "field-reveal": 2.6 };
const MID_SCALE: Record<"sibling" | "field-reveal", number> = { sibling: 2.0, "field-reveal": 2.4 };
// x/y here are a unit direction, not a vw/vh magnitude: how much of a
// "sibling" waypoint's own image pokes onto screen at entrance depends on
// that image's actual rendered size (its CSS size class, and whether the
// current viewport clamps it to a rem floor or a vmin/vw share), which this
// module has no access to — it only lays out timing/shape. main.ts's render
// loop multiplies this unit by a live, per-layer, per-viewport magnitude (see
// its ENTRANCE_PEEK_VW) so every waypoint shows the same small sliver of
// itself regardless of size group or viewport, instead of a flat vw/vh
// constant that was tuned against one waypoint's image and left far more
// than a sliver showing for larger ones (or on a narrower viewport).
const ENTRANCE_X = 1;
const ENTRANCE_Y = 0.14;
const MID_OFFSET_FRACTION = 0.8;

/**
 * Lay out a sequence of waypoint slots back-to-back in raw vh units (not
 * yet normalised to a 0-1 progress fraction — the caller may still be
 * appending more slots after this one). Replaces hand-picked-per-waypoint
 * keyframe arrays with named phase durations, so retiming the whole
 * journey (or changing the gap before a specific transition) is a
 * parameter change rather than a full re-derivation.
 */
export function buildSchedule(
  slots: SlotSpec[],
  durations: PhaseDurations,
  gaps: GapConfig,
  startVh = 0,
): RawSchedule {
  const frames: Record<string, RawFrame[]> = {};
  const from = new Map<string, number>();
  let cursor = startVh;

  slots.forEach((slot, i) => {
    const slotFrames: RawFrame[] = [];
    let convergeEnd = cursor;

    if (slot.entrance === "none") {
      slotFrames.push({ vh: cursor, scale: 1, x: 0, y: 0, opacity: 1 });
      from.set(slot.id, cursor);
    } else {
      const oversized = OVERSIZED_SCALE[slot.entrance];
      const mid = MID_SCALE[slot.entrance];
      const sign = slot.entrance === "sibling" ? (slot.sign ?? 1) : 0;
      const entranceX = sign * ENTRANCE_X;
      const entranceY = -sign * ENTRANCE_Y;

      const fadeInStart = cursor;
      const fadeInEnd = fadeInStart + durations.fadeIn;
      convergeEnd = fadeInEnd + durations.converge;

      slotFrames.push({ vh: fadeInStart, scale: oversized, x: entranceX, y: entranceY, opacity: 0 });
      slotFrames.push({
        vh: fadeInEnd,
        scale: mid,
        x: entranceX * MID_OFFSET_FRACTION,
        y: entranceY * MID_OFFSET_FRACTION,
        opacity: 1,
      });
      slotFrames.push({ vh: convergeEnd, scale: 1, x: 0, y: 0, opacity: 1 });

      from.set(slot.id, (fadeInEnd + convergeEnd) / 2);
    }

    const holdEnd = convergeEnd + durations.hold;
    slotFrames.push({ vh: holdEnd, scale: 1, x: 0, y: 0, opacity: 1 });
    cursor = holdEnd;

    if (slot.exit === "shrink") {
      const exitEnd = holdEnd + durations.exitShrink;
      slotFrames.push({ vh: exitEnd, scale: 0.05, x: 0, y: 0, opacity: 0 });
      cursor = exitEnd;
    }

    frames[slot.id] = slotFrames;

    const next = slots[i + 1];
    if (next) {
      cursor += next.entrance === "field-reveal" ? gaps.fieldReveal : gaps.sibling;
    }
  });

  return { frames, from, endVh: cursor };
}

/** Convert a RawSchedule's absolute vh positions into 0-1 track-progress fractions. */
export function normalizeSchedule(raw: RawSchedule, totalVh: number): Schedule {
  const frames: Record<string, LayerFrame[]> = {};
  for (const [id, rawFrames] of Object.entries(raw.frames)) {
    frames[id] = rawFrames.map(({ vh, scale, x, y, opacity }) => ({ t: vh / totalVh, scale, x, y, opacity }));
  }
  const from = new Map<string, number>();
  for (const [id, vh] of raw.from) from.set(id, vh / totalVh);
  return { frames, from };
}
