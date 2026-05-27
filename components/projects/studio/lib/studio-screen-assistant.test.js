const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getStudioScreenAssistantPointerContext,
	getStudioScreenAssistantVisibleTargets,
	groundStudioScreenAssistantTarget,
	normalizeAgentDraftPatch,
} = require("./studio-screen-assistant.ts");

function createFakeElement({
	attrs = {},
	height = 20,
	id = "",
	text = "",
	width = 100,
	x = 0,
	y = 0,
	tagName = "button",
}) {
	return {
		id,
		innerText: text,
		tagName: tagName.toUpperCase(),
		textContent: text,
		getAttribute(name) {
			return attrs[name] ?? null;
		},
		getBoundingClientRect() {
			return {
				height,
				width,
				x,
				y,
			};
		},
	};
}

function withFakeDom({ elements, pointerElement }, callback) {
	const previousDocument = global.document;
	const previousWindow = global.window;

	global.window = {
		innerHeight: 720,
		innerWidth: 1280,
		scrollX: 10,
		scrollY: 20,
	};
	global.document = {
		elementFromPoint() {
			return pointerElement ?? null;
		},
		getElementById() {
			return null;
		},
		querySelectorAll() {
			return elements;
		},
	};

	try {
		return callback();
	} finally {
		global.document = previousDocument;
		global.window = previousWindow;
	}
}

test("normalizeAgentDraftPatch keeps only safe session draft fields", () => {
	assert.deepEqual(
		normalizeAgentDraftPatch({
			action: "update",
			agentId: "should-not-change",
			conversationStarters: ["Summarize this", "", 42, "Draft next steps"],
			description: "  Helps teams triage work  ",
			guardrail: "",
			name: "  Triage Copilot  ",
			tools: ["Jira", "  Confluence  "],
			unknown: "ignored",
		}),
		{
			action: "update",
			conversationStarters: ["Summarize this", "Draft next steps"],
			description: "Helps teams triage work",
			name: "Triage Copilot",
			tools: ["Jira", "Confluence"],
		},
	);

	assert.equal(normalizeAgentDraftPatch({ agentId: "ignored", name: "" }), null);
	assert.equal(normalizeAgentDraftPatch(null), null);
});

test("collects visible Studio screen assistant targets from DOM metadata", () => {
	const nameElement = createFakeElement({
		attrs: {
			"data-agent-field": "name",
			"data-screen-assistant-target": "studio-agent-config:name",
		},
		text: "Support Agent",
		x: 20,
		y: 30,
	});
	const hiddenElement = createFakeElement({
		attrs: {
			"data-screen-assistant-target": "hidden",
		},
		height: 0,
		text: "Hidden",
		width: 0,
	});

	withFakeDom({ elements: [nameElement, hiddenElement], pointerElement: null }, () => {
		assert.deepEqual(getStudioScreenAssistantVisibleTargets(), [
			{
				fieldId: "name",
				id: "studio-agent-config:name",
				label: "Support Agent",
				rect: {
					height: 20,
					width: 100,
					x: 20,
					y: 30,
				},
				role: "button",
			},
		]);
	});
});

test("extracts pointer context from elementFromPoint", () => {
	const pointerElement = createFakeElement({
		attrs: {
			"aria-label": "Start live voice",
			"data-screen-assistant-target": "studio-composer:voice",
		},
		x: 100,
		y: 200,
	});

	withFakeDom({ elements: [], pointerElement }, () => {
		assert.deepEqual(getStudioScreenAssistantPointerContext({ x: 110, y: 210 }), {
			x: 110,
			y: 210,
			viewport: {
				height: 720,
				scrollX: 10,
				scrollY: 20,
				width: 1280,
			},
			target: {
				id: "studio-composer:voice",
				label: "Start live voice",
				rect: {
					height: 20,
					width: 100,
					x: 100,
					y: 200,
				},
				role: "button",
			},
		});
	});
});

test("grounds targets by id, field, label, then pointer fallback", () => {
	const visibleTargets = [
		{
			fieldId: "instructions",
			id: "studio-agent-config:instructions",
			label: "Instructions",
			rect: { height: 100, width: 400, x: 40, y: 80 },
		},
		{
			fieldId: "tools",
			id: "studio-agent-config:tools",
			label: "Add tools",
			rect: { height: 44, width: 180, x: 40, y: 220 },
		},
	];
	const pointerTarget = {
		id: "pointer-target",
		label: "Pointer fallback",
		rect: { height: 20, width: 20, x: 1, y: 2 },
	};

	assert.equal(
		groundStudioScreenAssistantTarget({
			id: "studio-agent-config:tools",
			pointerTarget,
			visibleTargets,
		}),
		visibleTargets[1],
	);
	assert.equal(
		groundStudioScreenAssistantTarget({
			fieldId: "instructions",
			pointerTarget,
			visibleTargets,
		}),
		visibleTargets[0],
	);
	assert.equal(
		groundStudioScreenAssistantTarget({
			label: "tools",
			pointerTarget,
			visibleTargets,
		}),
		visibleTargets[1],
	);
	assert.equal(
		groundStudioScreenAssistantTarget({
			label: "missing",
			pointerTarget,
			visibleTargets,
		}),
		pointerTarget,
	);
});
