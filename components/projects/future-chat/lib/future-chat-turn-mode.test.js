const test = require("node:test");
const assert = require("node:assert/strict");

const {
	classifyFutureChatTurnMode,
	getLatestVisibleFutureChatUserPrompt,
	hasPendingFutureChatStructuredContinuation,
} = require("./future-chat-turn-mode.ts");

function createTextMessage(role, text, metadata = undefined) {
	return {
		id: `${role}-${text}`,
		role,
		parts: [{ type: "text", text }],
		metadata,
	};
}

test("classifyFutureChatTurnMode recognizes greetings as plain chat", () => {
	assert.equal(
		classifyFutureChatTurnMode({
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

test("classifyFutureChatTurnMode recognizes pure factual questions as plain chat", () => {
	assert.equal(
		classifyFutureChatTurnMode({
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

test("classifyFutureChatTurnMode keeps build-oriented prompts on the rich path", () => {
	assert.equal(
		classifyFutureChatTurnMode({
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

test("classifyFutureChatTurnMode keeps active artifact turns on the rich path", () => {
	assert.equal(
		classifyFutureChatTurnMode({
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

test("classifyFutureChatTurnMode keeps ambiguous short follow-ups as unknown", () => {
	assert.equal(
		classifyFutureChatTurnMode({
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

test("getLatestVisibleFutureChatUserPrompt skips hidden user messages", () => {
	const result = getLatestVisibleFutureChatUserPrompt([
		createTextMessage("user", "hidden", { visibility: "hidden" }),
		createTextMessage("user", "visible"),
	]);

	assert.equal(result?.text, "visible");
	assert.equal(result?.hasAttachments, false);
});

test("getLatestVisibleFutureChatUserPrompt reports attachments", () => {
	const result = getLatestVisibleFutureChatUserPrompt([
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

test("hasPendingFutureChatStructuredContinuation detects unresolved question cards", () => {
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

	assert.equal(hasPendingFutureChatStructuredContinuation(messages), true);
});

test("hasPendingFutureChatStructuredContinuation detects unresolved plan widgets", () => {
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

	assert.equal(hasPendingFutureChatStructuredContinuation(messages), true);
});
