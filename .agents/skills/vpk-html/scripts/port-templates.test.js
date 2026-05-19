#!/usr/bin/env node

const assert = require("node:assert/strict");
const test = require("node:test");

async function loadPortTemplates() {
	return import("./port-templates.mjs");
}

test("addMainLandmark closes after body content when head contains a script", async () => {
	const { addMainLandmark } = await loadPortTemplates();
	const html = `<!doctype html>
<html>
<head>
<script src="/head.js"></script>
</head>
<body class="doc">
<section>Visible content</section>
<script src="/body.js"></script>
</body>
</html>`;

	const result = addMainLandmark(html);
	const headScript = result.indexOf(`<script src="/head.js"></script>`);
	const bodyOpen = result.indexOf(`<body class="doc">`);
	const mainOpen = result.indexOf("<main>");
	const visibleContent = result.indexOf("<section>Visible content</section>");
	const mainClose = result.indexOf("</main>");
	const bodyScript = result.indexOf(`<script src="/body.js"></script>`);

	assert.ok(headScript < bodyOpen, "fixture should keep the head script before body");
	assert.ok(bodyOpen < mainOpen, "main opens inside body");
	assert.ok(mainOpen < visibleContent, "main wraps visible body content");
	assert.ok(visibleContent < mainClose, "main closes after visible body content");
	assert.ok(mainClose < bodyScript, "body scripts stay outside the main landmark");
});

test("addMainLandmark closes before body end when no body script exists", async () => {
	const { addMainLandmark } = await loadPortTemplates();
	const result = addMainLandmark("<html><body><article>Report</article></body></html>");

	assert.match(result, /<body>\n<main><article>Report<\/article>\n<\/main><\/body>/);
});
