"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
	getNormalizedWidgetDataParts,
	selectLatestRenderableWidgetPart,
} = require("./widget-selection.ts");

function makePart(widgetType, extraData = {}) {
	return {
		type: "data-widget-data",
		data: { type: widgetType, ...extraData },
	};
}

function makeMessage(parts) {
	return { parts };
}

describe("getNormalizedWidgetDataParts", () => {
	it("extracts widget data parts with their types", () => {
		const parts = getNormalizedWidgetDataParts(
			makeMessage([
				makePart("plan"),
				{ type: "text", text: "hello" },
				makePart("genui-preview"),
			]),
		);

		assert.equal(parts.length, 2);
		assert.equal(parts[0].widgetType, "plan");
		assert.equal(parts[1].widgetType, "genui-preview");
	});

	it("skips parts without a widget type", () => {
		const parts = getNormalizedWidgetDataParts(
			makeMessage([
				{ type: "data-widget-data", data: {} },
				{ type: "data-widget-data", data: { type: "" } },
				{ type: "data-widget-data", data: { type: "   " } },
			]),
		);

		assert.equal(parts.length, 0);
	});

	it("returns empty array for message with no widget parts", () => {
		const parts = getNormalizedWidgetDataParts(
			makeMessage([{ type: "text", text: "just text" }]),
		);

		assert.equal(parts.length, 0);
	});
});

describe("selectLatestRenderableWidgetPart — streaming guards (Test Case 12)", () => {
	it("returns the last part when no isRenderable filter is provided", () => {
		const parts = [
			{ part: makePart("plan"), widgetType: "plan" },
			{ part: makePart("genui-preview"), widgetType: "genui-preview" },
		];

		const result = selectLatestRenderableWidgetPart(parts);
		assert.equal(result.widgetType, "genui-preview");
	});

	it("skips plan widgets during streaming via isRenderable callback", () => {
		const isStreaming = true;
		const parts = [
			{ part: makePart("genui-preview"), widgetType: "genui-preview" },
			{ part: makePart("plan"), widgetType: "plan" },
		];

		const isRenderable = (widgetDataPart) => {
			if (widgetDataPart.widgetType === "plan" && isStreaming) {
				return false;
			}
			return true;
		};

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.equal(result.widgetType, "genui-preview",
			"Plan widget must be skipped while streaming; fall back to genui-preview");
	});

	it("selects plan widget when NOT streaming", () => {
		const isStreaming = false;
		const parts = [
			{ part: makePart("genui-preview"), widgetType: "genui-preview" },
			{ part: makePart("plan"), widgetType: "plan" },
		];

		const isRenderable = (widgetDataPart) => {
			if (widgetDataPart.widgetType === "plan" && isStreaming) {
				return false;
			}
			return true;
		};

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.equal(result.widgetType, "plan",
			"Plan widget should be selected when streaming is complete");
	});

	it("falls back to last part when all are filtered out by isRenderable", () => {
		const parts = [
			{ part: makePart("plan"), widgetType: "plan" },
		];

		const isRenderable = () => false;

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.equal(result.widgetType, "plan",
			"Falls back to last part when nothing passes isRenderable");
	});

	it("returns null for empty parts array", () => {
		assert.equal(selectLatestRenderableWidgetPart([]), null);
	});

	it("walks backwards to find the first renderable part", () => {
		const parts = [
			{ part: makePart("question-card"), widgetType: "question-card" },
			{ part: makePart("plan"), widgetType: "plan" },
			{ part: makePart("plan"), widgetType: "plan" },
		];

		const isRenderable = (p) => p.widgetType !== "plan";

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.equal(result.widgetType, "question-card");
	});

	it("prefers the latest question-card when multiple rounds exist (deferred Q&A resume)", () => {
		const firstRound = makePart("question-card", { round: 1 });
		const secondRound = makePart("question-card", { round: 2 });
		const parts = [
			{ part: firstRound, widgetType: "question-card" },
			{ part: makePart("plan"), widgetType: "plan" },
			{ part: secondRound, widgetType: "question-card" },
		];

		const result = selectLatestRenderableWidgetPart(parts);
		assert.strictEqual(result.widgetType, "question-card");
		assert.strictEqual(result.part, secondRound);
	});

	it("with streaming guard, skips trailing plan and walks back to earlier renderable widget", () => {
		const isStreaming = true;
		const questionPart = makePart("question-card");
		const parts = [
			{ part: questionPart, widgetType: "question-card" },
			{ part: makePart("genui-preview"), widgetType: "genui-preview" },
			{ part: makePart("plan"), widgetType: "plan" },
		];

		const isRenderable = (widgetDataPart) => {
			if (widgetDataPart.widgetType === "plan" && isStreaming) {
				return false;
			}
			return true;
		};

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.strictEqual(result.widgetType, "genui-preview",
			"Trailing plan skipped while streaming; selection should not stick on an unrenderable tail");
	});
});

