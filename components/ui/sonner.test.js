const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SONNER_SOURCE = fs.readFileSync(path.join(__dirname, "sonner.tsx"), "utf8");

test("SonnerToast centers title-only toast content", () => {
	assert.match(
		SONNER_SOURCE,
		/const hasStackedContent = Boolean\(description \|\| action \|\| secondaryAction\);/u,
	);
	assert.match(
		SONNER_SOURCE,
		/"flex gap-3",\s*hasStackedContent \? "items-start" : "items-center"/u,
	);
	assert.match(
		SONNER_SOURCE,
		/"shrink-0",\s*hasStackedContent \? "mt-0\.5" : null/u,
	);
});
