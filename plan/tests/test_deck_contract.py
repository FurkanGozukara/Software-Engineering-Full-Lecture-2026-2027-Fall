"""Deck contract tests, written before the decks exist.

Every test reads the DOM and JavaScript contract in repo_kit/docs/scene-contract.md (the
single home of the attribute names). They are derived from the acceptance checks in
21_instructor_preflight.txt and run against a built site served locally with the network
blocked. Skipped until SE_COURSE_SITE points at a site.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.deck

WAIT = 400  # ms to let a stepped state settle in recording-deterministic mode


def scene_url(base_url: str, week: int, scene_id: str, query: str = "") -> str:
    q = f"?{query}" if query else ""
    return f"{base_url}/weeks/week-{week:02d}.html{q}#/{scene_id}"


def root(page, scene_id):
    return page.locator(f'[data-scene="{scene_id}"]')


def state(page, scene_id) -> dict:
    r = root(page, scene_id)
    return {
        "state": int(r.get_attribute("data-state")),
        "count": int(r.get_attribute("data-state-count")),
        "running": r.get_attribute("data-running") == "true",
        "condition": r.get_attribute("data-condition"),
        "baseline": r.get_attribute("data-baseline") == "true",
        "page": int(page.locator("body").get_attribute("data-page-index")),
    }


def control(page, scene_id, name):
    return root(page, scene_id).locator(f'[data-control="{name}"]').first


def open_scene(page, base_url, week, scene_id, query="record=1"):
    page.goto(scene_url(base_url, week, scene_id, query))
    page.wait_for_selector(f'[data-scene="{scene_id}"][data-state]')
    return state(page, scene_id)


def step_to_end(page, scene_id, limit=64):
    for _ in range(limit):
        s = state(page, scene_id)
        if s["state"] >= s["count"] - 1:
            return s
        control(page, scene_id, "step").click()
        page.wait_for_timeout(WAIT)
    raise AssertionError("scene did not reach its last state within the step limit")


# ------------------------------------------------------------------ entry and baseline
def test_hash_entry_opens_baseline_paused(page, base_url, scene):
    week, scene_id = scene
    s = open_scene(page, base_url, week, scene_id)
    assert s["state"] == 0 and s["baseline"] and not s["running"]
    assert s["count"] >= 2, "a scene needs at least a baseline and one revealed state"


def test_condition_label_is_visible_text(page, base_url, scene):
    week, scene_id = scene
    open_scene(page, base_url, week, scene_id)
    label = root(page, scene_id).locator("[data-condition-label]").first
    assert label.count() == 1 and label.inner_text().strip(), "the selected condition must be printed as text"


# ------------------------------------------------------------------ control semantics
def test_step_and_back_move_one_state(page, base_url, scene):
    week, scene_id = scene
    open_scene(page, base_url, week, scene_id)
    control(page, scene_id, "step").click()
    page.wait_for_timeout(WAIT)
    assert state(page, scene_id)["state"] == 1
    control(page, scene_id, "back").click()
    page.wait_for_timeout(WAIT)
    assert state(page, scene_id)["state"] == 0


def test_last_step_never_advances_the_page(page, base_url, scene):
    week, scene_id = scene
    s0 = open_scene(page, base_url, week, scene_id)
    s = step_to_end(page, scene_id)
    step = control(page, scene_id, "step")
    disabled = step.is_disabled() or step.get_attribute("aria-disabled") == "true"
    assert disabled, "Step must be disabled or clearly finished at the last state"
    if not step.is_disabled():
        step.click(force=True)
        page.wait_for_timeout(WAIT)
    s2 = state(page, scene_id)
    assert s2["page"] == s0["page"] and s2["state"] == s["state"]


def test_next_and_previous_change_the_page_even_mid_scene(page, base_url, scene):
    week, scene_id = scene
    s0 = open_scene(page, base_url, week, scene_id)
    control(page, scene_id, "step").click()
    page.wait_for_timeout(WAIT)
    page.locator('[data-nav="next"]').first.click()
    page.wait_for_timeout(WAIT)
    assert int(page.locator("body").get_attribute("data-page-index")) == s0["page"] + 1
    page.locator('[data-nav="prev"]').first.click()
    page.wait_for_timeout(WAIT)
    assert int(page.locator("body").get_attribute("data-page-index")) == s0["page"]


def test_replay_keeps_condition_and_reset_restores_baseline(page, base_url, scene):
    week, scene_id = scene
    open_scene(page, base_url, week, scene_id)
    presets = root(page, scene_id).locator('[data-control="condition"][data-condition-id]')
    if presets.count() >= 2:
        chosen = presets.nth(1).get_attribute("data-condition-id")
        presets.nth(1).click()
        page.wait_for_timeout(WAIT)
        s = state(page, scene_id)
        assert s["condition"] == chosen and s["state"] == 0, "a condition change returns to the first paused state"
        step_to_end(page, scene_id)
        control(page, scene_id, "replay").click()
        page.wait_for_timeout(WAIT)
        s = state(page, scene_id)
        assert s["state"] == 0 and s["condition"] == chosen, "Replay keeps the selected condition"
        control(page, scene_id, "reset").click()
        page.wait_for_timeout(WAIT)
        s = state(page, scene_id)
        assert s["baseline"] and s["state"] == 0 and s["condition"] != chosen, "Reset restores the baseline condition"
    else:
        step_to_end(page, scene_id)
        control(page, scene_id, "replay").click()
        page.wait_for_timeout(WAIT)
        assert state(page, scene_id)["state"] == 0
        control(page, scene_id, "step").click()
        page.wait_for_timeout(WAIT)
        control(page, scene_id, "reset").click()
        page.wait_for_timeout(WAIT)
        assert state(page, scene_id)["baseline"]


def test_leaving_a_scene_cancels_its_work(page, base_url, scene):
    week, scene_id = scene
    open_scene(page, base_url, week, scene_id)
    run = control(page, scene_id, "run")
    if run.count():
        run.click()
    else:
        control(page, scene_id, "step").click()
    page.wait_for_timeout(WAIT)
    page.locator('[data-nav="next"]').first.click()
    page.wait_for_timeout(WAIT)
    active = page.evaluate("() => window.lecture.activeWork()")
    assert active == 0, f"{active} timers or animations still run after leaving the scene"
    page.locator('[data-nav="prev"]').first.click()
    page.wait_for_timeout(WAIT)
    s = state(page, scene_id)
    assert s["state"] == 0 and not s["running"], "re-entry restores the baseline, paused"


# ------------------------------------------------------------------ accessibility and motion
def test_controls_are_keyboard_reachable_with_names(page, base_url, scene):
    week, scene_id = scene
    open_scene(page, base_url, week, scene_id)
    controls = root(page, scene_id).locator("[data-control]")
    assert controls.count() >= 4, "step, back, replay and reset are required"
    for i in range(controls.count()):
        c = controls.nth(i)
        name = c.get_attribute("aria-label") or c.inner_text().strip()
        assert name, f"control {i} has no accessible name"
        c.focus()
        assert c.evaluate("el => el === document.activeElement"), "control must accept keyboard focus"


def test_range_inputs_do_not_change_the_page(page, base_url, scene):
    week, scene_id = scene
    s0 = open_scene(page, base_url, week, scene_id)
    sliders = root(page, scene_id).locator('input[type="range"]')
    if not sliders.count():
        pytest.skip("scene has no slider")
    sliders.first.focus()
    before = sliders.first.input_value()
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(WAIT)
    assert int(page.locator("body").get_attribute("data-page-index")) == s0["page"]
    assert sliders.first.input_value() != before, "arrow keys must reach the slider"


def test_reduced_motion_reaches_the_same_final_state(page, base_url, scene):
    week, scene_id = scene
    open_scene(page, base_url, week, scene_id, query="record=1&motion=off")
    s = step_to_end(page, scene_id)
    assert s["state"] == s["count"] - 1


def test_axe_reports_no_serious_violations(page, base_url, scene):
    week, scene_id = scene
    try:
        from axe_playwright_python.sync_playwright import Axe
    except ImportError:
        pytest.skip("axe-playwright-python is not installed")
    open_scene(page, base_url, week, scene_id)
    results = Axe().run(page)
    serious = [v for v in results.response["violations"] if v["impact"] in ("serious", "critical")]
    assert not serious, "\n".join(f"{v['id']}: {v['help']}" for v in serious)


# ------------------------------------------------------------------ offline and fixtures
def test_deck_loads_with_no_external_requests(page, base_url, scene):
    week, scene_id = scene
    open_scene(page, base_url, week, scene_id)
    assert not page.external_requests, f"external requests: {page.external_requests[:5]}"
    assert not page.failed_requests, f"failed requests: {page.failed_requests[:5]}"


def test_fixture_values_are_shown(page, base_url, fixtures, scene):
    week, scene_id = scene
    values = fixtures.get("anchors", {}).get(f"w{week:02d}/{scene_id}", {}).get("deck_shows", [])
    if not values:
        pytest.skip("no deck_shows values recorded for this scene")
    open_scene(page, base_url, week, scene_id)
    step_to_end(page, scene_id)
    text = root(page, scene_id).inner_text()
    missing = [v for v in values if v not in text]
    assert not missing, f"scene text lacks fixture values {missing}"


# ------------------------------------------------------------------ print path
def test_print_view_declares_ready(page, base_url, scene):
    week, scene_id = scene
    page.goto(scene_url(base_url, week, scene_id, "print=1"))
    page.wait_for_selector('html[data-print-ready="true"]', timeout=20000)
    assert page.locator(f'[data-scene="{scene_id}"] [data-print-panel]').count() >= 1, \
        "print view needs at least one deliberate print panel per scene"
    assert page.locator("[data-control]:visible").count() == 0, "controls must be hidden in print view"
