"""Deterministic teaching models behind the Campus Rooms fixtures.

The meaning of every model is written once in 19_recurring_case_and_demo_data.txt.
The parameters and expected rows live once in assets/demo-fixtures.json.
This module recomputes the rows so tools/check_plan.py can show that the JSON,
the prose and the arithmetic agree. There is no randomness anywhere.
"""
from __future__ import annotations

import math
import statistics


# ---------------------------------------------------------------- Week 4 flow board
def queue_rounds(implementation_capacity: int, review_capacity: int, cards: int = 8) -> list[dict]:
    """Discrete-round board. Review consumes only cards waiting at round start; cards
    implemented in a round join review for the following round. Rows are end-of-round."""
    ready, waiting, done, r = cards, 0, 0, 0
    rows = [{"round": 0, "ready": ready, "review_waiting": 0, "done": 0}]
    while done < cards:
        r += 1
        reviewed = min(review_capacity, waiting)
        waiting -= reviewed
        done += reviewed
        implemented = min(implementation_capacity, ready)
        ready -= implemented
        waiting += implemented
        rows.append({"round": r, "ready": ready, "review_waiting": waiting, "done": done})
        if r > 1000:
            raise RuntimeError("flow model did not finish")
    return rows


# ---------------------------------------------------------------- Week 10 delivery
def delivery_summary(events: list[dict], window_days: int) -> dict:
    lead = [e["change_lead_time_hours"] for e in events]
    failed = [e for e in events if e["failed_requires_intervention"]]
    rework = [e for e in events if e["unplanned_incident_rework"]]
    recovery = [e["failed_deployment_recovery_minutes"] for e in failed]
    return {
        "deployment_frequency_per_7_days": len(events) * 7 / window_days,
        "deployment_frequency_per_day": len(events) / window_days,
        "median_change_lead_time_hours": statistics.median(lead),
        "change_fail_rate": len(failed) / len(events),
        "deployment_rework_rate": len(rework) / len(events),
        "median_failed_deployment_recovery_minutes": statistics.median(recovery),
    }


# ---------------------------------------------------------------- Week 11 latency and SLO
def nearest_rank(values: list[float], p: float) -> float:
    ordered = sorted(values)
    return ordered[math.ceil(p * len(ordered)) - 1]


def slo_summary(slo: dict) -> dict:
    n = slo["eligible_requests"]
    bad = slo["correct_but_slow"] + slo["timeouts"] + slo["unexpected_server_failures"]
    return {
        "good_fraction": slo["good_correct_within_2s"] / n,
        "observed_bad_events": bad,
        "bad_event_allowance": round((1 - slo["objective_good_fraction"]) * n),
        "adds_up": slo["good_correct_within_2s"] + bad == n,
    }


