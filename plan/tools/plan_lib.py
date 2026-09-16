"""Parse the plan package. The weekly TXT files are the only source; everything here is derived.

Layout assumptions (checked by tools/check_plan.py):
  week1.txt .. week14.txt   eleven numbered sections, eight scenes (3 Anchors + 5 Bridges)
  18_sources.txt            register entries "Sxx | TITLE" with a URL and a "Use:" line
  19_recurring_case_and_demo_data.txt   rules "R-0x — ..."
  00_START_HERE.txt         the fourteen-row spine "NN | Title | Central question"
  assets/demo-fixtures.json the numerical and structural teaching truth
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEEK_NUMBERS = range(1, 15)
SECTION_TITLES = [
    "PURPOSE, CASE STATE, AND SCOPE",
    "OBSERVABLE LEARNING OUTCOMES",
    "INSTRUCTOR PREPARATION AND ENTRY CHECK",
    "ORDERED CHAPTER AND PAGE MAP",
    "DETAILED SCENE TEACHING NOTES",
    "TEACHING GUARDRAILS",
    "MISCONCEPTION AND DIAGNOSIS CLINIC",
    "IN-LECTURE CHECKS WITH ANSWERS",
    "PDF CONTINUITY AND LECTURE ELASTICITY",
    "HANDOFF",
    "SOURCES AND CURRENCY NOTES",
]
SCENE_PARTS = [
    ("visual_idea", "VISUAL IDEA"),
    ("situation", "SITUATION, PREDICTION, AND MECHANISM"),
    ("changed_condition", "CHANGE ONE CONDITION AND COMPARE"),
    ("principle", "PRINCIPLE TO REVEAL"),
    ("pdf_treatment", "STUDENT PDF TREATMENT"),
]
SUPPORT_FILES = [
    "00_START_HERE.txt",
    "15_curriculum_currency_and_coverage.txt",
    "16_reference_plan_analysis.txt",
    "17_visual_lecture_and_pdf_brief.txt",
    "18_sources.txt",
    "19_recurring_case_and_demo_data.txt",
    "20_agent_authoring_brief.txt",
    "21_instructor_preflight.txt",
    "22_recording_track.txt",
    "23_build_plan_and_schedule.txt",
]
CITE_BLOCK = re.compile(r"\[(S\d\d[^\]]*)\]")
KEY = re.compile(r"S\d\d")


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")


def week_path(n: int) -> Path:
    return ROOT / f"week{n}.txt"


def parse_citations(text: str) -> set[str]:
    """[S01, S02] and [S26–S32, S38] forms; only S-keys count."""
    keys: set[str] = set()
    for block in CITE_BLOCK.findall(text):
        for part in block.split(","):
            part = part.strip()
            rng = re.match(r"^S(\d\d)\s*[–-]\s*S?(\d\d)$", part)
            if rng:
                a, b = int(rng.group(1)), int(rng.group(2))
                keys |= {f"S{i:02d}" for i in range(a, b + 1)}
            elif KEY.fullmatch(part):
                keys.add(part)
    return keys


def parse_rules(text: str) -> set[str]:
    return set(re.findall(r"\bR-0\d\b", text))


def parse_week(n: int) -> dict:
    text = read(week_path(n))
    lines = text.split("\n")
    problems: list[str] = []
    head = re.match(r"^WEEK (\d\d) \| (.+)$", lines[0])
    if not head or int(head.group(1)) != n:
        problems.append("first line is not 'WEEK NN | TITLE' for this week")
    title = head.group(2).strip() if head else ""
    question = lines[4].strip() if len(lines) > 4 else ""
    banner = lines[6].strip() if len(lines) > 6 else ""
    html = ""
    m = re.search(r"planned HTML: (weeks/week-\d\d\.html)", banner)
    if m:
        html = m.group(1)

    # numbered sections: "N. TITLE" followed by a dash line
    section_starts = []
    for i, line in enumerate(lines[:-1]):
        m = re.match(r"^(\d{1,2})\. ([A-Z][A-Z ,/’'\-]+)$", line)
        if m and not line.startswith("0") and set(lines[i + 1]) == {"-"}:
            section_starts.append((int(m.group(1)), m.group(2).strip(), i))
    sections: dict[int, str] = {}
    for idx, (num, stitle, start) in enumerate(section_starts):
        end = section_starts[idx + 1][2] if idx + 1 < len(section_starts) else len(lines)
        sections[num] = "\n".join(lines[start + 2:end]).strip()
    section_titles = [t for _, t, _ in section_starts]

    # chapter map (section 4)
    map_text = sections.get(4, "")
    chapter = []
    for m in re.finditer(r"^(\d\d) \| (.+?) \| (Anchor|Bridge)\s*\n\n(week-(\d\d)\.html#/([a-z0-9-]+))\s*$", map_text, re.M):
        chapter.append({
            "order": int(m.group(1)), "title": m.group(2).strip(), "role": m.group(3),
            "link": m.group(4), "link_week": int(m.group(5)), "id": m.group(6),
        })

    # scene notes (section 5)
    notes_text = sections.get(5, "")
    scene_heads = [(m.start(), int(m.group(1)), m.group(2).strip())
                   for m in re.finditer(r"^(0\d)\. (.+)$", notes_text, re.M)
                   if set(notes_text.split("\n")[notes_text[:m.start()].count("\n") + 1] or "x") == {"-"}]
    scenes = []
    for idx, (pos, order, stitle) in enumerate(scene_heads):
        end = scene_heads[idx + 1][0] if idx + 1 < len(scene_heads) else len(notes_text)
        block = notes_text[pos:end]
        role_id = re.search(r"^(Anchor|Bridge) scene \| ID: ([a-z0-9-]+)", block, re.M)
        scene = {"order": order, "title": stitle,
                 "role": role_id.group(1) if role_id else None,
                 "id": role_id.group(2) if role_id else None,
                 "sources": sorted(parse_citations(block)), "rules": sorted(parse_rules(block))}
        for key, label in SCENE_PARTS:
            pm = re.search(rf"^{re.escape(label)}: (.+)$", block, re.M)
            scene[key] = pm.group(1).strip() if pm else None
        scenes.append(scene)

    outcomes = re.findall(r"^\d\. (.+)$", sections.get(2, ""), re.M)
    checks = [{"question": q.strip(), "answer": a.strip()} for q, a in
              re.findall(r"^QUESTION \d+: (.+)\n\nANSWER: (.+)$", sections.get(8, ""), re.M)]
    body = "\n".join(sections[k] for k in sorted(sections) if k != 11)
    listed = set()
    lm = re.search(r"Primary references: ([^.\n]+)", sections.get(11, ""))
    if lm:
        listed = set(KEY.findall(lm.group(1)))
    return {
        "number": n, "title": title, "question": question, "banner": banner, "html": html,
        "section_titles": section_titles, "chapter": chapter, "scenes": scenes,
        "outcomes": outcomes, "checks": checks,
        "sources_cited": sorted(parse_citations(body)), "sources_listed": sorted(listed),
        "rules_cited": sorted(parse_rules(text)), "handoff": sections.get(10, ""),
        "problems": problems,
    }


def parse_register(path: Path | None = None) -> dict[str, dict]:
    text = read(path or ROOT / "18_sources.txt")
    entries: dict[str, dict] = {}
    heads = [(m.start(), m.group(1), m.group(2).strip()) for m in re.finditer(r"^(S\d\d) \| (.+)$", text, re.M)]
    for idx, (pos, key, title) in enumerate(heads):
        end = heads[idx + 1][0] if idx + 1 < len(heads) else len(text)
        block = text[pos:end]
        url = re.search(r"^https?://\S+$", block, re.M)
        use = re.search(r"^Use: (curriculum|authoring)\b", block, re.M)
        entries[key] = {"title": title, "url": url.group(0) if url else None,
                        "use": use.group(1) if use else None}
    return entries


def parse_case_rules(path: Path | None = None) -> set[str]:
    text = read(path or ROOT / "19_recurring_case_and_demo_data.txt")
    return set(re.findall(r"^(R-0\d) — ", text, re.M))


def parse_spine(path: Path | None = None) -> list[dict]:
    text = read(path or ROOT / "00_START_HERE.txt")
    return [{"number": int(m.group(1)), "title": m.group(2).strip(), "question": m.group(3).strip()}
            for m in re.finditer(r"^(\d\d) \| (.+?) \| (.+\?)\s*$", text, re.M)]


def load_fixtures(path: Path | None = None) -> dict:
    return json.loads(read(path or ROOT / "assets" / "demo-fixtures.json"))


def fixture_key(week: int, scene_id: str) -> str:
    return f"w{week:02d}/{scene_id}"


def build_manifest() -> dict:
    weeks = []
    for n in WEEK_NUMBERS:
        w = parse_week(n)
        scenes = []
        by_id = {s["id"]: s for s in w["scenes"]}
        for entry in w["chapter"]:
            note = by_id.get(entry["id"], {})
            scenes.append({
                "order": entry["order"], "id": entry["id"], "role": entry["role"],
                "instructor_title": entry["title"], "link": entry["link"],
                "fixture_key": fixture_key(n, entry["id"]),
                "visual_idea": note.get("visual_idea"), "situation": note.get("situation"),
                "changed_condition": note.get("changed_condition"), "principle": note.get("principle"),
                "pdf_treatment": note.get("pdf_treatment"),
                "rules": note.get("rules", []), "sources": note.get("sources", []),
            })
        weeks.append({
            "number": n, "title": w["title"], "question": w["question"], "html": w["html"],
            "source_file": week_path(n).name, "outcomes": w["outcomes"], "checks": w["checks"],
            "sources_cited": w["sources_cited"], "rules_cited": w["rules_cited"],
            "scenes": scenes,
        })
    return {
        "kind": "Derived scene manifest. Do not edit; regenerate with tools/build_manifest.py from the weekly TXT files.",
        "source_files": [week_path(n).name for n in WEEK_NUMBERS],
        "weeks": weeks,
    }


def manifest_text(manifest: dict) -> str:
    return json.dumps(manifest, indent=1, ensure_ascii=False) + "\n"
