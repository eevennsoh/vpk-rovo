const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

let appendWithRingBuffer;
let buildVoiceContextDescription;
let createAnnotationFromSelection;
let formatAnnotationsForVoiceContext;
let reindexAnnotations;
let artifactAnnotationsModulePromise;

async function loadArtifactAnnotationsModule() {
	if (!artifactAnnotationsModulePromise) {
		artifactAnnotationsModulePromise = esbuild
			.build({
				stdin: {
					contents: `
						export {
							appendWithRingBuffer,
							buildVoiceContextDescription,
							createAnnotationFromSelection,
							formatAnnotationsForVoiceContext,
							reindexAnnotations,
						} from "./components/ui-custom/lib/artifact-annotations.ts";
					`,
					loader: "ts",
					resolveDir: process.cwd(),
					sourcefile: "artifact-annotations-harness.ts",
				},
				bundle: true,
				format: "cjs",
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(result.outputFiles[0].text));
	}

	const module = await artifactAnnotationsModulePromise;
	appendWithRingBuffer = module.appendWithRingBuffer;
	buildVoiceContextDescription = module.buildVoiceContextDescription;
	createAnnotationFromSelection = module.createAnnotationFromSelection;
	formatAnnotationsForVoiceContext = module.formatAnnotationsForVoiceContext;
	reindexAnnotations = module.reindexAnnotations;
}

function createAnnotation(overrides = {}) {
	const {
		pendingSelection: pendingSelectionOverrides = {},
		...annotationOverrides
	} = overrides;
	const {
		anchor: anchorOverrides = {},
		source: sourceOverrides = {},
		position: positionOverrides = {},
		...pendingSelectionRest
	} = pendingSelectionOverrides;

	return createAnnotationFromSelection({
		comment: "Check this selection",
		documentId: "doc-1",
		documentVersionId: "v1",
		kind: "code",
		pendingSelection: {
			element: {},
			anchor: {
				selector: "pre code > span:nth-child(12)",
				textExcerpt: "Welcome to Rovo",
				htmlPreview: "<span>Welcome to Rovo</span>",
				codeLineNumber: 12,
				codeLineText: "Welcome to Rovo",
				...anchorOverrides,
			},
			source: {
				filePath: "components/ui-custom/artifact.tsx",
				lineNumber: 1,
				componentName: "ArtifactPanel",
				stackString: "in ArtifactPanel",
				...sourceOverrides,
			},
			position: {
				top: 24,
				left: 16,
				width: 120,
				height: 32,
				...positionOverrides,
			},
			...pendingSelectionRest,
		},
		...annotationOverrides,
	});
}

test("appendWithRingBuffer trims annotations to the latest 20 items", async () => {
	await loadArtifactAnnotationsModule();

	const annotations = Array.from({ length: 21 }, (_, index) =>
		createAnnotation({
			comment: `Comment ${index + 1}`,
			id: `annotation-${index + 1}`,
			createdAt: index + 1,
		}),
	);

	let buffered = [];
	for (const annotation of annotations) {
		buffered = appendWithRingBuffer(buffered, annotation, 20);
	}

	assert.equal(buffered.length, 20);
	assert.equal(buffered[0]?.comment, "Comment 2");
	assert.equal(buffered.at(-1)?.comment, "Comment 21");
	assert.deepEqual(
		buffered.map((annotation) => annotation.index),
		Array.from({ length: 20 }, (_, index) => index + 1),
	);
});

test("reindexAnnotations renumbers items after deletion", async () => {
	await loadArtifactAnnotationsModule();

	const annotations = [
		createAnnotation({ id: "annotation-1", comment: "First" }),
		createAnnotation({ id: "annotation-2", comment: "Second" }),
		createAnnotation({ id: "annotation-3", comment: "Third" }),
	];

	const reindexed = reindexAnnotations([annotations[0], annotations[2]]);

	assert.deepEqual(
		reindexed.map((annotation) => ({
			comment: annotation.comment,
			index: annotation.index,
		})),
		[
			{ comment: "First", index: 1 },
			{ comment: "Third", index: 2 },
		],
	);
});

test("formatAnnotationsForVoiceContext includes kind-specific code anchor details", async () => {
	await loadArtifactAnnotationsModule();

	const codeContext = formatAnnotationsForVoiceContext([
		reindexAnnotations([createAnnotation({ comment: "Make this heading larger" })])[0],
	]);

	assert.match(codeContext, /\[Artifact Annotations\]/u);
	assert.match(codeContext, /Artifact kind: code/u);
	assert.match(codeContext, /#1: "Make this heading larger"/u);
	assert.match(codeContext, /viewer anchor: code line 12/u);
	assert.match(codeContext, /selected text: "Welcome to Rovo"/u);
	assert.match(codeContext, /source: components\/ui-custom\/artifact\.tsx:1/u);
	assert.match(codeContext, /selector: pre code > span:nth-child\(12\)/u);

	const imageContext = formatAnnotationsForVoiceContext([
		reindexAnnotations([
			createAnnotation({
				comment: "Crop this tighter",
				kind: "image",
				pendingSelection: {
					anchor: {
						selector: "img",
						textExcerpt: "Hero image",
						htmlPreview: '<img alt="Hero image" />',
						imagePoint: { x: 0.42, y: 0.31 },
					},
					source: {
						filePath: null,
						lineNumber: null,
						componentName: null,
						stackString: "",
					},
				},
			}),
		])[0],
	]);

	assert.match(imageContext, /Artifact kind: image/u);
	assert.match(imageContext, /viewer anchor: image point \(0.42, 0.31\)/u);
	assert.match(imageContext, /selected text: "Hero image"/u);
});

test("sheet artifacts are annotatable and use generic viewer anchors", async () => {
	await loadArtifactAnnotationsModule();

	const sheetContext = formatAnnotationsForVoiceContext([
		reindexAnnotations([
			createAnnotation({
				comment: "Review this row",
				kind: "sheet",
				pendingSelection: {
					anchor: {
						selector: '[data-sheet-cell="A1"]',
						textExcerpt: "Revenue",
						htmlPreview: "<div>Revenue</div>",
						codeLineNumber: null,
						codeLineText: null,
						imagePoint: null,
					},
				},
			}),
		])[0],
	]);

	assert.match(sheetContext, /Artifact kind: sheet/u);
	assert.match(sheetContext, /viewer anchor: \[data-sheet-cell="A1"\]/u);
	assert.match(sheetContext, /selected text: "Revenue"/u);
});

test("buildVoiceContextDescription appends annotation context to existing voice context", async () => {
	await loadArtifactAnnotationsModule();

	const merged = buildVoiceContextDescription(
		"[Voice context] User wants to refine the current artifact.",
		"[Artifact Annotations]\n#1: \"Make this larger\"",
	);

	assert.equal(
		merged,
		[
			"[Voice context] User wants to refine the current artifact.",
			"[Artifact Annotations]",
			"#1: \"Make this larger\"",
		].join("\n\n").replace("\n\n#1", "\n#1"),
	);
	assert.equal(buildVoiceContextDescription(undefined, ""), "");
	assert.equal(buildVoiceContextDescription("Existing context", ""), "Existing context");
});
