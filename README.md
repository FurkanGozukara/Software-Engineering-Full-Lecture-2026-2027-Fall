# Software Engineering course site

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
cues/week-NN.json             recording cue lists (instructor side, see plan/22_recording_track.txt)
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
cd plan && SE_COURSE_SITE=../site pytest -q
```

## Serve and export

```
python scripts/serve.py --root site --port 8000      # then open http://127.0.0.1:8000/
python scripts/export_pdf.py --site site --week 1     # or --all
```

The site must work with the network disabled. The supported route is the local server above; do not promise that every deck works from `file://` unless that route has been tested.
