import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { resolveIssueAssigneeUnassignedKind } from "./lib.ts";

test("missing assignee photos resolve to the unassigned person placeholder", () => {
	assert.equal(resolveIssueAssigneeUnassignedKind(undefined), "person");
	assert.equal(resolveIssueAssigneeUnassignedKind(""), "person");
	assert.equal(resolveIssueAssigneeUnassignedKind("/maya.png"), undefined);
	assert.equal(resolveIssueAssigneeUnassignedKind(undefined, "agent"), "agent");
	assert.equal(resolveIssueAssigneeUnassignedKind("/maya.png", "person"), "person");
});
