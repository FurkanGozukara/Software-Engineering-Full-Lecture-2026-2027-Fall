"""The plan checker as a test, so `pytest` guards the TXT sources, fixtures and manifest."""
from __future__ import annotations

import check_plan  # tools/ is on the pytest pythonpath


def test_plan_package_is_consistent():
    report = check_plan.run()
    assert not report.problems, "\n".join(report.problems)
