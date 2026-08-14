# TASKS

Small rolling working set. Collapse to one line + commit link once done —
see `CLAUDE.md`.

## Next
- [x] Reworked jades→fog and fog→CMB transition timing: both now reuse the
  same `DURATIONS.exitShrink`/`fadeIn` and `GAPS.sibling` overlap as every
  sibling transition on the site, instead of a bespoke early fade-in start
  and a fully-simultaneous 75vh crossfade — Matt flagged the old timing had
  "way more overlap than others." See `PLAN.md`. `pnpm check` green
  (typecheck, build, lint, 33 tests). Verified with a CDP opacity-scrub
  script across both transitions: outgoing drops ≤0.1 well before incoming
  reaches ≥0.9, matching the rest of the site's transitions.
- [x] Reworked the final 2 waypoints (reionization fog, CMB) onto the same
  2-card diegetic callout system as the other 10 (`whatIsIt` copy +
  `CARD_OFFSETS` in `main.ts`). Split the old single gated-ids set into
  `HAS_CARD_IDS` (now all 12, drives desktop card + HUD suppression) and
  `ANCHOR_REVEAL_IDS` (still just the original 10), so their new desktop
  card doesn't also start gating their anchor behind mobile's legacy
  reveal-button — see `PLAN.md`. `pnpm check` green (typecheck, build,
  lint, 33 tests). Verified live in Chrome at 1920×1080 and 390×844: both
  measurement cards + hover identity tooltips render correctly with no
  overlap on either waypoint's imagery; mobile unaffected (still
  full-width HUD, not gated). See `6fc128d`.
- [ ] Decide mobile treatment for the two-card layout (deferred, not
  assumed to be "the same, just smaller" — see PLAN.md).
- [ ] Resize-mid-scroll check (not yet done — only fixed-viewport checks so
  far).
- [ ] `pnpm check:evidence` + linkinator, all green (full `pnpm check` is
  already green through the CMB, all 12 waypoints).
- [ ] `PROCESS.md` (400–600 words, 3–4 cited moments) and
  `reflections/assignment-1.md` (150–300 words).
- [ ] `/ship`, then verify the live URL at both viewports.

- [x] Added `title`/`closing` bookend layers as schedule slots (no image,
  outside the staged/HUD/ruler/callout machinery), replacing the standalone
  `.hook`/`.payoff` sections. Title scales *up* while fading out (the one
  exit that doesn't shrink — framed as nearer than everything else, so it
  reads as the camera pushing through it); Moon's own entrance now starts
  ~85% into that fade rather than concurrently. CMB now fades back out
  before the track ends instead of holding forever, and the closing text
  fades in near the end of that fade-out — see `PLAN.md`. `pnpm check`
  green. Verified live in Chrome at 1920×1080: title reads at t=0, Moon
  entrance timing looks right against the title's fade, CMB recedes to
  near-black before the closing text arrives, no hard cut to background.
- [x] Card damped-scale: measurement cards now scale with their waypoint
  (`dampedScale()` in `zoom.ts`, wired via `--callout-scale` in
  `positionCard()`) instead of sitting fixed-size while the object balloons
  in and shrinks to a dot. `pnpm check` green. Verified live in Chrome at
  1920×1080 across several waypoints — card grows subtly on oversized
  entrance, stays near-1× during the hold, recedes on exit alongside the
  object, without ever becoming illegible.
- [x] Replaced hand-picked per-waypoint `LAYER_FRAMES`/`from` arrays with a
  schedule generator (`schedule.ts`: `buildSchedule`/`normalizeSchedule`),
  proved on Moon→Sun first, then rolled out to all 10 point-source
  waypoints plus fog/CMB. Retiming and transition-overlap tuning are now
  parameter changes (`DURATIONS`/`GAPS` in `site-schedule.ts`), not a
  fifth hand re-derivation. `schedule.test.ts` asserts the
  outgoing-opacity-≤0.1-before-incoming-opacity-≥0.9 rule across every
  generated transition. `pnpm check` green; `spec/depth-as-time.test.ts`
  updated to compute expected thresholds from the generator instead of
  hand-copied numbers.
- [x] Fixed the waypoint-5 (Sagittarius A*) content/image mismatch: the
  rendered image was a tilted external spiral-galaxy photo, physically
  impossible as a view of our own galaxy's core from inside it, and
  near-duplicated the very next waypoint's Andromeda photo. Swapped in a
  black-hole illustration (accretion disk + polar jets + lensing ring) and
  fixed the alt text (was describing "seen from its core," the only
  waypoint diverging from the name-as-alt-text convention). `pnpm check`
  green. Verified live in Chrome — the black hole now reads as visually
  distinct from Andromeda's spiral, and `whatIsIt` copy already correctly
  headlined the black hole so needed no change.
