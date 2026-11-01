# Week 07 · completion record

## Watch the lecture

[Watch Lecture 7](https://www.youtube.com/watch?v=6aCc7uEiLO0) (41:47) · [Full course playlist](https://www.youtube.com/playlist?list=PLS3U3BEQ-9C0).

Date: 28 October 2026. Branch: `week/07-collaboration`, based on accepted Week 6 state `9dc89fd`. The user requested complete Week 7 material, specifically the quality, style and animations of Week 6, and actual Chrome verification. Video production is deferred.

Status: complete material, browser-verified and visually reviewed, then revised after a review against Week 6 (section "Review revision" below). Lecture video recorded and delivered on 31 October 2026 (section "Lecture video" below).

## Files and scope

| Deliverable | Path |
|---|---|
| Interactive deck | `site/weeks/week-07.html`, `site/weeks/week-07.js` |
| Reading copy | `site/pdf/week-07.pdf` · 31 pages |
| Instructor guide | `notes/week-07.scene-guide.md` |
| Teaching data | `plan/assets/demo-fixtures.json`, synchronized to `site/assets/fixtures/` |
| Index and status | `site/index.html`, `README.md` |
| Source refresh | `plan/week7.txt`, `plan/18_sources.txt`, `plan/15_curriculum_currency_and_coverage.txt`; derived manifest and combined plan regenerated |
| Automated coverage | Existing CI expression widened to Week 7 and its PDF; Week 7 layout scan included |
| Portable package | `../Week_07_Complete_Materials.zip`, including the local site, PDF and instructor notes |

Fourteen deck pages; the eight manifest scene identifiers are unchanged: commit-graph, conflict-and-intent, clean-merge-wrong-behavior, review-with-context, integration-frequency, same-code-different-result, history-as-explanation, ready-to-integrate. Seventeen presets contain ninety-two scene states; the supporting page controls bring inspection to 114 states. The canonical case, earlier weekly fixtures, Week 6 deck and shared shell remain unchanged.

## Review revision · 28 October 2026

A second agent (Claude Code, Opus 5.5) reviewed the delivered deck against the accepted Week 6 deck and against the plan, the fixtures and the channel style guide, at the user's request: same style, animation and finish as Week 6, the content quality as well, checked in Chrome. Every one of the 114 states was captured in installed Google Chrome at 1920 by 1080 and read natively, Week 6's 154 states alongside for comparison, then every changed state again after the fixes.

Defects found and fixed:

- **A reveal that gave the answer away.** In `same-code-different-result` both run results ("120 minutes → Accepted / Rejected") were visible from the first state, because the status helper's `set()` replaced the element's class list and removed the reveal classes. The helper now changes only its kind; the results appear at their own step.
- **Disabled page buttons looked enabled.** The opening, the saved-to-shared page and the bisection page disabled spent buttons with `disabled`, which the shell does not style. They now look unavailable, matching Week 6's `aria-disabled` buttons.
- **"Resolved" review labels stayed orange.** A selector-order problem kept the warning color; they are now green.
- **Color alone carried meaning** in the conflict's boundary table. An "Agree?" column now marks each row with ✓ Yes or × No.
- **Inconsistent example code.** The derived message read `policy.minimum` and `policy.maximum`, which the shown `policy.py` never defined. The fixture now has `policy.py` define `MIN_MINUTES` and `MAX_MINUTES`, and `messages.py` imports both; a new executable snippet (30, 90 accepted; 100 rejected) is checked by `plan/tools/check_plan.py`.
- **Incomplete or unclear captions.** The lost-bound state named 91 and 121 but omitted 120 (computed now from the fixture cases: 91, 120 and 121); the conflict states now name the textual conflict; `main`'s move to c6 is explained as moving forward along the parent links; the fast-forward note gained its sentence ending.
- **Wording drift from the plan.** Principles, outcomes and checks had been paraphrased, some weaker than the plan (for example the review principle lost "not a vote on how convincing its author sounds"). They now use the plan's wording, as Week 6 does.
- **Predictions.** Correct answers were skewed (A 2, B 8, C 7) and five changed conditions repeated the baseline question. Each condition now asks its own question with plausible wrong answers; the assistant-draft preset asks the plan's question ("what changes for the reviewer?"); correct answers are spread 6, 6 and 5.
- **A full-width question mark** in the review checks became an ordinary one.

Week 6-style visuals and motion added where Week 7 had text or cards only:

- **Opening:** the two edits draw into one combined change, then Ari's booking screen offers "Choose 30 to 120 minutes" and rejects the 100-minute request.
- **Saved to shared:** a copy of what each action carries travels to the next place.
- **Conflict:** the R-02 variant sits beside the edits, the plan's visual idea, and is highlighted when the boundary results are compared.
- **Clean merge:** a comparison between the files reads "policy.py enforces 90 ≠ messages.py announces 120" and then "90 = 90".
- **Integration frequency:** rebuilt as two SVG timelines branching from shared work. A current-event column glides from A to D; integration arrows draw in; discovery marks, rework bands (B to C against B to D) and a feature flag are labeled; the reading copy gains the unchanged-contract panel.
- **History:** the DR-07 record shows its links (change `message-policy-fix` → DR-07 → R-02 · R-03) against "fix stuff", which is linked to nothing.
- **Bisection:** a suspect-range bracket narrows from 7 changes to 4, 2 and 1; the reading copy prints the narrowed history.

Verification after the revision (local, this repository's `.venv`, installed Chrome 156 and Playwright Chromium):

| Check | Result |
|---|---|
| `plan/tools/build_manifest.py --check`, `build_combined.py --check`, `scripts/sync_fixtures.py --check`, `scripts/build_index.py --check` | Current. |
| `plan/tools/check_plan.py` | PASS, 90 anchor fixtures, including the new snippet. |
| Week 7 contract, axe, offline, fixture, print and PDF tests (`-k "w07- or test_week_pdf_exists_and_reads[7] or test_plan"`) | 106 passed, 8 skipped (no slider). |
| CI selection for Weeks 1–7 (the workflow expression) | 748 passed, 58 skipped (scenes without sliders; one scene without recorded values), 0 failed, in 1020.69 seconds. The one-line R-03 wording fix on the outcomes page came afterwards; the text check and the layout scan were rerun after it. |
| `scripts/check_deck_text.py --week 7` | PASS: 0 of 515 sentences flagged. |
| `scripts/inspect_deck.py --layout --week 7 --shots` | 114 states, 0 findings; presenter-corner text in 21 states, all rail text in prediction or principle states. |
| Installed-Chrome state walk with an added clipped-code check | 114 states, 0 layout findings, 0 clipped code lines (the check was confirmed against a planted overlong line). |
| Motion in installed Chrome, tab in front | Join arrows, travelling tokens, the conflict's converging intent, the timeline column (740 → 960 over about 700 ms) and the bisection bracket (7 → 4 changes over about 600 ms) inspected mid-motion and settled. Keyboard: Down steps, Right changes the page mid-scene, and leaving leaves no active work. |
| `scripts/export_pdf.py --week 7` | 31 pages, all read; the new diagrams print legibly in the light theme. |
| Pointer targets / print panels | 323 unique targets, no duplicates; 24 print panels. |

The installed-Chrome checks are a scratch harness outside the repository; their results are recorded here. The ZIP package was rebuilt from the revised files.

## Outcome coverage

| Plan outcome | Explanation and answered check |
|---|---|
| Read commits, branch references and merges | `what-is-saved` and `commit-graph`: separate local recording from sharing, follow ancestry, compare divergence with fast-forward; closing check 1. |
| Separate textual conflicts from incompatible behavior | `conflict-and-intent` and `clean-merge-wrong-behavior`: lost upper bound, boundary comparison, two different files contradicting one promise; closing check 2 and the answered library transfer question. |
| Identify context and evidence for review | `review-with-context`: requirement, alternatives, constraints, categorized required/optional comments, unresolved authorization evidence, decision owner, asynchronous review and paired investigation; closing checks 3 and 5. |
| Explain reproducibility inputs | `same-code-different-result`: hold source/request fixed, change only resolution or configuration, restore the declared input, distinguish constraint from resolved set; closing check 4. |
| Explain a change through history and rationale | `history-as-explanation`, `locate-the-change`: compare weak/durable records with the author unavailable, then narrow a repeatable regression predicate to h5. |

## Inspection repairs

Native Chrome and PDF reads found and corrected a crowded review decision panel, clipped code in the three-column ancestor/edit comparison, repeated security comments introduced by repeated fixture construction, uppercase file identifiers, an R-02 identifier lowercased in print prose, dark PDF margins, and SVG commit nodes whose reveal transform was cleared by the shared print stylesheet. Absolute SVG coordinates now preserve those nodes in both modes. Original review comments show when their concerns have been resolved; the temporary rule is explicitly restored. The readiness panel now distinguishes an open human-review concern from its later resolution.

An actual `git merge-file` check showed that the initial two edits did not produce a textual conflict. The policy edit now also changes the validation body so both branches edit overlapping lines, while retaining the intended 90-minute rule. Git confirms the conflict; the separate two-file counterexample still merges cleanly and produces the intended message/behavior mismatch. The package verifier initially used an exact index URL without its scene fragment; its selector was corrected and the verification passed.

## Source review

S01, S02, S06 and S07 were revisited; S61, S62 and S63 were added for bisection and the npm/uv lockfile explanations. S01 returned `HTTP 403 Forbidden`; its last recorded edition remains in the source register. No new edition is asserted. The other referenced primary pages were accessible. These are conceptual references; the people, code changes, review packet and dependency versions are original simulated teaching fixtures.

## Verification evidence

All scripts used this repository's `.venv/Scripts/python.exe`. Checks ran locally on Windows; the widened CI workflow has not been run on a remote service.

| Check | Actual result |
|---|---|
| `plan/tools/build_manifest.py --check` | Current. |
| `plan/tools/check_plan.py` | PASS: 63 registered sources, 51 cited, 90 fixtures checked. |
| `plan/tools/build_combined.py --check` | Derived plan copies current. |
| `scripts/sync_fixtures.py --check`; `scripts/build_index.py --check` | Site fixtures and course index current. |
| Existing built-deck CI selection, including Weeks 1–7, the Week 11 sample and PDFs 1–7 | 748 passed, 58 skipped, 777 deselected in 979.01 seconds. Skips reflect scenes without sliders or recorded `deck_shows` values. |
| Fresh final Week 7 contract/PDF selection | 105 passed, 8 skipped, 1470 deselected in 130.25 seconds. All eight skips are scenes without sliders. |
| `scripts/check_deck_text.py --week 7` | PASS: 774 distinct lines, 490 sentences, zero style or public-content findings. |
| `scripts/inspect_deck.py --layout --week 7 --shots --out build/inspect/week-07` | 114 states across 14 pages, zero layout findings and zero browser errors. Native review covered every saved state through contact sheets, with full-frame reads of key diagrams and the crowded review example. |
| Installed Chrome, separately operated at 1920×1080 with device scale factor 2 | All 114 states inspected; zero overlap, clipping, code clipping or print-panel findings. Every manifest hash route, every preset, Step to the end, Back, Replay, Reset, keyboard behavior, leave-cancels-motion and reduced motion passed. |
| Purposeful motion | Branch references animate while recorded commit positions stay fixed. The two retained pieces of intent converge into the resolution. Mid-motion and settled captures were inspected natively. |
| Recording interface | 296 unique pointer targets; 23 print panels; `record=1` and deterministic state controls verified. Superseded by the review revision: 323 unique targets, 24 print panels. |
| `scripts/export_pdf.py --week 7` and native Poppler review | 30 pages before the review revision (31 after it); every page read, selectable text inside page bounds, no blank pages. Graph, conflict and readiness pages also checked in grayscale. |
| Real Git validation | Overlapping conflict example returns conflict markers; the policy/message files merge without conflicts, then a 100-minute request is rejected while the copied message still says 120. |
| Copied portable package in installed Chrome | All eight Week 7 scenes stepped to their ends through `file://` with the browser context offline. Weeks 1–7 opened from the copied HTTP index with external requests blocked. No application errors. |
| Preservation audit and `git diff --check` | All 82 other-week fixtures and 30 tracked earlier-deck/shared-shell files unchanged. Canonical case and all other fixture blocks unchanged. No whitespace errors. |
| ZIP integrity | Every packaged file checked against SHA-256 and ZIP CRC; package contains all local assets and the finalized instructor notes. |

Versions actually tested: Python 3.10.11; Playwright 1.64.1; pytest 9.2.0; installed Google Chrome 156.0.8078.48; Playwright Chromium 156.0.8078.4; pypdf 6.21.3; PyMuPDF 1.28.2; Pillow 12.3.0; Git 2.56.0.windows.2. No runtime library was added to the deck.

Evidence: `build/inspect/week-07/` holds the layout report and 114 state captures. `build/week07-review/` holds the installed-Chrome report and captures, full test log, motion frames, rendered PDF pages, real Git result, offline-package verification, preservation audit and ZIP receipt. Chrome verification is bound to hashes of the delivered deck, fixtures and shell.

The layout inspector reports content in the optional presenter corner in 20 states; this is informational. The presenter must yield when that content is shown. Installed Kaspersky software injected four external script attempts in the dedicated Chrome run and fourteen in the copied-index run. The checks blocked and recorded these separately from the deck; the application itself requested no external assets, and endpoint protection was left enabled. Clean Playwright Chromium reported no browser errors.

## Recording status and limits

The deck provides the frozen shell's `record=1` behavior, individually named pointer targets, deterministic states, reduced motion and print panels. No narration, shot list, timing budget, recording route or video has been created. The later recording agent generates those within the tutorial workspace.

The PDF is a browser reading copy with selectable text and vector diagrams; tagged-PDF conformance is not claimed. Weeks 8–10 and 12–14 remain in preparation; Week 11 retains its earlier shell sample. Optional shared-history rewriting is outside this deck's core explanation.

## Lecture video (31 October 2026)

The Week 7 lecture was recorded from this deck in the tutorial workspace (Chrome full screen at 3840 by 2160, 60 fps; the narration synthesized first and every action paced to it, in short takes of at most 90 seconds), edited, checked and rendered with the presenter avatars: 41:46.8, 233 narration units, 60 chapters, 630 caption cues, every page, condition and scene state shown. All 42 accepted takes were recorded from the deck as committed in `6d2a8cd`. Two short explanatory animations, an eight-second cold open and 6 readability zooms were added to the footage. Brief covers hide two deck defects the recording exposed, which were then fixed here in `5ed8db3`: a condition preset briefly rendered the new condition's final results (about 0.3 s, which gave a prediction's answer away; 8 covers), and the Focused-change caption stated answer B while its prediction was open (2 covers); 2 covers in the commit-graph scene hide a desktop taskbar and a terminal window that appeared over the browser during that take. Master file: `SE_W07_4K60_avatars_v1.mp4` (in the workspace). The recording state, checks and the render evidence live in the workspace handoff (`projects/software_engineering/week07/HANDOFF.md` there). The video and its captions are English.
