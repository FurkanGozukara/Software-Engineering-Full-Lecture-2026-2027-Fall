TOOLS FOR THE PLAN PACKAGE
==============================================================================

The weekly and support TXT files are the only source. Everything else here is derived or a check.

python tools/build_manifest.py          derive plan_manifest.json (scene manifest for agents, index, tests)
python tools/build_manifest.py --check  exit 1 when the manifest on disk is stale
python tools/check_plan.py              structure, links, sources, rules, spine, fixtures, manifest; exit 1 on any failure
python tools/build_combined.py          regenerate the combined Markdown (and PDF when Playwright Chromium is installed)
pytest -q                               runs the plan checker as a test; deck and PDF tests skip until SE_COURSE_SITE points at a built site

Install once: pip install -r requirements-dev.txt; python -m playwright install chromium

models.py holds the deterministic teaching models (flow board, delivery measures, nearest-rank
percentile, SLO arithmetic, retry amplification, Campus Rooms rules). Their meaning is written in
19_recurring_case_and_demo_data.txt; their parameters and rows live in assets/demo-fixtures.json.

These tools and the tests move into the course repository unchanged (23_build_plan_and_schedule.txt).
