# TASKS

Small rolling working set. Collapse to one line + commit link once done —
see `CLAUDE.md`.

## Current

- [ ] Resize-mid-scroll check (not yet done — only fixed-viewport checks so
  far).

## Next

- [ ] `pnpm check:evidence` + linkinator, all green (full `pnpm check` is
  already green through the CMB, all 12 waypoints).
- [ ] `PROCESS.md` (400–600 words, 3–4 cited moments) and
  `reflections/assignment-1.md` (150–300 words).
- [ ] `/ship`, then verify the live URL at both viewports.

- [x] Matt: objects still too small on desktop; Moon design approved but
  Sun/Proxima Centauri star design disliked ("remove the sticks coming out,
  add more texture"). Fixed sizing at the CSS layer (`.layer svg` from fixed
  `12rem` to `clamp(12rem, 34vmin, 26rem)` in `styles.css`) so every object
  scales up substantially on wide desktop viewports while staying numerically
  unchanged on the 390×844 phone viewport (34vmin < 12rem floor there).
  Removed `radialRays`/`diffractionSpike` flares from Sun, Proxima Centauri,
  and Vega in `main.ts`; added a new seeded `surfaceTexture` generator in
  `starfield.ts` (mottled light/dark blotches within the disk) in their place,
  parameterised per star (warm granulation/sunspots for the Sun, reddish
  starspots for Proxima, subtle blue-white mottling for Vega). 3C 273's
  spikes deliberately left as-is — a quasar's diffraction-spike look reads as
  a real photographic feature, not the "stick" look on stars that was
  rejected. `pnpm check` green throughout. Verified in Chrome at true
  1920×1080 and 390×844 (via `agent-browser set viewport`, not the unreliable
  `open --viewport` flag) across all waypoints — desktop renders are ~2x
  larger and Sun/Proxima/Vega show mottled texture with no spikes; phone
  renders match prior sizing; 3C 273 and JADES-GS-z14-0 also checked at the
  new size and read correctly.

## Done (collapsed)

- [x] Fact-check waypoint numbers and anchors — see `PLAN.md`.
- [x] First proof slice (Moon + CMB, discrete IntersectionObserver sections)
  — rejected by Matt: not the mechanic he wants. Superseded, see below.
- [x] Rebuilt as continuous zoom: tall `.track` + sticky `.stage`, native
  `scroll` listener drives one `progress` value, per-layer keyframes
  (`zoom.ts`: `interpLayer`/`currentWaypoint`/`clampProgress`) interpolate
  scale/x/y/opacity. Proved on Moon → Sun, matching Matt's own example
  (sun starts oversized off to the right, invisible; fades in while still
  huge; converges to centred/1× as the moon shrinks to a dot and fades).
  `pnpm check` green (typecheck, build, lint, 21 tests). Screenshotted in
  Chrome at 1920×1080 and 390×844 across progress 0 → 1 — moon-only, both
  visible mid-transition, and sun-settled all render as intended at both
  viewports. Track ends into a `.payoff` section (ordinary scroll, no hard
  stop) — confirmed with Matt this replaces the old hard-clamp-at-CMB plan.
