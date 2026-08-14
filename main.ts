import andromedaImg from "./assets/andromeda.png";
import cmbImg from "./assets/cmb.png";
import gnz11Img from "./assets/gn-z11.png";
import jadesImg from "./assets/jades-gs-z14-0.png";
import milkyWayImg from "./assets/milky-way.png";
import moonImg from "./assets/moon.png";
import proximaImg from "./assets/proxima-centauri.png";
import reionizationFogImg from "./assets/reionization-fog.png";
import q3c273Img from "./assets/3c273.png";
import sunImg from "./assets/sun.png";
import vegaImg from "./assets/vega.png";
import virgoImg from "./assets/virgo-cluster.png";
import { progressForRulerFraction, rulerFraction } from "./ruler";
import { SITE_SCHEDULE } from "./site-schedule";
import { uniformStarfield } from "./starfield";
import { WAYPOINTS } from "./waypoints";
import { clampProgress, currentWaypoint, dampedScale, interpLayer, type LayerFrame, type LayerState } from "./zoom";

// Leader-line anchor offsets (px, from the object's own screen-space centre)
// for each waypoint's measurement card (name/distance/lookback + gated
// anchor) — the only card still positioned this way. The identity card ("what
// is this") is a cursor-following hover tooltip instead (see
// wireIdentityHover) — no fixed offset, no leader line, since it appears
// wherever the cursor already is. Covers all 12 waypoints now, including
// reionization fog and the CMB (Matt's request — they used to stay on the
// fixed `.hud` permanently; see PLAN.md for the superseded reasoning).
//
// Every waypoint's magnitude clears its own image at rest — large enough that
// the card's box doesn't overlap the ~34vmin-wide image (or, for fog/CMB, the
// full-bleed/oversized backdrop) — but which quadrant (top/bottom-left/right)
// each card sits in is Matt's explicit per-waypoint call, not a derived rule:
// moon top-left, sun top-right, proxima-centauri top-left, vega bottom-right,
// sagittarius-a bottom-left, andromeda bottom-left, virgo-cluster
// bottom-right, 3c273 bottom-right, gn-z11 bottom-left, jades-gs-z14-0
// bottom-right, reionization-fog top-left, cmb bottom-right.
const CARD_OFFSETS: Record<string, { x: number; y: number }> = {
  moon: { x: -460, y: -130 },
  sun: { x: 360, y: -140 },
  "proxima-centauri": { x: -580, y: -168 },
  vega: { x: 280, y: 160 },
  "sagittarius-a": { x: -500, y: 150 },
  andromeda: { x: -460, y: 150 },
  "virgo-cluster": { x: 500, y: 150 },
  "3c273": { x: 240, y: 120 },
  "gn-z11": { x: -460, y: 130 },
  "jades-gs-z14-0": { x: 460, y: 140 },
  "reionization-fog": { x: -480, y: -170 },
  cmb: { x: 560, y: 170 },
};

// Identity card ("what is this") appears at the cursor while hovering the
// waypoint's own image, rather than tracking scroll progress — `position:
// fixed`, moved with mousemove, so it uses raw client coordinates directly.
// Flips to the other side of the cursor if it would run off the viewport
// edge, same idea as a standard tooltip.
function wireIdentityHover(img: HTMLElement, card: HTMLElement) {
  const margin = 20;
  const place = (clientX: number, clientY: number) => {
    const rect = card.getBoundingClientRect();
    let x = clientX + margin;
    let y = clientY + margin;
    if (x + rect.width > window.innerWidth - margin) x = clientX - rect.width - margin;
    if (y + rect.height > window.innerHeight - margin) y = clientY - rect.height - margin;
    card.style.left = `${Math.max(margin, x)}px`;
    card.style.top = `${Math.max(margin, y)}px`;
  };
  img.addEventListener("mouseenter", (event) => {
    card.hidden = false;
    place(event.clientX, event.clientY);
  });
  img.addEventListener("mousemove", (event) => {
    place(event.clientX, event.clientY);
  });
  img.addEventListener("mouseleave", () => {
    card.hidden = true;
  });
}

