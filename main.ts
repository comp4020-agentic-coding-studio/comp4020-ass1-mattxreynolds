import { WAYPOINTS } from "./waypoints";
import { clampProgress, currentWaypoint, interpLayer, type LayerFrame } from "./zoom";

// Waypoints 1-11 (Moon through the reionization fog) — build order stages
// 2-3, see TASKS.md/PLAN.md. Two entrance grammars alternate deliberately:
// sibling body (offset + oversized, converging in) for same-kind neighbours,
// field reveal (centred, no lateral offset, shrinking as a whole) at the two
// category jumps — star-field-as-galaxy at Sagittarius A*, galaxy-as-cluster
// at Virgo Cluster. The reionization fog is a third, non-object treatment:
// its "layer" is a full-bleed veil div (styled in styles.css, not an SVG
// icon) whose opacity ramps up over its own window, obscuring whatever real
// object (jades-gs-z14-0) is still rendered behind it — same LAYER_MARKUP/
// LAYER_FRAMES machinery as every other waypoint, just different markup.
const LAYER_MARKUP: Record<string, string> = {
  moon: `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Moon">
      <circle cx="50" cy="50" r="42" fill="#cfd0d6" />
      <circle cx="35" cy="38" r="6" fill="#b8b9c0" />
      <circle cx="62" cy="55" r="9" fill="#b8b9c0" />
      <circle cx="48" cy="68" r="4" fill="#b8b9c0" />
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
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#sun-glow)" />
    </svg>
  `,
  "proxima-centauri": `
    <svg viewBox="0 0 100 100" role="img" aria-label="Proxima Centauri">
      <defs>
        <radialGradient id="proxima-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffdfd0" />
          <stop offset="50%" stop-color="#ff8f6b" />
          <stop offset="100%" stop-color="#c94f3d" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="30" fill="url(#proxima-glow)" />
    </svg>
  `,
  vega: `
    <svg viewBox="0 0 100 100" role="img" aria-label="Vega">
      <defs>
        <radialGradient id="vega-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="45%" stop-color="#cfe4ff" />
          <stop offset="100%" stop-color="#6fa3e0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="38" fill="url(#vega-glow)" />
    </svg>
  `,
  "sagittarius-a": `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Milky Way, seen from its core">
      <defs>
        <radialGradient id="saga-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff6d8" />
          <stop offset="40%" stop-color="#ffd166" />
          <stop offset="100%" stop-color="#ffd166" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="48" ry="14" fill="#cfd0d6" opacity="0.35" />
      <ellipse cx="50" cy="50" rx="34" ry="9" fill="#e8e6ff" opacity="0.4" />
      <circle cx="50" cy="50" r="20" fill="url(#saga-core)" />
    </svg>
  `,
  andromeda: `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Andromeda Galaxy">
      <defs>
        <radialGradient id="andromeda-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff6e8" />
          <stop offset="45%" stop-color="#ffd9a0" />
          <stop offset="100%" stop-color="#ffd9a0" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="46" ry="16" fill="#b9c3ff" opacity="0.4" transform="rotate(-18 50 50)" />
      <ellipse cx="50" cy="50" rx="30" ry="10" fill="#dfe3ff" opacity="0.45" transform="rotate(-18 50 50)" />
      <circle cx="50" cy="50" r="16" fill="url(#andromeda-core)" />
    </svg>
  `,
  "virgo-cluster": `
    <svg viewBox="0 0 100 100" role="img" aria-label="The Virgo Cluster">
      <circle cx="50" cy="48" r="13" fill="#ffe9c2" opacity="0.9" />
      <circle cx="24" cy="30" r="7" fill="#dfe3ff" opacity="0.75" />
      <circle cx="76" cy="34" r="6" fill="#ffd9a0" opacity="0.75" />
      <circle cx="30" cy="70" r="5" fill="#cfe4ff" opacity="0.7" />
      <circle cx="70" cy="72" r="8" fill="#e8e6ff" opacity="0.75" />
      <circle cx="66" cy="20" r="4" fill="#ffe9c2" opacity="0.65" />
      <circle cx="18" cy="58" r="4" fill="#dfe3ff" opacity="0.65" />
    </svg>
  `,
  "3c273": `
    <svg viewBox="0 0 100 100" role="img" aria-label="Quasar 3C 273">
      <defs>
        <radialGradient id="q3c273-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="35%" stop-color="#cfe8ff" />
          <stop offset="100%" stop-color="#5fa8ff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <path d="M50 4 L54 46 L96 50 L54 54 L50 96 L46 54 L4 50 L46 46 Z" fill="#eaf6ff" opacity="0.55" />
      <circle cx="50" cy="50" r="42" fill="url(#q3c273-glow)" />
      <circle cx="50" cy="50" r="10" fill="#ffffff" />
    </svg>
  `,
  "gn-z11": `
    <svg viewBox="0 0 100 100" role="img" aria-label="GN-z11">
      <defs>
        <radialGradient id="gnz11-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffcf9e" />
          <stop offset="50%" stop-color="#ff7a4d" />
          <stop offset="100%" stop-color="#c8371f" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="48" cy="52" rx="22" ry="14" fill="url(#gnz11-core)" transform="rotate(12 48 52)" />
      <circle cx="48" cy="52" r="8" fill="#ffe3c2" opacity="0.85" />
    </svg>
  `,
  "jades-gs-z14-0": `
    <svg viewBox="0 0 100 100" role="img" aria-label="JADES-GS-z14-0">
      <defs>
        <radialGradient id="jades-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffb08a" />
          <stop offset="50%" stop-color="#d9482a" />
          <stop offset="100%" stop-color="#8f2113" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="17" ry="11" fill="url(#jades-core)" transform="rotate(-8 50 50)" />
      <circle cx="50" cy="50" r="5" fill="#ffd9b8" opacity="0.8" />
    </svg>
  `,
  "reionization-fog": `<div class="veil" aria-hidden="true"></div>`,
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
    { t: 0.08, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  sun: [
    { t: 0.01, scale: 2.2, x: 50, y: -8, opacity: 0 },
    { t: 0.04, scale: 2.0, x: 40, y: -6, opacity: 1 },
    { t: 0.08, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.1, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.17, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "proxima-centauri": [
    { t: 0.1, scale: 2.2, x: -50, y: 6, opacity: 0 },
    { t: 0.13, scale: 2.0, x: -40, y: 5, opacity: 1 },
    { t: 0.17, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.19, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.26, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  vega: [
    { t: 0.19, scale: 2.2, x: 50, y: -6, opacity: 0 },
    { t: 0.22, scale: 2.0, x: 40, y: -5, opacity: 1 },
    { t: 0.26, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.28, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.37, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "sagittarius-a": [
    { t: 0.28, scale: 2.6, x: 0, y: 0, opacity: 0 },
    { t: 0.32, scale: 2.4, x: 0, y: 0, opacity: 1 },
    { t: 0.37, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.39, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.46, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  andromeda: [
    { t: 0.39, scale: 2.2, x: -50, y: 5, opacity: 0 },
    { t: 0.42, scale: 2.0, x: -40, y: 4, opacity: 1 },
    { t: 0.46, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.48, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.57, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "virgo-cluster": [
    { t: 0.48, scale: 2.6, x: 0, y: 0, opacity: 0 },
    { t: 0.52, scale: 2.4, x: 0, y: 0, opacity: 1 },
    { t: 0.57, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.59, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.66, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "3c273": [
    { t: 0.59, scale: 2.2, x: 50, y: -6, opacity: 0 },
    { t: 0.62, scale: 2.0, x: 40, y: -5, opacity: 1 },
    { t: 0.66, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.68, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.75, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "gn-z11": [
    { t: 0.68, scale: 2.2, x: -50, y: 5, opacity: 0 },
    { t: 0.71, scale: 2.0, x: -40, y: 4, opacity: 1 },
    { t: 0.75, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.77, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.84, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "jades-gs-z14-0": [
    { t: 0.77, scale: 2.2, x: 50, y: -5, opacity: 0 },
    { t: 0.8, scale: 2.0, x: 40, y: -4, opacity: 1 },
    { t: 0.84, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 1, scale: 1, x: 0, y: 0, opacity: 1 },
  ],
  "reionization-fog": [
    { t: 0.86, scale: 1, x: 0, y: 0, opacity: 0 },
    { t: 0.95, scale: 1, x: 0, y: 0, opacity: 0.94 },
    { t: 1, scale: 1, x: 0, y: 0, opacity: 0.94 },
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
