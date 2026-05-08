"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");

const { createAIGatewayProvider } = require("./ai-gateway-provider");

const SUMMARY_LENGTHS = new Set(["short", "medium", "long"]);
const DEFAULT_SUMMARIZE_MODEL = "auto";
const DEFAULT_SUMMARIZE_TIMEOUT_MS = 180000;
const SUMMARIZE_MODEL_ENV_KEY = "PERSONAL_GRAPH_SUMMARIZE_MODEL";
const SUMMARIZE_TIMEOUT_ENV_KEY = "PERSONAL_GRAPH_SUMMARIZE_TIMEOUT_MS";
const SUMMARIZE_BIN_ENV_KEY = "PERSONAL_GRAPH_SUMMARIZE_BIN";
const REPO_ROOT = path.join(__dirname, "..", "..");
const TEMP_ROOT = path.join(REPO_ROOT, ".tmp", "personal-graph", "summarize");

const SUMMARIZE_PROMPT = [
	"Summarize this raw source for a personal second-brain librarian.",
	"Return JSON only with shape {\"takeaways\":[string,string,string,string,string],\"summary\":\"string\"}.",
	"Use 3 to 5 concise takeaways. Do not include markdown fences.",
].join("\n");

function getNonEmptyString(value) {
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function createSummarizeError(message, code, cause) {
	const error = new Error(message);
	error.code = code;
	if (cause) {
		error.cause = cause;
	}
	return error;
}

function normalizeSummaryLength(length) {
	const normalized = String(length ?? "medium").trim().toLowerCase();
	if (!SUMMARY_LENGTHS.has(normalized)) {
		throw createSummarizeError(
			`Unsupported summary length: ${length}. Expected short, medium, or long.`,
			"INVALID_SUMMARY_LENGTH",
		);
	}
	return normalized;
}

function getSummarizeModel() {
	return getNonEmptyString(process.env[SUMMARIZE_MODEL_ENV_KEY]) ?? DEFAULT_SUMMARIZE_MODEL;
}

function getSummarizeTimeoutMs() {
	const rawValue = getNonEmptyString(process.env[SUMMARIZE_TIMEOUT_ENV_KEY]);
	if (!rawValue) {
		return DEFAULT_SUMMARIZE_TIMEOUT_MS;
	}
	const parsed = Number.parseInt(rawValue, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SUMMARIZE_TIMEOUT_MS;
}

function resolveSummarizeBinary({ fsImpl = fs, repoRoot = REPO_ROOT } = {}) {
	const explicitBinary = getNonEmptyString(process.env[SUMMARIZE_BIN_ENV_KEY]);
	if (explicitBinary) {
		return explicitBinary;
	}

	const binaryName = process.platform === "win32" ? "summarize.cmd" : "summarize";
	const localBinary = path.join(repoRoot, "node_modules", ".bin", binaryName);
	if (fsImpl.existsSync(localBinary)) {
		return localBinary;
	}

	try {
		const packagePath = require.resolve("@steipete/summarize/package.json", { paths: [repoRoot] });
		const packageJson = JSON.parse(fsImpl.readFileSync(packagePath, "utf8"));
		const bin = typeof packageJson.bin === "string"
			? packageJson.bin
			: packageJson.bin?.summarize ?? packageJson.bin?.summarizer;
		if (typeof bin === "string" && bin.trim()) {
			return path.resolve(path.dirname(packagePath), bin);
		}
	} catch {
		// Fall through to the local binary so execFile can produce the setup error.
	}

	return localBinary;
}

function stripAnsi(value) {
	return String(value ?? "").replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/gu, "");
}

function trimTakeaway(value) {
	return value
		.replace(/^\s*(?:[-*+]|\d+[.)])\s+/u, "")
		.replace(/\*\*/gu, "")
		.trim();
}

function deriveTakeaways(markdown) {
	const lines = markdown.split("\n").map((line) => line.trim()).filter(Boolean);
	const bulletTakeaways = lines
		.filter((line) => /^(?:[-*+]|\d+[.)])\s+/u.test(line))
		.map(trimTakeaway)
		.filter(Boolean)
		.slice(0, 5);
	if (bulletTakeaways.length > 0) {
		return bulletTakeaways;
	}

	return markdown
		.replace(/^#+\s+/gmu, "")
		.split(/(?<=[.!?])\s+/u)
		.map((sentence) => sentence.trim())
		.filter((sentence) => sentence.length > 0)
		.slice(0, 3);
}

function normalizeSummaryOutput(stdout) {
	const summary = stripAnsi(stdout).trim();
	if (!summary) {
		throw createSummarizeError("summarize CLI returned empty output.", "MALFORMED_SUMMARY");
	}
	return {
		summary,
		takeaways: deriveTakeaways(summary),
	};
}

function runExecFile(execFileImpl, command, args, options) {
	return new Promise((resolve, reject) => {
		execFileImpl(command, args, options, (error, stdout, stderr) => {
			if (error) {
				error.stderr = stderr;
				error.stdout = stdout;
				reject(error);
				return;
			}
			resolve({ stderr, stdout });
		});
	});
}

