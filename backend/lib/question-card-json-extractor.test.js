const test = require("node:test");
const assert = require("node:assert/strict");
const {
	extractQuestionCardJsonFromAssistantText,
} = require("./question-card-json-extractor");

test("returns null when input is not a string or empty", () => {
	assert.equal(extractQuestionCardJsonFromAssistantText(""), null);
	assert.equal(extractQuestionCardJsonFromAssistantText(null), null);
	assert.equal(extractQuestionCardJsonFromAssistantText(undefined), null);
	assert.equal(extractQuestionCardJsonFromAssistantText(42), null);
});

test("returns null when no fenced block is present", () => {
	const text =
		"Sure! Before I draft anything I have a few questions:\n1. Who's the audience?\n2. How technical?";
	assert.equal(extractQuestionCardJsonFromAssistantText(text), null);
});

test("returns null when fenced block has invalid JSON", () => {
	const text = "Before drafting:\n```question-card\n{ not: valid json,\n```";
	assert.equal(extractQuestionCardJsonFromAssistantText(text), null);
});

test("returns null when JSON lacks questions array", () => {
	const text =
		"```question-card\n{\n  \"title\": \"Pick options\"\n}\n```";
	assert.equal(extractQuestionCardJsonFromAssistantText(text), null);
});

test("returns null when questions array is empty", () => {
	const text =
		'```question-card\n{ "title": "x", "questions": [] }\n```';
	assert.equal(extractQuestionCardJsonFromAssistantText(text), null);
});

test("happy path: parses single-select question with options", () => {
	const text = [
		"```question-card",
		"{",
		'  "title": "Help me clarify this",',
		'  "description": "Two quick questions.",',
		'  "questions": [',
		"    {",
		'      "id": "audience",',
		'      "label": "Who is the audience?",',
		'      "description": "Drives the tone.",',
		'      "required": true,',
		'      "kind": "single-select",',
		'      "options": [',
		'        { "id": "team", "label": "My direct team" },',
		'        { "id": "leadership", "label": "Leadership" }',
		"      ]",
		"    }",
		"  ]",
		"}",
		"```",
		"",
		"Once you pick, I will draft accordingly.",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result, "expected a payload");
	assert.equal(result.payload.type, "question-card");
	assert.equal(result.payload.title, "Help me clarify this");
	assert.equal(result.payload.description, "Two quick questions.");
	assert.equal(result.payload.questions.length, 1);
	const q = result.payload.questions[0];
	assert.equal(q.id, "audience");
	assert.equal(q.label, "Who is the audience?");
	assert.equal(q.description, "Drives the tone.");
	assert.equal(q.required, true);
	assert.equal(q.kind, "single-select");
	assert.deepEqual(q.options, [
		{ id: "team", label: "My direct team" },
		{ id: "leadership", label: "Leadership" },
	]);
});

test("strips the JSON fence from cleanedText", () => {
	const text = [
		"Here are a few quick questions:",
		"",
		"```question-card",
		'{ "questions": [{ "id": "a", "label": "A?", "kind": "single-select", "options": [{ "id": "x", "label": "X" }, { "id": "y", "label": "Y" }] }] }',
		"```",
		"",
		"Once you answer I will proceed.",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result);
	assert.ok(
		!result.cleanedText.includes("```"),
		"cleanedText should not contain any fence markers",
	);
	assert.ok(
		!result.cleanedText.includes('"questions"'),
		"cleanedText should not contain the JSON body",
	);
	assert.match(result.cleanedText, /Here are a few quick questions/);
	assert.match(result.cleanedText, /Once you answer I will proceed/);
});

