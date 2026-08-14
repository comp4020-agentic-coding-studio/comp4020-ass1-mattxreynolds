# Assignment 1 reflection

**What was the breakthrough that moved the work forward?**

The breakthrough wasn't a single interaction fix — it was realising that
recurring problems needed to be solved in `CLAUDE.md`, not in the moment.
Early on I'd catch something (the zoom mechanic reading as a slideshow,
PLAN.md filling up with "originally X, changed to Y" narrative) and just
re-prompt until it looked right. That works once. It stopped working once
the project outgrew a single sitting: a fresh session, weeks later, has no
memory of why PLAN.md is supposed to stay lean. The moment that actually
moved things forward was rewriting the hygiene rule itself with a concrete
test a fresh session could apply mechanically — and then watching exactly
that happen, with TASKS.md collapsing from ~590 lines to under 100 with no
back-and-forth about what counted as history versus decision. That's when
the harness stopped being documentation and started being an actual
constraint the agent worked against.

**What did this work change about who I want to be as a developer?**

I want to stop treating "it works now" as the finish line and start asking
whether the fix survives me not being in the room. That's a different habit
than debugging solo, where the fix and the fixer are the same continuous
context. Here, every correction that only lived in a chat turn was a
correction that evaporated. The ones I bothered to write into `CLAUDE.md`
were the ones that actually held across sessions. I want that to be my
default instinct going forward, not something I only reach for once a repo
is already messy.
