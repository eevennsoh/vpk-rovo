const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildFigmaStructuredSpec,
} = require("./genui-figma-tool-handler");

/** Helper to get the FigmaDesignContext element props from a result */
function getFigmaProps(result) {
	return result?.spec?.elements?.["figma-context"]?.props;
}

test("buildFigmaStructuredSpec uses file-aware byline when description is generic", () => {
	const result = buildFigmaStructuredSpec({
		description: "Design context extracted from Figma.",
		observations: [
			{
				phase: "result",
				toolName: "mcp__figma__get_design_context",
				rawOutput: {
					componentName: "Frame 2087",
					fileName: "Agents Team",
					code: "export default function Frame2087() { return <div />; }",
				},
			},
		],
	});

	assert.ok(result);
	assert.equal(result.source, "tool-observation-figma-structured");
	const props = getFigmaProps(result);
	assert.equal(props.description, "Frame Frame 2087 from Agents Team.");
});

test("buildFigmaStructuredSpec extracts file metadata from figma URLs", () => {
	const result = buildFigmaStructuredSpec({
		description: "Generated from tool execution results.",
		observations: [
			{
				phase: "result",
				toolName: "mcp__figma__get_metadata",
				rawOutput: {
					figmaUrl: "https://www.figma.com/design/Z7s9yYVT71XrtFPRHJC7pV/Agents-Team?node-id=277-3811",
					screenshotUrl: "https://example.com/screenshot.png",
				},
			},
		],
	});

	assert.ok(result);
	assert.equal(result.source, "tool-observation-figma-structured");
	const props = getFigmaProps(result);
	assert.match(props.description, /^Design context from Agents Team/i);
});

test("extracts code from array-of-strings rawOutput (get_design_context format)", () => {
	const result = buildFigmaStructuredSpec({
		observations: [
			{
				phase: "result",
				toolName: "mcp__plugin_figma_figma__get_design_context",
				rawOutput: [
					'export default function Frame() {\n  return <div className="w-full">Hello</div>;\n}',
					"SUPER CRITICAL: The generated React+Tailwind code MUST be converted to your project's stack.",
					"Node ids have been added to the code for reference.",
					"Image assets are stored on a localhost server.",
				],
				text: '[\n  "export default function...',
			},
		],
	});

	assert.ok(result, "should return a result");
	assert.equal(result.spec.root, "figma-context");
	assert.equal(result.spec.elements["figma-context"].type, "FigmaDesignContext");
	const props = getFigmaProps(result);
	assert.match(props.code, /export default function Frame/);
	// Should NOT contain AI instruction text
	assert.ok(!props.code.includes("SUPER CRITICAL"));
});

test("extracts code from MCP content block objects", () => {
	const result = buildFigmaStructuredSpec({
		observations: [
			{
				phase: "result",
				toolName: "mcp__plugin_figma_figma__get_design_context",
				rawOutput: [
					{ type: "text", text: 'export default function Card() {\n  return <div className="p-4">Card</div>;\n}' },
					{ type: "text", text: "SUPER CRITICAL: Must be converted to target stack." },
				],
				text: "preview text",
			},
		],
	});

	assert.ok(result, "should return a result");
	const props = getFigmaProps(result);
	assert.match(props.code, /export default function Card/);
});

test("renders card even without code when there are Figma results", () => {
	const result = buildFigmaStructuredSpec({
		observations: [
			{
				phase: "result",
				toolName: "mcp__plugin_figma_figma__get_design_context",
				rawOutput: [
					"SUPER CRITICAL: instructions only",
					"After you call this tool, do X",
				],
				text: "some preview",
			},
		],
	});

	assert.ok(result, "should still return a result");
	assert.equal(result.spec.root, "figma-context");
	assert.equal(result.spec.elements["figma-context"].type, "FigmaDesignContext");
	const props = getFigmaProps(result);
	assert.equal(props.code, null);
});

test("skips truncated JSON array texts in fallback code extraction", () => {
	// Simulates the toPreview output: truncated pretty-printed JSON that fails JSON.parse
	const result = buildFigmaStructuredSpec({
		observations: [
			{
				phase: "result",
				toolName: "mcp__plugin_figma_figma__get_design_context",
				text: '[\n  "export default function Frame() {\\"use cli',
			},
		],
	});

	assert.ok(result, "should return a result");
	const props = getFigmaProps(result);
	// Should NOT extract the truncated JSON array as code
	assert.equal(props.code, null, "should not have code from truncated JSON array");
});

test("extracts code from wrapper object with nested content array", () => {
	const result = buildFigmaStructuredSpec({
		observations: [
			{
				phase: "result",
				toolName: "mcp__plugin_figma_figma__get_design_context",
				rawOutput: {
					content: [
						{ type: "text", text: 'export default function Wrapper() {\n  return <div className="flex">Nested</div>;\n}' },
						{ type: "text", text: "SUPER CRITICAL: Must be converted." },
					],
					isError: false,
				},
				text: "preview",
			},
		],
	});

	assert.ok(result, "should return a result");
	const props = getFigmaProps(result);
	assert.match(props.code, /export default function Wrapper/);
});

test("extracts code from raw string rawOutput (plain code string)", () => {
	// Simulates rawOutput being a plain code string that doesn't parse as JSON
	const result = buildFigmaStructuredSpec({
		observations: [
			{
				phase: "result",
				toolName: "mcp__plugin_figma_figma__get_design_context",
				rawOutput: 'export default function PlainCode() {\n  return <div className="p-2">Hello</div>;\n}',
				text: '[\n  "export default function PlainCode...',
			},
		],
	});

	assert.ok(result, "should return a result");
	const props = getFigmaProps(result);
	assert.match(props.code, /export default function PlainCode/);
});

test("extracts code from parseable JSON array text when rawOutput is missing", () => {
	// Simulates thinking_event observation: no rawOutput, text is valid JSON array
	const jsonArray = JSON.stringify([
		'export default function FromText() {\n  return <div className="w-full">Text</div>;\n}',
		"SUPER CRITICAL: Must be converted.",
	]);
	const result = buildFigmaStructuredSpec({
		observations: [
			{
				phase: "result",
				toolName: "mcp__plugin_figma_figma__get_design_context",
				text: jsonArray,
			},
		],
	});

	assert.ok(result, "should return a result");
	const props = getFigmaProps(result);
	assert.match(props.code, /export default function FromText/);
});

test("builds figmaUrl from extracted fileKey and nodeId", () => {
	const result = buildFigmaStructuredSpec({
		description: "Generated from tool execution results.",
		observations: [
			{
				phase: "result",
				toolName: "mcp__figma__get_metadata",
				rawOutput: {
					figmaUrl: "https://www.figma.com/design/Z7s9yYVT71XrtFPRHJC7pV/Agents-Team?node-id=277-3811",
				},
			},
		],
	});

	assert.ok(result);
	const props = getFigmaProps(result);
	assert.equal(props.figmaUrl, "https://www.figma.com/design/Z7s9yYVT71XrtFPRHJC7pV?node-id=277-3811");
});

test("figmaUrl is null when no fileKey is available", () => {
	const result = buildFigmaStructuredSpec({
		observations: [
			{
				phase: "result",
				toolName: "mcp__plugin_figma_figma__get_design_context",
				rawOutput: [
					'export default function Frame() {\n  return <div>Hello</div>;\n}',
				],
				text: "preview",
			},
		],
	});

	assert.ok(result);
	const props = getFigmaProps(result);
	assert.equal(props.figmaUrl, null);
});
