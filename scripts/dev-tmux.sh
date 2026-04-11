#!/usr/bin/env bash

set -euo pipefail

# Mirror the non-tmux launcher by seeding .env.local from the example when
# needed before loading environment overrides.
if [ ! -f .env.local ] && [ -f .env.local.example ]; then
	cp .env.local.example .env.local
	echo "[tmux] Created .env.local from .env.local.example"
fi

# Load .env.local if it exists
if [ -f .env.local ]; then
	set -a
	# shellcheck disable=SC1091
	source .env.local
	set +a
fi

WINDOW_NAME="ports"
POOL_SIZE="${ROVODEV_POOL_SIZE:-6}"
: "${ROVODEV_BILLING_URL:?ROVODEV_BILLING_URL is not set in .env.local}"
REPO_ROOT="$(pwd)"

PORT_FILE=".dev-rovodev-port"
PORTS_FILE=".dev-rovodev-ports"
FRONTEND_PORT_FILE=".dev-frontend-port"
BACKEND_PORT_FILE=".dev-backend-port"

if ! [[ "$POOL_SIZE" =~ ^[0-9]+$ ]]; then
	echo "ROVODEV_POOL_SIZE must be an integer >= 1 (current: $POOL_SIZE)"
	exit 1
fi

if [[ "$POOL_SIZE" -lt 1 ]]; then
	echo "ROVODEV_POOL_SIZE must be >= 1 (current: $POOL_SIZE)"
	exit 1
fi

resolve_session_name() {
	node - <<'NODE'
const { getWorktreeName } = require("./scripts/lib/worktree-ports");

const sanitizeToken = (value, fallback) => {
	const normalized = String(value ?? "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");

	return normalized.length > 0 ? normalized : fallback;
};

const explicitName = process.env.ROVODEV_TMUX_SESSION;
if (typeof explicitName === "string" && explicitName.trim().length > 0) {
	process.stdout.write(explicitName.trim());
	process.exit(0);
}

const prefix = sanitizeToken(process.env.ROVODEV_TMUX_SESSION_PREFIX || "vpk-dev", "vpk-dev");
const worktree = sanitizeToken(getWorktreeName() || "main", "main");
process.stdout.write(`${prefix}-${worktree}`);
NODE
}

SESSION_NAME="$(resolve_session_name)"

prepare_port_files() {
	node - <<'NODE' "$POOL_SIZE"
const fs = require("node:fs");
const { getRovodevBasePort } = require("./scripts/lib/worktree-ports");
const { findAvailableRovodevPorts } = require("./scripts/lib/dev-tmux-ports");

const poolSize = Number.parseInt(process.argv[2], 10);
const basePort = getRovodevBasePort();
const maxTries = Number.parseInt(process.env.PORT_SEARCH_MAX ?? "20", 10);

if (!Number.isFinite(poolSize) || poolSize < 1) {
	console.error(`Invalid ROVODEV_POOL_SIZE: ${process.argv[2]}`);
	process.exit(1);
}

const run = async () => {
	const ports = await findAvailableRovodevPorts({ basePort, poolSize, maxTries });

	fs.writeFileSync(".dev-rovodev-port", String(ports[0]));
	fs.writeFileSync(".dev-rovodev-ports", JSON.stringify(ports));

	if (ports.length === 1 && ports[0] !== basePort) {
		console.log(`[tmux] Reserved RovoDev port ${basePort} is busy. Using ${ports[0]} instead.`);
		return;
	}

	if (ports[0] !== basePort) {
		console.log(`[tmux] Reserved RovoDev port ${basePort} is busy. Using: ${ports.join(", ")}`);
		return;
	}

	console.log(`[tmux] RovoDev pool ports: ${ports.join(", ")}`);
};

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
NODE
}

cleanup_port_files() {
	rm -f "$PORT_FILE" "$PORTS_FILE"
}

cleanup_worktree_listeners() {
	node ./scripts/cleanup-worktree-listeners.js
}

resolve_rovodev_ports() {
	node - <<'NODE'
const fs = require("node:fs");

if (fs.existsSync(".dev-rovodev-ports")) {
	try {
		const parsed = JSON.parse(fs.readFileSync(".dev-rovodev-ports", "utf8").trim());
		if (Array.isArray(parsed) && parsed.length > 0) {
			process.stdout.write(parsed.join(" "));
			process.exit(0);
		}
	} catch {
		// fall through to single-port file
	}
}

if (fs.existsSync(".dev-rovodev-port")) {
	process.stdout.write(fs.readFileSync(".dev-rovodev-port", "utf8").trim());
}
NODE
}

resolve_frontend_backend_ports() {
	node - <<'NODE'
const fs = require("node:fs");
const { getPortInfo } = require("./scripts/lib/worktree-ports");

const info = getPortInfo();
const frontend = fs.existsSync(".dev-frontend-port")
	? fs.readFileSync(".dev-frontend-port", "utf8").trim()
	: String(info.frontendBase);
const backend = fs.existsSync(".dev-backend-port")
	? fs.readFileSync(".dev-backend-port", "utf8").trim()
	: String(info.backendBase);

process.stdout.write(`${frontend} ${backend}`);
NODE
}

