# Final review — Depth as Time (Assignment 1)

Read-only audit, no code changes made. Saved so it survives to a future
session. **This file is untracked** (not committed/pushed) — it's a working
note for you, not a deliverable, and isn't linked from the site so it has no
effect on the build.

Reviewed against the actual published brief
(`comp4020-agentic-coding-studio/assessments/assignment-1/`), fetched fresh
during this review, due **noon Mon 17 Aug 2026**.

## Bottom line

Deployed, working, both viewports, all mechanical checks green, process
evidence present and largely strong. No blockers to shipping as-is. Two
small paperwork discrepancies and one cosmetic nit below — none affect the
mark if left, but they're cheap to fix before the crit-time sweep.

---

## 1. Mechanical checks (all run today, all green)

| Check | Result |
|---|---|
| `pnpm check` (typecheck → build → oxlint → stylelint → vitest) | ✅ pass |
| `pnpm check:evidence` | ✅ pass |
| `pnpm dlx linkinator ./dist` | ✅ no broken internal links |
| Repo visibility | ✅ public (`gh repo view`) |
| CI `check` job, latest push | ✅ success |
| CI `deploy` job, latest push | ✅ success |
| Live URL, desktop (1920×1080) | ✅ 200, renders correctly |
| Live URL, phone (390×844) | ✅ 200, renders correctly |
| Secrets scanning | ✅ pre-commit hook (`.githooks/pre-commit`, blocks `sk-...`-shaped strings) + CI trufflehog (verified secrets) + a second pinned trufflehog pass for course-key shape via `.github/trufflehog.yml` |

## 2. Live-site behaviour (headless-browser verification against the deployed URL, not localhost)

- Desktop title screen: title, both intro paragraphs now visibly spaced apart
  (confirms today's paragraph-gap fix is live), starfield, ruler at 0%.
- Desktop mid-scroll (Andromeda waypoint): image, measurement card, and
  hover-style identity text all render correctly.
- Phone title screen: same content, ruler correctly re-laid-out as the
  horizontal bar under the header.
- Phone mid-scroll (Andromeda waypoint): the "What is this?" identity card
  sits cleanly above the image, clear of the header/ruler, not clipped —
  confirms today's mobile identity-card offset fix (waypoints 5–12,
  `-190`/`-220`) is working as intended on the live deployment, not just
  locally.
- **Resize mid-scroll**: scroll progress is preserved across a viewport
  resize (tested programmatically) — this is exactly the kind of
  "resize mid-interaction" robustness the rubric's HD band for Criterion 2
  calls out by name.
- **Keyboard operability**: the ruler `<input type="range">` responds to
  keyboard arrow keys and moves scroll progress accordingly, on both
  desktop and phone viewports — covers the rubric's explicit "tab through
  it" marking behaviour.
- One console error on desktop only: a single 404. Traced it by checking
  every asset `index.html` actually references (CSS, JS, all 12 waypoint
  images) — all return 200. `index.html` has no `<link rel="icon">`, so this
  is almost certainly the browser's automatic favicon request, not a broken
  listed asset. Cosmetic only; a marker opening devtools could notice it.
  Trivial fix: add any `<link rel="icon" href="data:,">` or a real favicon.

## 3. Core interaction — is it testable, and is it tested?

The brief's interactivity requirement is that the core interaction be
"stated clearly enough to be testable." `spec/depth-as-time.test.ts` and
`spec/ruler.test.ts` do exactly that against the real engine (`zoom.ts`,
`ruler.ts`, `site-schedule.ts`), not against static fixtures:

- Waypoints are asserted strictly increasing in lookback time.
- Keyframe interpolation (`interpLayer`) is tested pre-range, post-range,
  and mid-interpolation.
- Progress clamping to `[0, 1]` is tested.
- Waypoint selection at exact and near-exact schedule thresholds is tested.
- The ruler's fraction-mapping is tested for even spacing, exact boundary
  alignment, the title/closing overshoot behaviour, and as an exact inverse
  of `progressForRulerFraction` — a genuinely thorough test of the site's
  one mechanic, not boilerplate.

This reads as strong evidence for Criterion 3 (a real, well-articulated
mechanic) and reinforces Criterion 1 (verification before acceptance).

## 4. Response to the brief

Brief: "one strong idea, one dataset or mechanic, and nothing else,"
scored on being "a pointed, surprising answer to the provocation, scoped
with judgement: one idea, carried all the way" (HD) vs. drifting or lacking
a point of view (P).

