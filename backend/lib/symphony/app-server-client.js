"use strict";

const childProcess = require("child_process");
const readline = require("readline");
const { EventEmitter } = require("events");
const { SymphonyAgentError } = require("./errors");

const LINEAR_GRAPHQL_DYNAMIC_TOOL = {
	description: "Run a Linear GraphQL query or mutation using Symphony's configured Linear API credentials.",
	inputSchema: {
		additionalProperties: false,
		properties: {
			query: {
				description: "The Linear GraphQL query or mutation.",
				type: "string",
			},
			variables: {
				additionalProperties: true,
				description: "Optional GraphQL variables.",
				type: "object",
			},
		},
		required: ["query"],
		type: "object",
	},
	name: "linear_graphql",
};

const LINEAR_ISSUE_GET_DYNAMIC_TOOL = {
	description: "Fetch the current Linear issue, including recent comments and workflow state.",
	inputSchema: {
		additionalProperties: false,
		properties: {
			issueId: {
				description: "Optional Linear issue id. Defaults to the current Symphony issue.",
				type: "string",
			},
		},
		type: "object",
	},
	name: "linear_issue_get",
};

const LINEAR_WORKPAD_UPSERT_DYNAMIC_TOOL = {
	description: "Create or update the single durable Linear comment headed '## Codex Workpad' for the current issue.",
	inputSchema: {
		additionalProperties: false,
		properties: {
			body: {
				description: "Full Markdown body for the workpad. It must start with '## Codex Workpad'.",
				type: "string",
			},
			issueId: {
				description: "Optional Linear issue id. Defaults to the current Symphony issue.",
				type: "string",
			},
		},
		required: ["body"],
		type: "object",
	},
	name: "linear_workpad_upsert",
};

const LINEAR_STATE_SET_DYNAMIC_TOOL = {
	description: "Move the current Linear issue to a named workflow state.",
	inputSchema: {
		additionalProperties: false,
		properties: {
			issueId: {
				description: "Optional Linear issue id. Defaults to the current Symphony issue.",
				type: "string",
			},
			stateName: {
				description: "Linear workflow state name.",
				type: "string",
			},
		},
		required: ["stateName"],
		type: "object",
	},
	name: "linear_state_set",
};

const DYNAMIC_TOOLS = [
	LINEAR_GRAPHQL_DYNAMIC_TOOL,
	LINEAR_ISSUE_GET_DYNAMIC_TOOL,
	LINEAR_WORKPAD_UPSERT_DYNAMIC_TOOL,
	LINEAR_STATE_SET_DYNAMIC_TOOL,
];

function getTextFromTurn(turn) {
	if (!turn || typeof turn !== "object") {
		return "";
	}
	if (typeof turn.outputText === "string") {
		return turn.outputText;
	}
	if (typeof turn.finalResponse === "string") {
		return turn.finalResponse;
	}
	if (!Array.isArray(turn.items)) {
		return "";
	}
	return turn.items
		.flatMap((item) => {
			if (typeof item.text === "string") {
				return [item.text];
			}
			if (Array.isArray(item.parts)) {
				return item.parts.filter((part) => part.type === "text" && typeof part.text === "string").map((part) => part.text);
			}
			return [];
		})
		.join("")
		.trim();
}

function formatJsonRpcError(error) {
	if (!error || typeof error !== "object") {
		return "Codex app-server request failed";
	}
	const parts = ["Codex app-server request failed"];
	if (typeof error.message === "string" && error.message.trim()) {
		parts.push(error.message.trim());
	}
	if (error.data !== undefined) {
		const data = typeof error.data === "string" ? error.data : JSON.stringify(error.data);
		if (data) {
			parts.push(data);
		}
	}
	return parts.join(": ");
}

