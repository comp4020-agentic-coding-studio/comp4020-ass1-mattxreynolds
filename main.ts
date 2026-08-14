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
// wherever the cursor already is. Covers all 10 point-source waypoints
// (Moon through JADES-GS-z14-0); reionization fog and the CMB stay on the
// existing always-visible `.hud` block permanently.
//
// Offsets are tuned per waypoint on two axes, not a shared constant: (1)
// clearing the object's own image entirely — large enough magnitude that the
// card's box doesn't overlap the ~34vmin-wide image at rest, using the open
// screen space instead of crowding the object — and (2) avoiding each
// waypoint's own entrance sweep: every sibling-body waypoint's card sits on
// the side opposite its own LAYER_FRAMES entrance x sign, since a same-side
// card would sit directly in the path of (or run off-screen with) its own
// oversized entrance. Field-reveal waypoints (sagittarius-a, virgo-cluster)
// have no lateral entrance sweep to dodge, so their side just continues the
// left/right alternation; their offset magnitude is larger to clear the
// bigger oversized scale (2.6x vs 2.2x) they briefly hold at. Vertical sign
// alternates between every adjacent pair (not tied to side) so no two
// waypoints' cards can stack on each other during a crossfade even when they
// land on the same side.
const CARD_OFFSETS: Record<string, { x: number; y: number }> = {
  moon: { x: -460, y: -130 },
  sun: { x: -480, y: 140 },
  "proxima-centauri": { x: 460, y: -130 },
  vega: { x: -460, y: 140 },
  "sagittarius-a": { x: 500, y: -150 },
  andromeda: { x: 460, y: 150 },
  "virgo-cluster": { x: -500, y: -150 },
  "3c273": { x: -460, y: 140 },
  "gn-z11": { x: 460, y: -130 },
  "jades-gs-z14-0": { x: -460, y: 140 },
};

// A single click/tap listener drives every anchor-fact reveal (no hover) —
// modern browsers normalise touch taps to `click` with no double-fire, so
// this is immune to the double-toggle risk a hover/tap split would have on
// hybrid touchscreen-laptop devices. Reused as-is for the CMB wall-cause
// reveal later; no changes needed here for that.
function wireReveal(trigger: HTMLButtonElement, content: HTMLElement) {
  let revealed = false;
  const apply = () => {
    trigger.setAttribute("aria-expanded", String(revealed));
    content.classList.toggle("revealed", revealed);
  };
  trigger.addEventListener("click", () => {
    revealed = !revealed;
    apply();
  });
  return {
    collapse: () => {
      revealed = false;
      apply();
    },
  };
}

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
const hudAnchorReveal = document.querySelector<HTMLButtonElement>('[data-testid="hud-anchor-reveal"]');
const rulerSegmentsEl = document.querySelector<HTMLElement>('[data-testid="ruler-segments"]');
const rulerInput = document.querySelector<HTMLInputElement>('[data-testid="ruler-input"]');
const calloutsEl = document.querySelector<HTMLElement>('[data-testid="callouts"]');

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
const GATED_IDS = new Set(Object.keys(CARD_OFFSETS));

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

  // Diegetic callouts: all 10 point-source waypoints (see CARD_OFFSETS). The
  // measurement card's leader-line dog-leg is static local geometry — derived
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

  const hudAnchorRevealCtl =
    hudAnchorReveal && hudAnchor ? wireReveal(hudAnchorReveal, hudAnchor) : null;

  const trackMetrics = () => {
    const rect = track.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const scrollable = track.offsetHeight - window.innerHeight;
    return { rect, trackTop, scrollable };
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
      titleLayer.style.transform = `scale(${titleState.scale})`;
      titleLayer.style.opacity = String(titleState.opacity);
    }

    if (closingLayer) {
      const closingState = interpLayer(LAYER_FRAMES.closing, progress);
      closingLayer.style.transform = `scale(${closingState.scale})`;
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

    const gated = GATED_IDS.has(current.id);

    if (hudName) hudName.textContent = current.name;
    if (hudDistance) hudDistance.textContent = current.distanceLabel;
    if (hudLookback) hudLookback.textContent = `You are seeing light that left ${current.lookbackLabel}`;
    if (hudAnchor) {
      hudAnchor.textContent = current.anchor;
      hudAnchor.classList.toggle("gated", gated);
    }
    if (hudAnchorReveal) hudAnchorReveal.hidden = !gated;
    if (hudEl) hudEl.classList.toggle("hud-suppressed", gated || progress >= SITE_SCHEDULE.hudExitStart);

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
      hudAnchorRevealCtl?.collapse();
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
