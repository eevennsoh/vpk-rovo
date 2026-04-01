#!/usr/bin/env bash
# claude_fix.sh — Ensure the active `claude` binary is the latest installed version,
# not a stale cmux-bundled copy or an outdated symlink.
#
# Claude CLI self-manages versions at ~/.local/share/claude/versions/<semver>.
# The user-facing symlink lives at ~/.local/bin/claude and should point to the
# latest version in that directory. cmux bundles its own copy that never updates.
#
# Usage:
#   claude_fix.sh status    — show all claude binaries and which one wins
#   claude_fix.sh fix       — symlink ~/.local/bin/claude → latest version
#   claude_fix.sh fix-cmux  — also copy the latest binary into cmux's Resources/bin
#
set -euo pipefail

VERSIONS_DIR="$HOME/.local/share/claude/versions"
LOCAL_BIN="$HOME/.local/bin/claude"
CMUX_BIN="/Applications/cmux.app/Contents/Resources/bin/claude"

# Find the latest version by sorting semver directory names.
# Returns the full path to the binary, or empty string if none found.
find_latest() {
	if [[ ! -d "$VERSIONS_DIR" ]]; then
		echo ""
		return
	fi
	local latest
	latest="$(ls -1 "$VERSIONS_DIR" 2>/dev/null \
		| grep -E '^[0-9]+\.[0-9]+\.[0-9]+' \
		| sort -t. -k1,1n -k2,2n -k3,3n \
		| tail -1)"
	if [[ -n "$latest" && -f "$VERSIONS_DIR/$latest" ]]; then
		echo "$VERSIONS_DIR/$latest"
	else
		echo ""
	fi
}

# Extract version from a path. Prefers the filename in the versions dir
# (instant, no subprocess). Falls back to --version only if needed.
version_of() {
	local bin="$1"
	if [[ ! -e "$bin" && ! -L "$bin" ]]; then
		echo "(not found)"
		return
	fi
	# Resolve symlinks to get the real path
	local real
	real="$(readlink -f "$bin" 2>/dev/null || echo "$bin")"
	# If the real path is inside the versions dir, the filename IS the version
	if [[ "$real" == "$VERSIONS_DIR"/* ]]; then
		basename "$real"
		return
	fi
	# Otherwise try --version with a short timeout
	if command -v timeout &>/dev/null; then
		timeout 3 "$bin" --version 2>/dev/null || echo "(unknown)"
	else
		# macOS doesn't have timeout by default; use perl as fallback
		perl -e 'alarm 3; exec @ARGV' "$bin" --version 2>/dev/null || echo "(unknown)"
	fi
}

# Show the symlink target if it is one, or note it's a regular file
describe_link() {
	local path="$1"
	if [[ -L "$path" ]]; then
		echo "  Symlink target:      $(readlink "$path")"
	elif [[ -f "$path" ]]; then
		echo "  (regular file, not a symlink)"
	fi
}

cmd_status() {
	echo "=== Claude CLI binary audit ==="
	echo ""

	# Latest available version
	local latest
	latest="$(find_latest)"
	if [[ -n "$latest" ]]; then
		echo "Latest installed:      $latest"
		echo "  Version:             $(basename "$latest")"
	else
		echo "Latest installed:      (no versions found in $VERSIONS_DIR)"
	fi
	echo ""

	# Which binary wins in PATH?
	local active
	active="$(command -v claude 2>/dev/null || echo "(not in PATH)")"
	echo "Active (PATH winner):  $active"
	if [[ "$active" != "(not in PATH)" ]]; then
		describe_link "$active"
		echo "  Version:             $(version_of "$active")"
	fi
	echo ""

	# User local symlink
	echo "User local:            $LOCAL_BIN"
	describe_link "$LOCAL_BIN"
	echo "  Version:             $(version_of "$LOCAL_BIN")"
	echo ""

	# cmux-bundled
	echo "cmux-bundled:          $CMUX_BIN"
	if [[ -e "$CMUX_BIN" ]]; then
		echo "  Version:             $(version_of "$CMUX_BIN")"
	else
		echo "  (not found)"
	fi
	echo ""

	# All installed versions
	if [[ -d "$VERSIONS_DIR" ]]; then
		echo "All installed versions:"
		ls -1 "$VERSIONS_DIR" 2>/dev/null | grep -E '^[0-9]' | sort -t. -k1,1n -k2,2n -k3,3n | while read -r v; do
			echo "  $v"
		done
		echo ""
	fi

	# Full PATH resolution order
	echo "All 'claude' entries in PATH:"
	which -a claude 2>/dev/null | while read -r p; do
		echo "  $p  →  $(version_of "$p")"
	done
}

cmd_fix() {
	local latest
	latest="$(find_latest)"
	if [[ -z "$latest" ]]; then
		echo "ERROR: No Claude CLI versions found in $VERSIONS_DIR"
		echo "Install Claude CLI first, then re-run."
		exit 1
	fi

	mkdir -p "$(dirname "$LOCAL_BIN")"

	local current_target=""
	if [[ -L "$LOCAL_BIN" ]]; then
		current_target="$(readlink "$LOCAL_BIN")"
	fi

	if [[ "$current_target" == "$latest" ]]; then
		echo "Already up to date: $LOCAL_BIN → $latest ($(basename "$latest"))"
		return
	fi

	ln -sf "$latest" "$LOCAL_BIN"
	echo "Symlinked $LOCAL_BIN → $latest"
	echo "Active version: $(basename "$latest")"
}

cmd_fix_cmux() {
	cmd_fix

	if [[ ! -d "$(dirname "$CMUX_BIN")" ]]; then
		echo "cmux not installed at expected path, skipping cmux fix."
		return
	fi

	local latest
	latest="$(find_latest)"
	if [[ -z "$latest" ]]; then
		echo "ERROR: No Claude CLI versions found in $VERSIONS_DIR"
		exit 1
	fi

	cp -f "$latest" "$CMUX_BIN"
	echo "Copied $(basename "$latest") → $CMUX_BIN"
	echo "cmux version now: $(basename "$latest")"
}

case "${1:-status}" in
	status)    cmd_status ;;
	fix)       cmd_fix ;;
	fix-cmux)  cmd_fix_cmux ;;
	*)
		echo "Usage: $0 {status|fix|fix-cmux}"
		exit 1
		;;
esac
