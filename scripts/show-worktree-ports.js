#!/usr/bin/env node
/**
 * Show port assignments for all git worktrees
 *
 * Usage: node scripts/show-worktree-ports.js
 */

const fs = require("node:fs");
const path = require("node:path");
const { getAllWorktreePortInfo } = require("./lib/worktree-ports");

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

function main() {
	console.log("\n📍 VPK Worktree Port Assignments\n");
	console.log("━".repeat(70));

	let worktrees;
	try {
		worktrees = getAllWorktreePortInfo();
	} catch (error) {
		console.error(`Failed to calculate worktree slots: ${error.message}`);
		process.exit(1);
	}

	if (worktrees.length === 0) {
		console.log("No git worktrees found.");
		return;
	}

	for (const wt of worktrees) {
		const name = path.basename(wt.path);

		// Check actual running ports
		const runningFrontend = readPortFile(wt.path, ".dev-frontend-port");
		const runningBackend = readPortFile(wt.path, ".dev-backend-port");
		const runningRovodev = readPortFile(wt.path, ".dev-rovodev-port");

		const status = runningFrontend || runningBackend || runningRovodev ? "🟢 RUNNING" : "⚪ stopped";
		const branchLabel = wt.isMain ? "(main)" : `(${wt.branch || wt.identifier})`;

		console.log(`\n${wt.isMain ? "📁" : "🌿"} ${name} ${branchLabel}`);
		console.log(`   Path: ${wt.path}`);
		console.log(`   Status: ${status}`);
		console.log(
			`   Reserved ports: frontend=${wt.frontendBase}, backend=${wt.backendBase}, rovodev=${wt.rovodevBase}`
		);

		if (runningFrontend || runningBackend || runningRovodev) {
			console.log(
				`   Active ports:   frontend=${runningFrontend || "—"}, backend=${runningBackend || "—"}, rovodev=${runningRovodev || "—"}`
			);
		}
	}

	console.log("\n" + "━".repeat(70));
	console.log("\n💡 Each active worktree gets a dedicated 20-port slot per service family.");
	console.log("   That leaves room for auto-increment and 6-port RovoDev pools without overlap.\n");
}

main();
