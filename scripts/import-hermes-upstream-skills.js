#!/usr/bin/env node

const path = require("node:path");
const { execFileSync } = require("node:child_process");

const {
	DEFAULT_UPSTREAM_REF,
	DEFAULT_UPSTREAM_REPO,
	buildGitHubRawBlobUrl,
	buildGitHubTreeApiUrl,
	importHermesUpstreamSkills,
} = require("../backend/lib/hermes-upstream-skills-import");
const { ensureRovoSkillsSymlink } = require("../backend/lib/rovo-skills-overlay");

const AGENT_BROWSER_MAX_BUFFER_BYTES = 16 * 1024 * 1024;

function parseArgs(argv) {
	const options = {
		browserFetch: false,
		ref: DEFAULT_UPSTREAM_REF,
		repo: DEFAULT_UPSTREAM_REPO,
		vendorRootDir: path.join(
			path.resolve(__dirname, ".."),
			".agents",
			"vendor",
			"hermes-agent",
		),
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		switch (arg) {
			case "--browser-fetch":
				options.browserFetch = true;
				break;
			case "--repo":
				options.repo = argv[index + 1] || options.repo;
				index += 1;
				break;
			case "--ref":
				options.ref = argv[index + 1] || options.ref;
				index += 1;
				break;
			case "--vendor-root":
				options.vendorRootDir = path.resolve(argv[index + 1] || options.vendorRootDir);
				index += 1;
				break;
			case "--help":
			case "-h":
				printHelp();
				process.exit(0);
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return options;
}

function printHelp() {
	console.log(
		[
			"Usage: node scripts/import-hermes-upstream-skills.js [options]",
			"",
			"Options:",
			"  --repo <owner/name>     Upstream GitHub repo (default: NousResearch/hermes-agent)",
			"  --ref <ref>             Upstream ref or branch (default: main)",
			"  --vendor-root <path>    Target vendor root (default: .agents/vendor/hermes-agent)",
			"  --browser-fetch         Use agent-browser for all network fetches",
		].join("\n"),
	);
}

async function fetchJson(url) {
	const response = await fetch(url, {
		headers: {
			"Accept": "application/vnd.github+json",
			"User-Agent": "VPK-Rovo Hermes skills importer",
		},
	});

	if (!response.ok) {
		throw new Error(`GET ${url} failed with status ${response.status}.`);
	}

	return response.json();
}

async function fetchText(url) {
	const response = await fetch(url, {
		headers: {
			"User-Agent": "VPK-Rovo Hermes skills importer",
		},
	});

	if (!response.ok) {
		throw new Error(`GET ${url} failed with status ${response.status}.`);
	}

	return response.text();
}

async function fetchBuffer(url) {
	const response = await fetch(url, {
		headers: {
			"User-Agent": "VPK-Rovo Hermes skills importer",
		},
	});

	if (!response.ok) {
		throw new Error(`GET ${url} failed with status ${response.status}.`);
	}

	return Buffer.from(await response.arrayBuffer());
}

function browserOpen(url) {
	execFileSync("agent-browser", ["open", url], {
		maxBuffer: AGENT_BROWSER_MAX_BUFFER_BYTES,
		stdio: ["ignore", "ignore", "pipe"],
	});
}

function browserReadText(url) {
	browserOpen(url);
	return execFileSync("agent-browser", ["get", "text", "body"], {
		encoding: "utf8",
		maxBuffer: AGENT_BROWSER_MAX_BUFFER_BYTES,
		stdio: ["ignore", "pipe", "pipe"],
	});
}

async function browserFetchJson(url) {
	return JSON.parse(browserReadText(url));
}

async function browserFetchText(url) {
	return browserReadText(url);
}

async function browserFetchBufferFromBlobApi(blobApiUrl) {
	const payload = await browserFetchJson(blobApiUrl);
	if (typeof payload?.content !== "string") {
		throw new Error(`Blob payload from ${blobApiUrl} was missing content.`);
	}

	return Buffer.from(payload.content.replace(/\n/gu, ""), "base64");
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const treeUrl = buildGitHubTreeApiUrl({
		repo: options.repo,
		ref: options.ref,
	});
	const treeFetcher = options.browserFetch ? browserFetchJson : fetchJson;
	const textFetcher = options.browserFetch ? browserFetchText : fetchText;
	const binaryFetcher = options.browserFetch
		? async (_upstreamPath, entry) => browserFetchBufferFromBlobApi(entry.url)
		: async (upstreamPath) =>
			fetchBuffer(
				buildGitHubRawBlobUrl({
					repo: options.repo,
					ref: options.ref,
					filePath: upstreamPath,
				}),
			);

	console.log(
		`Importing Hermes skills from ${options.repo}@${options.ref} into ${options.vendorRootDir}`,
	);
	console.log(
		options.browserFetch
			? "Using agent-browser fetch transport."
			: "Using direct HTTPS fetch transport.",
	);

	const metadata = await importHermesUpstreamSkills({
		fetchTree: async () => treeFetcher(treeUrl),
		readBinaryFile: binaryFetcher,
		readTextFile: async (upstreamPath) =>
			textFetcher(
				buildGitHubRawBlobUrl({
					repo: options.repo,
					ref: options.ref,
					filePath: upstreamPath,
				}),
			),
		ref: options.ref,
		repo: options.repo,
		vendorRootDir: options.vendorRootDir,
	});

	console.log(
		[
			"",
			`Imported ${metadata.skillCount} skills and ${metadata.blobCount} files.`,
			`Source tree SHA: ${metadata.sourceTreeSha ?? "unknown"}`,
			`Snapshot metadata: ${path.join(options.vendorRootDir, "snapshot.json")}`,
		].join("\n"),
	);

	const symlinkResult = await ensureRovoSkillsSymlink({
		repoRoot: path.resolve(__dirname, ".."),
	});
	console.log(
		[
			"",
			"Ensured Rovo skills symlink:",
			`Target: ${symlinkResult.targetSkillsDir}`,
			`Link: ${symlinkResult.linkTarget}`,
			`Shared skills: ${symlinkResult.sharedSkillsDir}`,
		].join("\n"),
	);
}

main().catch((error) => {
	console.error(`Import failed: ${error.message}`);
	process.exitCode = 1;
});
