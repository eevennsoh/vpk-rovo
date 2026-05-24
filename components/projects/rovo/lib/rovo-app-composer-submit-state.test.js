const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getLatestRovoAppThinkingStatusLabel,
	resolveRovoAppComposerSubmitState,
} = require("./rovo-app-composer-submit-state.ts");

function createAssistantThinkingMessage(label) {
	return {
		role: "assistant",
		parts: [
			{
				type: "data-thinking-status",
				data: { label },
			},
		],
	};
}

test("keeps the composer busy while the primary useChat turn is streaming", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "streaming",
			delegationPhase: "idle",
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel: null,
			composerStatus: "streaming",
			hasBackgroundDelegation: false,
		},
	);
});

test("keeps the composer busy while direct delegation is waiting for response headers", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "ready",
			delegationPhase: "requesting",
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel: null,
			composerStatus: "submitted",
			hasBackgroundDelegation: false,
		},
	);
});

test("releases the composer once direct delegation is established", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "ready",
			delegationPhase: "background",
			latestThinkingStatusLabel: "Generating results",
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel:
				"Rovo is still working: Generating results.",
			composerStatus: "ready",
			hasBackgroundDelegation: true,
		},
	);
});

test("uses a fallback label while background delegation has not emitted thinking status yet", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "ready",
			delegationPhase: "background",
			latestThinkingStatusLabel: null,
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel:
				"Rovo is still working in the background.",
			composerStatus: "ready",
			hasBackgroundDelegation: true,
		},
	);
});

test("unblocks the composer when streaming and artifact is actively streaming", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "streaming",
			delegationPhase: "idle",
			streamingArtifactStatus: "streaming",
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel: null,
			composerStatus: "ready",
			hasBackgroundDelegation: false,
		},
	);
});

test("keeps the composer busy when streaming but artifact is idle", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "streaming",
			delegationPhase: "idle",
			streamingArtifactStatus: "idle",
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel: null,
			composerStatus: "streaming",
			hasBackgroundDelegation: false,
		},
	);
});

test("releases the composer when the live turn has already emitted turn-complete", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "streaming",
			delegationPhase: "idle",
			hasObservedTurnComplete: true,
			streamingArtifactStatus: "idle",
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel: null,
			composerStatus: "ready",
			hasBackgroundDelegation: false,
		},
	);
});

test("shows background artifact count label when artifacts are generating", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "ready",
			delegationPhase: "idle",
			backgroundArtifactCount: 2,
		}),
		{
			backgroundArtifactLabel: "2 artifacts generating...",
			backgroundDelegationLabel: null,
			composerStatus: "ready",
			hasBackgroundDelegation: false,
		},
	);
});

test("shows singular background artifact label for one artifact", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			useChatStatus: "ready",
			delegationPhase: "idle",
			backgroundArtifactCount: 1,
		}),
		{
			backgroundArtifactLabel: "1 artifact generating...",
			backgroundDelegationLabel: null,
			composerStatus: "ready",
			hasBackgroundDelegation: false,
		},
	);
});

test("shows queued background work when an active run is waiting for a free port", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			activeRunStatus: "queued",
			backgroundDelegationLabelOverride:
				"Queued. This thread will start when a Rovo port is free.",
			useChatStatus: "ready",
			delegationPhase: "idle",
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel:
				"Queued. This thread will start when a Rovo port is free.",
			composerStatus: "ready",
			hasBackgroundDelegation: true,
		},
	);
});

test("keeps the composer attached when the current thread has an attached active run", () => {
	assert.deepEqual(
		resolveRovoAppComposerSubmitState({
			activeRunStatus: "streaming",
			isAttachedActiveRun: true,
			useChatStatus: "ready",
			delegationPhase: "idle",
		}),
		{
			backgroundArtifactLabel: null,
			backgroundDelegationLabel: null,
			composerStatus: "streaming",
			hasBackgroundDelegation: false,
		},
	);
});

test("reads the latest assistant thinking status label from message history", () => {
	assert.equal(
		getLatestRovoAppThinkingStatusLabel([
			{
				role: "user",
				parts: [],
			},
			createAssistantThinkingMessage("Planning the next step"),
			createAssistantThinkingMessage("Generating results"),
		]),
		"Generating results",
	);
});
