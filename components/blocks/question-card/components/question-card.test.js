const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const QUESTION_CARD_FILE = path.join(__dirname, "question-card.tsx");
const QUESTION_CARD_SOURCE = fs.readFileSync(QUESTION_CARD_FILE, "utf8");

function extractSlice(startMarker, endMarker) {
	const startIndex = QUESTION_CARD_SOURCE.indexOf(startMarker);
	assert.notEqual(startIndex, -1, `Expected to find start marker: ${startMarker}`);

	const endIndex = QUESTION_CARD_SOURCE.indexOf(endMarker, startIndex);
	assert.notEqual(endIndex, -1, `Expected to find end marker: ${endMarker}`);

	return QUESTION_CARD_SOURCE.slice(startIndex, endIndex);
}

test("QuestionCard renders navigation controls above the question heading", () => {
	const header = extractSlice(
		"<header data-slot=\"question-card-header\"",
		"</header>",
	);
	const previousButtonIndex = header.indexOf("aria-label=\"Previous question\"");
	const headingIndex = header.indexOf("<h5");

	assert.notEqual(previousButtonIndex, -1, "Expected previous question control in header");
	assert.notEqual(headingIndex, -1, "Expected question heading in header");
	assert.ok(previousButtonIndex < headingIndex, "Expected question navigation to render before the heading");
	assert.doesNotMatch(header, /\btruncate\b/u);
});

test("QuestionCard option text wraps instead of truncating", () => {
	const optionContent = extractSlice(
		"data-slot=\"question-card-option-content\"",
		"{description ?",
	);

	assert.match(optionContent, /whitespace-normal break-words/u);
	assert.doesNotMatch(optionContent, /\btruncate\b/u);
});

test("QuestionCard caps card height and scrolls overflowing question content internally", () => {
	const root = extractSlice(
		"data-slot=\"question-card\"",
		"<header data-slot=\"question-card-header\"",
	);
	const body = extractSlice(
		"data-slot=\"question-card-body\"",
		"<QuestionInput",
	);

	assert.match(root, /\bflex\b/u);
	assert.match(root, /\bflex-col\b/u);
	assert.match(root, /\bmax-h-\[min\(70vh,32rem\)\]/u);
	assert.match(root, /\boverflow-hidden\b/u);

	assert.match(body, /\bmin-h-0\b/u);
	assert.match(body, /\bflex-1\b/u);
	assert.match(body, /\boverflow-y-auto\b/u);
	assert.match(body, /\boverscroll-contain\b/u);
});
