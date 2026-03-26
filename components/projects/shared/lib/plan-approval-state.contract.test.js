"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

function toNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function getNextAssistantMessage(messages, acceptanceIndex) {
	for (let index = acceptanceIndex + 1; index < messages.length; index += 1) {
		const nextMessage = messages[index];
		if (nextMessage.role === "assistant") {
			return nextMessage;
		}
		if (nextMessage.role === "user") {
			return null;
		}
	}

	return null;
}

function hasFollowUpWidgetError(messages, acceptanceIndex) {
	const nextMessage = getNextAssistantMessage(messages, acceptanceIndex);
	if (!nextMessage) {
		return false;
	}

	return nextMessage.parts.some((part) => part.type === "data-widget-error");
}

function isSubstantiveAssistantPart(part) {
	if (part.type === "text") {
		return typeof part.text === "string" && part.text.trim().length > 0;
	}

	if (
		part.type === "data-route-decision" ||
		part.type === "data-thinking-status" ||
		part.type === "data-thinking-event" ||
		part.type === "data-widget-loading" ||
		part.type === "data-turn-complete" ||
		part.type === "data-suggested-questions"
	) {
		return false;
	}

	return true;
}

function hasSubstantiveAssistantFollowUp(messages, acceptanceIndex) {
	const nextMessage = getNextAssistantMessage(messages, acceptanceIndex);
	if (!nextMessage) {
		return false;
	}

	return nextMessage.parts.some((part) => isSubstantiveAssistantPart(part));
}

function getPlanApprovalState(messages, activeRun) {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "user") {
			continue;
		}

		if (message.metadata?.source !== "plan-approval-submit") {
			continue;
		}

		if (message.metadata?.planApprovalDecision !== "auto-accept") {
			continue;
		}

		const planKey = toNonEmptyString(message.metadata?.planApprovalPlanKey);
		if (!planKey) {
			return null;
		}

		if (hasFollowUpWidgetError(messages, index)) {
			continue;
		}

		if (activeRun !== null) {
			return { status: "pending", planKey };
		}

		if (hasSubstantiveAssistantFollowUp(messages, index)) {
			return { status: "accepted", planKey };
		}

		return null;
	}

	return null;
}

describe("getPlanApprovalState contract", () => {
	it("returns pending while the latest approved plan still has an active run", () => {
		const messages = [
			{
				role: "user",
				id: "u1",
				parts: [],
				metadata: {
					source: "plan-approval-submit",
					planApprovalDecision: "auto-accept",
					planApprovalPlanKey: "Plan-task-1",
				},
			},
			{
				role: "assistant",
				id: "a1",
				parts: [{ type: "data-route-decision", data: { intent: "chat" } }],
			},
		];

		assert.deepEqual(
			getPlanApprovalState(messages, {
				id: "run-1",
				status: "background",
				rovoPort: null,
				startedAt: "2026-03-26T00:00:00.000Z",
				updatedAt: "2026-03-26T00:00:10.000Z",
			}),
			{
				status: "pending",
				planKey: "Plan-task-1",
			},
		);
	});

	it("returns null when the follow-up contains only route metadata and no active run remains", () => {
		const messages = [
			{
				role: "user",
				id: "u1",
				parts: [],
				metadata: {
					source: "plan-approval-submit",
					planApprovalDecision: "auto-accept",
					planApprovalPlanKey: "Plan-task-1",
				},
			},
			{
				role: "assistant",
				id: "a1",
				parts: [{ type: "data-route-decision", data: { intent: "chat" } }],
			},
		];

		assert.equal(getPlanApprovalState(messages, null), null);
	});

	it("returns accepted when the follow-up is substantive and no active run remains", () => {
		const messages = [
			{
				role: "user",
				id: "u1",
				parts: [],
				metadata: {
					source: "plan-approval-submit",
					planApprovalDecision: "auto-accept",
					planApprovalPlanKey: "Plan-task-1",
				},
			},
			{
				role: "assistant",
				id: "a1",
				parts: [{ type: "text", text: "Starting execution..." }],
			},
		];

		assert.deepEqual(getPlanApprovalState(messages, null), {
			status: "accepted",
			planKey: "Plan-task-1",
		});
	});

	it("falls back to an earlier accepted plan when the latest one is followed by a widget error", () => {
		const messages = [
			{
				role: "user",
				id: "u1",
				parts: [],
				metadata: {
					source: "plan-approval-submit",
					planApprovalDecision: "auto-accept",
					planApprovalPlanKey: "First-task-1",
				},
			},
			{
				role: "assistant",
				id: "a1",
				parts: [{ type: "text", text: "Starting execution..." }],
			},
			{
				role: "user",
				id: "u2",
				parts: [],
				metadata: {
					source: "plan-approval-submit",
					planApprovalDecision: "auto-accept",
					planApprovalPlanKey: "Second-task-1",
				},
			},
			{
				role: "assistant",
				id: "a2",
				parts: [{ type: "data-widget-error", data: { code: "future_chat_run_failed" } }],
			},
		];

		assert.deepEqual(getPlanApprovalState(messages, null), {
			status: "accepted",
			planKey: "First-task-1",
		});
	});
});
