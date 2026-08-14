import { buildSchedule, normalizeSchedule, type GapConfig, type PhaseDurations, type SlotSpec } from "./schedule";

// Durations per PLAN.md, retuned after the first full rollout read as
// slightly too long per-waypoint (Matt's live-scroll feedback) — trimmed
// each phase down rather than just the hold, so the whole cycle feels
// tighter, not just the readable part. `hold` trimmed again on its own
// (170 -> 145) per a second round of feedback that the fully-settled,
// nothing-changing beat still ran a little long relative to everything
// either arriving or leaving.
const DURATIONS: PhaseDurations = { fadeIn: 75, converge: 90, hold: 145, exitShrink: 140 };

// Sibling transitions overlap a little more than the first retune (-25 ->
// -30) per Matt's follow-up "very very slightly more" feedback. Field-reveal
// now overlaps too (60 -> -40) rather than pausing before the field
// appears: the ask was for the outgoing point to read as already part of
// the incoming field/cluster rather than fully vanishing first, so its
// exit-shrink and the field's fade-in now genuinely coincide, the same way
// sibling transitions do, just with a deeper overlap since a point
// "joining" a field it's about to be revealed as part of should linger
// longer than one sibling object handing off to the next.
const GAPS: GapConfig = { sibling: -30, fieldReveal: -40 };

// The two entrance grammars alternate per PLAN.md: sibling body (offset +
// oversized, converging in, alternating side) for same-kind neighbours,
// field reveal (centred, no lateral offset) at the two category jumps —
// star-field-as-galaxy at Sagittarius A*, galaxy-as-cluster at Virgo
// Cluster. Signs continue alternating straight through both field-reveal
// waypoints (vega:+1 ... andromeda:-1 ... 3c273:+1), since a field-reveal
// slot has no side of its own to break that pattern.
const POINT_SOURCE_SLOTS: SlotSpec[] = [
  { id: "moon", entrance: "none", exit: "shrink" },
  { id: "sun", entrance: "sibling", exit: "shrink", sign: 1 },
  { id: "proxima-centauri", entrance: "sibling", exit: "shrink", sign: -1 },
  { id: "vega", entrance: "sibling", exit: "shrink", sign: 1 },
  { id: "sagittarius-a", entrance: "field-reveal", exit: "shrink" },
  { id: "andromeda", entrance: "sibling", exit: "shrink", sign: -1 },
  { id: "virgo-cluster", entrance: "field-reveal", exit: "shrink" },
  { id: "3c273", entrance: "sibling", exit: "shrink", sign: 1 },
  { id: "gn-z11", entrance: "sibling", exit: "shrink", sign: -1 },
  { id: "jades-gs-z14-0", entrance: "sibling", exit: "shrink", sign: 1 },
];

// Reionization fog and the CMB aren't discrete converging objects — they're
// full-bleed, opacity-only backdrop ramps — so they sit outside
// buildSchedule's sibling/field-reveal grammar and are appended by hand,
// timed off the point-source schedule's own cursor so the whole journey is
// still one source of truth. Both holds trimmed slightly (250 -> 210,
// 160 -> 135) alongside DURATIONS.hold, for the same reason: these are
// static, nothing-changing beats too, not fade/crossfade phases.
const FOG_FADE_IN = 110;
const FOG_HOLD = 210;
const FOG_CMB_CROSSFADE = 110;
const CMB_HOLD = 135;

function buildSiteSchedule() {
  const point = buildSchedule(POINT_SOURCE_SLOTS, DURATIONS, GAPS);

  const jadesFrames = point.frames["jades-gs-z14-0"];
  const jadesHoldEnd = jadesFrames[3].vh;
  const jadesExitEnd = jadesFrames[4].vh;

  // The fog starts closing in the moment the last galaxy begins its exit —
  // it's an atmospheric shift, not a competing point-object, so it doesn't
  // need the sibling/field-reveal gap treatment.
  const fogFadeInEnd = jadesHoldEnd + FOG_FADE_IN;
  const fogHoldEnd = fogFadeInEnd + FOG_HOLD;
  const crossfadeEnd = fogHoldEnd + FOG_CMB_CROSSFADE;
  const totalVh = crossfadeEnd + CMB_HOLD;

  const frames = {
    ...point.frames,
    "reionization-fog": [
      { vh: jadesHoldEnd, scale: 1, x: 0, y: 0, opacity: 0 },
      { vh: fogFadeInEnd, scale: 1, x: 0, y: 0, opacity: 1 },
      { vh: fogHoldEnd, scale: 1, x: 0, y: 0, opacity: 1 },
      { vh: crossfadeEnd, scale: 1, x: 0, y: 0, opacity: 0 },
    ],
    cmb: [
      { vh: fogHoldEnd, scale: 1, x: 0, y: 0, opacity: 0 },
      { vh: crossfadeEnd, scale: 1, x: 0, y: 0, opacity: 1 },
      { vh: totalVh, scale: 1, x: 0, y: 0, opacity: 1 },
    ],
  };

  const from = new Map(point.from);
  // The fog becomes the current HUD entry once the previous galaxy is
  // basically gone (not once the fog itself is half-visible) — it's a
  // backdrop change, not an arrival.
  from.set("reionization-fog", jadesExitEnd);
  from.set("cmb", (fogHoldEnd + crossfadeEnd) / 2);

  const schedule = normalizeSchedule({ frames, from, endVh: totalVh }, totalVh);

  return {
    schedule,
    trackHeightVh: totalVh,
    starfieldFadeStart: jadesHoldEnd / totalVh,
    starfieldFadeEnd: fogFadeInEnd / totalVh,
  };
}

export const SITE_SCHEDULE = buildSiteSchedule();