// All 12 waypoints (Moon through the CMB) — build order complete, see
// TASKS.md/PLAN.md. Two entrance grammars alternate deliberately: sibling
// body (offset + oversized, converging in) for same-kind neighbours, field
// reveal (centred, no lateral offset, shrinking as a whole) at the two
// category jumps — star-field-as-galaxy at Sagittarius A*, galaxy-as-cluster
// at Virgo Cluster. The reionization fog and the CMB share the same
// LAYER_MARKUP/LAYER_FRAMES machinery as every other waypoint, but each gets
// a CSS size override (see styles.css): the fog is full-bleed, filling the
// whole stage rather than sitting as a centred object, and the CMB renders
// much larger than the default waypoint size. Their frames (built in
// site-schedule.ts, not by the generic generator) are opacity-only ramps
// with scale/position held — the fog ramps up, holds, then fades out
// exactly as the CMB fades in (a synchronised crossfade), and the CMB then
// holds at full opacity through the end of the track (interpLayer holds the
// last keyframe past its t) rather than fading out, so it's still on screen
// as `.payoff` begins. A separate,
// generic starfield backdrop (see STARFIELD_FRAMES) sits behind every layer
// from the very start and fades out over the fog's own fade-in window.
const LAYER_MARKUP: Record<string, string> = {
  moon: `<img src="${moonImg}" alt="The Moon" />`,
  sun: `<img src="${sunImg}" alt="The Sun" />`,
  "proxima-centauri": `<img src="${proximaImg}" alt="Proxima Centauri" />`,
  vega: `<img src="${vegaImg}" alt="Vega" />`,
  "sagittarius-a": `<img src="${milkyWayImg}" alt="The Milky Way's Core" />`,
  andromeda: `<img src="${andromedaImg}" alt="The Andromeda Galaxy" />`,
  "virgo-cluster": `<img src="${virgoImg}" alt="The Virgo Cluster" />`,
  "3c273": `<img src="${q3c273Img}" alt="Quasar 3C 273" />`,
  "gn-z11": `<img src="${gnz11Img}" alt="GN-z11" />`,
  "jades-gs-z14-0": `<img src="${jadesImg}" alt="JADES-GS-z14-0" />`,
  "reionization-fog": `<img src="${reionizationFogImg}" alt="The reionization fog" />`,
  cmb: `<img src="${cmbImg}" alt="The Cosmic Microwave Background" />`,
};

// Keyframes are generated, not hand-picked — see site-schedule.ts for the
// concrete durations/gaps and schedule.ts for the generator itself. Sibling
// body entrances carry an x/y offset that converges to 0; field reveals
// (sagittarius-a, virgo-cluster) hold x/y at 0 throughout and only scale
// down, per PLAN.md's two entrance grammars.
const LAYER_FRAMES: Record<string, LayerFrame[]> = SITE_SCHEDULE.schedule.frames;

// A generic starfield backdrop sits behind every waypoint from t=0, then
// fades out over exactly the reionization fog's own fade-in window — the
// fog is what finally has no stars left showing through it.
const STARFIELD_FRAMES: LayerFrame[] = [
  { t: 0, scale: 1, x: 0, y: 0, opacity: 1 },
  { t: SITE_SCHEDULE.starfieldFadeStart, scale: 1, x: 0, y: 0, opacity: 1 },
  { t: SITE_SCHEDULE.starfieldFadeEnd, scale: 1, x: 0, y: 0, opacity: 0 },
];

