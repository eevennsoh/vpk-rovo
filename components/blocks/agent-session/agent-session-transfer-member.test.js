const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

/**
 * The three hops the invoker has to survive live in three packages and all
 * import through the `@/` alias, so the suite bundles the whole chain once.
 */
let chainPromise;

function loadTransferChain() {
	chainPromise ??= (async () => {
		const result = await esbuild.build({
			stdin: {
				contents: `
					export { toSessionTransferMember } from "./components/blocks/agent-session/agent-session-transfer-member.ts";
					export { toSessionFusionDrop } from "./components/blocks/jira-kanban/experimental/lib/session-fusion-overlay-state.ts";
					export { toJiraLinkingCohort } from "./components/blocks/jira-linking/drop-cohort.ts";
				`,
				loader: "ts",
				resolveDir: process.cwd(),
				sourcefile: "agent-session-transfer-member-harness.ts",
			},
			bundle: true,
			format: "cjs",
			loader: {
				".css": "empty",
			},
			platform: "node",
			tsconfig: path.join(process.cwd(), "tsconfig.json"),
			write: false,
		});

		return loadCjsModuleFromText(result.outputFiles[0].text);
	})();

	return chainPromise;
}

const ANNIE = { avatarSrc: "/3p/annie.png", name: "Annie Chen" };

function session(overrides = {}) {
	return {
		agent: { brandName: "claude", id: "claude", kind: "agent", name: "Claude" },
		host: "local",
		id: "lw-a",
		sessionDetails: { host: "local", issueSummary: "Webhook gap" },
		state: "complete",
		title: "Investigate webhook retries",
		...overrides,
	};
}

/** Attach proximity is what makes `toSessionFusionDrop` produce a release. */
const ATTACH_PROXIMITY = {
	bounds: { bottom: 240, left: 100, right: 340, top: 200 },
	cardCode: "PAY-101",
};

test("a published transfer member carries the human who invoked the session", async () => {
	const { toSessionTransferMember } = await loadTransferChain();
	const member = toSessionTransferMember(session({ invokedBy: ANNIE }));

	assert.equal(member.id, "lw-a");
	assert.equal(member.name, "Claude");
	assert.equal(member.invoker, ANNIE);
	// The deterministic fallback tint still comes from the brand, not the human.
	assert.equal(typeof member.tintSeed, "string");
});

test("a session with no invoker publishes an agent-only member", async () => {
	const { toSessionTransferMember } = await loadTransferChain();

	assert.equal(toSessionTransferMember(session()).invoker, undefined);
});

test("the invoker survives drag publish, fusion drop, and cohort rebuild", async () => {
	const { toJiraLinkingCohort, toSessionFusionDrop, toSessionTransferMember } =
		await loadTransferChain();

	// The exact path a board drop takes: the drag host publishes transfer
	// members, the fusion overlay turns them into drop members, and the flight
	// and glow chips rebuild an `AgentSessionItem` cohort from those. Losing
	// `invoker` anywhere in here degrades the post-drop chip from
	// "Claude with Annie Chen" to a bare hexagon the instant the pointer lifts.
	const release = toSessionFusionDrop({
		from: { x: 10, y: 20 },
		id: 1,
		members: [
			toSessionTransferMember(session({ invokedBy: ANNIE })),
			toSessionTransferMember(session({ id: "lw-b" })),
		],
		proximity: ATTACH_PROXIMITY,
	});

	assert.ok(release !== null, "attach proximity should produce a release");
	assert.equal(release.drop.members[0].invoker, ANNIE);
	assert.equal(release.drop.members[1].invoker, undefined);

	const cohort = toJiraLinkingCohort(release.drop.members);
	assert.equal(cohort.members[0].invokedBy, ANNIE);
	assert.equal(cohort.members[1].invokedBy, undefined);
});
