const fs = require("node:fs/promises");
const path = require("node:path");
const { getNonEmptyString, getPositiveInteger } = require("../lib/shared-utils");
const {
	streamViaRovoDev,
	generateTextViaRovoDev,
	isChatInProgressError,
	WAIT_FOR_TURN_TIMEOUT_MS,
} = require("../lib/rovodev-gateway");
const { createAIGatewayProvider } = require("../lib/ai-gateway-provider");
const {
	getEnvVars,
	detectEndpointType,
	resolveGatewayUrl,
} = require("../lib/ai-gateway-helpers");
const { getGenuiSummarySystemPrompt } = require("../lib/genui-system-prompt");
const { analyzeGeneratedText, pickBestSpec } = require("../lib/genui-spec-utils");
const { inferTaskDependencies, isLinearChain } = require("../lib/dag-inference");
const {
	normalizeTeamAgentCount,
	resolveRunLaneDefinitions,
	assignTasksToLanes,
	buildConversationContextWithBudget,
	mergeConversationContextWithBudget,
	ensureRunLaneDefinitions,
} = require("../lib/team-run-lanes");
const {
	snapshotUntrackedFiles,
	computeCreatedFiles,
	readCreatedFilesFromDisk,
	writeCreatedFilesToDisk,
	deleteCreatedFiles,
	createSnapshotLock,
} = require("./make-file-tracker");

const TERMINAL_TASK_STATUSES = new Set(["done", "failed", "blocked-failed"]);
const FAILURE_TASK_STATUSES = new Set(["failed", "blocked-failed"]);
const RUN_STATUS_RUNNING = "running";
const RUN_STATUS_COMPLETED = "completed";
const RUN_STATUS_FAILED = "failed";
const DEFAULT_MAX_CONCURRENT_AGENTS =
	getPositiveInteger(process.env.ROVODEV_POOL_SIZE) || 4;
const MAX_RUN_LIST_LIMIT = 50;
const STREAMING_UPDATE_CHUNK_SIZE = 120;
const STREAMING_UPDATE_MAX_CONTENT_CHARS = 8000;
const STREAMING_UPDATE_FLUSH_MS = 1000;
const MAKE_EXECUTION_CONFLICT_CODE = "MAKE_EXECUTION_CONFLICT";
const GENUI_WIDGET_COUNT = 1;
const GENUI_WIDGET_BLUEPRINTS = [
	{
		id: "primary-overview-widget",
		title: "Primary overview widget",
		focus:
			"Combine run KPIs with at least one chart (PieChart for task status distribution or BarChart for tasks per agent), plus recommended next actions in one interactive overview.",
	},
];

/**
 * Create a non-retryable error for Make execution conflicts.
 * A 409 during Make orchestration means the runtime incorrectly started
 * overlapping top-level execution — this is a bug, not a transient issue.
 * @param {Error} cause
 * @returns {Error}
 */
function createMakeExecutionConflictError(cause) {
	const err = new Error(
		"Make execution conflict: a previous RovoDev turn is still active. " +
		"This indicates overlapping top-level execution in single-port mode — failing run."
	);
	err.code = MAKE_EXECUTION_CONFLICT_CODE;
	err.cause = cause;
	return err;
}

/**
 * Check whether an error is a Make execution conflict (non-retryable).
 * @param {Error} err
 * @returns {boolean}
 */
function isMakeExecutionConflict(err) {
	return err && typeof err === "object" && err.code === MAKE_EXECUTION_CONFLICT_CODE;
}

function getAIGatewayDiagnostics(preferredProvider) {
	const envVars = getEnvVars();
	const normalizedProvider =
		typeof preferredProvider === "string" ? preferredProvider.trim().toLowerCase() : null;
	const rawGatewayUrl =
		normalizedProvider === "google"
			? envVars.AI_GATEWAY_URL_GOOGLE || envVars.AI_GATEWAY_URL
			: envVars.AI_GATEWAY_URL || envVars.AI_GATEWAY_URL_GOOGLE;
	const resolvedGatewayUrl = rawGatewayUrl
		? resolveGatewayUrl(rawGatewayUrl) || rawGatewayUrl
		: null;
	const endpointType = resolvedGatewayUrl
		? detectEndpointType(resolvedGatewayUrl)
		: null;

	return {
		provider: normalizedProvider || "default",
		endpointType: endpointType || "unknown",
		config: {
			AI_GATEWAY_URL: envVars.AI_GATEWAY_URL ? "SET" : "MISSING",
			AI_GATEWAY_URL_GOOGLE: envVars.AI_GATEWAY_URL_GOOGLE ? "SET" : "MISSING",
			AI_GATEWAY_USE_CASE_ID: envVars.AI_GATEWAY_USE_CASE_ID ? "SET" : "MISSING",
			AI_GATEWAY_CLOUD_ID: envVars.AI_GATEWAY_CLOUD_ID ? "SET" : "MISSING",
			AI_GATEWAY_USER_ID: envVars.AI_GATEWAY_USER_ID ? "SET" : "MISSING",
			ASAP_ISSUER: process.env.ASAP_ISSUER ? "SET" : "MISSING",
			ASAP_KID: process.env.ASAP_KID ? "SET" : "MISSING",
			ASAP_PRIVATE_KEY: process.env.ASAP_PRIVATE_KEY ? "SET" : "MISSING",
		},
	};
}

function formatAIGatewayDiagnostics(diagnostics) {
	return (
		`[AI Gateway diagnostics] provider=${diagnostics.provider}; ` +
		`endpointType=${diagnostics.endpointType}; ` +
		`AI_GATEWAY_URL=${diagnostics.config.AI_GATEWAY_URL}; ` +
		`AI_GATEWAY_URL_GOOGLE=${diagnostics.config.AI_GATEWAY_URL_GOOGLE}; ` +
		`AI_GATEWAY_USE_CASE_ID=${diagnostics.config.AI_GATEWAY_USE_CASE_ID}; ` +
		`AI_GATEWAY_CLOUD_ID=${diagnostics.config.AI_GATEWAY_CLOUD_ID}; ` +
		`AI_GATEWAY_USER_ID=${diagnostics.config.AI_GATEWAY_USER_ID}; ` +
		`ASAP_ISSUER=${diagnostics.config.ASAP_ISSUER}; ` +
		`ASAP_KID=${diagnostics.config.ASAP_KID}; ` +
		`ASAP_PRIVATE_KEY=${diagnostics.config.ASAP_PRIVATE_KEY}`
	);
}

function createId(prefix) {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugifyAgentName(value) {
	const fallback = "agent";
	if (!value) {
		return fallback;
	}

	const normalizedValue = value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return normalizedValue || fallback;
}

function delay(milliseconds) {
	return new Promise((resolve) => {
		setTimeout(resolve, milliseconds);
	});
}

function safeJsonParse(rawValue) {
	try {
		return JSON.parse(rawValue);
	} catch {
		return null;
	}
}

function toIsoDate() {
	return new Date().toISOString();
}

function getTimestampFromIsoString(value) {
	if (typeof value !== "string" || !value.trim()) {
		return Number.NaN;
	}

	return Date.parse(value);
}

function parseJsonObjectFromText(rawText) {
	if (typeof rawText !== "string") {
		return null;
	}

	const trimmedText = rawText.trim();
	if (!trimmedText) {
		return null;
	}

	const parsed = safeJsonParse(trimmedText);
	if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
		return parsed;
	}

	const objectMatch = trimmedText.match(/\{[\s\S]*\}/);
	if (!objectMatch) {
		return null;
	}

	const objectPayload = safeJsonParse(objectMatch[0]);
	if (!objectPayload || typeof objectPayload !== "object" || Array.isArray(objectPayload)) {
		return null;
	}

	return objectPayload;
}

function normalizeTaskArray(rawTasks, existingTaskIds = new Set()) {
	if (!Array.isArray(rawTasks)) {
		return [];
	}

	const seenTaskIds = new Set(existingTaskIds);
	const seenRawTaskIds = new Map();
	const provisionalTasks = rawTasks
		.map((rawTask, index) => {
			if (!rawTask || typeof rawTask !== "object") {
				return null;
			}

			const taskRecord = rawTask;
			const label =
				getNonEmptyString(taskRecord.label) ||
				getNonEmptyString(taskRecord.title) ||
				getNonEmptyString(taskRecord.task);
			if (!label) {
				return null;
			}

			const fallbackTaskId = `task-${index + 1}`;
			const providedTaskId = getNonEmptyString(taskRecord.id) || fallbackTaskId;
			let taskId = providedTaskId;
			let duplicateIndex = 2;
			while (seenTaskIds.has(taskId)) {
				taskId = `${providedTaskId}-${duplicateIndex}`;
				duplicateIndex += 1;
			}
			seenTaskIds.add(taskId);
			seenRawTaskIds.set(providedTaskId, taskId);

			const agentName = getNonEmptyString(taskRecord.agent) || "Rovo";
			const agentId = slugifyAgentName(agentName);
			const rawBlockedBy = Array.isArray(taskRecord.blockedBy)
				? taskRecord.blockedBy
						.map((dependencyId) => getNonEmptyString(dependencyId))
						.filter(Boolean)
				: [];

			return {
				id: taskId,
				label,
				agentName,
				agentId,
				rawBlockedBy,
			};
		})
		.filter(Boolean);

	const newTaskIds = new Set(provisionalTasks.map((task) => task.id));
	return provisionalTasks.map((task) => {
		const blockedBy = task.rawBlockedBy
			.map((dependencyId) => seenRawTaskIds.get(dependencyId) || dependencyId)
			.filter(
				(dependencyId) =>
					dependencyId !== task.id &&
					(newTaskIds.has(dependencyId) || existingTaskIds.has(dependencyId))
			);

		return {
			id: task.id,
			label: task.label,
			agentName: task.agentName,
			agentId: task.agentId,
			blockedBy,
		};
	});
}

function normalizeTaskIdArray(rawTaskIds) {
	if (!Array.isArray(rawTaskIds)) {
		return [];
	}

	const normalizedTaskIds = [];
	const seenTaskIds = new Set();
	for (const rawTaskId of rawTaskIds) {
		const taskId = getNonEmptyString(rawTaskId);
		if (!taskId || seenTaskIds.has(taskId)) {
			continue;
		}

		seenTaskIds.add(taskId);
		normalizedTaskIds.push(taskId);
	}

	return normalizedTaskIds;
}

function normalizePlan(rawPlan) {
	if (!rawPlan || typeof rawPlan !== "object") {
		return null;
	}

	const planRecord = rawPlan;
	const title =
		getNonEmptyString(planRecord.title) ||
		getNonEmptyString(planRecord.name) ||
		"Execution plan";
	const description = getNonEmptyString(planRecord.description) || undefined;
	const emoji = getNonEmptyString(planRecord.emoji) || undefined;
	const tasks = normalizeTaskArray(planRecord.tasks, new Set());
	if (tasks.length === 0) {
		return null;
	}

	const agents = Array.from(new Set(tasks.map((task) => task.agentName))).sort();
	return {
		title,
		description,
		emoji,
		agents,
		tasks,
	};
}

function normalizePlanDelta(rawPlanDelta, existingTaskIds) {
	if (!rawPlanDelta || typeof rawPlanDelta !== "object") {
		return null;
	}

	const planDeltaRecord = rawPlanDelta;
	const tasks = normalizeTaskArray(planDeltaRecord.tasks, existingTaskIds);
	if (tasks.length === 0) {
		return null;
	}

	const title = getNonEmptyString(planDeltaRecord.title) || undefined;
	const description = getNonEmptyString(planDeltaRecord.description) || undefined;
	const emoji = getNonEmptyString(planDeltaRecord.emoji) || undefined;
	const agents = Array.from(new Set(tasks.map((task) => task.agentName))).sort();

	return {
		title,
		description,
		emoji,
		agents,
		tasks,
	};
}

