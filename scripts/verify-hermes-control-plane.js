#!/usr/bin/env node

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function parseArgs(argv) {
	return {
		exerciseJobs: argv.includes("--exercise-jobs"),
	};
}

function getBackendBaseUrl() {
	if (typeof process.env.BACKEND_URL === "string" && process.env.BACKEND_URL.trim()) {
		return process.env.BACKEND_URL.trim().replace(/\/+$/u, "");
	}

	const portFile = path.join(process.cwd(), ".dev-backend-port");
	try {
		const port = fs.readFileSync(portFile, "utf8").trim();
		if (port) {
			return `http://127.0.0.1:${port}`;
		}
	} catch {
		// Fall back to the default backend port.
	}

	return "http://127.0.0.1:8080";
}

async function readJson(url, init) {
	const response = await fetch(url, init);
	const text = await response.text();
	let payload = null;
	try {
		payload = text ? JSON.parse(text) : null;
	} catch {
		payload = text;
	}

	if (!response.ok) {
		const message =
			payload && typeof payload === "object" && typeof payload.error === "string"
				? payload.error
				: typeof payload === "string" && payload.trim()
					? payload.trim()
					: `Request failed with status ${response.status}`;
		throw new Error(`${init?.method ?? "GET"} ${url}: ${message}`);
	}

	return payload;
}

function expect(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function printSection(title) {
	console.log(`\n[${title}]`);
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	const backendBaseUrl = getBackendBaseUrl();
	const hermesHome = path.join(os.homedir(), ".hermes");

	console.log(`Backend: ${backendBaseUrl}`);
	console.log(`Hermes home: ${hermesHome}`);

	printSection("Status");
	const statusPayload = await readJson(`${backendBaseUrl}/api/status`);
	expect(statusPayload && typeof statusPayload === "object", "Status payload was missing.");
	console.log(JSON.stringify(statusPayload, null, 2));

	const hermesSurface = statusPayload?.surfaces?.hermes;
	expect(hermesSurface && typeof hermesSurface === "object", "Hermes status surface was missing.");
	const hermesDetails = hermesSurface.details && typeof hermesSurface.details === "object"
		? hermesSurface.details
		: null;
	const hermesFileStores = hermesDetails?.fileStores && typeof hermesDetails.fileStores === "object"
		? hermesDetails.fileStores
		: null;
	const hermesRuntime = hermesDetails?.runtime && typeof hermesDetails.runtime === "object"
		? hermesDetails.runtime
		: null;

	expect(hermesSurface.available === true, "Expected Hermes capabilities to report healthy in embedded mode.");
	expect(
		hermesFileStores?.memoriesAccessible === true,
		"Expected Hermes memories filesystem to be accessible.",
	);
	expect(
		hermesFileStores?.skillsAccessible === true,
		"Expected Hermes skills filesystem to be accessible.",
	);
	expect(
		hermesFileStores?.healthy === true,
		"Expected Hermes file stores to be healthy.",
	);
	expect(
		hermesSurface.subsystems?.jobs === true || hermesDetails?.subsystems?.jobs === true,
		"Expected Hermes jobs subsystem to be healthy.",
	);
	expect(
		hermesRuntime?.jobsMode === "embedded",
		"Expected Hermes jobs mode to be embedded.",
	);
	expect(
		hermesFileStores?.vendoredSkillsAccessible === true,
		[
			"Expected the vendored Hermes upstream snapshot to be accessible.",
			"Run `pnpm import:hermes:upstream` to refresh `.agents/vendor/hermes-agent` if it is missing.",
		].join(" "),
	);

	printSection("Wiki Memory");
	const wikiStatusPayload = await readJson(`${backendBaseUrl}/api/wiki/status`);
	expect(wikiStatusPayload?.wiki && typeof wikiStatusPayload.wiki === "object", "Wiki status payload was missing the wiki object.");
	expect(
		wikiStatusPayload.wiki.compiledContexts && typeof wikiStatusPayload.wiki.compiledContexts === "object",
		"Expected compiled wiki-backed memory context metadata.",
	);
	expect(
		wikiStatusPayload.wiki.proposalCounts && typeof wikiStatusPayload.wiki.proposalCounts === "object",
		"Expected wiki-backed memory proposal counts.",
	);
	console.log(
		[
			`Verified compiled wiki-backed memory status.`,
			`Queued proposals: ${wikiStatusPayload.wiki.proposalCounts.queued ?? 0}`,
			`Compiled contexts present: ${Object.values(wikiStatusPayload.wiki.compiledContexts).filter((context) => context?.exists === true).length}`,
		].join(" "),
	);

	printSection("Skills");
	const skillsPayload = await readJson(`${backendBaseUrl}/api/skills`);
	expect(Array.isArray(skillsPayload?.skills), "Skills payload was missing the skills array.");
	const vendoredSkill = skillsPayload.skills.find(
		(skill) => skill.category === "research" && skill.name === "llm-wiki",
	);
	expect(vendoredSkill, "Expected research/llm-wiki to be discoverable from the vendored upstream snapshot.");
	console.log(`Verified ${skillsPayload.skills.length} skills. research/llm-wiki is present.`);

	printSection("Jobs");
	const jobsPayload = await readJson(`${backendBaseUrl}/api/jobs`);
	expect(Array.isArray(jobsPayload?.jobs), "Jobs payload was missing the jobs array.");
	console.log(`Verified jobs endpoint. Current job count: ${jobsPayload.jobs.length}.`);

	if (options.exerciseJobs) {
		printSection("Jobs Exercise");
		const createPayload = await readJson(`${backendBaseUrl}/api/jobs`, {
			body: JSON.stringify({
				name: "Smoke Test Job",
				schedule: "every 1h",
				target: "verify hermes jobs via smoke test",
			}),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		const jobId = createPayload?.job?.id;
		expect(typeof jobId === "string" && jobId.length > 0, "Created job was missing an id.");
		console.log(`Created job ${jobId}.`);

		const pausePayload = await readJson(`${backendBaseUrl}/api/jobs/${encodeURIComponent(jobId)}/pause`, {
			body: JSON.stringify({}),
			headers: {
				"Content-Type": "application/json",
			},
			method: "POST",
		});
		expect(pausePayload?.job?.id === jobId, "Pause response did not return the created job.");
		console.log(`Paused job ${jobId}.`);

		const deleteResponse = await fetch(`${backendBaseUrl}/api/jobs/${encodeURIComponent(jobId)}`, {
			method: "DELETE",
		});
		expect(deleteResponse.ok, `Delete failed with status ${deleteResponse.status}.`);
		console.log(`Deleted job ${jobId}.`);
	}

	console.log("\nHermes control-plane verification passed.");
}

main().catch((error) => {
	console.error(`\nVerification failed: ${error.message}`);
	process.exitCode = 1;
});