# ---------------------------------------------------------------- Week 11 retry amplification
def retry_rounds(capacity: int, unique_requests: int, policy: dict,
                 dropped_attempts=(), max_rounds: int = 40) -> dict:
    """Toy model of clients retrying against one constrained dependency.

    Per round: the dependency serves the first `capacity` queued attempts (FIFO); an
    attempt for a request that already succeeded is a duplicate effect. Attempts listed
    in `dropped_attempts` vanish in their round without a response. Every request still
    pending at the end of the round is a timeout for its client.

    naive   : each timed-out client immediately submits another attempt while its
              earlier attempts stay queued.
    bounded : a client resubmits at most `max_retries` times, only after waiting
              `backoff_rounds` rounds, never while the circuit is open, and reports
              Unknown outcome once `timeout_budget_rounds` have passed with the last
              permitted retry spent. The circuit opens at the end of a round with at
              least `circuit_open_threshold_timeouts` timeouts and blocks submissions
              for `circuit_open_rounds` round-ends.
    """
    reqs = [f"Q{i}" for i in range(1, unique_requests + 1)]
    queue = [(q, 1) for q in reqs]
    status = {q: "pending" for q in reqs}
    attempts = {q: 1 for q in reqs}
    waited = {q: 0 for q in reqs}
    total_wait = {q: 0 for q in reqs}
    retries = {q: 0 for q in reqs}
    drops = {(d["request"], d["attempt"]): d["round"] for d in dropped_attempts}
    circuit_until = 0
    duplicates = 0
    unique_done = 0
    rows = []
    kind = policy["kind"]
    for r in range(1, max_rounds + 1):
        served, queue = queue[:capacity], queue[capacity:]
        served_ids = []
        for q, a in served:
            served_ids.append(f"{q}#{a}")
            if status[q] == "succeeded":
                duplicates += 1
            elif status[q] == "pending":
                status[q] = "succeeded"
                unique_done += 1
        dropped_now = [(q, a) for (q, a) in queue if drops.get((q, a)) == r]
        queue = [x for x in queue if x not in dropped_now]
        timed_out = [q for q in reqs if status[q] == "pending"]
        submissions = []
        circuit_open = False
        if kind == "naive":
            for q in timed_out:
                attempts[q] += 1
                submissions.append((q, attempts[q]))
        elif kind == "bounded":
            if len(timed_out) >= policy["circuit_open_threshold_timeouts"]:
                circuit_until = max(circuit_until, r + policy["circuit_open_rounds"] - 1)
            circuit_open = r <= circuit_until
            for q in timed_out:
                waited[q] += 1
                total_wait[q] += 1
                can_retry = retries[q] < policy["max_retries"]
                if can_retry and waited[q] >= policy["backoff_rounds"] and not circuit_open:
                    retries[q] += 1
                    attempts[q] += 1
                    waited[q] = 0
                    submissions.append((q, attempts[q]))
                elif not can_retry and total_wait[q] >= policy["timeout_budget_rounds"]:
                    status[q] = "unknown_outcome"
        else:
            raise ValueError(f"unknown retry policy kind {kind!r}")
        queue.extend(submissions)
        rows.append({
            "round": r,
            "served": served_ids,
            "dropped": [f"{q}#{a}" for q, a in dropped_now],
            "timeouts": len(timed_out),
            "submitted": [f"{q}#{a}" for q, a in submissions],
            "queue_after_round": len(queue),
            "circuit_open": circuit_open,
            "unique_done_cum": unique_done,
            "duplicates_cum": duplicates,
            "unknown_outcome_cum": sum(1 for q in reqs if status[q] == "unknown_outcome"),
        })
        if not queue and all(status[q] != "pending" for q in reqs):
            break
    else:
        raise RuntimeError("retry model did not settle")
    summary = {
        "peak_queue_after_round": max(row["queue_after_round"] for row in rows),
        "all_unique_done_round": next((row["round"] for row in rows
                                       if row["unique_done_cum"] == unique_requests), None),
        "duplicate_effects": duplicates,
        "unknown_outcomes": rows[-1]["unknown_outcome_cum"],
        "queue_empty_round": rows[-1]["round"],
        "served_attempts_total": sum(len(row["served"]) for row in rows),
    }
    return {"rows": rows, "summary": summary}


# ---------------------------------------------------------------- Campus Rooms rules
def duration_valid(minutes: int) -> bool:
    """R-02: 30 through 120 inclusive, whole minutes."""
    return 30 <= minutes <= 120


def intervals_conflict(existing: tuple[int, int], candidate: tuple[int, int], same_room: bool) -> bool:
    """R-01 with half-open intervals: adjacent intervals do not overlap."""
    return same_room and existing[0] < candidate[1] and candidate[0] < existing[1]


def run_snippet(code: str, function: str, *args):
    """Execute a Python-like fixture snippet in one restricted namespace and call one function."""
    namespace: dict = {"__builtins__": {"range": range, "len": len, "min": min, "max": max,
                                        "True": True, "False": False, "None": None}}
    exec(compile(code, "<fixture>", "exec"), namespace)
    return namespace[function](*args)
