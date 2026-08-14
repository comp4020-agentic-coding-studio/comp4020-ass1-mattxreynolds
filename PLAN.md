# PLAN

Current decisions only — see Git history and `PROCESS.md` for how we got here,
not this file.

## Thesis

Looking further out in space is not "more distant stuff" — it's automatically
looking further back in time, because light takes time to arrive. Most people
know that in the abstract but don't feel it. The point this piece has to land:
**the observable universe has an edge in time, not in space.** The Cosmic
Microwave Background isn't "the furthest galaxy we've found so far, expect
more later" — it's a hard wall. Before recombination (~380,000 years after the
Big Bang) the universe was an opaque plasma; there is no light from earlier to
ever find, no matter how good telescopes get. That wall, reached and felt as a
wall (not read as a caption), is the piece's one job.

## Core interaction

One sticky, full-viewport stage sits inside a tall scroll track. Scroll
position maps to a single continuous `progress` value (0–1); the page never
visibly pans — it zooms. Every object is an independent layer stacked in that
stage, each with its own `{progress, scale, x, y, opacity}` keyframes,
interpolated continuously as `progress` changes. There is no scroll-jacking:
it's a plain native `scroll` listener on a tall track, so the scrollbar,
keyboard, and wheel all behave normally — the transform is the only thing
that's synthetic.

Two entrance grammars, chosen per transition, not applied uniformly:

- **Sibling body** (Moon → Sun → Proxima …): the incoming object starts
  oversized and offset to one side, invisible; fades in while still huge and
  off-centre; then scale and position converge toward centred/1× together
  while the outgoing object's own keyframes independently shrink it to a dot
  and fade it out.
