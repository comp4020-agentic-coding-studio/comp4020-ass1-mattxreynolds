// Procedural star-field generator for the galaxy/cluster waypoints. Each
// shape is built from many small <circle> dots placed by a seeded PRNG (not
// Math.random()) so every reload renders the identical field — a deliberate
// composition, not noise that shifts on refresh.

interface Dot {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  opacity: number;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller, using the given PRNG, for a soft radial falloff toward edges.
function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-6);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function dotMarkup({ cx, cy, r, fill, opacity }: Dot): string {
  return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}" opacity="${opacity.toFixed(2)}" />`;
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const WARM: [number, number, number] = [255, 246, 216]; // core glow
const COOL: [number, number, number] = [200, 210, 255]; // outer-arm stars

/**
 * Spiral galaxy (Andromeda): two logarithmic arms plus a dense core, drawn
 * in a face-on frame then flattened and rotated so the dots stay circular
 * (an SVG-level transform would squash them into ellipses instead).
 */
export function spiralGalaxy(opts: {
  seed: number;
  armStars?: number;
  coreStars?: number;
  flatten?: number;
  rotateDeg?: number;
  maxRadius?: number;
}): string {
  const { seed, armStars = 260, coreStars = 90, flatten = 0.42, rotateDeg = -18, maxRadius = 46 } = opts;
  const rand = mulberry32(seed);
  const rot = (rotateDeg * Math.PI) / 180;
  const dots: Dot[] = [];

  const place = (sx: number, sy: number, r: number, fill: string, opacity: number) => {
    const fy = sy * flatten;
    const cx = 50 + sx * Math.cos(rot) - fy * Math.sin(rot);
    const cy = 50 + sx * Math.sin(rot) + fy * Math.cos(rot);
    dots.push({ cx, cy, r, fill, opacity });
  };

  for (let arm = 0; arm < 2; arm++) {
    const armOffset = arm * Math.PI;
    for (let i = 0; i < armStars; i++) {
      const t = i / armStars;
      const theta = t * Math.PI * 2.6 + armOffset;
      const radius = 6 + t * (maxRadius - 6);
      const jitter = (1 - t) * 2 + t * 5;
      const sx = Math.cos(theta) * radius + gaussian(rand) * jitter * 0.5;
      const sy = Math.sin(theta) * radius + gaussian(rand) * jitter * 0.5;
      const r = 0.25 + (1 - t) * 0.55 + rand() * 0.3;
      const opacity = 0.35 + (1 - t) * 0.45 + rand() * 0.2;
      place(sx, sy, r, lerpColor(WARM, COOL, Math.min(t * 1.3, 1)), Math.min(opacity, 0.95));
    }
  }

  for (let i = 0; i < coreStars; i++) {
    const radius = Math.abs(gaussian(rand)) * 5;
    const theta = rand() * Math.PI * 2;
    const sx = Math.cos(theta) * radius;
    const sy = Math.sin(theta) * radius;
    const r = 0.3 + rand() * 0.5;
    place(sx, sy, r, lerpColor(WARM, COOL, 0.1), 0.6 + rand() * 0.4);
  }

  dots.push({ cx: 50, cy: 50, r: 3.2, fill: "url(#andromeda-core-glow)", opacity: 0.9 });

  return dots.map(dotMarkup).join("\n      ");
}

/**
 * Edge-on disk + bulge (Sagittarius A*): viewed from within the galactic
 * plane, so it reads as a thin band of stars (the disk, seen edge-on) with a
 * denser, rounder, brighter bulge of stars at the core rather than spiral
 * arms (which only show face-on).
 */
