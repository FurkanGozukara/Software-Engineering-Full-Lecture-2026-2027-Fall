@AGENTS.md

Claude Code specifics for this repository: run the checks and exports through Bash exactly as listed in AGENTS.md; serve a deck for inspection with `python scripts/serve.py --root site`; read your own screenshots with the built-in file reader, never through a third-party service; work in a git worktree per week; keep the browser tools away from external sites, because the decks must run offline. The plan files under `plan/` are the source of truth and are edited only when a task explicitly asks for a plan change.
