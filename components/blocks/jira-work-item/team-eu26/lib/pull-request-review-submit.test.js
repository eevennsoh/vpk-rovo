const assert = require("node:assert/strict");
const test = require("node:test");
const esbuild = require("esbuild");
const { join } = require("node:path");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

const MODULE_PATH = join(__dirname, "pull-request-review-submit.ts");

let modulePromise;
function loadModule() {
	if (!modulePromise) {
		modulePromise = esbuild
			.build({
				entryPoints: [MODULE_PATH],
				bundle: true,
				format: "cjs",
				platform: "node",
				loader: { ".css": "empty" },
				tsconfig: join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"pull-request-review-submit-harness.cjs",
			));
	}
	return modulePromise;
}

test("maps review verdicts to Approvers status and toast copy", async () => {
	const {
		GUIDED_REVIEW_CURRENT_REVIEWER,
		GUIDED_REVIEW_CURRENT_REVIEWER_ID,
		applyCurrentReviewerStatus,
		createSubmittedPullRequestReviewActivity,
		mapReviewVerdictToReviewerStatus,
		mapReviewVerdictToToastCopy,
	} = await loadModule();

	assert.equal(GUIDED_REVIEW_CURRENT_REVIEWER_ID, "priya-narayanan");
	assert.deepEqual(GUIDED_REVIEW_CURRENT_REVIEWER, {
		id: "priya-narayanan",
		name: "Priya Narayanan",
		kind: "person",
		avatarSrc: "/avatar-user/priya-hansra/color/asow-strategy-orange.png",
	});
	assert.equal(mapReviewVerdictToReviewerStatus("approve"), "approved");
	assert.equal(mapReviewVerdictToReviewerStatus("request-changes"), "changes-requested");
	assert.equal(mapReviewVerdictToReviewerStatus("comment"), "commented");

	assert.deepEqual(mapReviewVerdictToToastCopy("approve"), {
		appearance: "success",
		title: "Approved",
	});
	assert.deepEqual(mapReviewVerdictToToastCopy("request-changes"), {
		appearance: "success",
		title: "Changes requested",
	});
	assert.deepEqual(mapReviewVerdictToToastCopy("comment"), {
		appearance: "info",
		title: "Comment submitted",
	});

	const reviewers = [
		{ id: "priya-narayanan", name: "Priya Narayanan", kind: "person", status: "pending" },
		{ id: "jordan-lee", name: "Jordan Lee", kind: "person", status: "pending" },
	];
	assert.deepEqual(
		applyCurrentReviewerStatus(reviewers, "changes-requested").map(({ id, status }) => ({ id, status })),
		[
			{ id: "priya-narayanan", status: "changes-requested" },
			{ id: "jordan-lee", status: "pending" },
		],
	);
	assert.equal(applyCurrentReviewerStatus(reviewers, undefined), reviewers);

	assert.deepEqual(
		["comment", "approve", "request-changes"].map((verdict, index) => (
			createSubmittedPullRequestReviewActivity(
				{ body: `Review ${index + 1}`, verdict },
				{ id: `review-${index + 1}`, occurredAtMs: index + 1 },
			)
		)),
		[
			{
				id: "review-1",
				occurredAtMs: 1,
				kind: "review-submitted",
				actor: GUIDED_REVIEW_CURRENT_REVIEWER,
				timestamp: "Just now",
				decision: "commented",
				body: "Review 1",
				allowReply: false,
				allowResolve: false,
			},
			{
				id: "review-2",
				occurredAtMs: 2,
				kind: "review-submitted",
				actor: GUIDED_REVIEW_CURRENT_REVIEWER,
				timestamp: "Just now",
				decision: "approved",
				body: "Review 2",
				allowReply: false,
				allowResolve: false,
			},
			{
				id: "review-3",
				occurredAtMs: 3,
				kind: "review-submitted",
				actor: GUIDED_REVIEW_CURRENT_REVIEWER,
				timestamp: "Just now",
				decision: "changes-requested",
				body: "Review 3",
				allowReply: false,
				allowResolve: false,
			},
		],
	);
});
