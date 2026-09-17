# Scene contract

The single home of the DOM and JavaScript contract every weekly deck implements. The tests in `plan/tests/test_deck_contract.py`, the PDF export script, the inspection scripts, the authoring agents and the recording agents (`22_recording_track.txt`) read these names. Change a name here first, then everywhere. The teaching meaning of each control is defined in `17_visual_lecture_and_pdf_brief.txt` ("A stable control contract"); this file only fixes how it appears in the DOM.

## Pages and navigation

- `body[data-page-index]` is the zero-based index of the current page; `body[data-page-count]` the total.
- Every page is a `section[data-page][data-page-id]`. A scene page also carries `data-scene-id="<scene-id>"` and `data-scene-role="anchor|bridge"`. A continuation page of a scene keeps `data-scene-id` and uses `data-page-id="<scene-id>-2"`, `-3`, and so on.
- `[data-nav="next"]` and `[data-nav="prev"]` change the page and nothing else. They work while a scene is unfinished. An optional `[data-nav="overview"]` opens the page overview.
- The deep link `weeks/week-NN.html#/<scene-id>` opens the scene's first page at its baseline, paused. Continuations link as `#/<scene-id>-2`.

## Scene root

`[data-scene="<scene-id>"]` wraps one scene's demonstration and controls. The shell maintains:

| attribute | meaning |
|---|---|
| `data-state` | current state index, `0` is the baseline |
| `data-state-count` | number of states under the current condition, at least `2` |
| `data-running` | `"true"` only while a Run timer advances states |
| `data-condition` | id of the selected condition preset |
| `data-baseline` | `"true"` when the selected condition is the canonical baseline preset |

## Controls

Inside the scene root:

- `button[data-control="step"]`, `button[data-control="back"]`, `button[data-control="replay"]`, `button[data-control="reset"]` are required. At the last state Step carries `disabled` or `aria-disabled="true"` and does nothing; it never changes the page.
- `button[data-control="run"]` is optional (queue flow, retry model). It toggles Run and Pause and exposes `aria-pressed`. The initial state is paused.
- Condition presets are `[data-control="condition"][data-condition-id="<preset>"]` (buttons or radio inputs). The baseline preset is always present. Selecting a preset returns the scene to state `0` under that preset.
- `[data-condition-label]` prints the selected condition as text, always visible.
- Sliders are `input[type="range"][data-control="slider"]`. Arrow keys inside a slider or any input are never captured by the deck.
- Every control has an accessible name (`aria-label` or visible text), visible focus and a target of at least 44 by 44 CSS pixels.

## Pointer targets

Every control and every element a pointer may click, hover or drag carries `data-cue-target="<scene-id>:<name>"`, unique within the deck. The attribute only names an element; it carries no order, timing or text to speak. A deck declares no cue lists, narration or recorded route: a recording agent chooses its route through the deck at run time (`22_recording_track.txt`).

## Query modes

- `?record=1` deterministic timing: fixed step durations, no randomness, transitions honored, no autoplay.
- `?motion=off` instant states with identical content; also applied automatically under `prefers-reduced-motion: reduce`.
- `?print=1` renders every scene's `[data-print-panel]` elements in order, hides all `[data-control]` and `[data-nav]` elements, prints selected condition values as text, and sets `html[data-print-ready="true"]` once fonts, charts and SVG have rendered. Scene identifiers are printed on their pages.

## JavaScript interface

`window.lecture` exists on every deck:

```
lecture.gotoScene(id)         open the scene's first page at its baseline, paused
lecture.step() / back() / replay() / reset()
lecture.setCondition(presetId)
lecture.state(sceneId)        -> {state, count, running, condition, baseline}
lecture.activeWork()          -> number of live timers, animations and rAF loops owned by scenes; 0 after leaving a page
lecture.pages()               -> [{id, kind, role, heading}] for every page in deck order
```

## Behavior guarantees

- Leaving a page cancels the scene's timers and animations (`activeWork()` returns `0`). Returning to the page, by navigation or by hash, restores the canonical baseline, paused. Resume behavior, if ever offered, is a visible mode, never hidden persistence.
- Changing a condition returns that scene to its first paused state and updates `[data-condition-label]`.
- No request leaves the site origin at runtime: no CDN, fonts, analytics, remote images or model calls.
- The deck is laid out at 1920 by 1080 logical pixels and renders correctly at device scale factor 2. It uses the whole canvas; nothing is reserved for a presenter overlay.