- **Field reveal** (single body → swarm/structure, e.g. a star → the galaxy
  it's one of many in): the incoming layer starts at a much larger scale with
  no lateral offset — it fades in centred, directly ahead, then shrinks as a
  whole. This is the "that was just one of these" beat.

The reionization fog and the CMB (the two narrative-bridge waypoints that
aren't bodies in the same sense as the rest) use the same
`LAYER_MARKUP`/`LAYER_FRAMES` machinery and the same `<img>` markup as every
other waypoint — no third grammar in the JS. Each gets a scoped CSS size
override instead: the fog is full-bleed (`width/height: 100%`,
`object-fit: cover`, no drop-shadow — there's no edge to cast one from), and
the CMB renders much larger than the default waypoint clamp. (An earlier
build treated them as full-bleed CSS "veil" divs meant to visually obscure
the stage rather than sit as an object; that was dropped in favour of
consistency — a single photo per waypoint, just sized differently — see Git
history for the veil version.)

**Fog → CMB timing (current):** the fog ramps up to full opacity, holds, then
fades out exactly as the CMB fades in — a synchronised crossfade rather than
a hard cut, so the wall is reached through dissolving fog rather than a jump
cut. The CMB then holds at full opacity for the rest of the track, including
into `.payoff` — it doesn't recede. The wall is the last thing on screen; the
closing text arrives over it, not after a fade back to the ordinary dark
background.

**Fog/CMB imagery (confirmed with Matt):** `reionization-fog.png` and
`cmb.png` — the latter is the real Planck all-sky temperature-anisotropy map,
used literally rather than a stylised blackbody-glow treatment.

A fixed HUD overlay shows discrete state — name, distance, lookback label,
anchor — for whichever waypoint's `from` progress-threshold the current
`progress` has most recently crossed. That discrete mapping (progress →
current waypoint) is what the spec test asserts against, not the raw
transform math.

The track ends once the last built waypoint has settled, then ordinary
document flow continues into a short closing section — no hard scroll-stop.
The wall is what the CMB waypoint's content says, not an enforced inability
to scroll further.

## Scope

- **10–12 waypoints**, ordered nearest → CMB. No locked "must-have" subset —
  decided deliberately: the safety net against running out of time is build
  **order** (thesis-critical waypoints — near objects, the first cosmological
  jump, the CMB wall — built first), not a formal cut line. See draft list
  below; still open to edits.
- **Every waypoint carries a historical/human-scale anchor**, and every anchor
  gets fact-checked before it ships (not just JADES-GS-z14-0, which was
  already verified in the earlier spike). An anchor that doesn't check out
  gets replaced or dropped, not shipped as a guess.
- The escalation itself is part of the argument: early anchors are ordinary
  ("since breakfast," "since you were born"); by the later waypoints, no
  human-scale anchor is left ("before Earth existed," "before any star
  existed") — that collapse of the anchor device is the run-up to the CMB
  wall, not a separate decoration.

## Explicitly excluded

- No redshift formula, no explanation of *how* lookback time is derived —
  only the result (distance and time diverge; the CMB is a hard boundary).
- No second dial/toggle beyond distance-vs-time (e.g. no separate "speed of
  light" playback mode) — the divergence between the two labels at each
  waypoint carries that idea without a second mechanic.
- No attempt at statistical/scientific rigor beyond getting each stated
  number right — this is an explainer, not a research artefact.

## Waypoint list (fact-checked 13 Aug 2026 — figures below, anchor wording still to write)

Ordered nearest → CMB. Anchor *numbers* are checked; the actual anchor
*copy* (voice, phrasing) is still to write during content pass, so treat the
right-hand column as "what's true," not "what ships."

| # | Waypoint | Lookback time | Anchor fact it lines up with |
|---|---|---|---|
| 1 | Moon | ~1.3 light-seconds | (arithmetic: 384,400 km / c — no anchor needed) |
| 2 | Sun | ~8.3 light-minutes | (arithmetic: 149.6M km / c) |
| 3 | Proxima Centauri (nearest star) | ~4.2 light-years | generic human-scale ("about a degree's length ago") |
| 4 | Vega (naked-eye star) | ~25 light-years | generic human-scale ("about a generation ago") |
| 5 | The Milky Way's core (Sagittarius A*) | ~26,000 light-years | the Last Glacial Maximum (conventionally ~26,500–19,000 years ago) — peak Ice Age, mammoths still common |
| 6 | Andromeda Galaxy | ~2.5 million light-years | genus *Homo* first appears in the fossil record, ~2.5–2.8 million years ago — near-exact match |
| 7 | Virgo Cluster (M87) | ~54 million light-years | early Eocene, not long after the dinosaurs' extinction (66 Mya) — early primates spreading |
| 8 | Quasar 3C 273 | ~2.4 billion light-years | the Great Oxidation Event, ~2.4 billion years ago — Earth's atmosphere first gains oxygen |
| 9 | GN-z11 | ~13.4 billion light-years | before Earth existed (Earth: ~4.5 billion years old) — human-scale anchors run out here |
| 10 | JADES-GS-z14-0 (earliest confirmed galaxy) | ~13.5 billion light-years, z ≈ 14.2–14.3 | ~300 million years after the Big Bang itself — already checked in the spike, re-confirmed here |
| 11 | The reionization fog | — | narrative bridge, not a numbered object: the practical edge of what any telescope could ever resolve |
| 12 | Cosmic Microwave Background / recombination | ~13.8 billion years minus ~380,000 years | **the wall. There is no anchor older than this, because nothing shone before it — the zoom settles here, then hands off to closing text, not a hard scroll-stop.** |

Sources checked this session: [M87/Virgo distance](https://www.britannica.com/place/Virgo-cluster) (~53.5–55 Mly, multiple NASA/Hubble sources agree), [3C 273](https://en.wikipedia.org/wiki/3C_273) (z=0.158, ~2.4 Gly luminosity distance), [GN-z11](https://en.wikipedia.org/wiki/GN-z11) (z≈10.6, 13.4 Gly light-travel distance), [JADES-GS-z14-0](https://en.wikipedia.org/wiki/JADES-GS-z14-0) (z≈14.18–14.32, 13.428 Gly), [Great Oxidation Event timing](https://asm.org/articles/2022/february/the-great-oxidation-event-how-cyanobacteria-change) (~2.4 Gya consensus), [Sagittarius A* distance](https://en.wikipedia.org/wiki/Sagittarius_A*) (~26,000–27,000 ly across measurement methods), [Andromeda distance / Homo genus timing](https://public.nrao.edu/ask/are-we-seeing-the-andromeda-galaxy-as-it-was-2-5-million-years-ago/) (2.5 Mly vs. 2.5–2.8 Mya — coincidence, not causally related, but numerically solid).

## Build order (the actual safety net)

1. Waypoint data module + continuous-zoom engine (`zoom.ts`), proved on
   **two** waypoints only (Moon → Sun) — confirms the entrance grammar and
   feel before any scaling up. Done — reviewed and approved.
2. Near-to-mid waypoints (2–7) — still ordinary, still human-scale anchors.
3. The cosmological jump (8–11) — where anchors start failing, which is the
   point.
4. Final polish on the CMB waypoint — the payoff has to land, budget real
   time for it rather than treating it as "just another waypoint." Done —
   grammar decided with Matt before building (see Core interaction above),
   built, and screenshotted at both viewports.

If time runs short, the piece stops wherever the build order has reached —
truncating the tail (more mid-distance galaxies) rather than the argument
(the near end and the wall are built first either way).
