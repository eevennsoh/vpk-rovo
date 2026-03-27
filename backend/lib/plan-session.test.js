"use strict";

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const {
	getPlanSession,
	updatePlanSession,
	clearPlanSession,
	shouldRestorePlanModeOnResume,
	isPlanExecutionPhase,
	_resetForTest,
} = require("./plan-session");

describe("plan-session", () => {
	beforeEach(() => {
		_resetForTest();
	});

	describe("getPlanSession", () => {
		it("returns default inactive session for unknown thread", () => {
			const session = getPlanSession("thread-new");
			assert.strictEqual(session.isActive, false);
			assert.strictEqual(session.phase, null);
			assert.strictEqual(session.deferredToolCallId, null);
			assert.deepStrictEqual(session.planCardIds, []);
			assert.strictEqual(session.acceptedPlanId, null);
		});

		it("returns default for null/undefined/empty threadId", () => {
			for (const bad of [null, undefined, ""]) {
				const session = getPlanSession(bad);
				assert.strictEqual(session.isActive, false);
				assert.strictEqual(session.phase, null);
			}
		});

		it("returns the same reference for the same threadId", () => {
			const a = getPlanSession("t1");
			const b = getPlanSession("t1");
			assert.strictEqual(a, b);
		});

		it("returns different objects for different threadIds", () => {
			const a = getPlanSession("t1");
			const b = getPlanSession("t2");
			assert.notStrictEqual(a, b);
		});
	});

	describe("updatePlanSession", () => {
		it("sets isActive and phase on first update", () => {
			updatePlanSession("t1", {
				isActive: true,
				phase: "qa",
				deferredToolCallId: "tool-1",
			});
			const session = getPlanSession("t1");
			assert.strictEqual(session.isActive, true);
			assert.strictEqual(session.phase, "qa");
			assert.strictEqual(session.deferredToolCallId, "tool-1");
		});

		it("transitions phase from qa to plan", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			updatePlanSession("t1", { phase: "plan" });
			const session = getPlanSession("t1");
			assert.strictEqual(session.isActive, true);
			assert.strictEqual(session.phase, "plan");
		});

		it("accumulates planCardIds across updates", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			const session = getPlanSession("t1");
			updatePlanSession("t1", {
				phase: "plan",
				planCardIds: [...session.planCardIds, "card-1"],
			});
			assert.deepStrictEqual(getPlanSession("t1").planCardIds, ["card-1"]);

			updatePlanSession("t1", {
				planCardIds: [...getPlanSession("t1").planCardIds, "card-2"],
			});
			assert.deepStrictEqual(getPlanSession("t1").planCardIds, [
				"card-1",
				"card-2",
			]);
		});

		it("is a no-op for null/undefined/empty threadId", () => {
			updatePlanSession(null, { isActive: true });
			updatePlanSession(undefined, { isActive: true });
			updatePlanSession("", { isActive: true });
			assert.strictEqual(getPlanSession("any").isActive, false);
		});
	});

	describe("clearPlanSession", () => {
		it("removes the session for a thread", () => {
			updatePlanSession("t1", { isActive: true, phase: "plan" });
			assert.strictEqual(getPlanSession("t1").isActive, true);

			clearPlanSession("t1");
			const session = getPlanSession("t1");
			assert.strictEqual(session.isActive, false);
			assert.strictEqual(session.phase, null);
		});

		it("is idempotent", () => {
			clearPlanSession("t1");
			clearPlanSession("t1");
			assert.strictEqual(getPlanSession("t1").isActive, false);
		});

		it("does not affect other threads", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			updatePlanSession("t2", { isActive: true, phase: "plan" });
			clearPlanSession("t1");
			assert.strictEqual(getPlanSession("t1").isActive, false);
			assert.strictEqual(getPlanSession("t2").isActive, true);
			assert.strictEqual(getPlanSession("t2").phase, "plan");
		});
	});

	describe("shouldRestorePlanModeOnResume (Test Case 4 core logic)", () => {
		it("restores plan mode when resuming with an active plan session", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-1" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, true);
			assert.strictEqual(result.phase, "qa");
		});

		it("does not restore when no paused tool call record", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: null,
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, false);
		});

		it("does not restore when resolvedPlanModeActive is already true", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-1" },
				resolvedPlanModeActive: true,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, false);
		});

		it("does not restore when plan session is inactive", () => {
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-1" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, false);
		});

		it("does not restore when plan session was cleared", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			clearPlanSession("t1");
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-1" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, false);
		});

		it("reports correct phase when restoring from plan phase", () => {
			updatePlanSession("t1", { isActive: true, phase: "plan" });
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-1" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, true);
			assert.strictEqual(result.phase, "plan");
		});

		it("reports execution phase when restoring during build orchestration", () => {
			updatePlanSession("t1", { isActive: true, phase: "execution" });
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-exec" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, true);
			assert.strictEqual(result.phase, "execution");
		});

		it("treats any truthy pausedToolCallRecord as a deferred resume signal", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: {},
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, true);
			assert.strictEqual(result.phase, "qa");
		});

		it("still restores when acceptedPlanId is set but session remains active", () => {
			updatePlanSession("t1", {
				isActive: true,
				phase: "plan",
				acceptedPlanId: "plan-card-1",
			});
			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-plan" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, true,
				"Resume turns should restore plan constraints while planSession.isActive");
		});
	});

	describe("full plan lifecycle (Q&A → plan widget → acceptance)", () => {
		it("tracks the full phase transition: qa → plan", () => {
			updatePlanSession("t1", {
				isActive: true,
				phase: "qa",
				deferredToolCallId: "tool-qa",
			});
			assert.strictEqual(getPlanSession("t1").phase, "qa");

			updatePlanSession("t1", {
				phase: "plan",
				deferredToolCallId: "tool-plan",
				planCardIds: [...getPlanSession("t1").planCardIds, "plan-card-1"],
			});
			assert.strictEqual(getPlanSession("t1").phase, "plan");
			assert.strictEqual(getPlanSession("t1").deferredToolCallId, "tool-plan");
			assert.deepStrictEqual(getPlanSession("t1").planCardIds, ["plan-card-1"]);
		});

		it("restore works mid-lifecycle (Q&A answer resume)", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });

			const restore = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-qa" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(restore.shouldRestore, true);
			assert.strictEqual(restore.phase, "qa");

			updatePlanSession("t1", {
				phase: "plan",
				planCardIds: ["plan-card-1"],
			});
			assert.strictEqual(getPlanSession("t1").phase, "plan");
			assert.strictEqual(getPlanSession("t1").isActive, true);
		});

		it("clearing after acceptance resets everything", () => {
			updatePlanSession("t1", { isActive: true, phase: "plan" });
			updatePlanSession("t1", { acceptedPlanId: "plan-card-1" });
			assert.strictEqual(getPlanSession("t1").acceptedPlanId, "plan-card-1");

			clearPlanSession("t1");
			const session = getPlanSession("t1");
			assert.strictEqual(session.isActive, false);
			assert.strictEqual(session.phase, null);
			assert.strictEqual(session.deferredToolCallId, null);
			assert.strictEqual(session.acceptedPlanId, null);
		});

		it("can retain execution metadata without restoring plan mode", () => {
			updatePlanSession("t1", {
				isActive: true,
				phase: "plan",
				deferredToolCallId: "tool-plan",
				planCardIds: ["plan-card-1"],
			});

			updatePlanSession("t1", {
				isActive: false,
				phase: "execution",
				deferredToolCallId: null,
				acceptedPlanId: "plan-card-1",
			});

			const session = getPlanSession("t1");
			assert.strictEqual(session.isActive, false);
			assert.strictEqual(session.phase, "execution");
			assert.strictEqual(session.deferredToolCallId, null);
			assert.strictEqual(session.acceptedPlanId, "plan-card-1");
			assert.deepStrictEqual(session.planCardIds, ["plan-card-1"]);
		});

		it("GenUI blocking scenario: planSessionActive stays true on resume", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });

			const restore = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-1" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(restore.shouldRestore, true);

			const planSessionActive = getPlanSession("t1").isActive;
			assert.strictEqual(planSessionActive, true,
				"planSessionActive must be true so shouldAttemptPostToolGenui blocks GenUI");
		});
	});

	describe("toggle off — Plan OFF clears session (Test Case 9)", () => {
		it("clearPlanSession removes active session when user toggles Plan off", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			assert.strictEqual(getPlanSession("t1").isActive, true);

			clearPlanSession("t1");

			const session = getPlanSession("t1");
			assert.strictEqual(session.isActive, false);
			assert.strictEqual(session.phase, null);
			assert.deepStrictEqual(session.planCardIds, []);
			assert.strictEqual(session.acceptedPlanId, null);
		});

		it("after toggle off, new message does not inherit plan context", () => {
			updatePlanSession("t1", { isActive: true, phase: "plan" });
			updatePlanSession("t1", {
				planCardIds: [...getPlanSession("t1").planCardIds, "plan-card-1"],
			});

			clearPlanSession("t1");

			const restore = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-1" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(restore.shouldRestore, false,
				"After toggle off, resume must not restore plan mode");
		});

		it("toggle off during plan phase clears everything including planCardIds", () => {
			updatePlanSession("t1", { isActive: true, phase: "plan" });
			updatePlanSession("t1", {
				planCardIds: ["plan-card-1", "plan-card-2"],
			});
			assert.deepStrictEqual(getPlanSession("t1").planCardIds, ["plan-card-1", "plan-card-2"]);

			clearPlanSession("t1");

			const session = getPlanSession("t1");
			assert.deepStrictEqual(session.planCardIds, []);
		});

		it("GenUI is no longer blocked after toggle off", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			assert.strictEqual(getPlanSession("t1").isActive, true,
				"Before toggle off, planSessionActive should block GenUI");

			clearPlanSession("t1");
			assert.strictEqual(getPlanSession("t1").isActive, false,
				"After toggle off, planSessionActive is false — GenUI unblocked");
		});
	});

	describe("cancel flow — Skip clears plan session (Test Case 5)", () => {
		it("clearPlanSession removes active qa-phase session (skip cancels planning)", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			assert.strictEqual(getPlanSession("t1").isActive, true);
			assert.strictEqual(getPlanSession("t1").phase, "qa");

			clearPlanSession("t1");

			const session = getPlanSession("t1");
			assert.strictEqual(session.isActive, false);
			assert.strictEqual(session.phase, null);
			assert.deepStrictEqual(session.planCardIds, []);
		});

		it("restore returns false after cancel clears the session", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			clearPlanSession("t1");

			const result = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: { toolCallId: "tc-cancelled" },
				resolvedPlanModeActive: false,
				threadId: "t1",
			});
			assert.strictEqual(result.shouldRestore, false,
				"After cancel, resume must not restore plan mode");
		});

		it("cancel on one thread does not affect another thread's plan session", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			updatePlanSession("t2", { isActive: true, phase: "plan" });

			clearPlanSession("t1");

			assert.strictEqual(getPlanSession("t1").isActive, false);
			assert.strictEqual(getPlanSession("t2").isActive, true);
			assert.strictEqual(getPlanSession("t2").phase, "plan");
		});

		it("subsequent messages after cancel start fresh (no stale plan context)", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			clearPlanSession("t1");

			const freshSession = getPlanSession("t1");
			assert.strictEqual(freshSession.isActive, false);

			updatePlanSession("t1", { isActive: true, phase: "qa" });
			assert.strictEqual(getPlanSession("t1").isActive, true,
				"New plan session can be created after cancel");
		});
	});

	describe("isPlanExecutionPhase", () => {
		it("returns false for unknown thread", () => {
			assert.strictEqual(isPlanExecutionPhase("unknown-thread"), false);
		});

		it("returns false for null/undefined/empty threadId", () => {
			assert.strictEqual(isPlanExecutionPhase(null), false);
			assert.strictEqual(isPlanExecutionPhase(undefined), false);
			assert.strictEqual(isPlanExecutionPhase(""), false);
		});

		it("returns false when session is in qa phase", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			assert.strictEqual(isPlanExecutionPhase("t1"), false);
		});

		it("returns false when session is in plan phase", () => {
			updatePlanSession("t1", { isActive: true, phase: "plan" });
			assert.strictEqual(isPlanExecutionPhase("t1"), false);
		});

		it("returns true when session is in execution phase and active", () => {
			updatePlanSession("t1", { isActive: true, phase: "execution" });
			assert.strictEqual(isPlanExecutionPhase("t1"), true);
		});

		it("returns false when session is in execution phase but not active", () => {
			updatePlanSession("t1", { isActive: false, phase: "execution" });
			assert.strictEqual(isPlanExecutionPhase("t1"), false);
		});

		it("returns false after session is cleared", () => {
			updatePlanSession("t1", { isActive: true, phase: "execution" });
			assert.strictEqual(isPlanExecutionPhase("t1"), true);
			clearPlanSession("t1");
			assert.strictEqual(isPlanExecutionPhase("t1"), false);
		});

		it("transitions correctly through full lifecycle", () => {
			updatePlanSession("t1", { isActive: true, phase: "qa" });
			assert.strictEqual(isPlanExecutionPhase("t1"), false);

			updatePlanSession("t1", { phase: "plan" });
			assert.strictEqual(isPlanExecutionPhase("t1"), false);

			updatePlanSession("t1", { phase: "execution" });
			assert.strictEqual(isPlanExecutionPhase("t1"), true);
		});
	});
});
