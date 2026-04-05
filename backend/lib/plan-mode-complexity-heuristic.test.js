"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { assessPromptComplexityForPlanMode } = require("./plan-mode-complexity-heuristic");

describe("assessPromptComplexityForPlanMode", () => {
	describe("should NOT trigger plan mode", () => {
		it("returns shouldPlan: false for empty input", () => {
			assert.deepStrictEqual(assessPromptComplexityForPlanMode(""), {
				shouldPlan: false,
				score: 0,
				reasons: [],
			});
		});

		it("returns shouldPlan: false for a simple greeting", () => {
			const result = assessPromptComplexityForPlanMode("hello");
			assert.strictEqual(result.shouldPlan, false);
			assert.strictEqual(result.score, 0);
		});

		it("returns shouldPlan: false for a simple artifact prompt", () => {
			const result = assessPromptComplexityForPlanMode("build a login page");
			assert.strictEqual(result.shouldPlan, false);
			assert.ok(result.score < 2, `score ${result.score} should be < 2`);
		});

		it("returns shouldPlan: false for a conversational question", () => {
			const result = assessPromptComplexityForPlanMode("what is React?");
			assert.strictEqual(result.shouldPlan, false);
			assert.strictEqual(result.score, 0);
		});

		it("returns shouldPlan: false for a simple bug fix", () => {
			const result = assessPromptComplexityForPlanMode("fix the typo in the header");
			assert.strictEqual(result.shouldPlan, false);
			assert.ok(result.score < 2);
		});

		it("returns shouldPlan: false for a single-file edit", () => {
			const result = assessPromptComplexityForPlanMode("add a dark mode toggle button");
			assert.strictEqual(result.shouldPlan, false);
			assert.ok(result.score < 2);
		});

		it("returns shouldPlan: false for a product brief", () => {
			const result = assessPromptComplexityForPlanMode("create a product brief about Watermelon");
			assert.strictEqual(result.shouldPlan, false);
			assert.ok(result.score < 2);
		});
	});

	describe("should trigger plan mode", () => {
		it("triggers for the UC8 example prompt (6 deliverables, multi-system)", () => {
			const result = assessPromptComplexityForPlanMode(
				"build a multi-step team settings system with roles, permissions, audit logs, admin UI, backend endpoints, and rollout plan",
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.score >= 2, `score ${result.score} should be >= 2`);
		});

		it("triggers for a refactoring + multi-system prompt", () => {
			const result = assessPromptComplexityForPlanMode(
				"refactor the authentication system to use JWT tokens across the API, middleware, and frontend components",
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.score >= 2);
		});

		it("triggers for a migration prompt with high-risk domain", () => {
			const result = assessPromptComplexityForPlanMode(
				"migrate the database schema from v1 to v2 and update all API endpoints",
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.score >= 2);
		});

		it("triggers for a complex feature design prompt", () => {
			const result = assessPromptComplexityForPlanMode(
				"design and implement artifact diffing, version rollback, and approval workflow for rovo-app",
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.score >= 2);
		});

		it("triggers for architecture + tradeoff prompt", () => {
			const result = assessPromptComplexityForPlanMode(
				"architect a new permissions system — should we use RBAC vs ABAC? Consider the tradeoffs for our API endpoints and admin dashboard",
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.score >= 3, `score ${result.score} should be >= 3`);
		});

		it("triggers for long multi-deliverable prompt", () => {
			const result = assessPromptComplexityForPlanMode(
				"implement a complete user onboarding flow with email verification, profile setup, team invitation, billing integration, and analytics tracking across the frontend, backend, and worker services",
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.score >= 3);
		});
	});

	describe("test case 2: auto-plan triggering for specific prompts", () => {
		it("triggers for the test case 2 prompt (refactor auth + migrate + update + add)", () => {
			const result = assessPromptComplexityForPlanMode(
				"I need you to refactor the authentication system to support OAuth2, migrate the database schema, update all API endpoints to use the new auth tokens, and add comprehensive error handling across all services",
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.score >= 2, `score ${result.score} should be >= 2`);
			assert.ok(result.reasons.length >= 2, `should have at least 2 reasons, got: ${result.reasons.join(", ")}`);
		});

		it("does NOT trigger for 'Build me an app' (ambiguous but simple)", () => {
			const result = assessPromptComplexityForPlanMode("Build me an app");
			assert.strictEqual(result.shouldPlan, false);
			assert.ok(result.score < 2, `score ${result.score} should be < 2`);
		});

		it("does NOT trigger for a specific but single-scope prompt", () => {
			const result = assessPromptComplexityForPlanMode(
				"Create a React dashboard with three components: a stats overview card, a recent activity feed, and a notification bell dropdown",
			);
			assert.strictEqual(result.shouldPlan, false);
			assert.ok(result.score < 2, `score ${result.score} should be < 2`);
		});
	});

	describe("spec §2.1 — planning keywords and auto-plan composition", () => {
		it("planning keywords alone contribute one point — does not auto-trigger plan mode", () => {
			const result = assessPromptComplexityForPlanMode("We should discuss the roadmap");
			assert.strictEqual(result.shouldPlan, false);
			assert.ok(result.score >= 1);
			assert.ok(
				result.reasons.includes("planning_keywords"),
				`expected planning_keywords in ${result.reasons.join(", ")}`,
			);
		});

		it("combines planning keywords with cross-module scope to reach shouldPlan threshold", () => {
			const result = assessPromptComplexityForPlanMode(
				"Phased rollout roadmap across frontend dashboard, backend API, and worker services",
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.score >= 2);
			assert.ok(result.reasons.includes("planning_keywords"));
			assert.ok(
				result.reasons.some((r) => r.startsWith("cross_module_")),
				`expected cross_module_* reason, got: ${result.reasons.join(", ")}`,
			);
		});

		it("long prompt (200+ chars) plus planning keyword triggers auto-plan", () => {
			const padding = "x".repeat(200);
			const result = assessPromptComplexityForPlanMode(
				`Coordinate a multi-step workflow. ${padding}`,
			);
			assert.strictEqual(result.shouldPlan, true);
			assert.ok(result.reasons.includes("long_prompt"));
			assert.ok(result.reasons.includes("planning_keywords"));
		});
	});

	describe("edge cases", () => {
		it("handles null/undefined gracefully", () => {
			assert.deepStrictEqual(assessPromptComplexityForPlanMode(null), {
				shouldPlan: false,
				score: 0,
				reasons: [],
			});
			assert.deepStrictEqual(assessPromptComplexityForPlanMode(undefined), {
				shouldPlan: false,
				score: 0,
				reasons: [],
			});
		});

		it("provides meaningful reasons", () => {
			const result = assessPromptComplexityForPlanMode(
				"refactor the authentication and permissions system across the API and frontend",
			);
			assert.ok(result.reasons.length > 0, "should have at least one reason");
			assert.ok(result.reasons.some((r) => r.includes("feature_or_refactor") || r.includes("high_risk")));
		});
	});
});
