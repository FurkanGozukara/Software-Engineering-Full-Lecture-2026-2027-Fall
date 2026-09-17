"""Screen the student-facing text of a deck with the workspace narration style checker.

  python scripts/check_deck_text.py --week 1
  python scripts/check_deck_text.py --week 1 --dump <file.txt>     also write the collected sentences

The deck text follows the same wording rules as the narration (22_recording_track.txt: the style
checker is run on the deck strings as well). This script opens the deck with instant states,
walks every page, every condition and every state, collects the visible text of the scene root or
page, adds the hidden answers of the checks page, then opens the print view (?print=1) and adds
the text that only the PDF carries (cover, panel captions and notes), and runs
prodlib.narration_style from the tutorial workspace on the result.

The checker flags defensive shapes (hedges, disclaimers, guarantees, arguing about proof), never
single technical words, so state names and course vocabulary pass as they are.
"""
from __future__ import annotations

import argparse
import http.server
import re
import socket
import socketserver
import sys
import threading
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # noqa: BLE001
    pass
WORKSPACE_TOOLS = Path("F:/0_tutorial_videos_project/tools")


def serve(root: Path):
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    handler.log_message = lambda *a, **k: None  # type: ignore[attr-defined]
    server = socketserver.ThreadingTCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{port}"


def collect(site: Path, week: int) -> list[str]:
    from playwright.sync_api import sync_playwright
    lines: list[str] = []
    seen: set[str] = set()

    def add(text: str):
        for raw in text.split("\n"):
            t = " ".join(raw.split())
            if len(t) > 1 and t not in seen:
                seen.add(t)
                lines.append(t)

    server, base = serve(site)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1920, "height": 1080})
            page.goto(f"{base}/weeks/week-{week:02d}.html?record=1&motion=off")
            page.wait_for_selector("body[data-page-count]")
            for pg in page.evaluate("() => window.lecture.pages()"):
                pid = pg["id"]
                page.evaluate("(id) => window.lecture.gotoScene(id)", pid)
                page.wait_for_timeout(60)
                if pg["kind"] != "scene":
                    add(page.locator(f'[data-page-id="{pid}"]').inner_text())
                    add(page.evaluate("(id) => Array.from(document.querySelectorAll(`[data-page-id=\"${id}\"] .qa-a`)).map(n => n.textContent).join('\\n')", pid))
                    continue
                conds = page.evaluate("(id) => Array.from(document.querySelectorAll(`[data-scene=\"${id}\"] [data-control=condition]`)).map(b => b.getAttribute('data-condition-id'))", pid)
                for cond in conds:
                    page.evaluate("(c) => window.lecture.setCondition(c)", cond)
                    count = page.evaluate("(id) => window.lecture.state(id).count", pid)
                    for k in range(count):
                        if k:
                            page.evaluate("() => window.lecture.step()")
                        page.wait_for_timeout(30)
                        add(page.locator(f'[data-scene="{pid}"]').inner_text())
            # the print view: text that only the student PDF carries
            page.goto(f"{base}/weeks/week-{week:02d}.html?print=1")
            page.wait_for_selector('html[data-print-ready="true"]', timeout=60000)
            add(page.evaluate("() => document.body.innerText"))
            browser.close()
    finally:
        server.shutdown()
    return lines


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=str(ROOT / "site"))
    ap.add_argument("--week", type=int, required=True)
    ap.add_argument("--dump")
    ap.add_argument("--max-share", type=float, default=None)
    args = ap.parse_args()
    if not WORKSPACE_TOOLS.exists():
        print(f"workspace tools not found at {WORKSPACE_TOOLS}; cannot run the style checker")
        return 2
    sys.path.insert(0, str(WORKSPACE_TOOLS))
    from prodlib import narration_style  # type: ignore

    lines = collect(Path(args.site).resolve(), args.week)
    text = "\n".join(lines)
    if args.dump:
        Path(args.dump).write_text("\n".join(lines), encoding="utf-8")
    report = narration_style.check_text(text, f"week-{args.week:02d} deck text ({len(lines)} distinct lines)")
    max_share = args.max_share if args.max_share is not None else narration_style.DEFAULT_MAX_SHARE
    print(narration_style.format_report(report, max_share, 60))
    failed = report["share"] > max_share or report["proof_or_evidence"] or report.get("public_content_violations")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