export function diskBulgeGalaxy(opts: {
  seed: number;
  diskStars?: number;
  bulgeStars?: number;
  rotateDeg?: number;
  halfLength?: number;
}): string {
  const { seed, diskStars = 220, bulgeStars = 130, rotateDeg = -6, halfLength = 47 } = opts;
  const rand = mulberry32(seed);
  const rot = (rotateDeg * Math.PI) / 180;
  const dots: Dot[] = [];

  const place = (sx: number, sy: number, r: number, fill: string, opacity: number) => {
    const cx = 50 + sx * Math.cos(rot) - sy * Math.sin(rot);
    const cy = 50 + sx * Math.sin(rot) + sy * Math.cos(rot);
    dots.push({ cx, cy, r, fill, opacity });
  };

  for (let i = 0; i < diskStars; i++) {
    const sx = (rand() * 2 - 1) * halfLength;
    const distFromCentre = Math.abs(sx) / halfLength;
    const thickness = 1.2 + distFromCentre * 1.6;
    const sy = gaussian(rand) * thickness * 0.5;
    const r = 0.22 + (1 - distFromCentre) * 0.35 + rand() * 0.25;
    const opacity = 0.3 + (1 - distFromCentre) * 0.4 + rand() * 0.2;
    place(sx, sy, r, lerpColor(WARM, COOL, Math.min(distFromCentre * 1.4, 1)), Math.min(opacity, 0.95));
  }

  for (let i = 0; i < bulgeStars; i++) {
    const radius = Math.abs(gaussian(rand)) * 6;
    const theta = rand() * Math.PI * 2;
    const sx = Math.cos(theta) * radius;
    const sy = Math.sin(theta) * radius * 0.55;
    const r = 0.3 + rand() * 0.5;
    place(sx, sy, r, lerpColor(WARM, COOL, 0.15), 0.55 + rand() * 0.4);
  }

  dots.push({ cx: 50, cy: 50, r: 4, fill: "url(#saga-core-glow)", opacity: 0.85 });

  return dots.map(dotMarkup).join("\n      ");
}

/**
 * Clumpy irregular galaxy (GN-z11 / JADES-GS-z14-0): the earliest galaxies
 * are small, chaotic, and still assembling — a few off-centre star-forming
 * clumps rather than a settled spiral or disk, reddened by redshift.
 */
export function clumpyGalaxy(opts: { seed: number; clumps?: number; starsPerClump?: number; spread?: number }): string {
  const { seed, clumps = 4, starsPerClump = 30, spread = 9 } = opts;
  const rand = mulberry32(seed);
  const dots: Dot[] = [];
  const hot: [number, number, number] = [255, 224, 194];
  const cool: [number, number, number] = [217, 72, 42];

  const clumpCentres: Array<[number, number]> = [];
  for (let c = 0; c < clumps; c++) {
    const theta = (c / clumps) * Math.PI * 2 + rand() * 0.8;
    const radius = rand() * spread * 0.6;
    clumpCentres.push([Math.cos(theta) * radius, Math.sin(theta) * radius]);
  }

  for (const [ox, oy] of clumpCentres) {
    const clumpR = 2 + rand() * 2.5;
    for (let i = 0; i < starsPerClump; i++) {
      const dx = gaussian(rand) * clumpR * 0.5;
      const dy = gaussian(rand) * clumpR * 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy) / (clumpR + 0.001);
      const r = 0.25 + (1 - Math.min(dist, 1)) * 0.4 + rand() * 0.25;
      const opacity = 0.4 + (1 - Math.min(dist, 1)) * 0.4 + rand() * 0.2;
      dots.push({
        cx: 50 + ox + dx,
        cy: 50 + oy + dy,
        r,
        fill: lerpColor(hot, cool, Math.min(dist, 1)),
        opacity: Math.min(opacity, 0.95),
      });
    }
  }

  return dots.map(dotMarkup).join("\n      ");
}