function buildConversationContext(rawConversation) {
	return buildConversationContextWithBudget(rawConversation);
}

function buildRunPaths(baseDir, runId) {
	const runDir = path.join(baseDir, runId);
	return {
		runDir,
		runFilePath: path.join(runDir, "run.json"),
		summaryJsonPath: path.join(runDir, "summary.json"),
		summaryMarkdownPath: path.join(runDir, "summary.md"),
		genuiSummaryJsonPath: path.join(runDir, "genui-summary.json"),
		createdFilesPath: path.join(runDir, "created-files.json"),
		agentsDir: path.join(runDir, "agents"),
		tasksDir: path.join(runDir, "tasks"),
	};
}

function createEmptyGenuiSpec() {
	return {
		root: "",
		elements: {},
	};
}

function normalizeGenuiSpec(rawSpec) {
	if (!rawSpec || typeof rawSpec !== "object" || Array.isArray(rawSpec)) {
		return createEmptyGenuiSpec();
	}

	const normalizedSpec = {
		root: typeof rawSpec.root === "string" ? rawSpec.root : "",
		elements:
			rawSpec.elements &&
			typeof rawSpec.elements === "object" &&
			!Array.isArray(rawSpec.elements)
				? rawSpec.elements
				: {},
	};

	if (
		Object.prototype.hasOwnProperty.call(rawSpec, "state") &&
		rawSpec.state !== undefined
	) {
		normalizedSpec.state = rawSpec.state;
	}

	return normalizedSpec;
}

function hasRenderableGenuiSpec(spec) {
	if (!spec || typeof spec !== "object" || Array.isArray(spec)) {
		return false;
	}

	const root = typeof spec.root === "string" ? spec.root.trim() : "";
	if (!root) {
		return false;
	}

	const elements =
		spec.elements &&
		typeof spec.elements === "object" &&
		!Array.isArray(spec.elements)
			? spec.elements
			: null;
	return Boolean(elements && Object.keys(elements).length > 0);
}

function createDefaultGenuiWidget(index, createdAt) {
	return {
		id: `interactive-widget-${index + 1}`,
		title: `Interactive widget ${index + 1}`,
		spec: createEmptyGenuiSpec(),
		status: "failed",
		createdAt,
		error: "Widget content is not available yet.",
	};
}

function normalizeGenuiWidget(rawWidget, index, fallbackCreatedAt) {
	const fallbackWidget = createDefaultGenuiWidget(index, fallbackCreatedAt);
	if (!rawWidget || typeof rawWidget !== "object" || Array.isArray(rawWidget)) {
		return fallbackWidget;
	}

	const spec = normalizeGenuiSpec(rawWidget.spec);
	const isRenderable = hasRenderableGenuiSpec(spec);
	const status =
		rawWidget.status === "ready" && isRenderable
			? "ready"
			: rawWidget.status === "failed" || !isRenderable
				? "failed"
				: "ready";

	const error =
		getNonEmptyString(rawWidget.error) ||
		(status === "failed" ? "Failed to generate interactive widget." : undefined);

	return {
		id: getNonEmptyString(rawWidget.id) || fallbackWidget.id,
		title: getNonEmptyString(rawWidget.title) || fallbackWidget.title,
		spec,
		status,
		createdAt: getNonEmptyString(rawWidget.createdAt) || fallbackCreatedAt,
		error,
	};
}

function normalizeGenuiSummary(rawGenuiSummary) {
	if (!rawGenuiSummary || typeof rawGenuiSummary !== "object") {
		return null;
	}

	const createdAt = getNonEmptyString(rawGenuiSummary.createdAt) || toIsoDate();
	const widgets = Array.isArray(rawGenuiSummary.widgets)
		? rawGenuiSummary.widgets
				.slice(0, GENUI_WIDGET_COUNT)
				.map((rawWidget, index) => normalizeGenuiWidget(rawWidget, index, createdAt))
		: [];
	const legacySpec = normalizeGenuiSpec(rawGenuiSummary.spec);
	const hasRenderableLegacySpec = hasRenderableGenuiSpec(legacySpec);

	if (widgets.length === 0) {
		const legacyStatus =
			rawGenuiSummary.status === "ready" && hasRenderableLegacySpec
				? "ready"
				: rawGenuiSummary.status === "failed" || !hasRenderableLegacySpec
					? "failed"
					: "ready";
		widgets.push({
			id: "interactive-widget-1",
			title: "Interactive widget 1",
			spec: legacySpec,
			status: legacyStatus,
			createdAt,
			error:
				getNonEmptyString(rawGenuiSummary.error) ||
				(legacyStatus === "failed"
					? "Failed to generate interactive summary."
					: undefined),
		});
	}

	const readyWidgetCount = widgets.filter(
		(widget) => widget.status === "ready" && hasRenderableGenuiSpec(widget.spec)
	).length;
	const status = readyWidgetCount > 0 ? "ready" : "failed";
	const summaryError =
		getNonEmptyString(rawGenuiSummary.error) ||
		(status === "failed" ? "Failed to generate interactive summary widgets." : undefined);
	const representativeSpec =
		widgets.find((widget) => widget.status === "ready")?.spec ||
		(hasRenderableLegacySpec ? legacySpec : createEmptyGenuiSpec());

	return {
		widgets,
		spec: representativeSpec,
		partial: Boolean(rawGenuiSummary.partial),
		createdAt,
		status,
		error: summaryError,
	};
}

function ensureRunDefaults(rawRun) {
	if (!rawRun || typeof rawRun !== "object") {
		return null;
	}

	const runId = getNonEmptyString(rawRun.runId) || getNonEmptyString(rawRun.id);
	if (!runId) {
		return null;
	}

	const status =
		rawRun.status === RUN_STATUS_COMPLETED || rawRun.status === RUN_STATUS_FAILED
			? rawRun.status
			: RUN_STATUS_RUNNING;
	const createdAt = getNonEmptyString(rawRun.createdAt) || toIsoDate();
	const updatedAt = getNonEmptyString(rawRun.updatedAt) || createdAt;
	const completedAt = getNonEmptyString(rawRun.completedAt);
	const iteration = getPositiveInteger(rawRun.iteration) || 1;
	const plan =
		rawRun.plan && typeof rawRun.plan === "object"
			? rawRun.plan
			: {
				title: "Execution plan",
				description: undefined,
				emoji: undefined,
				agents: [],
				tasks: [],
			};
	const tasks = Array.isArray(rawRun.tasks)
		? rawRun.tasks.map((task) => ({
				...task,
				iteration: getPositiveInteger(task.iteration) || 1,
				batchId: getNonEmptyString(task.batchId) || null,
		  }))
		: [];
	const agents = Array.isArray(rawRun.agents) ? rawRun.agents : [];
	const directives = Array.isArray(rawRun.directives) ? rawRun.directives : [];

	return {
		id: runId,
		status,
		error: getNonEmptyString(rawRun.error),
		createdAt,
		updatedAt,
		completedAt,
		plan,
		tasks,
		agents,
		directives,
		summary: rawRun.summary || null,
		genuiSummary: normalizeGenuiSummary(rawRun.genuiSummary),
		userPrompt: getNonEmptyString(rawRun.userPrompt) || "",
		customInstruction: getNonEmptyString(rawRun.customInstruction) || undefined,
		agentCount: normalizeAgentCount(rawRun.agentCount),
		conversationContext: buildConversationContext(rawRun.conversationContext),
		iteration,
		activeBatchId: getNonEmptyString(rawRun.activeBatchId) || null,
		createdFiles: Array.isArray(rawRun.createdFiles) ? rawRun.createdFiles : [],
		events: [],
		subscribers: new Set(),
		schedulerPromise: null,
	};
}

function normalizeAgentCount(value) {
	return normalizeTeamAgentCount(value, 1);
}

function createGeneralPurposeLaneDefinitions(agentCount, tasks) {
	const normalizedAgentCount = normalizeAgentCount(agentCount);

	return resolveRunLaneDefinitions({
		tasks: Array.isArray(tasks) ? tasks : [],
		agentCount: normalizedAgentCount,
	});
}

function createInitialRun({ runId, plan, userPrompt, conversationContext, customInstruction, agentCount }) {
	const now = toIsoDate();
	const batchId = createId("batch");
	const iteration = 1;
	const normalizedAgentCount = normalizeAgentCount(agentCount);
	const laneDefinitions = createGeneralPurposeLaneDefinitions(normalizedAgentCount, plan.tasks);
	const distributedPlanTasks = assignTasksToLanes(plan.tasks, laneDefinitions);
	const tasks = distributedPlanTasks.map((task) => ({
		id: task.id,
		label: task.label,
		agentName: task.agentName,
		agentId: task.agentId,
		blockedBy: task.blockedBy,
		status: "todo",
		attempts: 0,
		startedAt: null,
		completedAt: null,
		error: null,
		output: null,
		outputSummary: null,
		iteration,
		batchId,
	}));

	const agents = laneDefinitions.map((lane) => ({
		agentId: lane.agentId,
		agentName: lane.agentName,
		status: "idle",
		currentTaskId: null,
		currentTaskLabel: null,
		latestContent: "",
		updatedAt: now,
	}));

	return {
		id: runId,
		status: RUN_STATUS_RUNNING,
		error: null,
		createdAt: now,
		updatedAt: now,
		completedAt: null,
		plan: {
			title: plan.title,
			description: plan.description,
			emoji: plan.emoji,
			agents: laneDefinitions.map((lane) => lane.agentName),
			tasks: tasks.map((task) => ({
				id: task.id,
				label: task.label,
				agent: task.agentName,
				blockedBy: task.blockedBy,
			})),
		},
		tasks,
		agents,
		directives: [],
		summary: null,
		genuiSummary: null,
		userPrompt: userPrompt || "",
		customInstruction: customInstruction || undefined,
		agentCount: normalizedAgentCount,
		conversationContext,
		iteration,
		activeBatchId: batchId,
		createdFiles: [],
		events: [],
		subscribers: new Set(),
		schedulerPromise: null,
	};
}

function toSerializableRun(run) {
	return {
		runId: run.id,
		status: run.status,
		error: run.error,
		createdAt: run.createdAt,
		updatedAt: run.updatedAt,
		completedAt: run.completedAt,
		plan: run.plan,
		tasks: run.tasks,
		agents: run.agents,
		directives: run.directives,
		summary: run.summary,
		genuiSummary: normalizeGenuiSummary(run.genuiSummary),
		userPrompt: run.userPrompt,
		customInstruction: run.customInstruction,
		agentCount: run.agentCount,
		conversationContext: run.conversationContext,
		iteration: run.iteration,
		activeBatchId: run.activeBatchId,
		createdFiles: run.createdFiles || [],
	};
}

function buildSseEvent(type, payload = {}) {
	return {
		type,
		timestamp: toIsoDate(),
		...payload,
	};
}

function buildAgentExecutionUpdate(task, agent, status, content) {
	return {
		agentId: agent.agentId,
		agentName: agent.agentName,
		taskId: task.id,
		taskLabel: task.label,
		status,
		content,
	};
}

function toTaskSummaryText(task) {
	if (!task.output) {
		return "No output generated.";
	}

	const cleanedText = task.output.trim();
	if (cleanedText.length <= 320) {
		return cleanedText;
	}

	return `${cleanedText.slice(0, 317)}...`;
}