test("first fenced block wins when multiple are present", () => {
	const text = [
		"```question-card",
		'{ "title": "First", "questions": [{ "id": "a", "label": "First?", "kind": "single-select", "options": [{ "id": "x", "label": "X" }, { "id": "y", "label": "Y" }] }] }',
		"```",
		"```question-card",
		'{ "title": "Second", "questions": [{ "id": "b", "label": "Second?", "kind": "single-select", "options": [{ "id": "x", "label": "X" }] }] }',
		"```",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result);
	assert.equal(result.payload.title, "First");
	assert.equal(result.payload.questions[0].label, "First?");
});

test("also matches a generic ```json fence as a fallback", () => {
	const text = [
		"```json",
		'{ "questions": [{ "id": "q", "label": "Q?", "kind": "single-select", "options": [{ "id": "x", "label": "X" }, { "id": "y", "label": "Y" }] }] }',
		"```",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result);
	assert.equal(result.payload.questions[0].id, "q");
});

test("caps fenced question-card payloads to four questions", () => {
	const questions = Array.from({ length: 6 }, (_, index) => ({
		id: `q-${index + 1}`,
		label: `Question ${index + 1}?`,
		kind: "single-select",
		options: [
			{ id: "yes", label: "Yes" },
			{ id: "no", label: "No" },
		],
	}));
	const text = [
		"```question-card",
		JSON.stringify({ questions }),
		"```",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result);
	assert.deepEqual(
		result.payload.questions.map((question) => question.id),
		["q-1", "q-2", "q-3", "q-4"],
	);
});

test("text kind has no options and is accepted", () => {
	const text = [
		"```question-card",
		'{ "questions": [{ "id": "free", "label": "Anything else?", "kind": "text" }] }',
		"```",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result);
	assert.equal(result.payload.questions[0].kind, "text");
	assert.deepEqual(result.payload.questions[0].options, []);
});

test("rejects select-kind question with zero options (would render as text)", () => {
	const text = [
		"```question-card",
		'{ "questions": [{ "id": "x", "label": "X?", "kind": "single-select" }] }',
		"```",
	].join("\n");

	assert.equal(extractQuestionCardJsonFromAssistantText(text), null);
});

test("dedupes duplicate question ids and option ids", () => {
	const text = [
		"```question-card",
		'{ "questions": [',
		'  { "id": "x", "label": "First?", "kind": "single-select", "options": [{ "id": "a", "label": "A" }, { "id": "a", "label": "Duplicate" }, { "id": "b", "label": "B" }] },',
		'  { "id": "x", "label": "Second?", "kind": "single-select", "options": [{ "id": "c", "label": "C" }, { "id": "d", "label": "D" }] }',
		"] }",
		"```",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result);
	assert.equal(result.payload.questions.length, 2);
	assert.equal(result.payload.questions[0].id, "x");
	assert.equal(result.payload.questions[1].id, "x-2");
	// Duplicate option `a` deduped to a single entry.
	assert.deepEqual(result.payload.questions[0].options, [
		{ id: "a", label: "A" },
		{ id: "b", label: "B" },
	]);
});

test("dedupes duplicate option labels even when option ids differ", () => {
	const text = [
		"```question-card",
		'{ "questions": [{ "id": "priority", "label": "Which priority?", "kind": "single-select", "options": [',
		'  { "id": "p1", "label": "Critical" },',
		'  { "id": "p2", "label": " critical " },',
		'  { "id": "p3", "label": "Normal" }',
		"] }] }",
		"```",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result);
	assert.deepEqual(result.payload.questions[0].options, [
		{ id: "p1", label: "Critical" },
		{ id: "p3", label: "Normal" },
	]);
});

test("normalizes unknown kind to single-select", () => {
	const text = [
		"```question-card",
		'{ "questions": [{ "id": "q", "label": "Q?", "kind": "weird", "options": [{ "id": "x", "label": "X" }, { "id": "y", "label": "Y" }] }] }',
		"```",
	].join("\n");

	const result = extractQuestionCardJsonFromAssistantText(text);
	assert.ok(result);
	assert.equal(result.payload.questions[0].kind, "single-select");
});
