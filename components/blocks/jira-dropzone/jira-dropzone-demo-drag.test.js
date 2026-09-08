const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	collectCreateDropZones,
	resolveArmedCreateTitle,
	resolveArmedCreateTitleFromRoot,
} = require("./lib/jira-dropzone-demo-drag.ts");

const TODO = {
	bounds: { bottom: 200, left: 0, right: 200, top: 100 },
	columnTitle: "To Do",
	kind: "create",
};
const IN_PROGRESS = {
	bounds: { bottom: 200, left: 220, right: 420, top: 100 },
	columnTitle: "In Progress",
	kind: "create",
};

test("pointer over one create well arms that column", () => {
	assert.equal(resolveArmedCreateTitle({ x: 100, y: 150 }, [TODO, IN_PROGRESS]), "To Do");
	assert.equal(
		resolveArmedCreateTitle({ x: 300, y: 150 }, [TODO, IN_PROGRESS]),
		"In Progress",
	);
});

test("pointer outside every create well arms none", () => {
	assert.equal(resolveArmedCreateTitle({ x: 100, y: 10 }, [TODO, IN_PROGRESS]), null);
});

test("two overlapping create wells are ambiguous rather than DOM-ordered", () => {
	const overlap = { ...IN_PROGRESS, bounds: TODO.bounds };
	assert.equal(resolveArmedCreateTitle({ x: 100, y: 150 }, [TODO, overlap]), null);
});

test("collectCreateDropZones reads the board create data attributes", () => {
	const node = {
		dataset: {
			boardAgentSessionColumnTitle: "To Do",
			boardAgentSessionDropZone: "create",
		},
		getBoundingClientRect: () => ({ bottom: 20, left: 0, right: 10, top: 0 }),
	};
	const root = {
		querySelectorAll: () => [node],
	};
	assert.deepEqual(collectCreateDropZones(root), [{
		bounds: { bottom: 20, left: 0, right: 10, top: 0 },
		columnTitle: "To Do",
		kind: "create",
	}]);
	assert.equal(
		resolveArmedCreateTitleFromRoot({ x: 5, y: 10 }, root),
		"To Do",
	);
	assert.deepEqual(collectCreateDropZones(null), []);
});

test("create wells without a column title are skipped", () => {
	const root = {
		querySelectorAll: () => [{
			dataset: { boardAgentSessionDropZone: "create" },
			getBoundingClientRect: () => ({ bottom: 20, left: 0, right: 10, top: 0 }),
		}],
	};
	assert.deepEqual(collectCreateDropZones(root), []);
});
