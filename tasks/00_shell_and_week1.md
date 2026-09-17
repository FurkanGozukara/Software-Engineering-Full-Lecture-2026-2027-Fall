# Task: shared shell, Week 1, and the two shell-test scenes (Phase 0)

Read AGENTS.md and the files it lists. Then build, in this order, and stop after each numbered step to run the checks:

1. **Shell** in `site/shared/`: theme (dark default, light print stylesheet), page navigation, the scene state machine and controls exactly as `docs/scene-contract.md` defines them, `record=1`, `motion=off` and `print=1` modes, the `window.lecture` interface, pointer-target attributes, and the course `site/index.html` generated from `plan/plan_manifest.json`.
2. **Week 1** complete: `site/weeks/week-01.html`, all eight scenes from `plan/week1.txt`, data from the `w01/*` anchors in `plan/assets/demo-fixtures.json`, print panels per scene, and `site/pdf/week-01.pdf` through `scripts/export_pdf.py`. No cue list or narration: the recording agent generates those at run time (`plan/22_recording_track.txt`).
3. **Shell tests**: the Week 5 scene `dependency-example` (graph with must-edit, recheck and unaffected markers under two designs) and the Week 11 scene `latency-is-a-distribution` (two charts with an accessible data table and nearest-rank p95), each inside its eventual weekly deck file, to prove the shell handles graphs, controllable state, numeric charts and print.

Definition of done: the command list in AGENTS.md passes for Week 1 and the two test scenes; you have inspected every Week 1 scene by hash link in a browser and the PDF page by page; the pull request lists files, checks run with results, pinned library versions, and unresolved limitations.
