const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const QUESTION_CARD_FILE = path.join(__dirname, "question-card.tsx");
const QUESTION_CARD_SOURCE = fs.readFileSync(QUESTION_CARD_FILE, "utf8");
const QUESTION_CARD_HOOK_FILE = path.join(__dirname, "..", "hooks", "use-question-card.ts");
const QUESTION_CARD_HOOK_SOURCE = fs.readFileSync(QUESTION_CARD_HOOK_FILE, "utf8");

function extractSlice(startMarker, endMarker) {
	const startIndex = QUESTION_CARD_SOURCE.indexOf(startMarker);
	assert.notEqual(startIndex, -1, `Expected to find start marker: ${startMarker}`);

	const endIndex = QUESTION_CARD_SOURCE.indexOf(endMarker, startIndex);
	assert.notEqual(endIndex, -1, `Expected to find end marker: ${endMarker}`);

	return QUESTION_CARD_SOURCE.slice(startIndex, endIndex);
}

function extractHookSlice(startMarker, endMarker) {
	const startIndex = QUESTION_CARD_HOOK_SOURCE.indexOf(startMarker);
	assert.notEqual(startIndex, -1, `Expected to find hook start marker: ${startMarker}`);

	const endIndex = QUESTION_CARD_HOOK_SOURCE.indexOf(endMarker, startIndex);
	assert.notEqual(endIndex, -1, `Expected to find hook end marker: ${endMarker}`);

	return QUESTION_CARD_HOOK_SOURCE.slice(startIndex, endIndex);
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

test("QuestionCard keyboard shortcuts toggle multi-select options without submitting", () => {
	const keyboardSelect = extractHookSlice(
		"const handleKeyboardOptionSelect = useCallback(",
		"const handleCustomInputFocus = useCallback(",
	);
	const enterKeyHandler = extractHookSlice(
		"case \"Enter\":",
		"case \"ArrowLeft\":",
	);

	assert.match(keyboardSelect, /currentQuestion\.kind === "multi-select"/u);
	assert.match(keyboardSelect, /setAnswers\(\(previousAnswers\) =>/u);
	assert.match(keyboardSelect, /const selectedValues = getSelectedValues\(previousAnswers\[currentQuestion\.id\]\)/u);
	assert.match(keyboardSelect, /\[currentQuestion\.id\]: nextValues/u);
	assert.match(keyboardSelect, /handleSelectOption\(optionId\)/u);
	assert.doesNotMatch(keyboardSelect, /onSubmit\(nextAnswers\)/u);
	assert.doesNotMatch(keyboardSelect, /goToNextQuestion\(\)/u);

	assert.match(enterKeyHandler, /handleKeyboardOptionSelect\(option\.id\)/u);
	assert.match(
		QUESTION_CARD_HOOK_SOURCE,
		/default: \{[\s\S]*const digit = Number\(event\.key\)[\s\S]*handleKeyboardOptionSelect\(option\.id\)/u,
	);
});