/** Thin radiating lines from the centre — the Sun's corona, or a quasar's rays. */
export function radialRays(opts: { seed: number; rays?: number; innerR: number; outerR: number; color: string; strokeWidth?: number }): string {
  const { seed, rays = 16, innerR, outerR, color, strokeWidth = 0.6 } = opts;
  const rand = mulberry32(seed);
  const lines: string[] = [];
  for (let i = 0; i < rays; i++) {
    const theta = (i / rays) * Math.PI * 2 + rand() * 0.15;
    const length = outerR * (0.55 + rand() * 0.45);
    const x1 = 50 + Math.cos(theta) * innerR;
    const y1 = 50 + Math.sin(theta) * innerR;
    const x2 = 50 + Math.cos(theta) * length;
    const y2 = 50 + Math.sin(theta) * length;
    const opacity = 0.2 + rand() * 0.35;
    lines.push(
      `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="${opacity.toFixed(2)}" />`,
    );
  }
  return lines.join("\n      ");
}

/** A camera-style diffraction-spike cross through the centre, for a bright point star. */
export function diffractionSpike(opts: { color: string; length: number; width?: number; rotateDeg?: number }): string {
  const { color, length, width = 1.4, rotateDeg = 0 } = opts;
  const lines: string[] = [];
  for (const deg of [0, 90]) {
    const theta = ((deg + rotateDeg) * Math.PI) / 180;
    const x1 = 50 - Math.cos(theta) * length;
    const y1 = 50 - Math.sin(theta) * length;
    const x2 = 50 + Math.cos(theta) * length;
    const y2 = 50 + Math.sin(theta) * length;
    lines.push(`<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="0.6" />`);
  }
  return lines.join("\n      ");
}

/**
 * Mottled surface texture — light/dark blotches scattered across a star's
 * disk (granulation cells, starspots), for stars rendered without a
 * diffraction-spike flare so they still read as a textured surface rather
 * than a flat gradient ball.
 */
export function surfaceTexture(opts: {
  seed: number;
  radius: number;
  spots: number;
  baseColor: [number, number, number];
  spotColor: [number, number, number];
  minSize?: number;
  maxSize?: number;
}): string {
  const { seed, radius, spots, baseColor, spotColor, minSize = 0.04, maxSize = 0.14 } = opts;
  const rand = mulberry32(seed);
  const dots: Dot[] = [];
  for (let i = 0; i < spots; i++) {
    const theta = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * radius * 0.9;
    const cx = 50 + Math.cos(theta) * r;
    const cy = 50 + Math.sin(theta) * r;
    const spotR = radius * (minSize + rand() * (maxSize - minSize));
    const opacity = 0.15 + rand() * 0.35;
    dots.push({ cx, cy, r: spotR, fill: lerpColor(baseColor, spotColor, rand()), opacity });
  }
  return dots.map(dotMarkup).join("\n      ");
}

/**
 * Cluster of galaxies (Virgo Cluster): each member galaxy is itself a small
 * dot-cluster rather than a single flat circle, so the whole composition
 * reads as many tiny stars grouped into many small galaxies, grouped again
 * into the cluster.
 */
export function galaxyCluster(opts: {
  seed: number;
  members?: Array<{ cx: number; cy: number; r: number; color: string; stars: number }>;
}): string {
  const { seed, members } = opts;
  const rand = mulberry32(seed);
  const dots: Dot[] = [];

  for (const m of members ?? []) {
    dots.push({ cx: m.cx, cy: m.cy, r: m.r * 0.4, fill: m.color, opacity: 0.55 });
    for (let i = 0; i < m.stars; i++) {
      const radius = Math.abs(gaussian(rand)) * m.r;
      const theta = rand() * Math.PI * 2;
      const dx = Math.cos(theta) * radius;
      const dy = Math.sin(theta) * radius;
      const r = 0.18 + rand() * 0.28;
      const opacity = 0.35 + (1 - Math.min(radius / (m.r + 0.001), 1)) * 0.45 + rand() * 0.15;
      dots.push({ cx: m.cx + dx, cy: m.cy + dy, r, fill: m.color, opacity: Math.min(opacity, 0.9) });
    }
  }

  return dots.map(dotMarkup).join("\n      ");
}
