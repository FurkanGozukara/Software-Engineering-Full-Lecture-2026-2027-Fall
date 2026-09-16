"""Export student PDFs from each deck's print view.

  python scripts/export_pdf.py --site site --week 1
  python scripts/export_pdf.py --site site --all

Opens weeks/week-NN.html?print=1 through a local server, waits for the deck's declared
ready signal html[data-print-ready="true"] (docs/scene-contract.md), and writes
site/pdf/week-NN.pdf. The print states are designed by the deck, not chosen here; this
script only waits for the declared condition and never guesses a delay. Run the PDF tests
afterwards: cd plan && SE_COURSE_SITE=../site pytest -q -m pdf
"""
from __future__ import annotations

import argparse
import http.server
import socket
import socketserver
import threading
from functools import partial
from pathlib import Path


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
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", default="site")
    parser.add_argument("--week", type=int, action="append")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--timeout", type=int, default=60000, help="ms to wait for the print-ready signal")
    args = parser.parse_args()
    weeks = list(range(1, 15)) if args.all else (args.week or [])
    if not weeks:
        parser.error("give --week N (repeatable) or --all")
    from playwright.sync_api import sync_playwright

    site = Path(args.site).resolve()
    out_dir = site / "pdf"
    out_dir.mkdir(exist_ok=True)
    server, base = serve(site)
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=2)
            page.route("**/*", lambda r: r.continue_() if r.request.url.startswith(base) else r.abort())
            for n in weeks:
                url = f"{base}/weeks/week-{n:02d}.html?print=1"
                page.goto(url)
                page.wait_for_selector('html[data-print-ready="true"]', timeout=args.timeout)
                page.emulate_media(media="print")
                target = out_dir / f"week-{n:02d}.pdf"
                page.pdf(path=str(target), format="A4", landscape=True, print_background=True,
                         prefer_css_page_size=True, display_header_footer=False)
                print(f"wrote {target}")
            browser.close()
    finally:
        server.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
