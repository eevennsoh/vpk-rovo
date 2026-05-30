const test = require("node:test");
const assert = require("node:assert/strict");

const {
	AGENT_QUERY_PARAM,
	getAgentIdFromSearch,
	withAgentParam,
} = require("./agent-route-sync.ts");

test("AGENT_QUERY_PARAM is 'agent'", () => {
	assert.equal(AGENT_QUERY_PARAM, "agent");
});

test("getAgentIdFromSearch reads the agent param from a query string", () => {
	assert.equal(getAgentIdFromSearch("?agent=acme-bot"), "acme-bot");
	assert.equal(getAgentIdFromSearch("?agent=acme-bot&foo=1"), "acme-bot");
	assert.equal(getAgentIdFromSearch("?foo=1&agent=acme-bot"), "acme-bot");
});

test("getAgentIdFromSearch returns null when absent or empty", () => {
	assert.equal(getAgentIdFromSearch(""), null);
	assert.equal(getAgentIdFromSearch("?foo=1"), null);
	assert.equal(getAgentIdFromSearch("?agent="), null);
	assert.equal(getAgentIdFromSearch("?agent=%20%20"), null);
});

test("getAgentIdFromSearch accepts a URLSearchParams instance and decodes values", () => {
	assert.equal(getAgentIdFromSearch(new URLSearchParams("agent=acme-bot")), "acme-bot");
	assert.equal(getAgentIdFromSearch("?agent=a%20b"), "a b");
});

test("withAgentParam sets the param on a bare path", () => {
	assert.equal(withAgentParam("/studio", "acme-bot"), "/studio?agent=acme-bot");
});

test("withAgentParam composes with an existing thread path", () => {
	assert.equal(
		withAgentParam("/studio/thr_123", "acme-bot"),
		"/studio/thr_123?agent=acme-bot",
	);
});

test("withAgentParam replaces an existing agent param", () => {
	assert.equal(withAgentParam("/studio?agent=old", "new"), "/studio?agent=new");
});

test("withAgentParam(null) removes the agent param", () => {
	assert.equal(withAgentParam("/studio?agent=acme-bot", null), "/studio");
});

test("withAgentParam preserves other query params and hash", () => {
	assert.equal(withAgentParam("/studio?foo=1", "acme-bot"), "/studio?foo=1&agent=acme-bot");
	assert.equal(withAgentParam("/studio?foo=1&agent=x", null), "/studio?foo=1");
	assert.equal(withAgentParam("/studio#section", "acme-bot"), "/studio?agent=acme-bot#section");
});

test("withAgentParam round-trips through getAgentIdFromSearch", () => {
	const url = withAgentParam("/studio/thr_123", "a b");
	const { search } = new URL(url, "http://x");
	assert.equal(getAgentIdFromSearch(search), "a b");
});
