import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { getWorkflowLozengeVariant, getWorkflowStatusPresentation } from "./workflow-status.ts";

test("getWorkflowStatusPresentation returns valid semantic classes for To Do", () => {
	assert.deepEqual(getWorkflowStatusPresentation("To Do"), {
		kind: "todo",
		label: "To Do",
		labelClassName: "text-text-subtle",
		dotClassName: "bg-bg-neutral-bold",
		lozengeVariant: "neutral",
	});
});

test("getWorkflowStatusPresentation keeps In Review visible with a supported token class", () => {
	assert.deepEqual(getWorkflowStatusPresentation("In Review"), {
		kind: "in-review",
		label: "In Review",
		labelClassName: "text-text",
		dotClassName: "bg-info",
		lozengeVariant: "information",
	});
});

test("getWorkflowLozengeVariant infers variants from workflow status text", () => {
	assert.equal(getWorkflowLozengeVariant("Done"), "success");
	assert.equal(getWorkflowLozengeVariant("In Progress"), "information");
	assert.equal(getWorkflowLozengeVariant("In Review"), "information");
	assert.equal(getWorkflowLozengeVariant("Backlog"), "neutral");
});
