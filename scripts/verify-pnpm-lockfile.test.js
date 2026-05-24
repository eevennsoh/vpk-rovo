const test = require("node:test");
const assert = require("node:assert/strict");

const { findBlockedLockfileRegistryUrls } = require("./verify-pnpm-lockfile");

test("accepts npm-remote tarball URLs", () => {
	const findings = findBlockedLockfileRegistryUrls(`
packages:
  '@atlaskit/icon@34.3.0':
    resolution: {tarball: https://packages.atlassian.com/api/npm/npm-remote/@atlaskit/icon/-/icon-34.3.0.tgz}
`);

	assert.deepEqual(findings, []);
});

test("rejects atlassian-npm tarball URLs", () => {
	const findings = findBlockedLockfileRegistryUrls(`
packages:
  '@atlaskit/icon@34.3.0':
    resolution: {tarball: https://packages.atlassian.com/api/npm/atlassian-npm/@atlaskit/icon/-/icon-34.3.0.tgz}
`);

	assert.equal(findings.length, 1);
	assert.equal(findings[0].line, 4);
	assert.match(findings[0].text, /atlassian-npm/u);
});