- [x] Ruler polish: un-hid segment labels, found `overflow: hidden` on
  `.ruler-segments` was clipping anything extending outside its narrow box
  (fixed by moving corner-rounding onto the end segments instead of the
  parent), explored a label-merging/bracket variant, then reverted labels
  entirely per Matt's review ("I don't think i like the labels for now") —
  kept the overflow fix and added `.past`/`.current` progress dimming on
  the segment bar, which Matt didn't object to. `pnpm check` green
  (typecheck, build, lint, 33 tests). Verified live in Chrome at 1920×1080
  across several progress values — bar dims/brightens correctly, no
  visible label text, no regression to callouts or the HUD.
- [x] Anchor fact redesign: prototyped click-to-reveal "toggle" (Moon) vs.
  always-visible "static" (Sun) side by side, per Matt's request after
  flagging the old pill-button reveal as flat/inconsistent. Matt judged
  live and picked static — rolled out to all 10 point-source waypoints,
  removing the click gate and `wireReveal` wiring from every desktop
  callout (mobile HUD reveal unaffected). Reworded the label ("What does
  that mean?" → "In human terms") and trimmed JADES-GS-z14-0's anchor to
  drop a clause duplicating `whatIsIt`, both to fit an always-on statement
  rather than a click-prompt/answer — see `PLAN.md`. `pnpm check` green
  (typecheck, build, lint, 26 tests). Verified live in Chrome at 1920×1080:
  Moon/Sun/JADES-GS-z14-0 all render the static label+text correctly, no
  overflow or overlap even on JADES's longer 5-line anchor text.
- [x] Rolled out identity/measurement cards to the remaining 8 point-source
  waypoints (Proxima Centauri → JADES-GS-z14-0). Derived a general offset
  rule instead of reusing Moon/Sun's numbers (card x-side opposite the
  waypoint's own entrance-sweep sign; y-sign alternating between every
  adjacent pair; larger magnitude for the two field-reveal waypoints) — see
  `PLAN.md`. `pnpm check` green (typecheck, build, lint, 26 tests). Verified
  live in Chrome at 1920×1080: all 10 waypoints' settled states clean, plus
  the two same-x-side adjacent crossfades (Sagittarius A*/Andromeda,
  Virgo Cluster/3C 273) specifically checked for collision — none found.
  Hover spot-checked on Proxima Centauri, both field-reveal waypoints
  (Sagittarius A*, Virgo Cluster — different image shapes than the
  sibling-body stars/galaxies), and JADES-GS-z14-0 — correct content, no
  overlap. Spot-checked 390×844 on two of the new waypoints — HUD-only,
  unchanged.
- [x] Desktop identity/measurement card slice (Moon/Sun) — `pnpm check` green
  (typecheck, build, lint, 26 tests). Verified live in Chrome at 1920×1080
  (`agent-browser`, dev server): Moon settled + Sun entering large/offscreen
  right shows both waypoints' cards with no overlap between them; Sun fully
  settled shows its measurement/identity pair cleanly stacked opposite each
  other with no clipping. Spot-checked 390×844 too (not required for this
  slice, desktop-only) — callouts correctly stay hidden there, HUD unchanged.
  Cleared to roll out to the remaining 8 waypoints.
- [x] Matt: identity card should only appear on hover, at the cursor; move
  the measurement card further out so it stops overlapping the image.
  Converted identity card to a `position: fixed` cursor-following tooltip
  (`wireIdentityHover` in `main.ts`, edge-aware so it never overflows the
  viewport); force-hidden if the waypoint's opacity drops below the
  visibility threshold so it can't stick open while scrolling past.
  Retuned `CARD_OFFSETS` (Moon/Sun) so the measurement card fully clears the
  image footprint instead of just its centre. Found and fixed a real bug
  along the way: every waypoint's full-viewport `.layer` div was
  hit-testable even while transparent, so the topmost one in DOM order
  silently ate all hover/click events across the whole stage — fixed with
  `pointer-events: none` on `.layer`, with only the actively-hoverable image
  itself re-enabled per frame. Also found the measurement card's leader line
  now crosses back over the (further-away) image and was itself blocking the
  hover it should have no opinion about — fixed with `pointer-events: none`
  on `.callout-leader-h`/`-v`. `pnpm check` green (typecheck, build, lint,
  26 tests). Verified live in Chrome at 1920×1080: Moon and Sun hover both
  trigger the tooltip at the cursor with correct content and no overlap;
  measurement cards on both are clear of their images; scrolling past Sun
  without moving the mouse correctly closes the tooltip rather than leaving
  it stuck. Spot-checked 390×844 — unchanged, HUD-only as before.
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
