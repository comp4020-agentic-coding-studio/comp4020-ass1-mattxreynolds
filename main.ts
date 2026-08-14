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
import { uniformStarfield } from "./starfield";
import { WAYPOINTS } from "./waypoints";
import { clampProgress, currentWaypoint, interpLayer, type LayerFrame } from "./zoom";

// All 12 waypoints (Moon through the CMB) — build order complete, see
// TASKS.md/PLAN.md. Two entrance grammars alternate deliberately: sibling
// body (offset + oversized, converging in) for same-kind neighbours, field
// reveal (centred, no lateral offset, shrinking as a whole) at the two
// category jumps — star-field-as-galaxy at Sagittarius A*, galaxy-as-cluster
// at Virgo Cluster. The reionization fog and the CMB share the same
// LAYER_MARKUP/LAYER_FRAMES machinery as every other waypoint, but each gets
// a CSS size override (see styles.css): the fog is full-bleed, filling the
// whole stage rather than sitting as a centred object, and the CMB renders
// much larger than the default waypoint size. Their LAYER_FRAMES are
// opacity-only ramps with scale/position held — the fog ramps up, holds,
// then fades out exactly as the CMB fades in (a synchronised crossfade at
// t=0.917-0.955), and the CMB then holds at full opacity through the end of
// the track (interpLayer holds the last keyframe past its t) rather than
// fading out, so it's still on screen as `.payoff` begins. A separate,
// generic starfield backdrop (see STARFIELD_FRAMES) sits behind every layer
// from the very start and fades out over the fog's own fade-in window.
const LAYER_MARKUP: Record<string, string> = {
  moon: `<img src="${moonImg}" alt="The Moon" />`,
  sun: `<img src="${sunImg}" alt="The Sun" />`,
  "proxima-centauri": `<img src="${proximaImg}" alt="Proxima Centauri" />`,
  vega: `<img src="${vegaImg}" alt="Vega" />`,
  "sagittarius-a": `<img src="${milkyWayImg}" alt="The Milky Way, seen from its core" />`,
  andromeda: `<img src="${andromedaImg}" alt="The Andromeda Galaxy" />`,
  "virgo-cluster": `<img src="${virgoImg}" alt="The Virgo Cluster" />`,
  "3c273": `<img src="${q3c273Img}" alt="Quasar 3C 273" />`,
  "gn-z11": `<img src="${gnz11Img}" alt="GN-z11" />`,
  "jades-gs-z14-0": `<img src="${jadesImg}" alt="JADES-GS-z14-0" />`,
  "reionization-fog": `<img src="${reionizationFogImg}" alt="The reionization fog" />`,
  cmb: `<img src="${cmbImg}" alt="The Cosmic Microwave Background" />`,
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
    { t: 0.788, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.843, scale: 0.05, x: 0, y: 0, opacity: 0 },
  ],
  "reionization-fog": [
    { t: 0.788, scale: 1, x: 0, y: 0, opacity: 0 },
    { t: 0.871, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.917, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 0.955, scale: 1, x: 0, y: 0, opacity: 0 },
  ],
  cmb: [
    { t: 0.917, scale: 1, x: 0, y: 0, opacity: 0 },
    { t: 0.955, scale: 1, x: 0, y: 0, opacity: 1 },
    { t: 1, scale: 1, x: 0, y: 0, opacity: 1 },
  ],
};

// A generic starfield backdrop sits behind every waypoint from t=0, then
// fades out over exactly the reionization fog's own fade-in window
// (t=0.788 to t=0.871, matching "reionization-fog" above) — the fog is what
// finally has no stars left showing through it.
const STARFIELD_FRAMES: LayerFrame[] = [
  { t: 0, scale: 1, x: 0, y: 0, opacity: 1 },
  { t: 0.788, scale: 1, x: 0, y: 0, opacity: 1 },
  { t: 0.871, scale: 1, x: 0, y: 0, opacity: 0 },
];

const track = document.querySelector<HTMLElement>('[data-testid="track"]');
const starfieldEl = document.querySelector<HTMLElement>('[data-testid="starfield"]');
const layersEl = document.querySelector<HTMLElement>('[data-testid="layers"]');
const status = document.querySelector<HTMLElement>('[data-testid="status"]');
const hudName = document.querySelector<HTMLElement>('[data-testid="hud-name"]');
const hudDistance = document.querySelector<HTMLElement>('[data-testid="hud-distance"]');
const hudLookback = document.querySelector<HTMLElement>('[data-testid="hud-lookback"]');
const hudAnchor = document.querySelector<HTMLElement>('[data-testid="hud-anchor"]');

const staged = WAYPOINTS.filter((w) => w.from !== undefined && LAYER_FRAMES[w.id]);

if (starfieldEl) {
  starfieldEl.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      ${uniformStarfield({ seed: 11 })}
    </svg>`;
}

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

    if (starfieldEl) {
      starfieldEl.style.opacity = String(interpLayer(STARFIELD_FRAMES, progress).opacity);
    }

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
