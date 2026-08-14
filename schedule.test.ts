import { describe, expect, it } from "vitest";
import { interpLayer } from "./zoom";
import { buildSchedule, normalizeSchedule, type GapConfig, type PhaseDurations, type SlotSpec } from "./schedule";

const DURATIONS: PhaseDurations = { fadeIn: 90, converge: 110, hold: 220, exitShrink: 170 };
const GAPS: GapConfig = { sibling: 100, fieldReveal: 220 };

/** Moon -> Sun, the smallest meaningful slice: a "none"-entrance first slot followed by one "sibling" entrance. */
const MOON_SUN: SlotSpec[] = [
  { id: "moon", entrance: "none", exit: "shrink" },
  { id: "sun", entrance: "sibling", exit: "shrink", sign: 1 },
];

/** A longer synthetic run covering every entrance/exit style, including a field-reveal transition. */
const FULL_RUN: SlotSpec[] = [
  { id: "a", entrance: "none", exit: "shrink" },
  { id: "b", entrance: "sibling", exit: "shrink", sign: 1 },
  { id: "c", entrance: "sibling", exit: "shrink", sign: -1 },
  { id: "d", entrance: "field-reveal", exit: "shrink" },
  { id: "e", entrance: "sibling", exit: "shrink", sign: 1 },
  { id: "f", entrance: "none", exit: "none" },
];

function opacityAt(frames: ReturnType<typeof normalizeSchedule>["frames"], id: string, t: number) {
  return interpLayer(frames[id], t).opacity;
}

/** First t (scanning forward from the slot's own fade-in start) where opacity reaches `threshold`. */
function firstTAtOpacity(
  frames: ReturnType<typeof normalizeSchedule>["frames"],
  id: string,
  threshold: number,
  fromT: number,
  toT: number,
) {
  const steps = 5000;
  for (let i = 0; i <= steps; i++) {
    const t = fromT + ((toT - fromT) * i) / steps;
    if (opacityAt(frames, id, t) >= threshold) return t;
  }
  return toT;
}

