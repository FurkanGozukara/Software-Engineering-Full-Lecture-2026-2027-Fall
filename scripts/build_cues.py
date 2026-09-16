"""Derive the recording cue list (shot list) of a week from the deck itself.

  python scripts/build_cues.py --week 1                 writes cues/week-01.json
  python scripts/build_cues.py --week 1 --check         only verifies the existing file against the deck

The deck declares its cues per page (lecture.cues(id)); each names a data-cue-target, a pointer
action (click or hover), the state it expects afterwards, a planning duration and what the
segment teaches (22_recording_track.txt, "Cue list equals shot list"). This script opens the deck
in record=1 mode, performs every cue in lecture order with real pointer actions, checks that the
target exists and that the expected state is produced, and writes the workspace shot-list format
(F:/0_tutorial_videos_project/docs/templates/shot_list.example.json) with the four extra fields
scene, cue_target, deck_action and expect_state. No spoken text belongs here.

The recorded route skips the recall-and-outcomes page (22_recording_track.txt, opening); every
other page is included in deck order. Chapters are numbered by page: 00 opening, 01..08 scenes,
09 principles, 10 sources.
"""
from __future__ import annotations

import argparse
import http.server
import json
import socket
import socketserver
import threading
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIPPED_PAGES = {"outcomes"}


def serve(root: Path):
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    handler.log_message = lambda *a, **k: None  # type: ignore[attr-defined]
    server = socketserver.ThreadingTCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{port}"


def derive(site: Path, week: int) -> tuple[dict, list[str]]:
    from playwright.sync_api import sync_playwright
    problems: list[str] = []
    segments: list[dict] = []
    server, base = serve(site)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1920, "height": 1080})
            page.on("pageerror", lambda e: problems.append(f"page error: {e}"))
            page.goto(f"{base}/weeks/week-{week:02d}.html?record=1")
            page.wait_for_selector("body[data-page-count]")
            pages = page.evaluate("() => window.lecture.pages()")
            chapter_no = 0
            for pg in pages:
                pid = pg["id"]
                if pid in SKIPPED_PAGES:
                    continue
                chapter = f"{chapter_no:02d}"
                chapter_no += 1
                page.evaluate("(id) => window.lecture.gotoScene(id)", pid)
                page.wait_for_timeout(200)
                cues = page.evaluate("(id) => window.lecture.cues(id)", pid)
                for cue in cues:
                    target = cue["target"]
                    loc = page.locator(f'[data-cue-target="{target}"]').first
                    if loc.count() == 0:
                        problems.append(f"{pid}: cue {cue['cue']} names a missing target {target}")
                        continue
                    try:
                        if not loc.is_visible():
                            problems.append(f"{pid}: cue {cue['cue']} target {target} is not visible at this point of the route")
                        elif cue["action"] == "click":
                            loc.click(timeout=8000)
                        elif cue["action"] == "hover":
                            # a hover is a pointer pass over the element's box; sparse SVG groups may not
                            # own the pixel at their centre, so the actionability check is skipped
                            loc.hover(timeout=8000, force=True)
                        else:
                            problems.append(f"{pid}: cue {cue['cue']} has an unsupported action {cue['action']}")
                    except Exception as exc:  # noqa: BLE001
                        problems.append(f"{pid}: cue {cue['cue']} on {target} failed: {exc}")
                    page.wait_for_timeout(int(cue.get("waitMs") or 600))
                    if pg["kind"] == "scene":
                        observed = page.evaluate("(id) => window.lecture.state(id).state", pid)
                    else:
                        observed = page.evaluate("(id) => { const n = document.querySelector(`[data-page-id=\"${id}\"] [data-state]`); return n ? Number(n.getAttribute('data-state')) : null; }", pid)
                    expect = cue.get("expect")
                    if expect is not None and observed != expect:
                        problems.append(f"{pid}: cue {cue['cue']} expected state {expect} but the deck shows {observed}")
                    verb = "Click" if cue["action"] == "click" else "Hover"
                    seg = {
                        "id": f"{chapter}_{cue['cue']}",
                        "chapter": chapter,
                        "kind": cue.get("kind") or "action",
                        "seconds": cue.get("seconds") or 6,
                        "action": f"{verb} {target.split(':', 1)[1]} on {pg['heading']}",
                        "teaches": cue.get("teaches") or "",
                        "scene": pid,
                        "cue_target": target,
                        "deck_action": cue["action"],
                        "expect_state": observed if expect is None else expect,
                    }
                    if seg["kind"] == "static":
                        seg["reason"] = cue.get("reason") or ""
                        if not seg["reason"]:
                            problems.append(f"{pid}: static cue {cue['cue']} has no written reason")
                    segments.append(seg)
            browser.close()
    finally:
        server.shutdown()
    shot_list = {
        "_comment": (f"Recording cue list of week {week:02d}, derived from the deck's own cue declarations by "
                     "scripts/build_cues.py (plan/22_recording_track.txt). One segment per pointer action in lecture "
                     "order; kind action | process | static; seconds are planning estimates; no spoken text. "
                     "Extra fields: scene, cue_target (data-cue-target in the deck), deck_action, expect_state "
                     "(data-state after the action in record=1 mode)."),
        "week": week,
        "deck": f"site/weeks/week-{week:02d}.html",
        "route_note": "The recall-and-outcomes page is skipped in the recorded route; the opening situation is operated inside the opening window.",
        "fps": 60,
        "segments": segments,
    }
    return shot_list, problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=str(ROOT / "site"))
    ap.add_argument("--week", type=int, required=True)
    ap.add_argument("--out")
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    out = Path(args.out) if args.out else ROOT / "cues" / f"week-{args.week:02d}.json"
    shot_list, problems = derive(Path(args.site).resolve(), args.week)
    total = sum(s["seconds"] for s in shot_list["segments"])
    print(f"{len(shot_list['segments'])} segments, {total // 60}:{total % 60:02d} planned minutes")
    for pr in problems:
        print("PROBLEM", pr)
    if args.check:
        if not out.exists():
            print(f"missing {out}")
            return 1
        current = json.loads(out.read_text(encoding="utf-8"))
        same = current.get("segments") == shot_list["segments"]
        print("OK cue list matches the deck" if same else "STALE cue list differs from the deck")
        return 0 if same and not problems else 1
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(shot_list, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}")
    return 1 if problems else 0


if __name__ == "__main__":
    raise SystemExit(main())