describe("selectLatestRenderableWidgetPart — question card during streaming (Test Case 15)", () => {
	it("question-card IS renderable while loading (shouldRenderCandidateWhileLoading)", () => {
		const isStreaming = true;
		const isAnyWidgetLoading = true;
		const loadingWidgetType = "question-card";

		const parts = [
			{ part: makePart("question-card"), widgetType: "question-card" },
		];

		const isRenderable = (widgetDataPart) => {
			const candidateIsLoading =
				isAnyWidgetLoading && loadingWidgetType === widgetDataPart.widgetType;
			const shouldRenderCandidateWhileLoading =
				widgetDataPart.widgetType === "genui-preview" ||
				widgetDataPart.widgetType === "question-card";
			const shouldSkipCandidate =
				(candidateIsLoading && !shouldRenderCandidateWhileLoading) ||
				(widgetDataPart.widgetType === "plan" && isStreaming);

			return !shouldSkipCandidate;
		};

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.ok(result, "Question card must be renderable even while loading");
		assert.equal(result.widgetType, "question-card");
	});

	it("plan widget IS skipped while streaming even when loading", () => {
		const isStreaming = true;
		const isAnyWidgetLoading = true;
		const loadingWidgetType = "plan";

		const parts = [
			{ part: makePart("plan"), widgetType: "plan" },
		];

		const isRenderable = (widgetDataPart) => {
			const candidateIsLoading =
				isAnyWidgetLoading && loadingWidgetType === widgetDataPart.widgetType;
			const shouldRenderCandidateWhileLoading =
				widgetDataPart.widgetType === "genui-preview" ||
				widgetDataPart.widgetType === "question-card";
			const shouldSkipCandidate =
				(candidateIsLoading && !shouldRenderCandidateWhileLoading) ||
				(widgetDataPart.widgetType === "plan" && isStreaming);

			return !shouldSkipCandidate;
		};

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.equal(result.widgetType, "plan",
			"Falls back to last part since nothing passes filter — but filter blocked it");
	});

	it("genui-preview IS renderable while loading", () => {
		const isStreaming = true;
		const isAnyWidgetLoading = true;
		const loadingWidgetType = "genui-preview";

		const parts = [
			{ part: makePart("genui-preview"), widgetType: "genui-preview" },
		];

		const isRenderable = (widgetDataPart) => {
			const candidateIsLoading =
				isAnyWidgetLoading && loadingWidgetType === widgetDataPart.widgetType;
			const shouldRenderCandidateWhileLoading =
				widgetDataPart.widgetType === "genui-preview" ||
				widgetDataPart.widgetType === "question-card";
			const shouldSkipCandidate =
				(candidateIsLoading && !shouldRenderCandidateWhileLoading) ||
				(widgetDataPart.widgetType === "plan" && isStreaming);

			return !shouldSkipCandidate;
		};

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.ok(result);
		assert.equal(result.widgetType, "genui-preview");
	});

	it("unknown widget type IS skipped while loading", () => {
		const isStreaming = false;
		const isAnyWidgetLoading = true;
		const loadingWidgetType = "unknown-widget";

		const parts = [
			{ part: makePart("question-card"), widgetType: "question-card" },
			{ part: makePart("unknown-widget"), widgetType: "unknown-widget" },
		];

		const isRenderable = (widgetDataPart) => {
			const candidateIsLoading =
				isAnyWidgetLoading && loadingWidgetType === widgetDataPart.widgetType;
			const shouldRenderCandidateWhileLoading =
				widgetDataPart.widgetType === "genui-preview" ||
				widgetDataPart.widgetType === "question-card";
			const shouldSkipCandidate =
				(candidateIsLoading && !shouldRenderCandidateWhileLoading) ||
				(widgetDataPart.widgetType === "plan" && isStreaming);

			return !shouldSkipCandidate;
		};

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.equal(result.widgetType, "question-card",
			"Unknown widget is skipped while loading; falls back to question-card");
	});

	it("isRenderable errors are caught and the part is skipped", () => {
		const parts = [
			{ part: makePart("question-card"), widgetType: "question-card" },
			{ part: makePart("plan"), widgetType: "plan" },
		];

		const isRenderable = (widgetDataPart) => {
			if (widgetDataPart.widgetType === "plan") {
				throw new Error("Simulated crash in isRenderable");
			}
			return true;
		};

		const result = selectLatestRenderableWidgetPart(parts, isRenderable);
		assert.equal(result.widgetType, "question-card",
			"Should skip crashing part and fall back to earlier renderable part");
	});
});