describe("buildSchedule", () => {
  it("lays out Moon -> Sun with Sun settling after Moon and no negative-length phases", () => {
    const raw = buildSchedule(MOON_SUN, DURATIONS, GAPS);
    expect(raw.from.get("moon")).toBe(0);
    expect(raw.from.get("sun")!).toBeGreaterThan(raw.from.get("moon")!);
    expect(raw.endVh).toBeGreaterThan(0);

    for (const id of ["moon", "sun"]) {
      const frames = raw.frames[id];
      for (let i = 1; i < frames.length; i++) {
        expect(frames[i].vh).toBeGreaterThanOrEqual(frames[i - 1].vh);
      }
    }
  });

  it("keeps Moon substantially gone before Sun becomes dominant", () => {
    const raw = buildSchedule(MOON_SUN, DURATIONS, GAPS);
    const { frames } = normalizeSchedule(raw, raw.endVh);

    const sunFadeInStart = raw.frames.sun[0].vh / raw.endVh;
    const sunFullyIn = raw.frames.sun[1].vh / raw.endVh;
    const sunDominantT = firstTAtOpacity(frames, "sun", 0.9, sunFadeInStart, sunFullyIn);
    const moonOpacityAtHandoff = opacityAt(frames, "moon", sunDominantT);

    expect(moonOpacityAtHandoff).toBeLessThanOrEqual(0.1);
  });

  it("gives every transition in a longer run (including a field-reveal) a non-simultaneous handoff", () => {
    const raw = buildSchedule(FULL_RUN, DURATIONS, GAPS);
    const { frames } = normalizeSchedule(raw, raw.endVh);

    for (let i = 0; i < FULL_RUN.length - 1; i++) {
      const outgoing = FULL_RUN[i].id;
      const incoming = FULL_RUN[i + 1].id;
      const incomingFrames = raw.frames[incoming];
      const incomingFadeInStart = incomingFrames[0].vh / raw.endVh;
      const incomingFullyIn = incomingFrames[1].vh / raw.endVh;

      const handoffT = firstTAtOpacity(frames, incoming, 0.9, incomingFadeInStart, incomingFullyIn);
      const outgoingOpacityAtHandoff = opacityAt(frames, outgoing, handoffT);

      expect(outgoingOpacityAtHandoff).toBeLessThanOrEqual(0.1);
    }
  });

  it("gives field-reveal transitions a bigger gap than sibling transitions", () => {
    const raw = buildSchedule(FULL_RUN, DURATIONS, GAPS);

    const cExitEnd = raw.frames.c[raw.frames.c.length - 1].vh; // sibling -> sibling gap precedes d? no: c -> d is sibling->field-reveal
    const dFadeInStart = raw.frames.d[0].vh;
    const siblingishGap = dFadeInStart - cExitEnd;

    const bExitEnd = raw.frames.b[raw.frames.b.length - 1].vh;
    const cFadeInStart = raw.frames.c[0].vh;
    const siblingGap = cFadeInStart - bExitEnd;

    expect(siblingishGap).toBeGreaterThan(siblingGap);
    expect(siblingishGap).toBeCloseTo(GAPS.fieldReveal, 5);
    expect(siblingGap).toBeCloseTo(GAPS.sibling, 5);
  });

  it("keeps a deliberate negative (overlapping) gap from becoming a simultaneous handoff", () => {
    // Only the first slot uses a "none" entrance (real usage: only ever the
    // very first waypoint, which nothing transitions into) — a negative gap
    // before an already-settled "none" slot isn't a meaningful overlap, so
    // this run keeps every transition target real (sibling/field-reveal).
    const OVERLAP_RUN: SlotSpec[] = [
      { id: "a", entrance: "none", exit: "shrink" },
      { id: "b", entrance: "sibling", exit: "shrink", sign: 1 },
      { id: "c", entrance: "sibling", exit: "shrink", sign: -1 },
      { id: "d", entrance: "field-reveal", exit: "shrink" },
      { id: "e", entrance: "sibling", exit: "shrink", sign: 1 },
    ];
    // Both negative now: field-reveal transitions deliberately overlap more
    // than sibling ones (the outgoing point is meant to read as already part
    // of the incoming field, not just handed off to it) — production values.
    const overlapGaps: GapConfig = { sibling: -30, fieldReveal: -40 };
    const raw = buildSchedule(OVERLAP_RUN, DURATIONS, overlapGaps);
    const { frames } = normalizeSchedule(raw, raw.endVh);

    for (let i = 0; i < OVERLAP_RUN.length - 1; i++) {
      const outgoing = OVERLAP_RUN[i].id;
      const incoming = OVERLAP_RUN[i + 1].id;
      const incomingFrames = raw.frames[incoming];
      const incomingFadeInStart = incomingFrames[0].vh / raw.endVh;
      const incomingFullyIn = incomingFrames[1].vh / raw.endVh;

      const handoffT = firstTAtOpacity(frames, incoming, 0.9, incomingFadeInStart, incomingFullyIn);
      const outgoingOpacityAtHandoff = opacityAt(frames, outgoing, handoffT);

      expect(outgoingOpacityAtHandoff).toBeLessThanOrEqual(0.1);
    }
  });

  it("never lets exit or hold phases be shorter than their configured duration", () => {
    const raw = buildSchedule(FULL_RUN, DURATIONS, GAPS);
    for (const slot of FULL_RUN) {
      const frames = raw.frames[slot.id];
      if (slot.exit === "shrink") {
        const holdEnd = frames[frames.length - 2].vh;
        const exitEnd = frames[frames.length - 1].vh;
        expect(exitEnd - holdEnd).toBeCloseTo(DURATIONS.exitShrink, 5);
      }
    }
  });
});
