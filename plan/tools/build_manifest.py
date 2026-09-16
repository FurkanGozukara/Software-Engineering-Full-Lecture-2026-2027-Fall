"""Derive plan_manifest.json from week1.txt .. week14.txt.

  python tools/build_manifest.py            write plan_manifest.json
  python tools/build_manifest.py --check    exit 1 if the file on disk is stale

The manifest is a derived view for the authoring agents, the course index page and the
tests. The TXT files stay the single source; never edit the manifest by hand.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from plan_lib import ROOT, build_manifest, manifest_text  # noqa: E402

OUT = ROOT / "plan_manifest.json"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--check", action="store_true", help="only compare with the file on disk")
    args = parser.parse_args()
    text = manifest_text(build_manifest())
    if args.check:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print(f"STALE {OUT.name}: run python tools/build_manifest.py")
            return 1
        print(f"OK {OUT.name} is current")
        return 0
    OUT.write_text(text, encoding="utf-8")
    weeks = sum(1 for _ in range(14))
    print(f"wrote {OUT} ({weeks} weeks)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
