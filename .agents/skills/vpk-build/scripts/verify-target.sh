#!/usr/bin/env bash
# verify-target.sh
#
# Runs the three verification steps inside an extracted sibling project:
#   1. pnpm install  — confirms deps are resolvable
#   2. pnpm typecheck — catches missing imports
#   3. pnpm build    — confirms Next static export succeeds end to end
#
# Usage:
#   verify-target.sh <target-dir>
#
# Exits 0 on success; non-zero (with the failing step's exit code) on failure.
# Each step's output is streamed to stdout so the caller sees progress live.

set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
	echo "Usage: verify-target.sh <target-dir>" >&2
	exit 2
fi
if [[ ! -d "$TARGET" ]]; then
	echo "Target directory not found: $TARGET" >&2
	exit 2
fi

cd "$TARGET"

echo "━━━━ 1/3  pnpm install ━━━━"
pnpm install

echo ""
echo "━━━━ 2/3  pnpm typecheck ━━━━"
pnpm run typecheck

echo ""
echo "━━━━ 3/3  pnpm build ━━━━"
pnpm run build

echo ""
echo "✅ Verification passed. Try: cd $TARGET && pnpm dev"