function createSkillSection(skillContents) {
	return Array.isArray(skillContents) && skillContents.length > 0
		? skillContents
				.map((skill) => `### ${skill.name}\n${skill.content}`)
				.join("\n\n")
		: null;
}

function createTaskPrompt(run, task, dependencyOutputs, directivesForAgent, skillContents) {
	const skillSection = createSkillSection(skillContents);
	const dependencySection =
		dependencyOutputs.length > 0
			? dependencyOutputs
					.map((item) => `- ${item.taskId}: ${item.taskLabel}\n${item.output}`)
					.join("\n\n")
			: "- None";
	const directivesSection =
		directivesForAgent.length > 0
			? directivesForAgent.map((directive) => `- ${directive.message}`).join("\n")
			: "- None";

	// File placement instructions for generated apps
	const appSlug = run.appSlug;
	const filePlacementSection = appSlug
		? [
			"",
			"## File placement rules",
			`All source files you create for this app MUST be placed under app/apps/${appSlug}/.`,
			`The entry component must be at app/apps/${appSlug}/page.tsx.`,
			`Keep app-specific files contained to app/apps/${appSlug}/ so cleanup and previews work correctly.`,
			"You may import shared code from @/components/ui/, @/lib/, etc.",
			"",
		].join("\n")
		: null;

	return [
		`You are ${task.agentName}, an expert contributor in a multi-agent plan.`,
		`Plan: ${run.plan.title}`,
		run.plan.description ? `Plan description: ${run.plan.description}` : null,
		`Your task ID: ${task.id}`,
		`Your task: ${task.label}`,
		"",
		skillSection ? "## Equipped Skills\n" : null,
		skillSection,
		skillSection ? "" : null,
		filePlacementSection,
		"Dependency outputs:",
		dependencySection,
		"",
		"Latest directives for you:",
		directivesSection,
		"",
		"Produce concrete output that can be combined with other agents.",
		"Response requirements:",
		"- Use markdown with short headings.",
		"- Include assumptions and risks if relevant.",
		"- End with a concise deliverable summary.",
	]
		.filter((line) => line !== null)
		.join("\n");
}

function buildBatchOrchestrationPrompt(run, batchTasks, laneAssignments, skillContentsByAgentName) {
	const taskSections = batchTasks.map((task) => {
		const lane = laneAssignments.get(task.id);
		const laneAgentId = lane ? lane.agentId : task.agentId;
		const laneAgentName = lane ? lane.agentName : task.agentName;
		const dependencyOutputs = task.blockedBy
			.map((depId) => run.tasks.find((t) => t.id === depId))
			.filter((dep) => dep && dep.status === "done")
			.map((dep) => {
				const output = dep.output || "No output.";
				const truncated = output.length > 200 ? `${output.slice(0, 200)}...` : output;
				return `  - ${dep.id} (${dep.label}): ${truncated}`;
			})
			.join("\n");
		const directivesForAgent = run.directives
			.filter((d) => d.agentId === laneAgentId)
			.map((d) => `  - ${d.message}`)
			.join("\n");

		return [
			`### Task: ${task.id}`,
			`Label: ${task.label}`,
			`Assigned lane: ${laneAgentName} (${laneAgentId})`,
			dependencyOutputs ? `Dependency outputs:\n${dependencyOutputs}` : "Dependency outputs: None",
			directivesForAgent ? `Directives:\n${directivesForAgent}` : "Directives: None",
		].join("\n");
	});

	const appSlug = run.appSlug;
	const filePlacementSection = appSlug
		? [
			"",
			"## File placement rules",
			`All source files for this app MUST be placed under app/apps/${appSlug}/.`,
			`The entry component must be at app/apps/${appSlug}/page.tsx.`,
			`Keep app-specific files contained to app/apps/${appSlug}/ so cleanup and previews work correctly.`,
			"You may import shared code from @/components/ui/, @/lib/, etc.",
			"",
		].join("\n")
		: null;

	const skillsSectionLines = [];
	if (skillContentsByAgentName && skillContentsByAgentName.size > 0) {
		for (const [agentName, skillArray] of skillContentsByAgentName) {
			if (!Array.isArray(skillArray) || skillArray.length === 0) {
				continue;
			}
			const skillContent = skillArray.map((s) => `### ${s.name}\n${s.content}`).join("\n\n");
			skillsSectionLines.push(`## Skills for ${agentName}`, skillContent, "");
		}
	}
	const skillsSection = skillsSectionLines.length > 0 ? skillsSectionLines.join("\n") : null;

	return [
		"You are the orchestrator for a multi-agent plan execution.",
		`Plan: ${run.plan.title}`,
		run.plan.description ? `Plan description: ${run.plan.description}` : null,
		"",
		filePlacementSection,
		"## Batch tasks to execute in parallel",
		"",
		"Execute ALL of the following tasks concurrently using `invoke_subagents`.",
		"Each task should be handled by a separate subagent working in parallel.",
		"Name each subagent after its assigned lane (e.g. the lane agentId like lane-1, lane-2).",
		"",
		...taskSections,
		"",
		skillsSection ? "## Available Skills\n" : null,
		skillsSection,
		"## Instructions",
		"",
		"1. Use `invoke_subagents` to run ALL tasks above in parallel as separate subagents.",
		"2. Each subagent should produce practical markdown output for its assigned task.",
		"3. After all subagents complete, provide a structured completion summary with this format for EACH task:",
		"",
		"```",
		"TASK_RESULT task-id=<id> status=<done|failed>",
		"<output or error message>",
		"END_TASK_RESULT",
		"```",
		"",
		"4. Produce one TASK_RESULT block per task, in any order.",
		"5. If a subagent fails, report status=failed with the error.",
	]
		.filter((line) => line !== null)
		.join("\n");
}

function parseBatchResults(fullResponse, batchTaskIds) {
	const results = new Map();
	const taskResultPattern = /TASK_RESULT\s+task-id=(\S+)\s+status=(done|failed)\s*\n([\s\S]*?)END_TASK_RESULT/g;
	let match;

	while ((match = taskResultPattern.exec(fullResponse)) !== null) {
		const taskId = match[1];
		const status = match[2];
		const output = match[3].trim();
		if (batchTaskIds.has(taskId)) {
			results.set(taskId, { status, output });
		}
	}

	return results;
}

function createFallbackSummary(run, tasksForSummary, isFailedStatus) {
	const lines = [
		`# ${run.plan.title}`,
		run.plan.description ? `${run.plan.description}\n` : null,
		"## Executive summary",
		isFailedStatus
			? "Execution finished with partial completion due to failed or blocked tasks."
			: "Execution completed successfully across all planned tasks.",
		"",
		"## Task outcomes",
		...tasksForSummary.map(
			(task) =>
				`### ${task.id} · ${task.label} (${task.agentName})\nStatus: ${task.status}\n\n${task.output || task.error || "No output generated."}`
		),
	];

	return lines.filter(Boolean).join("\n\n");
}

function createGenuiSummaryPrompt(
	run,
	summaryContent,
	tasksForSummary,
	isFailedStatus,
	widgetBlueprint
) {
	const taskSections = tasksForSummary
		.map((task) => {
			return [
				`Task ${task.id} (${task.agentName})`,
				`Label: ${task.label}`,
				`Status: ${task.status}`,
				"Output:",
				task.output?.trim() || task.error || "No output generated.",
			].join("\n");
		})
		.join("\n\n---\n\n");

	return [
		`Create one focused interactive summary widget for the plan \"${run.plan.title}\".`,
		run.plan.description ? `Plan description: ${run.plan.description}` : null,
		isFailedStatus
			? "This run has partial completion due to failed or blocked tasks."
			: "This run completed successfully.",
		"",
		`Widget focus: ${widgetBlueprint.focus}`,
		"Design this as one primary interactive widget card that can stand alone in the preview.",
		"Produce exactly one interactive widget experience (not a full-page dashboard).",
		"The generated spec should be compact, focused, and directly useful for interaction.",
		"Do not use generic labels such as 'Interactive widget 1' in headings or labels.",
		"Author the spec so design controls can edit visual presentation only, never underlying data values.",
		"Use stable semantic element keys (for example: metricsGrid, statusChart, actionsTabs) instead of random IDs.",
		"For layout containers, include explicit visual props that can be tuned later (Grid columns/gap, Stack direction/gap, Tabs defaultValue).",
		"For chart elements, include explicit presentational props (chart type compatibility, color, height) separate from the data array.",
		"Keep data payloads intact and avoid requiring data mutation to adjust layout, appearance, or copy.",
		"Use the task outcomes and markdown summary below as source material.",
		"Output exactly one ```spec block with valid RFC 6902 JSON patch lines.",
		"",
		`Widget ID: ${widgetBlueprint.id}`,
		"",
		"Markdown summary:",
		summaryContent,
		"",
		"Task outputs:",
		taskSections,
	]
		.filter(Boolean)
		.join("\n");
}

