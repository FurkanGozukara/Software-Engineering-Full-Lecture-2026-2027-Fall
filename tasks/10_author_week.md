# Task: author Week NN

Read AGENTS.md and the files it lists, then `plan/weekNN.txt` in full. Its central question is: "[copy the weekly question from the manifest]".

Build `site/weeks/week-NN.html` on the existing shell without changing shell behavior. Give particular attention to the three scenes marked Anchor: situation, prediction pause, mechanism in controlled steps, one labeled condition change, comparison, principle. Keep the five Bridge scenes lighter, but make every reveal a pointer-operated step with a cue target, because the recording rule counts an unoperated reveal as static. Preserve every scene identifier from the manifest. Render every value from the `wNN/*` anchors in `plan/assets/demo-fixtures.json`; add missing values to the fixtures first, labeled, and rerun the plan checker.

Where a scene needs an extra page for legibility, keep its identifier and add a stable continuation (`<scene-id>-2`). Choose the representation for the question: custom SVG for dependencies, commit graphs, states and sequences; semantic tables for requirements, permissions, compatibility and coverage; numeric charts only for real quantities, with an accessible data table; a readable Python-like snippet only when examining behavior.

Produce: the deck, its print panels, `site/pdf/week-NN.pdf`, `cues/week-NN.json`, any local assets, and a short rehearsal note (`cues/week-NN.rehearsal.md`) naming the baseline, the useful condition presets, the state that best exposes each misconception, and any deliberately simplified mechanism.

Definition of done: the AGENTS.md command list passes; you inspected every scene by hash link and the PDF page by page; the pull request reports files, checks run with results, and unresolved limitations. Do not report a check you did not run.
