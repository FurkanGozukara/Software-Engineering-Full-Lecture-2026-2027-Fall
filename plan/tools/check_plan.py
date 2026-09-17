"""Consistency checker for the Software Engineering plan package.

  python tools/check_plan.py            report and exit 1 on any failure
  python tools/check_plan.py --json out.json

Checks, all derived from the TXT files and assets/demo-fixtures.json:
  structure   14 weeks, banner line, eleven sections in order, 8 scenes = 3 Anchors + 5 Bridges,
              unique IDs, chapter map order/role/ID equal to the scene notes, five labeled parts
  links       every hash link names its own week and its scene ID
  sources     every cited S-key exists; Section 11 equals the body's citations; register entries
              carry a Use line; curriculum sources are cited by a week, authoring sources by a
              support file
  rules       every R-key exists in the case file
  spine       the fourteen-row spine in 00_START_HERE.txt matches the week titles and questions
  fixtures    recomputed queue, delivery, latency, SLO (with burn rate), resource, interval, duration, retry and
              snippet results equal the recorded values; every Anchor has a fixture entry;
              every value a fixture says the week text shows is present in that week
  manifest    plan_manifest.json on disk is current
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import models  # noqa: E402
from plan_lib import (ROOT, SECTION_TITLES, SUPPORT_FILES, WEEK_NUMBERS, build_manifest,  # noqa: E402
                      load_fixtures, manifest_text, parse_case_rules, parse_citations,
                      parse_register, parse_spine, parse_week, read)


class Report:
    def __init__(self):
        self.problems: list[str] = []
        self.notes: list[str] = []

    def fail(self, where: str, what: str):
        self.problems.append(f"{where}: {what}")

    def ok(self, what: str):
        self.notes.append(what)


def check_weeks(rep: Report) -> list[dict]:
    weeks = []
    for n in WEEK_NUMBERS:
        where = f"week{n}.txt"
        w = parse_week(n)
        weeks.append(w)
        for p in w["problems"]:
            rep.fail(where, p)
        expected_banner = (f"Instructor lecture plan | approximately 80 minutes | 8 scenes: 3 Anchors + 5 Bridges"
                           f" | planned HTML: weeks/week-{n:02d}.html")
        if w["banner"] != expected_banner:
            rep.fail(where, f"banner line differs from '{expected_banner}'")
        if not w["question"].endswith("?"):
            rep.fail(where, "line 5 must be the central question ending with '?'")
        if w["section_titles"] != SECTION_TITLES:
            rep.fail(where, f"sections are {w['section_titles']}")
        ch, sc = w["chapter"], w["scenes"]
        if len(ch) != 8:
            rep.fail(where, f"chapter map has {len(ch)} entries, expected 8")
        if len(sc) != 8:
            rep.fail(where, f"scene notes have {len(sc)} scenes, expected 8")
        roles = [c["role"] for c in ch]
        if roles.count("Anchor") != 3 or roles.count("Bridge") != 5:
            rep.fail(where, f"roles are {roles}")
        ids = [c["id"] for c in ch]
        if len(set(ids)) != len(ids):
            rep.fail(where, f"duplicate scene ids {ids}")
        for c in ch:
            if c["link_week"] != n:
                rep.fail(where, f"scene {c['id']} links to week {c['link_week']}")
        if [(c["order"], c["role"], c["id"]) for c in ch] != [(s["order"], s["role"], s["id"]) for s in sc]:
            rep.fail(where, "chapter map order/role/ID differ from the scene notes")
        for s in sc:
            missing = [label for key, label in
                       (("visual_idea", "VISUAL IDEA"), ("situation", "SITUATION, PREDICTION, AND MECHANISM"),
                        ("changed_condition", "CHANGE ONE CONDITION AND COMPARE"), ("principle", "PRINCIPLE TO REVEAL"),
                        ("pdf_treatment", "STUDENT PDF TREATMENT")) if not s.get(key)]
            if missing:
                rep.fail(where, f"scene {s['id']} lacks {missing}")
        if len(w["outcomes"]) != 5:
            rep.fail(where, f"{len(w['outcomes'])} learning outcomes, expected 5")
        if len(w["checks"]) < 4:
            rep.fail(where, f"{len(w['checks'])} answered checks, expected at least 4")
    return weeks


def check_sources(rep: Report, weeks: list[dict]):
    register = parse_register()
    keys = set(register)
    cited_by_weeks: set[str] = set()
    for w in weeks:
        where = w and f"week{w['number']}.txt"
        cited, listed = set(w["sources_cited"]), set(w["sources_listed"])
        cited_by_weeks |= cited
        unknown = cited - keys
        if unknown:
            rep.fail(where, f"cites unknown sources {sorted(unknown)}")
        if cited != listed:
            rep.fail(where, f"Section 11 lists {sorted(listed)} but the body cites {sorted(cited)}")
    support_text = "\n".join(read(ROOT / f) for f in SUPPORT_FILES if (ROOT / f).exists())
    cited_by_support = parse_citations(support_text)
    for key, entry in sorted(register.items()):
        if not entry["url"]:
            rep.fail("18_sources.txt", f"{key} has no URL line")
        if entry["use"] is None:
            rep.fail("18_sources.txt", f"{key} lacks a 'Use: curriculum' or 'Use: authoring' line")
        elif entry["use"] == "curriculum" and key not in cited_by_weeks:
            rep.fail("18_sources.txt", f"{key} is a curriculum source but no week cites it")
        elif entry["use"] == "authoring" and key not in cited_by_support:
            rep.fail("18_sources.txt", f"{key} is an authoring source but no support file cites it")
    rep.ok(f"{len(register)} sources, {len(cited_by_weeks)} cited by weeks")


def check_rules(rep: Report, weeks: list[dict]):
    rules = parse_case_rules()
    for w in weeks:
        unknown = set(w["rules_cited"]) - rules
        if unknown:
            rep.fail(f"week{w['number']}.txt", f"cites unknown rules {sorted(unknown)}")
    rep.ok(f"rules {sorted(rules)}")


def check_spine(rep: Report, weeks: list[dict]):
    spine = parse_spine()
    if len(spine) != 14:
        rep.fail("00_START_HERE.txt", f"spine has {len(spine)} rows, expected 14")
        return
    for row, w in zip(spine, weeks):
        if row["number"] != w["number"]:
            rep.fail("00_START_HERE.txt", f"spine row {row['number']} out of order")
        if row["title"].lower() != w["title"].lower():
            rep.fail("00_START_HERE.txt", f"week {w['number']} spine title '{row['title']}' != '{w['title']}'")
        if row["question"] != w["question"]:
            rep.fail("00_START_HERE.txt", f"week {w['number']} spine question differs from the week file")


def close(a, b, tol=1e-9) -> bool:
    return abs(float(a) - float(b)) <= tol


def check_fixtures(rep: Report, weeks: list[dict]):
    where = "assets/demo-fixtures.json"
    f = load_fixtures()
    # flow
    for name, sc in f["flow"]["scenarios"].items():
        mine = models.queue_rounds(sc["implementation_capacity"], sc["review_capacity"])
        theirs = [{k: r[k] for k in ("round", "ready", "review_waiting", "done")} for r in sc["rows"]]
        if mine != theirs:
            rep.fail(where, f"flow scenario {name} rows do not recompute")
    # delivery
    d = models.delivery_summary(f["delivery"]["events"], f["delivery"]["window_days"])
    for k, v in f["delivery"]["expected"].items():
        if not close(d[k], v):
            rep.fail(where, f"delivery {k}: recorded {v}, recomputed {d[k]}")
    # latency
    lat = f["latency"]
    exp = {"mean_A": sum(lat["A"]) / len(lat["A"]), "mean_B": sum(lat["B"]) / len(lat["B"]),
           "p95_A": models.nearest_rank(lat["A"], 0.95), "p95_B": models.nearest_rank(lat["B"], 0.95)}
    for k, v in lat["expected"].items():
        if not close(exp[k], v):
            rep.fail(where, f"latency {k}: recorded {v}, recomputed {exp[k]}")
    # SLO
    s = models.slo_summary(f["booking_SLO"])
    if not s["adds_up"]:
        rep.fail(where, "booking_SLO event counts do not add up to eligible_requests")
    if not close(s["good_fraction"], f["booking_SLO"]["expected_good_fraction"]):
        rep.fail(where, "booking_SLO expected_good_fraction does not recompute")
    if s["observed_bad_events"] != f["booking_SLO"]["observed_bad_events"]:
        rep.fail(where, "booking_SLO observed_bad_events does not recompute")
    if s["bad_event_allowance"] != f["booking_SLO"]["bad_event_allowance"]:
        rep.fail(where, "booking_SLO bad_event_allowance does not recompute")
    if not close(s["burn_rate"], f["booking_SLO"]["expected_burn_rate"]):
        rep.fail(where, f"booking_SLO expected_burn_rate: recorded {f['booking_SLO']['expected_burn_rate']}, recomputed {s['burn_rate']}")
    if not close(s["days_to_exhaust_budget"], f["booking_SLO"]["expected_days_to_exhaust_budget"]):
        rep.fail(where, "booking_SLO expected_days_to_exhaust_budget does not recompute")
    # resources
    r = f["resources"]
    if not close(r["before_storage_reads"] / r["successful_searches"], r["expected_reads_per_success_before"]) \
            or not close(r["after_storage_reads"] / r["successful_searches"], r["expected_reads_per_success_after"]) \
            or not close(1 - r["after_storage_reads"] / r["before_storage_reads"], r["expected_reduction_fraction"]):
        rep.fail(where, "resources fixture does not recompute")
    # intervals and durations
    for c in f["interval_cases"]:
        got = models.intervals_conflict(tuple(c["existing"]), tuple(c["candidate"]),
                                        c["existing_room"] == c["candidate_room"])
        if got != c["expected_conflict"]:
            rep.fail(where, f"interval case {c} recomputes to {got}")
    for c in f["duration_cases"]:
        if models.duration_valid(c["minutes"]) != c["expected_valid_duration"]:
            rep.fail(where, f"duration case {c} does not recompute")
    # cancellation matrix
    for row in f.get("cancellation_matrix", []):
        allowed = (row["authenticated"] and row["requester"] == row["owner"] and row["state"] == "Confirmed"
                   and row["now"] < row["start"])
        if row["state"] == "Cancelled":
            expected = "repeated-response"
        else:
            expected = "allowed" if allowed else "denied"
        if row["expected"] != expected:
            rep.fail(where, f"cancellation row {row['label']} recomputes to {expected}")
    # retry model
    rm = f.get("retry_model")
    if rm:
        for name, pol in rm["policies"].items():
            res = models.retry_rounds(rm["capacity_per_round"], rm["unique_requests"], pol, rm["dropped_attempts"])
            if res["rows"] != rm["rows"][name]:
                rep.fail(where, f"retry_model rows for {name} do not recompute")
            if res["summary"] != rm["summary"][name]:
                rep.fail(where, f"retry_model summary for {name} do not recompute: {res['summary']}")
    # snippets: every predicate fixture is executed against its expected table
    for key, anchor in f.get("anchors", {}).items():
        for snippet in anchor.get("snippets", []):
            for case in snippet.get("cases", []):
                got = models.run_snippet(snippet["code"], snippet["function"], *case["args"])
                if got != case["expected"]:
                    rep.fail(where, f"{key} snippet {snippet['name']} case {case['args']} gives {got}, recorded {case['expected']}")
    # every Anchor has structured data; prose values appear in the week text
    anchors = f.get("anchors", {})
    for w in weeks:
        text = read(ROOT / f"week{w['number']}.txt")
        for c in w["chapter"]:
            key = f"w{w['number']:02d}/{c['id']}"
            if c["role"] == "Anchor" and key not in anchors:
                rep.fail(where, f"Anchor {key} has no anchors entry")
            for value in anchors.get(key, {}).get("week_text_shows", []):
                if value not in text:
                    rep.fail(f"week{w['number']}.txt", f"fixture value '{value}' for {key} is not in the week text")
    extra = [k for k in anchors if not any(k == f"w{w['number']:02d}/{c['id']}" for w in weeks for c in w["chapter"])]
    if extra:
        rep.fail(where, f"anchors entries with no scene: {extra}")
    if f.get("pseudocode_language") != "python-like":
        rep.fail(where, "pseudocode_language must be 'python-like' (decision in 00_START_HERE.txt)")
    rep.ok(f"{len(anchors)} anchor fixtures")


def check_manifest(rep: Report):
    out = ROOT / "plan_manifest.json"
    text = manifest_text(build_manifest())
    if not out.exists():
        rep.fail("plan_manifest.json", "missing; run python tools/build_manifest.py")
    elif out.read_text(encoding="utf-8") != text:
        rep.fail("plan_manifest.json", "stale; run python tools/build_manifest.py")


def check_support(rep: Report):
    for name in SUPPORT_FILES:
        if not (ROOT / name).exists():
            rep.fail(name, "missing support file")
    stale = ROOT / "20_codex_authoring_brief.txt"
    if stale.exists():
        rep.fail(stale.name, "superseded by 20_agent_authoring_brief.txt; delete it")
    for name in ("Software_Engineering_14_Week_Plan.md",):
        p = ROOT / name
        if p.exists() and "Derived file" not in p.read_text(encoding="utf-8")[:600]:
            rep.fail(name, "combined file lacks the derived-file notice; regenerate with tools/build_combined.py")


def run() -> Report:
    rep = Report()
    weeks = check_weeks(rep)
    check_sources(rep, weeks)
    check_rules(rep, weeks)
    check_spine(rep, weeks)
    check_fixtures(rep, weeks)
    check_manifest(rep)
    check_support(rep)
    return rep


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--json", help="write the report as JSON")
    args = parser.parse_args()
    rep = run()
    for note in rep.notes:
        print("  ", note)
    for p in rep.problems:
        print("FAIL", p)
    verdict = "PASS" if not rep.problems else f"FAIL ({len(rep.problems)} problems)"
    print(verdict)
    if args.json:
        Path(args.json).write_text(json.dumps({"verdict": verdict, "problems": rep.problems, "notes": rep.notes}, indent=1),
                                   encoding="utf-8")
    return 0 if not rep.problems else 1


if __name__ == "__main__":
    raise SystemExit(main())
