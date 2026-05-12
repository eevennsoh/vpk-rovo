#!/usr/bin/env bash
set -euo pipefail

usage() {
	cat <<'EOF'
Usage: pnpm run symphony -- [--port <port>] [--logs-root <path>]

Runs a freshly reset upstream OpenAI Symphony Elixir checkout against this
repo's WORKFLOW.md template.

Required configuration:
  LINEAR_API_KEY                  Linear personal API key
  SYMPHONY_LINEAR_PROJECT_SLUG    Linear project slug from the project URL

Optional configuration:
  LINEAR_ASSIGNEE                 Limit polling to a Linear assignee id/email, or "me"
  SYMPHONY_SOURCE_REPO_URL        Repo cloned into each issue workspace
  SYMPHONY_GITHUB_REPO            GitHub repo slug used by upstream cleanup hooks
  SYMPHONY_WORKSPACE_ROOT         Issue workspace root
  SYMPHONY_ENV_LOCAL_SOURCE       Local env file copied into each issue workspace
  SYMPHONY_UPSTREAM_REPO          Upstream Symphony git URL
  SYMPHONY_UPSTREAM_REF           Upstream ref fetched before every run
  SYMPHONY_UPSTREAM_DIR           Local clone/cache of openai/symphony
  SYMPHONY_DIR                    Backward-compatible alias for SYMPHONY_UPSTREAM_DIR
  SYMPHONY_RUNTIME_DIR            Rendered workflow and default logs directory

Example:
  SYMPHONY_LINEAR_PROJECT_SLUG=my-project pnpm run symphony -- --port 4567
EOF
}

if [ "${1:-}" = "--" ]; then
	shift
fi

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
	usage
	exit 0
fi

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
repo_root="$(CDPATH= cd -- "$script_dir/.." && pwd)"

load_env_var() {
	local name="$1"
	local current="${!name:-}"
	local env_file="$repo_root/.env.local"

	if [ -n "$current" ] || [ ! -f "$env_file" ]; then
		return 0
	fi

	local value
	value="$(awk -v key="$name" 'BEGIN { FS = "=" } $1 == key { sub(/^[^=]*=/, ""); print; exit }' "$env_file")"
	value="${value%$'\r'}"
	value="${value#\"}"
	value="${value%\"}"

	if [ -n "$value" ]; then
		export "$name=$value"
	fi
}

