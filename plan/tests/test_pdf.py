"""Student PDF checks: one PDF per week under <site>/pdf/, exported from the print view.

Derived from the PDF paragraphs of 21_instructor_preflight.txt. Skipped until the PDFs exist.
"""
from __future__ import annotations

import pytest

pytestmark = pytest.mark.pdf


@pytest.fixture(scope="session")
def pdf_dir(site_root):
    d = site_root / "pdf"
    if not d.is_dir():
        pytest.skip("no pdf/ folder in the site")
    return d


def week_ids(manifest, n):
    return [s["id"] for w in manifest["weeks"] if w["number"] == n for s in w["scenes"]]


@pytest.mark.parametrize("week", range(1, 15))
def test_week_pdf_exists_and_reads(pdf_dir, manifest, week):
    try:
        from pypdf import PdfReader
    except ImportError:
        pytest.skip("pypdf is not installed")
    path = pdf_dir / f"week-{week:02d}.pdf"
    assert path.exists(), f"missing {path.name}"
    reader = PdfReader(str(path))
    pages = [p.extract_text() or "" for p in reader.pages]
    assert 8 <= len(pages) <= 48, f"{len(pages)} pages is outside the plan's range"
    empty = [i + 1 for i, t in enumerate(pages) if len(t.strip()) < 20]
    assert not empty, f"pages with almost no selectable text (blank canvas export?): {empty}"
    text = "\n".join(pages)
    missing = [sid for sid in week_ids(manifest, week) if sid not in text]
    assert not missing, f"scene identifiers not printed: {missing}"
    assert f"week-{week:02d}" in text.lower() or f"week {week}" in text.lower()
