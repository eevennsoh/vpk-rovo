const test = require("node:test");
const assert = require("node:assert/strict");

const {
	isAtlassianImageUrl,
	resolveImageRenderSrc,
} = require("./image-proxy.ts");

test("resolveImageRenderSrc proxies Atlassian attachment image URLs", () => {
	const sourceUrl =
		"https://hello.atlassian.net/wiki/pages/viewpageattachments.action?pageId=6450653554&preview=%2F6450653554%2F6538248503%2FDavid+Hoang+headshot.png";

	assert.equal(isAtlassianImageUrl(sourceUrl), true);
	assert.equal(
		resolveImageRenderSrc(sourceUrl),
		`/api/image-proxy?src=${encodeURIComponent(sourceUrl)}`,
	);
});

test("resolveImageRenderSrc leaves ordinary external URLs untouched", () => {
	const sourceUrl = "https://images.example.com/avatar.png";

	assert.equal(resolveImageRenderSrc(sourceUrl), sourceUrl);
});
