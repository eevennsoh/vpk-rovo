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

test("AvatarUnassigned exposes grey person and agent avatar states", () => {
	assert.match(AVATAR_SOURCE, /import AiAgentIcon from "@atlaskit\/icon\/core\/ai-agent"/);
	assert.match(AVATAR_SOURCE, /import PersonAvatarIcon from "@atlaskit\/icon\/core\/person-avatar"/);
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

test("avatar docs include the unassigned demo state", () => {
	assert.match(AVATAR_DEMO_SOURCE, /export function AvatarDemoUnassigned\(\)/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarUnassigned \/>/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarUnassigned kind="agent" \/>/);
	assert.match(AVATAR_DEMO_SOURCE, /<AvatarPresenceIndicator presence="online" \/>/);
	assert.match(AVATAR_DETAILS_SOURCE, /demoSlug: "avatar-demo-unassigned"/);
	assert.match(REGISTRY_SOURCE, /"avatar-demo-unassigned"/);
	assert.match(REGISTRY_SOURCE, /default: mod\.AvatarDemoUnassigned/);
});
