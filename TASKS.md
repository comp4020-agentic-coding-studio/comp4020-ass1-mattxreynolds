# TASKS

Small rolling working set. Collapse to one line + commit link once done —
see `CLAUDE.md`.

## Next
- [x] Mobile adaptation, step 1: fixed the mobile HUD staying visible over
  the closing text (`hud-suppressed` conflated "handed off to a desktop
  card" with "reached the closing beat" under one `@media (width >=
  768px)`-gated class, so the closing signal never took effect on mobile).
  Split into `hud-suppressed` (desktop-only, unchanged) and a new
  viewport-independent `hud-ended`. See `f6292f1`.
- [x] Mobile adaptation, step 2: dropped the mobile anchor click-gate
  (`ANCHOR_REVEAL_IDS`/`wireReveal`/`.hud-anchor-reveal` button) so the
  anchor fact is always-visible on every waypoint, matching the static
  (not click-gated) anchor decision already made for desktop — see
  `PLAN.md`. `pnpm check` green (typecheck, build, lint, 34 tests).
  Verified live in Chrome at 390×844: Moon and Vega (both previously
  gated) now show the anchor line immediately with no button in the DOM;
  spot-checked 1920×1080 unaffected (HUD still correctly suppressed in
  favour of the diegetic card there).
- [x] Mobile adaptation, step 3: fixed title/closing resting-scale overflow
  on mobile. `TITLE_SCALE`/`CLOSING_SCALE` = 1.8 in `site-schedule.ts`
  overflowed a 390px viewport (390 × 1.8 = 702px measured bounding-box
  width) since it's a CSS transform on top of a correctly max-width-capped
  layout box, not a layout bug — the box only has headroom to scale up on
  viewports wider than its 32rem cap. Added `maxSafeTextLayerScale()` in
  `main.ts`, clamping the applied title/closing scale to whatever the live
  viewport width can afford each frame, computed from `window.innerWidth`
  rather than a hardcoded breakpoint — self-corrects on resize too.
  `pnpm check` green (typecheck, build, lint, 34 tests). Verified live in
  Chrome: 390×844 title and closing layers both measure exactly 390px wide
  (viewport width, no overflow) at their most-scaled points; 1920×1080
  spot-check confirms `getComputedStyle(...).transform` is still exactly
  `matrix(1.8, 0, 0, 1.8, 0, 0)` at the title's rest state — byte-identical
  to before.
- [x] Mobile adaptation, step 4: full-width bottom-sheet HUD design on Moon
  only, replacing the plain fixed HUD for that one waypoint. First built as
  a collapse/expand proof-of-concept, but Matt reviewed it live and said
  there's enough room to keep it permanently expanded — dropped the
  toggle/swipe/chevron interaction entirely (`wireHudSheet` removed from
  `main.ts`) in favour of always showing name + distance + lookback + anchor
  in one card. Also added the "In human terms" label above the anchor text
  (`.hud-anchor-label`), matching desktop's `.callout-anchor-static-label`
  framing, and fixed the name/distance row using `align-items: baseline`
  instead of `center` so differently-sized text shares one baseline instead
  of being vertically centred against each other. Scoped with a
  `HUD_SHEET_IDS` set (`main.ts`) and a `.hud-sheet` class that only gets
  any layout inside the existing mobile `@media` block, so every other
  waypoint's HUD and all of desktop are untouched by construction. `pnpm
  check` green (typecheck, build, lint, 34 tests). Verified live in Chrome
  at 390×844: Moon's card is permanently expanded with the label present
  and the name/distance baselines confirmed aligned via
  `getBoundingClientRect`; Sun (unchanged waypoint) still shows the
  compact always-visible card with no label. Spot-checked 1920×1080: HUD
  stays correctly suppressed on Moon (diegetic card instead), no visual
  change.
- [x] Mobile adaptation, step 5: rolled the always-expanded bottom-sheet HUD
  out to the remaining 11 waypoints. Since it's now the universal design
  (no waypoint keeps the old compact HUD), folded away the `HUD_SHEET_IDS`
  set and `.hud-sheet` modifier-class toggle entirely — `main.ts`'s
  waypoint-change block no longer touches HUD classes at all, and
  `styles.css` applies the sheet layout directly to the base `.hud`/
  `.hud-summary`/`.hud-anchor-label` selectors inside the existing mobile
  `@media` block, since there's no more per-waypoint variation left to
  scope against. Desktop untouched by construction — the whole block still
  only ever applies inside the mobile media query, and `hud-suppressed`
  (all 12 ids now in `HAS_CARD_IDS`) keeps the HUD hidden there in favour
  of the diegetic card, as before. `pnpm check` green (typecheck, build,
  lint, 34 tests). Verified live in Chrome at 390×844 across all 12
  waypoints: each shows the permanently-expanded card with correct name,
  distance, lookback, "In human terms" label, and anchor text, and the
  card correctly disappears at the closing beat. Spot-checked 1920×1080 at
  three waypoints (Moon, Vega, Quasar 3C 273) — HUD stays suppressed
  everywhere, diegetic callout card renders exactly as before, no visual
  change from the pre-rollout baseline.
- [ ] Mobile adaptation, step 6: full mobile regression pass (resize
  mid-scroll, touch-drag ruler thumb, flick-scroll) + re-screenshot
  desktop at fixed progress points to confirm pixel-identical to the
  pre-mobile-work baseline. Deprioritised for now in favour of three
  issues Matt flagged after live review: the vertical ruler wasting
  horizontal space, blank space above the images going unused, and
  waypoint 5+ images overflowing the viewport (see below).
- [x] Fixed waypoint 5+ (Sagittarius A* onward) and CMB overflowing the
  mobile viewport horizontally. Root cause: the base `clamp()` sizing
  (`36rem`/`24rem` floors, set for desktop headroom) uses `vmin`, which on
  a narrow/tall phone equals viewport *width* — `104vmin` evaluated to
  less than the `36rem` (576px) floor on a 390px-wide screen, so the
  fixed floor won and produced a box far wider than the viewport
  regardless of the preferred value. Re-derived as `min(92vw, cap)` inside
  the mobile media query instead, tying the size to actual viewport width
  so it can never exceed it, while keeping the original larger cap for
  wider phones/tablets near the 767px breakpoint. `pnpm check` green
  (typecheck, build, lint, 34 tests). Verified live in Chrome at 390×844
  across all 6 affected waypoints plus CMB — all settle within the
  viewport with margin, no cropping. See `a3d9583`.
- [x] Built the mobile "what is this?" floating card, proved on Moon only.
  Desktop's identity tooltip only appears on hover, which has no touch
  equivalent, so mobile gets an always-rendered card instead
  (`identity-mobile` in `index.html`, wired in `main.ts`), sized and styled
  like the desktop hover card (compact, translucent, rounded) rather than
  the bottom sheet's full-width treatment — Matt's explicit choice over a
  full-width top card. Sits at a fixed position in the blank space between
  the ruler and the image (not tracked to the image's own live offset, same
  idea as the bottom-sheet HUD), and fades with the current waypoint's own
  opacity rather than snapping on/off, so it crossfades the same way the
  desktop card fades in on hover. Scoped to Moon alone via a
  `MOBILE_IDENTITY_IDS` set, mirroring the earlier `HUD_SHEET_IDS`
  proof-then-rollout pattern. Found and fixed a source-order CSS bug along
  the way: the base `.identity-mobile { display: none; }` rule was placed
  after the mobile media query that un-hides it, so it always won
  regardless of viewport — moved it before that block. `pnpm check` green
  (typecheck, build, lint, 34 tests). Verified live in Chrome at 390×844: a
  progress scrub confirms the card stays hidden through the title screen,
  fades in as Moon's own opacity rises, crossfades out in step with Moon
  during the Moon→Sun transition, and stays hidden on every other waypoint.
  Spot-checked 1920×1080 — `display: none` confirmed computed, no visual
  change from the pre-existing desktop layout.
- [x] Two follow-up fixes after Matt reviewed the full 12-waypoint rollout
  live. (1) Every waypoint but the Moon was popping its identity card in at
  full opacity instead of fading it in, while fade-outs all looked correct —
  root cause: the shared `identityMobileEl` was driven by `currentWaypoint`,
  whose own switch-over point (`from` in schedule.ts) is the midpoint of
  `fadeInEnd` and `convergeEnd` — both *after* a sibling/field-reveal
  entrance's opacity ramp already finishes at `fadeInEnd`. Moon only looked
  right because it's `current` by default from progress 0, so it tracks its
  own opacity from the very start; every other waypoint stayed hidden
  through its entire fade-in (showing only the outgoing card's fade-out)
  then snapped to opacity 1 the instant `current` flipped. Fixed by driving
  the card from whichever waypoint has the highest live opacity each frame
  instead of `current` — this crossfades naturally (the outgoing card dips
  as the incoming one rises) and makes every waypoint's fade-in visible, not
  just the first. (2) Moved the card a little higher at rest for sun,
  proxima-centauri, and vega only (Matt's explicit per-waypoint call, not
  Moon): `y` -180 → -200 for those three, reducing the numeric box overlap
  with the image (Sun/Vega ~-27px/-17px vs Moon's -47px, left as-is) to
  where screenshots show clean visual clearance. `pnpm check` green
  (typecheck, build, lint, 34 tests). Verified live in Chrome at 390×844: an
  opacity scrub through each of Sun/Proxima Centauri/Vega/Sagittarius A*'s
  entrances confirms a continuous fade (dip-then-rise at the crossover, no
  jump), a wider scrub confirms Moon's own fade-in (0→1 over ~p 0.024-0.044)
  is unchanged, and screenshots of Sun/Proxima Centauri/Vega at rest confirm
  the raised offset clears the image with no overlap. Spot-checked
  1920×1080 across six progress points — `.identity-mobile` computed
  `display: none` throughout, unaffected; re-confirmed Moon's own rest
  screenshot unchanged from before this pass.
- [x] Rolled the mobile identity card out to the remaining 11 waypoints.
  `MOBILE_IDENTITY_OFFSETS` (`main.ts`) now covers all 12 ids (the same set
  as desktop's `CARD_OFFSETS`/`HAS_CARD_IDS`), grouped by the image's own
  rendered mobile size rather than one-offset-per-waypoint: `x: 0`
  everywhere (the card stays centred above the image and sways with the
  same live sibling-entrance sweep the image itself gets, no per-waypoint
  side needed), `y: -180` (Moon's proven value) for the four sibling-body
  waypoints sized by the base clamp (~224px tall on a 390px phone), and
  `y: -250` for the six field/point-source waypoints bumped to `min(92vw,
  cap)` on mobile (~359px tall) plus the fog/CMB veils, which have no
  discrete object to clear but fill the same screen area. `pnpm check`
  green (typecheck, build, lint, 34 tests). Verified live in Chrome at
  390×844: a coarse progress scrub across the whole track confirms the
  card shows during every waypoint's hold and hides at every transition
  gap and on the title/closing screens; `getBoundingClientRect` at each
  waypoint's settled point confirms no horizontal or vertical overlap with
  its image, including the tightest margins (the six `-250` waypoints);
  screenshotted Sun, Sagittarius A*, 3C 273, the fog, and CMB to confirm
  visually — all clear, legible, no collision even where the numeric
  margin was under 15px. Spot-checked 1920×1080 across four waypoints —
  `.identity-mobile` computed `display: none` throughout, unaffected.
- [x] Two follow-up fixes to the mobile identity card after Matt reviewed the
  widen/attach version live. (1) Moved the card's rest position down and
  closer to the Moon (`MOBILE_IDENTITY_OFFSETS.moon.y`: -276 → -180,
  shrinking the gap between card and image from ~117px to ~21px), and made
  it converge toward the object's own position as it fades rather than
  holding still while shrinking: `--identity-x`/`--identity-y` now multiply
  the fixed offset by the object's own `state.opacity`, so at opacity 0 the
  offset is 0 and the card sits exactly on the object's (centred) position
  — verified via a progress scrub showing the card's centre converging to
  (195, ~419) on a 390×844 viewport, matching the image's own collapse
  point, during the Moon→Sun exit. (2) Fixed the card being faintly visible
  on the title screen and every other waypoint: the mobile media query's
  `.identity-mobile { display: block }` had the same specificity as the
  browser's `[hidden] { display: none }`, and author styles win that tie
  regardless of the `hidden` attribute — so the card was always rendered on
  mobile, visible at whatever stale opacity main.ts had last set, not just
  hidden as intended. Fixed by scoping the override to
  `.identity-mobile:not([hidden])`. `pnpm check` green (typecheck, build,
  lint, 34 tests) after both fixes. Verified live in Chrome at 390×844:
  screenshots confirm the card sits tight above the Moon at rest, visibly
  shrinks/drifts to centre during fade-out, and is completely absent (not
  just faint) on the title screen and on Vega. Spot-checked 1920×1080 —
  `.identity-mobile` computed `display: none` throughout, unaffected.
- [x] Widened the mobile identity card and replaced its fixed-position
  crossfade with the same "attach to the object" mechanism desktop's
  measurement cards already use — Matt's explicit feedback after reviewing
  the Moon-only proof-of-concept. Replaced `MOBILE_IDENTITY_IDS` with a
  `MOBILE_IDENTITY_OFFSETS` map (`main.ts`, structurally identical to
  `CARD_OFFSETS`) and mirrored desktop's `positionCard` closure: per frame,
  the card's `--identity-x`/`--identity-y`/`--identity-scale` custom
  properties are derived from the object's own live `state.x`/`state.y`/
  `state.scale` plus a fixed pixel offset, so the card now enters from the
  same side as the image and grows/shrinks with it instead of just fading
  in place. Found and fixed a CSS bug along the way: with `left: 50%` and
  only `max-width` (no explicit `width`) set, the browser's shrink-to-fit
  auto-width algorithm caps the box at "container width minus left offset"
  — exactly half the viewport when centered — regardless of `max-width`,
  so the widened card was clipped flush to the right edge instead of
  centered. Invisible on desktop's `.callout` cards since their offsets are
  always large enough that this constraint never binds. Fixed by giving
  the card an explicit `width: 18rem` (removing the auto-width algorithm
  entirely) with `max-width: calc(100vw - 2rem)` as a narrow-viewport
  safety net, and baking `-50%,-50%` self-centering into the transform via
  `calc(-50% + var(--identity-x, 0px))` since, unlike `.callout`, this card
  needs to center on its own anchor point rather than hang off to one side.
  `pnpm check` green (typecheck, build, lint, 34 tests). Verified live in
  Chrome at 390×844 with a progress scrub: card stays hidden through the
  title screen; during Moon's entrance it's larger and shifted left in
  step with the image (e.g. width 323px, x=-126 at p=0.04); narrows and
  re-centers as the entrance settles (width 288px = 18rem exactly, x=51,
  right=339 — symmetric 51px margins on a 390px viewport). Screenshots at
  both the entrance and rest states confirm the card visually slides in
  attached to the Moon and settles centered above it. Spot-checked
  1920×1080 — `.identity-mobile` computed `display: none`, no visual
  change from desktop's existing layout.
- [x] Reworked the mobile ruler into a horizontal bar under the header
  instead of desktop's vertical right-side strip, reclaiming the vertical
  space Matt flagged as wasted on a narrow/tall viewport. `ruler.ts`'s
  progress math is orientation-agnostic (a plain 0–1 fraction), so this
  was a pure CSS re-layout inside the existing mobile `@media` block: row
  instead of column layout, segment dividers/end-caps rotated a quarter
  turn, and the native range input's `writing-mode` dropped from
  `vertical-lr` back to the horizontal default. `pnpm check` green
  (typecheck, build, lint, 34 tests). Verified live in Chrome at 390×844:
  the bar renders correctly under the title, NOW/THE WALL sit left/right
  of the track, and the thumb tracks scroll position correctly from
  progress 0 (far left) to progress 1 (far right). Spot-checked 1920×1080
  — desktop's vertical ruler is byte-identical to before, unaffected by
  construction.
- [x] Ruler now spans almost the full viewport height (`--ruler-height`:
  `min(60vh, 28rem)` → `min(92vh, 68rem)` desktop, `min(55vh, 24rem)` →
  `min(88vh, 44rem)` mobile), moved onto the `.ruler` container itself via a
  new `.ruler-track` flex child so `.ruler-segments`/`.ruler-input` no longer
  need their own height variable. Added fixed "NOW"/"THE WALL" text labels
  above/below the track (icons considered and rejected — the site has no
  icon usage anywhere, and "the wall" is already the closing copy's own
  term). Prototyped a small `.ruler-endcap` dot above "THE WALL" too, but
  Matt asked to remove it after review — deleted the element and its
  now-unused `--wall-color` token/rule. `pnpm check` green throughout
  (typecheck, build, lint, 34 tests, unchanged — CSS/HTML only). Verified
  with CDP screenshots at both 1920×1080 and 390×844 at mid-scroll, and at
  1920×1080 at the very start (title) and very end (closing) — thumb
  reaches each end exactly, labels never overlap the title/closing text,
  and the endcap is confirmed gone in a final screenshot.
- [x] Ruler now advances symmetrically at both ends of the track instead of
  sitting pinned at 0 through the whole title screen: `rulerFraction`/
  `progressForRulerFraction` (`ruler.ts`) treat the first segment's lower
  bound as the track's actual start (0), the same way the last segment's
  upper bound was already the track's actual end (1) — so scrolling through
  the title now moves the ruler thumb continuously, not just once Moon
  itself arrives. Also removed the title's 150vh hold (Matt: "scrolling
  should immediately create movement") — its shrink/fade-out now starts at
  vh 0 instead of after a static plateau; Moon's entrance timing shifted to
  match, nothing downstream changed. `pnpm check` green (typecheck, build,
  lint, 34 tests, two rewritten `ruler.test.ts` assertions for the new
  boundary behaviour). Verified with a CDP scrub reading the ruler input's
  live value and the title layer's live computed style — ruler climbs
  smoothly from progress 0, and title opacity/scale already visibly
  dropping by progress 0.005.
- [x] Repositioned all 11 point-source/field-reveal waypoints' measurement
  cards (`CARD_OFFSETS` in `main.ts`) per Matt's explicit per-waypoint
  quadrant call, rather than the previous derived alternating-side rule —
  sun/virgo-cluster/3c273/jades-gs-z14-0/cmb → right side, the rest → left,
  each also assigned top or bottom explicitly. Followed by two rounds of
  fine position tuning on sun/proxima-centauri/vega/3c273 per Matt's
  feedback. `pnpm check` green (typecheck, build, lint, 33 tests). Verified
  with a CDP script (`find-settled.mjs`) that finds each waypoint's settled
  scroll-progress fraction from real rendered opacity, then screenshotted
  every changed waypoint at 1920×1080 at that fraction across all three
  rounds — every card clears its own image with no overlap or overflow.
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
