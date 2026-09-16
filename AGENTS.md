# Course site authoring rules

For every agent that authors, revises or checks the Software Engineering course site (Claude Code, Codex or another runtime). `CLAUDE.md` imports this file. Each rule lives in one place; this file routes to it.

## Read first, in this order

1. `plan/00_START_HERE.txt`: package map and the decisions in force.
2. `plan/plan_manifest.json`: the derived scene manifest (ids, roles, links, principles). Never edit it; regenerate with `python plan/tools/build_manifest.py`.
3. The week you are building: `plan/weekN.txt`, all eleven sections.
4. `plan/17_visual_lecture_and_pdf_brief.txt` (experience, control meanings, print), `plan/19_recurring_case_and_demo_data.txt` (case semantics) and the `anchors` block of `plan/assets/demo-fixtures.json` (the data your scenes render).
5. `docs/scene-contract.md`: the DOM and JavaScript names the tests expect.
6. `plan/22_recording_track.txt`: cue targets and the recording mode your deck must provide.

## Non-negotiable rules

- **Fixtures are the only truth.** Every number, name, state and code snippet on screen comes from `plan/assets/demo-fixtures.json`. If a scene needs a value that is not there, add it to the fixtures with a label (measured, sourced or simulated), rerun `python plan/tools/check_plan.py`, and only then use it. Never invent a measurement or a source claim.
- **One deck per week** at `site/weeks/week-NN.html`, using the shared shell in `site/shared/`. Scene identifiers come from the manifest and never change.
- **The contract is the interface.** Implement `docs/scene-contract.md` exactly. Do not edit the tests to make them pass; if the contract must change, change `docs/scene-contract.md` first, then the shell, then the tests, and say so in the pull request.
- **Offline at runtime.** No CDN, hosted font, analytics, remote image, embedded video or model call. Libraries live in `site/vendor/` with pinned versions and `THIRD_PARTY_NOTICES.txt`. Record the versions actually tested.
- **Decisions in force** (`plan/00_START_HERE.txt`): English only; dark theme by default with a light print stylesheet; Python-like pseudocode for every snippet; the viewer is addressed as "you"; no assessment, exam, grading or project content anywhere; every week is recorded, so the deck provides `record=1` mode and cue targets.
- **Student-facing wording** follows `F:/0_tutorial_videos_project/docs/channel_style_guide.md`: public audience and useful content, instructional not defensive. Headings are questions or claims under examination; the formal term appears after its mechanism. The plan's instructor prose is not bound by this; deck text and narration are.
- **Layout** at 1920 by 1080 logical pixels, correct at device scale factor 2, full canvas. Where a composition allows, leave the bottom-right corner empty so the presenter overlay can appear more often; never reserve it.

## Definition of done for a week

All of the following, run and reported, not assumed:

```
python plan/tools/build_manifest.py --check
python plan/tools/check_plan.py
cd plan && SE_COURSE_SITE=../site pytest -q          # deck contract, axe, offline, print, PDF checks
python scripts/export_pdf.py --week NN                # writes site/pdf/week-NN.pdf from the print view
python F:/0_tutorial_videos_project/tools/check_static_content.py cues/week-NN.json
```

Then open the deck in a browser and inspect it yourself: every scene through its hash link, Step to the end, one condition change, Replay, Reset, keyboard only, reduced motion, and the exported PDF page by page. The pull request lists the files produced, the checks that ran with their results, and every unresolved limitation. A generated file, a passing build and an inspected teaching-ready result are three different claims; report which one you have.

## Working method

- One week per branch or worktree. The shell (`site/shared/`) changes only in its own branch, and any shell change reruns the tests for every existing deck.
- Commit messages say what changed and what was verified. Do not claim a check you did not run.
- Prefer the smallest understandable implementation: custom SVG, semantic HTML tables, CSS and the Web Animations API before any framework. Chart.js only for real quantities, with an accessible data table. Three.js only when space explains something better, with a 2D print fallback.
- Split a crowded scene into a continuation page (`<scene-id>-2`) rather than shrinking a diagram.
- When a plan file and this repository disagree, the plan files in `plan/` win; open an issue or note in the pull request instead of silently deviating.
- Task templates for the recurring jobs are in `tasks/`.
