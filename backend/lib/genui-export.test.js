const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { mapSpec, generateReactCode, exportSpec, EXPORT_FORMATS } = require("./genui-export");

// ── Sample spec ──────────────────────────────────────────────────

const sampleSpec = {
	root: "root",
	state: {
		userName: "Alice",
		accepted: true,
	},
	elements: {
		root: {
			type: "Stack",
			props: { direction: "vertical", gap: "md" },
			children: ["heading", "text", "badge", "input", "sep", "btn"],
		},
		heading: {
			type: "Heading",
			props: { text: "Dashboard", level: "h1" },
		},
		text: {
			type: "Text",
			props: { content: "Welcome to the dashboard.", muted: true },
		},
		badge: {
			type: "Badge",
			props: { text: "New", variant: "success" },
		},
		input: {
			type: "TextInput",
			props: {
				label: "Your name",
				value: { $bindState: "/userName" },
			},
		},
		sep: {
			type: "Separator",
			props: { orientation: "horizontal" },
		},
		btn: {
			type: "Button",
			props: { label: "Submit", variant: "default" },
		},
	},
};

const chartSpec = {
	root: "root",
	elements: {
		root: {
			type: "Stack",
			props: { direction: "vertical", gap: "md" },
			children: ["chart"],
		},
		chart: {
			type: "BarChart",
			props: {
				title: "Revenue by Region",
				data: [{ region: "North", revenue: 4500 }],
				xKey: "region",
				yKey: "revenue",
			},
		},
	},
};

const threeDSpec = {
	root: "scene",
	elements: {
		scene: {
			type: "Scene3D",
			props: { background: "#111", height: "400px" },
			children: ["box"],
		},
		box: {
			type: "Box",
			props: { position: [0, 0, 0], size: [1, 1, 1], color: "red" },
		},
	},
};

// ── Tests ────────────────────────────────────────────────────────

describe("mapSpec", () => {
	it("maps a basic spec to PDF format", () => {
		const result = mapSpec(sampleSpec, "pdf");
		assert.ok(result.root, "PDF spec has a root");
		assert.ok(result.elements, "PDF spec has elements");

		// Root should be a Document
		const rootEl = result.elements[result.root];
		assert.equal(rootEl.type, "Document");

		// Should have a Page
		const pageKey = rootEl.children[0];
		const pageEl = result.elements[pageKey];
		assert.equal(pageEl.type, "Page");
	});

	it("maps a basic spec to image format", () => {
		const result = mapSpec(sampleSpec, "image");
		const rootEl = result.elements[result.root];
		assert.equal(rootEl.type, "Frame");
	});

	it("resolves $bindState expressions from external state", () => {
		const result = mapSpec(sampleSpec, "pdf", { userName: "Bob" });
		// TextInput should become static Text with resolved value
		const inputEl = result.elements["input"];
		assert.ok(inputEl, "Input element exists");
		assert.equal(inputEl.type, "Text");
		assert.ok(inputEl.props.text.includes("Bob"), "State resolved in text");
	});

	it("converts charts to placeholder text", () => {
		const result = mapSpec(chartSpec, "pdf");
		const chartEl = result.elements["chart"];
		assert.ok(chartEl, "Chart element mapped");
		assert.equal(chartEl.type, "Text");
		assert.ok(chartEl.props.text.includes("Revenue by Region"), "Chart title preserved as placeholder");
	});

	it("drops 3D elements entirely", () => {
		const result = mapSpec(threeDSpec, "pdf");
		assert.ok(!result.elements["scene"] || result.elements["scene"].type !== "Scene3D", "Scene3D dropped");
		assert.ok(!result.elements["box"] || result.elements["box"].type !== "Box", "3D Box dropped");
	});
});

describe("generateReactCode", () => {
	it("generates a valid React component string", () => {
		const code = generateReactCode(sampleSpec, "MyDashboard");
		assert.ok(code.includes("export function MyDashboard"), "Has exported function");
		assert.ok(code.includes("use client"), "Has use client directive");
	});

	it("uses default component name when not specified", () => {
		const code = generateReactCode(sampleSpec);
		assert.ok(code.includes("export function GeneratedUI"), "Uses default name");
	});
});

describe("EXPORT_FORMATS", () => {
	it("contains all supported formats", () => {
		assert.ok(EXPORT_FORMATS.includes("pdf"));
		assert.ok(EXPORT_FORMATS.includes("png"));
		assert.ok(EXPORT_FORMATS.includes("react-code"));
	});
});

describe("exportSpec", () => {
	it("exports react-code format", async () => {
		const result = await exportSpec(sampleSpec, "react-code", { title: "test" });
		assert.equal(result.contentType, "text/plain; charset=utf-8");
		assert.equal(result.filename, "test.tsx");
		assert.ok(Buffer.isBuffer(result.data), "Data is a buffer");
		const code = result.data.toString("utf-8");
		assert.ok(code.includes("export function"), "Contains exported function");
	});

	it("rejects unsupported format", async () => {
		await assert.rejects(
			() => exportSpec(sampleSpec, "docx"),
			/Unsupported export format/
		);
	});

	it("sanitizes title for filename", async () => {
		const result = await exportSpec(sampleSpec, "react-code", { title: "My Report: Q4/2025!" });
		assert.ok(!result.filename.includes("/"), "No slashes in filename");
		assert.ok(!result.filename.includes("!"), "No exclamation in filename");
	});
});