function createAppendTasksPrompt(run, prompt, contextPrompt) {
	const taskContext = run.tasks
		.map((task) => `${task.id} | ${task.label} | status=${task.status}`)
		.join("\n");
	const availableAgents = Array.isArray(run.plan?.agents) && run.plan.agents.length > 0
		? run.plan.agents.join(", ")
		: "Generalist 1";

	return [
		"You are planning additional tasks for an in-progress multi-agent run.",
		"Return ONLY strict JSON. No markdown fences or commentary.",
		"",
		"JSON schema:",
		"{",
		'  "title": "optional string",',
		'  "description": "optional string",',
		'  "tasks": [',
		"    {",
		'      "id": "short-id",',
		'      "label": "task description",',
		'      "agent": "agent name",',
		'      "blockedBy": ["optional dependency id"]',
		"    }",
		"  ]",
		"}",
		"",
		"Rules:",
		"- Create 1-4 concrete tasks based on the user's new request.",
		"- blockedBy may reference existing task IDs or new task IDs from this response.",
		"- Use blockedBy ONLY for genuine data dependencies where one task requires another's output.",
		"- Tasks working on different aspects MUST have empty blockedBy arrays so they run in parallel.",
		"- Do NOT create linear chains unless each task truly requires the prior task's output.",
		"- If dependency certainty is low, leave blockedBy empty and favor parallel starts.",
		"- Minimize blockers so the scheduler can activate as many agents as possible.",
		"- Keep labels actionable and implementation-focused.",
		"- Prefer existing agents when possible.",
		`- Available agents: ${availableAgents}.`,
		"- Distribute tasks across available agents for parallel execution.",
		"",
		`Plan title: ${run.plan.title}`,
		run.plan.description ? `Plan description: ${run.plan.description}` : null,
		"",
		"Existing tasks:",
		taskContext || "- none",
		"",
		contextPrompt ? `Additional context: ${contextPrompt}` : null,
		`User request: ${prompt}`,
	]
		.filter(Boolean)
		.join("\n");
}
function createRunManager(options) {
	const {
		baseDir,
		buildSystemPrompt,
		configManager,
		appRegistry = null,
		logger = console,
		isRovoDevAvailable = async () => false,
	} = options;
	const persistenceMode = process.env.AGENTS_TEAM_PERSIST_MODE?.trim().toLowerCase() || "final-only";
	const persistIntermediateSnapshots = persistenceMode !== "final-only";
	const maxConcurrentAgents =
		getPositiveInteger(process.env.AGENTS_TEAM_MAX_CONCURRENT) ||
		DEFAULT_MAX_CONCURRENT_AGENTS;
	const runsById = new Map();
	const runRootsDir = path.join(baseDir, "make-runs");
	const aiGatewayProvider = createAIGatewayProvider({ logger });
	const fileSnapshotLock = createSnapshotLock();

	const ensureRunDirectories = async (runId) => {
		const paths = buildRunPaths(runRootsDir, runId);
		await fs.mkdir(paths.runDir, { recursive: true });
		await fs.mkdir(paths.agentsDir, { recursive: true });
		await fs.mkdir(paths.tasksDir, { recursive: true });
		return paths;
	};

	const writeJsonFile = async (filePath, payload) => {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
	};

	const writeTextFile = async (filePath, content) => {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, content, "utf8");
	};

	const updateRunTimestamp = (run) => {
		run.updatedAt = toIsoDate();
	};

	const persistRunSnapshot = async (run) => {
		const paths = await ensureRunDirectories(run.id);
		await writeJsonFile(paths.runFilePath, toSerializableRun(run));

		await Promise.all(
			run.agents.map((agent) => {
				const agentOutputs = run.tasks
					.filter((task) => task.agentId === agent.agentId && task.output)
					.map((task) => ({
						taskId: task.id,
						taskLabel: task.label,
						status: task.status,
						attempts: task.attempts,
						startedAt: task.startedAt,
						completedAt: task.completedAt,
						output: task.output,
					}));

				return writeJsonFile(path.join(paths.agentsDir, `${agent.agentId}.json`), {
					runId: run.id,
					agentId: agent.agentId,
					agentName: agent.agentName,
					updatedAt: run.updatedAt,
					outputs: agentOutputs,
				});
			})
		);

		await Promise.all(
			run.tasks.map((task) =>
				writeJsonFile(path.join(paths.tasksDir, `${task.id}.json`), {
					runId: run.id,
					task,
				})
			)
		);

		if (run.summary) {
			await writeJsonFile(paths.summaryJsonPath, run.summary);
			await writeTextFile(paths.summaryMarkdownPath, run.summary.content);
		}

		if (run.genuiSummary) {
			await writeJsonFile(paths.genuiSummaryJsonPath, run.genuiSummary);
		}
	};

	const persistIntermediateSnapshot = async (run) => {
		if (!persistIntermediateSnapshots) {
			return;
		}

		await persistRunSnapshot(run);
	};

	const broadcastEvent = (run, event) => {
		const eventPayload = `${JSON.stringify(event)}\n\n`;
		run.events.push(event);
		if (run.events.length > 200) {
			run.events = run.events.slice(-200);
		}

		for (const subscriber of run.subscribers) {
			try {
				subscriber.write(`data: ${eventPayload}`);
			} catch (error) {
				logger.warn?.("[AGENTS-RUN] Failed to emit SSE event", error);
				run.subscribers.delete(subscriber);
			}
		}
	};

	const emitRunStateEvent = (run, type, payload = {}) => {
		broadcastEvent(
			run,
			buildSseEvent(type, {
				run: toSerializableRun(run),
				...payload,
			})
		);
	};

	const emitAgentUpdateEvent = (run, update) => {
		broadcastEvent(
			run,
			buildSseEvent("agent.update", {
				runId: run.id,
				update,
			})
		);
	};

	const findConfiguredAgentByName = (agentName) => {
		if (!configManager || !agentName) {
			return null;
		}

		const configAgents = configManager.listAgents();
		return (
			configAgents.find(
				(agent) => agent.name.toLowerCase() === agentName.toLowerCase()
			) || null
		);
	};

	const resolveSkillContentsForAgentName = (agentName) => {
		const configuredAgent = findConfiguredAgentByName(agentName);
		if (
			!configuredAgent ||
			!Array.isArray(configuredAgent.equippedSkills) ||
			configuredAgent.equippedSkills.length === 0
		) {
			return [];
		}

		return configManager.resolveSkillContents(configuredAgent.equippedSkills);
	};

	const createSystemPrompt = (userName, customSystemPrompt) => {
		if (getNonEmptyString(customSystemPrompt)) {
			return customSystemPrompt;
		}

		if (buildSystemPrompt) {
			return buildSystemPrompt(userName, null, "ask");
		}

		return "You are a helpful AI assistant.";
	};

	const buildUserMessage = ({ prompt, conversationHistory, contextDescription }) => {
		let userMessage = prompt;
		if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
			const historyText = conversationHistory
				.map((message) => `${message.type === "user" ? "User" : "Assistant"}: ${message.content}`)
				.join("\n");
			userMessage = `Previous conversation context:\n${historyText}\n\nCurrent question: ${prompt}`;
		}

		if (contextDescription) {
			userMessage = `${contextDescription}\n\n${userMessage}`;
		}

		return userMessage;
	};

	const callAIGatewayForMarkdown = async ({
		prompt,
		conversationHistory,
		contextDescription,
		customSystemPrompt,
		userName,
		providerKind,
		onTextDelta,
	}) => {
		const systemPrompt = createSystemPrompt(userName, customSystemPrompt);
		const userMessage = buildUserMessage({
			prompt,
			conversationHistory,
			contextDescription,
		});
		const diagnostics = getAIGatewayDiagnostics(providerKind);

		try {
			const result =
				typeof onTextDelta === "function"
					? await aiGatewayProvider.streamText({
						system: systemPrompt,
						prompt: userMessage,
						maxOutputTokens: 2200,
						temperature: 0.4,
						onTextDelta,
					})
					: await aiGatewayProvider.generateText({
						system: systemPrompt,
						prompt: userMessage,
						maxOutputTokens: 2200,
						temperature: 0.4,
					});
			return result.trim();
		} catch (error) {
			logger.error?.("[AGENTS-RUN] AI Gateway markdown call failed", {
				error: error instanceof Error ? error.message : String(error),
				diagnostics,
			});
			const baseMessage = error instanceof Error ? error.message : String(error);
			throw new Error(`${baseMessage} ${formatAIGatewayDiagnostics(diagnostics)}`);
		}
	};

	const callRovoDevForMarkdown = async ({
		prompt,
		conversationHistory,
		contextDescription,
		customSystemPrompt,
		userName,
		conflictPolicy,
		timeoutMs,
		cancelOnComplete,
		onTextDelta,
	}) => {
		const systemPrompt = createSystemPrompt(userName, customSystemPrompt);
		const userMessage = buildUserMessage({
			prompt,
			conversationHistory,
			contextDescription,
		});

		const resolvedTimeoutMs =
			typeof timeoutMs === "number" && timeoutMs > 0
				? timeoutMs
				: conflictPolicy === "wait-for-turn"
					? WAIT_FOR_TURN_TIMEOUT_MS
					: undefined;

		try {
			if (typeof onTextDelta === "function") {
				let fullResponse = "";
				let fullMessage = "";
				if (systemPrompt) {
					fullMessage += `[System Instructions]\n${systemPrompt}\n[End System Instructions]\n\n`;
				}
				fullMessage += userMessage;

				await streamViaRovoDev({
					message: fullMessage,
					onTextDelta: (textDelta) => {
						if (!textDelta) {
							return;
						}

						fullResponse += textDelta;
						onTextDelta(textDelta);
					},
					conflictPolicy,
					timeoutMs: resolvedTimeoutMs,
					cancelOnComplete: Boolean(cancelOnComplete),
					failOnError: true,
				});

				return fullResponse.trim();
			}

			const result = await generateTextViaRovoDev({
				system: systemPrompt,
				prompt: userMessage,
				conflictPolicy,
				timeoutMs: resolvedTimeoutMs,
			});
			return result.trim();
		} catch (err) {
			// For Make execution, a 409 (chat in progress) or port-stuck error means
			// overlapping top-level streams — a bug in the orchestration, not a
			// transient pool issue. Convert to a non-retryable hard failure.
			if (
				(err && err.code === "ROVODEV_PORT_STUCK") ||
				isChatInProgressError(err)
			) {
				throw createMakeExecutionConflictError(err);
			}
			throw err;
		}
	};

	const callModelForMarkdown = async ({ provider, onTextDelta, cancelOnComplete, ...rest }) => {
		if (provider === "rovodev") {
			return callRovoDevForMarkdown({
				...rest,
				cancelOnComplete,
				onTextDelta,
			});
		}

		return callAIGatewayForMarkdown({
			...rest,
			providerKind: provider,
			onTextDelta,
		});
	};

	const getDependencyOutputs = (run, task) => {
		return task.blockedBy
			.map((dependencyId) => run.tasks.find((item) => item.id === dependencyId))
			.filter((dependencyTask) => dependencyTask && dependencyTask.status === "done")
			.map((dependencyTask) => ({
				taskId: dependencyTask.id,
				taskLabel: dependencyTask.label,
				output: dependencyTask.output || "No output generated.",
			}));
	};

	const getAgentByTask = (run, task) => {
		return run.agents.find((agent) => agent.agentId === task.agentId) || null;
	};

	const isAgentBusy = (run, agentId) =>
		run.tasks.some((task) => task.agentId === agentId && task.status === "in-progress");

	const getAvailableAgentForTask = (run, task) => {
		const preferredAgent = run.agents.find(
			(agent) =>
				agent.agentId === task.agentId &&
				agent.status !== "failed" &&
				!isAgentBusy(run, agent.agentId)
		);
		if (preferredAgent) {
			return preferredAgent;
		}

		return (
			run.agents.find(
				(agent) => agent.status !== "failed" && !isAgentBusy(run, agent.agentId)
			) || null
		);
	};

	const markBlockedTasksWithFailedDependencies = (run) => {
		let changed = false;

		for (const task of run.tasks) {
			if (task.status !== "todo") {
				continue;
			}

			const failedDependency = task.blockedBy.find((dependencyId) => {
				const dependencyTask = run.tasks.find((item) => item.id === dependencyId);
				return dependencyTask && FAILURE_TASK_STATUSES.has(dependencyTask.status);
			});
			if (!failedDependency) {
				continue;
			}

			task.status = "blocked-failed";
			task.completedAt = toIsoDate();
			task.error = `Blocked by failed dependency: ${failedDependency}`;
			changed = true;
			updateRunTimestamp(run);
			emitRunStateEvent(run, "task.blocked", { taskId: task.id });
		}

		return changed;
	};

	const ensureAgentRecord = (run, task) => {
		const existing = run.agents.find((agent) => agent.agentId === task.agentId);
		if (existing) {
			return existing;
		}

		const now = toIsoDate();
		const agent = {
			agentId: task.agentId,
			agentName: task.agentName,
			status: "idle",
			currentTaskId: null,
			currentTaskLabel: null,
			latestContent: "",
			updatedAt: now,
		};
		run.agents.push(agent);
		return agent;
	};

	const runTask = async (run, task, claimedAgent) => {
		const agent = claimedAgent || getAgentByTask(run, task) || ensureAgentRecord(run, task);
		if (!agent) {
			throw new Error(`Agent not found for task ${task.id}`);
		}

		task.agentId = agent.agentId;
		task.agentName = agent.agentName;
		task.status = "in-progress";
		task.startedAt = toIsoDate();
		task.completedAt = null;
		task.error = null;
		task.attempts += 1;
		agent.status = "working";
		agent.currentTaskId = task.id;
		agent.currentTaskLabel = task.label;
		agent.latestContent = "";
		agent.updatedAt = toIsoDate();
		updateRunTimestamp(run);

		const claimedUpdate = buildAgentExecutionUpdate(
			task,
			agent,
			"working",
			`Claimed task ${task.id}: ${task.label}`
		);
		emitRunStateEvent(run, "task.claimed", {
			taskId: task.id,
			update: claimedUpdate,
		});
		await persistIntermediateSnapshot(run);

		const dependencyOutputs = getDependencyOutputs(run, task);
		const directivesForAgent = run.directives.filter(
			(directive) => directive.agentId === agent.agentId
		);
		const skillContents = resolveSkillContentsForAgentName(agent.agentName);
		const taskPrompt = createTaskPrompt(
			run,
			task,
			dependencyOutputs,
			directivesForAgent,
			skillContents
		);
		const taskSystemPrompt =
			"You are an expert execution agent. Produce practical markdown output for the assigned task.";
		// Route through RovoDev when pool is available, fall back to AI Gateway
		let rovodevReady = false;
		try {
			rovodevReady = await isRovoDevAvailable();
		} catch {
			// Ignore availability check errors — fall back to AI Gateway
		}
		const provider = rovodevReady ? "rovodev" : "ai-gateway";

			// Snapshot untracked files before task execution for file tracking
			let beforeSnapshot = null;
			try {
				const releaseLock = await fileSnapshotLock.acquire();
				try {
					beforeSnapshot = await snapshotUntrackedFiles();
				} finally {
					releaseLock();
				}
			} catch (snapshotError) {
				logger.warn(`[make-file-tracker] Pre-task snapshot failed for task ${task.id}: ${snapshotError.message}`);
			}

			let output = "";
			let pendingStreamChunk = "";
			let pendingFlushTimeoutId = null;
			const appendAgentLatestContent = (chunk) => {
				if (!chunk) {
					return;
				}

			agent.latestContent = `${agent.latestContent}${chunk}`;
			if (agent.latestContent.length > STREAMING_UPDATE_MAX_CONTENT_CHARS) {
				agent.latestContent = agent.latestContent.slice(
					-STREAMING_UPDATE_MAX_CONTENT_CHARS
				);
			}
				agent.updatedAt = toIsoDate();
			};
			const flushWorkingUpdate = () => {
				if (pendingFlushTimeoutId !== null) {
					clearTimeout(pendingFlushTimeoutId);
					pendingFlushTimeoutId = null;
				}
				if (!pendingStreamChunk) {
					return;
				}

			const updateContent = pendingStreamChunk;
			pendingStreamChunk = "";
			appendAgentLatestContent(updateContent);
			emitAgentUpdateEvent(
				run,
					buildAgentExecutionUpdate(task, agent, "working", updateContent)
				);
			};
			const scheduleWorkingUpdateFlush = () => {
				if (pendingFlushTimeoutId !== null) {
					return;
				}

				pendingFlushTimeoutId = setTimeout(() => {
					pendingFlushTimeoutId = null;
					flushWorkingUpdate();
				}, STREAMING_UPDATE_FLUSH_MS);
			};
			const clearPendingWorkingUpdateFlush = () => {
				if (pendingFlushTimeoutId === null) {
					return;
				}

				clearTimeout(pendingFlushTimeoutId);
				pendingFlushTimeoutId = null;
			};
			try {
				output = await callModelForMarkdown({
				provider,
				prompt: taskPrompt,
				conversationHistory: run.conversationContext,
				contextDescription: `Plan title: ${run.plan.title}`,
				customSystemPrompt: taskSystemPrompt,
				userName: agent.agentName,
				conflictPolicy: "wait-for-turn",
				cancelOnComplete: true,
				onTextDelta: (textDelta) => {
					if (!textDelta) {
						return;
					}

					pendingStreamChunk += textDelta;
						if (
							pendingStreamChunk.length >= STREAMING_UPDATE_CHUNK_SIZE ||
							pendingStreamChunk.includes("\n\n")
						) {
							flushWorkingUpdate();
							return;
						}
						scheduleWorkingUpdateFlush();
					},
				});
				flushWorkingUpdate();

			task.status = "done";
			task.completedAt = toIsoDate();
			task.output = output;
			task.outputSummary = toTaskSummaryText(task);
			agent.latestContent = task.outputSummary;
			if (!isAgentBusy(run, agent.agentId)) {
				agent.status = "idle";
				agent.currentTaskId = null;
				agent.currentTaskLabel = null;
			}
			agent.updatedAt = toIsoDate();
			updateRunTimestamp(run);

			emitRunStateEvent(run, "task.completed", {
				taskId: task.id,
				update: buildAgentExecutionUpdate(task, agent, "completed", task.outputSummary),
			});
			await persistIntermediateSnapshot(run);
		} catch (error) {
			flushWorkingUpdate();
			task.status = "failed";
			task.completedAt = toIsoDate();
			task.error = error instanceof Error ? error.message : String(error);
			agent.latestContent = task.error;
			if (!isAgentBusy(run, agent.agentId)) {
				agent.status = "idle";
				agent.currentTaskId = null;
				agent.currentTaskLabel = null;
			}
			agent.updatedAt = toIsoDate();
			updateRunTimestamp(run);

			emitRunStateEvent(run, "task.failed", {
				taskId: task.id,
				error: task.error,
				update: buildAgentExecutionUpdate(task, agent, "failed", task.error),
				});
				await persistIntermediateSnapshot(run);
				throw error;
			} finally {
				clearPendingWorkingUpdateFlush();

				// Snapshot untracked files after task execution and persist delta
				if (beforeSnapshot) {
					try {
						const releaseLock = await fileSnapshotLock.acquire();
						let afterSnapshot;
						try {
							afterSnapshot = await snapshotUntrackedFiles();
						} finally {
							releaseLock();
						}
						const newFiles = computeCreatedFiles(beforeSnapshot, afterSnapshot);
						if (newFiles.length > 0) {
							const existing = new Set(run.createdFiles || []);
							for (const file of newFiles) {
								existing.add(file);
							}
							run.createdFiles = Array.from(existing);
							const paths = buildRunPaths(runRootsDir, run.id);
							await writeCreatedFilesToDisk(paths.runDir, run.createdFiles);
						}
					} catch (snapshotError) {
						logger.warn(`[make-file-tracker] Post-task snapshot failed for task ${task.id}: ${snapshotError.message}`);
					}
				}
			}
		};

	const executeTaskWithRetry = async (run, task, claimedAgent) => {
		const maxAttempts = 2;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				await runTask(run, task, claimedAgent);
				return;
			} catch (err) {
				// Make execution conflicts are non-retryable — overlapping
				// top-level streams indicate a bug, not a transient failure.
				if (isMakeExecutionConflict(err)) {
					return;
				}
				if (attempt >= maxAttempts) {
					return;
				}

				await delay(600 * attempt);
				task.status = "todo";
				task.error = null;
				task.output = null;
				task.outputSummary = null;
				const agent = getAgentByTask(run, task);
				if (agent) {
					agent.status = "idle";
					agent.updatedAt = toIsoDate();
				}
				updateRunTimestamp(run);
				emitRunStateEvent(run, "task.retrying", {
					taskId: task.id,
					attempt: attempt + 1,
				});
			}
		}
	};

	const synthesizeGenuiWidget = async (
		run,
		summaryContent,
		tasksForSummary,
		isFailedStatus,
		widgetBlueprint,
		genuiSystemPrompt
	) => {
		const prompt = createGenuiSummaryPrompt(
			run,
			summaryContent,
			tasksForSummary,
			isFailedStatus,
			widgetBlueprint
		);
		const createdAt = toIsoDate();

		try {
			const rawText = await callModelForMarkdown({
				provider: "rovodev",
				prompt,
				conversationHistory: [],
				contextDescription: `Interactive summary widget ${widgetBlueprint.id} for run ${run.id}`,
				customSystemPrompt: genuiSystemPrompt,
				userName: "GenUI Presenter",
				conflictPolicy: "wait-for-turn",
			});

			const analysis = analyzeGeneratedText(rawText);
			const bestSpec = pickBestSpec(analysis);
			if (!bestSpec) {
				logger.warn?.(
					"[AGENTS-RUN] GenUI widget spec was not renderable; using fallback.",
					{
						runId: run.id,
						widgetId: widgetBlueprint.id,
					}
				);
				return {
					id: widgetBlueprint.id,
					title: widgetBlueprint.title,
					spec: createEmptyGenuiSpec(),
					status: "failed",
					createdAt,
					error: "Generated spec was not renderable.",
				};
			}

			return {
				id: widgetBlueprint.id,
				title: widgetBlueprint.title,
				spec: bestSpec,
				status: "ready",
				createdAt,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to generate interactive widget.";
			logger.warn?.("[AGENTS-RUN] GenUI widget synthesis failed", error);
			return {
				id: widgetBlueprint.id,
				title: widgetBlueprint.title,
				spec: createEmptyGenuiSpec(),
				status: "failed",
				createdAt,
				error: errorMessage,
			};
		}
	};

	const synthesizeGenuiSummary = async (run, summaryContent, tasksForSummary, isFailedStatus) => {
		const genuiSystemPrompt = getGenuiSummarySystemPrompt();
		const primaryWidgetBlueprint = GENUI_WIDGET_BLUEPRINTS[0];
		const primaryWidget = await synthesizeGenuiWidget(
			run,
			summaryContent,
			tasksForSummary,
			isFailedStatus,
			primaryWidgetBlueprint,
			genuiSystemPrompt
		);
		const widgets = [primaryWidget];
		const readyWidgets = widgets.filter(
			(widget) => widget.status === "ready" && hasRenderableGenuiSpec(widget.spec)
		);
		const status = readyWidgets.length > 0 ? "ready" : "failed";
		const summaryError =
			status === "failed"
				? widgets
						.map((widget) => widget.error)
						.filter((error) => typeof error === "string" && error.trim())
						.join(" | ") || "Failed to generate interactive summary widgets."
				: undefined;

		return {
			widgets,
			spec:
				readyWidgets[0]?.spec ||
				(hasRenderableGenuiSpec(widgets[0]?.spec)
					? widgets[0].spec
					: createEmptyGenuiSpec()),
			partial: isFailedStatus,
			createdAt: toIsoDate(),
			status,
			error: summaryError,
		};
	};

	const writeIterationSummaryFiles = async ({
		run,
		iteration,
		summary,
		genuiSummary,
	}) => {
		const paths = await ensureRunDirectories(run.id);
		const summaryMarkdownFileName = `summary.iteration-${iteration}.md`;
		const summaryJsonFileName = `summary.iteration-${iteration}.json`;
		const genuiJsonFileName = `genui-summary.iteration-${iteration}.json`;

		const summaryMarkdownPath = path.join(paths.runDir, summaryMarkdownFileName);
		const summaryJsonPath = path.join(paths.runDir, summaryJsonFileName);
		await writeTextFile(summaryMarkdownPath, summary.content);
		await writeJsonFile(summaryJsonPath, { ...summary, iteration });
		await writeTextFile(paths.summaryMarkdownPath, summary.content);
		await writeJsonFile(paths.summaryJsonPath, summary);

		const genuiJsonPath = path.join(paths.runDir, genuiJsonFileName);
		await writeJsonFile(genuiJsonPath, { ...genuiSummary, iteration });
		await writeJsonFile(paths.genuiSummaryJsonPath, genuiSummary);
	};

	const synthesizeRunSummary = async (run, iteration, isFailedStatus) => {
		const tasksForSummary = run.tasks.filter(
			(task) => (getPositiveInteger(task.iteration) || 1) <= iteration
		);
		const summaryContent = createFallbackSummary(run, tasksForSummary, isFailedStatus);

		const summary = {
			content: summaryContent,
			partial: isFailedStatus,
			createdAt: toIsoDate(),
		};
		const genuiSummary = await synthesizeGenuiSummary(
			run,
			summaryContent,
			tasksForSummary,
			isFailedStatus
		);

		run.summary = summary;
		run.genuiSummary = genuiSummary;
		updateRunTimestamp(run);

		try {
			await writeIterationSummaryFiles({
				run,
				iteration,
				summary,
				genuiSummary,
			});
			await persistRunSnapshot(run);
		} catch (error) {
			logger.error?.("[AGENTS-RUN] Failed to persist run summary snapshot", error);
		}

		emitRunStateEvent(run, "run.summary-ready", {});
	};

	const hasPendingTasks = (run) =>
		run.tasks.some((task) => !TERMINAL_TASK_STATUSES.has(task.status));

	const finalizeRun = async (run) => {
		const currentIteration = run.iteration || 1;
		const currentIterationTasks = run.tasks.filter(
			(task) => (getPositiveInteger(task.iteration) || 1) === currentIteration
		);
		const scopedTasks = currentIterationTasks.length > 0 ? currentIterationTasks : run.tasks;
		const failedTasks = scopedTasks.filter((task) => FAILURE_TASK_STATUSES.has(task.status));
		const failed = failedTasks.length > 0;
		run.activeBatchId = null;
		updateRunTimestamp(run);

		try {
			await synthesizeRunSummary(run, currentIteration, failed);
		} catch (error) {
			logger.error?.("[AGENTS-RUN] Failed to generate run summary", error);
		}

		run.status = failed ? RUN_STATUS_FAILED : RUN_STATUS_COMPLETED;
		run.completedAt = toIsoDate();
		updateRunTimestamp(run);

		if (failed) {
			emitRunStateEvent(run, "run.failed", {
				error: "One or more tasks failed.",
			});
		} else {
			emitRunStateEvent(run, "run.completed", {});
		}

		try {
			await persistRunSnapshot(run);
		} catch (error) {
			logger.error?.("[AGENTS-RUN] Failed to persist finalized run snapshot", error);
		}

	};

	const scheduleRun = async (run) => {
		const effectiveConcurrency = Math.min(run.agentCount || 1, maxConcurrentAgents);

		const getReadyTasks = () => {
			markBlockedTasksWithFailedDependencies(run);
			const ready = [];

			for (const task of run.tasks) {
				if (ready.length >= effectiveConcurrency) {
					break;
				}

				if (task.status !== "todo") {
					continue;
				}

				const dependenciesResolved = task.blockedBy.every((dependencyId) => {
					const dependencyTask = run.tasks.find((item) => item.id === dependencyId);
					if (!dependencyTask) {
						return true;
					}
					return dependencyTask.status === "done";
				});
				if (!dependenciesResolved) {
					continue;
				}

				ready.push(task);
			}

			return ready;
		};

		const executeBatch = async (batchTasks) => {
			// Build lane assignments for this batch
			const laneAssignments = new Map();
			for (const task of batchTasks) {
				const agent = getAgentByTask(run, task) || ensureAgentRecord(run, task);
				if (agent) {
					laneAssignments.set(task.id, agent);
				}
			}

			// Claim all tasks in the batch and emit task.claimed events
			for (const task of batchTasks) {
				const agent = laneAssignments.get(task.id);
				if (!agent) {
					continue;
				}

				task.status = "in-progress";
				task.startedAt = toIsoDate();
				task.completedAt = null;
				task.error = null;
				task.attempts += 1;
				agent.status = "working";
				agent.currentTaskId = task.id;
				agent.currentTaskLabel = task.label;
				agent.latestContent = "";
				agent.updatedAt = toIsoDate();
				updateRunTimestamp(run);

				const claimedUpdate = buildAgentExecutionUpdate(
					task,
					agent,
					"working",
					`Claimed task ${task.id}: ${task.label}`
				);
				emitRunStateEvent(run, "task.claimed", {
					taskId: task.id,
					update: claimedUpdate,
				});
			}
			await persistIntermediateSnapshot(run);

			// Snapshot files before batch execution
			let beforeSnapshot = null;
			try {
				const releaseLock = await fileSnapshotLock.acquire();
				try {
					beforeSnapshot = await snapshotUntrackedFiles();
				} finally {
					releaseLock();
				}
			} catch (snapshotError) {
				logger.warn(`[make-file-tracker] Pre-batch snapshot failed: ${snapshotError.message}`);
			}

			// Build the orchestration prompt
			const skillContentsByAgentName = new Map();
			for (const task of batchTasks) {
				const agent = laneAssignments.get(task.id);
				const agentName = agent ? agent.agentName : task.agentName;
				if (!skillContentsByAgentName.has(agentName)) {
					skillContentsByAgentName.set(agentName, resolveSkillContentsForAgentName(agentName));
				}
			}
			const orchestrationPrompt = buildBatchOrchestrationPrompt(run, batchTasks, laneAssignments, skillContentsByAgentName);
			const systemPrompt = "You are an expert orchestration agent. Coordinate parallel subagent execution for the assigned tasks.";

			// Map subagentName → lane agentId for streaming updates
			// The orchestration prompt tells the parent to name subagents after lane agentIds
			const agentIdToTask = new Map();
			for (const task of batchTasks) {
				const agent = laneAssignments.get(task.id);
				if (agent) {
					agentIdToTask.set(agent.agentId, task);
				}
			}

			// Accumulate subagent output per lane for streaming updates
			const subagentOutputByLane = new Map();
			const subagentFlushTimers = new Map();

			const flushSubagentUpdate = (laneAgentId) => {
				const timerId = subagentFlushTimers.get(laneAgentId);
				if (timerId !== null && timerId !== undefined) {
					clearTimeout(timerId);
					subagentFlushTimers.delete(laneAgentId);
				}
				const pendingChunk = subagentOutputByLane.get(laneAgentId);
				if (!pendingChunk) {
					return;
				}

				const task = agentIdToTask.get(laneAgentId);
				const agent = task ? laneAssignments.get(task.id) : null;
				if (task && agent) {
					agent.latestContent = `${agent.latestContent}${pendingChunk}`;
					if (agent.latestContent.length > STREAMING_UPDATE_MAX_CONTENT_CHARS) {
						agent.latestContent = agent.latestContent.slice(-STREAMING_UPDATE_MAX_CONTENT_CHARS);
					}
					agent.updatedAt = toIsoDate();
					emitAgentUpdateEvent(
						run,
						buildAgentExecutionUpdate(task, agent, "working", pendingChunk)
					);
				}
				subagentOutputByLane.set(laneAgentId, "");
			};

			const scheduleSubagentFlush = (laneAgentId) => {
				if (subagentFlushTimers.has(laneAgentId)) {
					return;
				}
				const timerId = setTimeout(() => {
					subagentFlushTimers.delete(laneAgentId);
					flushSubagentUpdate(laneAgentId);
				}, STREAMING_UPDATE_FLUSH_MS);
				subagentFlushTimers.set(laneAgentId, timerId);
			};

			// Route through RovoDev when available, fall back to per-task execution
			let rovodevReady = false;
			try {
				rovodevReady = await isRovoDevAvailable();
			} catch {
				// Fall back to AI Gateway
			}

			let fullResponse = "";
			const batchTaskIds = new Set(batchTasks.map((t) => t.id));

			if (rovodevReady) {
				// Single RovoDev stream with subagent events
				let fullMessage = "";
				fullMessage += `[System Instructions]\n${systemPrompt}\n[End System Instructions]\n\n`;
				fullMessage += orchestrationPrompt;

				try {
					await streamViaRovoDev({
						message: fullMessage,
						onTextDelta: (textDelta) => {
							if (textDelta) {
								fullResponse += textDelta;
							}
						},
						onSubagentTextDelta: (textDelta, metadata) => {
							if (!textDelta || !metadata.subagentName) {
								return;
							}

							// Map subagentName to a lane — try exact match first, then partial
							let matchedLaneId = null;
							for (const [agentId] of agentIdToTask) {
								if (metadata.subagentName === agentId ||
									metadata.subagentName.includes(agentId) ||
									agentId.includes(metadata.subagentName)) {
									matchedLaneId = agentId;
									break;
								}
							}

							if (matchedLaneId) {
								const existing = subagentOutputByLane.get(matchedLaneId) || "";
								subagentOutputByLane.set(matchedLaneId, existing + textDelta);
								const pending = subagentOutputByLane.get(matchedLaneId);
								if (pending.length >= STREAMING_UPDATE_CHUNK_SIZE || pending.includes("\n\n")) {
									flushSubagentUpdate(matchedLaneId);
								} else {
									scheduleSubagentFlush(matchedLaneId);
								}
							}

							fullResponse += textDelta;
						},
						includeSubagentEvents: true,
						conflictPolicy: "wait-for-turn",
						timeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
						cancelOnComplete: true,
						failOnError: true,
					});
				} catch (error) {
					// Flush remaining subagent updates
					for (const laneId of subagentFlushTimers.keys()) {
						flushSubagentUpdate(laneId);
					}

					// A 409 or port-stuck error during Make orchestration means
					// overlapping top-level execution — a bug, not a transient issue.
					// Surface a clear Make-specific error instead of generic port messages.
					const isConflict =
						(error && error.code === "ROVODEV_PORT_STUCK") ||
						isChatInProgressError(error);
					const conflictError = isConflict
						? createMakeExecutionConflictError(error)
						: error;
					const errorMessage = conflictError instanceof Error
						? conflictError.message
						: String(conflictError);

					// On orchestration failure, fail all batch tasks cleanly
					for (const task of batchTasks) {
						if (task.status !== "in-progress") {
							continue;
						}
						task.status = "failed";
						task.completedAt = toIsoDate();
						task.error = `Orchestration failed: ${errorMessage}`;
						const agent = laneAssignments.get(task.id);
						if (agent) {
							agent.latestContent = task.error;
							agent.status = "idle";
							agent.currentTaskId = null;
							agent.currentTaskLabel = null;
							agent.updatedAt = toIsoDate();
						}
						updateRunTimestamp(run);
						emitRunStateEvent(run, "task.failed", {
							taskId: task.id,
							error: task.error,
							update: agent
								? buildAgentExecutionUpdate(task, agent, "failed", task.error)
								: null,
						});
					}
					await persistIntermediateSnapshot(run);
					return;
				}
			} else {
				// Fallback: execute tasks sequentially via AI Gateway
				for (const task of batchTasks) {
					const agent = laneAssignments.get(task.id);
					try {
						const dependencyOutputs = getDependencyOutputs(run, task);
						const directivesForAgent = run.directives.filter(
							(d) => d.agentId === (agent ? agent.agentId : task.agentId)
						);
						const skillContents = resolveSkillContentsForAgentName(
							agent ? agent.agentName : task.agentName
						);
						const taskPrompt = createTaskPrompt(run, task, dependencyOutputs, directivesForAgent, skillContents);
						const output = await callModelForMarkdown({
							provider: "ai-gateway",
							prompt: taskPrompt,
							conversationHistory: run.conversationContext,
							contextDescription: `Plan title: ${run.plan.title}`,
							customSystemPrompt: "You are an expert execution agent. Produce practical markdown output for the assigned task.",
							userName: agent ? agent.agentName : task.agentName,
							conflictPolicy: "wait-for-turn",
						});
						task.status = "done";
						task.completedAt = toIsoDate();
						task.output = output;
						task.outputSummary = toTaskSummaryText(task);
						if (agent) {
							agent.latestContent = task.outputSummary;
							agent.status = "idle";
							agent.currentTaskId = null;
							agent.currentTaskLabel = null;
							agent.updatedAt = toIsoDate();
						}
						updateRunTimestamp(run);
						emitRunStateEvent(run, "task.completed", {
							taskId: task.id,
							update: agent
								? buildAgentExecutionUpdate(task, agent, "completed", task.outputSummary)
								: null,
						});
					} catch (error) {
						task.status = "failed";
						task.completedAt = toIsoDate();
						task.error = error instanceof Error ? error.message : String(error);
						if (agent) {
							agent.latestContent = task.error;
							agent.status = "idle";
							agent.currentTaskId = null;
							agent.currentTaskLabel = null;
							agent.updatedAt = toIsoDate();
						}
						updateRunTimestamp(run);
						emitRunStateEvent(run, "task.failed", {
							taskId: task.id,
							error: task.error,
							update: agent
								? buildAgentExecutionUpdate(task, agent, "failed", task.error)
								: null,
						});
					}
				}
				await persistIntermediateSnapshot(run);
				return;
			}

			// Flush remaining subagent streaming updates
			for (const laneId of subagentFlushTimers.keys()) {
				flushSubagentUpdate(laneId);
			}

			// Parse structured results from the parent orchestrator response
			const batchResults = parseBatchResults(fullResponse, batchTaskIds);

			// Update task state from parsed results + accumulated subagent output
			for (const task of batchTasks) {
				if (task.status !== "in-progress") {
					continue; // Already handled (e.g. by error path)
				}

				const agent = laneAssignments.get(task.id);
				const structuredResult = batchResults.get(task.id);
				const subagentOutput = agent
					? (agent.latestContent || "").trim()
					: "";

				if (structuredResult) {
					if (structuredResult.status === "done") {
						task.status = "done";
						task.completedAt = toIsoDate();
						task.output = structuredResult.output || subagentOutput || "Task completed.";
						task.outputSummary = toTaskSummaryText(task);
					} else {
						task.status = "failed";
						task.completedAt = toIsoDate();
						task.error = structuredResult.output || "Task failed during execution.";
					}
				} else if (subagentOutput) {
					// No structured result but got subagent streaming output — treat as success
					task.status = "done";
					task.completedAt = toIsoDate();
					task.output = subagentOutput;
					task.outputSummary = toTaskSummaryText(task);
				} else {
					// No result at all — mark as failed
					task.status = "failed";
					task.completedAt = toIsoDate();
					task.error = "No output received from orchestrator for this task.";
				}

				if (agent) {
					agent.latestContent = task.outputSummary || task.error || "";
					agent.status = "idle";
					agent.currentTaskId = null;
					agent.currentTaskLabel = null;
					agent.updatedAt = toIsoDate();
				}
				updateRunTimestamp(run);

				const eventType = task.status === "done" ? "task.completed" : "task.failed";
				const updateStatus = task.status === "done" ? "completed" : "failed";
				const updateContent = task.status === "done" ? task.outputSummary : task.error;
				emitRunStateEvent(run, eventType, {
					taskId: task.id,
					...(task.status === "failed" ? { error: task.error } : {}),
					update: agent
						? buildAgentExecutionUpdate(task, agent, updateStatus, updateContent)
						: null,
				});
			}

			await persistIntermediateSnapshot(run);

			// Snapshot files after batch execution
			if (beforeSnapshot) {
				try {
					const releaseLock = await fileSnapshotLock.acquire();
					let afterSnapshot;
					try {
						afterSnapshot = await snapshotUntrackedFiles();
					} finally {
						releaseLock();
					}
					const newFiles = computeCreatedFiles(beforeSnapshot, afterSnapshot);
					if (newFiles.length > 0) {
						const existing = new Set(run.createdFiles || []);
						for (const file of newFiles) {
							existing.add(file);
						}
						run.createdFiles = Array.from(existing);
						const paths = buildRunPaths(runRootsDir, run.id);
						await writeCreatedFilesToDisk(paths.runDir, run.createdFiles);
					}
				} catch (snapshotError) {
					logger.warn(`[make-file-tracker] Post-batch snapshot failed: ${snapshotError.message}`);
				}
			}
		};

		// Main batch-and-wait loop
		while (true) {
			const readyTasks = getReadyTasks();

			if (readyTasks.length === 0) {
				// Check if there are non-terminal tasks stuck
				const remainingTask = run.tasks.find(
					(task) => !TERMINAL_TASK_STATUSES.has(task.status)
				);
				if (!remainingTask) {
					break;
				}

				const anyBlockedChanged = markBlockedTasksWithFailedDependencies(run);
				if (!anyBlockedChanged) {
					remainingTask.status = "blocked-failed";
					remainingTask.error =
						"Task could not be scheduled due to unresolved dependencies.";
					remainingTask.completedAt = toIsoDate();
					updateRunTimestamp(run);
					emitRunStateEvent(run, "task.blocked", { taskId: remainingTask.id });
				}
				continue;
			}

			await executeBatch(readyTasks);
		}

		await finalizeRun(run);
	};

	const ensureScheduler = (run) => {
		if (run.schedulerPromise) {
			return;
		}

		run.schedulerPromise = scheduleRun(run)
			.catch(async (error) => {
				logger.error?.("[AGENTS-RUN] Run scheduler crashed", error);
				run.status = RUN_STATUS_FAILED;
				run.error = error instanceof Error ? error.message : String(error);
				run.completedAt = toIsoDate();
				run.activeBatchId = null;
				updateRunTimestamp(run);
				await persistRunSnapshot(run);
				emitRunStateEvent(run, "run.failed", { error: run.error });
			})
			.finally(() => {
				run.schedulerPromise = null;
				if (hasPendingTasks(run)) {
					ensureScheduler(run);
				}
			});
	};

	const loadRunFromDisk = async (runId) => {
		const paths = buildRunPaths(runRootsDir, runId);
		try {
			const rawRun = await fs.readFile(paths.runFilePath, "utf8");
			const parsedRun = safeJsonParse(rawRun);
			if (!parsedRun || typeof parsedRun !== "object") {
				return null;
			}

			const normalizedRun = ensureRunDefaults(parsedRun);
			if (!normalizedRun) {
				return null;
			}

			return normalizedRun;
		} catch {
			return null;
		}
	};

	const ensureLiveRun = async (runId) => {
		const activeRun = runsById.get(runId);
		if (activeRun) {
			return activeRun;
		}

		const diskRun = await loadRunFromDisk(runId);
		if (!diskRun) {
			return null;
		}

		diskRun.events = [];
		diskRun.subscribers = new Set();
		diskRun.schedulerPromise = null;

		// Restore created files from the dedicated file if not already in run.json
		if (!diskRun.createdFiles || diskRun.createdFiles.length === 0) {
			const paths = buildRunPaths(runRootsDir, runId);
			diskRun.createdFiles = await readCreatedFilesFromDisk(paths.runDir);
		}

		runsById.set(runId, diskRun);
		return diskRun;
	};

	const readRunSummaryArtifacts = async (runId, diskRun) => {
		const paths = buildRunPaths(runRootsDir, runId);
		const [rawSummary, rawGenuiSummary] = await Promise.all([
			fs.readFile(paths.summaryJsonPath, "utf8").catch(() => null),
			fs.readFile(paths.genuiSummaryJsonPath, "utf8").catch(() => null),
		]);
		const parsedSummary = typeof rawSummary === "string" ? safeJsonParse(rawSummary) : null;
		const parsedGenuiSummary =
			typeof rawGenuiSummary === "string" ? safeJsonParse(rawGenuiSummary) : null;
		const normalizedDiskGenuiSummary = normalizeGenuiSummary(diskRun.genuiSummary);
		const normalizedParsedGenuiSummary = normalizeGenuiSummary(parsedGenuiSummary);

		return {
			run: toSerializableRun(diskRun),
			summary: parsedSummary || diskRun.summary || null,
			genuiSummary: normalizedParsedGenuiSummary || normalizedDiskGenuiSummary || null,
		};
	};

	const getRun = async (runId) => {
		const activeRun = runsById.get(runId);
		if (activeRun) {
			return toSerializableRun(activeRun);
		}

		const diskRun = await loadRunFromDisk(runId);
		return diskRun ? toSerializableRun(diskRun) : null;
	};

	const listRuns = async (options = {}) => {
		const requestedLimit = getPositiveInteger(options.limit);
		const limit =
			typeof requestedLimit === "number"
				? Math.min(Math.max(requestedLimit, 1), MAX_RUN_LIST_LIMIT)
				: null;
		const runsByIdSnapshot = new Map(
			Array.from(runsById.values()).map((run) => [run.id, toSerializableRun(run)])
		);

		let runDirectories = [];
		try {
			const entries = await fs.readdir(runRootsDir, { withFileTypes: true });
			runDirectories = entries
				.filter((entry) => entry.isDirectory())
				.map((entry) => entry.name);
		} catch (error) {
			const errorCode = error && typeof error === "object" ? error.code : null;
			if (errorCode !== "ENOENT") {
				throw error;
			}
		}

		const diskRuns = await Promise.all(
			runDirectories.map(async (runId) => {
				const diskRun = await loadRunFromDisk(runId);
				return diskRun ? toSerializableRun(diskRun) : null;
			})
		);

		for (const run of diskRuns) {
			if (!run) {
				continue;
			}

			if (!runsByIdSnapshot.has(run.runId)) {
				runsByIdSnapshot.set(run.runId, run);
			}
		}

		const sortedRuns = Array.from(runsByIdSnapshot.values()).sort((leftRun, rightRun) => {
			const leftUpdatedAt = getTimestampFromIsoString(leftRun.updatedAt);
			const rightUpdatedAt = getTimestampFromIsoString(rightRun.updatedAt);

			if (Number.isFinite(leftUpdatedAt) && Number.isFinite(rightUpdatedAt)) {
				if (leftUpdatedAt !== rightUpdatedAt) {
					return rightUpdatedAt - leftUpdatedAt;
				}
			} else if (Number.isFinite(rightUpdatedAt)) {
				return 1;
			} else if (Number.isFinite(leftUpdatedAt)) {
				return -1;
			}

			const leftCreatedAt = getTimestampFromIsoString(leftRun.createdAt);
			const rightCreatedAt = getTimestampFromIsoString(rightRun.createdAt);
			if (Number.isFinite(leftCreatedAt) && Number.isFinite(rightCreatedAt)) {
				if (leftCreatedAt !== rightCreatedAt) {
					return rightCreatedAt - leftCreatedAt;
				}
			} else if (Number.isFinite(rightCreatedAt)) {
				return 1;
			} else if (Number.isFinite(leftCreatedAt)) {
				return -1;
			}

			return rightRun.runId.localeCompare(leftRun.runId);
		});

		if (typeof limit === "number") {
			return sortedRuns.slice(0, limit);
		}

		return sortedRuns;
	};

	const getRunSummary = async (runId) => {
		const activeRun = runsById.get(runId);
		if (activeRun) {
			return {
				run: toSerializableRun(activeRun),
				summary: activeRun.summary ?? null,
				genuiSummary: normalizeGenuiSummary(activeRun.genuiSummary),
			};
		}

		const diskRun = await loadRunFromDisk(runId);
		if (!diskRun) {
			return null;
		}

		return readRunSummaryArtifacts(runId, diskRun);
	};

	const createFallbackPlanDelta = (run, prompt) => {
		const fallbackAgentName = getNonEmptyString(run?.plan?.agents?.[0]) || "Generalist 1";
		return {
			title: run.plan.title,
			tasks: [
				{
					id: `followup-${run.iteration + 1}`,
					label: prompt,
					agent: fallbackAgentName,
					blockedBy: [],
				},
			],
		};
	};

	const generatePlanDeltaFromPrompt = async (run, prompt, contextPrompt) => {
		const appendPrompt = createAppendTasksPrompt(run, prompt, contextPrompt);

		try {
			const generatedText = await callModelForMarkdown({
				provider: "ai-gateway",
				prompt: appendPrompt,
				conversationHistory: run.conversationContext,
				contextDescription: `Create additional execution tasks for run ${run.id}`,
				customSystemPrompt: "You return strict JSON for multi-agent task planning.",
				userName: "Task Planner",
				conflictPolicy: "wait-for-turn",
			});
			const parsedPayload = parseJsonObjectFromText(generatedText);
			if (parsedPayload) {
				if (
					Array.isArray(parsedPayload.tasks) &&
					isLinearChain(parsedPayload.tasks)
				) {
					parsedPayload.tasks = inferTaskDependencies(parsedPayload.tasks);
				}
				return parsedPayload;
			}
		} catch (error) {
			logger.warn?.("[AGENTS-RUN] Failed to generate plan delta; using fallback", error);
		}

		return createFallbackPlanDelta(run, prompt);
	};

	const createRun = async ({
		plan,
		userPrompt,
		conversation,
		customInstruction,
		agentCount,
	}) => {
		const normalizedPlan = normalizePlan(plan);
		if (!normalizedPlan) {
			throw new Error("A valid plan with tasks is required.");
		}

		const runId = createId("run");

		// Derive a slug and register in the app registry
		let appSlug = null;
		if (appRegistry && normalizedPlan.title) {
			try {
				appSlug = await appRegistry.deriveSlug(normalizedPlan.title);
				await appRegistry.registerApp({
					slug: appSlug,
					runId,
					title: normalizedPlan.title,
				});
			} catch (registryError) {
				logger.warn(`[app-registry] Failed to register app for run ${runId}: ${registryError.message}`);
				appSlug = null;
			}
		}

		const run = createInitialRun({
			runId,
			plan: normalizedPlan,
			userPrompt: getNonEmptyString(userPrompt) || "",
			conversationContext: buildConversationContext(conversation),
			customInstruction: getNonEmptyString(customInstruction) || undefined,
			agentCount: normalizeAgentCount(agentCount),
		});
		run.appSlug = appSlug;
		runsById.set(runId, run);
		await persistIntermediateSnapshot(run);
		emitRunStateEvent(run, "run.started", {});
		ensureScheduler(run);

		return toSerializableRun(run);
	};

	const addDirective = async (runId, { agentName, message }) => {
		const run = await ensureLiveRun(runId);
		if (!run) {
			return { error: "Run not found or not active." };
		}
		if (run.status !== RUN_STATUS_RUNNING) {
			return { error: "Run is not active." };
		}

		const normalizedAgentName = getNonEmptyString(agentName);
		const normalizedMessage = getNonEmptyString(message);
		if (!normalizedAgentName || !normalizedMessage) {
			return { error: "Agent name and message are required." };
		}

		const agent =
			run.agents.find(
				(item) => item.agentName.toLowerCase() === normalizedAgentName.toLowerCase()
			) || null;
		if (!agent) {
			return { error: `Agent ${normalizedAgentName} was not found in this run.` };
		}

		const directive = {
			id: createId("directive"),
			agentId: agent.agentId,
			agentName: agent.agentName,
			message: normalizedMessage,
			createdAt: toIsoDate(),
		};
		run.directives.push(directive);
		updateRunTimestamp(run);
		await persistIntermediateSnapshot(run);
		emitRunStateEvent(run, "directive.recorded", {
			directive,
			update:
				agent.currentTaskId && agent.currentTaskLabel
					? {
						agentId: agent.agentId,
						agentName: agent.agentName,
						taskId: agent.currentTaskId,
						taskLabel: agent.currentTaskLabel,
						status: "working",
						content: `Received directive: ${normalizedMessage}`,
					}
					: null,
		});

		return {
			run: toSerializableRun(run),
			directive,
		};
	};

	const appendTasks = async (
		runId,
		{
			planDelta,
			prompt,
			contextPrompt,
			conversation,
			customInstruction,
			retryTaskIds,
		}
	) => {
		const run = await ensureLiveRun(runId);
		if (!run) {
			return { error: "Run not found." };
		}

		const normalizedRetryTaskIds = normalizeTaskIdArray(retryTaskIds);
		if (normalizedRetryTaskIds.length > 0) {
			const retriableTasks = [];
			for (const taskId of normalizedRetryTaskIds) {
				const task = run.tasks.find((item) => item.id === taskId) || null;
				if (!task) {
					continue;
				}

				if (!FAILURE_TASK_STATUSES.has(task.status)) {
					continue;
				}

				retriableTasks.push(task);
			}

			if (retriableTasks.length === 0) {
				return { error: "No failed tasks were eligible for retry." };
			}

			const nextIteration = (run.iteration || 1) + 1;
			const batchId = createId("batch");
			const now = toIsoDate();

			for (const task of retriableTasks) {
				task.status = "todo";
				task.startedAt = null;
				task.completedAt = null;
				task.error = null;
				task.output = null;
				task.outputSummary = null;
				task.iteration = nextIteration;
				task.batchId = batchId;
				emitRunStateEvent(run, "task.retrying", {
					taskId: task.id,
					attempt: task.attempts + 1,
				});
			}

			for (const agent of run.agents) {
				if (agent.status === "failed") {
					agent.status = "idle";
					agent.currentTaskId = null;
					agent.currentTaskLabel = null;
					agent.updatedAt = now;
				}
			}

			run.status = RUN_STATUS_RUNNING;
			run.error = null;
			run.completedAt = null;
			run.iteration = nextIteration;
			run.activeBatchId = batchId;
			updateRunTimestamp(run);
			await persistIntermediateSnapshot(run);
			emitRunStateEvent(run, "run.resumed", {});
			ensureScheduler(run);

			return {
				run: toSerializableRun(run),
				retriedTaskIds: retriableTasks.map((task) => task.id),
			};
		}

		const normalizedPrompt = getNonEmptyString(prompt);
		let resolvedPlanDelta = planDelta;
		if (!resolvedPlanDelta) {
			if (!normalizedPrompt) {
				return { error: "A prompt or planDelta is required to append tasks." };
			}

			resolvedPlanDelta = await generatePlanDeltaFromPrompt(
				run,
				normalizedPrompt,
				getNonEmptyString(contextPrompt)
			);
		}

		const existingTaskIds = new Set(run.tasks.map((task) => task.id));
		const normalizedPlanDelta = normalizePlanDelta(resolvedPlanDelta, existingTaskIds);
		if (!normalizedPlanDelta) {
			return { error: "Unable to create a valid task delta." };
		}

		const nextIteration = (run.iteration || 1) + 1;
		const batchId = createId("batch");
		const now = toIsoDate();
		const runLaneDefinitions = ensureRunLaneDefinitions(run);
		const remappedPlanDeltaTasks = assignTasksToLanes(
			normalizedPlanDelta.tasks,
			runLaneDefinitions
		);
		const appendedTasks = remappedPlanDeltaTasks.map((task) => ({
			id: task.id,
			label: task.label,
			agentName: task.agentName,
			agentId: task.agentId,
			blockedBy: task.blockedBy,
			status: "todo",
			attempts: 0,
			startedAt: null,
			completedAt: null,
			error: null,
			output: null,
			outputSummary: null,
			iteration: nextIteration,
			batchId,
		}));

		run.tasks.push(...appendedTasks);
		run.plan.tasks.push(
			...appendedTasks.map((task) => ({
				id: task.id,
				label: task.label,
				agent: task.agentName,
				blockedBy: task.blockedBy,
			}))
		);

		for (const task of appendedTasks) {
			ensureAgentRecord(run, task);
		}
		run.plan.agents = runLaneDefinitions.map((lane) => lane.agentName);

		run.status = RUN_STATUS_RUNNING;
		run.error = null;
		run.completedAt = null;
		run.iteration = nextIteration;
		run.activeBatchId = batchId;
		run.userPrompt = normalizedPrompt || run.userPrompt;

		const normalizedCustomInstruction = getNonEmptyString(customInstruction);
		if (normalizedCustomInstruction) {
			run.customInstruction = normalizedCustomInstruction;
		}

		run.conversationContext = mergeConversationContextWithBudget(
			run.conversationContext,
			[
				...buildConversationContext(conversation),
				...(normalizedPrompt
					? [
						{
							type: "user",
							content: normalizedPrompt,
						},
					]
					: []),
			]
		);

		for (const agent of run.agents) {
			if (agent.status === "failed") {
				agent.status = "idle";
				agent.currentTaskId = null;
				agent.currentTaskLabel = null;
				agent.updatedAt = now;
			}
		}

		updateRunTimestamp(run);
		await persistIntermediateSnapshot(run);
		emitRunStateEvent(run, "run.resumed", {});
		ensureScheduler(run);

		return {
			run: toSerializableRun(run),
			planDelta: {
				title: normalizedPlanDelta.title,
				description: normalizedPlanDelta.description,
				emoji: normalizedPlanDelta.emoji,
				agents: run.plan.agents,
				tasks: remappedPlanDeltaTasks.map((task) => ({
					id: task.id,
					label: task.label,
					agent: task.agentName,
					blockedBy: task.blockedBy,
				})),
			},
		};
	};

	const streamRunEvents = async (req, res, runId) => {
		const run = runsById.get(runId);
		if (!run) {
			const diskRun = await loadRunFromDisk(runId);
			if (!diskRun) {
				res.status(404).json({ error: "Run not found" });
				return;
			}

			res.setHeader("Content-Type", "text/event-stream");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");
			res.write(
				`data: ${JSON.stringify(
					buildSseEvent("snapshot", { run: toSerializableRun(diskRun) })
				)}\n\n`
			);
			res.end();
			return;
		}

		res.setHeader("Content-Type", "text/event-stream");
		res.setHeader("Cache-Control", "no-cache");
		res.setHeader("Connection", "keep-alive");
		res.flushHeaders?.();

		res.write(
			`data: ${JSON.stringify(
				buildSseEvent("snapshot", { run: toSerializableRun(run) })
			)}\n\n`
		);

		run.subscribers.add(res);

		const keepAliveId = setInterval(() => {
			res.write(`: ping ${Date.now()}\n\n`);
		}, 15000);

		req.on("close", () => {
			clearInterval(keepAliveId);
			run.subscribers.delete(res);
		});
	};

	const deleteRun = async (runId) => {
		// Unregister generated app from the registry
		if (appRegistry) {
			try {
				await appRegistry.unregisterByRunId(runId);
			} catch (registryError) {
				logger.warn(`[app-registry] Failed to unregister app for run ${runId}: ${registryError.message}`);
			}
		}

		// Clean up source files created during this run
		const activeRun = runsById.get(runId);
		const paths = buildRunPaths(runRootsDir, runId);
		try {
			const createdFiles = activeRun?.createdFiles?.length
				? activeRun.createdFiles
				: await readCreatedFilesFromDisk(paths.runDir);
			if (createdFiles.length > 0) {
				await deleteCreatedFiles(createdFiles, logger);
				logger.info(`[make-file-tracker] Deleted ${createdFiles.length} created file(s) for run ${runId}`);
			}
		} catch (error) {
			logger.warn(`[make-file-tracker] Failed to clean up created files for run ${runId}: ${error.message}`);
		}

		runsById.delete(runId);

		try {
			await fs.rm(paths.runDir, { recursive: true, force: true });
		} catch (error) {
			const errorCode = error && typeof error === "object" ? error.code : null;
			if (errorCode !== "ENOENT") {
				throw error;
			}
		}
	};

	return {
		createRun,
		listRuns,
		getRun,
		deleteRun,
		getRunSummary,
		appendTasks,
		addDirective,
		streamRunEvents,
	};
}

module.exports = {
	createRunManager,
	buildBatchOrchestrationPrompt,
	parseBatchResults,
};
