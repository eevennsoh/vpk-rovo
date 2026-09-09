import assert from "node:assert/strict";
import test from "node:test";

import {
	linkAgentSessionChinCopy,
	resolveLinkAgentSessionChinCount,
	// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
} from "./attach-chin-copy.ts";

test("a singleton transfer uses the singular chin copy", () => {
	assert.equal(linkAgentSessionChinCopy(1), "Attach 1 agent session");
});

test("a cohort transfer pluralizes the chin copy", () => {
	assert.equal(linkAgentSessionChinCopy(2), "Attach 2 agent sessions");
	assert.equal(linkAgentSessionChinCopy(3), "Attach 3 agent sessions");
});

test("non-positive or non-finite counts fall back to a singleton", () => {
	assert.equal(linkAgentSessionChinCopy(0), "Attach 1 agent session");
	assert.equal(linkAgentSessionChinCopy(-4), "Attach 1 agent session");
	assert.equal(linkAgentSessionChinCopy(Number.NaN), "Attach 1 agent session");
	assert.equal(linkAgentSessionChinCopy(1.8), "Attach 1 agent session");
});

test("an explicit drag count wins over the live transfer length", () => {
	assert.equal(resolveLinkAgentSessionChinCount(3, 1), 3);
	assert.equal(resolveLinkAgentSessionChinCount(undefined, 2), 2);
	assert.equal(resolveLinkAgentSessionChinCount(0, 4), 4);
	assert.equal(resolveLinkAgentSessionChinCount(undefined, undefined), 1);
});
