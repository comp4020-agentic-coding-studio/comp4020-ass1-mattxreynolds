# Process overview

## What I built

A single continuous-scroll zoom from the Moon to the Cosmic Microwave
Background: one sticky stage, one scroll-driven progress value, twelve
waypoints each fading in oversized and off-centre before converging to
settled, then shrinking away as the next arrives. Distance and lookback time
are shown as two separate figures at every stop, widening apart as the
waypoints recede, so "further away is further back in time" is a trajectory
felt over the scroll rather than a caption read once. It ends on the CMB not
as "the furthest galaxy found so far" but as a hard temporal wall —
recombination, the point before which no light could ever have travelled —
with the closing text arriving only once that wall has receded to near-black.

## The moments that mattered

### Rebuilding the zoom mechanic after rejection

The first proof slice used discrete IntersectionObserver fade-ins, one per
section --- built, checked, and presented for review. I rejected it: it read
as a slideshow, not the continuous "looking further out is looking further
back in time" feeling the piece needed. Rather than patch the fade
transitions, the agent rebuilt the whole rendering model as a single
continuous scroll-progress value driving per-object keyframe layers in a
sticky stage, with no scroll-jacking --- a plain native `scroll` listener is
the only input, so the transform is the only synthetic part. It proved the
new mechanic on the smallest meaningful slice (Moon → Sun) against a concrete
worked example I'd given for the entrance grammar, before touching the other
ten waypoints, and I reviewed and approved that slice live. That the
two-waypoint slice needed no changes when scaled to all twelve waypoints
later is what told me the rebuild, not just a patch, was the right call
([`cd94222`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-mattxreynolds/commit/cd94222)).

### Deciding the anchor fact live instead of assuming

Each waypoint's anchor fact (the historical/human-scale analogy --- "since
breakfast," "before Earth existed") originally sat behind a click-to-reveal
pill button, the same interaction as the identity card. I flagged it as flat
and inconsistent with the rest of the diegetic UI. Rather than guess at a fix
from a description, the agent built two variants side by side on Moon and Sun
--- a "toggle" (pill → label + chevron, divider on reveal) and a "static" (no
gate, always visible, styled like the identity card's label/text pair) --- so
I could judge the actual feel in the browser rather than a written proposal.
I picked static: the anchor is the emotional payoff of the whole card, and
gating it behind a click risked people never seeing it, which no amount of
affordance polish would fix. It rolled out to the other 8 waypoints with the
label reworded ("What does that mean?" → "In human terms") and no further
changes needed, which is what told me the choice, not just the build, was
settled
([`2197085`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-mattxreynolds/commit/2197085)).

### Sharpening the PLAN/TASKS harness rule, then proving it holds

PLAN.md and TASKS.md kept accumulating exactly the content an existing
hygiene rule already told the agent to avoid --- "originally X, changed to Y"
narrative in PLAN.md, fully-detailed already-finished tasks with verification
logs in TASKS.md --- because the old rule said what belonged where without a
concrete test for the boundary. Instead of a one-off manual trim, I had the
rule itself sharpened in `CLAUDE.md`: a literal test ("does this sentence
only make sense *with* the history of how you got here?"), and collapsing a
finished task tied to the commit that finishes it rather than a later
cleanup pass
([`2dcf016`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-mattxreynolds/commit/2dcf016)).
The proof came several sessions later: with no memory of that conversation, a
fresh session read the sharpened rule alone and collapsed TASKS.md from
roughly 590 lines to under 100 --- including correcting a stale paragraph in
PLAN.md that still described an already-shipped mobile feature as an open
decision --- without a single round of back-and-forth about what counted as
"history" versus "decision"
([`c5097c5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-mattxreynolds/commit/c5097c5)).
