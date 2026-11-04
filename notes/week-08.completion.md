# Week 08 · completion record

Date: 4 November 2026. Branch: `week/08-testing`, based on `main` at `91f115d`. The user requested the full Week 8 material and lecture plan, following the earlier weeks, and no recording or media generation yet. The lecture video followed on the same day (section "Lecture video" below).

Status: complete material, browser-verified and read natively. Lecture video recorded and delivered on 4 November 2026 (section "Lecture video" below). Course materials prepared for GitHub publication on 5 November 2026.

## Files and scope

| Deliverable | Path |
|---|---|
| Interactive deck | `site/weeks/week-08.html`, `site/weeks/week-08.js` |
| Reading copy | `site/pdf/week-08.pdf` · 32 pages |
| Instructor guide | `notes/week-08.scene-guide.md` |
| Teaching data | `plan/assets/demo-fixtures.json`, synchronized to `site/assets/fixtures/` |
| Index and status | `site/index.html`, `README.md` |
| Source refresh | `plan/week8.txt`, `plan/18_sources.txt`, `plan/15_curriculum_currency_and_coverage.txt`; derived manifest and combined plan regenerated |
| Automated coverage | CI expression widened to Week 8 and its PDF; Week 8 layout scan included |
| Portable package | `../Week_08_Complete_Materials.zip`, including the local site, PDF and instructor notes |

Fourteen deck pages; the eight manifest scene identifiers are unchanged: friendly-example, partition-the-inputs, choose-test-scope, oracle-independence, properties-and-counterexamples, coverage-and-mutation, repeatable-observation, testing-as-feedback. Twenty-five presets contain 114 scene states; the supporting page controls bring inspection to 139 states. The canonical case, earlier weekly fixtures, earlier decks and shared shell remain unchanged.

## Outcome coverage

| Plan outcome | Explanation and answered check |
|---|---|
| Derive ordinary, boundary, and invalid cases | `friendly-example`, `partition-the-inputs`: the walk through seven durations, three groups, two edges, shape and order as separate concerns; closing check 1. |
| Choose a scope and say what it leaves unexamined | `choose-test-scope`, `explore-the-journey`: a moving window over the system, one limit per row, the double, the contract mismatch, exploration against scripted checks; closing checks 3 and 5. |
| Distinguish executing code from asserting the result | `coverage-and-mutation`, opening: a suite that calls `duration_ok(120)` and never reads the answer; one assertion changes the run and leaves coverage the same; closing check 4 and the transfer question. |
| Explain a property and a small mutation challenge | `properties-and-counterexamples`, `coverage-and-mutation`: P1 and P2, a reduced counterexample, a surviving and a detected mutant, an equivalent mutant; closing check 2. |
| Recognize shared assumptions, uncontrolled inputs, flaky observations | `oracle-independence`, `repeatable-observation`: one helper behind code and expected value, one assistant behind code and tests, the wall clock, a delay against an injected failure; closing check 4. |

The core route stays understandable with the optional fuzzing preset left out; Week 9 does not depend on it.

## Choices made from earlier weeks' findings

- **Prediction answers stay open.** The Week 7 review found a reveal that showed its answer and a preset that flashed the new condition's results. Every condition change here settles its motion before the next frame, and no caption states the answer while its prediction is open. A native read caught one more case during authoring: the debugging move labels at the first state of `testing-as-feedback` named the answer, so they now appear as each move is reached.
- **Answers are spread.** The 26 predictions have correct answers A 9, B 9 and C 8. Each condition asks its own question.
- **Plan wording is kept** for principles, outcomes and the six checks, as Weeks 6 and 7 do. Under the wording checker, the plan's negative phrasings of coverage and mutation limits became statements of what the result does tell you.
- **Presenter corner.** Stage text stays out of the presenter corner in every state. One exploration card was narrowed to keep it so. Rail text reaches the corner in prediction and principle states only, the same pattern as Weeks 4 to 7.

## Source review

S01, S02, S11, S12, S40 and S60 were revisited on 4 November 2026; S64 (Pact, contract testing) was added. S01 is reachable again and identifies SWEBOK v4.0a; the guide itself was not re-audited. The Hypothesis home page no longer mentions shrinking, and the API reference does; the register records that page. The Stryker page lists Killed, Survived, No coverage and Ignored states and defines the score as detected / valid; it has no "Equivalent" state, so the deck says tools let you mark such a change. The Google chapter's stated team ratio is not adopted. The ISTQB PDF page 44 was read again. These are conceptual references; the people, code, runs, clocks and delays are original simulated teaching fixtures.

## Verification evidence

All scripts used this repository's `.venv/Scripts/python.exe`. Checks ran locally on Windows; the widened CI workflow has not been run on a remote service.

