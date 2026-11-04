# Week 08 · scene guide

Deck: `site/weeks/week-08.html`. Reading copy: `site/pdf/week-08.pdf`.

The instructor preparation guide for the completed material. The deck has fourteen pages, eight planned scenes, twenty-five condition presets and one hundred fourteen scene states; the supporting page controls bring inspection to 139 states. Two supporting pages continue the plan's own material: the exploratory journey of scene 3 and the claim, evidence and remaining-uncertainty table of scene 8. The shared shell, palette, control meanings and animation conventions are those of Weeks 6 and 7: diagrams carry the explanation, and each motion follows a control operation and ends in a readable state. Principles, outcomes and the six checks use the plan's wording; each condition asks its own question, and the correct options are spread across A, B and C (9, 9 and 8). No rehearsal, narration, shot list or recording route is supplied.

The central question is: **Which checks would challenge our assumptions rather than merely repeat them?**

## Case and controls

Campus Rooms is fictional. R-02 accepts 30 through 120 minutes inclusive throughout this lecture; the 90-minute variant in scene 2 is a labeled temporary trial, restored in its last state. Intervals are half-open, so `[10:00,11:00)` and `[11:00,12:00)` are adjacent and allowed. Clock readings, delays, test runs and the assistant-drafted tests are simulated teaching values and are labeled as such on the cover.

Next/Previous change the page. Step/Back change the demonstration. Replay restarts the selected preset; Reset restores that scene's baseline preset. Re-entering a page restores its initial state. The deck supports keyboard operation, `record=1`, `motion=off` and reduced motion. Controls and individually inspectable diagram elements have unique pointer targets (407 at load).

## Pages and scene conditions

| Page | Stable link | Baseline and comparison | State that exposes the misconception |
|---|---|---|---|
| 1 | `#/opening` | One shipped check; Run the check, then Ari books 120 minutes | The check is green with every line executed, and the screen that offers 30 to 120 minutes refuses 120. |
| 2 | `#/outcomes` | Outcomes, the four rules under test, how to read an assertion, half-open notation | The question for the lecture sits beside the rules it will challenge. |
| 3 | `#/friendly-example` · Anchor | As shipped (`< 120`); compare Inclusive fix and No upper limit | State 7 of As shipped: 120 is rejected and R-02 says accepted. State 4 of No upper limit: 121 is accepted, which is why 120 and 121 are needed together. |
| 4 | `#/partition-the-inputs` · Bridge | R-02 at 120; compare the labeled Trial at 90 | State 3 of the baseline: one value per group (10, 60, 150) passes even the code that leaves out 120. The table in the trial shows which cases keep their job. |
| 5 | `#/choose-test-scope` · Anchor | Claims and scope; compare Test double and Contract mismatch | State 4 of the baseline: the concurrent check finds two confirmations while the unit check stays green. In Contract mismatch, the provider raises into the booking path and only the contract check can show it. |
| 6 | `#/explore-the-journey` | The keyboard journey, one question and four buttons | After Reopen the booking: the stored booking is Confirmed and the screen still says Submitting. The discovery becomes a regression example. |
| 7 | `#/oracle-independence` · Bridge | Shared helper; compare Helper changes and Same assistant | The helper table: the self-confirming check passes for 119, 90, 150 and 120, and the independent check passes only for 120. |
| 8 | `#/properties-and-counterexamples` · Anchor | Strict overlap; compare Rejects adjacency, Smallest failure and Odd text | Last state of Rejects adjacency: P1 holds, P2 fails, and a service that refuses everything would satisfy P1. |
| 9 | `#/coverage-and-mutation` · Bridge | Executed only; compare Mutant survives, Mutant detected and Equivalent change | Executed only: `duration_ok(120)` runs, its False is never read, and coverage is 2 of 2. Adding one assertion leaves coverage unchanged and fails the run. |
| 10 | `#/repeatable-observation` · Bridge | Wall clock; compare Fixed clock and Injected failure | State 4 of Wall clock: the check fails at 10:00 with no code changed, and R-03 was right in every run. |
| 11 | `#/testing-as-feedback` · Bridge | Debug first; compare Check first and Refactor | The four move labels appear only as each is reached, so the first prediction stays open. Last state of Refactor: the same answers, with the unexercised conditions named. |
| 12 | `#/evidence-and-limits` | Review, static analysis, a dynamic check, the contract, then the claim table | The final table keeps each claim with its evidence and what stays open. |
| 13 | `#/principles` | Eight linked principles and six individually opened questions with answers | The final transfer question concerns a file converter whose test computes its expected output with the same function. Answers close on re-entry. |
| 14 | `#/sources` | Week 9 handoff, carried-forward material, dated tool examples, terms and primary sources | The next question concerns behavior when a request, dependency or assumption cannot be trusted. |

## Deliberate simplifications

- The duration, overlap, helper, clock and parser snippets are executable fixture examples checked by `plan/tools/check_plan.py`. The visible code is Python-like pseudocode.
- Line coverage of a one-line function is shown as 2 of 2 lines, the `def` and the `return`; it stands for what a coverage tool reports, not for any particular tool's output format.
- The two-mutant score (detected / valid = 1 / 2 = 50%) shows the arithmetic of the measure on a tiny example. It is a teaching illustration, not a target.
- The concurrent check reuses the check-then-write result of Week 6. It reports two confirmations under that strategy; repairing it is Week 6's atomic decision, which this lecture does not repeat.
- The fuzz example reduces a text input by hand-picked steps to show the idea of reduction. Real tools search for the reduction; the optional-depth preset can be skipped without affecting the next scene.
- `longest_allowed()` returning 119 is equivalent to the `< 120` comparison for whole minutes, so scene 4 continues the misreading of scene 1 and agrees with the generated tests of `w13/shared-assumption`.

## Reading copy and later recording

The thirty-two-page PDF preserves the rule, both predicates and the completed boundary table, the partitions with a separately marked trial, the claim-to-scope matrix with one limit per row, the exploration question, the discovered mismatch and its regression example, the dependency of each expected result and the independent derivation, the properties with the smallest counterexample in half-open notation, the mutation, missing case and added assertion with the limited conclusion, the uncontrolled inputs with the fixed clock values, the four debugging moves, the feedback loop, and the final claim-evidence table. It is the local recovery copy if an interactive component is unavailable.

The video is deferred at the user's request. A later recording agent reads the plan, fixtures, this guide and the operated deck, then generates its own recording material under `plan/22_recording_track.txt`. Nothing here fixes narration, timing or which pages a recording shows.