class CodexAppServerClient extends EventEmitter {
	constructor(options = {}) {
		super();
		this.command = options.command || "codex app-server";
		this.config = options.config || null;
		this.spawn = options.spawn || childProcess.spawn;
		this.linearClient = options.linearClient || null;
		this.issue = options.issue || null;
		this.logger = options.logger || console;
		this.nextId = 1;
		this.pending = new Map();
		this.child = null;
		this.threadId = null;
		this.turns = [];
		this.agentTextByTurn = new Map();
	}

	start() {
		if (this.child) {
			return;
		}

		this.child = this.spawn("sh", ["-lc", this.command], {
			stdio: ["pipe", "pipe", "pipe"],
		});
		this.child.on("error", (error) => this.rejectAll(error));
		this.child.on("exit", (code, signal) => {
			this.rejectAll(new SymphonyAgentError("Codex app-server exited", { code, signal }));
			this.emit("exit", { code, signal });
		});

		const stdout = readline.createInterface({ input: this.child.stdout });
		stdout.on("line", (line) => this.handleLine(line));
		this.child.stderr.on("data", (chunk) => {
			this.emit("stderr", chunk.toString());
		});
	}

	stop() {
		if (!this.child) {
			return;
		}
		this.child.kill("SIGTERM");
		this.child = null;
	}

	rejectAll(error) {
		for (const pending of this.pending.values()) {
			pending.reject(error);
		}
		this.pending.clear();
	}

	handleLine(line) {
		if (!line.trim()) {
			return;
		}

		let message;
		try {
			message = JSON.parse(line);
		} catch (error) {
			this.emit("protocolError", { error, line });
			return;
		}

		if (message.id !== undefined && (message.result !== undefined || message.error !== undefined)) {
			const pending = this.pending.get(message.id);
			if (!pending) {
				return;
			}
			this.pending.delete(message.id);
			if (message.error) {
				pending.reject(new SymphonyAgentError(formatJsonRpcError(message.error), { error: message.error }));
				return;
			}
			pending.resolve(message.result);
			return;
		}

		if (message.id !== undefined && message.method) {
			this.handleServerRequest(message).catch((error) => {
				this.respond(message.id, { error: { code: -32603, message: error.message } });
			});
			return;
		}

		if (message.method) {
			this.handleNotification(message);
		}
	}

	handleNotification(message) {
		this.emit("event", message);
		if (message.method === "turn/completed" && message.params?.turn) {
			this.turns.push(message.params.turn);
		}
		if (message.method === "item/agentMessage/delta" && typeof message.params?.delta === "string") {
			const turnId = message.params.turnId;
			if (turnId) {
				this.agentTextByTurn.set(turnId, `${this.agentTextByTurn.get(turnId) || ""}${message.params.delta}`);
			}
		}
		if (message.method === "item/completed" && message.params?.item?.type === "agentMessage") {
			const turnId = message.params.turnId;
			if (turnId && typeof message.params.item.text === "string") {
				this.agentTextByTurn.set(turnId, message.params.item.text);
			}
		}
	}

	async handleServerRequest(message) {
		const method = message.method;
		if (method === "item/commandExecution/requestApproval") {
			this.respond(message.id, { result: { decision: "acceptForSession" } });
			return;
		}
		if (method === "item/fileChange/requestApproval") {
			this.respond(message.id, { result: { decision: "acceptForSession" } });
			return;
		}
		if (method === "mcpServer/elicitation/request" || method === "item/mcp/elicitationRequest") {
			this.respond(message.id, { result: { action: "decline", content: null, _meta: null } });
			return;
		}
		if (method === "item/tool/requestUserInput") {
			this.respond(message.id, { result: { answers: {} } });
			return;
		}
		if (method === "item/permissions/requestApproval") {
			this.respond(message.id, {
				result: {
					permissions: message.params?.permissions || {},
					scope: "turn",
					strictAutoReview: false,
				},
			});
			return;
		}
		if (method === "item/tool/call") {
			const result = await this.handleDynamicTool(message.params || {});
			this.respond(message.id, { result });
			return;
		}

		this.respond(message.id, {
			error: { code: -32601, message: `Unsupported server request: ${method}` },
		});
	}

