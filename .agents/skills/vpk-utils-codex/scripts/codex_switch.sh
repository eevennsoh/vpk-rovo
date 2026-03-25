#!/usr/bin/env bash
set -euo pipefail

DEFAULT_MODERN_VERSION="0.116.0"
ROLLBACK_VERSION="0.107.0"
CODEX_HOME_DIR="${HOME}/.codex"
AUTH_FILE="${CODEX_HOME_DIR}/auth.json"
CONFIG_FILE="${CODEX_HOME_DIR}/config.toml"
BACKUP_DIR="${CODEX_HOME_DIR}/auth-backups/vpk-utils-codex"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ASSETS_DIR="${SKILL_DIR}/assets"
ROLLBACK_CONFIG_TEMPLATE="${ASSETS_DIR}/config-0.107.0.toml"
MODERN_CONFIG_TEMPLATE="${ASSETS_DIR}/config-0.116.0-plus.toml"

usage() {
	printf '%s\n' \
		"Usage:" \
		"  codex_switch.sh status" \
		"  codex_switch.sh upgrade-latest" \
		"  codex_switch.sh downgrade-0107" \
		"  codex_switch.sh switch <version>"
}

fail() {
	printf 'Error: %s\n' "$1" >&2
	exit 1
}

require_cmd() {
	command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

timestamp() {
	date '+%Y%m%d-%H%M%S'
}

codex_version() {
	codex --version 2>/dev/null | awk '{print $2}'
}

auth_mode() {
	node -e 'const fs=require("fs"); const p=process.env.HOME+"/.codex/auth.json"; if (!fs.existsSync(p)) { console.log("missing"); process.exit(0); } try { const j=JSON.parse(fs.readFileSync(p,"utf8")); console.log(j.auth_mode || "unknown"); } catch { console.log("invalid"); }'
}

config_value() {
	local key="$1"
	node -e 'const fs=require("fs"); const key=process.argv[1]; const p=process.env.HOME+"/.codex/config.toml"; if (!fs.existsSync(p)) { console.log("missing"); process.exit(0); } const lines=fs.readFileSync(p,"utf8").split(/\r?\n/); const line=lines.find((entry)=>entry.startsWith(key+" = ")); if (!line) { console.log("missing"); process.exit(0); } const value=line.slice((key+" = ").length).trim().replace(/^"|"$/g, ""); console.log(value);' "$key"
}

ensure_templates() {
	[ -f "$ROLLBACK_CONFIG_TEMPLATE" ] || fail "Missing rollback config template: $ROLLBACK_CONFIG_TEMPLATE"
	[ -f "$MODERN_CONFIG_TEMPLATE" ] || fail "Missing modern config template: $MODERN_CONFIG_TEMPLATE"
}

ensure_npm_managed_codex() {
	local codex_path npm_prefix expected_prefix
	codex_path="$(command -v codex)"
	npm_prefix="$(npm prefix -g)"
	expected_prefix="${npm_prefix}/bin/"
	case "$codex_path" in
		"$expected_prefix"*) ;;
		*)
			fail "Active codex binary is ${codex_path}, which is outside npm global prefix ${npm_prefix}. This skill only manages npm-global installs."
			;;
	esac
}

backup_file() {
	local path="$1"
	local label="$2"
	local ts target latest_target
	mkdir -p "$BACKUP_DIR"
	if [ ! -f "$path" ]; then
		return 0
	fi
	ts="$(timestamp)"
	target="${BACKUP_DIR}/${ts}-${label}"
	cp "$path" "$target"
	printf 'Backed up %s to %s\n' "$path" "$target"
	latest_target="${BACKUP_DIR}/latest-${label}"
	cp "$path" "$latest_target"
}

backup_auth() {
	local mode
	if [ ! -f "$AUTH_FILE" ]; then
		return 0
	fi
	mode="$(auth_mode)"
	backup_file "$AUTH_FILE" "${mode}.auth.json"
	if [ "$mode" = "chatgpt" ] || [ "$mode" = "api_key" ]; then
		cp "$AUTH_FILE" "${BACKUP_DIR}/latest-${mode}.auth.json"
	fi
}

backup_config() {
	backup_file "$CONFIG_FILE" "config.toml"
}

restore_chatgpt_backup() {
	local src
	src="${BACKUP_DIR}/latest-chatgpt.auth.json"
	if [ ! -f "$src" ]; then
		printf 'No saved ChatGPT auth snapshot found at %s\n' "$src"
		return 1
	fi
	cp "$src" "$AUTH_FILE"
	printf 'Restored ChatGPT auth from %s\n' "$src"
	return 0
}

install_version() {
	local version="$1"
	printf 'Installing @openai/codex@%s\n' "$version"
	npm install -g "@openai/codex@${version}"
}

apply_config_profile() {
	local profile="$1"
	local src
	case "$profile" in
		rollback)
			src="$ROLLBACK_CONFIG_TEMPLATE"
			;;
		modern)
			src="$MODERN_CONFIG_TEMPLATE"
			;;
		*)
			fail "Unknown config profile: $profile"
			;;
	esac
	backup_config
	cp "$src" "$CONFIG_FILE"
	printf 'Applied config profile %s from %s\n' "$profile" "$src"
}

login_with_api_key() {
	[ -n "${OPENAI_API_KEY:-}" ] || fail "OPENAI_API_KEY is required for API key login"
	printf '%s' "$OPENAI_API_KEY" | codex login --with-api-key
	backup_auth
}

print_status() {
	printf 'codex path: %s\n' "$(command -v codex)"
	printf 'codex version: %s\n' "$(codex_version)"
	printf 'auth mode: %s\n' "$(auth_mode)"
	printf 'model_provider: %s\n' "$(config_value model_provider)"
	printf 'model: %s\n' "$(config_value model)"
}

switch_to_version() {
	local version="$1"
	backup_auth
	install_version "$version"
	if [ "$version" = "$ROLLBACK_VERSION" ]; then
		apply_config_profile rollback
		if restore_chatgpt_backup; then
			:
		else
			printf '%s\n' "Run 'codex login' and choose ChatGPT sign-in to finish restoring OAuth."
		fi
	else
		apply_config_profile modern
		login_with_api_key
	fi
	print_status
}

main() {
	require_cmd codex
	require_cmd npm
	require_cmd node
	ensure_templates
	ensure_npm_managed_codex

	case "${1:-}" in
		status)
			print_status
			;;
		upgrade-latest)
			switch_to_version "$DEFAULT_MODERN_VERSION"
			;;
		downgrade-0107)
			switch_to_version "$ROLLBACK_VERSION"
			;;
		switch)
			[ -n "${2:-}" ] || fail "Missing version target"
			switch_to_version "$2"
			;;
		*)
			usage
			exit 1
			;;
	esac
}

main "$@"
