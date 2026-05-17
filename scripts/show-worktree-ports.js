#!/usr/bin/env node
/**
 * Show active port assignments + Portless URLs for git worktrees.
 *
 * Usage:
 *   node scripts/show-worktree-ports.js          one-shot snapshot
 *   node scripts/show-worktree-ports.js watch    live dashboard (1s tick, Ctrl+C to exit)
 *
 * Main worktree is always shown. Other worktrees are shown only when they
 * have at least one of .dev-frontend-port / .dev-backend-port / .dev-rovodev-port.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getAllWorktreePortInfo } = require("./lib/worktree-ports");

const SEPARATOR = "━".repeat(70);
const WATCH_INTERVAL_MS = 1000;
const TICK_INTERVAL_MS = 80;
const TICKS_PER_DATA_REFRESH = Math.max(1, Math.round(WATCH_INTERVAL_MS / TICK_INTERVAL_MS));
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function readPortFile(worktreePath, filename) {
	try {
		const portFile = path.join(worktreePath, filename);
		if (fs.existsSync(portFile)) {
			return fs.readFileSync(portFile, "utf8").trim();
		}
	} catch {
		// Ignore read errors
	}
	return null;
}

function loadPortlessRoutes() {
	try {
		const file = path.join(os.homedir(), ".portless", "routes.json");
		if (!fs.existsSync(file)) return [];
		const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function findPortlessUrl(routes, frontendPort) {
	if (!frontendPort) return null;
	const port = Number(frontendPort);
	if (!Number.isFinite(port)) return null;
	const route = routes.find((r) => r && r.port === port);
	return route?.hostname ? `https://${route.hostname}` : null;
}

function collectWorktreeRows(worktrees, routes) {
	return worktrees.map((wt) => {
		const runningFrontend = readPortFile(wt.path, ".dev-frontend-port");
		const runningBackend = readPortFile(wt.path, ".dev-backend-port");
		const runningRovodev = readPortFile(wt.path, ".dev-rovodev-port");
		const isRunning = Boolean(runningFrontend || runningBackend || runningRovodev);
		return {
			wt,
			name: path.basename(wt.path),
			isMain: Boolean(wt.isMain),
			isRunning,
			runningFrontend,
			runningBackend,
			runningRovodev,
			portlessUrl: findPortlessUrl(routes, runningFrontend),
		};
	});
}

function filterRowsForDisplay(rows) {
	return rows.filter((row) => row.isMain || row.isRunning);
}

function renderRows(rows, { headerSuffix, footer } = {}) {
	const header = headerSuffix
		? `📍 VPK Worktree Port Assignments  ${headerSuffix}`
		: "📍 VPK Worktree Port Assignments";
	console.log(`\n${header}\n`);
	console.log(SEPARATOR);

	if (rows.length === 0) {
		console.log("\nNo git worktrees found.");
	}

	for (const row of rows) {
		const {
			wt,
			name,
			isMain,
			isRunning,
			runningFrontend,
			runningBackend,
			runningRovodev,
			portlessUrl,
		} = row;
		const branchLabel = isMain ? "(main)" : `(${wt.branch || wt.identifier})`;
		const emoji = isMain ? "🌳" : "🪾";

		console.log(`\n${emoji} ${name} ${branchLabel}`);
		console.log(`   📂 ${wt.path}`);
		if (isRunning) {
			console.log(
				`   🔌 frontend=${runningFrontend || "—"}  backend=${runningBackend || "—"}  rovodev=${runningRovodev || "—"}`
			);
		} else {
			console.log("   🔌 (no active ports)");
		}
		if (portlessUrl) {
			console.log(`   🌐 ${portlessUrl}`);
		}
	}

	if (footer) {
		console.log(`\n${SEPARATOR}`);
		console.log(footer);
	} else {
		console.log(`\n${SEPARATOR}\n`);
	}
}

function snapshot() {
	const worktrees = getAllWorktreePortInfo();
	const routes = loadPortlessRoutes();
	const rows = collectWorktreeRows(worktrees, routes);
	return filterRowsForDisplay(rows);
}

function main() {
	let rows;
	try {
		rows = snapshot();
	} catch (error) {
		console.error(`Failed to enumerate worktrees: ${error.message}`);
		process.exit(1);
	}
	renderRows(rows);
}

function runWatch() {
	let frameIndex = 0;
	let tickCount = 0;
	let lastRows = [];
	let lastError = null;

	function tick() {
		if (tickCount % TICKS_PER_DATA_REFRESH === 0) {
			try {
				lastRows = snapshot();
				lastError = null;
			} catch (error) {
				lastError = error;
			}
		}
		process.stdout.write("\x1b[2J\x1b[H");
		if (lastError) {
			console.error(`Failed to enumerate worktrees: ${lastError.message}`);
		} else {
			const now = new Date().toLocaleTimeString("en-US", { hour12: false });
			const spinner = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
			renderRows(lastRows, {
				headerSuffix: `·  ${spinner} watching`,
				footer: `Last updated ${now} · Ctrl+C to exit`,
			});
		}
		frameIndex += 1;
		tickCount += 1;
	}

	tick();
	const interval = setInterval(tick, TICK_INTERVAL_MS);

	process.on("SIGINT", () => {
		clearInterval(interval);
		process.stdout.write("\n");
		process.exit(0);
	});
}

const subcommand = process.argv[2];
if (subcommand === "watch") {
	runWatch();
} else if (subcommand && subcommand !== "once") {
	console.error(
		`Unknown subcommand: ${subcommand}. Use \`pnpm ports\` or \`pnpm ports watch\`.`
	);
	process.exit(2);
} else {
	main();
}
