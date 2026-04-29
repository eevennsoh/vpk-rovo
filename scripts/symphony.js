#!/usr/bin/env node
"use strict";

const path = require("path");
const dotenv = require("dotenv");
const { createStatusServer, createSymphonyService } = require("../backend/lib/symphony");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
dotenv.config({ quiet: true });

function parseArgs(argv) {
	const args = {
		once: false,
		workflowPath: process.env.SYMPHONY_WORKFLOW || "WORKFLOW.md",
	};
	for (let index = 2; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--") {
			continue;
		}
		if (arg === "--once") {
			args.once = true;
			continue;
		}
		if (arg === "--workflow") {
			args.workflowPath = argv[index + 1];
			index += 1;
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			args.help = true;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	return args;
}

function printHelp() {
	console.log(`Usage: pnpm run symphony -- [--workflow WORKFLOW.md] [--once]

Runs the Symphony Linear-to-Codex orchestrator.

Environment:
  LINEAR_API_KEY       Linear GraphQL API token
  LINEAR_TEAM_KEY      Linear team key when not provided by workflow front matter
  SYMPHONY_WORKFLOW    Optional workflow file path
`);
}

async function main() {
	const args = parseArgs(process.argv);
	if (args.help) {
		printHelp();
		return;
	}

	const service = createSymphonyService({
		workflowPath: path.resolve(process.cwd(), args.workflowPath),
		logger: console,
	});
	let statusServer = null;
	if (service.config.dispatch.statusPort) {
		statusServer = createStatusServer(service.orchestrator);
		statusServer.listen(Number(service.config.dispatch.statusPort), "127.0.0.1", () => {
			console.log(`[symphony] status server listening on 127.0.0.1:${service.config.dispatch.statusPort}`);
		});
	}

	if (args.once) {
		const snapshot = await service.orchestrator.pollOnce();
		console.log(JSON.stringify(snapshot, null, 2));
		statusServer?.close();
		return;
	}

	process.on("SIGINT", () => {
		service.orchestrator.stop();
		statusServer?.close();
	});
	process.on("SIGTERM", () => {
		service.orchestrator.stop();
		statusServer?.close();
	});
	await service.orchestrator.runForever();
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
