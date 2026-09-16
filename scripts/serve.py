"""Serve the student site locally. This is the supported offline route; no network is needed.

  python scripts/serve.py --root site --port 8000
"""
from __future__ import annotations

import argparse
import http.server
import socketserver
from functools import partial
from pathlib import Path


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".mjs": "text/javascript", ".js": "text/javascript", ".json": "application/json",
                      ".svg": "image/svg+xml", ".woff2": "font/woff2", ".pdf": "application/pdf"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--root", default="site")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    root = Path(args.root).resolve()
    if not (root / "index.html").exists():
        print(f"warning: {root} has no index.html yet")
    with socketserver.ThreadingTCPServer(("127.0.0.1", args.port), partial(Handler, directory=str(root))) as httpd:
        print(f"serving {root} at http://127.0.0.1:{args.port}/  (Ctrl+C stops)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