	async handleDynamicTool(params) {
		const toolName = params.tool || params.name;
		const namespace = params.namespace || "";
		if (namespace && namespace !== "symphony") {
			return {
				success: false,
				contentItems: [{ type: "inputText", text: `Unknown Symphony tool namespace: ${namespace}` }],
			};
		}
		if (toolName === "linear_graphql") {
			if (!this.linearClient) {
				return {
					success: false,
					contentItems: [{ type: "inputText", text: "linear_graphql is not configured" }],
				};
			}
			const args = typeof params.arguments === "string" ? JSON.parse(params.arguments) : params.arguments || {};
			const data = await this.linearClient.linearGraphql(args.query, args.variables || {});
			return {
				success: true,
				contentItems: [{ type: "inputText", text: JSON.stringify(data, null, 2) }],
			};
		}
		if (!this.linearClient) {
			return {
				success: false,
				contentItems: [{ type: "inputText", text: `${toolName} is not configured` }],
			};
		}
		const args = typeof params.arguments === "string" ? JSON.parse(params.arguments) : params.arguments || {};
		const issueId = args.issueId || this.issue?.id;
		if (toolName === "linear_issue_get") {
			if (!issueId) {
				return { success: false, contentItems: [{ type: "inputText", text: "issueId is required" }] };
			}
			const issue = await this.linearClient.getIssue(issueId);
			return {
				success: true,
				contentItems: [{ type: "inputText", text: JSON.stringify(issue, null, 2) }],
			};
		}
		if (toolName === "linear_workpad_upsert") {
			if (!issueId) {
				return { success: false, contentItems: [{ type: "inputText", text: "issueId is required" }] };
			}
			const body = String(args.body || "").trim();
			if (!/^## Codex Workpad\b/.test(body)) {
				return { success: false, contentItems: [{ type: "inputText", text: "Workpad body must start with '## Codex Workpad'" }] };
			}
			const comment = await this.linearClient.upsertWorkpadComment(issueId, body);
			return {
				success: true,
				contentItems: [{ type: "inputText", text: JSON.stringify(comment, null, 2) }],
			};
		}
		if (toolName === "linear_state_set") {
			if (!issueId) {
				return { success: false, contentItems: [{ type: "inputText", text: "issueId is required" }] };
			}
			const stateName = String(args.stateName || "").trim();
			if (!stateName) {
				return { success: false, contentItems: [{ type: "inputText", text: "stateName is required" }] };
			}
			const reservedStates = new Set([
				...(this.config?.tracker?.landingStates || []),
				...(this.config?.tracker?.terminalStates || []),
				this.config?.tracker?.mergeState,
				this.config?.tracker?.doneState,
			].filter(Boolean));
			if (reservedStates.has(stateName)) {
				return {
					success: false,
					contentItems: [{ type: "inputText", text: `State ${stateName} is reserved for human-gated Symphony transitions` }],
				};
			}
			const issue = await this.linearClient.updateIssueState(issueId, stateName);
			return {
				success: true,
				contentItems: [{ type: "inputText", text: JSON.stringify(issue, null, 2) }],
			};
		}

		return {
			success: false,
			contentItems: [{ type: "inputText", text: `Unknown Symphony tool: ${params.namespace || "default"}/${params.tool}` }],
		};
	}

	request(method, params = {}) {
		this.start();
		const id = this.nextId;
		this.nextId += 1;
		const payload = { id, method, params };

		return new Promise((resolve, reject) => {
			this.pending.set(id, { reject, resolve });
			this.child.stdin.write(`${JSON.stringify(payload)}\n`, "utf8", (error) => {
				if (error) {
					this.pending.delete(id);
					reject(error);
				}
			});
		});
	}

	respond(id, payload) {
		if (!this.child) {
			return;
		}
		const message = { id, ...payload };
		this.child.stdin.write(`${JSON.stringify(message)}\n`);
	}

