"""Shared fixtures for the plan checker, the deck contract tests and the PDF checks.

Deck and PDF tests need a built course site. Point at it with the environment variable
SE_COURSE_SITE or the option --site; otherwise those tests are skipped and only the plan
checks run. The site is served from a local HTTP server on a free port, and every request
that leaves localhost is aborted, so a deck that depends on the network fails here.
"""
from __future__ import annotations

import http.server
import json
import os
import socket
import socketserver
import threading
from functools import partial
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(scope="session")
def manifest() -> dict:
    path = ROOT / "plan_manifest.json"
    if not path.exists():
        from plan_lib import build_manifest  # tools/ is on pythonpath via pytest.ini
        return build_manifest()
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def fixtures() -> dict:
    return json.loads((ROOT / "assets" / "demo-fixtures.json").read_text(encoding="utf-8-sig"))


@pytest.fixture(scope="session")
def site_root(request) -> Path:
    site = request.config.getoption("--site")
    if not site:
        pytest.skip("no built site: set SE_COURSE_SITE or pass --site")
    path = Path(site).resolve()
    if not (path / "weeks").is_dir():
        pytest.skip(f"{path} has no weeks/ folder")
    return path


class _Quiet(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".mjs": "text/javascript", ".js": "text/javascript", ".json": "application/json",
                      ".svg": "image/svg+xml", ".woff2": "font/woff2"}

    def log_message(self, *args):  # silence
        pass


@pytest.fixture(scope="session")
def base_url(site_root: Path) -> str:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    handler = partial(_Quiet, directory=str(site_root))
    server = socketserver.ThreadingTCPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{port}"
    server.shutdown()


@pytest.fixture(scope="session")
def browser():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        pytest.skip("playwright is not installed")
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture
def page(browser, base_url):
    """A page at 1920x1080 logical pixels with device scale factor 2 (the capture scale) and
    no network beyond the local server. Failed or external requests are collected on
    page.failed_requests for the offline test."""
    context = browser.new_context(viewport={"width": 1920, "height": 1080}, device_scale_factor=2)
    pg = context.new_page()
    pg.failed_requests = []
    pg.external_requests = []

    def route(r):
        url = r.request.url
        if url.startswith(base_url) or url.startswith("data:") or url.startswith("blob:"):
            r.continue_()
        else:
            pg.external_requests.append(url)
            r.abort()

    pg.route("**/*", route)
    pg.on("requestfailed", lambda req: pg.failed_requests.append(req.url))
    yield pg
    context.close()


def scene_params(manifest: dict, role: str | None = None):
    for w in manifest["weeks"]:
        for s in w["scenes"]:
            if role is None or s["role"] == role:
                yield pytest.param((w["number"], s["id"]), id=f"w{w['number']:02d}-{s['id']}")


def pytest_generate_tests(metafunc):
    if "scene" in metafunc.fixturenames:
        path = ROOT / "plan_manifest.json"
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
        else:
            from plan_lib import build_manifest
            data = build_manifest()
        role = "Anchor" if "anchor_only" in metafunc.fixturenames else None
        metafunc.parametrize("scene", list(scene_params(data, role)))