| Check | Actual result |
|---|---|
| `plan/tools/build_manifest.py --check` | Current. |
| `plan/tools/check_plan.py` | PASS: 64 registered sources, 52 cited, 94 anchor fixtures checked. Every new result (boundary cases, helper values, both properties under both comparisons, reduction steps, clock readings, delays, parser crash) is an executed snippet. |
| `plan/tools/build_combined.py --check`; `scripts/sync_fixtures.py --check`; `scripts/build_index.py --check` | Derived plan copies, site fixtures and course index current. |
| CI selection for Weeks 1 to 8 on the final deck (the workflow expression; includes every Week 8 contract, axe, offline, fixture, print and PDF test) | 853 passed, 66 skipped (scenes without sliders; one scene without recorded values), 0 failed, in 1157 seconds. |
| `scripts/check_deck_text.py --week 8` | PASS: 1084 distinct lines, 648 sentences, zero style or public-content findings. |
| `scripts/inspect_deck.py --layout --week 8 --shots` | 139 states across 14 pages, zero layout findings, zero browser errors. Text in the presenter corner in 46 states, all rail text in prediction or principle states. |
| Native read | Every state through contact sheets; the fixed states and reveals at full size. The read found and fixed: a prediction answer visible in the first state of `testing-as-feedback`; an always-highlighted table in `oracle-independence`; a "misread" label shown for a correct helper; three spaces collapsing to one on screen; R-03 shown on the R-04 preset; overflowing run labels; wrapped headings and leads; seven rail overflows; a garbled caption. |
| Line-by-line logic read of the deck text and narration, after every automated check had passed | Found and fixed: the helper-at-150 status naming the wrong failing case (it fails on 121, not 120); a caption implying a valid number is rejected after the parser correction; a score of 50% beside a note reading as if the equivalent mutant no longer counted; mutant results, line counts and answers-compared shown before the run; a garbled misreading caption; "a red run means the rule changed" (the behavior changes). All 26 announced answers match the deck's option order. |
| Installed Chrome 156 at 1920 by 1080, device scale factor 2 | Every hash route opened at its baseline, paused. All 25 presets and 114 scene states stepped by keyboard, then Back, Replay and Reset; Right changes the page mid-scene; no active work after leaving. Zero page errors, zero clipped code lines. |
| Motion, installed Chrome | Nine reveals captured mid-motion and settled (cards through the comparison, the band shrinking, the window and the race to storage, the copied value, a refused booking, the mutated line, the clock marker, the loop closing). Active work returns to zero after each. |
| Pointer targets | 407 unique at load, no duplicates. |
| `scripts/export_pdf.py --week 8` | 32 pages, all read through contact sheets, selected pages at reading size and in grayscale; selectable text, no blank pages, all scene identifiers printed. |
| Prediction answers | 26 predictions; correct options A 9, B 9, C 8. |
| Preservation audit against `main` | All 86 other-week fixtures unchanged; existing Week 8 fixture values kept, with additions only; no earlier deck, PDF, note or shared-shell file changed. |

Versions actually tested: Python 3.10.11; Playwright 1.64.1; pytest 9.2.0; installed Google Chrome 156.0.8078.48; pypdf 6.21.3; PyMuPDF 1.28.2; Pillow 12.3.0. No runtime library was added to the deck.

Evidence: `build/inspect/week-08/` holds the layout report and 139 state captures. `build/week08-review/` holds the contact sheets, motion frames, Chrome report, rendered PDF pages, full test log and package receipts. `build/` is not tracked.

Installed Kaspersky software injected external script attempts in the installed-Chrome runs (91 distinct URLs in the final walk). The checks recorded these separately from the deck; the application itself requested no external assets, and endpoint protection was left enabled. Clean Playwright Chromium reported no browser errors.

## Recording status and limits

The deck provides the frozen shell's `record=1` behavior, individually named pointer targets, deterministic states, reduced motion and print panels. Narration, shot list, timing budget and recording route live in the tutorial workspace, not in this repository.

The PDF is a browser reading copy with selectable text and vector diagrams; tagged-PDF conformance is not claimed. Weeks 9, 10 and 12 to 14 remain in preparation; Week 11 retains its earlier shell sample.

## Lecture video (4 November 2026)

The Week 8 lecture was recorded from this deck in the tutorial workspace (Chrome full screen at 3840 by 2160, 60 fps; the narration synthesized first and every action paced to it, in short takes), edited, checked and rendered with the presenter avatars: 45:22.8, 243 narration units, 67 chapters, 751 caption cues, every page, condition and scene state shown. All 45 takes were recorded from this deck in one session with no retake. Three short explanatory animations, an eight-second cold open and 45 floating detail panels were added to the footage. Brief covers hide words the recording exposed: the opening heading's 'Why was Ari's booking refused?' while its prediction is open, the selected chip words 'survives' and 'detected' until their reveals, and Chrome's link status bubble.

Deck text kept as recorded, for a later revision of the material: after the assertion is added in the coverage scene the Condition caption still says 'a suite with no assertions'; page 5's provider card stays in the present tense after the repair; the opening heading still states the question on the deck page itself (covered only in the video). The empty role pill on pages without a role comes from the shared deck shell.

Master file: `SE_W08_4K60_avatars_v1.mp4` (in the workspace). The recording state, checks and the render evidence live in the workspace handoff (`projects/software_engineering/week08/HANDOFF.md` there). The video and its captions are English. Course materials prepared for GitHub publication on 5 November 2026; the video upload remains with the course author.
