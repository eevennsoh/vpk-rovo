const test = require("node:test");
const assert = require("node:assert/strict");

const { looksLikeInabilityResponse } = require("./inability-response-detector");

// ---------- Strong signal detection ----------

test("detects Google Drive inability response (strong signal: 'I don't have access')", () => {
	const text =
		"I apologize, but I don't have the ability to list files from Google Drive. " +
		"The tools available to me don't include Google Drive integration. " +
		"I can help you with other tasks like searching Confluence or creating Jira issues.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

test("detects 'unfortunately' pattern (strong signal)", () => {
	const text =
		"Unfortunately, I don't have access to your email inbox. " +
		"My capabilities are focused on Atlassian products like Jira and Confluence. " +
		"If you need email integration, you might want to check the marketplace.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

test("detects 'I'm unable to' pattern (strong signal)", () => {
	const text =
		"I'm unable to connect to Slack on your behalf. " +
		"I don't have Slack integration in my current toolkit. " +
		"You could try using the Slack connector in Atlassian Marketplace.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

test("detects 'I cannot access' pattern (strong signal)", () => {
	const text =
		"I cannot access your GitHub repositories directly from here. " +
		"My tools are limited to Atlassian products. " +
		"You may want to use the GitHub for Jira integration instead.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

test("detects 'beyond my current capabilities' (strong signal)", () => {
	const text =
		"Generating images is beyond my current capabilities. " +
		"I can help you find illustrations in the Atlassian design system instead.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

test("detects 'there is no tool' pattern (strong signal)", () => {
	const text =
		"There's no tool available for sending SMS messages. " +
		"I'm designed to work with Atlassian products. " +
		"Consider using a third-party integration.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

test("detects readonly write-block response from Serve", () => {
	const text =
		"It looks like all write operations — both `create_file` and `bash` — are currently blocked. " +
		"This typically happens when the agent host has write access disabled. " +
		"I can't proceed with implementation until writes are unblocked.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

test("detects explicit readonly mode operation block", () => {
	const text =
		"The create step failed because this operation is currently blocked in readonly mode. " +
		"Please switch back to full execution before trying to write files again.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

// ---------- Weak signal accumulation ----------

test("detects response with 2+ weak signals", () => {
	const text =
		"That feature is not available in my current configuration. " +
		"I'm limited to working with Confluence and Jira. " +
		"Instead, I can help you create a page or search for existing content.";
	assert.equal(looksLikeInabilityResponse(text), true);
});

test("does not trigger on a single weak signal alone", () => {
	const text =
		"That feature is not available yet, but we're working on it. " +
		"Check back in the next release for updates on this functionality.";
	assert.equal(looksLikeInabilityResponse(text), false);
});

// ---------- Non-matches ----------

test("does not match normal data response", () => {
	const text =
		"Here are the top issues in your Jira project:\n\n" +
		"1. PROJ-101 — Fix login bug (High priority)\n" +
		"2. PROJ-102 — Update dashboard layout (Medium priority)\n" +
		"3. PROJ-103 — Add search filters (Low priority)";
	assert.equal(looksLikeInabilityResponse(text), false);
});

test("does not match clarification question", () => {
	const text =
		"I'd like to help you with that. Could you tell me a few things first?\n\n" +
		"1. What project are you working on?\n" +
		"2. What type of issue should I create?\n" +
		"3. Who should be assigned?";
	assert.equal(looksLikeInabilityResponse(text), false);
});

test("does not match short text (under 40 chars)", () => {
	assert.equal(looksLikeInabilityResponse("I can't do that."), false);
});

test("returns false for null input", () => {
	assert.equal(looksLikeInabilityResponse(null), false);
});

test("returns false for undefined input", () => {
	assert.equal(looksLikeInabilityResponse(undefined), false);
});

test("returns false for empty string", () => {
	assert.equal(looksLikeInabilityResponse(""), false);
});

test("returns false for whitespace-only string", () => {
	assert.equal(looksLikeInabilityResponse("   \n\t  "), false);
});

// ---------- Data-presence override ----------

test("returns false when inability text contains URLs", () => {
	const text =
		"I'm unable to list all your files, but I found a relevant link: " +
		"https://drive.google.com/drive/folders/abc123xyz " +
		"You can browse your files directly there.";
	assert.equal(looksLikeInabilityResponse(text), false);
});

test("returns false when inability text contains numbered results", () => {
	const text =
		"Unfortunately, I can only show partial results. Here's what I found:\n\n" +
		"1. Project Alpha — design document\n" +
		"2. Project Beta — requirements spec\n" +
		"3. Project Gamma — architecture overview";
	assert.equal(looksLikeInabilityResponse(text), false);
});

test("returns false when inability text contains file sizes", () => {
	const text =
		"I cannot access all files, but here are the cached results: " +
		"report.pdf (2.5 MB), summary.docx (150 KB), data.csv (45.2 MB)";
	assert.equal(looksLikeInabilityResponse(text), false);
});