const track = document.querySelector<HTMLElement>('[data-testid="track"]');
const starfieldEl = document.querySelector<HTMLElement>('[data-testid="starfield"]');
const layersEl = document.querySelector<HTMLElement>('[data-testid="layers"]');
// Static markup (see index.html), not JS-created — its h1 needs to be real,
// present-in-the-built-HTML markup for spec/invariants.test.ts's "exactly
// one top-level heading" check, which parses dist/index.html directly
// without executing main.ts. main.ts only animates it (see render()),
// the same way it only positions the existing `.hud` markup rather than
// creating that from scratch either. A later sibling of `.layers` in the
// DOM, so it paints on top of every waypoint layer inside — including
// Moon, which per PLAN.md Task 6 the title sits in front of.
const titleLayer = document.querySelector<HTMLElement>('[data-testid="title-layer"]');
// Same static-markup rationale as titleLayer above (nothing here needs to be
// in the built HTML for a spec check, but it's the former standalone
// `.payoff` section's copy, kept as real markup rather than JS-injected
// text). A later sibling still, so it paints on top of the CMB layer.
const closingLayer = document.querySelector<HTMLElement>('[data-testid="closing-layer"]');
const hudEl = document.querySelector<HTMLElement>('[data-testid="hud"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const hudName = document.querySelector<HTMLElement>('[data-testid="hud-name"]');
const hudDistance = document.querySelector<HTMLElement>('[data-testid="hud-distance"]');
const hudLookback = document.querySelector<HTMLElement>('[data-testid="hud-lookback"]');
const hudAnchor = document.querySelector<HTMLElement>('[data-testid="hud-anchor"]');
const rulerSegmentsEl = document.querySelector<HTMLElement>('[data-testid="ruler-segments"]');
const rulerInput = document.querySelector<HTMLInputElement>('[data-testid="ruler-input"]');
const calloutsEl = document.querySelector<HTMLElement>('[data-testid="callouts"]');
const identityMobileEl = document.querySelector<HTMLElement>('[data-testid="identity-mobile"]');
const identityMobileText = document.querySelector<HTMLElement>('[data-testid="identity-mobile-text"]');

// Mobile-only "what is this?" card: desktop's identity tooltip only appears
// on hover (see wireIdentityHover), which doesn't exist on touch, so mobile
// gets its own always-rendered card instead. Offset (px, from the object's
// own live screen-space centre) works exactly like CARD_OFFSETS — consumed
// via the object's live x/y/scale transform, not a static screen position —
// so the card "attaches" to the image: it slides in from the same side and
// grows/shrinks the same way, at Matt's request, rather than fading in place.
// x stays 0 for every waypoint (the card sits centred above the image, so it
// sways with the same live sibling-entrance sweep the image itself gets,
// rather than needing its own per-waypoint side). y is grouped by the
// image's own rendered mobile size (see styles.css's `.layer img` rules): the
// four sibling-body waypoints sized by the base clamp (~224px tall on a
// 390px-wide phone) get the Moon's proven -180; the six field/point-source
// waypoints bumped to `min(92vw, cap)` on mobile (~359px tall) get a larger
// -250 to clear that bigger footprint; the fog/CMB veils have no discrete
// object to clear but fill the same screen area, so they use the same -250.
const MOBILE_IDENTITY_OFFSETS: Record<string, { x: number; y: number }> = {
  moon: { x: 0, y: -180 },
  sun: { x: 0, y: -200 },
  "proxima-centauri": { x: 0, y: -200 },
  vega: { x: 0, y: -200 },
  "sagittarius-a": { x: 0, y: -250 },
  andromeda: { x: 0, y: -250 },
  "virgo-cluster": { x: 0, y: -250 },
  "3c273": { x: 0, y: -250 },
  "gn-z11": { x: 0, y: -250 },
  "jades-gs-z14-0": { x: 0, y: -250 },
  "reionization-fog": { x: 0, y: -250 },
  cmb: { x: 0, y: -250 },
};

// `from` (each waypoint's HUD/ruler settle point) isn't intrinsic waypoint
// data — it's computed by the schedule generator (see site-schedule.ts) and
// merged in here, once, at startup.
const staged = WAYPOINTS.map((waypoint) => ({
  ...waypoint,
  from: SITE_SCHEDULE.schedule.from.get(waypoint.id),
})).filter(
  (waypoint): waypoint is typeof waypoint & { from: number } =>
    waypoint.from !== undefined && Boolean(LAYER_FRAMES[waypoint.id]),
);
const HAS_CARD_IDS = new Set(Object.keys(CARD_OFFSETS));

// The progress fraction at which the very first waypoint's entrance actually
// starts (its own first keyframe, opacity still 0) — a fixed point on the
// schedule, not a live opacity read, so it only ever gates the title lead-in
// and never re-triggers on a later waypoint's own crossfade dip. See
// hud-not-started in render().
const FIRST_ENTRANCE_START = LAYER_FRAMES[staged[0]?.id ?? ""]?.[0]?.t ?? 0;

// Shared by both callout kinds: position a card's static leader-line dog-leg
// from its fixed offset (derived once here, not recomputed per frame).
function positionLeaderLine(card: HTMLElement, offset: { x: number; y: number }) {
  const leaderH = card.querySelector<HTMLElement>(".callout-leader-h");
  const leaderV = card.querySelector<HTMLElement>(".callout-leader-v");
  const dx = -offset.x;
  const dy = -offset.y;
  if (leaderH) {
    leaderH.style.left = `${Math.min(0, dx)}px`;
    leaderH.style.width = `${Math.abs(dx)}px`;
  }
  if (leaderV) {
    leaderV.style.left = `${dx}px`;
    leaderV.style.top = `${Math.min(0, dy)}px`;
    leaderV.style.height = `${Math.abs(dy)}px`;
  }
  // The card's damped scale (see dampedScale in zoom.ts) needs to shrink
  // toward the object it's pointing at, not toward its own box centre --
  // otherwise the leader line's far end drifts off the object as soon as
  // scale != 1, and the card reads as shrinking in place rather than
  // receding toward the same vanishing point as its object. Anchoring
  // transform-origin at the leader line's own endpoint (dx, dy) keeps that
  // point screen-stationary under scale, since it's mathematically
  // invariant to the scale factor once translate and transform-origin
  // share the same point.
  card.style.transformOrigin = `${dx}px ${dy}px`;
}

if (starfieldEl) {
  starfieldEl.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      ${uniformStarfield({ seed: 11 })}
    </svg>`;
}

if (track && layersEl) {
  // The track's length is a consequence of the schedule (how many
  // waypoints, how long each phase/gap is), not a number tuned by hand in
  // CSS — set it here from the one source of truth.
  track.style.height = `${SITE_SCHEDULE.trackHeightVh}vh`;

  const layerEls = new Map<string, HTMLElement>();
  for (const waypoint of staged) {
    const layer = document.createElement("div");
    layer.className = "layer";
    layer.dataset.id = waypoint.id;
    layer.innerHTML = LAYER_MARKUP[waypoint.id];
    layersEl.appendChild(layer);
    layerEls.set(waypoint.id, layer);
  }

  // Ruler segments span all 12 staged waypoints (not just this slice's
  // Moon/Sun callouts) — the equal-length-per-waypoint mapping and the
  // "ends where the track ends" endcap only mean something against the
  // real, full-length track.
  const rulerSegmentEls: HTMLElement[] = [];
  if (rulerSegmentsEl) {
    for (const waypoint of staged) {
      const segment = document.createElement("div");
      segment.className = "ruler-segment";
      segment.dataset.id = waypoint.id;
      rulerSegmentsEl.appendChild(segment);
      rulerSegmentEls.push(segment);
    }
    rulerSegmentsEl.setAttribute("aria-hidden", "true");
  }

  // Diegetic callouts: all 12 waypoints now, including fog/cmb (see
  // CARD_OFFSETS). The measurement card's leader-line dog-leg is static local
  // geometry — derived
  // once here from the fixed offset, not recomputed per frame — while the
  // card itself is repositioned every frame in render() via --callout-x/-y to
  // track the object's live entrance/exit motion. The identity card has no
  // leader line and isn't scroll-positioned at all — see wireIdentityHover.
  const calloutEls = new Map<string, HTMLElement>();
  const identityCardEls = new Map<string, HTMLElement>();
  if (calloutsEl) {
    for (const waypoint of staged) {
      const offset = CARD_OFFSETS[waypoint.id];
      if (!offset) continue;

      const callout = document.createElement("div");
      callout.className = "callout";
      callout.dataset.id = waypoint.id;
      callout.hidden = true;
      callout.innerHTML = `
        <div class="callout-leader-h"></div>
        <div class="callout-leader-v"></div>
        <p class="callout-name">${waypoint.name}</p>
        <p class="callout-distance">${waypoint.distanceLabel}</p>
        <p class="callout-lookback">You are seeing light that left ${waypoint.lookbackLabel}</p>
        <p class="callout-anchor-static-label">In human terms</p>
        <p class="callout-anchor-static-text">${waypoint.anchor}</p>
      `;
      positionLeaderLine(callout, offset);
      calloutsEl.appendChild(callout);
      calloutEls.set(waypoint.id, callout);

      // Identity card: hover-triggered tooltip over the waypoint's own image,
      // positioned at the cursor — core information, not the
      // relatable-comparison flourish the gated anchor is, so no gate, but
      // also no need to compete for permanent on-screen space. Only rendered
      // where whatIsIt exists.
      const img = layerEls.get(waypoint.id)?.querySelector("img");
      if (waypoint.whatIsIt && img) {
        const identityCard = document.createElement("div");
        identityCard.className = "callout callout-identity";
        identityCard.dataset.id = waypoint.id;
        identityCard.hidden = true;
        identityCard.innerHTML = `
          <p class="callout-identity-label">What is this?</p>
          <p class="callout-identity-text">${waypoint.whatIsIt}</p>
        `;
        calloutsEl.appendChild(identityCard);
        identityCardEls.set(waypoint.id, identityCard);
        wireIdentityHover(img, identityCard);
      }
    }
  }

  const trackMetrics = () => {
    const rect = track.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const scrollable = track.offsetHeight - window.innerHeight;
    return { rect, trackTop, scrollable };
  };

  // How far off-screen a "sibling" waypoint's entrance offset (see
  // schedule.ts's ENTRANCE_X/Y comment) needs to be depends on that
  // waypoint's own rendered image width as a share of the viewport — the
  // three CSS size classes (moon/medium/big) and the mobile media query's rem
  // vs. vw-share floors all render differently. `offsetWidth` reflects that
  // live, viewport-driven CSS size (unaffected by the transform's `scale`,
  // which only affects paint, not layout), so measuring it here means the
  // sliver visible at entrance stays consistent across size class and
  // viewport without hand-tuning a constant per waypoint. It only needs
  // re-measuring on resize, not every scroll frame, since it's driven by CSS
  // clamp()/media-query values, not scroll position.
  const baseHalfWidthVw = new Map<string, number>();
  const measureEntranceHalfWidths = () => {
    for (const [id, layer] of layerEls) {
      const img = layer.querySelector<HTMLElement>("img");
      if (!img) continue;
      baseHalfWidthVw.set(id, (img.offsetWidth / window.innerWidth) * 50);
    }
  };
  measureEntranceHalfWidths();

  // The vw of a "sibling" waypoint's own image left visible at its most
  // oversized (entrance/exit) moment — small enough to read as "just the
  // edge", not so small the sliver disappears entirely at the more modest
  // mid-entrance scale.
  const ENTRANCE_PEEK_VW = 4;

  // Title/closing (see LAYER_FRAMES.title/.closing in site-schedule.ts) rest
  // at TITLE_SCALE/CLOSING_SCALE, a resting scale tuned for desktop's
  // headroom: their text box is capped at 32rem (see .layer-title/.layer-closing
  // in styles.css) but only actually narrower than the viewport on wide
  // screens — on a phone-width viewport the box already fills the full
  // width, so scaling it up at all overflows. Cap the applied scale to
  // whatever the current viewport can afford instead of hardcoding a
  // breakpoint, so this self-corrects on resize too.
  const TEXT_LAYER_MAX_WIDTH = 512; // matches .layer-title/.layer-closing's 32rem
  const maxSafeTextLayerScale = () => {
    const boxWidth = Math.min(window.innerWidth, TEXT_LAYER_MAX_WIDTH);
    return boxWidth > 0 ? window.innerWidth / boxWidth : 1;
  };

  const stateMap = new Map<string, LayerState>();
  let lastId: string | null = null;
  // Cached so the resize handler below can restore it after the viewport
  // changes — the track is sized in vh (see trackHeightVh above), so a
  // resize (rotating a phone, resizing the window, or a mobile browser's
  // chrome hiding/showing) changes both the track's pixel height and
  // window.innerHeight while window.scrollY (an absolute pixel count) stays
  // put. Left alone, that shifts (scrollY - trackTop) / scrollable on every
  // resize, snapping the animation to a different waypoint the user never
  // scrolled to.
  let lastProgress = 0;

  const render = () => {
    const { rect, trackTop, scrollable } = trackMetrics();
    const progress = clampProgress(scrollable > 0 ? (window.scrollY - trackTop) / scrollable : 0);
    lastProgress = progress;

    document.documentElement.classList.toggle(
      "track-visible",
      rect.top < window.innerHeight && rect.bottom > 0,
    );

    if (starfieldEl) {
      starfieldEl.style.opacity = String(interpLayer(STARFIELD_FRAMES, progress).opacity);
    }

    if (titleLayer) {
      const titleState = interpLayer(LAYER_FRAMES.title, progress);
      const scale = Math.min(titleState.scale, maxSafeTextLayerScale());
      titleLayer.style.transform = `scale(${scale})`;
      titleLayer.style.opacity = String(titleState.opacity);
    }

    if (closingLayer) {
      const closingState = interpLayer(LAYER_FRAMES.closing, progress);
      const scale = Math.min(closingState.scale, maxSafeTextLayerScale());
      closingLayer.style.transform = `scale(${scale})`;
      closingLayer.style.opacity = String(closingState.opacity);
    }

    const current = currentWaypoint(progress, staged);

    // Segments already scrolled past dim relative to what's ahead, so the
    // ruler itself reads as a progress cue, not just a static key.
    const currentIndex = staged.indexOf(current);
    rulerSegmentEls.forEach((segment, i) => {
      segment.classList.toggle("past", i < currentIndex);
      segment.classList.toggle("current", i === currentIndex);
    });

    for (const waypoint of staged) {
      const layer = layerEls.get(waypoint.id);
      if (!layer) continue;
      const rawState = interpLayer(LAYER_FRAMES[waypoint.id], progress);
      // rawState.x/y are the unit direction from schedule.ts (0 for
      // non-"sibling" entrances) — scale by this waypoint's own measured
      // half-width so the same small sliver shows at entrance regardless of
      // its CSS size class or the current viewport's clamp/media-query floor.
      const magnitude = 50 - ENTRANCE_PEEK_VW + (baseHalfWidthVw.get(waypoint.id) ?? 0) * rawState.scale;
      const state = { ...rawState, x: rawState.x * magnitude, y: rawState.y * magnitude };
      stateMap.set(waypoint.id, state);
      layer.style.transform = `translate(${state.x}vw, ${state.y}vh) scale(${state.scale})`;
      layer.style.opacity = String(state.opacity);

      // Hover only hits an image once it's actually visible — otherwise a
      // transparent, off-held waypoint sitting at the same screen position
      // (e.g. mid-crossfade) could silently swallow the hover meant for its
      // neighbour.
      const identityCard = identityCardEls.get(waypoint.id);
      if (identityCard) {
        const img = layer.querySelector<HTMLElement>("img");
        const hoverable = state.opacity > 0.01;
        if (img) {
          img.style.pointerEvents = hoverable ? "auto" : "none";
          img.style.cursor = hoverable ? "help" : "";
        }
        // If the object fades away while its tooltip is still open (e.g. the
        // user scrolls on without moving the mouse), force it closed rather
        // than leaving a stale card floating over the next waypoint.
        if (!hoverable && !identityCard.hidden) identityCard.hidden = true;
      }
    }

    const hasCard = HAS_CARD_IDS.has(current.id);

    // Same "highest live opacity wins" tracking as identityMobileEl below —
    // `current` switches over well after a new waypoint's fade-in has
    // finished (see currentWaypoint's `from`, the midpoint of fadeInEnd and
    // convergeEnd in schedule.ts), so gating the HUD's own fade/sink on
    // `current` would only ever show the very first waypoint's entrance;
    // every other one would pop straight to full size. Tracking live opacity
    // instead lets the mobile bottom sheet sink into the bottom edge as its
    // waypoint fades out and grow back up out of it as the next one fades
    // in, matching the image crossfade it sits under.
    let hudBestId: string | null = null;
    let hudBestState: LayerState | null = null;
    let hudBestOpacity = 0;
    for (const waypoint of staged) {
      const candidate = stateMap.get(waypoint.id);
      if (candidate && candidate.opacity > hudBestOpacity) {
        hudBestOpacity = candidate.opacity;
        hudBestId = waypoint.id;
        hudBestState = candidate;
      }
    }
    const hudWaypoint = (hudBestId ? staged.find((w) => w.id === hudBestId) : undefined) ?? current;

    if (hudName) hudName.textContent = hudWaypoint.name;
    if (hudDistance) hudDistance.textContent = hudWaypoint.distanceLabel;
    if (hudLookback) hudLookback.textContent = `You are seeing light that left ${hudWaypoint.lookbackLabel}`;
    if (hudAnchor) hudAnchor.textContent = hudWaypoint.anchor;
    if (hudEl) {
      const hudLift = hudBestState?.opacity ?? 0;
      hudEl.style.opacity = String(hudLift);
      // Only consumed inside the mobile media query's `.hud` transform (see
      // styles.css) — desktop's `.hud` never reads --hud-lift, and is always
      // hud-suppressed besides (every waypoint has a diegetic callout there),
      // so this has no effect above the 768px breakpoint.
      hudEl.style.setProperty("--hud-lift", String(hudLift));
      hudEl.classList.toggle("hud-suppressed", hasCard);
      // No progress-based "closing beat" cutoff here any more — the CMB card
      // (the last waypoint) now leaves the same way every other waypoint's
      // card does, riding hudLift down to 0 as the CMB image itself fades
      // out, instead of the abrupt display:none this used to force the
      // instant that fade-out began. interpLayer clamps to the CMB's own
      // last frame (opacity 0) for the rest of the scroll, so hudLift simply
      // stays 0 through the closing text — no separate hide needed.
      // `current` defaults to the Moon (staged[0]) from progress 0 — before
      // the title has even started fading out and long before the Moon's own
      // entrance begins — so without this, mobile's always-on HUD (it has no
      // hasCard suppression, see hud-suppressed's comment above) shows "The
      // Moon" at the bottom of the title screen. Desktop never showed this
      // because every waypoint has a card, so hud-suppressed already hid it
      // there; mobile has nothing else gating it. Gated on a fixed progress
      // threshold rather than current's own live opacity — an opacity read
      // also dips near-zero during ordinary mid-track crossfades (the
      // outgoing waypoint fading out just before the incoming one officially
      // becomes `current`), which briefly blanked the HUD on every waypoint
      // handoff, not just the title lead-in.
      hudEl.classList.toggle("hud-not-started", progress < FIRST_ENTRANCE_START);
    }

    if (identityMobileEl && identityMobileText) {
      // Driven by whichever waypoint is currently most opaque, not by
      // `current` (currentWaypoint's own switch-over point sits past a new
      // waypoint's fade-in — see its `from` in schedule.ts, the midpoint of
      // fadeInEnd and convergeEnd, both after opacity has already reached 1)
      // — gating on `current` meant only the very first waypoint (already
      // `current` by default from progress 0) ever showed its fade-in; every
      // other waypoint's card would sit hidden through the entrance, showing
      // only the outgoing card's fade-out, then snap straight to full opacity
      // the instant `current` flipped. Tracking live opacity instead makes
      // the shared card follow whichever waypoint's own entrance/exit ramp is
      // currently on top, so every waypoint's fade-in is visible, not just
      // the first one.
      let bestId: string | null = null;
      let bestState: LayerState | null = null;
      let bestOpacity = 0;
      for (const id of Object.keys(MOBILE_IDENTITY_OFFSETS)) {
        const candidate = stateMap.get(id);
        if (candidate && candidate.opacity > bestOpacity) {
          bestOpacity = candidate.opacity;
          bestId = id;
          bestState = candidate;
        }
      }
      const waypoint = bestId ? staged.find((w) => w.id === bestId) : undefined;
      const state = bestState;
      const offset = bestId ? MOBILE_IDENTITY_OFFSETS[bestId] : undefined;
      // No separate closing-beat cutoff, same reasoning as the HUD above —
      // the CMB card fades out on its own live opacity (bestOpacity below)
      // as the CMB image itself fades, rather than being force-hidden the
      // instant that fade-out starts.
      const visible = Boolean(offset) && Boolean(waypoint?.whatIsIt) && bestOpacity > 0.01;
      identityMobileEl.hidden = !visible;
      if (visible && state && offset) {
        identityMobileText.textContent = waypoint?.whatIsIt ?? "";
        identityMobileEl.style.opacity = String(state.opacity);
        // Scale the offset itself by the object's own opacity: at full opacity
        // the card sits fully clear of the image, but as opacity fades toward
        // 0 (entering or exiting) the offset fades toward 0 too, so the card
        // converges onto the object's own position instead of just shrinking
        // in place at a fixed spot while everything around it moves.
        const px = (state.x / 100) * window.innerWidth + offset.x * state.opacity;
        const py = (state.y / 100) * window.innerHeight + offset.y * state.opacity;
        identityMobileEl.style.setProperty("--identity-x", `${px}px`);
        identityMobileEl.style.setProperty("--identity-y", `${py}px`);
        identityMobileEl.style.setProperty("--identity-scale", String(dampedScale(state.scale)));
      }
    }

    // Each callout crossfades on its own object's own fade, rather than
    // snapping visible/hidden on the coarse current-waypoint cutover — this
    // is what stops Moon's card sitting at full strength while Sun is
    // already substantially faded in (and vice versa on the way out).
    const positionCard = (card: HTMLElement, state: LayerState, offset: { x: number; y: number }) => {
      const visible = state.opacity > 0.01;
      card.hidden = !visible;
      if (visible) {
        card.style.opacity = String(state.opacity);
        const px = (state.x / 100) * window.innerWidth + offset.x;
        const py = (state.y / 100) * window.innerHeight + offset.y;
        card.style.setProperty("--callout-x", `${px}px`);
        card.style.setProperty("--callout-y", `${py}px`);
        card.style.setProperty("--callout-scale", String(dampedScale(state.scale)));
      }
    };
    for (const [id, callout] of calloutEls) {
      const state = stateMap.get(id);
      const offset = CARD_OFFSETS[id];
      if (!state || !offset) continue;
      positionCard(callout, state, offset);
    }

    if (rulerInput) {
      rulerInput.value = String(rulerFraction(progress, staged));
      rulerInput.setAttribute("aria-valuetext", `${current.name}, light from ${current.lookbackLabel}`);
    }

    if (current.id !== lastId) {
      lastId = current.id;
      if (status) status.textContent = `Now viewing: ${current.name}, light from ${current.lookbackLabel}.`;
    }
  };

  render();
  window.addEventListener("scroll", render, { passive: true });
  window.addEventListener("resize", () => {
    // Re-measure before restoring scroll/re-rendering: a resize can cross the
    // 768px mobile breakpoint or otherwise change what each image's CSS
    // clamp()/media query resolves to, so the entrance-offset magnitude needs
    // fresh numbers, not the ones from the old viewport.
    measureEntranceHalfWidths();
    // Restore the pre-resize progress against the new metrics, rather than
    // just re-rendering at whatever scrollY the resize happened to leave us
    // at — see lastProgress's comment above.
    const { trackTop, scrollable } = trackMetrics();
    window.scrollTo({ top: trackTop + lastProgress * scrollable });
    render();
  });

  if (rulerInput) {
    rulerInput.addEventListener("input", () => {
      const { trackTop, scrollable } = trackMetrics();
      const progress = progressForRulerFraction(Number(rulerInput.value), staged);
      window.scrollTo({ top: trackTop + progress * scrollable });
    });
  }
}