- [x] Matt reviewed the Moon→Sun slice live and approved it ("looks a lot
  better") — cleared to roll out the rest of the waypoint list.
- [x] Waypoints 3–7 (Proxima, Vega, Sagittarius A*, Andromeda, Virgo
  Cluster) rolled out onto the same engine. Field-reveal grammar assigned
  to Sagittarius A* (star→galaxy) and Virgo Cluster (galaxy→cluster) per
  Matt's confirmed choice; the rest stay sibling-body, alternating side of
  entrance for visual variety. Progress range retimed for 7 waypoints
  (track height 300vh → 1050vh; Sun's `from` moved 0.3 → 0.09 to make
  room — same mechanic, just pacing). Rendered and screenshotted in Chrome
  at 1920×1080 and 390×844 across all seven waypoints and both field-reveal
  transitions — sibling entrances slide in from alternating sides and
  converge; field-reveals grow in centred with no lateral offset, reading
  as visually distinct from sibling transitions at both viewports.
  `pnpm check` green (typecheck, build, lint, 21 tests — updated
  `spec/depth-as-time.test.ts`'s hardcoded thresholds to match the retimed
  schedule).
- [x] Waypoints 8–11 (3C 273, GN-z11, JADES-GS-z14-0, reionization fog)
  rolled out — build order stage 3 done. 3C 273 → GN-z11 → JADES-GS-z14-0
  stay sibling-body, alternating side, per the decided grammar. The
  reionization fog uses the new veil treatment: implemented as a
  `LAYER_MARKUP`/`LAYER_FRAMES` entry like every other waypoint (a
  full-bleed gradient `div` instead of a small SVG, frames holding
  scale/position constant and ramping only opacity) — turned out simpler
  than the two-list `staged` split anticipated when the grammar was
  decided, since it needed no change to `main.ts`'s render loop. JADES's
  own layer holds at scale 1 with no exit shrink; the veil obscures it
  from on top rather than it flying off. Progress schedule retimed again
  for 11 stops (track height 1050vh → 1650vh; every earlier `from`
  threshold rescaled, values unchanged relatively). Rendered and
  screenshotted in Chrome at 1920×1080 and 390×844 across all four new
  waypoints and the fog transition — the veil's vignette visibly thickens
  over progress and the HUD switches to "The Reionization Fog" exactly at
  its threshold; earlier waypoints (moon, sun, Sagittarius A*, Virgo
  Cluster) re-checked and still read correctly after the retime.
  `pnpm check` green (typecheck, build, lint, 21 tests — updated
  `spec/depth-as-time.test.ts`'s thresholds again).
- [x] CMB waypoint (12th and last) — build order stage 4 done. Grammar
  decided with Matt before building, via `AskUserQuestion`, not assumed:
  (1) the bright wall punches through the dark fog rather than the fog
  receding first — the fog veil now holds at its max forever, and the CMB's
  bright veil is a second layer appended after it that paints on top,
  reading as "the wall was what the fog was hiding," not a passage through
  to somewhere lighter; (2) after its peak the bright veil recedes back to
  0 before the track ends, so `.payoff` lands on the site's normal dark
  background instead of a hard white cut. Same `LAYER_MARKUP`/`LAYER_FRAMES`
  mechanism as the fog, just a warm-white gradient (grounded in the
  ~3000K blackbody colour of recombination-era plasma, not a clinical
  white) instead of dark. Progress schedule rescaled again for 12 stops
  (track height 1650vh → 1800vh; every earlier threshold compressed by
  11/12 to make room, same relative pacing). Wrote the real `.payoff`
  closing text (was a placeholder scoped to the old 2-waypoint slice).
  `pnpm check` green; `spec/depth-as-time.test.ts` thresholds updated again
  plus a new assertion for the `cmb` waypoint.
- [x] Redesigned every inline SVG (Matt: too small/simple, galaxy shapes
  especially needed to be "tons of tiny stars," not flat gradients). New
  `starfield.ts` module: seeded-PRNG (`mulberry32`, not `Math.random()`, so
  the field is identical every reload) star-dot generators, one shape per
  galaxy type — face-on 2-arm spiral for Andromeda, edge-on disk+bulge for
  Sagittarius A* (we view the Milky Way from inside its plane, so no arms
  show), clumpy irregular for GN-z11/JADES (scientifically apt for young,
  still-assembling high-z galaxies), cluster-of-dot-clusters for Virgo.
  Flatten/rotation done via manual coordinate math rather than SVG
  `transform`, so individual star dots stay circular. Proved on Andromeda
  first, reviewed, then rolled out to the rest. Non-galaxy bodies (Moon,
  Sun, Proxima, Vega, 3C 273) got richer hand-detail instead of a
  star-field treatment — more craters + terminator shading, corona rays +
  granulation, diffraction spikes, 3C 273's jet knots. `pnpm check` green
  throughout. Screenshotted in Chrome at both 1920×1080 and 390×844 across
  all 10 redesigned waypoints, including close-up enlarged views of the
  galaxy shapes — all read correctly at both viewports.

## Open blockers / unresolved decisions

- Text-position-follows-object-shape is explicitly deferred, not a
  blocker (see `PLAN.md`/session notes) — plain fixed HUD is fine for now.
