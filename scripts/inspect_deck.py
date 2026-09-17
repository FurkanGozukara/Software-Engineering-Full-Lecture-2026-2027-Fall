"""Author-side inspection helper: open a deck in headless Chromium, report console errors,
step through every scene and condition, and save screenshots for a native read.

  python scripts/inspect_deck.py --week 1 --out <folder>            every scene, baseline states + last state of each condition
  python scripts/inspect_deck.py --week 1 --scene two-confirmations --states 0,2,4 --out <folder>
  python scripts/inspect_deck.py --week 1 --print --out <folder>      screenshot of the print view (long page)
  python scripts/inspect_deck.py --layout --week 1 --out <folder>     layout scan of every state (report + exit code)
  python scripts/inspect_deck.py --layout --week 1 --shots --out <folder>   ... and one 3840x2160 capture per state

Screenshots are taken at 1920x1080 logical pixels with device scale factor 2, the 3840x2160 frame
of the recording, so a 1:1 read shows what the camera will show. Nothing here changes the site.

The layout scan walks every page, every condition and every state in record=1&motion=off mode,
and on pages that are not scenes presses each of the page's own buttons once, in document order.
In each state it reports
  overlap   two text boxes from different text blocks intersecting (lines of one block are ignored)
  icon      text drawn over a person figure it does not belong to
  shape     diagram text drawn over another node's box
  overflow  text below the content area (the scene stage or the page body) or beyond its sides
  escape    text that runs out of the card, callout or status box that contains it
Print panels render the same stage at its design size, so text that overflows the stage in a state
is text that a print panel of that state would cut. Findings are written to layout.json; the exit
code is 1 when anything is found.
"""
from __future__ import annotations

import argparse
import http.server
import json
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

