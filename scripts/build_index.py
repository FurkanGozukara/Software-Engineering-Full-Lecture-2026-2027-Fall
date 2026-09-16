"""Generate site/index.html from plan/plan_manifest.json and the files present in site/.

  python scripts/build_index.py
  python scripts/build_index.py --check      exit 1 when index.html is stale

The index lists every week with its number, central question, concise scope (the scene
headings from the manifest), and links to the deck and the student PDF. A week whose deck
file is missing or holds only some of its eight scenes is marked as in preparation; a PDF
link appears only when site/pdf/week-NN.pdf exists.
"""
from __future__ import annotations

import argparse
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "plan" / "plan_manifest.json"
SITE = ROOT / "site"
OUT = SITE / "index.html"


def scenes_present(week_html: Path, ids: list[str]) -> list[str]:
    if not week_html.exists():
        return []
    text = week_html.read_text(encoding="utf-8")
    js = week_html.with_suffix(".js")
    if js.exists():
        text += js.read_text(encoding="utf-8")
    return [sid for sid in ids if re.search(rf"['\"]{re.escape(sid)}['\"]", text)]


def render() -> str:
    m = json.loads(MANIFEST.read_text(encoding="utf-8"))
    rows = []
    for w in m["weeks"]:
        n = w["number"]
        deck = SITE / "weeks" / f"week-{n:02d}.html"
        pdf = SITE / "pdf" / f"week-{n:02d}.pdf"
        ids = [s["id"] for s in w["scenes"]]
        present = scenes_present(deck, ids)
        complete = len(present) == len(ids)
        title = html.escape(w["title"].title().replace("And", "and").replace("Of", "of").replace("The", "the").replace("Through", "through"))
        scope = " ".join(f"<span>{i + 1}. {html.escape(s['instructor_title'])}</span>" for i, s in enumerate(w["scenes"]))
        if complete:
            deck_link = f'<a class="btn btn--primary" href="weeks/week-{n:02d}.html#/{ids[0]}">Open the lecture</a>'
            status = '<span class="status">Deck complete · 8 scenes</span>'
        elif present:
            deck_link = f'<a class="btn" href="weeks/week-{n:02d}.html#/{present[0]}">Open the shell-test scene</a>'
            status = f'<span class="status status--partial">In preparation · {len(present)} of 8 scenes ({", ".join(present)})</span>'
        else:
            deck_link = '<span class="btn is-disabled" aria-disabled="true">Deck in preparation</span>'
            status = '<span class="status">Authored in a later phase</span>'
        pdf_link = (f'<a class="btn" href="pdf/week-{n:02d}.pdf">Student PDF</a>' if pdf.exists()
                    else '<span class="btn is-disabled" aria-disabled="true">PDF not yet exported</span>')
        rows.append(f"""
      <li class="week{' is-ready' if complete else ''}">
        <div class="num"><small>Week</small>{n:02d}</div>
        <div>
          <h2>{title}</h2>
          <p class="question">{html.escape(w['question'])}</p>
          <p class="scope">{scope}</p>
        </div>
        <div class="links">{deck_link}{pdf_link}{status}</div>
      </li>""")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Software Engineering · 14 lectures around Campus Rooms</title>
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="shared/index.css">
</head>
<body>
<div class="wrap">
  <header class="hero">
    <div class="eyebrow">Software Engineering · lecture site</div>
    <h1>Fourteen questions about one room-booking service</h1>
    <p>Every lecture follows the same rhythm: a situation you can picture, a prediction, the mechanism revealed step by step, one changed condition, a comparison, and the principle that explains the difference. The recurring example is Campus Rooms, a fictional service that reserves campus rooms.</p>
    <p>Each week is one interactive deck and one printable PDF. Open a deck at any scene through its link, such as <code>weeks/week-01.html#/two-confirmations</code>.</p>
  </header>
  <section class="how" aria-label="How to use the decks">
    <div><b>Pages and steps are different controls.</b> Right and Left arrows change the page. Down and Up arrows step the demonstration on the page; Step never changes the page.</div>
    <div><b>Replay and Reset are different.</b> Replay restarts the selected condition. Reset returns to the baseline condition and the first step. Reopening a scene always starts at its baseline, paused.</div>
    <div><b>Works without a network.</b> Start the site with <code>python scripts/serve.py --root site</code> and open <code>http://127.0.0.1:8000/</code>. The PDFs open directly.</div>
  </section>
  <ol class="weeks" aria-label="Weeks">{''.join(rows)}
  </ol>
  <footer>
    <p>Dark theme on screen; the PDFs use a light print layout. Keyboard help inside a deck: press <code>?</code>. All names, numbers and incidents are authored teaching examples unless a source is named on the page.</p>
  </footer>
</div>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    text = render()
    if args.check:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print("STALE site/index.html: run python scripts/build_index.py")
            return 1
        print("OK site/index.html is current")
        return 0
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
