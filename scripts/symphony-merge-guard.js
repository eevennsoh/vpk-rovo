#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const DEFAULT_INTERVAL_MS = 10000;
const DEFAULT_DONE_STATES = ["Done"];
const DEFAULT_MERGING_STATE = "Merging";
const GITHUB_PR_PATTERN = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:[/?#].*)?$/;

function parseArgs(argv) {
	const options = {
		dryRun: false,
		intervalMs: DEFAULT_INTERVAL_MS,
		watch: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--dry-run") {
			options.dryRun = true;
			continue;
		}
		if (arg === "--watch") {
			options.watch = true;
			continue;
		}
		if (arg === "--interval-ms") {
			const value = Number(argv[index + 1]);
			if (!Number.isFinite(value) || value < 1000) {
				throw new Error("--interval-ms must be at least 1000");
			}
			options.intervalMs = value;
			index += 1;
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			options.help = true;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}

	return options;
}

function usage() {
	return `Usage: node scripts/symphony-merge-guard.js [--watch] [--interval-ms <ms>] [--dry-run]

Moves Symphony issues from Done back to Merging when an attached GitHub PR is
still open. Requires LINEAR_API_KEY and SYMPHONY_LINEAR_PROJECT_SLUG.`;
}

function loadEnvFile(repoRoot) {
	const envPath = path.join(repoRoot, ".env.local");
	if (!fs.existsSync(envPath)) {
		return;
	}

	const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
	for (const line of lines) {
		const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
		if (!match || process.env[match[1]]) {
			continue;
		}

		let value = match[2].trim();
		value = value.replace(/^"/, "").replace(/"$/, "");
		process.env[match[1]] = value;
	}
}

function extractGitHubPullRequest(url) {
	if (typeof url !== "string") {
		return null;
	}

	const match = url.trim().match(GITHUB_PR_PATTERN);
	if (!match) {
		return null;
	}

	return {
		owner: match[1],
		repo: match[2],
		number: Number(match[3]),
		url: `https://github.com/${match[1]}/${match[2]}/pull/${match[3]}`,
	};
}

function isOpenPullRequest(pullRequest) {
	return pullRequest?.state === "open" && pullRequest?.merged_at === null;
}

function shouldMoveIssueBackToMerging(issue, pullRequests) {
	if (!issue || issue.state?.name !== "Done") {
		return false;
	}

	return pullRequests.some((pullRequest) => isOpenPullRequest(pullRequest));
}

async function requestJson(url, options) {
	const response = await fetch(url, options);
	const json = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(`${url} returned ${response.status}: ${JSON.stringify(json)}`);
	}
	return json;
}

async function linearGraphql(query, variables) {
	const token = process.env.LINEAR_API_KEY;
	if (!token) {
		throw new Error("LINEAR_API_KEY is required");
	}

	const response = await requestJson("https://api.linear.app/graphql", {
		method: "POST",
		headers: {
			Authorization: token,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ query, variables }),
	});

	if (response.errors) {
		throw new Error(`Linear GraphQL failed: ${JSON.stringify(response.errors)}`);
	}

	return response.data;
}

async function fetchTerminalIssues() {
	const projectSlug = process.env.SYMPHONY_LINEAR_PROJECT_SLUG;
	if (!projectSlug) {
		throw new Error("SYMPHONY_LINEAR_PROJECT_SLUG is required");
	}

	const data = await linearGraphql(
		`query SymphonyMergeGuardIssues($projectSlug: String!, $stateNames: [String!]!) {
			issues(
				filter: { project: { slugId: { eq: $projectSlug } }, state: { name: { in: $stateNames } } }
				first: 100
			) {
				nodes {
					id
					identifier
					title
					url
					state { name type }
					team {
						states { nodes { id name type } }
					}
					attachments(first: 20) {
						nodes { title url }
					}
				}
			}
		}`,
		{
			projectSlug,
			stateNames: DEFAULT_DONE_STATES,
		},
	);

	return data.issues.nodes;
}