expand_user_path() {
	case "$1" in
		~)
			printf '%s\n' "$HOME"
			;;
		~/*)
			printf '%s/%s\n' "$HOME" "${1#~/}"
			;;
		*)
			printf '%s\n' "$1"
			;;
	esac
}

resolve_repo_path() {
	local path
	path="$(expand_user_path "$1")"
	case "$path" in
		/*)
			printf '%s\n' "$path"
			;;
		*)
			printf '%s/%s\n' "$repo_root" "$path"
			;;
	esac
}

load_env_var LINEAR_API_KEY
load_env_var LINEAR_ASSIGNEE
load_env_var SYMPHONY_LINEAR_PROJECT_SLUG
load_env_var SYMPHONY_SOURCE_REPO_URL
load_env_var SYMPHONY_GITHUB_REPO
load_env_var SYMPHONY_WORKSPACE_ROOT
load_env_var SYMPHONY_ENV_LOCAL_SOURCE
load_env_var SYMPHONY_UPSTREAM_DIR
load_env_var SYMPHONY_DIR
load_env_var SYMPHONY_UPSTREAM_REPO
load_env_var SYMPHONY_UPSTREAM_REF
load_env_var SYMPHONY_RUNTIME_DIR

if [ -z "${LINEAR_API_KEY:-}" ]; then
	echo "LINEAR_API_KEY is required. Add it to .env.local or export it in the shell." >&2
	exit 1
fi

if [ -z "${SYMPHONY_LINEAR_PROJECT_SLUG:-}" ]; then
	echo "SYMPHONY_LINEAR_PROJECT_SLUG is required. Copy the slug from the Linear project URL." >&2
	exit 1
fi

case "$SYMPHONY_LINEAR_PROJECT_SLUG" in
	*[!A-Za-z0-9_-]*)
		echo "SYMPHONY_LINEAR_PROJECT_SLUG may only contain letters, numbers, underscores, and hyphens." >&2
		exit 1
		;;
esac

if ! command -v mise >/dev/null 2>&1; then
	echo "mise is required for upstream Symphony. Install it from https://mise.jdx.dev/." >&2
	exit 1
fi

derive_github_repo() {
	local url="$1"
	local repo=""

	case "$url" in
		git@github.com:*)
			repo="${url#git@github.com:}"
			;;
		https://github.com/*)
			repo="${url#https://github.com/}"
			;;
		ssh://git@github.com/*)
			repo="${url#ssh://git@github.com/}"
			;;
	esac

	repo="${repo%.git}"
	if [ -n "$repo" ]; then
		printf '%s\n' "$repo"
	fi
}

export SYMPHONY_SOURCE_REPO_URL="${SYMPHONY_SOURCE_REPO_URL:-$(git -C "$repo_root" remote get-url origin)}"
if [ -z "${SYMPHONY_GITHUB_REPO:-}" ]; then
	SYMPHONY_GITHUB_REPO="$(derive_github_repo "$SYMPHONY_SOURCE_REPO_URL")"
	export SYMPHONY_GITHUB_REPO
fi
export SYMPHONY_WORKSPACE_ROOT="${SYMPHONY_WORKSPACE_ROOT:-/tmp/symphony-workspaces}"
if [ -z "${SYMPHONY_ENV_LOCAL_SOURCE:-}" ] && [ -f "$repo_root/.env.local" ]; then
	export SYMPHONY_ENV_LOCAL_SOURCE="$repo_root/.env.local"
fi

upstream_repo="${SYMPHONY_UPSTREAM_REPO:-https://github.com/openai/symphony.git}"
upstream_ref="${SYMPHONY_UPSTREAM_REF:-main}"
upstream_dir="$(resolve_repo_path "${SYMPHONY_UPSTREAM_DIR:-${SYMPHONY_DIR:-.tmp/symphony/openai-symphony}}")"
runtime_dir="$(resolve_repo_path "${SYMPHONY_RUNTIME_DIR:-.tmp/symphony/runtime}")"
runtime_workflow="$runtime_dir/WORKFLOW.md"
logs_root="$runtime_dir/log"

if [ -e "$upstream_dir" ] && [ ! -d "$upstream_dir/.git" ]; then
	echo "SYMPHONY_UPSTREAM_DIR exists but is not a git clone: $upstream_dir" >&2
	exit 1
fi

if [ ! -d "$upstream_dir/.git" ]; then
	mkdir -p "$(dirname "$upstream_dir")"
	git clone --depth 1 "$upstream_repo" "$upstream_dir"
else
	git -C "$upstream_dir" remote set-url origin "$upstream_repo"
fi

git -C "$upstream_dir" reset --hard
git -C "$upstream_dir" clean -fdx
git -C "$upstream_dir" fetch --depth 1 origin "$upstream_ref"
git -C "$upstream_dir" checkout --detach FETCH_HEAD
git -C "$upstream_dir" reset --hard FETCH_HEAD
git -C "$upstream_dir" clean -fdx

export SYMPHONY_ELIXIR_DIR="$upstream_dir/elixir"
if [ ! -d "$SYMPHONY_ELIXIR_DIR" ]; then
	echo "Upstream Symphony Elixir directory is missing: $SYMPHONY_ELIXIR_DIR" >&2
	exit 1
fi

mkdir -p "$runtime_dir" "$logs_root"
sed "s/__SYMPHONY_LINEAR_PROJECT_SLUG__/$SYMPHONY_LINEAR_PROJECT_SLUG/g" \
	"$repo_root/WORKFLOW.md" > "$runtime_workflow"

cd "$SYMPHONY_ELIXIR_DIR"
mise trust
mise install
mise exec -- mix setup
mise exec -- mix build

if [ ! -x ./bin/symphony ]; then
	echo "Upstream Symphony build did not produce ./bin/symphony" >&2
	exit 1
fi

exec mise exec -- ./bin/symphony \
	"$runtime_workflow" \
	--i-understand-that-this-will-be-running-without-the-usual-guardrails \
	--logs-root "$logs_root" \
	"$@"