	async initialize() {
		return this.request("initialize", {
			clientInfo: {
				name: "symphony",
				title: "Symphony",
				version: "0.1.0",
			},
			capabilities: {
				experimentalApi: true,
			},
		});
	}

	async startThread({ cwd, config, developerInstructions, issue }) {
		this.config = config;
		const response = await this.request("thread/start", {
			approvalPolicy: config.agent.approvalPolicy,
			approvalsReviewer: config.agent.approvalsReviewer,
			cwd,
			developerInstructions,
			dynamicTools: DYNAMIC_TOOLS,
			model: config.agent.model,
			experimentalRawEvents: false,
			persistExtendedHistory: true,
			sandbox: config.agent.sandbox,
			serviceName: config.agent.serviceName,
			sessionStartSource: "startup",
		});
		this.threadId = response?.thread?.id || response?.threadId || null;
		if (!this.threadId) {
			throw new SymphonyAgentError("Codex app-server did not return a thread id", { issue: issue.identifier });
		}
		return response;
	}

	async resumeThread({ cwd, config, developerInstructions, threadId }) {
		this.config = config;
		const response = await this.request("thread/resume", {
			approvalPolicy: config.agent.approvalPolicy,
			approvalsReviewer: config.agent.approvalsReviewer,
			cwd,
			developerInstructions,
			dynamicTools: DYNAMIC_TOOLS,
			excludeTurns: true,
			model: config.agent.model,
			sandbox: config.agent.sandbox,
			serviceName: config.agent.serviceName,
			threadId,
		});
		this.threadId = response?.thread?.id || response?.threadId || threadId || null;
		if (!this.threadId) {
			throw new SymphonyAgentError("Codex app-server did not resume a thread", { threadId });
		}
		return response;
	}

	async runTurn({ input, config, cwd }) {
		if (!this.threadId) {
			throw new SymphonyAgentError("Cannot start a turn before starting a thread");
		}
		this.config = config;

		const response = await this.request("turn/start", {
			approvalPolicy: config.agent.approvalPolicy,
			approvalsReviewer: config.agent.approvalsReviewer,
			cwd,
			effort: config.agent.reasoningEffort,
			input: [{ type: "text", text: input, text_elements: [] }],
			model: config.agent.model,
			threadId: this.threadId,
		});

		const turnId = response?.turn?.id || response?.turnId || null;
		const completedTurn = await this.waitForTurnCompletion(turnId, response?.turn);
		return {
			response,
			success: completedTurn?.status ? completedTurn.status === "completed" : true,
			text: this.agentTextByTurn.get(turnId) || getTextFromTurn(completedTurn) || getTextFromTurn(response?.turn),
			threadId: this.threadId,
			turnId,
		};
	}

	waitForTurnCompletion(turnId, initialTurn, timeoutMs = 30 * 60 * 1000) {
		if (initialTurn?.status === "completed") {
			return Promise.resolve(initialTurn);
		}
		const previous = this.turns.find((turn) => !turnId || turn.id === turnId);
		if (previous) {
			return Promise.resolve(previous);
		}

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				cleanup();
				reject(new SymphonyAgentError("Timed out waiting for Codex turn completion", { turnId, timeoutMs }));
			}, timeoutMs);
			const cleanup = () => {
				clearTimeout(timeout);
				this.off("event", onEvent);
				this.off("exit", onExit);
			};
			const onExit = ({ code, signal }) => {
				cleanup();
				reject(new SymphonyAgentError("Codex app-server stopped before turn completed", { code, signal, turnId }));
			};
			const onEvent = (message) => {
				if (message.method !== "turn/completed") {
					return;
				}
				const turn = message.params?.turn;
				if (turnId && turn?.id !== turnId) {
					return;
				}
				cleanup();
				resolve(turn);
			};
			this.on("event", onEvent);
			this.on("exit", onExit);
		});
	}
}

module.exports = {
	CodexAppServerClient,
	getTextFromTurn,
};
