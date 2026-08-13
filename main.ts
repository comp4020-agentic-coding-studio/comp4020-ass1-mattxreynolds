import { clumpyGalaxy, diffractionSpike, diskBulgeGalaxy, galaxyCluster, spiralGalaxy, surfaceTexture } from "./starfield";
import { WAYPOINTS } from "./waypoints";
import { clampProgress, currentWaypoint, interpLayer, type LayerFrame } from "./zoom";

// All 12 waypoints (Moon through the CMB) — build order complete, see
// TASKS.md/PLAN.md. Two entrance grammars alternate deliberately: sibling
// body (offset + oversized, converging in) for same-kind neighbours, field
// reveal (centred, no lateral offset, shrinking as a whole) at the two
// category jumps — star-field-as-galaxy at Sagittarius A*, galaxy-as-cluster
// at Virgo Cluster. The reionization fog and the CMB are a third, non-object
// treatment: full-bleed veil divs (styled in styles.css, not SVG icons)
// whose opacity ramps over their own window — same LAYER_MARKUP/LAYER_FRAMES
// machinery as every other waypoint, just different markup. The fog's dark
// veil ramps up then holds at its max forever (interpLayer holds the last
// keyframe past its t) — it never recedes. The CMB's bright veil is a
// second, separate layer appended after it in WAYPOINTS order, so it paints
// on top: it ramps past the fog's held darkness to a near-total whiteout
// (the wall revealing itself as what the fog was hiding, not a passage
// through to somewhere else), then recedes back to 0 before the track ends,
// so the `.payoff` text lands on the site's ordinary dark background rather
// than cutting from white.
const LAYER_MARKUP: Record<string, string> = {
  moon: `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Moon">
      <defs>
        <radialGradient id="moon-base" cx="42%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#e7e8ec" />
          <stop offset="65%" stop-color="#cfd0d6" />
          <stop offset="100%" stop-color="#96979f" />
        </radialGradient>
        <linearGradient id="moon-terminator" x1="10%" y1="0%" x2="95%" y2="70%">
          <stop offset="0%" stop-color="#0a0a0f" stop-opacity="0" />
          <stop offset="68%" stop-color="#0a0a0f" stop-opacity="0" />
          <stop offset="100%" stop-color="#0a0a0f" stop-opacity="0.6" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#moon-base)" />
      <circle cx="35" cy="38" r="6" fill="#b3b4bb" opacity="0.85" />
      <circle cx="62" cy="55" r="9" fill="#b3b4bb" opacity="0.85" />
      <circle cx="48" cy="68" r="4" fill="#b3b4bb" opacity="0.8" />
      <circle cx="30" cy="58" r="3" fill="#a5a6ae" opacity="0.75" />
      <circle cx="68" cy="34" r="3.4" fill="#a5a6ae" opacity="0.75" />
      <circle cx="55" cy="28" r="2.1" fill="#a5a6ae" opacity="0.7" />
      <circle cx="40" cy="50" r="1.9" fill="#a5a6ae" opacity="0.65" />
      <circle cx="73" cy="59" r="2.5" fill="#a5a6ae" opacity="0.7" />
      <circle cx="58" cy="73" r="1.8" fill="#a5a6ae" opacity="0.65" />
      <circle cx="25" cy="44" r="1.5" fill="#a5a6ae" opacity="0.6" />
      <circle cx="44" cy="60" r="1.3" fill="#c3c4cb" opacity="0.6" />
      <circle cx="60" cy="45" r="1.1" fill="#c3c4cb" opacity="0.6" />
      <circle cx="52" cy="60" r="1.2" fill="#c3c4cb" opacity="0.55" />
      <circle cx="38" cy="30" r="1" fill="#c3c4cb" opacity="0.55" />
      <circle cx="50" cy="50" r="42" fill="url(#moon-terminator)" />
    </svg>
  `,
  sun: `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Sun">
      <defs>
        <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff6d8" />
          <stop offset="55%" stop-color="#ffd166" />
          <stop offset="100%" stop-color="#ff9f2e" />
        </radialGradient>
        <radialGradient id="sun-corona" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffd166" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#ffd166" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="url(#sun-corona)" />
      <circle cx="50" cy="50" r="45" fill="url(#sun-glow)" />
      <circle cx="37" cy="40" r="5.5" fill="#fff2c4" opacity="0.22" />
      <circle cx="60" cy="58" r="6.5" fill="#ffb347" opacity="0.18" />
      <circle cx="55" cy="34" r="4" fill="#fff2c4" opacity="0.18" />
      <circle cx="41" cy="63" r="4.5" fill="#ffb347" opacity="0.16" />
      ${surfaceTexture({ seed: 10, radius: 44, spots: 55, baseColor: [255, 209, 102], spotColor: [255, 140, 40], minSize: 0.025, maxSize: 0.08 })}
    </svg>
  `,
  "proxima-centauri": `
    <svg viewBox="0 0 100 100" role="img" aria-label="Proxima Centauri">
      <defs>
        <radialGradient id="proxima-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff8f6b" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#ff8f6b" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="proxima-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffdfd0" />
          <stop offset="50%" stop-color="#ff8f6b" />
          <stop offset="100%" stop-color="#c94f3d" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#proxima-halo)" />
      <circle cx="50" cy="50" r="36" fill="url(#proxima-glow)" />
      ${surfaceTexture({ seed: 11, radius: 35, spots: 26, baseColor: [255, 143, 107], spotColor: [166, 55, 38], minSize: 0.05, maxSize: 0.17 })}
    </svg>
  `,
  vega: `
    <svg viewBox="0 0 100 100" role="img" aria-label="Vega">
      <defs>
        <radialGradient id="vega-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#bcd9ff" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#bcd9ff" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="vega-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="45%" stop-color="#cfe4ff" />
          <stop offset="100%" stop-color="#6fa3e0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="url(#vega-halo)" />
      <circle cx="50" cy="50" r="44" fill="url(#vega-glow)" />
      ${surfaceTexture({ seed: 12, radius: 43, spots: 30, baseColor: [207, 228, 255], spotColor: [255, 255, 255], minSize: 0.03, maxSize: 0.1 })}
    </svg>
  `,
  "sagittarius-a": `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Milky Way, seen from its core">
      <defs>
        <radialGradient id="saga-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff6d8" />
          <stop offset="40%" stop-color="#ffd166" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#ffd166" stop-opacity="0" />
        </radialGradient>
      </defs>
      ${diskBulgeGalaxy({ seed: 1 })}
    </svg>
  `,
  andromeda: `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Andromeda Galaxy">
      <defs>
        <radialGradient id="andromeda-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff6e8" />
          <stop offset="45%" stop-color="#ffd9a0" stop-opacity="0.7" />
          <stop offset="100%" stop-color="#ffd9a0" stop-opacity="0" />
        </radialGradient>
      </defs>
      ${spiralGalaxy({ seed: 2 })}
    </svg>
  `,
  "virgo-cluster": `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Virgo Cluster">
      ${galaxyCluster({
        seed: 4,
        members: [
          { cx: 50, cy: 48, r: 9, color: "#ffe9c2", stars: 46 },
          { cx: 24, cy: 30, r: 5.5, color: "#dfe3ff", stars: 26 },
          { cx: 76, cy: 34, r: 5, color: "#ffd9a0", stars: 24 },
          { cx: 30, cy: 70, r: 4, color: "#cfe4ff", stars: 20 },
          { cx: 70, cy: 72, r: 6, color: "#e8e6ff", stars: 30 },
          { cx: 66, cy: 20, r: 3, color: "#ffe9c2", stars: 16 },
          { cx: 18, cy: 58, r: 3, color: "#dfe3ff", stars: 16 },
        ],
      })}
    </svg>
  `,
  "3c273": `
    <svg viewBox="0 0 100 100" role="img" aria-label="Quasar 3C 273">
      <defs>
        <radialGradient id="q3c273-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#8fc4ff" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#8fc4ff" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="q3c273-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="35%" stop-color="#cfe8ff" />
          <stop offset="100%" stop-color="#5fa8ff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="url(#q3c273-halo)" />
      ${diffractionSpike({ color: "#eaf6ff", length: 48, width: 1.8 })}
      ${diffractionSpike({ color: "#eaf6ff", length: 30, width: 1, rotateDeg: 45 })}
      <circle cx="63" cy="61" r="2.6" fill="#cfe8ff" opacity="0.5" />
      <circle cx="72" cy="68" r="1.9" fill="#cfe8ff" opacity="0.4" />
      <circle cx="80" cy="74" r="1.3" fill="#cfe8ff" opacity="0.3" />
      <circle cx="50" cy="50" r="42" fill="url(#q3c273-glow)" />
      <circle cx="50" cy="50" r="10" fill="#ffffff" />
    </svg>
  `,
  "gn-z11": `
    <svg viewBox="0 0 100 100" role="img" aria-label="GN-z11">
      <defs>
        <radialGradient id="gnz11-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffcf9e" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#c8371f" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="26" fill="url(#gnz11-glow)" />
      ${clumpyGalaxy({ seed: 5, clumps: 4, starsPerClump: 32, spread: 9 })}
    </svg>
  `,
  "jades-gs-z14-0": `
    <svg viewBox="0 0 100 100" role="img" aria-label="JADES-GS-z14-0">
      <defs>
        <radialGradient id="jades-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffb08a" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#8f2113" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="19" fill="url(#jades-glow)" />
      ${clumpyGalaxy({ seed: 6, clumps: 3, starsPerClump: 22, spread: 6 })}
    </svg>
  `,
  "reionization-fog": `<div class="veil" aria-hidden="true"></div>`,
  cmb: `<div class="veil veil-bright" aria-hidden="true"></div>`,
};

