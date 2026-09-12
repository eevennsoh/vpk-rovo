const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const HELPER_PATH = path.join(__dirname, "pull-request-smart-link.tsx");

let helperPromise;
function loadHelper() {
	if (!helperPromise) {
		helperPromise = esbuild
			.build({
				entryPoints: [HELPER_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				loader: { ".css": "empty" },
				jsx: "automatic",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) =>
				loadCjsModuleFromText(result.outputFiles[0].text, "pull-request-smart-link-harness.cjs"),
			);
	}
	return helperPromise;
}

test("toPullRequestSmartLink builds the pull-request SmartLink model", async () => {
	const { toPullRequestSmartLink } = await loadHelper();
	const item = toPullRequestSmartLink({
		id: "pr-1847",
		number: 1847,
		title: "Add guest checkout to the storefront",
		status: "Open",
		files: 6,
		additions: 86,
		deletions: 21,
		repository: "acme/storefront",
		branch: "feature/shop-4821-guest-checkout",
		targetBranch: "main",
		author: { name: "Venn", src: "/avatar-user/venn/venn.png" },
	});

	assert.equal(item.variant, "pull-request");
	// The number prefixes the title so every surface — card, flyout, inline chip —
	// identifies the PR, not just the ones that render the metadata row.
	assert.equal(item.title, "#1847: Add guest checkout to the storefront");
	assert.equal(item.href, "https://github.com/acme/storefront/pull/1847");
	assert.equal(item.provider.name, "GitHub");
	assert.deepEqual(item.provider.logo, { kind: "third-party", name: "github" });
	// The front slot is the pull-request glyph; GitHub stays the provider.
	assert.equal(item.icon.kind, "icon");
	assert.ok(item.icon.icon, "front slot carries a pull-request glyph");
	assert.equal(item.status.label, "Open");
	assert.equal(item.status.variant, "success");
	// The lozenge trails the title as a bare label, like every other card.
	assert.equal(item.status.placement, undefined);
	assert.equal(item.status.icon, undefined);
	assert.deepEqual(item.codeStats, { files: 6, additions: 86, deletions: 21 });
	assert.deepEqual(item.branchPath, {
		branch: "feature/shop-4821-guest-checkout",
		targetBranch: "main",
	});
	// The repo builds the href but never reaches the card.
	assert.equal(item.href, "https://github.com/acme/storefront/pull/1847");
	assert.equal(item.repository, undefined);
	assert.equal(item.metadata, undefined);
	assert.deepEqual(item.author, { name: "Venn", src: "/avatar-user/venn/venn.png" });
	assert.ok(item.actions?.some((action) => action.id === "copy-link"));
});

test("toPullRequestSmartLink prefers an explicit href and maps Merged status", async () => {
	const { toPullRequestSmartLink } = await loadHelper();
	const item = toPullRequestSmartLink({
		id: "pr-9",
		number: 9,
		title: "Ship",
		status: "Merged",
		additions: 1,
		deletions: 0,
		repository: "acme/app",
		href: "https://example.com/pr/9",
	});

	assert.equal(item.href, "https://example.com/pr/9");
	assert.equal(item.status.label, "Merged");
	assert.equal(item.status.variant, "discovery");
	assert.equal(item.status.placement, undefined);
	assert.equal(item.status.icon, undefined);
	assert.equal(item.icon.kind, "icon");
});

test("toPullRequestSmartLink maps Failed status to the merge-failure glyph", async () => {
	const { toPullRequestSmartLink } = await loadHelper();
	const open = toPullRequestSmartLink({
		id: "pr-open",
		number: 1,
		title: "Open",
		status: "Open",
		additions: 1,
		deletions: 0,
	});
	const merged = toPullRequestSmartLink({
		id: "pr-merged",
		number: 2,
		title: "Merged",
		status: "Merged",
		additions: 1,
		deletions: 0,
	});
	const failed = toPullRequestSmartLink({
		id: "pr-failed",
		number: 3,
		title: "Failed",
		status: "Failed",
		additions: 1,
		deletions: 0,
	});

	assert.equal(failed.status.label, "Failed");
	assert.equal(failed.status.variant, "danger");
	assert.equal(open.icon.kind, "icon");
	assert.equal(merged.icon.kind, "icon");
	assert.equal(failed.icon.kind, "icon");
	assert.notEqual(open.icon.icon.type, merged.icon.icon.type);
	assert.notEqual(open.icon.icon.type, failed.icon.icon.type);
	assert.notEqual(merged.icon.icon.type, failed.icon.icon.type);
});

test("toPullRequestSmartLink falls back to a hash href without repository", async () => {
	const { toPullRequestSmartLink } = await loadHelper();
	const item = toPullRequestSmartLink({
		id: "pr-3",
		number: 3,
		title: "Draft",
		status: "Open",
		additions: 0,
		deletions: 0,
	});

	assert.equal(item.href, "#pull-request-3");
	// The number already prefixes the title, so a repo-less PR has no context row.
	assert.equal(item.metadata, undefined);
	assert.equal(item.repository, undefined);
	assert.equal(item.branchPath, undefined);
	assert.equal(item.branchPath, undefined);
	assert.equal(item.title, "#3: Draft");
	assert.equal(item.codeStats.files, undefined);
});
