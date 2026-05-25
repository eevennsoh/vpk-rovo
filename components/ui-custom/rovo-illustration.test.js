const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..", "..");

function readRepoFile(...segments) {
	return fs.readFileSync(path.join(ROOT, ...segments), "utf8");
}

const INDEX_SOURCE = readRepoFile("components/ui-custom/rovo-illustration/index.tsx");
const SPOT_SOURCE = readRepoFile("components/ui-custom/rovo-illustration/spot-illustration.tsx");
const DEMO_SOURCE = readRepoFile("components/website/demos/ui-custom/rovo-illustration-demo.tsx");
const COMPONENTS_SOURCE = readRepoFile("app/data/components.ts");
const MANIFEST_SOURCE = readRepoFile("app/data/component-manifest.ts");
const DETAILS_SOURCE = readRepoFile("app/data/details/ui-custom.ts");
const REGISTRY_SOURCE = readRepoFile("components/website/registry.ts");

test("Rovo Illustration restores the embedded spot illustration API", () => {
	assert.match(INDEX_SOURCE, /export const RovoIllustration = SpotIllustration;/u);
	assert.match(INDEX_SOURCE, /export const ControlledRovoIllustration = ControlledSpotIllustration;/u);
	assert.match(SPOT_SOURCE, /getEmbeddedSpotIllustrationSvg/u);
	assert.match(SPOT_SOURCE, /id: "ai-first-jira"/u);
	assert.match(SPOT_SOURCE, /id: "deep-research"/u);
});

test("Rovo Illustration is wired into the ui-custom catalog route", () => {
	assert.match(DEMO_SOURCE, /from "@\/components\/ui-custom\/rovo-illustration"/u);
	assert.ok(COMPONENTS_SOURCE.includes('customComponent("rovo-illustration", "Rovo Illustration")'));
	assert.ok(MANIFEST_SOURCE.includes('customComponent("rovo-illustration", "Rovo Illustration")'));
	assert.match(DETAILS_SOURCE, /"rovo-illustration": \{/u);
	assert.match(REGISTRY_SOURCE, /"rovo-illustration": dynamic\(\s*\(\) => import\("\.\/demos\/ui-custom\/rovo-illustration-demo"\)/u);
});