// {t, scale, x (vw), y (vh), opacity} — t is overall track progress, not
// local to this layer. x/y offsets are how far the object sits from centre
// while it's still oversized, before converging to 0,0 as it settles.
// Sibling-body entrances carry an x/y offset that converges to 0; field
// reveals (sagittarius-a, virgo-cluster) hold x/y at 0 throughout and only
// scale down, per PLAN.md's two entrance grammars.
const LAYER_FRAMES: Record<string, LayerFrame[]> = {
  moon: [
    { t: 0, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.073, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  sun: [
    { t: 0.009, scale: 2.2, x: 50, y: -8, opacity: 0 },
    { t: 0.037, scale: 2.0, x: 40, y: -6, opacity: 1 },
    { t: 0.073, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.092, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.156, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "proxima-centauri": [
    { t: 0.092, scale: 2.2, x: -50, y: 6, opacity: 0 },
    { t: 0.119, scale: 2.0, x: -40, y: 5, opacity: 1 },
    { t: 0.156, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.174, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.238, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  vega: [
    { t: 0.174, scale: 2.2, x: 50, y: -6, opacity: 0 },
    { t: 0.202, scale: 2.0, x: 40, y: -5, opacity: 1 },
    { t: 0.238, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.257, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.339, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "sagittarius-a": [
    { t: 0.257, scale: 2.6, x: 0, y: 0, opacity: 0 },
    { t: 0.293, scale: 2.4, x: 0, y: 0, opacity: 1 },
    { t: 0.339, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.358, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.422, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  andromeda: [
    { t: 0.358, scale: 2.2, x: -50, y: 5, opacity: 0 },
    { t: 0.385, scale: 2.0, x: -40, y: 4, opacity: 1 },
    { t: 0.422, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.44, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.523, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "virgo-cluster": [
    { t: 0.44, scale: 2.6, x: 0, y: 0, opacity: 0 },
    { t: 0.477, scale: 2.4, x: 0, y: 0, opacity: 1 },
    { t: 0.523, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.541, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.605, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "3c273": [
    { t: 0.541, scale: 2.2, x: 50, y: -6, opacity: 0 },
    { t: 0.568, scale: 2.0, x: 40, y: -5, opacity: 1 },
    { t: 0.605, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.623, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.688, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "gn-z11": [
    { t: 0.623, scale: 2.2, x: -50, y: 5, opacity: 0 },
    { t: 0.651, scale: 2.0, x: -40, y: 4, opacity: 1 },
    { t: 0.688, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.706, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.77, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "jades-gs-z14-0": [
    { t: 0.706, scale: 2.2, x: 50, y: -5, opacity: 0 },
    { t: 0.733, scale: 2.0, x: 40, y: -4, opacity: 1 },
    { t: 0.77, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.917, scale: 1, x: 0, y: 0, opacity: 1 },
  ],
  "reionization-fog": [
    { t: 0.788, scale: 1, x: 0, y: 0, opacity: 0 },
    { t: 0.871, scale: 1, x: 0, y: 0, opacity: 0.94 },
    { t: 0.917, scale: 1, x: 0, y: 0, opacity: 0.94 },
  ],
  cmb: [
    { t: 0.917, scale: 1, x: 0, y: 0, opacity: 0 },
    { t: 0.955, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.975, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 1, scale: 1, x: 0, y: 0, opacity: 0 },
  ],
};

const track = document.querySelector<HTMLElement>('[data-testid="track"]');
const layersEl = document.querySelector<HTMLElement>('[data-testid="layers"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const hudName = document.querySelector<HTMLElement>('[data-testid="hud-name"]');
const hudDistance = document.querySelector<HTMLElement>('[data-testid="hud-distance"]');
const hudLookback = document.querySelector<HTMLElement>('[data-testid="hud-lookback"]');
const hudAnchor = document.querySelector<HTMLElement>('[data-testid="hud-anchor"]');

const staged = WAYPOINTS.filter((w) => w.from !== undefined && LAYER_FRAMES[w.id]);

if (track && layersEl) {
  const layerEls = new Map<string, HTMLElement>();
  for (const waypoint of staged) {
    const layer = document.createElement("div");
    layer.className = "layer";
    layer.dataset.id = waypoint.id;
    layer.innerHTML = LAYER_MARKUP[waypoint.id];
    layersEl.appendChild(layer);
    layerEls.set(waypoint.id, layer);
  }

  let lastId: string | null = null;

  const render = () => {
    const rect = track.getBoundingClientRect();
    const trackTop = window.scrollY + rect.top;
    const scrollable = track.offsetHeight - window.innerHeight;
    const progress = clampProgress(scrollable > 0 ? (window.scrollY - trackTop) / scrollable : 0);

    for (const waypoint of staged) {
      const layer = layerEls.get(waypoint.id);
      if (!layer) continue;
      const state = interpLayer(LAYER_FRAMES[waypoint.id], progress);
      layer.style.transform = `translate(${state.x}vw, ${state.y}vh) scale(${state.scale})`;
      layer.style.opacity = String(state.opacity);
    }

    const current = currentWaypoint(progress, staged);
    if (hudName) hudName.textContent = current.name;
    if (hudDistance) hudDistance.textContent = current.distanceLabel;
    if (hudLookback) hudLookback.textContent = `You are seeing light that left ${current.lookbackLabel}`;
    if (hudAnchor) hudAnchor.textContent = current.anchor;

    if (status && current.id !== lastId) {
      lastId = current.id;
      status.textContent = `Now viewing: ${current.name}, light from ${current.lookbackLabel}.`;
    }
  };

  render();
  window.addEventListener("scroll", render, { passive: true });
  window.addEventListener("resize", render);
}
