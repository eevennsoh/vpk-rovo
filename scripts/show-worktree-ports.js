#!/usr/bin/env node
/**
 * Show active port assignments + Portless URLs for git worktrees.
 *
 * Usage:
 *   node scripts/show-worktree-ports.js          one-shot snapshot
 *   node scripts/show-worktree-ports.js watch    live dashboard (1s tick, Ctrl+C to exit)
 *
 * Main worktree is always shown. Other worktrees are shown only when they
 * have at least one of .dev-frontend-port / .dev-backend-port / .dev-rovo-port
 * or .dev-rovo-ports.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Worker } = require("node:worker_threads");
const { getAllWorktreePortInfo } = require("./lib/worktree-ports");
const { probePortAlive } = require("./lib/port-liveness");

const SEPARATOR = "━".repeat(70);
const WATCH_INTERVAL_MS = 1000;
const TICK_INTERVAL_MS = 120;
const TICKS_PER_DATA_REFRESH = Math.max(1, Math.round(WATCH_INTERVAL_MS / TICK_INTERVAL_MS));
const SPINNER_FRAMES = ["⠴", "⠦", "⠲", "⠖"];

const SNAPSHOT_WORKER_SCRIPT = `
const { parentPort } = require("node:worker_threads");
const { getAllWorktreePortInfo } = require(${JSON.stringify(path.join(__dirname, "lib", "worktree-ports.js"))});
parentPort.on("message", () => {
	try {
		parentPort.postMessage({ ok: true, data: getAllWorktreePortInfo() });
	} catch (error) {
		parentPort.postMessage({ ok: false, message: error.message });
	}
});
`;

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

function readRovoPorts(worktreePath) {
	const poolText = readPortFile(worktreePath, ".dev-rovo-ports");
	if (poolText) {
		try {
			const parsed = JSON.parse(poolText);
			if (
				Array.isArray(parsed) &&
				parsed.length > 0 &&
				parsed.every((port) => Number.isInteger(port) && port > 0)
			) {
				return parsed.map(String);
			}
		} catch {
			// Fall back to the legacy single-port file.
		}
	}

	const single = readPortFile(worktreePath, ".dev-rovo-port");
	return single ? [single] : [];
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

async function probeOrNull(port) {
	if (!port) return null;
	const alive = await probePortAlive(port);
	return alive ? port : null;
}

async function collectWorktreeRows(worktrees, routes) {
	return Promise.all(
		worktrees.map(async (wt) => {
			const recordedFrontend = readPortFile(wt.path, ".dev-frontend-port");
			const recordedBackend = readPortFile(wt.path, ".dev-backend-port");
			const recordedRovo = readRovoPorts(wt.path);

			const [runningFrontend, runningBackend, runningRovoPorts] = await Promise.all([
				probeOrNull(recordedFrontend),
				probeOrNull(recordedBackend),
				Promise.all(recordedRovo.map(probeOrNull)).then((results) =>
					results.filter((value) => value !== null),
				),
			]);

			const runningRovo = runningRovoPorts.length > 0 ? runningRovoPorts.join(", ") : null;
			const hasRecordedPorts = Boolean(
				recordedFrontend || recordedBackend || recordedRovo.length > 0,
			);
			const isRunning = Boolean(runningFrontend || runningBackend || runningRovo);
			return {
				wt,
				name: path.basename(wt.path),
				isMain: Boolean(wt.isMain),
				hasRecordedPorts,
				isRunning,
				runningFrontend,
				runningBackend,
				runningRovo,
				portlessUrl: findPortlessUrl(routes, runningFrontend),
			};
		}),
	);
}

function filterRowsForDisplay(rows) {
	return rows.filter((row) => row.isMain || row.hasRecordedPorts);
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
			runningRovo,
			portlessUrl,
		} = row;
		const branchLabel = isMain ? "(main)" : `(${wt.branch || wt.identifier})`;
		const emoji = isMain ? "🌳" : "🪾";

		console.log(`\n${emoji} ${name} ${branchLabel}`);
		console.log(`   📂 ${wt.path}`);
		if (isRunning) {
			console.log(
				`   🔌 frontend=${runningFrontend || "—"}  backend=${runningBackend || "—"}  rovo=${runningRovo || "—"}`
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

async function snapshot() {
	const worktrees = getAllWorktreePortInfo();
	const routes = loadPortlessRoutes();
	const rows = await collectWorktreeRows(worktrees, routes);
	return filterRowsForDisplay(rows);
}

async function main() {
	let rows;
	try {
		rows = await snapshot();
	} catch (error) {
		console.error(`Failed to enumerate worktrees: ${error.message}`);
		process.exit(1);
	}
	renderRows(rows);
}

async function runWatch() {
	let frameIndex = 0;
	let tickCount = 0;
	let lastRows = [];
	let lastError = null;
	let refreshInFlight = false;

	try {
		lastRows = await snapshot();
	} catch (error) {
		lastError = error;
	}

	const worker = new Worker(SNAPSHOT_WORKER_SCRIPT, { eval: true });
	worker.on("message", async (result) => {
		if (result.ok) {
			try {
				const routes = loadPortlessRoutes();
				const rows = await collectWorktreeRows(result.data, routes);
				lastRows = filterRowsForDisplay(rows);
				lastError = null;
			} catch (error) {
				lastError = error;
			}
		} else {
			lastError = new Error(result.message);
		}
		refreshInFlight = false;
	});
	worker.on("error", (error) => {
		refreshInFlight = false;
		lastError = error;
	});

	function requestRefresh() {
		if (refreshInFlight) return;
		refreshInFlight = true;
		worker.postMessage("refresh");
	}

	function tick() {
		if (tickCount > 0 && tickCount % TICKS_PER_DATA_REFRESH === 0) {
			requestRefresh();
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
		worker.terminate();
		process.stdout.write("\n");
		process.exit(0);
	});
}

const subcommand = process.argv[2];
if (subcommand === "watch") {
	runWatch().catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
} else if (subcommand && subcommand !== "once") {
	console.error(
		`Unknown subcommand: ${subcommand}. Use \`pnpm ports\` or \`pnpm ports watch\`.`
	);
	process.exit(2);
} else {
	main().catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
}
