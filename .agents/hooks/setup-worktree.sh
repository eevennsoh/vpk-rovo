#!/usr/bin/env bash
#
# Bootstrap worktree dependencies and env for local agent worktrees.
#
# Shared by:
#   - Claude Code SessionStart hooks
#   - Cursor .cursor/worktrees.json setup-worktree
#
# Mirrors the Codex setup-script behavior for local worktrees:
#   - .env.local is copied from another local worktree when available.
#   - pnpm install is run when node_modules is absent. pnpm's CAS store is
#     shared across worktrees, so --prefer-offline keeps fresh installs
#     mostly to hardlink work (~5s on a warm cache).
#
# Wired via .claude/settings.json -> hooks.SessionStart with
# matcher: "startup", so this fires once when a new session enters a
# worktree (or the main worktree) and no-ops on /compact, /clear, resume.
#
# Claude hook output contract:
#   - Installer noise -> stderr (visible in terminal, NOT injected into
#     Claude's context window — keeps the first turn lean).
#   - One short status line -> structured hookSpecificOutput JSON, which
#     becomes additionalContext for Claude on session start. Skipped
#     entirely when there is nothing to report. Non-Claude callers only get
#     human-readable stderr/stdout.

set -euo pipefail

PROJECT_DIR="${CURSOR_WORKTREE_PATH:-${CLAUDE_PROJECT_DIR:-$PWD}}"
SOURCE_TREE_PATH="${CURSOR_SOURCE_TREE_PATH:-${SOURCE_TREE_PATH:-}}"
IS_CLAUDE_HOOK=0

if [ -n "${CLAUDE_PROJECT_DIR:-}" ]; then
	IS_CLAUDE_HOOK=1
fi

cd "$PROJECT_DIR"

MESSAGES=()

if [ ! -f .env.local ]; then
	if [ -z "$SOURCE_TREE_PATH" ]; then
		while IFS= read -r candidate; do
			if [ "$candidate" != "$PROJECT_DIR" ] && [ -f "$candidate/.env.local" ]; then
				SOURCE_TREE_PATH="$candidate"
				break
			fi
		done < <(git worktree list --porcelain | awk '/^worktree / { print substr($0, 10) }')
	fi

	if [ -n "$SOURCE_TREE_PATH" ] && [ -f "$SOURCE_TREE_PATH/.env.local" ]; then
		cp "$SOURCE_TREE_PATH/.env.local" "$PROJECT_DIR/.env.local"
		echo "Copied .env.local from source worktree" >&2
		MESSAGES+=("Copied .env.local from source worktree.")
	else
		echo "⚠️  .env.local missing in $PROJECT_DIR" >&2
		echo "    Symlink from the main worktree, or copy .env.local.example and fill in credentials." >&2
		MESSAGES+=(".env.local missing — Rovo / AI Gateway flows will fail until you create it.")
	fi
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

if [ "$IS_CLAUDE_HOOK" -eq 1 ] && [ ${#MESSAGES[@]} -gt 0 ]; then
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
