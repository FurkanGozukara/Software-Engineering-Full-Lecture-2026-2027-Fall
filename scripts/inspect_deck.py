"""Author-side inspection helper: open a deck in headless Chromium, report console errors,
step through every scene and condition, and save screenshots for a native read.

  python scripts/inspect_deck.py --week 1 --out <folder>            every scene, baseline states + last state of each condition
  python scripts/inspect_deck.py --week 1 --scene two-confirmations --states 0,2,4 --out <folder>
  python scripts/inspect_deck.py --week 1 --print --out <folder>      screenshot of the print view (long page)

Screenshots are taken at 1920x1080 logical pixels with device scale factor 2, the capture scale
of the recording rule, so a 1:1 read shows what the camera will show. Nothing here changes the site.
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


def serve(root: Path):
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    handler.log_message = lambda *a, **k: None  # type: ignore[attr-defined]
    server = socketserver.ThreadingTCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{port}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=str(ROOT / "site"))
    ap.add_argument("--week", type=int, required=True)
    ap.add_argument("--scene", action="append")
    ap.add_argument("--states", help="comma-separated state indexes to capture (default: 0 and last of each condition)")
    ap.add_argument("--condition", help="only this condition id")
    ap.add_argument("--print", dest="print_view", action="store_true")
    ap.add_argument("--out", required=True)
    ap.add_argument("--scale", type=float, default=2.0)
    ap.add_argument("--query", default="record=1")
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    from playwright.sync_api import sync_playwright
    server, base = serve(Path(args.site).resolve())
    errors: list[str] = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=args.scale)
            page = ctx.new_page()
            page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
            page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            page.on("requestfailed", lambda r: errors.append(f"requestfailed: {r.url}"))
            week = f"week-{args.week:02d}"
            if args.print_view:
                page.goto(f"{base}/weeks/{week}.html?print=1")
                page.wait_for_selector('html[data-print-ready="true"]', timeout=60000)
                page.screenshot(path=str(out / f"{week}-print.png"), full_page=True)
                n = page.locator("[data-print-panel]").count()
                sheets = page.locator(".print-page").count()
                print(f"print view: {n} print panels, {sheets} sheets")
            else:
                page.goto(f"{base}/weeks/{week}.html?{args.query}")
                page.wait_for_selector("body[data-page-count]")
                pages = page.evaluate("() => window.lecture.pages()")
                targets = [pg for pg in pages if not args.scene or pg["id"] in args.scene]
                for pg in targets:
                    page.evaluate("(id) => window.lecture.gotoScene(id)", pg["id"])
                    page.wait_for_timeout(150)
                    if pg["kind"] != "scene":
                        page.screenshot(path=str(out / f"{week}-{pg['id']}.png"))
                        print(f"{pg['id']}: page captured")
                        continue
                    conds = page.evaluate("(id) => Array.from(document.querySelectorAll(`[data-scene=\"${id}\"] [data-control=condition]`)).map(b => b.getAttribute('data-condition-id'))", pg["id"])
                    for cond in conds:
                        if args.condition and cond != args.condition:
                            continue
                        page.evaluate("(c) => window.lecture.setCondition(c)", cond)
                        page.wait_for_timeout(120)
                        st = page.evaluate("(id) => window.lecture.state(id)", pg["id"])
                        wanted = [int(x) for x in args.states.split(",")] if args.states else sorted({0, st["count"] - 1})
                        for k in range(st["count"]):
                            if k > 0:
                                page.evaluate("() => window.lecture.step()")
                                page.wait_for_timeout(120)
                            if k in wanted:
                                page.wait_for_timeout(900)
                                page.screenshot(path=str(out / f"{week}-{pg['id']}-{cond}-s{k}.png"))
                        print(f"{pg['id']} [{cond}]: {st['count']} states captured {wanted}")
            browser.close()
    except Exception as exc:  # report what the page said before the failure
        print("FAILED:", exc)
        for e in errors:
            print("  ", e)
        raise
    finally:
        server.shutdown()
    if errors:
        print("ERRORS / WARNINGS:")
        for e in errors:
            print("  ", e)
    else:
        print("no console errors, page errors or failed requests")
    (out / "errors.json").write_text(json.dumps(errors, indent=1), encoding="utf-8")
    return 1 if any(e.startswith("pageerror") for e in errors) else 0


if __name__ == "__main__":
    raise SystemExit(main())
