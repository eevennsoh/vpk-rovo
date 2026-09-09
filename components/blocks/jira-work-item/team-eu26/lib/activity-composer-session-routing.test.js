const assert = require("node:assert/strict");
const test = require("node:test");

async function loadRouting() {
	return import("./activity-composer-session-routing.ts");
}

function session(overrides = {}) {
	return {
		id: "session-1",
		agentId: "agent-one",
		agentName: "Agent One",
		status: "running",
		...overrides,
	};
}

function routableSessions() {
	return [
		session({ id: "agent-one-earlier" }),
		session({ id: "agent-two-completed", agentId: "agent-two", agentName: "Agent Two", status: "completed" }),
		session({ id: "agent-one-latest", status: "waiting" }),
		session({ id: "summarize-earlier", agentId: "skill:summarize", agentName: "Rovo", title: "Summarize comments" }),
		session({ id: "summarize-latest", agentId: "skill:summarize", agentName: "Rovo", title: "Summarize comments", status: "waiting" }),
	];
}

test("steers only the latest active session for each named agent and skill token", async () => {
	const { findSteeredWorkingSessions } = await loadRouting();

	const steered = findSteeredWorkingSessions(
		routableSessions(),
		"@Agent One and /Summarize comments receive this.",
	);

	assert.deepEqual(steered.map((entry) => entry.id), ["summarize-latest", "agent-one-latest"]);
});

test("steers nothing when agent and skill tokens lack word boundaries", async () => {
	const { findSteeredWorkingSessions } = await loadRouting();

	// No valid token anywhere in the draft, so a regression to plain substring
	// matching has to surface here rather than being masked by a valid mention
	// of the same session.
	const steered = findSteeredWorkingSessions(
		routableSessions(),
		"email@Agent One and /Summarize commentsLater stay plain text.",
	);

	assert.deepEqual(steered.map((entry) => entry.id), []);
});

test("steers no session whose work already finished, even when explicitly named", async () => {
	const { findSteeredWorkingSessions } = await loadRouting();

	// Agent Two is mentioned with valid boundaries and is excluded only by its
	// status; Agent One is the positive control proving the draft routes at all.
	const steered = findSteeredWorkingSessions(
		routableSessions(),
		"@Agent Two and @Agent One, please continue.",
	);

	assert.deepEqual(steered.map((entry) => entry.id), ["agent-one-latest"]);
});
