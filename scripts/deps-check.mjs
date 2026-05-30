#!/usr/bin/env node
// Wraps `pnpm outdated` with an explicit status line, because the bare command
// prints nothing and exits 0 when everything is current — which reads as "did
// it even run?". Run via `pnpm run deps:check`.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

function countDirectDeps() {
	try {
		const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
		return Object.keys(pkg.dependencies ?? {}).length + Object.keys(pkg.devDependencies ?? {}).length;
	} catch {
		return null;
	}
}

// `pnpm outdated` exits 1 when packages are outdated, 0 when all current —
// neither is a script failure, so capture instead of letting spawnSync throw.
const json = spawnSync("pnpm", ["outdated", "--format", "json"], { encoding: "utf8" });
if (json.error) {
	console.error("deps:check could not run `pnpm outdated`:", json.error.message);
	process.exit(1);
}

let outdated = {};
try {
	outdated = JSON.parse(json.stdout.trim() || "{}");
} catch {
	// Fall back to the human command if JSON parsing ever fails on a pnpm change.
	spawnSync("pnpm", ["outdated"], { stdio: "inherit" });
	process.exit(0);
}

const names = Object.keys(outdated);
if (names.length === 0) {
	const total = countDirectDeps();
	const scope = total ? `all ${total} direct dependencies` : "all dependencies";
	console.log(`\n✅ ${scope} are up to date — nothing in-range to update.`);
	process.exit(0);
}

// Show the readable table, then a clear count + a pointer to the update rules.
spawnSync("pnpm", ["outdated"], { stdio: "inherit" });
console.log(`\n⬆  ${names.length} package(s) have newer releases (listed above).`);
console.log("   Update per the tiers in AGENTS.md > Dependency Pinning:");
console.log("   • Float/Cautious: `pnpm update`");
console.log("   • Catalog families (tiptap, json-render, remotion): edit pnpm-workspace.yaml catalog, then `pnpm install`");
console.log("   • Locked exact deps: edit package.json, then `pnpm install`");
process.exit(0);
