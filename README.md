# Software Engineering course site

## Quick start (no installation)

```
git clone https://github.com/FurkanGozukara/Software-Engineering-Full-Lecture-2026-2027-Fall.git
```

Then open `site/index.html` in Chrome or Edge (double-click it) and follow the link to a lecture.
The decks are plain HTML, CSS and JavaScript: nothing to install, no network needed. Each week's
printable notes are in `site/pdf/`. Keyboard: Right/Left arrows change the page, Down/Up arrows step
the demonstration, `?` shows the help. Optional local server for clean links:
`python scripts/serve.py --root site` and open `http://127.0.0.1:8000/`.

Status: Week 1 is complete (deck, PDF, scene guide). The other weeks are added one at a time; the
index marks them as in preparation until then.

Fourteen interactive lecture decks and their student PDFs for an introductory software engineering course built around the fictional Campus Rooms booking service. The teaching plan is in `plan/`; the student-facing site is `site/`.

## Layout

```
AGENTS.md  CLAUDE.md          rules for the authoring agents (AGENTS.md is the single home)
plan/                         the teaching plan: week1..14.txt, support files, assets/demo-fixtures.json,
                              plan_manifest.json (derived), tools/, tests/, pytest.ini, requirements-dev.txt
docs/scene-contract.md        DOM and JavaScript contract every deck implements
site/                         the student distribution, and nothing else
  index.html                  course index: week, central question, scope, deck and PDF links
  weeks/week-01.html ...      one deck per week
  shared/                     theme.css, print.css, lecture-controls.js, visual-components.js
  vendor/                     pinned local libraries with THIRD_PARTY_NOTICES.txt
  assets/                     diagrams and a copy of the fixture data the decks render
  pdf/week-01.pdf ...         student PDFs exported from the print view
  README.txt                  how to start the site offline
notes/week-NN.*.md            instructor scene guides and completion records (no cue lists or narration)
scripts/serve.py              local server; scripts/export_pdf.py: print-view PDF export
tasks/                        task templates for the recurring authoring jobs
.github/workflows/ci.yml      the same checks on every push once the repository has a remote
```

## Run the checks

```
pip install -r plan/requirements-dev.txt
python -m playwright install chromium
python plan/tools/build_manifest.py --check
python plan/tools/check_plan.py
python plan/tools/build_combined.py --check
cd plan && SE_COURSE_SITE=../site pytest -q
python scripts/inspect_deck.py --layout --week 1 --out build/inspect/week-01
```

## Serve and export

```
python scripts/serve.py --root site --port 8000      # then open http://127.0.0.1:8000/
python scripts/export_pdf.py --site site --week 1     # or --all
```

The site must work with the network disabled. The supported route is the local server above; do not promise that every deck works from `file://` unless that route has been tested.

## Phase 0 state (17 September 2026)

Built and verified: the shared shell, the complete Week 1 deck with its PDF and scene guide, and the
two shell-test scenes `weeks/week-05.html#/dependency-example` and
`weeks/week-11.html#/latency-is-a-distribution`. Weeks 2-4, 6-10 and 12-14 are not built yet, so
until they exist the deck and PDF tests are run filtered to the decks that exist:

```
cd plan && SE_COURSE_SITE=../site pytest -q -k "w01- or w05-dependency-example or w11-latency-is-a-distribution or test_week_pdf_exists_and_reads[1]"
```

Author-side helpers added in Phase 0 (all under `scripts/`): `sync_fixtures.py` copies the plan
fixtures into the site (`--check` in CI), `build_index.py` regenerates `site/index.html`,
`check_deck_text.py --week N` runs the workspace narration style checker over
every visible string of a deck and of its print view, and `inspect_deck.py` captures scene states and
the print view for a native read; with `--layout` it scans every state at 3840 by 2160 for
overlapping, overflowing and escaping text (`--shots` saves one capture per state). The per-week
completion record and scene guide live in `notes/` (`notes/week-NN.completion.md`,
`notes/week-NN.scene-guide.md`). There is no instructor rehearsal.

The repository holds no speaking cues: no cue lists, shot lists, narration, planned durations or
recorded routes. A recording agent analyzes the plan and the deck at run time and generates the
shot list, the narration and speech, and the tutorial (`plan/22_recording_track.txt`).