- **The idea**: a single continuous scroll-progress zoom through 12
  fact-checked waypoints (Moon → CMB), where depth is explicitly reframed as
  lookback time — "you're not just seeing something distant, you're seeing
  something old." One mechanic, no bolted-on features.
- **Scope discipline**: `PLAN.md`'s "Explicitly excluded" list (no redshift
  formula, no second dial, no statistical rigor) shows the idea was
  deliberately kept narrow rather than left narrow by default — this is
  the kind of judgement call the HD band names directly.
- **Point of view**: the CMB ending ("There is no anchor older than this")
  and the closing layer give the piece a definite stance rather than
  trailing off as a neutral reference list.
- Distances/lookback times are fact-checked with sources cited in
  `PLAN.md`, and the waypoint set was tuned (image sizing, offsets,
  transition timing) well past a first working pass.

This looks solidly in D–Cr/HD territory for Criterion 3 — a real, carried
idea rather than a survey. The main risk to this criterion isn't the build,
it's whether a marker reading `PLAN.md` sees the "why one idea, why these
12 waypoints, why this scope" reasoning as clearly as it's actually there —
worth a glance to confirm `PLAN.md` still reads that way after this week's
edits, since I didn't re-diff it against earlier versions.

## 5. Process legibility

- `PROCESS.md`: exactly 3 cited moments (within the brief's "3–4"), each
  citing a real commit hash that resolves (`check:evidence` confirms). One
  of the three — "Sharpening the PLAN/TASKS harness rule, then proving it
  holds" — is precisely the kind of "correction landed in the harness
  rather than in a retry" the HD band calls out by name.
- **Word count: 601** — one word over the stated 400–600 range. Not
  currently enforced by any check I found (`check:evidence` validates
  citation resolution and file presence, not length), so it won't fail CI,
  but it's a one-edit fix if you want it clean before a marker reads it.
- `reflections/assignment-1.md`: 271 words, answers both of
  `reflections/README.md`'s standing prompts (the breakthrough, and what it
  changed about the developer you want to be) — within the README's stated
  150–300 word target.
- Commit history: real span from 31 Jul to 15 Aug, with the bulk of build
  commits concentrated in the final ~48 hours (13–15 Aug) but broken into
  many small, individually-described commits with clear before/after
  intent (e.g. "Fix the waypoint-5 image/alt mismatch," "Made the anchor
  fact always-visible instead of click-gated") rather than one dump. This
  reads as directed iteration, not a last-minute dump, but a marker
  skimming just the *dates* rather than the commit messages could
  misread it that way — the messages are what carry the "directed, not
  routine" signal, so it's worth PROCESS.md pointing at a couple of the
  more illustrative ones if it doesn't already.
- `CLAUDE.md` has 3 commits of its own evolution (`2dcf016`, `210a66d`,
  `710506c`), which is itself evidence the harness was actively maintained
  rather than left as the template.

## 6. Discrepancy to flag (not fixed, per your instruction)

`TASKS.md`'s "Next" section still lists two items as unchecked:

```
- [ ] Mobile regression pass: resize mid-scroll, touch-drag ruler thumb,
  flick-scroll; re-screenshot desktop at fixed progress points...
- [ ] `/ship`, then verify the live URL at both viewports.
```

Both are, as far as this review can tell, actually done: the repo is
public, CI/deploy are green, and this review independently verified
resize-mid-scroll, keyboard operability, and both live viewports working.
`TASKS.md` is read as process evidence, so a marker could read these as
open work that never got closed out. Worth updating to reflect reality
before the deadline — left to you since this task was read-only.

## 7. Suggested pre-deadline touch-ups (all optional, none blocking)

1. Update `TASKS.md`'s "Next" section to reflect the mobile regression pass
   and ship/verify steps as actually done (or replace with whatever's
   genuinely still open).
2. Trim `PROCESS.md` by one word to land inside 400–600.
3. Add a favicon (or a no-op `<link rel="icon">`) to silence the stray
   desktop console 404.
4. Skim `PLAN.md` once more for currency — not re-audited line-by-line this
   pass, only used as a reference for scope/sourcing claims above.

## What this review did not do

Did not re-run the full accessibility/performance angle (axe-core,
Lighthouse) — CLAUDE.md notes these aren't wired into any check yet and
are explicitly the student's own responsibility to add; out of scope for
a compliance audit against the current checks and brief. Did not diff
`PLAN.md`/`TASKS.md` content against their full commit history — assessed
their current state only.
