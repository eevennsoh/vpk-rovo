const ACTIVE_WORK_ITEM_CONTEXT_START = "[Active Jira Work Item Context]";
const ACTIVE_WORK_ITEM_CONTEXT_END = "[End Active Jira Work Item Context]";
const WORK_ITEM_REPORT_REQUEST_START = "[Work Item HTML Report Request]";
const WORK_ITEM_REPORT_REQUEST_END = "[End Work Item HTML Report Request]";
const VPK_HTML_SKILL_ID = "vpk-html";

function normalizeText(value) {
	return typeof value === "string"
		? value.trim().toLowerCase().replace(/\s+/gu, " ")
		: "";
}

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function isWorkItemReportIntent(promptText) {
	const prompt = normalizeText(promptText);
	if (!prompt) {
		return false;
	}

	const hasReportNoun = /\b(html\s+report|report|write-?up|status\s+report)\b/u.test(prompt);
	if (!hasReportNoun) {
		return false;
	}

	if (/^(how|what|why|where|when|who)\b/u.test(prompt)) {
		return false;
	}

	const hasWorkItemTarget =
		/\b(this|current|open)\s+(jira\s+)?(work\s*item|ticket|issue)\b/u.test(prompt) ||
		/\b(jira\s+)?(work\s*item|ticket|issue)\b/u.test(prompt);
	const hasHtmlReportPhrase = /\b(html\s+report|report\s+html)\b/u.test(prompt);
	const hasReportCreationVerb =
		/\b(generate|create|write|make|build|draft|prepare|compose)\b.{0,80}\breport\b/u.test(prompt) ||
		/\breport\b.{0,80}\b(generate|create|write|make|build|draft|prepare|compose)\b/u.test(prompt);
	const hasSummarizeAsReport =
		/\bsummari[sz]e\b.{0,100}\b(ticket|issue|work\s*item|this)\b.{0,100}\b(as|into)\s+(an?\s+)?report\b/u.test(prompt) ||
		/\bsummari[sz]e\b.{0,100}\b(as|into)\s+(an?\s+)?report\b/u.test(prompt);

	if (hasSummarizeAsReport) {
		return true;
	}

	if (hasReportCreationVerb) {
		return true;
	}

	if ((hasWorkItemTarget || hasHtmlReportPhrase) && hasReportCreationVerb) {
		return true;
	}

	if (
		hasHtmlReportPhrase &&
		/\b(for|from|about)\s+(this|the|current|open)\b/u.test(prompt)
	) {
		return true;
	}

	return false;
}

function extractActiveWorkItemContext(contextDescription) {
	const context = getNonEmptyString(contextDescription);
	if (!context) {
		return null;
	}

	const startIndex = context.indexOf(ACTIVE_WORK_ITEM_CONTEXT_START);
	if (startIndex === -1) {
		return null;
	}

	const endIndex = context.indexOf(ACTIVE_WORK_ITEM_CONTEXT_END, startIndex);
	if (endIndex === -1) {
		return null;
	}

	return context
		.slice(startIndex, endIndex + ACTIVE_WORK_ITEM_CONTEXT_END.length)
		.trim();
}

function hasActiveWorkItemContext(contextDescription) {
	return extractActiveWorkItemContext(contextDescription) !== null;
}

function extractContextField(activeWorkItemContext, label) {
	const context = getNonEmptyString(activeWorkItemContext);
	if (!context) {
		return null;
	}

	const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
	const match = context.match(new RegExp(`^${escapedLabel}:\\s*(.+)$`, "imu"));
	return getNonEmptyString(match?.[1]);
}

function extractWorkItemReportTitle(contextDescription) {
	const activeContext = extractActiveWorkItemContext(contextDescription);
	const title = extractContextField(activeContext, "Title");
	const key = extractContextField(activeContext, "Key");

	if (title && key) {
		return `${title}`;
	}

	return title || (key ? `${key} Work Item Report` : "Work Item Report");
}

function contextAlreadyHasReportRequest(contextDescription) {
	const context = getNonEmptyString(contextDescription);
	return Boolean(context && context.includes(WORK_ITEM_REPORT_REQUEST_START));
}

