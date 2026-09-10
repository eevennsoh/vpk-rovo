import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { AGENT_SESSION_STATUS_LABEL, toAgentSessionMetadataSegments } from "./agent-session-long-metadata.ts";

type Segment = {
	kind: string;
	label?: string;
	isPending?: boolean;
	prStatus?: string;
};

type Input = {
	agentName: string;
	artifactLabel?: string;
	host?: "cloud" | "local";
	prStatus?: "created" | "merged" | "failed";
	state: "attention" | "complete" | "needs-input" | "running";
};

const build = toAgentSessionMetadataSegments as (input: Input) => readonly Segment[];

/** Chunk kinds in order, which is the part the renderer depends on. */
function kinds(input: Input): string[] {
	return build(input).map((segment) => segment.kind);
}

function chunk(input: Input, kind: string): Segment | undefined {
	return build(input).find((segment) => segment.kind === kind);
}

test("a fully described session reads agent, host, status, artifact, then time", () => {
	assert.deepEqual(
		kinds({
			agentName: "Claude",
			artifactLabel: "#124: Cargo retract",
			host: "local",
			prStatus: "created",
			state: "running",
		}),
		["agent", "host", "status", "artifact", "time"],
	);
});

test("agent and time are the only chunks a row always has", () => {
	// A session that declared no host and produced nothing yet still says who ran
	// it, how it is going, and when — never an empty placeholder in between.
	assert.deepEqual(kinds({ agentName: "Canva", state: "needs-input" }), ["agent", "status", "time"]);
});

test("an undeclared host stays silent rather than claiming the cloud", () => {
	// `getAgentListHost` answers "cloud" for a payload that never said, which is
	// the right default for behavior and the wrong claim to print on a card.
	assert.equal(chunk({ agentName: "Rovo", state: "complete" }, "host"), undefined);
});

test("the host chunk names the place it runs", () => {
	assert.equal(chunk({ agentName: "Claude", host: "local", state: "complete" }, "host")?.label, "Local");
	assert.equal(chunk({ agentName: "Claude", host: "cloud", state: "complete" }, "host")?.label, "Cloud");
});

test("every lifecycle state has status copy, and only the in-flight ones shimmer", () => {
	assert.deepEqual(AGENT_SESSION_STATUS_LABEL, {
		attention: "Needs attention",
		complete: "Complete",
		"needs-input": "Needs input",
		running: "Working",
	});

	const states = ["running", "needs-input", "complete", "attention"] as const;
	const pendingByState = Object.fromEntries(
		states.map((state) => [state, chunk({ agentName: "Claude", state }, "status")?.isPending]),
	);

	assert.deepEqual(pendingByState, {
		attention: false,
		complete: false,
		"needs-input": true,
		running: true,
	});
});

test("an artifact chunk needs a real label and carries a glyph status", () => {
	// An empty string is not an artifact. Rendering the chunk anyway would put a
	// pull-request glyph next to nothing at all.
	assert.equal(
		kinds({ agentName: "Claude", artifactLabel: "", state: "complete" }).includes("artifact"),
		false,
	);

	assert.equal(
		chunk({ agentName: "Claude", artifactLabel: "#124: Cargo retract", state: "complete" }, "artifact")
			?.prStatus,
		"created",
	);
	assert.equal(
		chunk(
			{ agentName: "Claude", artifactLabel: "#124: Cargo retract", prStatus: "merged", state: "complete" },
			"artifact",
		)?.prStatus,
		"merged",
	);
});

test("the builder is pure: same input, equal output, no shared mutation", () => {
	const input: Input = { agentName: "Claude", host: "cloud", state: "running" };
	const first = build(input);
	const second = build(input);

	assert.deepEqual(first, second);
	assert.notEqual(first, second);
});
