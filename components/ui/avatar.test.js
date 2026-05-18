const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AVATAR_SOURCE = fs.readFileSync(path.join(__dirname, "avatar.tsx"), "utf8");
const AVATAR_DEMO_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "website", "demos", "ui", "avatar-demo.tsx"),
	"utf8",
);
const AVATAR_DETAILS_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "app", "data", "details", "ui.ts"),
	"utf8",
);
const REGISTRY_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "website", "registry.ts"),
	"utf8",
);
const PRIMARY_AVATAR_PATH = path.join(
	__dirname,
	"..",
	"..",
	"public",
	"avatar-user",
	"venn",
	"venn.png",
);

function readPngDimensions(filePath) {
	const buffer = fs.readFileSync(filePath);
	assert.equal(buffer.toString("ascii", 1, 4), "PNG");
	assert.equal(buffer.toString("ascii", 12, 16), "IHDR");

	return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20),
		bytes: buffer.byteLength,
	};
}

test("AvatarUnassigned exposes grey person and agent avatar states", () => {
	assert.match(AVATAR_SOURCE, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent"/);
	assert.match(AVATAR_SOURCE, /import PersonIcon from "@atlaskit\/icon\/core\/person"/);
	assert.doesNotMatch(AVATAR_SOURCE, /@atlaskit\/icon\/core\/person-avatar/);
	assert.match(AVATAR_SOURCE, /type AvatarUnassignedKind = "person" \| "agent"/);
	assert.match(AVATAR_SOURCE, /function AvatarUnassigned\(/);
	assert.match(
		AVATAR_SOURCE,
		/"items-center justify-center bg-muted text-icon-subtle after:border-border"/,
	);
	assert.match(AVATAR_SOURCE, /shape=\{isAgent \? "hexagon" : "circle"\}/);
	assert.match(
		AVATAR_SOURCE,
		/render=\{\s*<IconComponent[\s\S]*color="currentColor"[\s\S]*label=""[\s\S]*size=\{avatarUnassignedIconSizeMap\[resolvedSize\]\}/,
	);
	assert.match(AVATAR_SOURCE, /AvatarUnassigned,/);
	assert.match(AVATAR_SOURCE, /type AvatarUnassignedProps,/);
});

test("hexagon avatars use a polygon stroke instead of a clipped rectangular border", () => {
	assert.match(AVATAR_SOURCE, /const HEXAGON_POINTS =/);
	assert.match(AVATAR_SOURCE, /hexagon: `\$\{HEXAGON_CLIP\} after:border-0`/);
	assert.match(AVATAR_SOURCE, /function AvatarHexagonBorder\(\)/);
	assert.match(AVATAR_SOURCE, /text-border!/);
	assert.match(AVATAR_SOURCE, /<polygon[\s\S]*points=\{HEXAGON_POINTS\}[\s\S]*stroke="currentColor"/);
	assert.match(AVATAR_SOURCE, /shape === "hexagon" \? <AvatarHexagonBorder \/> : null/);
});

test("avatar docs include only the base unassigned demo states", () => {
	assert.match(AVATAR_DEMO_SOURCE, /export function AvatarDemoUnassigned\(\)/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarUnassigned \/>/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarUnassigned kind="agent" \/>/);
	assert.doesNotMatch(AVATAR_DEMO_SOURCE, /<AvatarUnassigned kind="agent">\s*<AvatarPresenceIndicator/);
	assert.match(AVATAR_DETAILS_SOURCE, /demoSlug: "avatar-demo-unassigned"/);
	assert.match(REGISTRY_SOURCE, /"avatar-demo-unassigned"/);
	assert.match(REGISTRY_SOURCE, /default: mod\.AvatarDemoUnassigned/);
});

test("primary avatar asset stays sized for rendered avatar slots", () => {
	const dimensions = readPngDimensions(PRIMARY_AVATAR_PATH);

	assert.equal(dimensions.width, 192);
	assert.equal(dimensions.height, 192);
	assert.ok(dimensions.bytes < 80_000);
	assert.match(AVATAR_SOURCE, /"2xl": "size-24"/);
});
