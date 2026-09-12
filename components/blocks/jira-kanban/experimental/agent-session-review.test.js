const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

// Exercise the page's actual hook callbacks without importing its UI tree.
const page = readFileSync(join(__dirname, "page.tsx"), "utf8");
const start = page.indexOf("function useAgentSessionReview(");
assert.notEqual(start, -1);
const hook = ts.transpileModule(page.slice(start, page.indexOf("export default function", start)), {
	compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;

function renderReview(enabled) {
	const updates = [];
	const reviewed = [];
	let stateIndex = 0;
	const reviewHook = runInNewContext(`${hook}; useAgentSessionReview`, {
		useState(initialValue) {
			const index = stateIndex++;
			return [initialValue, (value) => updates.push({ index, value })];
		},
		useCallback: (callback) => callback,
	});
	return {
		model: reviewHook(true, enabled, (ids) => reviewed.push(ids)),
		updates,
		reviewed,
	};
}

test("disabled hover suggestions acknowledge sessions without publishing preview state", () => {
	const { model, updates, reviewed } = renderReview(false);
	model.handleUntrackedItemHover({ id: "session-a" });
	model.handleUntrackedItemHover({ id: "session-b" });
	model.handleUntrackedItemHover(null);
	assert.equal(updates.length, 0);
	assert.deepEqual(reviewed.map((ids) => Array.from(ids)), [["session-a"], ["session-b"]]);
	assert.equal(model.untrackedHoveredSession, null);
});

test("enabled hover suggestions publish and clear previews while still acknowledging sessions", () => {
	const { model, updates, reviewed } = renderReview(true);
	const session = { id: "session-a" };
	model.handleUntrackedItemHover(session);
	model.handleUntrackedItemHover(null);
	assert.deepEqual(updates, [{ index: 1, value: session }, { index: 1, value: null }]);
	assert.deepEqual(reviewed.map((ids) => Array.from(ids)), [["session-a"]]);
});

test("expanding the session panel acknowledges all sessions regardless of preview capability", () => {
	for (const enabled of [false, true]) {
		const { model, updates, reviewed } = renderReview(enabled);
		model.handleAgentSessionColumnCollapsedChange(false);
		model.handleAgentSessionColumnCollapsedChange(true);
		assert.deepEqual(updates, [{ index: 0, value: false }, { index: 0, value: true }]);
		assert.deepEqual(reviewed, [undefined]);
	}
});
