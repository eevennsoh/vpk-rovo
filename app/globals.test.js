const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GLOBALS_CSS_FILE = path.join(__dirname, "globals.css");
const GLOBALS_CSS_SOURCE = fs.readFileSync(GLOBALS_CSS_FILE, "utf8");

function getRuleBlock(selector) {
	const pattern = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`);
	const match = GLOBALS_CSS_SOURCE.match(pattern);

	assert.ok(match, `expected ${selector} rule`);
	return match[1];
}

test("website content clears the fixed sidebar rail before desktop overrides", () => {
	const baseRuleStart = GLOBALS_CSS_SOURCE.indexOf(".website-main-content {");
	const desktopRuleStart = GLOBALS_CSS_SOURCE.indexOf("@media (min-width: 768px)");

	assert.ok(baseRuleStart >= 0, "expected base website-main-content rule");
	assert.ok(desktopRuleStart >= 0, "expected desktop sidebar media query");
	assert.ok(
		baseRuleStart < desktopRuleStart,
		"expected rail offset to apply before desktop sidebar overrides",
	);
	assert.match(
		getRuleBlock(".website-main-content"),
		/margin-left:\s*48px;\s*\/\* rail only \*\//,
	);
});

test("desktop sidebar keeps the expanded panel offset", () => {
	assert.match(
		GLOBALS_CSS_SOURCE,
		/body:has\(aside\[data-sidebar-open="true"\]\) \.website-main-content\s*\{\s*margin-left:\s*304px;\s*\/\* 48px rail \+ 256px panel \*\//,
	);
});
