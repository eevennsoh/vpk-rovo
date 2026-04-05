const test = require("node:test");
const assert = require("node:assert/strict");

const {
	classifyRovoAppTurnMode,
	getLatestVisibleRovoAppUserPrompt,
	hasPendingRovoAppStructuredContinuation,
} = require("./rovo-app-turn-mode.ts");

function createTextMessage(role, text, metadata = undefined) {
	return {
		id: `${role}-${text}`,
		role,
		parts: [{ type: "text", text }],
		metadata,
	};
}

test("classifyRovoAppTurnMode recognizes greetings as plain chat", () => {
	assert.equal(
		classifyRovoAppTurnMode({
			prompt: "hello",
			hasActiveArtifact: false,
			hasAttachments: false,
			hasPendingStructuredContinuation: false,
			hasStreamingArtifact: false,
			hasStructuredTurnBody: false,
			isPlanMode: false,
			isVoiceTurn: false,
		}),
		"plain_chat"
	);
});

test("classifyRovoAppTurnMode recognizes pure factual questions as plain chat", () => {
	assert.equal(
		classifyRovoAppTurnMode({
			prompt: "what is React?",
			hasActiveArtifact: false,
			hasAttachments: false,
			hasPendingStructuredContinuation: false,
			hasStreamingArtifact: false,
			hasStructuredTurnBody: false,
			isPlanMode: false,
			isVoiceTurn: false,
		}),
		"plain_chat"
	);
});

test("classifyRovoAppTurnMode keeps build-oriented prompts on the rich path", () => {
	assert.equal(
		classifyRovoAppTurnMode({
			prompt: "build a login page",
			hasActiveArtifact: false,
			hasAttachments: false,
			hasPendingStructuredContinuation: false,
			hasStreamingArtifact: false,
			hasStructuredTurnBody: false,
			isPlanMode: false,
			isVoiceTurn: false,
		}),
		"rich_chat"
	);
});

test("classifyRovoAppTurnMode keeps active artifact turns on the rich path", () => {
	assert.equal(
		classifyRovoAppTurnMode({
			prompt: "what is React?",
			hasActiveArtifact: true,
			hasAttachments: false,
			hasPendingStructuredContinuation: false,
			hasStreamingArtifact: false,
			hasStructuredTurnBody: false,
			isPlanMode: false,
			isVoiceTurn: false,
		}),
		"rich_chat"
	);
});

test("classifyRovoAppTurnMode keeps ambiguous short follow-ups as unknown", () => {
	assert.equal(
		classifyRovoAppTurnMode({
			prompt: "Apple the company",
			hasActiveArtifact: false,
			hasAttachments: false,
			hasPendingStructuredContinuation: false,
			hasStreamingArtifact: false,
			hasStructuredTurnBody: false,
			isPlanMode: false,
			isVoiceTurn: false,
		}),
		"unknown"
	);
});

test("getLatestVisibleRovoAppUserPrompt skips hidden user messages", () => {
	const result = getLatestVisibleRovoAppUserPrompt([
		createTextMessage("user", "hidden", { visibility: "hidden" }),
		createTextMessage("user", "visible"),
	]);

	assert.equal(result?.text, "visible");
	assert.equal(result?.hasAttachments, false);
});

test("getLatestVisibleRovoAppUserPrompt reports attachments", () => {
	const result = getLatestVisibleRovoAppUserPrompt([
		{
			id: "user-file",
			role: "user",
			parts: [
				{ type: "text", text: "see attached" },
				{ type: "file", mediaType: "text/plain", filename: "note.txt", url: "/note.txt" },
			],
		},
	]);

	assert.equal(result?.text, "see attached");
	assert.equal(result?.hasAttachments, true);
});

test("hasPendingRovoAppStructuredContinuation detects unresolved question cards", () => {
	const messages = [
		createTextMessage("user", "Create me a page about Apple"),
		{
			id: "assistant-question",
			role: "assistant",
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "question-card",
						payload: {
							type: "question-card",
							sessionId: "session-1",
							round: 1,
							maxRounds: 3,
							title: "Clarify",
							requiredCount: 1,
							questions: [
								{
									id: "subject",
									label: "Which Apple?",
									required: true,
									kind: "single-select",
									options: [
										{ id: "company", label: "Apple the company" },
									],
								},
							],
						},
					},
				},
			],
		},
		createTextMessage("user", "Apple the company"),
	];

	assert.equal(hasPendingRovoAppStructuredContinuation(messages), true);
});

test("hasPendingRovoAppStructuredContinuation detects unresolved plan widgets", () => {
	const messages = [
		createTextMessage("user", "help me plan this"),
		{
			id: "assistant-plan",
			role: "assistant",
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "plan",
						payload: {
							title: "Team settings",
							tasks: [
								{ id: "task-1", label: "Design settings model" },
							],
						},
					},
				},
			],
		},
		createTextMessage("user", "continue"),
	];

	assert.equal(hasPendingRovoAppStructuredContinuation(messages), true);
});
