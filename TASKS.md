# TASKS

Small rolling working set. Collapse to one line + commit link once done —
see `CLAUDE.md`.

## Current

- [ ] The cosmological jump (waypoints 8–11: 3C 273, GN-z11,
  JADES-GS-z14-0, reionization fog) and final CMB polish — build order
  stages 3–4 in `PLAN.md`. Same engine, extended per waypoint as before.
  Entrance grammar for this stage still open: 3C 273→GN-z11→JADES are all
  "one of many" reveals of a much younger universe rather than sibling
  bodies, and the reionization fog is a narrative bridge, not a rendered
  object — decide grammar/whether-to-render before hand-tuning keyframes.
  Budget real time for the CMB waypoint and the `.payoff` closing text
  (currently a placeholder sentence in `index.html` scoped only to what's
  built) — that's the piece's actual payoff.

## Next

- [ ] Resize-mid-scroll check (not yet done — only fixed-viewport checks so
  far).
- [ ] `pnpm check:evidence` + linkinator, all green (full `pnpm check` is
  already green through waypoint 7).
- [ ] `PROCESS.md` (400–600 words, 3–4 cited moments) and
  `reflections/assignment-1.md` (150–300 words).
- [ ] `/ship`, then verify the live URL at both viewports.

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

## Open blockers / unresolved decisions

- Entrance grammar for waypoints 8–11 (3C 273 onward) not yet decided —
  see `TASKS.md` Current.
- Text-position-follows-object-shape is explicitly deferred, not a
  blocker (see `PLAN.md`/session notes) — plain fixed HUD is fine for now.
  Illustration fidelity (the spike's procedural starfields/spiral arms vs.
  today's simple placeholder SVGs) is also open but not blocking — worth
  raising before the cosmological-jump stage, since that's where "a field of
  many stars" first needs to read well.
