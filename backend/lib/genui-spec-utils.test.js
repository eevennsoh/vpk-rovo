const test = require("node:test");
const assert = require("node:assert/strict");

const { extractDirectSpec } = require("./genui-spec-utils");

test("extractDirectSpec returns null for empty text", () => {
	assert.equal(extractDirectSpec(""), null);
	assert.equal(extractDirectSpec(null), null);
});

test("extractDirectSpec returns null when no spec fence is present", () => {
	assert.equal(extractDirectSpec("Hello, how can I help you?"), null);
	assert.equal(extractDirectSpec("Here is some code:\n```js\nconsole.log('hi');\n```"), null);
});

test("extractDirectSpec parses a valid spec fence", () => {
	const text = `Here is your dashboard:

\`\`\`spec
{"op":"add","path":"/root","value":"main"}
{"op":"add","path":"/elements/main","value":{"type":"Card","props":{"title":"Hello"},"children":[]}}
\`\`\``;

	const result = extractDirectSpec(text);
	assert.ok(result, "Expected a result");
	assert.ok(result.spec, "Expected a spec");
	assert.equal(result.spec.root, "main");
	assert.ok(result.spec.elements.main, "Expected elements.main");
	assert.equal(result.narrative, "Here is your dashboard:");
});

test("extractDirectSpec returns null for malformed spec", () => {
	const text = `\`\`\`spec
not valid json
\`\`\``;

	assert.equal(extractDirectSpec(text), null);
});

test("extractDirectSpec strips spec fence from narrative", () => {
	const text = `Introduction text.

\`\`\`spec
{"op":"add","path":"/root","value":"main"}
{"op":"add","path":"/elements/main","value":{"type":"Heading","props":{"text":"Test","level":"h2"},"children":[]}}
\`\`\`

Closing text.`;

	const result = extractDirectSpec(text);
	assert.ok(result, "Expected a result");
	assert.equal(result.narrative, "Introduction text.\n\nClosing text.");
});

test("extractDirectSpec handles unfenced JSONL patches mixed with text", () => {
	const text = [
		"Here's the latest Atlassian share price data:",
		'{"op":"add","path":"/root","value":"main"}',
		'{"op":"add","path":"/elements/main","value":{"type":"Stack","props":{"direction":"vertical","gap":"md"},"children":["heading","price"]}}',
		'{"op":"add","path":"/elements/heading","value":{"type":"Heading","props":{"text":"Atlassian Corp (TEAM)","level":"h2"},"children":[]}}',
		'{"op":"add","path":"/elements/price","value":{"type":"Metric","props":{"label":"Share Price","value":"$245.30","detail":"+1.2%","trend":"up"}}}',
		"Let me know if you need more details.",
	].join("\n");

	const result = extractDirectSpec(text);
	assert.ok(result, "Expected a result for unfenced JSONL patches");
	assert.equal(result.spec.root, "main");
	assert.ok(result.spec.elements.main, "Expected elements.main");
	assert.ok(result.spec.elements.heading, "Expected elements.heading");
	assert.ok(result.spec.elements.price, "Expected elements.price");
	assert.ok(
		result.narrative.includes("Atlassian share price"),
		"Narrative should contain intro text"
	);
	assert.ok(
		result.narrative.includes("more details"),
		"Narrative should contain closing text"
	);
	assert.ok(
		!result.narrative.includes('"op"'),
		"Narrative should NOT contain patch JSON"
	);
});

test("extractDirectSpec rejects unfenced text with only one patch line", () => {
	const text = [
		"Some text",
		'{"op":"add","path":"/root","value":"main"}',
		"More text",
	].join("\n");

	const result = extractDirectSpec(text);
	assert.equal(result, null, "Single patch line is not enough for a valid spec");
});
