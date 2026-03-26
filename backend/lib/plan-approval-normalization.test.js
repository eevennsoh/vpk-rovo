const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadApprovalNormalizationHelpers() {
	const serverPath = path.join(__dirname, "..", "server.js");
	const source = fs.readFileSync(serverPath, "utf8");

	function sliceFunction(name) {
		const marker = `function ${name}(`;
		const start = source.indexOf(marker);
		if (start === -1) {
			throw new Error(`Could not find ${name} in server.js`);
		}

		const braceStart = source.indexOf("{", start);
		let depth = 0;
		for (let index = braceStart; index < source.length; index += 1) {
			const char = source[index];
			if (char === "{") depth += 1;
			if (char === "}") {
				depth -= 1;
				if (depth === 0) {
					return source.slice(start, index + 1);
				}
			}
		}

		throw new Error(`Could not parse function ${name}`);
	}

	function requiredConst(name) {
		const patterns = [`const ${name} =`, `let ${name} =`, `var ${name} =`];
		for (const pattern of patterns) {
			const start = source.indexOf(pattern);
			if (start !== -1) {
				const end = source.indexOf(";", start);
				return source.slice(start, end + 1);
			}
		}
		throw new Error(`Could not find ${name} declaration in server.js`);
	}

	const script = `
${requiredConst("APPROVAL_DECISIONS")}
function getNonEmptyString(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}
${sliceFunction("normalizePlanTasks")}
${sliceFunction("normalizeApprovalDecision")}
${sliceFunction("normalizeApprovalSubmission")}
this.helpers = { normalizeApprovalDecision, normalizeApprovalSubmission };
`;

	const context = {};
	vm.createContext(context);
	vm.runInContext(script, context);
	return context.helpers;
}

const { normalizeApprovalDecision, normalizeApprovalSubmission } = loadApprovalNormalizationHelpers();

test("normalizeApprovalDecision accepts the frontend allowlisted decisions", () => {
	assert.equal(normalizeApprovalDecision("auto-accept"), "auto-accept");
	assert.equal(normalizeApprovalDecision("continue-planning"), "continue-planning");
	assert.equal(normalizeApprovalDecision("custom"), "custom");
});

test("normalizeApprovalDecision rejects invalid values without throwing", () => {
	assert.equal(normalizeApprovalDecision("ship-it"), null);
	assert.equal(normalizeApprovalDecision(""), null);
	assert.equal(normalizeApprovalDecision(null), null);
});

test("normalizeApprovalSubmission accepts decision aliases and preserves fields", () => {
	const fromChoice = normalizeApprovalSubmission({
		choice: "auto-accept",
		planTitle: "Todo board",
		customInstruction: "  add swimlanes  ",
		planTasks: [{ id: "task-1", label: "Build board", blockedBy: ["task-0"], agent: "ui" }],
		deferredToolCallId: "deferred-123",
	});

	assert.equal(fromChoice.decision, "auto-accept");
	assert.equal(fromChoice.customInstruction, "add swimlanes");
	assert.equal(fromChoice.planTitle, "Todo board");
	assert.equal(fromChoice.toolCallId, "deferred-123");
	assert.equal(fromChoice.deferredToolCallId, "deferred-123");
	assert.equal(fromChoice.planTasks.length, 1);
	assert.equal(fromChoice.planTasks[0].id, "task-1");
	assert.equal(fromChoice.planTasks[0].label, "Build board");
	assert.equal(fromChoice.planTasks[0].agent, "ui");
	assert.deepEqual(Array.from(fromChoice.planTasks[0].blockedBy), ["task-0"]);

	const fromSelection = normalizeApprovalSubmission({ selection: "continue-planning" });
	assert.equal(fromSelection.decision, "continue-planning");
});

test("normalizeApprovalSubmission no longer throws on valid approval payloads", () => {
	assert.doesNotThrow(() => {
		const result = normalizeApprovalSubmission({
			decision: "auto-accept",
			planTitle: "Kanban To-Do App",
			planTasks: [{ id: "task-1", label: "Create route files", blockedBy: [] }],
		});
		assert.equal(result?.decision, "auto-accept");
	});
});
