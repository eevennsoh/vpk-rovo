#!/usr/bin/env bash
#
# Hook: WorktreeCreate handler for Claude Code worktree-isolated sub-agents
#
# Fires when Claude Code creates a worktree via Agent({ isolation: "worktree" })
# or `claude --worktree`. This hook REPLACES the default `git worktree add`
# flow, so we are responsible for:
#
#   1. Creating the worktree itself (git worktree add)
#   2. Copying gitignored env files (mirrors .worktreeinclude semantics,
#      done defensively here since we own the creation flow)
#   3. Installing dependencies (pnpm install --prefer-offline)
#   4. Printing the worktree directory path to stdout (Claude Code reads
#      stdout as the new session's cwd)
#
# Note: SessionStart hooks do NOT fire for sub-agent worktrees, so this
# WorktreeCreate hook is the only opportunity to bootstrap them.
#
# Input:  JSON on stdin with at least {"name": "<branch-suffix>"}; may also
#         include base_ref, worktree_ref depending on Claude Code version.
# Output: Worktree directory path on stdout (one line, no trailing noise).
# Exit:   0 = accept worktree; non-zero = abort creation (Claude reports
#         the failure to the parent session).

set -euo pipefail

INPUT="$(cat)"

REPO_ROOT="$(git rev-parse --show-toplevel)"
LOG_DIR="${REPO_ROOT}/.claude/hooks/state"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/worktree-create.log"

# Debug log: record every invocation so we can diagnose hook behavior later.
{
	printf '\n=== %s ===\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
	printf 'cwd: %s\n' "$(pwd)"
	printf 'CLAUDE_PROJECT_DIR=%s\n' "${CLAUDE_PROJECT_DIR:-<unset>}"
	printf 'stdin: %s\n' "$INPUT"
} >> "$LOG_FILE"

parse_field() {
	# Read a top-level string field from $INPUT using python3 (universally
	# available on macOS/Linux; avoids a jq dependency).
	printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    print(json.loads(sys.stdin.read()).get('$1', ''))
except Exception:
    pass
"
}

NAME="$(parse_field name)"
BASE_REF="$(parse_field base_ref)"
WORKTREE_REF="$(parse_field worktree_ref)"
WORKTREE_PATH_HINT="$(parse_field worktree_path)"

# Resolve worktree directory. Accept either an explicit worktree_path (newer
# Claude Code versions may provide it) or build one from name (older form).
if [ -n "$WORKTREE_PATH_HINT" ]; then
	WORKTREE_DIR="$WORKTREE_PATH_HINT"
elif [ -n "$NAME" ]; then
	WORKTREE_DIR="${REPO_ROOT}/.claude/worktrees/${NAME}"
else
	printf 'WorktreeCreate hook: stdin payload missing both name and worktree_path: %s\n' "$INPUT" >&2
	exit 1
fi

mkdir -p "$(dirname "$WORKTREE_DIR")"

# Step 1: create the worktree. If the directory already exists as a registered
# worktree (re-entry), skip creation and just proceed with bootstrap.
if git worktree list --porcelain | grep -q "^worktree $WORKTREE_DIR\$"; then
	echo "WorktreeCreate: worktree already registered at $WORKTREE_DIR — skipping git worktree add" >&2
else
	if [ -n "$WORKTREE_REF" ]; then
		git worktree add -b "$WORKTREE_REF" "$WORKTREE_DIR" "${BASE_REF:-HEAD}" >&2
	elif [ -n "$BASE_REF" ]; then
		git worktree add "$WORKTREE_DIR" "$BASE_REF" >&2
	else
		git worktree add "$WORKTREE_DIR" >&2
	fi
fi

# Step 2: copy gitignored env files. Idempotent — skip if already present
# (e.g. if .worktreeinclude semantics also fired alongside this hook).
for f in .env.local; do
	if [ -f "$REPO_ROOT/$f" ] && [ ! -f "$WORKTREE_DIR/$f" ]; then
		cp "$REPO_ROOT/$f" "$WORKTREE_DIR/$f"
		echo "WorktreeCreate: copied $f from main worktree" >&2
	fi
done

# Step 3: install dependencies. Best-effort: log failure to stderr but do
# NOT abort worktree creation — a worktree with a broken install is still
# more useful than no worktree at all (the agent can install manually).
cd "$WORKTREE_DIR"
if [ -d node_modules ]; then
	echo "WorktreeCreate: node_modules present — skipping pnpm install" >&2
else
	echo "WorktreeCreate: running pnpm install --prefer-offline in $WORKTREE_DIR..." >&2
	if pnpm install --prefer-offline >&2; then
		echo "WorktreeCreate: pnpm install complete" >&2
	else
		echo "⚠️  WorktreeCreate: pnpm install failed — sub-agent will need to install manually" >&2
	fi
fi

# Step 4: echo the worktree path so Claude Code uses it as the session cwd.
# Must be the only thing on stdout; everything else goes to stderr above.
echo "$WORKTREE_DIR"
exit 0
