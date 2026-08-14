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
// slot has no side of its own to break that pattern. Moon now gets a real
// sibling entrance too (previously "none", since it used to be the first
// thing on screen with nothing to fade in from — no longer true now the
// title precedes it): oversized -> settled, same as every other waypoint
// (Matt's follow-up feedback that Moon's custom small-to-big entrance read
// wrong — "the same as everything else" means big-to-small like everyone
// else, not a bespoke curve). Starting its sign at -1 keeps the alternation
// unbroken into sun:+1 below.
const POINT_SOURCE_SLOTS: SlotSpec[] = [
  { id: "moon", entrance: "sibling", exit: "shrink", sign: -1 },
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

// The title layer holds at a large resting size, then shrinks away while
// fading — the same "exit: shrink" shape every waypoint uses on its way out
// (scale 1 -> 0.05, opacity 1 -> 0), just starting from a bigger base scale
// since the title has no entrance of its own to establish scale from (it's
// already on screen at t=0). (Matt's final adjustment to this layer: it
// previously scaled UP while fading, meant to read as the camera pushing
// through it since it sits nearer than the Moon — reverted because it read
// as inconsistent with the rest of the site's shrink-to-exit language; this
// now matches that flow instead.) TITLE_EXIT reuses fadeIn+converge rather
// than a new constant, just to give the title's own exit the same order of
// magnitude as every other waypoint's entrance/exit phases.
const TITLE_SCALE = 1.8;
const TITLE_HOLD = 240;
const TITLE_EXIT = DURATIONS.fadeIn + DURATIONS.converge;
const TITLE_EXIT_END = TITLE_HOLD + TITLE_EXIT;

// Moon doesn't start growing in until the title is almost gone, not
// concurrently with the title's own fade-out starting (Matt's follow-up
// feedback after reviewing the first pass) — so its own fade-in starts
// well into the title's own (fixed-length, TITLE_EXIT_END) fade window,
// ~85% through it, where the title is down to roughly 15% opacity. Feeding
// this straight in as buildSchedule's startVh gives Moon's own "sibling"
// entrance (fadeIn+converge = TITLE_EXIT, same as everyone else) an end
// point identical to the old fixed pointStartVh, so nothing downstream
// (Sun onward) shifts.
const MOON_ENTRANCE_START = TITLE_HOLD + TITLE_EXIT * 0.85;

// The closing text (formerly the standalone `.payoff` section) is one more
// schedule slot after the CMB, per PLAN.md Task 7. Matt's follow-up
// feedback: the CMB shouldn't hold forever with the text overlaid on it —
// it should fade OUT, leaving only the text, and the text shouldn't start
// arriving until the CMB is nearly gone (not concurrently with the fade-out
// starting). CMB_FADE_OUT is that opacity 1 -> 0 ramp.
const CMB_FADE_OUT = 130;

// The closing text's entrance mirrors the title's exit in reverse — starts
// oversized and fades in while shrinking down to its settled size (scale 1),
// the same "big -> small" shape every waypoint uses, rather than a flat
// opacity-only fade. CLOSING_SCALE matches TITLE_SCALE so the opening and
// closing bookends read as the same visual language. It starts 85% through
// the CMB's own fade-out (mirroring MOON_ENTRANCE_START's identical
// relationship to the title's fade-out above), so there's a brief near-black
// beat — the wall essentially gone — before the text arrives, rather than
// the two crossfading against each other for their full length.
const CLOSING_SCALE = TITLE_SCALE;
const CLOSING_FADE_IN = DURATIONS.fadeIn + DURATIONS.converge;

function buildSiteSchedule() {
  const point = buildSchedule(POINT_SOURCE_SLOTS, DURATIONS, GAPS, MOON_ENTRANCE_START);

  const jadesFrames = point.frames["jades-gs-z14-0"];
  const jadesHoldEnd = jadesFrames[3].vh;
  const jadesExitEnd = jadesFrames[4].vh;

  // The fog starts closing in the moment the last galaxy begins its exit —
  // it's an atmospheric shift, not a competing point-object, so it doesn't
  // need the sibling/field-reveal gap treatment.
  const fogFadeInEnd = jadesHoldEnd + FOG_FADE_IN;
  const fogHoldEnd = fogFadeInEnd + FOG_HOLD;
  const crossfadeEnd = fogHoldEnd + FOG_CMB_CROSSFADE;
  const cmbSettledEnd = crossfadeEnd + CMB_HOLD;
  const cmbFadeOutEnd = cmbSettledEnd + CMB_FADE_OUT;
  const closingStart = cmbSettledEnd + CMB_FADE_OUT * 0.85;
  const totalVh = closingStart + CLOSING_FADE_IN;

  const frames = {
    ...point.frames,
    // Not a staged waypoint (no distance/lookback of its own) — a text-only
    // prelude layer rendered directly by main.ts, outside the
    // WAYPOINTS/staged/HUD/ruler/callout machinery entirely.
    title: [
      { vh: 0, scale: TITLE_SCALE, x: 0, y: 0, opacity: 1 },
      { vh: TITLE_HOLD, scale: TITLE_SCALE, x: 0, y: 0, opacity: 1 },
      { vh: TITLE_EXIT_END, scale: 0.05, x: 0, y: 0, opacity: 0 },
    ],
    "reionization-fog": [
      { vh: jadesHoldEnd, scale: 1, x: 0, y: 0, opacity: 0 },
      { vh: fogFadeInEnd, scale: 1, x: 0, y: 0, opacity: 1 },
      { vh: fogHoldEnd, scale: 1, x: 0, y: 0, opacity: 1 },
      { vh: crossfadeEnd, scale: 1, x: 0, y: 0, opacity: 0 },
    ],
    // Settles at full opacity, holds, then fades back OUT — the ending is the
    // text alone, not the text overlaid on a wall that never leaves.
    cmb: [
      { vh: fogHoldEnd, scale: 1, x: 0, y: 0, opacity: 0 },
      { vh: crossfadeEnd, scale: 1, x: 0, y: 0, opacity: 1 },
      { vh: cmbSettledEnd, scale: 1, x: 0, y: 0, opacity: 1 },
      { vh: cmbFadeOutEnd, scale: 1, x: 0, y: 0, opacity: 0 },
    ],
    // Text-only closer, same non-waypoint treatment as `title` — no
    // distance/lookback, rendered directly by main.ts outside the
    // WAYPOINTS/staged/HUD/ruler/callout machinery. Mirrors the title's own
    // exit frame shape (a single scale+opacity ramp, oversized -> settled),
    // just running forwards (fading in) instead of backwards (fading out).
    closing: [
      { vh: closingStart, scale: CLOSING_SCALE, x: 0, y: 0, opacity: 0 },
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
    // The HUD's CMB card leaves in step with the CMB image itself rather
    // than lingering into the text-only ending — hidden from the moment the
    // CMB starts fading out, same as the wall it's describing.
    hudExitStart: cmbSettledEnd / totalVh,
  };
}

export const SITE_SCHEDULE = buildSiteSchedule();
