# Task: author Week NN

Read AGENTS.md and the files it lists, then `plan/weekNN.txt` in full. Its central question is: "[copy the weekly question from the manifest]".

Build `site/weeks/week-NN.html` on the existing shell without changing shell behavior. Give particular attention to the three scenes marked Anchor: situation, prediction pause, mechanism in controlled steps, one labeled condition change, comparison, principle. Keep the five Bridge scenes lighter, but make every reveal a pointer-operated step with a pointer target (`data-cue-target`), because the recording rule counts an unoperated reveal as static. Preserve every scene identifier from the manifest. Render every value from the `wNN/*` anchors in `plan/assets/demo-fixtures.json`; add missing values to the fixtures first, labeled, and rerun the plan checker.

Where a scene needs an extra page for legibility, keep its identifier and add a stable continuation (`<scene-id>-2`). Choose the representation for the question: custom SVG for dependencies, commit graphs, states and sequences; semantic tables for requirements, permissions, compatibility and coverage; numeric charts only for real quantities, with an accessible data table; a readable Python-like snippet only when examining behavior.

Give every scene a plain-language `principleShort` line under its principle, and carry the week's "In practice" tool names from Section 1 of `plan/weekNN.txt` into the deck (AGENTS.md, student-facing wording).

Produce: the deck, its print panels, `site/pdf/week-NN.pdf`, any local assets, and a short scene guide (`notes/week-NN.scene-guide.md`) naming the baseline, the useful condition presets, the state that best exposes each misconception, and any deliberately simplified mechanism. There is no instructor rehearsal; the guide is what the instructor reads before teaching. Write no cue list, narration, shot-duration budgets or recorded route anywhere; the recording agent generates them at run time (`plan/22_recording_track.txt`).

Before handing over, read every caption and note that appears only in the PDF and ask of each sentence: would it make sense to someone who never read the plan? Plan wording such as authoring instructions or guardrails does not belong in student text.

Definition of done: the AGENTS.md command list passes, including the layout scan at 3840 by 2160; you read the layout captures and the PDF page by page; the pull request reports files, checks run with results, and unresolved limitations. Do not report a check you did not run.
