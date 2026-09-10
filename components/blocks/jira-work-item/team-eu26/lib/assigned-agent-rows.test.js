const assert = require("node:assert/strict");
const { join } = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const MODULE_PATH = join(__dirname, "assigned-agent-rows.ts");

let rowsPromise;
function loadRows() {
	if (!rowsPromise) {
		rowsPromise = esbuild
			.build({
				entryPoints: [MODULE_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				loader: { ".css": "empty" },
				tsconfig: join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"assigned-agent-rows-harness.cjs",
			));
	}
	return rowsPromise;
}

function session(overrides = {}) {
	return {
		id: "session-1",
		agentId: "claude-code",
		agentName: "Claude Code",
		status: "running",
		command: "/plan",
		previewText: "",
		steps: [],
		progress: 0,
		messages: [],
		startedAtMs: 0,
		scriptId: "script-1",
		scriptCursor: 0,
		stepElapsedMs: 0,
		resumedFromWait: false,
		order: 0,
		...overrides,
	};
}

test("resolveAssignedAgentRows keeps only agents and preserves member order", async () => {
	const { resolveAssignedAgentRows } = await loadRows();

	const rows = resolveAssignedAgentRows(
		[
			{ id: "claude-code", name: "Claude Code", kind: "agent", brandName: "anthropic" },
			{ id: "Venn", name: "Venn", kind: "person", avatarUrl: "/avatar-user/venn/venn.png" },
			{ id: "code-planner", name: "Code Planner", kind: "agent", avatarUrl: "/1p/rovo.png" },
		],
		[session({ status: "waiting" })],
	);

	assert.deepEqual(rows.map((row) => row.agentId), ["claude-code", "code-planner"]);
	assert.equal(rows[0].name, "Claude Code");
	assert.equal(rows[0].brandName, "anthropic");
	assert.equal(rows[0].avatarSrc, undefined);
	assert.equal(Object.hasOwn(rows[0], "avatarSrc"), false);
	assert.equal(rows[1].avatarSrc, "/1p/rovo.png");
	assert.equal(Object.hasOwn(rows[1], "brandName"), false);
});

test("resolveAssignedAgentRows takes the last matching session and its status", async () => {
	const { resolveAssignedAgentRows } = await loadRows();

	const [row] = resolveAssignedAgentRows(
		[{ id: "claude-code", name: "Claude Code", kind: "agent" }],
		[
			session({ id: "session-early", status: "running" }),
			session({ id: "session-other", agentId: "code-planner", status: "completed" }),
			session({ id: "session-late", status: "waiting" }),
		],
	);

	assert.equal(row.session.id, "session-late");
	assert.equal(row.statusLabel, "Needs input");
	assert.equal(row.statusKind, "needs-input");
});

test("resolveAssignedAgentRows still labels agents that have no session", async () => {
	const { resolveAssignedAgentRows } = await loadRows();

	const [finished, unstarted] = resolveAssignedAgentRows(
		[
			{ id: "readiness-checker", name: "Readiness Checker", kind: "agent" },
			{ id: "new-agent", name: "New Agent", kind: "agent" },
		],
		[],
		[{
			kind: "changed-files",
			actor: { id: "static-readiness-checker" },
			sessionItem: { state: "complete" },
		}],
	);

	assert.equal(finished.session, undefined);
	assert.equal(Object.hasOwn(finished, "session"), false);
	assert.equal(finished.statusLabel, "Finished");
	assert.equal(finished.statusKind, "finished");
	// Documented weak default: an assigned agent with no history reads as Working.
	assert.equal(unstarted.session, undefined);
	assert.equal(unstarted.statusLabel, "Working");
	assert.equal(unstarted.statusKind, "working");
});

test("resolveUsedAgentIds lists distinct directory agents and skips skills", async () => {
	const { resolveLatestAgentSession, resolveUsedAgentIds } = await loadRows();

	assert.deepEqual(
		resolveUsedAgentIds([
			session({ agentId: "claude-code" }),
			session({ id: "session-skill", agentId: "skill:plan", agentName: "Rovo" }),
			session({ id: "session-2", agentId: "code-planner" }),
			session({ id: "session-3", agentId: "claude-code", status: "completed" }),
		]),
		["claude-code", "code-planner"],
	);
	assert.equal(
		resolveLatestAgentSession(
			[
				session({ id: "session-early" }),
				session({ id: "session-late", status: "waiting" }),
			],
			"claude-code",
		)?.id,
		"session-late",
	);
	assert.equal(resolveLatestAgentSession([session()], "missing"), undefined);
});

test("resolveAssignedAgentRows returns an empty list for empty or person-only input", async () => {
	const { resolveAssignedAgentRows } = await loadRows();

	assert.deepEqual(resolveAssignedAgentRows([], []), []);
	assert.deepEqual(
		resolveAssignedAgentRows([{ id: "Venn", name: "Venn", kind: "person" }], [session()]),
		[],
	);
});