SCAN_JS = r"""
(pid) => {
  const section = document.querySelector(`section[data-page-id="${pid}"]`);
  const limitEl = section.querySelector('.scene-stage-wrap') || section.querySelector('.page-body');
  const limit = limitEl.getBoundingClientRect();
  const cs = getComputedStyle(section);
  const area = { x0: section.getBoundingClientRect().left + parseFloat(cs.paddingLeft) - 2,
                 x1: section.getBoundingClientRect().right - parseFloat(cs.paddingRight) + 2,
                 y1: limit.bottom + 2 };
  const shown = (n) => {
    for (let e = n; e && e.nodeType === 1; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
    }
    return true;
  };
  const blockOf = (e) => {
    const t = e.closest('text');
    if (t) return t;
    for (let b = e; b && b !== section; b = b.parentElement) {
      const d = getComputedStyle(b).display;
      if (!d.startsWith('inline') && d !== 'contents') return b;
    }
    return section;
  };
  // what an ancestor with overflow other than visible cuts away is not on screen
  const clipOf = (e) => {
    let c = { x0: -1e9, y0: -1e9, x1: 1e9, y1: 1e9 };
    for (let a = e; a && a !== document.body; a = a.parentElement) {
      if (a instanceof SVGElement && a.tagName !== 'svg') continue;
      const s = getComputedStyle(a);
      if (s.overflowX !== 'visible' || s.overflowY !== 'visible') {
        const r = a.getBoundingClientRect();
        c = { x0: Math.max(c.x0, r.left), y0: Math.max(c.y0, r.top), x1: Math.min(c.x1, r.right), y1: Math.min(c.y1, r.bottom) };
      }
    }
    return c;
  };
  const texts = [];
  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
  for (let t; (t = walker.nextNode());) {
    if (!t.textContent.trim()) continue;
    const e = t.parentElement;
    if (!e || e.closest('.page-foot') || !shown(e)) continue;
    const clip = clipOf(e);
    const range = document.createRange(); range.selectNodeContents(t);
    const rects = Array.from(range.getClientRects())
      .map((r) => ({ x0: Math.max(r.left, clip.x0), y0: Math.max(r.top, clip.y0), x1: Math.min(r.right, clip.x1), y1: Math.min(r.bottom, clip.y1) }))
      .filter((r) => r.x1 - r.x0 >= 2 && r.y1 - r.y0 >= 2);
    if (!rects.length) continue;
    texts.push({ label: t.textContent.trim().replace(/\s+/g, ' ').slice(0, 60), el: e, block: blockOf(e),
                 person: e.closest('.n-person'), node: e.closest('.n-box, .n-ext, .n-store'),
                 box: e.closest('.rail-card, .card, .principle-card, .qa-item, .callout, .status'), rects });
  }
  const hit = (a, b, pad) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > pad && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > pad;
  // two lines of text collide when they share more than a sliver of height: stacked lines of one label only touch
  const collide = (a, b) => {
    const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
    const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return w > 3 && h > Math.max(3, 0.3 * Math.min(a.y1 - a.y0, b.y1 - b.y0));
  };
  const out = { overlap: [], icon: [], shape: [], overflow: [], escape: [] };
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const A = texts[i], B = texts[j];
      if (A.block === B.block || A.block.contains(B.block) || B.block.contains(A.block)) continue;
      if (A.node && A.node === B.node) continue;
      if (A.rects.some((ra) => B.rects.some((rb) => collide(ra, rb)))) out.overlap.push(`${A.label} <> ${B.label}`);
    }
  }
  // text of one diagram node drawn over another node's box
  const nodes = Array.from(section.querySelectorAll('.n-box, .n-ext, .n-store')).filter(shown).map((g) => {
    const shape = g.querySelector('rect, path');
    const r = shape.getBoundingClientRect();
    return { g, box: { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom } };
  });
  for (const T of texts) {
    if (!T.el.closest('svg')) continue;
    for (const N of nodes) if (N.g !== T.node && T.rects.some((r) => hit(r, N.box, 3))) out.shape.push(T.label);
  }
  const figures = Array.from(section.querySelectorAll('.n-person')).filter(shown).map((g) => {
    const parts = Array.from(g.querySelectorAll('circle, path')).map((n) => n.getBoundingClientRect());
    return { g, box: { x0: Math.min(...parts.map((r) => r.left)), y0: Math.min(...parts.map((r) => r.top)),
                       x1: Math.max(...parts.map((r) => r.right)), y1: Math.max(...parts.map((r) => r.bottom)) } };
  });
  for (const T of texts) {
    if (T.el.closest('svg')) {
      for (const F of figures) if (F.g !== T.person && T.rects.some((r) => hit(r, F.box, 3))) out.icon.push(T.label);
    }
    if (T.rects.some((r) => r.y1 > area.y1 || r.x0 < area.x0 || r.x1 > area.x1)) out.overflow.push(T.label);
    if (T.box) {
      const b = T.box.getBoundingClientRect();
      if (T.rects.some((r) => r.y1 > b.bottom + 2 || r.x1 > b.right + 2 || r.x0 < b.left - 2 || r.y0 < b.top - 2)) out.escape.push(T.label);
    }
  }
  for (const k of Object.keys(out)) out[k] = Array.from(new Set(out[k]));
  return out;
}
"""

# A page that is not a scene reveals its content through its own buttons: the next one to press is the
# first shown, enabled button in document order that has not been pressed yet.
NEXT_PAGE_BUTTON_JS = r"""
([pid, pressed]) => {
  const section = document.querySelector(`section[data-page-id="${pid}"]`);
  const shown = (n) => {
    for (let e = n; e && e.nodeType === 1; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) return false;
    }
    return n.getClientRects().length > 0;
  };
  const next = Array.from(section.querySelectorAll('button[data-cue-target]')).find((b) =>
    !pressed.includes(b.getAttribute('data-cue-target')) && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && shown(b));
  return next ? next.getAttribute('data-cue-target') : null;
}
"""


