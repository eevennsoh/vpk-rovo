const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(
	path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"),
);

const ROOT = path.join(__dirname, "..", "..", "..");
const COMPONENT_SOURCE = fs.readFileSync(
	path.join(__dirname, "thinking-orb.tsx"),
	"utf8",
);
const INDEX_SOURCE = fs.readFileSync(path.join(__dirname, "index.ts"), "utf8");
const TYPES_SOURCE = fs.readFileSync(path.join(__dirname, "types.ts"), "utf8");
const THEME_SOURCE = fs.readFileSync(path.join(__dirname, "theme.ts"), "utf8");
const CURSOR_SOURCE = fs.readFileSync(
	path.join(__dirname, "cursor-gravity.ts"),
	"utf8",
);
const DEMO_SOURCE = fs.readFileSync(
	path.join(ROOT, "components/website/demos/visual/thinking-orbs-demo.tsx"),
	"utf8",
);
const DETAIL_SOURCE = fs.readFileSync(
	path.join(ROOT, "app/data/details/visual/thinking-orbs.ts"),
	"utf8",
);
const REGISTRY_SOURCE = fs.readFileSync(
	path.join(ROOT, "components/website/registry/visual.ts"),
	"utf8",
);
const PACKAGE_JSON = JSON.parse(
	fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
);

async function loadLocal(relPath) {
	const result = await esbuild.build({
		entryPoints: [path.join(__dirname, relPath)],
		bundle: true,
		format: "cjs",
		platform: "node",
		write: false,
		external: ["thinking-orbs", "thinking-orbs/engine", "react"],
	});
	return loadCjsModuleFromText(result.outputFiles[0].text);
}

// ---------------------------------------------------------------------
// Upstream is imported, not vendored
// ---------------------------------------------------------------------

test("Thinking Orbs consumes the pinned upstream package, not a fork", () => {
	assert.equal(
		PACKAGE_JSON.dependencies["thinking-orbs"],
		"0.3.1",
		"the library must stay pinned to an exact version",
	);
	assert.match(COMPONENT_SOURCE, /from "thinking-orbs"/u);
	assert.match(COMPONENT_SOURCE, /from "thinking-orbs\/engine"/u);
	assert.match(INDEX_SOURCE, /from "thinking-orbs\/engine"/u);
	// provenance recorded for whoever upgrades next
	assert.match(INDEX_SOURCE, /thinking-orbs 0\.3\.1/u);
	assert.match(INDEX_SOURCE, /github\.com\/Jakubantalik\/thinking-orbs/u);
});

test("Thinking Orbs keeps no vendored copy of upstream source", () => {
	for (const stale of ["engine", "ThinkingOrb.tsx", "presets.ts"]) {
		assert.equal(
			fs.existsSync(path.join(__dirname, stale)),
			false,
			`${stale} is upstream's — it must not be re-vendored`,
		);
	}
	const owned = fs
		.readdirSync(__dirname)
		.filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"))
		.sort();
	assert.deepEqual(owned, [
		"cursor-gravity.ts",
		"index.ts",
		"orb-gravity.ts",
		"theme.ts",
		"thinking-orb.tsx",
		"types.ts",
	]);
});