wait_for_rovodev_health() {
	node - <<'NODE' "$@"
const { waitForRovodevPortsHealthy } = require("./scripts/lib/dev-tmux-ports");

const ports = process.argv
	.slice(2)
	.map((value) => Number.parseInt(value, 10))
	.filter((value) => Number.isFinite(value) && value > 0);

if (ports.length === 0) {
	process.exit(0);
}

const maxAttempts = Number.parseInt(
	process.env.ROVODEV_HEALTHCHECK_MAX_ATTEMPTS ?? "60",
	10
);
const intervalMs = Number.parseInt(
	process.env.ROVODEV_HEALTHCHECK_INTERVAL_MS ?? "1000",
	10
);

const run = async () => {
	console.log(`[tmux] Waiting for RovoDev ports to become healthy: ${ports.join(", ")}`);
	await waitForRovodevPortsHealthy({
		ports,
		maxAttempts,
		intervalMs,
	});
	console.log(`[tmux] RovoDev ports healthy: ${ports.join(", ")}`);
};

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
NODE
}

apply_window_styling() {
	local frontend_port backend_port ports_pair
	ports_pair="$(resolve_frontend_backend_ports)"
	frontend_port="${ports_pair%% *}"
	backend_port="${ports_pair##* }"
	local pane_border_format

	tmux set-window-option -t "$SESSION_NAME:$WINDOW_NAME" pane-border-status top
	tmux set-window-option -t "$SESSION_NAME:$WINDOW_NAME" pane-border-style "fg=colour238"
	tmux set-window-option -t "$SESSION_NAME:$WINDOW_NAME" pane-active-border-style "fg=colour39"

	pane_border_format="#{?#{==:#{pane_index},0},#[fg=green,bold] #{pane_title},#{?#{==:#{pane_index},1},#[fg=yellow,bold] #{pane_title},#[fg=cyan,bold] rovodev:#{pane_title}}}#[default]"
	tmux set-window-option -t "$SESSION_NAME:$WINDOW_NAME" pane-border-format "$pane_border_format"

	tmux select-pane -t "$SESSION_NAME:$WINDOW_NAME.0" -T "frontend:${frontend_port}" 2>/dev/null || true
	tmux select-pane -t "$SESSION_NAME:$WINDOW_NAME.1" -T "backend:${backend_port}" 2>/dev/null || true

	if [[ -f "$PORTS_FILE" || -f "$PORT_FILE" ]]; then
		local rovodev_ports_raw
		local -a rovodev_ports
		rovodev_ports_raw="$(resolve_rovodev_ports)"
		if [[ -n "$rovodev_ports_raw" ]]; then
			read -r -a rovodev_ports <<<"$rovodev_ports_raw"
		fi
		for index in "${!rovodev_ports[@]}"; do
			local pane
			local port
			pane=$((index + 2))
			port="${rovodev_ports[$index]}"
			tmux select-pane -t "$SESSION_NAME:$WINDOW_NAME.$pane" -T "$port" 2>/dev/null || true
		done
	fi
}

start_session() {
	if ! command -v tmux >/dev/null 2>&1; then
		echo "tmux is not installed. Install tmux first."
		exit 1
	fi

	if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
		# Ensure port files exist even when reattaching — they may have been
		# cleaned up by a prior stop or lost across restarts while the tmux
		# session (and its RovoDev processes) kept running.
		if [[ ! -f "$PORT_FILE" || ! -f "$PORTS_FILE" ]]; then
			prepare_port_files
		fi
		apply_window_styling
		echo "Session '$SESSION_NAME' already exists. Attaching..."
		exec tmux attach -t "$SESSION_NAME"
	fi

	cleanup_worktree_listeners
	prepare_port_files

	local rovodev_ports_raw
	local -a rovodev_ports
	rovodev_ports_raw="$(resolve_rovodev_ports)"
	if [[ -z "$rovodev_ports_raw" ]]; then
		echo "No RovoDev ports were reserved."
		exit 1
	fi
	read -r -a rovodev_ports <<<"$rovodev_ports_raw"
	if [[ "${#rovodev_ports[@]}" -ne "$POOL_SIZE" ]]; then
		echo "Expected $POOL_SIZE reserved RovoDev ports, found ${#rovodev_ports[@]}."
		exit 1
	fi

	local frontend_port backend_port ports_pair
	ports_pair="$(resolve_frontend_backend_ports)"
	frontend_port="${ports_pair%% *}"
	backend_port="${ports_pair##* }"

	echo "[tmux] Frontend port: ${frontend_port}"
	echo "[tmux] Backend port: ${backend_port}"
	echo "[tmux] RovoDev ports: ${rovodev_ports[*]}"

	tmux new-session -d -s "$SESSION_NAME" -n "$WINDOW_NAME"

	local total_panes
	total_panes=$((POOL_SIZE + 2))

	for _ in $(seq 1 $((total_panes - 1))); do
		tmux split-window -t "$SESSION_NAME:$WINDOW_NAME"
		tmux select-layout -t "$SESSION_NAME:$WINDOW_NAME" tiled
	done

	tmux set-option -t "$SESSION_NAME" remain-on-exit on
	apply_window_styling

	for index in $(seq 0 $((POOL_SIZE - 1))); do
		pane=$((index + 2))
		port="${rovodev_ports[$index]}"
		tmux select-pane -t "$SESSION_NAME:$WINDOW_NAME.$pane" -T "$port"
		cmd="cd \"$REPO_ROOT\" && node scripts/dev-rovodev-port.js \"$port\""
		tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.$pane" "$cmd" C-m
	done

	wait_for_rovodev_health "${rovodev_ports[@]}"

	tmux select-pane -t "$SESSION_NAME:$WINDOW_NAME.0" -T "frontend:${frontend_port}"
	tmux select-pane -t "$SESSION_NAME:$WINDOW_NAME.1" -T "backend:${backend_port}"
	tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.1" "cd \"$REPO_ROOT\" && VPK_TMUX_OWNED=1 pnpm run dev:backend" C-m
	tmux send-keys -t "$SESSION_NAME:$WINDOW_NAME.0" "cd \"$REPO_ROOT\" && VPK_TMUX_OWNED=1 pnpm run dev:frontend" C-m

	tmux select-layout -t "$SESSION_NAME:$WINDOW_NAME" tiled
	tmux select-pane -t "$SESSION_NAME:$WINDOW_NAME.0"

	echo "Session '$SESSION_NAME' started with $total_panes panes (frontend, backend, $POOL_SIZE rovodev ports)."
	echo "Attach with: tmux attach -t $SESSION_NAME"
	exec tmux attach -t "$SESSION_NAME"
}

