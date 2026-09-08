const assert = require("node:assert/strict");
const test = require("node:test");

const {
	createJiraLinkingUniformBuffers,
	packJiraLinkingUniforms,
	resolveJiraLinkingAtlasUvRect,
	resolveJiraLinkingSplitAxis,
	JIRA_LINKING_ATLAS_CELL_PX,
	JIRA_LINKING_NO_ATLAS_INDEX,
} = require("./uniforms.ts");

const { JIRA_LINKING_MAX_BALLS } = require("./field.ts");

// Region origin is deliberately negative so the client -> region translation
// cannot pass by accident on a zero origin.
const REGION = { height: 400, left: -120, top: -40, width: 600 };

function ball(overrides = {}) {
	return {
		atlasIndex: -1,
		cx: 0,
		cy: 0,
		halfHeight: 11,
		halfWidth: 11,
		radius: 11,
		shape: "circle",
		tint: [0, 0, 0],
		...overrides,
	};
}

function frame(balls) {
	return {
		alpha: 1,
		balls,
		dispersion: 0,
		fuseProgress: 0,
		region: REGION,
		smoothness: 12,
	};
}

test("ball centres are translated from client space into region-local px", () => {
	const buffers = createJiraLinkingUniformBuffers();
	const count = packJiraLinkingUniforms(
		buffers,
		frame([ball({ cx: 80, cy: 60 })]),
		0,
	);

	assert.equal(count, 1);
	assert.equal(buffers.center[0], 200);
	assert.equal(buffers.center[1], 100);
});

test("pill balls flag shape 1 and circles flag shape 0", () => {
	const buffers = createJiraLinkingUniformBuffers();
	packJiraLinkingUniforms(
		buffers,
		frame([
			ball({ halfHeight: 16, halfWidth: 80, radius: 12, shape: "pill" }),
			ball(),
		]),
		0,
	);

	assert.equal(buffers.shape[0], 1);
	assert.equal(buffers.shape[1], 0);
	assert.equal(buffers.half[0], 80);
	assert.equal(buffers.half[1], 16);
});

test("an atlas index only survives when the atlas actually has that many cells", () => {
	const buffers = createJiraLinkingUniformBuffers();
	packJiraLinkingUniforms(
		buffers,
		frame([ball({ atlasIndex: 0 }), ball({ atlasIndex: 3 })]),
		2,
	);

	assert.equal(buffers.atlas[0], 0);
	assert.equal(buffers.atlas[1], JIRA_LINKING_NO_ATLAS_INDEX);
});

test("no atlas cells means every ball falls back to its tint", () => {
	const buffers = createJiraLinkingUniformBuffers();
	packJiraLinkingUniforms(buffers, frame([ball({ atlasIndex: 0 })]), 0);

	assert.equal(buffers.atlas[0], JIRA_LINKING_NO_ATLAS_INDEX);
});

test("tints are clamped into 0..1 so the shader can never receive out-of-gamut input", () => {
	const buffers = createJiraLinkingUniformBuffers();
	packJiraLinkingUniforms(
		buffers,
		frame([ball({ tint: [-1, 0.5, 4] })]),
		0,
	);

	assert.deepEqual(Array.from(buffers.tint.slice(0, 3)), [0, 0.5, 1]);
});

test("slots past the live ball count are zeroed and flagged untextured", () => {
	const buffers = createJiraLinkingUniformBuffers();
	packJiraLinkingUniforms(
		buffers,
		frame([ball({ atlasIndex: 0, cx: 900, cy: 900 }), ball({ cx: 800, cy: 800 })]),
		4,
	);
	const count = packJiraLinkingUniforms(buffers, frame([ball({ cx: 0, cy: 0 })]), 4);

	assert.equal(count, 1);
	assert.equal(buffers.center[2], 0);
	assert.equal(buffers.center[3], 0);
	assert.equal(buffers.radius[1], 0);
	assert.equal(buffers.atlas[1], JIRA_LINKING_NO_ATLAS_INDEX);
});

test("packing never writes past the shader's const loop bound", () => {
	const buffers = createJiraLinkingUniformBuffers();
	const overflowing = Array.from({ length: JIRA_LINKING_MAX_BALLS + 4 }, () => ball());
	const count = packJiraLinkingUniforms(buffers, frame(overflowing), 0);

	assert.equal(count, JIRA_LINKING_MAX_BALLS);
	assert.equal(buffers.atlas.length, JIRA_LINKING_MAX_BALLS);
	assert.equal(buffers.uvRect.length, JIRA_LINKING_MAX_BALLS * 4);
});

test("atlas cells tile the strip horizontally with a half-texel inset", () => {
	const inset = 0.5 / (4 * JIRA_LINKING_ATLAS_CELL_PX);
	const [u, v, width] = resolveJiraLinkingAtlasUvRect(2, 4);

	assert.equal(u, 0.5 + inset);
	assert.equal(width, 0.25 - inset * 2);
	assert.equal(v, 0.5 / JIRA_LINKING_ATLAS_CELL_PX);
});

test("an untextured or out-of-range cell resolves to the whole texture", () => {
	assert.deepEqual(resolveJiraLinkingAtlasUvRect(-1, 4), [0, 0, 1, 1]);
	assert.deepEqual(resolveJiraLinkingAtlasUvRect(0, 0), [0, 0, 1, 1]);
});

test("an index past the last cell clamps onto the last cell", () => {
	assert.deepEqual(
		resolveJiraLinkingAtlasUvRect(9, 3),
		resolveJiraLinkingAtlasUvRect(2, 3),
	);
});

test("a supplied velocity is the split axis verbatim", () => {
	const axis = resolveJiraLinkingSplitAxis(
		frame([ball({ cx: 0, cy: 0 }), ball({ cx: 300, cy: 0 })]),
		{ x: -4, y: 7 },
	);

	assert.deepEqual(axis, [-4, 7]);
});

test("no velocity falls back to the chip-to-dock axis", () => {
	const axis = resolveJiraLinkingSplitAxis(
		frame([ball({ cx: 100, cy: 50 }), ball({ cx: 340, cy: 210 })]),
		null,
	);

	assert.deepEqual(axis, [240, 160]);
});

test("a still chip with nowhere to dock produces no split axis at all", () => {
	assert.deepEqual(
		resolveJiraLinkingSplitAxis(frame([ball({ cx: 12, cy: 12 })]), { x: 0, y: 0 }),
		[0, 0],
	);
});

test("a non-finite velocity component cannot poison the split axis", () => {
	assert.deepEqual(
		resolveJiraLinkingSplitAxis(frame([ball()]), { x: Number.NaN, y: Number.NaN }),
		[0, 0],
	);
});
