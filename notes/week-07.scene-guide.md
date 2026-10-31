# Week 07 · scene guide

Deck: `site/weeks/week-07.html`. Reading copy: `site/pdf/week-07.pdf`.

The instructor preparation guide for the completed material. The deck has fourteen pages, eight planned scenes, seventeen condition presets and ninety-two scene states. Its supporting pages distinguish saved, selected, committed and shared content, then demonstrate bisection on a separate linear history. The shared shell, palette, control meanings and animation conventions are those used in Week 6: diagrams carry the explanation, and each motion follows a control operation and ends in a readable state. Principles, outcomes and the five checks use the plan's wording, as in Week 6; each condition has its own prediction, and the correct options are spread across A, B and C (6, 6 and 5). No rehearsal, narration, shot list or recording route is supplied.

The central question is: **How can several people change one system without losing intent or trust?**

## Case and controls

Campus Rooms is fictional. R-02 normally accepts 30 through 120 minutes inclusive. The 90-minute rule is a clearly labeled temporary comparison; `ready-to-integrate` restores 120, checks 120 and 121, and retains R-03 ownership. The canonical case fixture is unchanged. Ari owns B-001; Bo cannot cancel it.

Next/Previous change the page. Step/Back change the demonstration. Replay restarts the selected preset; Reset restores that scene's baseline preset. Re-entering a page restores its initial state. Each reveal follows a control operation. The deck supports keyboard operation, `record=1`, `motion=off` and reduced motion. Controls and individually inspectable diagram elements have unique pointer targets.

## Pages and scene conditions

| Page | Stable link | Baseline and comparison | State that exposes the misconception |
|---|---|---|---|
| 1 | `#/opening` | Separate edits to `policy.py` and `messages.py`; Combine the edits (both arrows draw into one combined change), then Check one request on Ari's booking screen | The screen offers "Choose 30 to 120 minutes" and then rejects 100 minutes, although the text merged cleanly. |
| 2 | `#/outcomes` | Recall Week 6's result contracts, retry identity and decision rationale; identify the promises the change must preserve | R-02 and R-03 are separate requirements; the shorter rule is temporary. |
| 3 | `#/what-is-saved` | One edit moves through saved files, selected content, a local commit and shared history; a copy of what each action carries travels to the next place | After Record locally, `policy-90` points to c3 while `origin/policy-90` still reflects c2. The unsaved editor buffer is outside the strip. |
| 4 | `#/commit-graph` · Anchor | Diverged work from c2; compare No divergence | c5 has parents c3 and c4, yet its policy and message disagree. In the other preset, main moves from c2 to c3 without creating a merge commit. c6 records restoration. |
| 5 | `#/conflict-and-intent` · Anchor | Text fixed, rule lost; compare Intent preserved. The R-02 variant (30 to 90 minutes, both included) stays beside the edits | The bad resolution accepts 91, 120 and 121; the Agree? column marks each with a symbol and a word, not color alone. The good resolution retains the shorter limit and the structural improvement. Its two pieces of intent visibly converge into the combined function. |
| 6 | `#/clean-merge-wrong-behavior` · Bridge | Copied limit; compare One policy source | The same 100-minute request is rejected in both presets. "policy.py enforces 90 ≠ messages.py announces 120" becomes "90 = 90" once `messages.py` imports `MIN_MINUTES` and `MAX_MINUTES` from `policy.py`. |
| 7 | `#/review-with-context` · Anchor | Mixed change; compare Focused change and Assistant draft | Boundary checks pass while message consistency fails and R-03 evidence is missing. The authorization concern remains open until the owner/non-owner results appear. Original comments acquire resolution labels; the final record preserves the decision. The assistant preset asks what changes for the reviewer: nothing, because the requirement, checks and rationale are still needed. |
| 8 | `#/integration-frequency` · Bridge | Contract changes during the work; compare Contract stays. Two timelines branch from shared work at A; a highlighted column marks the current event | At C a small integration reveals the obsolete message assumption after a short rework band (B to C); the long-lived branch discovers it at D after work built from B to D. A feature flag keeps unfinished behavior unavailable. With the contract unchanged, every check agrees. |
| 9 | `#/same-code-different-result` · Bridge | Only the resolved dependency changes; compare only the configuration changing | Source `demo-r1` and the 120-minute request stay fixed. The single changed input changes the answer. Restoring it restores the teaching result. |
| 10 | `#/history-as-explanation` · Bridge | Author available; compare Author unavailable | DR-07 is linked to its change (`message-policy-fix`) and to R-02 and R-03; it still supplies the problem, intended behavior, constraint, rejected alternative and checks. “fix stuff” is linked to nothing. |
| 11 | `#/locate-the-change` | Separate linear h1–h8 diagnostic history; known good h1 and known bad h8 | The suspect range narrows from 7 changes to 4, 2 and 1: h4 is good, h6 is bad, then h5 is bad. The remaining first failing change is h5; the record explains its reason. Reset the search restores the endpoints. |
| 12 | `#/ready-to-integrate` · Bridge | Concern open despite passing checks; compare approval with Integration fails | Resolve the actual missing evidence or failing combined check. At the end, the canonical 30–120 inclusive range is restored, the message agrees, and ownership is unchanged. |
| 13 | `#/principles` | Eight linked principles and six individually opened questions with answers | The final transfer question concerns a library's implementation and documentation disagreeing after a clean merge. Its contract must be settled and both checked. Answers close on re-entry. |
| 14 | `#/sources` | Week 8 handoff, carried-forward material, dated tool examples, terms and primary sources | The next question concerns the quality and scope of the checks in the review packet. |

## Deliberate simplifications

- Commit IDs c1–c6 and h1–h8 are teaching labels. Graph arrows point from parent to child; the labels are not actual Git object hashes. The linear bisection example is separate from the branching graph.
- The duration snippets and cancellation predicate are executable fixture examples checked by `plan/tools/check_plan.py`. The visible code is Python-like pseudocode, with the long structural comparison broken across readable lines.
- The review packet and its outcomes are simulated. No hosting account or live GitHub/GitLab workflow is needed. The assistant preset changes the authorship label; it retains the same review needs.
- The integration events A–D represent event order, not measured elapsed time, productivity or a universal branching prescription. Smaller integrations still require meaningful checks and safe handling of unfinished behavior.
- `teaching-range` is invented. Version 1.0 accepts the upper endpoint; 1.1 deliberately excludes it. The example is a comparison of run inputs, not a claim about an actual dependency release or byte-identical builds. Secret values are represented only by a secret-store reference.
- Bisection assumes a repeatable check and a failure that persists from its introduction through the known bad endpoint. It locates the first failing change under that predicate; the rationale record supplies the context for investigating it.

## Reading copy and later recording

The thirty-one-page PDF preserves the opening counterexample, the saved/committed/shared distinction, selected graph states including all six commits, both conflict resolutions and boundary results, the clean merge counterexample, review concerns and their evidence, both integration timelines and the unchanged-contract comparison, changed run inputs, durable rationale and its links, the bisection decisions with the narrowed history, canonical restoration, principles, answered checks, terms and sources. It is the local recovery copy if an interactive component is unavailable.

The video is deferred at the user's request. A later recording agent reads the plan, fixtures, this guide and the operated deck, then generates its own recording material under `plan/22_recording_track.txt`. Nothing here fixes narration, timing or which pages a recording shows.