function mapSummarizeExecError(error, command, args, timeoutMs, signal) {
	if (signal?.aborted || error?.name === "AbortError" || error?.code === "ABORT_ERR") {
		return createSummarizeError("summarize CLI run was aborted.", "SUMMARIZE_ABORTED", error);
	}
	if (error?.code === "ENOENT") {
		return createSummarizeError(
			`summarize CLI not found at ${command}. Run \`pnpm install\` or set ${SUMMARIZE_BIN_ENV_KEY}.`,
			"SUMMARIZE_NOT_FOUND",
			error,
		);
	}
	if (error?.code === "ETIMEDOUT" || /timed out|timeout/iu.test(error?.message ?? "")) {
		return createSummarizeError(
			`summarize CLI timed out after ${timeoutMs}ms.`,
			"SUMMARIZE_TIMEOUT",
			error,
		);
	}

	const stderr = getNonEmptyString(error?.stderr) ?? getNonEmptyString(error?.stdout) ?? getNonEmptyString(error?.message);
	return createSummarizeError(
		`summarize CLI failed: ${stderr ?? `${command} ${args.join(" ")} exited non-zero`}`,
		"SUMMARIZE_FAILED",
		error,
	);
}

async function runSummarizeCli({
	execFileImpl = execFile,
	input,
	length = "medium",
	model = getSummarizeModel(),
	prompt,
	signal,
	timeoutMs = getSummarizeTimeoutMs(),
} = {}) {
	const inputValue = getNonEmptyString(input);
	if (!inputValue) {
		throw createSummarizeError("summarize CLI input is required.", "SUMMARIZE_INPUT_REQUIRED");
	}

	const resolvedLength = normalizeSummaryLength(length);
	const command = resolveSummarizeBinary();
	const args = [
		inputValue,
		"--length",
		resolvedLength,
		"--model",
		getNonEmptyString(model) ?? DEFAULT_SUMMARIZE_MODEL,
		"--timeout",
		`${timeoutMs}ms`,
		"--plain",
		"--stream",
		"off",
		"--metrics",
		"off",
		"--no-color",
	];
	const promptValue = getNonEmptyString(prompt);
	if (promptValue) {
		args.push("--prompt", promptValue);
	}

	try {
		const result = await runExecFile(execFileImpl, command, args, {
			encoding: "utf8",
			maxBuffer: 50 * 1024 * 1024,
			signal,
			timeout: timeoutMs,
		});
		return normalizeSummaryOutput(result.stdout);
	} catch (error) {
		throw mapSummarizeExecError(error, command, args, timeoutMs, signal);
	}
}

function getTemporaryExtension(kind) {
	const normalized = String(kind ?? "markdown").replace(/^\./u, "").toLowerCase();
	if (normalized === "html" || normalized === "htm") return ".html";
	if (normalized === "txt" || normalized === "text") return ".txt";
	return ".md";
}

function writeTemporarySummaryInput(content, { kind = "markdown", prefix = "context" } = {}) {
	fs.mkdirSync(TEMP_ROOT, { recursive: true });
	const filePath = path.join(
		TEMP_ROOT,
		`${prefix}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}${getTemporaryExtension(kind)}`,
	);
	fs.writeFileSync(filePath, String(content ?? ""), "utf8");
	return filePath;
}

async function summarizeRaw({ content, input, kind = "markdown", length = "medium", signal } = {}, options = {}) {
	const tempPath = input ? null : writeTemporarySummaryInput(content, { kind, prefix: "raw" });
	try {
		return await runSummarizeCli({
			execFileImpl: options.execFileImpl,
			input: input ?? tempPath,
			length,
			model: options.model,
			prompt: options.prompt,
			signal,
			timeoutMs: options.timeoutMs,
		});
	} finally {
		if (tempPath) {
			fs.rmSync(tempPath, { force: true });
		}
	}
}

function parseJsonObject(text) {
	try {
		return JSON.parse(text);
	} catch {
		const match = String(text).match(/\{[\s\S]*\}/u);
		if (match) {
			return JSON.parse(match[0]);
		}
		throw new Error("Model response was not valid JSON.");
	}
}

function validateSummaryShape(value) {
	if (!value || typeof value !== "object") {
		const error = new Error("Summary response was not an object.");
		error.code = "MALFORMED_SUMMARY";
		throw error;
	}
	const takeaways = Array.isArray(value.takeaways)
		? value.takeaways.filter((entry) => typeof entry === "string" && entry.trim()).slice(0, 5)
		: [];
	if (takeaways.length === 0 || typeof value.summary !== "string" || !value.summary.trim()) {
		const error = new Error("Summary response did not include takeaways and summary.");
		error.code = "MALFORMED_SUMMARY";
		throw error;
	}
	return { summary: value.summary.trim(), takeaways };
}

async function summarizeRawWithGateway({ content, kind = "markdown", provider } = {}, { aiGatewayProvider } = {}) {
	const gateway = aiGatewayProvider ?? createAIGatewayProvider({ logger: console });
	try {
		const text = await gateway.generateText({
			maxOutputTokens: 900,
			prompt: `Kind: ${kind}\n\n${content}`,
			provider,
			system: SUMMARIZE_PROMPT,
			temperature: 0.2,
		});
		return validateSummaryShape(parseJsonObject(text));
	} catch (error) {
		if (error?.code === "MALFORMED_SUMMARY") {
			throw error;
		}
		const wrapped = new Error(`Failed to summarize raw source: ${error instanceof Error ? error.message : String(error)}`);
		wrapped.code = "SUMMARIZE_FAILED";
		wrapped.cause = error;
		throw wrapped;
	}
}

module.exports = {
	DEFAULT_SUMMARIZE_MODEL,
	DEFAULT_SUMMARIZE_TIMEOUT_MS,
	SUMMARIZE_BIN_ENV_KEY,
	SUMMARIZE_MODEL_ENV_KEY,
	SUMMARIZE_PROMPT,
	SUMMARIZE_TIMEOUT_ENV_KEY,
	normalizeSummaryLength,
	normalizeSummaryOutput,
	resolveSummarizeBinary,
	runSummarizeCli,
	summarizeRaw,
	summarizeRawWithGateway,
	validateSummaryShape,
	writeTemporarySummaryInput,
};
