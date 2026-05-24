#!/usr/bin/env bash
#
# Hook: Bootstrap worktree dependencies and env on session start
#
# Mirrors the Codex setup-script behavior for Claude Code worktrees:
#   - .env.local is auto-copied by .worktreeinclude on worktree creation,
#     but we warn loudly if it is still missing (e.g. main worktree before
#     first setup, or a worktree created manually outside Claude).
#   - pnpm install is run when node_modules is absent. pnpm's CAS store is
#     shared across worktrees, so --prefer-offline keeps fresh installs
#     mostly to hardlink work (~5s on a warm cache).
#
# Wired via .claude/settings.json -> hooks.SessionStart with
# matcher: "startup", so this fires once when a new session enters a
# worktree (or the main worktree) and no-ops on /compact, /clear, resume.
#
# Output contract:
#   - Installer noise -> stderr (visible in terminal, NOT injected into
#     Claude's context window — keeps the first turn lean).
#   - One short status line -> structured hookSpecificOutput JSON, which
#     becomes additionalContext for Claude on session start. Skipped
#     entirely when there is nothing to report.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$PROJECT_DIR"

MESSAGES=()

if [ ! -f .env.local ]; then
	echo "⚠️  .env.local missing in $PROJECT_DIR" >&2
	echo "    Symlink from the main worktree, or copy .env.local.example and fill in credentials." >&2
	MESSAGES+=(".env.local missing — Rovo / AI Gateway flows will fail until you create it.")
fi

if [ ! -d node_modules ]; then
	echo "Fresh worktree detected — running pnpm install --prefer-offline..." >&2
	if pnpm install --prefer-offline >&2; then
		MESSAGES+=("Bootstrapped node_modules via pnpm install.")
	else
		echo "⚠️  pnpm install failed during worktree bootstrap" >&2
		MESSAGES+=("pnpm install failed during worktree bootstrap. Re-run manually before continuing.")
	fi
fi

if [ ${#MESSAGES[@]} -gt 0 ]; then
	CONTEXT="${MESSAGES[*]}"
	CONTEXT_ESCAPED=$(printf '%s' "$CONTEXT" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr -d '\n')
	cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "$CONTEXT_ESCAPED"
  }
}
EOF
fi

exit 0
