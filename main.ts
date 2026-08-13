import { WAYPOINTS } from "./waypoints";
import { clampProgress, currentWaypoint, interpLayer, type LayerFrame } from "./zoom";

// Proof-of-mechanic slice (see TASKS.md, PLAN.md build order stage 1):
// only Moon -> Sun render for now, to prove the continuous zoom + entrance
// grammar before rolling out the rest of the list.
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
};

// {t, scale, x (vw), y (vh), opacity} — t is overall track progress, not
// local to this layer. x/y offsets are how far the object sits from centre
// while it's still oversized, before converging to 0,0 as it settles.
const LAYER_FRAMES: Record<string, LayerFrame[]> = {
  moon: [
    { t: 0, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.4, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  sun: [
    { t: 0, scale: 2.4, x: 55, y: -8, opacity: 0 },
    { t: 0.15, scale: 2.2, x: 45, y: -6, opacity: 1 },
    { t: 0.45, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 1, scale: 1, x: 0, y: 0, opacity: 1 },
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
