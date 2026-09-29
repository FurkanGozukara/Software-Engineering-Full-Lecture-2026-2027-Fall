# Week 04 · scene guide

What the instructor reads before teaching Week 4; there is no rehearsal (plan/00_START_HERE.txt).

Deck: `site/weeks/week-04.html`. Thirteen pages: the opening situation, recall and outcomes, the eight scenes, the five measures with their boundaries, principles and checks, handoff and sources. The opening page shows the board after round 4 of the baseline; its first click ("Is everyone busy?") shows that every station worked and only three cards are done, its second ("Where is the work waiting?") marks the review queue and routes four questions to the scenes that answer them.

Controls: Right/Left arrows change the page; Down/Up arrows step the scene; `r` replays the selected condition; `Shift+R` resets to the baseline. Every scene opens at its baseline, paused, also through its deep link. Scene 3 also has Run, which advances one round every 1.5 seconds from the selected condition's current round and stops at the last one; Step and Back always move one round.

| # | Scene (deep link) | Baseline preset | Other presets | State that best exposes the misconception | Deliberate simplification |
|---|---|---|---|---|---|
| 0 | `#/opening` | click "Is everyone busy?", then "Where is the work waiting?" | – | after the first click: started 8 of 8, done 3, both stations busy every round | the board is the scene 3 baseline at round 4 |
| 1 | `#/feedback-batches` (Anchor) | Two plans | Later feedback · Interface | baseline state 3 of 7: one batch learns the misunderstanding in round 9 and re-examines every card; later feedback state 5 of 5: 1, then 2, then 8 cards to reconsider | eight equal cards; the reconsidered cards at rounds 3 and 6 are simulated example values (fixtures) |
| 2 | `#/methods-not-rituals` (Bridge) | Planned work | Incidents | baseline state 4 of 7 (when feedback arrives); incidents state 4 of 4: every approach needs a new policy | simplified lecture examples, not complete method definitions (the PDF says so) |
| 3 | `#/queue-and-bottleneck` (Anchor) | 2 and 1 | Implementation 4 · Review 2 | baseline state 5 of 10 (round 4): started 8, done 3, five cards waiting; Implementation 4 at round 9: the same finish, a queue of seven | equal-sized cards, one round per station, counts are end-of-round (flow fixture) |
| 4 | `#/wip-and-time` (Bridge) | No limit | Limit 2 | limit state 3 of 5: the oldest started card is 2 rounds old while W08 has waited 6 rounds in Ready; state 5: the same finish rounds | the scene 3 baseline board; the limit schedule is recomputed from the flow rules when the deck loads |
| 5 | `#/estimates-with-assumptions` (Bridge) | Interface agreed | Interface open | baseline state 2 of 6: “three days” read three ways; open state 2 of 5: 3 to 9 days until the interface is agreed | five similar changes and all day values are simulated (fixtures); the range summarizes examples, it is not a confidence interval |
| 6 | `#/risk-and-learning` (Anchor) | Temporary choice | Hard to reverse | changed state 2 of 5: only the identity row's reversibility changes, and the decision moves; state 4: the smallest estimate is not the cheapest | ordinal judgments with notes, no invented probabilities or money |
| 7 | `#/definition-of-done` (Bridge) | Cancellation | Wording fix | baseline state 2 of 6: the change allows Bo (U-02) to cancel Ari's booking; wording fix state 4 of 4: one policy, relevant evidence | one team's completion policy; the evidence items are course-authored |
| 8 | `#/retrospective-as-test` (Bridge) | Share review | Faster, shallower | changed state 2 of 4: the same flow as the careful version, four issues found after review; state 3: counting rework, done in round 7 | before/after counts are simulated teaching values |
| 9 | `#/measures` | click each of the five measures | – | cycle time and lead time of W08 side by side: 6 and 9 rounds | one card's timeline; lead time is the stakeholder clock this lecture adds to the Kanban Guide's four measures |
| 10 | `#/principles` | eight cards (each principle with its "in short" line); click each question to open its answer | – | question 6 leaves room booking: the library team that writes changes faster | answers stay closed until clicked; reopening the page closes them |
| 11 | `#/sources` | handoff question, carried-forward items, in practice, terms, sources | – | – | reference page; the "In practice" card names current tools as dated examples |

Shorter route (plan section 9): keep feedback batches, queue behavior and the risk decision (scenes 1, 3, 6) whole; the framework comparison of scene 2 is the part to shorten, and lifecycle cost already sits inside scenes 5 and 6. Longer route: the transfer question on the principles page (question 6). The plan's optional depth (changing the support or exit assumption in the same decision) is not built into this deck; scene 6's lifecycle example names support and exit cost for one option.

Recovery: `site/pdf/week-04.pdf` (25 pages) carries the selected states of every scene with the condition and state printed as text, the five measures with their boundaries, the principles and the checks.