async function fetchGitHubPullRequest(pullRequest) {
	const headers = {
		Accept: "application/vnd.github+json",
		"User-Agent": "vpk-symphony-merge-guard",
	};
	if (process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}

	try {
		return await requestJson(
			`https://api.github.com/repos/${pullRequest.owner}/${pullRequest.repo}/pulls/${pullRequest.number}`,
			{ headers },
		);
	} catch (error) {
		return fetchGitHubPullRequestWithGh(pullRequest, error);
	}
}

function fetchGitHubPullRequestWithGh(pullRequest, originalError) {
	try {
		const output = execFileSync(
			"gh",
			["api", `/repos/${pullRequest.owner}/${pullRequest.repo}/pulls/${pullRequest.number}`],
			{ encoding: "utf8" },
		);
		return JSON.parse(output);
	} catch (error) {
		const fallbackError = error.stderr?.toString().trim() || error.message;
		throw new Error(`${originalError.message}; gh api fallback failed: ${fallbackError}`);
	}
}

async function moveIssueToMerging(issue) {
	const targetState = issue.team.states.nodes.find((state) => state.name === DEFAULT_MERGING_STATE);
	if (!targetState) {
		throw new Error(`${DEFAULT_MERGING_STATE} state is missing for ${issue.identifier}`);
	}

	await linearGraphql(
		`mutation SymphonyMergeGuardMoveIssue($id: String!, $stateId: String!) {
			issueUpdate(id: $id, input: { stateId: $stateId }) {
				success
				issue { identifier state { name } }
			}
		}`,
		{
			id: issue.id,
			stateId: targetState.id,
		},
	);
}

async function inspectIssue(issue, { fetchPullRequest = fetchGitHubPullRequest } = {}) {
	const attachments = issue.attachments.nodes
		.map((attachment) => extractGitHubPullRequest(attachment.url))
		.filter(Boolean);

	const pullRequests = await Promise.all(
		attachments.map((pullRequest) => fetchPullRequest(pullRequest)),
	);

	return {
		issue,
		pullRequests,
		shouldMove: shouldMoveIssueBackToMerging(issue, pullRequests),
	};
}

async function runOnce({ dryRun = false, logger = console } = {}) {
	const issues = await fetchTerminalIssues();
	const moved = [];
	const checked = [];

	for (const issue of issues) {
		const result = await inspectIssue(issue);
		checked.push(result);
		if (!result.shouldMove) {
			continue;
		}

		const openPull = result.pullRequests.find((pullRequest) => isOpenPullRequest(pullRequest));
		const message = `${issue.identifier} is Done but PR ${openPull.html_url} is still open`;
		if (dryRun) {
			logger.log(`[dry-run] ${message}; would move to ${DEFAULT_MERGING_STATE}`);
		} else {
			await moveIssueToMerging(issue);
			logger.log(`${message}; moved to ${DEFAULT_MERGING_STATE}`);
		}

		moved.push(issue.identifier);
	}

	if (moved.length === 0) {
		logger.log(`merge guard checked ${checked.length} terminal issue(s); no open PRs needed recovery`);
	}

	return { checked, moved };
}

async function runWatch(options) {
	for (;;) {
		try {
			await runOnce(options);
		} catch (error) {
			console.error(`merge guard failed: ${error.message}`);
		}
		await new Promise((resolve) => setTimeout(resolve, options.intervalMs));
	}
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		console.log(usage());
		return;
	}

	loadEnvFile(process.cwd());

	if (options.watch) {
		await runWatch(options);
		return;
	}

	await runOnce(options);
}

if (require.main === module) {
	main().catch((error) => {
		console.error(error.message);
		process.exit(1);
	});
}

module.exports = {
	extractGitHubPullRequest,
	inspectIssue,
	isOpenPullRequest,
	parseArgs,
	shouldMoveIssueBackToMerging,
};
