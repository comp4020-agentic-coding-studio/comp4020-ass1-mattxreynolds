# TASKS

Small rolling working set. Collapse to one line + commit link once done —
see `CLAUDE.md`.

## Next

Nothing open — see `FINAL_REVIEW.md` for the last audit pass.

## Done (collapsed)

- [x] Mobile regression pass (resize mid-scroll, keyboard/tab operability,
  both viewports) and live-URL verification — repo public, CI/deploy green,
  confirmed against the deployed URL, not just localhost — `a1c2dd1`.

- [x] `pnpm check:evidence` + linkinator, both green.
- [x] Filled out `PROCESS.md` (3 cited moments) and
  `reflections/assignment-1.md` — `0640782`, `32c89e8`.
- [x] Fact-checked all waypoint numbers and anchors — see `PLAN.md`.
- [x] First proof slice (discrete IntersectionObserver fade-ins) — rejected
  as reading like a slideshow; superseded by the continuous zoom rebuild.
- [x] Rebuilt the zoom mechanic as a continuous scroll-progress engine,
  proved on Moon → Sun — `cd94222`.
- [x] Rolled out waypoints 3–7 (Proxima → Virgo Cluster) onto the zoom
  engine — `f7288c9`.
- [x] Decided the field-reveal entrance grammar and rolled out the
  cosmological jump (3C 273, GN-z11, JADES-GS-z14-0, reionization fog) —
  `a4133bd`...`6a6e155`.
- [x] Landed the CMB waypoint (12th and last) — `72e887a`.
- [x] Added a generic starfield backdrop behind every waypoint — `3c9dc1d`.
- [x] Redesigned every inline SVG with seeded star-dot generators, fixed
  object size/texture — `8e7d941`.
- [x] Replaced generated SVG graphics with real photos, retuned the
  fog/CMB transition — `6b9c393`.
- [x] Added the depth ruler, diegetic Moon/Sun callouts, and click-to-reveal
  anchor facts — `7fc5cc5`.
- [x] Converted the identity card to a hover tooltip, rolled diegetic cards
  out to all 10 point-source waypoints — `b4194a9`.
- [x] Made the anchor fact always-visible instead of click-gated — `2197085`.
- [x] Fixed the waypoint-5 image/alt mismatch at Sagittarius A* — `73df44a`.
- [x] Replaced hand-picked keyframes with the `schedule.ts` generator —
  `145aa85`.
- [x] Made measurement cards scale with their waypoint (damped scale) —
  `256329f`.
- [x] Added `title`/`closing` bookend layers, fading the CMB out before the
  track ends — `39154ea`.
- [x] Ruler polish: dropped segment labels on review, kept progress dimming
  and an overflow fix — `941829f`.
- [x] Made images bigger across the board, deep-field waypoints more so —
  `b896e1c`.
- [x] Cut total scroll length across the whole track by ~36% — `136b731`.
- [x] Gave the reionization fog and CMB the same 2-card treatment as every
  other waypoint — `6fc128d`.
- [x] Reworked jades→fog and fog→CMB transition timing to match the site's
  usual small overlap — `de049b4`.
- [x] Repositioned measurement cards per an explicit per-waypoint quadrant
  call — `c5a561c`.
- [x] Made the ruler advance symmetrically through the title, dropped its
  hold — `f447b47`.
- [x] Enlarged the ruler to near-full viewport height, added end labels —
  `eb55c33`.
- [x] Mobile: fixed the HUD staying visible over the closing text —
  `f6292f1`.
- [x] Mobile: dropped the anchor click-gate to match desktop's static
  anchor — `dddb5ff`.
- [x] Mobile: fixed title/closing resting-scale overflow — `6b256fd`.
- [x] Mobile: added the bottom-sheet HUD (Moon proof-of-concept, then
  always-expanded) — `a18520c`...`609aa32`.
- [x] Mobile: rolled the bottom-sheet HUD out to all 12 waypoints —
  `4363d32`.
- [x] Mobile: fixed image overflow on waypoint 5+ and CMB — `a3d9583`.
- [x] Mobile: reworked the ruler into a horizontal bar under the header —
  `27dbb94`.
- [x] Mobile: built the "what is this?" floating identity card, proved on
  Moon — `df05dd0`.
- [x] Mobile: widened the identity card and attached it to the image's
  transform — `1eacbad`.
- [x] Mobile: moved the identity card closer to the image, converged it on
  fade, fixed a visibility leak — `52f0c2e`.
- [x] Mobile: rolled the identity card out to all 12 waypoints — `3a88ee2`.
- [x] Mobile: fixed identity-card fade-in, raised the Sun/Proxima/Vega
  offset — `fe4461a`.
- [x] Mobile: fixed the HUD leaking Moon info onto the title screen —
  `8f984a0`.
- [x] Mobile: sink/grow-from-bottom fade for the HUD; fixed CMB's cards
  cutting off abruptly — `3567188`...`1821b0d`.
- [x] Mobile: stacked the HUD's name/distance instead of a baseline flex
  row — `f36e84f`.
- [x] Shortened the Reionization Fog's distance description — `d048b92`.
- [x] Preserved scroll progress across viewport resize — `4cffa54`.
- [x] Scaled the "sibling" entrance offset to each image's own rendered
  size and viewport — `1944663`.

## Open blockers / unresolved decisions

- Text-position-follows-object-shape is explicitly deferred, not a
  blocker — plain fixed HUD/cards are fine for now.