function buildWorkItemReportRequestContext({
	contextDescription,
	promptText,
	skillId = VPK_HTML_SKILL_ID,
} = {}) {
	if (!isWorkItemReportIntent(promptText) || contextAlreadyHasReportRequest(contextDescription)) {
		return null;
	}

	const hasContext = hasActiveWorkItemContext(contextDescription);
	const title = extractWorkItemReportTitle(contextDescription);

	if (!hasContext) {
		return [
			WORK_ITEM_REPORT_REQUEST_START,
			"The user is asking for an HTML report for the currently open Jira Work Item, but no active Work Item context was supplied in this turn.",
			"Do not fabricate a report. Ask the user to open the Work Item or add the Work Item context, then offer to generate the report again.",
			WORK_ITEM_REPORT_REQUEST_END,
		].join("\n");
	}

	return [
		WORK_ITEM_REPORT_REQUEST_START,
		"The user is asking for an HTML report for the currently open Jira Work Item.",
		`Internal skill route: load and follow the repo-local /vpk-html skill (${skillId}) for this turn only, even though the user did not type /vpk-html.`,
		`Artifact title: ${title}`,
		"Create a new first-class html artifact from the [Active Jira Work Item Context] block. Include available key, title, description, status, priority, assignee, reporter, dates, labels, child Work Items, attachments metadata, recent activity, risks, next actions, and team ownership.",
		"Respect the vpk-html contract: one offline self-contained HTML file, inline CSS only, no remote dependencies, no unfilled placeholders, no invented facts, and a compact information-gaps section for missing facts.",
		"The chat response should briefly confirm creation and link to the generated report artifact.",
		WORK_ITEM_REPORT_REQUEST_END,
	].join("\n");
}

function mergeHermesSkillIds(existingIds, skillId = VPK_HTML_SKILL_ID) {
	const ids = Array.isArray(existingIds)
		? existingIds.filter((id) => typeof id === "string" && id.trim().length > 0)
		: [];
	return Array.from(new Set([...ids, skillId]));
}

function findVpkHtmlSkillId(skills) {
	if (!Array.isArray(skills)) {
		return VPK_HTML_SKILL_ID;
	}

	const match = skills.find((skill) => {
		const fields = [
			skill?.id,
			skill?.name,
			skill?.title,
		]
			.filter((value) => typeof value === "string")
			.map((value) => value.trim().toLowerCase());

		return fields.some((value) => value === VPK_HTML_SKILL_ID || value.endsWith(`/${VPK_HTML_SKILL_ID}`));
	});

	return getNonEmptyString(match?.id) || VPK_HTML_SKILL_ID;
}

function resolveWorkItemReportRequest({
	contextDescription,
	promptText,
	skills,
} = {}) {
	const isIntent = isWorkItemReportIntent(promptText);
	const hasContext = hasActiveWorkItemContext(contextDescription);
	const shouldCreateArtifact = isIntent && hasContext;
	const skillId = findVpkHtmlSkillId(skills);

	return {
		artifactBackendPreference: shouldCreateArtifact ? "ai-gateway" : null,
		hasContext,
		isIntent,
		shouldCreateArtifact,
		shouldLoadSkill: isIntent && hasContext,
		skillId,
		title: extractWorkItemReportTitle(contextDescription),
		contextBlock: buildWorkItemReportRequestContext({
			contextDescription,
			promptText,
			skillId,
		}),
	};
}

module.exports = {
	ACTIVE_WORK_ITEM_CONTEXT_END,
	ACTIVE_WORK_ITEM_CONTEXT_START,
	VPK_HTML_SKILL_ID,
	WORK_ITEM_REPORT_REQUEST_END,
	WORK_ITEM_REPORT_REQUEST_START,
	buildWorkItemReportRequestContext,
	extractActiveWorkItemContext,
	extractWorkItemReportTitle,
	findVpkHtmlSkillId,
	hasActiveWorkItemContext,
	isWorkItemReportIntent,
	mergeHermesSkillIds,
	resolveWorkItemReportRequest,
};