def serve(root: Path):
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(root))
    handler.log_message = lambda *a, **k: None  # type: ignore[attr-defined]
    server = socketserver.ThreadingTCPServer(("127.0.0.1", port), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{port}"


def layout_scan(page, week: str, out: Path, shots: bool) -> list[dict]:
    """Walk every state and collect layout findings; optionally capture each state."""
    findings: list[dict] = []
    if shots:
        (out / "shots").mkdir(parents=True, exist_ok=True)

    def record(pid: str, label: str):
        page.wait_for_timeout(60)
        found = page.evaluate(SCAN_JS, pid)
        if any(found.values()):
            findings.append({"page": pid, "state": label, **{k: v for k, v in found.items() if v}})
        if shots:
            safe = label.replace(" ", "_").replace("/", "-")
            page.screenshot(path=str(out / "shots" / f"{week}-{pid}-{safe}.png"))

    pages = page.evaluate("() => window.lecture.pages()")
    count = 0
    for pg in pages:
        pid = pg["id"]
        page.evaluate("(id) => window.lecture.gotoScene(id)", pid)
        page.wait_for_timeout(120)
        if pg["kind"] != "scene":
            record(pid, "initial"); count += 1
            pressed: list[str] = []
            while True:
                target = page.evaluate(NEXT_PAGE_BUTTON_JS, [pid, pressed])
                if not target:
                    break
                pressed.append(target)
                page.locator(f'[data-cue-target="{target}"]').first.click()
                record(pid, f"after {target.split(':', 1)[1]}"); count += 1
            continue
        conds = page.evaluate("(id) => Array.from(document.querySelectorAll(`[data-scene=\"${id}\"] [data-control=condition]`)).map(b => b.getAttribute('data-condition-id'))", pid)
        for cond in conds:
            page.evaluate("(c) => window.lecture.setCondition(c)", cond)
            n = page.evaluate("(id) => window.lecture.state(id).count", pid)
            for k in range(n):
                if k:
                    page.evaluate("() => window.lecture.step()")
                record(pid, f"{cond} {k + 1} of {n}"); count += 1
    print(f"layout scan: {count} states in {len(pages)} pages, {len(findings)} with findings")
    return findings


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=str(ROOT / "site"))
    ap.add_argument("--week", type=int, required=True)
    ap.add_argument("--scene", action="append")
    ap.add_argument("--states", help="comma-separated state indexes to capture (default: 0 and last of each condition)")
    ap.add_argument("--condition", help="only this condition id")
    ap.add_argument("--print", dest="print_view", action="store_true")
    ap.add_argument("--layout", action="store_true", help="scan every state for overlapping, overflowing or escaping text")
    ap.add_argument("--shots", action="store_true", help="with --layout: save one capture per state")
    ap.add_argument("--out", required=True)
    ap.add_argument("--scale", type=float, default=2.0)
    ap.add_argument("--query", default="record=1")
    args = ap.parse_args()
    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    from playwright.sync_api import sync_playwright
    server, base = serve(Path(args.site).resolve())
    errors: list[str] = []
    findings: list[dict] = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            ctx = browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=args.scale)
            page = ctx.new_page()
            page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
            page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            page.on("requestfailed", lambda r: errors.append(f"requestfailed: {r.url}"))
            week = f"week-{args.week:02d}"
            if args.layout:
                page.goto(f"{base}/weeks/{week}.html?record=1&motion=off")
                page.wait_for_selector("body[data-page-count]")
                findings = layout_scan(page, week, out, args.shots)
                (out / "layout.json").write_text(json.dumps(findings, indent=1, ensure_ascii=False), encoding="utf-8")
                for f in findings:
                    print(f"  {f['page']} [{f['state']}]: " + "; ".join(f"{k}: {v}" for k, v in f.items() if k not in ("page", "state")))
            elif args.print_view:
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
    if any(e.startswith("pageerror") for e in errors):
        return 1
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
