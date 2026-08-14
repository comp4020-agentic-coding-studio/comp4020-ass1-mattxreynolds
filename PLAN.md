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
transform math. On desktop, waypoints with diegetic callout cards (see below)
replace the HUD entirely rather than showing alongside it.

## Desktop info cards (rolled out to all 10 point-source waypoints)

Per-waypoint info was previously four short strings (name, distance,
lookback, one gated relatable-analogy) — thin, and missing the single most
obviously-expected fact: what the object actually *is*. Fixed by splitting
each waypoint's diegetic callout into two cards instead of one:

- **Measurement card**: name, distance, lookback label, gated "What does
  that mean?" relatable analogy. Always visible, positioned with a fixed
  per-waypoint offset (`CARD_OFFSETS`) pushed clear of the object's image so
  it doesn't overlap it.
- **Identity card**: one factual "what is this" line (`Waypoint.whatIsIt`).
  Originally always-visible like the measurement card; changed to a
  hover-triggered tooltip (Matt: "only appear when the user hovers over the
  image ... appear where the cursor is") — `position: fixed`, positioned at
  the cursor via `wireIdentityHover` in `main.ts` (mouseenter/mousemove/
  mouseleave on the waypoint's own `<img>`), edge-aware so it never overflows
  the viewport. No leader line, since it appears where the cursor already
  is. Force-hidden if the waypoint's opacity drops below the visibility
  threshold, so it can't get stuck open while scrolling past without moving
  the mouse.

Applies to the 10 point-source waypoints (Moon through JADES-GS-z14-0), not
reionization fog or the CMB — both stay on the fixed `.hud` permanently, not
just for now: fog has no discrete object to anchor a leader-line to, and the
CMB's meaning is already carried by `.payoff` immediately following it.

**Measurement card offsets are per-waypoint tuned, not a shared constant.**
The original assumption was that one diagonal offset pair could be reused
everywhere, since every object settles dead-centre-of-stage before its held
window (see `LAYER_FRAMES`). That's true at rest, but entrance sweeps break
it: Moon's card had to move from the upper-right to the upper-left because
the Sun sweeps in from the right (`LAYER_FRAMES.sun`'s positive entrance `x`)
and a right-side card sat directly in its path; Sun's own card stays
left-leaning because Sun's entrance already pushes it far right, and a
further-right offset ran off the viewport edge before Sun settled. Offsets
were retuned again (Matt: card was overlapping the image) to clear the
object's rendered footprint entirely rather than just its centre point —
Moon `-170,-130` → `-460,-130`, Sun `-190,140` → `-480,140` — using more of
the open screen space either side.

Rolled out to the remaining 8 waypoints using a general rule derived from the
Moon/Sun precedent rather than reused numbers: each sibling-body waypoint's
card sits on the side **opposite** its own `LAYER_FRAMES` entrance-sweep sign
(dodges its own oversized entrance), and the vertical sign **alternates
between every adjacent pair** regardless of which side each lands on — that's
what lets two neighbours safely share an x-side (as e.g. Sagittarius A* and
Andromeda, and Virgo Cluster and 3C 273, both do) without their cards
colliding during a crossfade. The two field-reveal waypoints (Sagittarius A*,
Virgo Cluster) have no lateral entrance to dodge, so their side just
continues the left/right alternation implied by neighbours, with a larger
offset magnitude (500 vs ~460) to clear their bigger peak oversized scale
(2.6x vs 2.2x). Verified live in Chrome at 1920×1080 across all 10 waypoints'
settled states plus the two same-side crossfade moments specifically (no
collision in either); hover spot-checked on Proxima Centauri, both
field-reveal waypoints, and JADES-GS-z14-0 — correct content, no overlap with
the measurement card, edge-aware positioning holds. 390×844 spot-checked on
two of the new waypoints — HUD-only, unchanged. The identity card itself
needs no offset — it's a cursor-following hover tooltip, not part of this
stacked-offset geometry (see above).

Desktop-only for now (`.callouts` already hides under the 768px breakpoint);
how this looks on mobile — a second stacked HUD section rather than a second
floating card, most likely — is an explicit later decision.

Data for all 10 point-source waypoints lives in `waypoints.ts` (`whatIsIt`
field) and all 10 are wired into the card system (`CARD_OFFSETS` in
`main.ts`).

## Follow-up polish (planned, not yet built)

- **Ruler labels**: each `.ruler-segment` already carries `unitRegime()` text
  (seconds/years/millennia/…) but it's `font-size: 0` under an `aria-hidden`
  parent — dead to everyone, sighted or screen-reader. Un-hide it visually so
  the scale escalation reads directly off the ruler; leave the container
  `aria-hidden` since the range input's own `aria-valuetext` already covers
  the same information for screen readers.
- **Ruler progress dimming**: segments already scrolled past should dim
  relative to what's ahead, so the ruler reads as "how much further," not
  just "where."
- **Hook mechanism sentence**: `.hook` currently asserts "everything you see
  is already the past" without explaining why. Add one sentence on finite
  light speed as the actual mechanism after the existing paragraph — keep it
  to one sentence so the hook stays tight.

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
