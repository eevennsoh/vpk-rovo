const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildImageProxyRequestHeaders,
	deriveAtlassianImageCandidatesFromUrl,
	extractAtlassianImageCandidatesFromHtml,
	isAllowedAtlassianImageUrl,
	parseImageProxyTarget,
} = require("./image-proxy");

test("parseImageProxyTarget accepts Atlassian headshot attachment URLs", () => {
	const sourceUrl =
		"https://hello.atlassian.net/wiki/pages/viewpageattachments.action?pageId=6450653554&preview=%2F6450653554%2F6538248503%2FDavid+Hoang+headshot.png";

	const result = parseImageProxyTarget(sourceUrl);

	assert.equal(result.error, undefined);
	assert.equal(result.targetUrl.toString(), sourceUrl);
	assert.equal(result.source, "atlassian");
	assert.equal(isAllowedAtlassianImageUrl(result.targetUrl), true);
});

test("parseImageProxyTarget rejects ordinary Atlassian page URLs", () => {
	const result = parseImageProxyTarget(
		"https://hello.atlassian.net/wiki/spaces/DHub/pages/3836837889/David+Hoang+-+Head+of+Design+AI+-+Onboarding",
	);

	assert.deepEqual(result, {
		error: "Image URL is not allowed",
	});
});

test("buildImageProxyRequestHeaders adds Atlassian auth when configured", () => {
	const targetUrl = new URL(
		"https://hello.atlassian.net/wiki/download/attachments/1/David+Hoang+headshot.png",
	);

	const headers = buildImageProxyRequestHeaders(targetUrl, {
		ATLASSIAN_API_TOKEN: "test-token",
	});

	assert.equal(headers.Accept, "image/*");
	assert.equal(headers.Authorization, "Bearer test-token");
});

test("deriveAtlassianImageCandidatesFromUrl rewrites preview attachment URLs to download candidates", () => {
	const candidates = deriveAtlassianImageCandidatesFromUrl(
		new URL(
			"https://hello.atlassian.net/wiki/pages/viewpageattachments.action?pageId=6450653554&preview=%2F6450653554%2F6538248503%2FDavid+Hoang+headshot.png",
		),
	);

	assert.deepEqual(
		candidates.map((candidate) => candidate.toString()),
		[
			"https://hello.atlassian.net/wiki/download/attachments/6450653554/David%20Hoang%20headshot.png?api=v2",
			"https://hello.atlassian.net/wiki/download/attachments/6450653554/David%20Hoang%20headshot.png",
		],
	);
});

test("extractAtlassianImageCandidatesFromHtml returns relative download attachment URLs", () => {
	const candidates = extractAtlassianImageCandidatesFromHtml(
		`<html><head><meta property="og:image" content="/wiki/download/attachments/6450653554/David+Hoang+headshot.png?api=v2"></head></html>`,
		new URL(
			"https://hello.atlassian.net/wiki/pages/viewpageattachments.action?pageId=6450653554&preview=%2F6450653554%2F6538248503%2FDavid+Hoang+headshot.png",
		),
	);

	assert.deepEqual(
		candidates.map((candidate) => candidate.toString()),
		[
			"https://hello.atlassian.net/wiki/download/attachments/6450653554/David+Hoang+headshot.png?api=v2",
		],
	);
});