test("Thinking Orb delegates to upstream unless a VPK effect is on", () => {
	// gravity off → upstream renders, so its lifecycle stays upstream's
	assert.match(COMPONENT_SOURCE, /<UpstreamThinkingOrb \{\.\.\.props\} \/>/u);
	// gravity on → our loop, still upstream's geometry and painter
	assert.match(COMPONENT_SOURCE, /MODE_FRAMES\[mode\]/u);
	assert.match(COMPONENT_SOURCE, /paintFrame\(/u);
	assert.match(COMPONENT_SOURCE, /resolvePreset\(state, size\)/u);
});

test("Thinking Orb preserves accessibility, reduced motion, and visibility pausing", () => {
	assert.match(COMPONENT_SOURCE, /^"use client";/u);
	assert.match(COMPONENT_SOURCE, /role="img"/u);
	assert.match(COMPONENT_SOURCE, /if \(reduced\) \{\s*frame\(0\.6\);/u);
	assert.match(COMPONENT_SOURCE, /IntersectionObserver/u);
	assert.match(COMPONENT_SOURCE, /visibilitychange/u);
	assert.match(THEME_SOURCE, /getAttribute\("data-color-mode"\)/u);
	assert.match(
		THEME_SOURCE,
		/useMediaQuery\("\(prefers-reduced-motion: reduce\)"\)/u,
	);
});

// ---------------------------------------------------------------------
// Dot gravity (VPK) — pure transform over upstream geometry
// ---------------------------------------------------------------------

const dotAt = (x, y, r = 2) => ({ x, y, z: 0, r, white: 0.5 });

function warpAt(overrides = {}) {
	return {
		x: 0,
		y: 0,
		amount: 1,
		radius: 100,
		pull: 10,
		swell: 0.5,
		...overrides,
	};
}

test("dot gravity pulls a point toward the pointer", async () => {
	const { warpPoint } = await loadLocal("orb-gravity.ts");
	const moved = warpPoint(warpAt(), 20, 0);

	assert.ok(moved.x < 20, "point should travel toward the pointer at x=0");
	assert.ok(moved.x > 0, "point must not reach or pass the pointer");
	assert.equal(moved.y, 0, "no drift off the pointer axis");
	assert.ok(moved.gain > 1, "a pulled dot swells");
});

test("dot gravity falls off monotonically and dies at the radius", async () => {
	const { warpPoint } = await loadLocal("orb-gravity.ts");
	const warp = warpAt();

	// Displacement must shrink with distance once far enough out that the
	// overshoot clamp no longer binds. Closer in, the clamp — not the
	// field — sets the step, which the overshoot test covers separately.
	let previous = Infinity;
	for (const distance of [20, 30, 40, 60, 80, 95]) {
		const shift = distance - warpPoint(warp, distance, 0).x;
		assert.ok(shift < previous, `displacement must shrink by ${distance}px`);
		previous = shift;
	}

	// exactly zero at and beyond the boundary — dots must not pop out
	for (const distance of [100, 140, 1000]) {
		const edge = warpPoint(warp, distance, 0);
		assert.equal(edge.x, distance, `no displacement at ${distance}px`);
		assert.equal(edge.gain, 1, `no swell at ${distance}px`);
	}
	assert.ok(99.9 - warpPoint(warp, 99.9, 0).x < 0.01, "continuous at the edge");
});

test("dot gravity never lets a dot overshoot the pointer", async () => {
	const { warpPoint } = await loadLocal("orb-gravity.ts");
	const warp = warpAt({ pull: 500 });

	for (const distance of [0.5, 1, 2, 5, 10]) {
		const moved = warpPoint(warp, distance, 0);
		assert.ok(
			moved.x > 0 && moved.x < distance,
			`dot at ${distance}px must close the gap without crossing the pointer`,
		);
	}

	const atPointer = warpPoint(warp, 0, 0);
	assert.equal(atPointer.x, 0);
	assert.ok(Number.isFinite(atPointer.gain));
});

test("dot gravity is inert at zero engagement", async () => {
	const { warpPoint, warpFrame } = await loadLocal("orb-gravity.ts");
	const resting = warpPoint(warpAt({ amount: 0 }), 20, 15);
	assert.equal(resting.x, 20);
	assert.equal(resting.y, 15);
	assert.equal(resting.gain, 1);

	// the frame transform short-circuits to the very same object
	const frame = { dots: [dotAt(20, 0)], lines: [] };
	assert.equal(warpFrame(frame, null), frame);
	assert.equal(warpFrame(frame, warpAt({ amount: 0 })), frame);
});

test("dot gravity scales with engagement as it eases in", async () => {
	const { warpPoint } = await loadLocal("orb-gravity.ts");
	const partial = 20 - warpPoint(warpAt({ amount: 0.25 }), 20, 0).x;
	const full = 20 - warpPoint(warpAt({ amount: 1 }), 20, 0).x;
	assert.ok(partial > 0 && partial < full, "a partial ramp pulls less");
});

test("warpFrame bends dots and both endpoints of an edge", async () => {
	const { warpFrame } = await loadLocal("orb-gravity.ts");
	const frame = {
		dots: [dotAt(20, 0)],
		lines: [{ x1: 20, y1: 0, x2: 30, y2: 0, white: 0.5, w: 1 }],
	};
	const out = warpFrame(frame, warpAt());

	assert.ok(out.dots[0].x < 20, "dot bends toward the pointer");
	assert.ok(out.dots[0].r > 2, "swell reaches the dot radius");
	assert.ok(out.lines[0].x1 < 20, "near endpoint bends");
	assert.ok(out.lines[0].x2 < 30, "far endpoint bends");
	assert.ok(
		20 - out.lines[0].x1 > 30 - out.lines[0].x2,
		"the endpoint nearer the pointer bends further",
	);
	assert.equal(out.dots.length, frame.dots.length);
	assert.equal(out.lines.length, frame.lines.length);
	assert.equal(frame.dots[0].x, 20, "input frame is not mutated");
});

test("warpFrame leaves z untouched so upstream's sort still holds", async () => {
	const { warpFrame } = await loadLocal("orb-gravity.ts");
	const frame = {
		dots: [
			{ x: 22, y: 0, z: -5, r: 2, white: 0.8 },
			{ x: 20, y: 0, z: 5, r: 2, white: 0.2 },
		],
		lines: [],
	};
	const out = warpFrame(frame, warpAt());

	assert.deepEqual(
		out.dots.map((d) => d.z),
		[-5, 5],
		"depth and therefore draw order are preserved",
	);
	assert.deepEqual(
		out.dots.map((d) => d.white),
		[0.8, 0.2],
		"ink shading is preserved",
	);
});

// ---------------------------------------------------------------------
// Cursor gravity (VPK) — the deforming pointer replica
// ---------------------------------------------------------------------

test("cursor gravity ships the tuned defaults", async () => {
	const { CURSOR_GRAVITY_DEFAULTS } = await loadLocal("cursor-gravity.ts");

	assert.deepEqual(
		{ ...CURSOR_GRAVITY_DEFAULTS },
		{
			reach: 160,
			tail: 11,
			bend: 19,
			taper: 1.95,
			curve: 2.8,
			inertia: 0.3,
			handover: 0.6,
			squash: 1.2,
			blur: 1,
			fadeMs: 180,
		},
	);
	assert.ok(Object.isFrozen(CURSOR_GRAVITY_DEFAULTS));
});

test("cursor gravity is inert without a DOM and registers wells safely", async () => {
	const { registerGravityWell, getCursorGravityStatus } =
		await loadLocal("cursor-gravity.ts");

	assert.equal(getCursorGravityStatus().wells, 0);
	const fakeOrb = { getBoundingClientRect: () => ({}) };
	const off = registerGravityWell(fakeOrb, 200);
	assert.equal(getCursorGravityStatus().wells, 1);
	assert.equal(getCursorGravityStatus().active, false);

	const off2 = registerGravityWell(fakeOrb);
	assert.equal(getCursorGravityStatus().wells, 2);
	off();
	assert.equal(getCursorGravityStatus().wells, 1);
	off2();
	assert.equal(
		getCursorGravityStatus().wells,
		0,
		"the shared overlay must release once the last well unregisters",
	);
});

test("cursor gravity never strands the user without a pointer", () => {
	assert.match(CURSOR_SOURCE, /function showNativeCursor\(\)/u);
	// the real cursor is hidden via a root attribute + stylesheet, not an
	// inline style: `cursor` only inherits where a descendant declares none,
	// so an inline rule would leave a second cursor over buttons and inputs
	assert.match(CURSOR_SOURCE, /\[\$\{CURSOR_HIDE_ATTR\}\] \* \{ cursor: none !important; \}/u);
	assert.match(CURSOR_SOURCE, /removeAttribute\(CURSOR_HIDE_ATTR\)/u);
	assert.match(CURSOR_SOURCE, /catch \(err\) \{[\s\S]*?disabled = true;/u);
	assert.match(CURSOR_SOURCE, /catch \(err\) \{[\s\S]*?teardown\(\);/u);
	assert.match(
		CURSOR_SOURCE,
		/function teardown\(\)[\s\S]*?showNativeCursor\(\);/u,
	);
	assert.match(CURSOR_SOURCE, /"blur", showNativeCursor/u);
	assert.match(CURSOR_SOURCE, /visibilitychange/u);
	assert.match(CURSOR_SOURCE, /function onPointerOut/u);
});

test("cursor gravity refuses coarse pointers and reduced motion", () => {
	assert.match(CURSOR_SOURCE, /matchMedia\("\(pointer: fine\)"\)/u);
	assert.match(
		CURSOR_SOURCE,
		/matchMedia\("\(prefers-reduced-motion: reduce\)"\)/u,
	);
	assert.match(COMPONENT_SOURCE, /!on \|\| reduced\) return;/u);
});

test("cursor gravity draws its own pointer rather than a platform raster", () => {
	assert.doesNotMatch(CURSOR_SOURCE, /data:image\/png;base64/u);
	assert.match(CURSOR_SOURCE, /const ARROW_PATH =/u);
	assert.match(CURSOR_SOURCE, /new Path2D\(ARROW_PATH\)/u);
});

// ---------------------------------------------------------------------
// Demo + docs surface
// ---------------------------------------------------------------------

test("Thinking Orbs demo exposes the complete supported control and variant surface", () => {
	const states = [
		"working",
		"searching",
		"solving",
		"listening",
		"connecting",
		"weaving",
		"composing",
		"breathing",
		"shaping",
	];
	for (const state of states) {
		assert.match(DEMO_SOURCE, new RegExp(`"${state}"`));
		assert.match(
			DETAIL_SOURCE,
			new RegExp(`demoSlug: "thinking-orbs-demo-${state}"`),
		);
		assert.match(REGISTRY_SOURCE, new RegExp(`"thinking-orbs-demo-${state}"`));
	}
	for (const id of [
		"thinking-orbs-state",
		"thinking-orbs-size",
		"thinking-orbs-theme",
		"thinking-orbs-speed",
		"thinking-orbs-paused",
		"thinking-orbs-label",
		"thinking-orbs-gravity",
		"thinking-orbs-gravity-reach",
		"thinking-orbs-gravity-pull",
		"thinking-orbs-cursor-gravity",
	]) {
		assert.match(DEMO_SOURCE, new RegExp(`id="${id}"`));
	}
	assert.match(DEMO_SOURCE, /ORB_STATES\.map/u);
	assert.match(DEMO_SOURCE, /ORB_SIZES\.map/u);
	assert.match(DETAIL_SOURCE, /MIT-licensed thinking-orbs package/u);
	assert.match(DETAIL_SOURCE, /name: "gravity"/u);
	assert.match(DETAIL_SOURCE, /name: "cursorGravity"/u);
	assert.match(TYPES_SOURCE, /gravity\?: boolean \| OrbGravity;/u);
	assert.match(
		TYPES_SOURCE,
		/cursorGravity\?: boolean \| Partial<CursorGravityTuning>;/u,
	);
});