stop_session() {
	if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
		tmux kill-session -t "$SESSION_NAME"
		echo "Stopped tmux session '$SESSION_NAME'."
	else
		echo "No tmux session named '$SESSION_NAME' found."
	fi

	cleanup_worktree_listeners
	cleanup_port_files
	echo "Removed $PORT_FILE and $PORTS_FILE."
}

style_session() {
	if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
		apply_window_styling
		echo "Applied pane styling to '$SESSION_NAME:$WINDOW_NAME'."
		return
	fi

	echo "No tmux session named '$SESSION_NAME' found."
	exit 1
}

attach_session() {
	if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
		apply_window_styling
		exec tmux attach -t "$SESSION_NAME"
	fi

	echo "No tmux session named '$SESSION_NAME' found."
	exit 1
}

status_session() {
	echo "Session: $SESSION_NAME"
	if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
		echo "tmux: running"
		tmux list-panes -t "$SESSION_NAME:$WINDOW_NAME" -F "pane #{pane_index}: #{pane_current_command} (#{pane_dead_status})"
	else
		echo "tmux: stopped"
	fi

	if [[ -f "$PORT_FILE" ]]; then
		echo "$PORT_FILE: $(cat "$PORT_FILE")"
	else
		echo "$PORT_FILE: missing"
	fi

	if [[ -f "$PORTS_FILE" ]]; then
		echo "$PORTS_FILE: $(cat "$PORTS_FILE")"
	else
		echo "$PORTS_FILE: missing"
	fi

}

usage() {
	echo "Usage: $0 [--] [start|stop|attach|style|status] [pool-size]"
	echo ""
	echo "Session resolution:"
	echo "  ROVODEV_TMUX_SESSION          Exact tmux session name override"
	echo "  ROVODEV_TMUX_SESSION_PREFIX   Prefix for auto-generated name (default: vpk-dev)"
	echo ""
	echo "Examples:"
	echo "  pnpm run rovodev:tmux:start"
	echo "  pnpm run rovodev:tmux:start -- 6"
	echo "  pnpm run rovodev:tmux:start --1"
	echo "  pnpm run rovodev:tmux:stop"
	echo ""
	echo "Commands:"
	echo "  start   Start or attach tmux 8-pane dev session (default)"
	echo "  stop    Stop tmux session and remove rovodev port files"
	echo "  attach  Attach to existing tmux session"
	echo "  style   Apply pane styling to existing session"
	echo "  status  Show tmux and port-file status"
}

if [[ "${1:-}" == "--" ]]; then
	shift
fi

command="start"
if [[ $# -gt 0 ]]; then
	case "${1:-}" in
		start|stop|attach|style|status|-h|--help|help)
			command="$1"
			shift
			;;
	esac
fi

if [[ $# -gt 0 ]]; then
	case "${1:-}" in
		--[0-9]*)
			POOL_SIZE="${1#--}"
			shift
			;;
		[0-9]*)
			POOL_SIZE="$1"
			shift
			;;
	esac
fi

if [[ $# -gt 0 ]]; then
	echo "Unknown extra arguments: $*"
	usage
	exit 1
fi

case "$command" in
	start)
		start_session
		;;
	stop)
		stop_session
		;;
	attach)
		attach_session
		;;
	style)
		style_session
		;;
	status)
		status_session
		;;
	-h|--help|help)
		usage
		;;
	*)
		echo "Unknown command: $command"
		usage
		exit 1
		;;
esac
