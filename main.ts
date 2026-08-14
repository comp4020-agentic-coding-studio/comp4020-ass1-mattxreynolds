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
// Moon only for now (see TASKS.md) before rolling out to the rest, same as
// the bottom-sheet HUD.
const MOBILE_IDENTITY_OFFSETS: Record<string, { x: number; y: number }> = {
  moon: { x: 0, y: -180 },
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

  const render = () => {
    const { rect, trackTop, scrollable } = trackMetrics();
    const progress = clampProgress(scrollable > 0 ? (window.scrollY - trackTop) / scrollable : 0);

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
      const state = interpLayer(LAYER_FRAMES[waypoint.id], progress);
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

    if (hudName) hudName.textContent = current.name;
    if (hudDistance) hudDistance.textContent = current.distanceLabel;
    if (hudLookback) hudLookback.textContent = `You are seeing light that left ${current.lookbackLabel}`;
    if (hudAnchor) hudAnchor.textContent = current.anchor;
    if (hudEl) {
      hudEl.classList.toggle("hud-suppressed", hasCard);
      // Unlike hud-suppressed (a desktop-only concern: a diegetic callout has
      // taken over), this is "we've reached the closing beat" — true on every
      // viewport, so it can't ride the same desktop-gated CSS rule.
      hudEl.classList.toggle("hud-ended", progress >= SITE_SCHEDULE.hudExitStart);
    }

    if (identityMobileEl && identityMobileText) {
      const state = stateMap.get(current.id);
      const offset = MOBILE_IDENTITY_OFFSETS[current.id];
      const visible =
        Boolean(offset) &&
        Boolean(current.whatIsIt) &&
        (state?.opacity ?? 0) > 0.01 &&
        progress < SITE_SCHEDULE.hudExitStart;
      identityMobileEl.hidden = !visible;
      if (visible && state && offset) {
        identityMobileText.textContent = current.whatIsIt ?? "";
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
  window.addEventListener("resize", render);

  if (rulerInput) {
    rulerInput.addEventListener("input", () => {
      const { trackTop, scrollable } = trackMetrics();
      const progress = progressForRulerFraction(Number(rulerInput.value), staged);
      window.scrollTo({ top: trackTop + progress * scrollable });
    });
  }
}
