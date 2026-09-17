# Task: re-verify the source register before Week 1 ships

For every entry in `plan/18_sources.txt`: fetch the URL, record today's retrieval date, the edition or version shown, its publication or update date, and whether it is final or a draft. Compare with the entry's notes. Where the live page has moved, changed edition, or changed status, update the entry's notes and add one line to `plan/15_curriculum_currency_and_coverage.txt` under the refresh policy naming what changed and which weeks cite the key. Where a page is unreachable, record the failure and the last known state; do not delete the entry.

Pay particular attention to the items the plan itself marks as watch items: SSDF 1.2 draft status (S15), SLSA edition (S16), the DORA measure names (S17), SWEBOK version (S01), the Kanban Guide edition (S05), WCAG 2.2 status (S25), OWASP editions (S13, S33, S34, S44), the SPDX License List version (S42), the ISO/IEC 25010 edition (S46), and the application dates of the laws named in Week 9 (S47, S48, S49).

Review each week's "In practice" paragraph (Section 1 of `plan/weekNN.txt`) at the same time: replace tool names that have fallen out of common use, and keep the names factual, without ranking.

Keep the S-keys stable; never renumber. Then run `python plan/tools/check_plan.py` and report: entries checked, entries changed, entries unreachable, and every week whose currency note needs an instructor decision.
