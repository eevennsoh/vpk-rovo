const { getNonEmptyString } = require("./shared-utils");
const { isGenericIntegrationWrapperToolName } = require("./rovodev-gateway");

const TOOL_FIRST_DOMAIN_CONFIG = [
	{
		id: "google-calendar",
		label: "Google Calendar",
		promptPatterns: [
			/\bgoogle\s+calendar\b/i,
			/\bcalendar\b/i,
			/\bavailability\b/i,
			/\bmeeting\s+slots?\b/i,
		],
		toolPatterns: [
			/\bgoogle[_\s:-]*calendar\b/i,
			/\bcalendar\b/i,
			/\bavailability\b/i,
			/\bevent(s)?\b/i,
			/\bgcal\b/i,
		],
		requiresClarificationWhen: [
			/\b(schedule|create|add|book|set\s+up)\b[\s\S]{0,40}\b(meeting|event|appointment|call)\b/i,
		],
		requiredContextHints: [
			{
				id: "attendees",
				label: "Who should attend?",
				description: "Specify the attendees for the meeting or event.",
				satisfiedPatterns: [
					/\bwith\s+\S+/i,
					/\b(attendee|invit|participant)s?\b/i,
					/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
				],
				suggestedOptions: [
					{ id: "specify", label: "I'll type the attendees" },
				],
			},
			{
				id: "time",
				label: "When should it be?",
				description: "Specify the date and/or time for the event.",
				satisfiedPatterns: [
					/\b(at|from|on|this|next|tomorrow|today)\s+\d/i,
					/\b\d{1,2}:\d{2}\b/,
					/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
					/\b(tomorrow|today|tonight|this\s+(morning|afternoon|evening))\b/i,
					/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d/i,
					/\b\d{1,2}\/\d{1,2}\b/,
				],
				suggestedOptions: [
					{ id: "specify", label: "I'll type the time" },
				],
			},
		],
	},
	{
		id: "google-drive-docs",
		label: "Google Drive / Docs",
		promptPatterns: [
			/\bgoogle\s+drive\b/i,
			/\bgoogle\s+doc(s)?\b/i,
			/\bgoogle\s+sheet(s)?\b/i,
			/\bgoogle\s+slide(s)?\b/i,
			/\bmy\s+drive\b/i,
			/\bdrive\s+(file|files|folder|folders|storage|usage|quota|content|contents)\b/i,
			/\b(list|show|find|search|check|extract|get|open)\b[\s\S]{0,80}\b(files?|folders?|storage|quota|doc(s|uments?)?|sheet(s)?|slide(s)?|comments?|permissions?)\b[\s\S]{0,80}\bdrive\b/i,
			/\b(doc|docs|drive|sheet|sheets|slide|slides)\s+(comment|permission|revision|label)s?\b/i,
			/\batlassian:url:get:content\b/i,
		],
		toolPatterns: [
			/\bgoogle[_\s:-]*(drive|doc|docs|sheet|sheets|slide|slides)\b/i,
			/\bgoogle[_\s:-]*google[_\s:-]*drive\b/i,
			/\bdrive\b/i,
			/\bdoc(s)?\b/i,
			/\bsheet(s)?\b/i,
			/\bslide(s)?\b/i,
			/\bfile(s)?\b/i,
			/\bfolder(s)?\b/i,
			/\bstorage\b/i,
			/\bquota\b/i,
			/\b(permission|comment|revision|label)s?\b/i,
			/\batlassian:url:get:content\b/i,
			/\batlassian[_\s:-]*url[_\s:-]*get[_\s:-]*(content|comments?|permissions?|revisions?|labels?|files?|storage)\b/i,
			/\burl:get:content\b/i,
		],
	},
	{
		id: "google-translate",
		label: "Google Translate",
		promptPatterns: [
			/\bgoogle\s+translate\b/i,
			/\bgoogle\s+cloud\s+translate\b/i,
			/\bcloud\s+translation\b/i,
			/\buse\s+google\s+translate\b/i,
			/\btranslate\s+(?:via|with)\s+google\b/i,
		],
		toolPatterns: [
			/\btranslate\b/i,
			/\blanguage\b/i,
		],
	},
	{
		id: "slack",
		label: "Slack",
		promptPatterns: [
			/\bslack\b/i,
			/\bchannel(s)?\b/i,
			/\bthread(s)?\b/i,
			/\brepl(y|ies)\b/i,
			/\bsend\s+(a\s+)?message\b/i,
		],
		toolPatterns: [
			/\bslack\b/i,
			/\bchannel(s)?\b/i,
			/\brepl(y|ies)\b/i,
			/\bmessage(s)?\b/i,
		],
		requiresClarificationWhen: [
			/\b(send|post|write|reply)\b[\s\S]{0,40}\b(message|slack)\b/i,
			/\b(message|slack)\b[\s\S]{0,40}\b(send|post|write|reply)\b/i,
		],
		requiredContextHints: [
			{
				id: "channel",
				label: "Which channel or person?",
				description: "Specify the Slack channel or person to message.",
				satisfiedPatterns: [
					/#[a-zA-Z][\w-]*/,
					/\b(in|to|on)\s+#?\S+\s+(channel|slack)\b/i,
					/\b(channel|dm|direct\s+message)\s+#?\S+/i,
					/\b(to|message)\s+@\w+/i,
				],
				suggestedOptions: [
					{ id: "general", label: "#general" },
					{ id: "random", label: "#random" },
					{ id: "specify", label: "I'll type the channel" },
				],
			},
			{
				id: "message-content",
				label: "What should the message say?",
				description: "Specify the content of the message.",
				satisfiedPatterns: [
					/\bsay(ing)?\s+['"""].+['"""]/i,
					/\bmessage\s*:\s*.+/i,
					/\bsend\s+['"""].+['"""]/i,
					/\b(saying|that\s+says|with\s+the\s+(text|message|content))\s+/i,
				],
				suggestedOptions: [
					{ id: "specify", label: "I'll type the message" },
				],
			},
		],
	},
	{
		id: "compass",
		label: "Compass",
		promptPatterns: [
			/\bcompass\b/i,
			/\bcomponent(s)?\b/i,
			/\bdependencies\b/i,
			/\bevent\s+sources?\b/i,
			/\bapi\s+changelog(s)?\b/i,
		],
		toolPatterns: [
			/\bcompass\b/i,
			/\bcomponent(s)?\b/i,
			/\bdependencies\b/i,
			/\bevent[_\s-]*sources?\b/i,
			/\bchangelog(s)?\b/i,
		],
	},
	{
		id: "teamwork-graph",
		label: "Teamwork Graph",
		promptPatterns: [
			/\bteamwork\s+graph\b/i,
			/\bgraph\b/i,
			/\bcypher\b/i,
			/\bwork\s+summary\b/i,
			/\bcollaboration\s+summary\b/i,
			/\borg\s+hierarchy\b/i,
			/\breport\s+chain\b/i,
			/\b(last|past|previous|recent)\s+\d+\s+(day|days|week|weeks|month|months)\s+(of\s+)?work\b/i,
			/\bmy\s+(recent\s+)?work\b/i,
			/\bwork\s+activit(y|ies)\b/i,
			/\bwhat\s+(did|have)\s+\w+\s+work(ed)?\s+on\b/i,
			/\b(last|past|previous|recent)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\s+(day|days|week|weeks|month|months)\s+(of\s+)?work\b/i,
			/\b(last|past|previous|recent)\s+week\b/i,
			/\bthis\s+week'?s?\s+work\b/i,
			/\b(summarize|summary|show|list)\s+(my\s+)?(recent\s+)?work\b/i,
		],
		toolPatterns: [
			/\bteamwork\b/i,
			/\bgraph\b/i,
			/\bcypher\b/i,
			/\bwork[_\s-]*summary\b/i,
			/\bcollaboration\b/i,
			/\borg\b/i,
			/\bmanager\b/i,
			/\breport[_\s-]*chain\b/i,
		],
	},
	{
		id: "atlassian-projects",
		label: "Atlassian Projects",
		promptPatterns: [
			/\batlassian\s+project(s)?\b/i,
			/\bproject\s+update(s)?\b/i,
			/\bprogress\s+update(s)?\b/i,
			/\bproject\s+context\b/i,
		],
		toolPatterns: [
			/\bproject(s)?\b/i,
			/\bprogress[_\s-]*update(s)?\b/i,
			/\bproject[_\s-]*context\b/i,
		],
	},
	{
		id: "jira",
		label: "Jira",
		promptPatterns: [
			/\bjira\b/i,
			/\bissue(s)?\b/i,
			/\bjql\b/i,
			/\btransition(s)?\b/i,
		],
		toolPatterns: [
			/\bjira\b/i,
			/\bissue(s)?\b/i,
			/\bjql\b/i,
			/\btransition(s)?\b/i,
		],
		requiresClarificationWhen: [
			/\b(create|make|add|open|file)\b[\s\S]{0,40}\b(issue|ticket|bug|story|task|epic)\b/i,
		],
		requiredContextHints: [
			{
				id: "project",
				label: "Which project?",
				description: "Specify the Jira project for the new issue.",
				satisfiedPatterns: [
					/\b(in|for|under|project)\s+[A-Z]{2,10}\b/,
					/\b[A-Z]{2,10}\s+(project|board)\b/,
					/\bproject\s*[:=]\s*\S+/i,
				],
				suggestedOptions: [
					{ id: "specify", label: "I'll type the project key" },
				],
			},
			{
				id: "summary",
				label: "What's the issue summary?",
				description: "Provide a short summary or title for the issue.",
				satisfiedPatterns: [
					/\b(titled?|summar(y|ized)|called|named)\s+['"""].+['"""]/i,
					/\bissue\s*:\s*.+/i,
					/\b(about|for|regarding)\s+['"""].+['"""]/i,
				],
				suggestedOptions: [
					{ id: "specify", label: "I'll type the summary" },
				],
			},
		],
	},
	{
		id: "confluence",
		label: "Confluence",
		promptPatterns: [
			/\bconfluence\b/i,
			/\bcql\b/i,
			/\bpage(s)?\b/i,
			/\bspace(s)?\b/i,
		],
		toolPatterns: [
			/\bconfluence\b/i,
			/\bcql\b/i,
			/\bpage(s)?\b/i,
			/\bspace(s)?\b/i,
		],
		requiresClarificationWhen: [
			/\b(create|draft|write|add|make)\b[\s\S]{0,40}\b(page|doc|document)\b/i,
		],
		requiredContextHints: [
			{
				id: "space",
				label: "Which Confluence space?",
				description: "Specify the Confluence space for the new page.",
				satisfiedPatterns: [
					/\b(in|under|space)\s+['"""]?\S+['"""]?\s+(space|confluence)\b/i,
					/\bspace\s*[:=]\s*\S+/i,
					/\b(in|under)\s+the\s+\S+\s+space\b/i,
				],
				suggestedOptions: [
					{ id: "specify", label: "I'll type the space name" },
				],
			},
			{
				id: "page-title",
				label: "What should the page be called?",
				description: "Provide a title for the new page.",
				satisfiedPatterns: [
					/\b(titled?|called|named)\s+['"""].+['"""]/i,
					/\bpage\s*:\s*.+/i,
					/\b(about|for|regarding)\s+['"""].+['"""]/i,
				],
				suggestedOptions: [
					{ id: "specify", label: "I'll type the page title" },
				],
			},
		],
	},
	{
		id: "bitbucket",
		label: "Bitbucket",
		promptPatterns: [
			/\bbitbucket\b/i,
			/\bpull\s+request(s)?\b/i,
			/\bpipeline(s)?\b/i,
			/\brepo(sitory|s)?\b/i,
		],
		toolPatterns: [
			/\bbitbucket\b/i,
			/\bpull[_\s-]*request(s)?\b/i,
			/\bpipeline(s)?\b/i,
			/\brepo(sitory|s)?\b/i,
			/\bbranch(es)?\b/i,
		],
	},
	{
		id: "planning-orchestration",
		label: "Planning & Orchestration",
		promptPatterns: [
			/\bupdate[_\s-]*todo\b/i,
			/\bask[_\s-]*user[_\s-]*questions\b/i,
			/\binvoke[_\s-]*subagents\b/i,
			/\bget[_\s-]*skill\b/i,
			/\bsubagent(s)?\b/i,
			/\btodo\s+list\b/i,
			/\bclarifying\s+question(s)?\b/i,
		],
		toolPatterns: [
			/\bupdate[_\s-]*todo\b/i,
			/\bask[_\s-]*user[_\s-]*questions\b/i,
			/\binvoke[_\s-]*subagents\b/i,
			/\bget[_\s-]*skill\b/i,
			/\brequest[_\s-]*user[_\s-]*input\b/i,
			/\bupdate[_\s-]*plan\b/i,
		],
	},
	{
		id: "browser-automation",
		label: "Browser Automation",
		promptPatterns: [
			/\bagent[_\s-]*browser\b/i,
			/\bbrowser\s+automation\b/i,
			/\bscreenshot\b/i,
			/\bsnapshot\b/i,
			/\bfill\s+form\b/i,
			/\bnavigate\b/i,
		],
		toolPatterns: [
			/\bagent[_\s-]*browser\b/i,
			/\bbrowser[_\s-]/i,
			/\bscreenshot\b/i,
			/\bsnapshot\b/i,
			/\bnavigate\b/i,
			/\bclick\b/i,
			/\bfill\b/i,
		],
	},
	{
		id: "figma",
		label: "Figma",
		promptPatterns: [
			/\bfigma\b/i,
			/\bnode[-\s]?id\b/i,
			/\bdesign\s+context\b/i,
			/\bcode\s+connect\b/i,
			/\bvariable\s+definitions?\b/i,
		],
		toolPatterns: [
			/\bfigma\b/i,
			/\bcode[_\s-]*connect\b/i,
			/\bdesign[_\s-]*context\b/i,
			/\bnode\b/i,
			/\bvariable\b/i,
		],
		requiredContextHints: [
			{
				id: "figma-file",
				label: "Paste the Figma URL",
				description:
					"e.g. https://figma.com/design/abc123/My-File?node-id=1-2",
				satisfiedPatterns: [
					/\bhttps?:\/\/(?:www\.)?figma\.com\/(?:design|file|board|proto|make)\/[A-Za-z0-9]+/i,
					/\bfigma\.com\/[^\s]+/i,
					/\bfile\s*key\s*[:=]\s*[A-Za-z0-9_-]{6,}\b/i,
					/\bnode[-\s]?id\s*[:=]\s*\d+[:\-]\d+\b/i,
				],
				kind: "text",
				placeholder: "https://figma.com/design/...",
			},
		],
		postClarificationDirective: [
			"Use the provided Figma URL to call all three Figma tools in parallel:",
			"1. get_design_context — Generate React + Tailwind code from the design (pass nodeId, clientLanguages, clientFrameworks)",
			"2. get_screenshot — Capture a visual screenshot of the Figma node (pass nodeId, clientLanguages, clientFrameworks)",
			"3. get_metadata — Extract structural metadata (frame dimensions, positions, node IDs) (pass nodeId, clientLanguages, clientFrameworks)",
			"",
			"Present the combined results in a generative UI card.",
		].join("\n"),
	},
	{
		id: "workspace-file-ops",
		label: "Workspace File Ops",
		promptPatterns: [
			/\bopen[_\s-]*files?\b/i,
			/\bexpand[_\s-]*code[_\s-]*chunks?\b/i,
			/\bfind[_\s-]*and[_\s-]*replace(_code)?\b/i,
			/\bexpand[_\s-]*folder\b/i,
			/\b(create|delete|move|rename|open|read|search|replace|edit|run|execute)\b[\s\S]{0,40}\b(file|files|folder|folders|directory|directories|code|bash|terminal|command)\b/i,
		],
		toolPatterns: [
			/\bopen[_\s-]*files?\b/i,
			/\bexpand[_\s-]*code[_\s-]*chunks?\b/i,
			/\bgrep\b/i,
			/\bcreate[_\s-]*file\b/i,
			/\bdelete[_\s-]*file\b/i,
			/\bmove[_\s-]*file\b/i,
			/\bfind[_\s-]*and[_\s-]*replace(_code)?\b/i,
			/\bexpand[_\s-]*folder\b/i,
			/\bbash\b/i,
			/\bterminal\b/i,
		],
	},
];

const TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY = "soft-retry";
const TOOL_FIRST_DEFAULT_MAX_RETRIES = 1;
const TOOL_FIRST_DEFAULT_RETRY_BACKOFF_MS = [750, 1500];
const TOOL_FIRST_DEFAULT_MAX_RETRY_WINDOW_MS = 3000;
const TOOL_FIRST_GOOGLE_CALENDAR_DOMAIN_ID = "google-calendar";
const TOOL_FIRST_DEFAULT_CALENDAR_WINDOW_DAYS = 7;
const TOOL_FIRST_TEAMWORK_GRAPH_DOMAIN_ID = "teamwork-graph";
const TOOL_FIRST_TEAMWORK_GRAPH_FALLBACK_RELEVANCE_DOMAINS = [
	"jira",
	"confluence",
	"atlassian-projects",
];
const TOOL_FIRST_DEFAULT_WORK_SUMMARY_WINDOW_DAYS = 7;
const TOOL_FIRST_MAX_WORK_SUMMARY_WINDOW_DAYS = 120;
const TOOL_FIRST_RELATIVE_NUMBER_MAP = new Map([
	["one", 1],
	["two", 2],
	["three", 3],
	["four", 4],
	["five", 5],
	["six", 6],
	["seven", 7],
	["eight", 8],
	["nine", 9],
	["ten", 10],
	["eleven", 11],
	["twelve", 12],
]);

const TOOL_FIRST_DOMAIN_MAP = new Map(
	TOOL_FIRST_DOMAIN_CONFIG.map((domain) => [domain.id, domain])
);

function trimPreview(value, maxLength = 280) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, maxLength - 1)}…`;
}

function getPositiveInteger(value, fallback) {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) {
		return Math.floor(value);
	}

	if (typeof value === "string" && value.trim()) {
		const parsedValue = Number.parseInt(value.trim(), 10);
		if (Number.isFinite(parsedValue) && parsedValue > 0) {
			return parsedValue;
		}
	}

	return fallback;
}

function normalizeRetryBackoffValues(rawValue, maxRetries) {
	const expectedLength = Math.max(maxRetries, 1);
	const fallbackValues = TOOL_FIRST_DEFAULT_RETRY_BACKOFF_MS.slice(0, expectedLength);
	if (fallbackValues.length < expectedLength) {
		const lastFallbackValue = fallbackValues[fallbackValues.length - 1] ?? 750;
		while (fallbackValues.length < expectedLength) {
			fallbackValues.push(lastFallbackValue);
		}
	}

	if (typeof rawValue !== "string" || !rawValue.trim()) {
		return fallbackValues;
	}

	const parsedValues = rawValue
		.split(",")
		.map((part) => Number.parseInt(part.trim(), 10))
		.filter((value) => Number.isFinite(value) && value > 0);
	if (parsedValues.length === 0) {
		return fallbackValues;
	}

	const normalizedValues = parsedValues.slice(0, expectedLength);
	const lastValue = normalizedValues[normalizedValues.length - 1] ?? fallbackValues[0];
	while (normalizedValues.length < expectedLength) {
		normalizedValues.push(lastValue);
	}

	return normalizedValues;
}

function resolveToolFirstEnforcementConfig() {
	const normalizedMode =
		getNonEmptyString(process.env.TOOL_FIRST_ENFORCEMENT_MODE)?.toLowerCase()
		?? TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY;
	const mode =
		normalizedMode === TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY
			? TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY
			: TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY;

	const maxRelevantRetries = getPositiveInteger(
		process.env.TOOL_FIRST_MAX_RETRIES,
		TOOL_FIRST_DEFAULT_MAX_RETRIES
	);
	const retryBackoffMs = normalizeRetryBackoffValues(
		process.env.TOOL_FIRST_RETRY_BACKOFF_MS,
		maxRelevantRetries
	);
	const maxRetryWindowMs = getPositiveInteger(
		process.env.TOOL_FIRST_RETRY_WINDOW_MS,
		TOOL_FIRST_DEFAULT_MAX_RETRY_WINDOW_MS
	);

	return {
		mode,
		maxRelevantRetries,
		retryBackoffMs,
		maxRetryWindowMs,
	};
}

function resolveMatchedDomains(prompt) {
	const text = getNonEmptyString(prompt);
	if (!text) {
		return [];
	}

	return TOOL_FIRST_DOMAIN_CONFIG
		.filter((domain) =>
			Array.isArray(domain.promptPatterns)
			&& domain.promptPatterns.some((pattern) => pattern.test(text))
		)
		.map((domain) => domain.id);
}

function getDomainLabels(domains) {
	if (!Array.isArray(domains)) {
		return [];
	}

	return domains
		.map((domainId) => TOOL_FIRST_DOMAIN_MAP.get(domainId)?.label)
		.filter(Boolean);
}

function toIsoSeconds(value) {
	if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
		return null;
	}

	return value.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function resolveGoogleCalendarDefaultWindow({
	now = new Date(),
	windowDays = TOOL_FIRST_DEFAULT_CALENDAR_WINDOW_DAYS,
} = {}) {
	const safeWindowDays =
		typeof windowDays === "number" && Number.isFinite(windowDays) && windowDays > 0
			? Math.floor(windowDays)
			: TOOL_FIRST_DEFAULT_CALENDAR_WINDOW_DAYS;
	const end = new Date(now.getTime() + safeWindowDays * 24 * 60 * 60 * 1000);

	return {
		windowDays: safeWindowDays,
		startIso: toIsoSeconds(now),
		endIso: toIsoSeconds(end),
	};
}

function parseRelativeWindowDays(prompt) {
	const normalizedPrompt = getNonEmptyString(prompt);
	if (!normalizedPrompt) {
		return TOOL_FIRST_DEFAULT_WORK_SUMMARY_WINDOW_DAYS;
	}

	const explicitRangeMatch = normalizedPrompt.match(
		/\b(last|past|previous|recent)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(day|days|week|weeks|month|months)\b/i
	);
	if (explicitRangeMatch) {
		const rawCount = explicitRangeMatch[2]?.toLowerCase();
		const unit = explicitRangeMatch[3]?.toLowerCase() || "days";
		const parsedCount = Number.parseInt(rawCount, 10);
		const count = Number.isFinite(parsedCount) && parsedCount > 0
			? parsedCount
			: TOOL_FIRST_RELATIVE_NUMBER_MAP.get(rawCount) || 1;
		const multiplier = unit.startsWith("week")
			? 7
			: unit.startsWith("month")
				? 30
				: 1;
		return Math.max(
			1,
			Math.min(count * multiplier, TOOL_FIRST_MAX_WORK_SUMMARY_WINDOW_DAYS)
		);
	}

	if (/\b(last|past|previous|recent)\s+week\b/i.test(normalizedPrompt)) {
		return 7;
	}

	if (/\bthis\s+week'?s?\s+work\b/i.test(normalizedPrompt)) {
		return 7;
	}

	return TOOL_FIRST_DEFAULT_WORK_SUMMARY_WINDOW_DAYS;
}

function resolveTeamworkGraphTimeWindowContext({ prompt, domains } = {}) {
	const normalizedPrompt = getNonEmptyString(prompt);
	if (!normalizedPrompt || !Array.isArray(domains)) {
		return {
			enabled: false,
		};
	}

	if (!domains.includes(TOOL_FIRST_TEAMWORK_GRAPH_DOMAIN_ID)) {
		return {
			enabled: false,
		};
	}

	const hasWorkSummarySignal =
		/\b(work\s+summary|work\s+activit(y|ies)|recent\s+work|my\s+work)\b/i.test(
			normalizedPrompt
		) ||
		/\b(last|past|previous|recent|this)\b[\s\S]{0,40}\b(day|days|week|weeks|month|months)\b/i.test(
			normalizedPrompt
		) ||
		/\bthis\s+week'?s?\s+work\b/i.test(normalizedPrompt);
	if (!hasWorkSummarySignal) {
		return {
			enabled: false,
		};
	}

	const windowDays = parseRelativeWindowDays(normalizedPrompt);
	const now = new Date();
	const end = new Date(
		Date.UTC(
			now.getUTCFullYear(),
			now.getUTCMonth(),
			now.getUTCDate(),
			23,
			59,
			59
		)
	);
	const windowStartBase = new Date(
		end.getTime() - (windowDays - 1) * 24 * 60 * 60 * 1000
	);
	const start = new Date(
		Date.UTC(
			windowStartBase.getUTCFullYear(),
			windowStartBase.getUTCMonth(),
			windowStartBase.getUTCDate(),
			0,
			0,
			0
		)
	);

	return {
		enabled: true,
		windowDays,
		startIso: toIsoSeconds(start),
		endIso: toIsoSeconds(end),
	};
}

function resolveToolFirstPolicy({ prompt } = {}) {
	const domains = resolveMatchedDomains(prompt);
	const enforcement = resolveToolFirstEnforcementConfig();
	if (domains.length === 0) {
		return {
			matched: false,
			domains: [],
			relevanceDomains: [],
			domainLabels: [],
			instruction: null,
			teamworkGraphTimeWindow: { enabled: false },
			enforcement,
		};
	}

	const domainLabels = getDomainLabels(domains);
	const teamworkGraphTimeWindow = resolveTeamworkGraphTimeWindowContext({
		prompt,
		domains,
	});
	const relevanceDomains = teamworkGraphTimeWindow.enabled
		? Array.from(
				new Set([
					...domains,
					...TOOL_FIRST_TEAMWORK_GRAPH_FALLBACK_RELEVANCE_DOMAINS,
				])
			)
		: [...domains];
	const instructionLines = [
		"Tool-first execution policy:",
		`- This request is in scope for: ${domainLabels.join(", ")}.`,
		"- Before finalizing your answer, execute at least one relevant MCP/integration tool call and use its result as primary context.",
		"- Do not invent tool results. If a tool fails, report the specific failure and the exact input needed to retry.",
	];
	if (domains.includes("browser-automation")) {
		instructionLines.push(
			"- For this browser-automation surface, the bash tool plus `node scripts/chromium-preview-agent.js [--workspace <id>] ...` counts as the relevant tool path because it controls the embedded browser workspace bound to the UI preview.",
			"- Do not call `mcp_get_tool_schema` or external browser MCP tools unless the user explicitly asks for schema details.",
			"- If the user asks you to click, type, select, scroll, or manage tabs, you must execute that interaction in the bound browser workspace before responding."
		);
	}
	if (teamworkGraphTimeWindow.enabled) {
		const resolvedRange =
			teamworkGraphTimeWindow.startIso && teamworkGraphTimeWindow.endIso
				? `${teamworkGraphTimeWindow.startIso} to ${teamworkGraphTimeWindow.endIso}`
				: null;
		instructionLines.push(
			`- Time-window work-summary mode is active for the last ${teamworkGraphTimeWindow.windowDays} day${teamworkGraphTimeWindow.windowDays === 1 ? "" : "s"}.`,
			"- Teamwork Graph / Cypher datetime filters must use strict ISO 8601 date-time values including timezone (e.g. YYYY-MM-DDTHH:mm:ssZ).",
			resolvedRange
				? `- Use this canonical UTC range unless the user overrides it: ${resolvedRange}.`
				: "- Normalize relative dates into explicit UTC start/end timestamps before querying.",
			"- If Teamwork Graph/Cypher returns datetime, semantic, permission, or no-result failures, fallback in the same turn to Jira JQL and Confluence CQL for the same date range."
		);
	}
	if (domains.includes(TOOL_FIRST_GOOGLE_CALENDAR_DOMAIN_ID)) {
		const calendarWindow = resolveGoogleCalendarDefaultWindow();
		const calendarRange =
			calendarWindow.startIso && calendarWindow.endIso
				? `${calendarWindow.startIso} to ${calendarWindow.endIso}`
				: null;
		instructionLines.push(
			"- Google Calendar event listing calls must use the Google Calendar MCP tool for listing events.",
			"- Always include required params: `calendarId`, `timeMin`, and `timeMax`.",
			"- If the user does not specify a calendar, default to `calendarId: \"primary\"`.",
			calendarRange
				? `- If the user does not provide a date range, default to the next ${calendarWindow.windowDays} days using this UTC range: ${calendarRange}.`
				: `- If the user does not provide a date range, default to the next ${calendarWindow.windowDays} days and emit UTC ISO 8601 timestamps for both bounds.`,
			"- Interpret relative dates in the user's local timezone, then convert to UTC ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`) for tool args.",
			"- Do not call bash/date shell tools to compute date params; compute and pass timestamps directly in tool arguments."
		);
	}
	const instruction = instructionLines.join("\n");

	return {
		matched: true,
		domains,
		relevanceDomains,
		domainLabels,
		instruction,
		teamworkGraphTimeWindow,
		enforcement,
	};
}

function isToolNameRelevant({ toolName, domains } = {}) {
	const normalizedToolName = getNonEmptyString(toolName);
	if (!normalizedToolName || !Array.isArray(domains) || domains.length === 0) {
		return false;
	}

	// Generic wrapper tools are always relevant — the actual tool they wrap
	// could belong to any of the matched domains
	if (isGenericIntegrationWrapperToolName(normalizedToolName)) {
		return true;
	}

	const canonicalToolName = normalizedToolName
		.toLowerCase()
		.replace(/[_:/.-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();

	return domains.some((domainId) => {
		if (domainId === "browser-automation" && canonicalToolName === "bash") {
			return true;
		}

		const domain = TOOL_FIRST_DOMAIN_MAP.get(domainId);
		if (!domain || !Array.isArray(domain.toolPatterns)) {
			return false;
		}
		return domain.toolPatterns.some((pattern) =>
			pattern.test(normalizedToolName) || pattern.test(canonicalToolName)
		);
	});
}

function createToolFirstExecutionState(policy) {
	const resolvedPolicy = policy && typeof policy === "object" ? policy : null;
	const domains = resolvedPolicy?.matched
		? Array.isArray(resolvedPolicy.relevanceDomains)
			? resolvedPolicy.relevanceDomains
			: resolvedPolicy.domains
		: [];
	const primaryDomains = resolvedPolicy?.matched ? resolvedPolicy.domains : [];
	return {
		matched: Boolean(resolvedPolicy?.matched),
		domains: Array.isArray(domains) ? [...domains] : [],
		primaryDomains: Array.isArray(primaryDomains) ? [...primaryDomains] : [],
		totalToolStarts: 0,
		totalToolResults: 0,
		totalToolErrors: 0,
		relevantToolStarts: 0,
		relevantToolResults: 0,
		relevantToolErrors: 0,
		attempts: 0,
		retriesUsed: 0,
		hadRelevantToolStart: false,
		lastRelevantToolName: null,
		lastRelevantError: null,
		lastRelevantErrorCategory: null,
		events: [],
	};
}

function classifyToolErrorCategory(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return "unknown";
	}

	const normalizedText = text.toLowerCase();
	if (
		/\b(invalid datetime|invalid date|expected iso\s*8601|semantic[_\s-]*error|syntax error|query parse|invalid format|invalid argument|cypher)\b/i.test(
			normalizedText
		)
	) {
		return "validation";
	}

	if (
		/\b(unauthorized|authentication|reauth|re-auth|token|oauth|login required)\b/i.test(
			normalizedText
		)
	) {
		return "auth";
	}

	if (/\b(forbidden|permission|access denied|insufficient scope|scope)\b/i.test(normalizedText)) {
		return "permission";
	}

	if (
		/\b(not found|missing file|missing id|invalid id|no such file|no such resource|404)\b/i.test(
			normalizedText
		)
	) {
		return "not_found";
	}

	if (/\b(rate limit|too many requests|quota|throttl|429)\b/i.test(normalizedText)) {
		return "rate_limit";
	}

	if (
		/\b(timeout|timed out|network|connection|unavailable|temporary|temporarily|502|503|504)\b/i.test(
			normalizedText
		)
	) {
		return "transient_network";
	}

	return "unknown";
}

function recordToolFirstAttempt(state, { isRetry = false } = {}) {
	if (!state || typeof state !== "object" || !state.matched) {
		return;
	}

	state.attempts += 1;
	if (isRetry) {
		state.retriesUsed += 1;
	}
}

function normalizePhase(value) {
	if (value === "start" || value === "result" || value === "error") {
		return value;
	}
	return null;
}

function recordToolThinkingEvent(state, event) {
	if (!state || typeof state !== "object" || !state.matched) {
		return;
	}
	if (!event || typeof event !== "object") {
		return;
	}

	const phase = normalizePhase(event.phase);
	if (!phase) {
		return;
	}

	const toolName = getNonEmptyString(event.toolName) || "Tool";
	const relevant = isToolNameRelevant({
		toolName,
		domains: state.domains,
	});
	const outputPreview =
		trimPreview(event.outputPreview)
		|| trimPreview(event.output)
		|| trimPreview(event.errorText);

	if (phase === "start") {
		state.totalToolStarts += 1;
		if (relevant) {
			state.relevantToolStarts += 1;
			state.hadRelevantToolStart = true;
			state.lastRelevantToolName = toolName;
		}
	} else if (phase === "result") {
		state.totalToolResults += 1;
		if (relevant) {
			state.relevantToolResults += 1;
			state.hadRelevantToolStart = true;
			state.lastRelevantToolName = toolName;
			state.lastRelevantError = null;
			state.lastRelevantErrorCategory = null;
		}
	} else if (phase === "error") {
		state.totalToolErrors += 1;
		if (relevant) {
			state.relevantToolErrors += 1;
			state.hadRelevantToolStart = true;
			state.lastRelevantToolName = toolName;
			state.lastRelevantError = outputPreview || null;
			state.lastRelevantErrorCategory = classifyToolErrorCategory(outputPreview);
		}
	}

	state.events.push({
		phase,
		toolName,
		toolCallId: getNonEmptyString(event.toolCallId) || null,
		relevant,
		outputPreview,
	});
	if (state.events.length > 60) {
		state.events.shift();
	}
}

function hasRelevantToolSuccess(state) {
	return Boolean(state && state.matched && state.relevantToolResults > 0);
}

function hasRelevantToolObservation(state) {
	if (!state || typeof state !== "object" || !state.matched) {
		return false;
	}

	return (
		state.relevantToolStarts > 0
		|| state.relevantToolResults > 0
		|| state.relevantToolErrors > 0
	);
}

function shouldSuppressToolFirstIntentStatus({ execution, label, content } = {}) {
	if (!execution || typeof execution !== "object" || !execution.matched) {
		return false;
	}

	if (hasRelevantToolObservation(execution)) {
		return false;
	}

	const normalizedLabel = getNonEmptyString(label)?.toLowerCase() ?? "";
	const normalizedContent = getNonEmptyString(content)?.toLowerCase() ?? "";
	const combined = `${normalizedLabel} ${normalizedContent}`.trim();
	if (!combined) {
		return false;
	}

	return /\bdetected\s+intent\b/.test(combined);
}

function getToolFirstRetryDelayMs({ policy, retryIndex } = {}) {
	const retryDelays = Array.isArray(policy?.enforcement?.retryBackoffMs)
		? policy.enforcement.retryBackoffMs
		: TOOL_FIRST_DEFAULT_RETRY_BACKOFF_MS;
	const fallbackDelay = retryDelays[retryDelays.length - 1] ?? TOOL_FIRST_DEFAULT_RETRY_BACKOFF_MS[0];
	const normalizedRetryIndex =
		typeof retryIndex === "number" && Number.isFinite(retryIndex) && retryIndex >= 0
			? Math.floor(retryIndex)
			: 0;
	return retryDelays[normalizedRetryIndex] ?? fallbackDelay;
}

function buildToolFirstRetryInstruction({
	policy,
	attemptNumber,
	remainingRetries,
	execution,
} = {}) {
	const domainLabels = Array.isArray(policy?.domainLabels)
		&& policy.domainLabels.length > 0
		? policy.domainLabels
		: [];
	const scopedDomains = domainLabels.length > 0
		? domainLabels.join(", ")
		: "the requested integration domain";
	const resolvedAttemptNumber =
		typeof attemptNumber === "number" && Number.isFinite(attemptNumber) && attemptNumber > 0
			? Math.floor(attemptNumber)
			: 1;
	const retriesRemaining =
		typeof remainingRetries === "number"
		&& Number.isFinite(remainingRetries)
		&& remainingRetries >= 0
			? Math.floor(remainingRetries)
			: 0;
	const retryLines = [
		"[Tool-first retry directive]",
		`Retry attempt ${resolvedAttemptNumber} for ${scopedDomains}.`,
		"Call at least one relevant MCP/integration tool before answering.",
		"Do not claim missing capability unless a relevant tool call in this turn explicitly returns that limitation.",
		retriesRemaining > 0
			? `If this attempt still fails, report the exact tool error and required IDs/URLs or re-authentication steps. Remaining retries after this attempt: ${retriesRemaining}.`
			: "If this attempt fails, report the exact tool error and required IDs/URLs or re-authentication steps.",
	];
	const hasGoogleCalendarDomain = Array.isArray(policy?.domains)
		&& policy.domains.includes(TOOL_FIRST_GOOGLE_CALENDAR_DOMAIN_ID);
	if (hasGoogleCalendarDomain && execution?.lastRelevantErrorCategory === "validation") {
		retryLines.push(
			"- Google Calendar validation retry directive:",
			"- Re-check the Google Calendar tool schema once, then retry the calendar event listing call.",
			"- Ensure `calendarId`, `timeMin`, and `timeMax` are present; use `calendarId: \"primary\"` when unspecified.",
			"- `timeMin` and `timeMax` must be strict UTC ISO 8601 timestamps (`YYYY-MM-DDTHH:mm:ssZ`)."
		);
	}

	const teamworkGraphTimeWindow = policy?.teamworkGraphTimeWindow;
	if (teamworkGraphTimeWindow?.enabled) {
		retryLines.push(
			"- Work-summary fallback directive:",
			"- Use Teamwork Graph first, but do not repeat the same failing Cypher path.",
			"- If Teamwork Graph/Cypher fails (datetime format, semantic, permission, or empty-result), run Jira JQL and Confluence CQL in the same turn for the same date window.",
			`- Enforce ISO 8601 date-time with timezone for graph filters (UTC window: ${teamworkGraphTimeWindow.startIso} to ${teamworkGraphTimeWindow.endIso}).`
		);
		if (execution?.lastRelevantErrorCategory === "validation") {
			retryLines.push(
				"- Previous failure was a query/date validation error. Prioritize Jira JQL + Confluence CQL fallback now."
			);
		}
	}

	return retryLines.join("\n");
}

function buildToolContextForGenui({
	policy,
	execution,
	assistantText,
	maxItems = 6,
	toolOutputs,
} = {}) {
	if (!policy?.matched || !execution?.matched) {
		return null;
	}

	const domainLabels = Array.isArray(policy.domainLabels)
		&& policy.domainLabels.length > 0
		? policy.domainLabels
		: getDomainLabels(execution.domains);

	const recentRelevantResults = Array.isArray(execution.events)
		? execution.events
			.filter((event) => event.relevant && event.phase === "result")
			.slice(-maxItems)
		: [];
	const recentRelevantErrors = Array.isArray(execution.events)
		? execution.events
			.filter((event) => event.relevant && event.phase === "error")
			.slice(-3)
		: [];

	const lines = [
		"Tool execution context (authoritative for this request):",
		`- Domains: ${domainLabels.join(", ")}`,
		`- Relevant tool starts: ${execution.relevantToolStarts}, results: ${execution.relevantToolResults}, errors: ${execution.relevantToolErrors}`,
	];

	if (recentRelevantResults.length > 0) {
		lines.push("- Recent relevant tool results:");
		for (const event of recentRelevantResults) {
			const preview = event.outputPreview || "Result returned without preview text.";
			lines.push(`  - ${event.toolName}: ${preview}`);
		}
	}

	if (recentRelevantErrors.length > 0) {
		lines.push("- Relevant tool errors:");
		for (const event of recentRelevantErrors) {
			const preview = event.outputPreview || "Tool returned an error.";
			lines.push(`  - ${event.toolName}: ${preview}`);
		}
	}

	if (Array.isArray(toolOutputs) && toolOutputs.length > 0) {
		lines.push("- Full tool outputs (extended context):");
		for (const entry of toolOutputs) {
			lines.push(`  - ${entry.toolName}:\n${entry.output}`);
		}
	}

	const assistantPreview = trimPreview(assistantText, 800);
	if (assistantPreview) {
		lines.push(`- Assistant narrative: ${assistantPreview}`);
	}

	return lines.join("\n");
}

function buildToolFirstTextFallback({
	policy,
	execution,
	rovoDevFallback = false,
} = {}) {
	const domainLabels = Array.isArray(policy?.domainLabels)
		&& policy.domainLabels.length > 0
		? policy.domainLabels
		: getDomainLabels(execution?.domains);
	const scopedDomains = domainLabels.length > 0
		? domainLabels.join(", ")
		: "the requested tool domain";
	const hasGoogleCalendarDomain = Array.isArray(policy?.domains)
		&& policy.domains.includes(TOOL_FIRST_GOOGLE_CALENDAR_DOMAIN_ID);

	const attemptCount =
		typeof execution?.attempts === "number" && execution.attempts > 0
			? execution.attempts
			: 1;
	const retriesUsed =
		typeof execution?.retriesUsed === "number" && execution.retriesUsed > 0
			? execution.retriesUsed
			: 0;

	let message = `I couldn't verify a successful ${scopedDomains} tool result after ${attemptCount} attempt${attemptCount === 1 ? "" : "s"}${retriesUsed > 0 ? ` (${retriesUsed} retr${retriesUsed === 1 ? "y" : "ies"})` : ""}.`;

	if (execution?.hadRelevantToolStart) {
		message += " Relevant integration tools were called, but no successful result was returned.";
	} else {
		message += " No relevant integration tool call was observed in this response.";
	}

	if (execution?.relevantToolErrors > 0) {
		const resolvedToolName = getNonEmptyString(execution?.lastRelevantToolName);
		const lastErrorPreview = trimPreview(execution?.lastRelevantError, 200);
		const category = getNonEmptyString(execution?.lastRelevantErrorCategory) ?? "unknown";
		message += ` Relevant tool calls reported ${execution.relevantToolErrors} error${execution.relevantToolErrors === 1 ? "" : "s"}.`;
		if (resolvedToolName) {
			message += ` Last relevant tool: ${resolvedToolName}.`;
		}
		if (lastErrorPreview) {
			message += ` Last error: ${lastErrorPreview}.`;
		}
		if (category === "auth") {
			message += " Re-authenticate the integration connection, then retry.";
		} else if (category === "permission") {
			message += " Check integration permissions/scopes for the requested resource, then retry.";
		} else if (category === "validation") {
			message += " The request failed due to query/date validation. Use strict ISO 8601 date-time values (YYYY-MM-DDTHH:mm:ssZ).";
			if (hasGoogleCalendarDomain) {
				message += " For Google Calendar list-events requests, use the Google Calendar MCP tool with `calendarId`, `timeMin`, and `timeMax` (UTC ISO 8601), defaulting `calendarId` to `primary` when missing.";
			}
			if (policy?.teamworkGraphTimeWindow?.enabled) {
				message += " Then fallback to Jira JQL and Confluence CQL for the same date window.";
			}
		} else if (category === "not_found") {
			message += " Provide the exact file URL or ID and retry.";
		} else if (category === "rate_limit") {
			message += " The integration is rate-limited; wait briefly and retry.";
		} else if (category === "transient_network") {
			message += " The integration call appears transiently unavailable; retry shortly.";
		} else {
			message += " Retry with exact resource identifiers (URL/ID) or re-authenticate the integration.";
		}
	} else if (!execution?.hadRelevantToolStart) {
		message += " Retry with explicit resource identifiers (URL/ID) so I can target a relevant tool call.";
		if (policy?.teamworkGraphTimeWindow?.enabled) {
			message += " For work summaries, use Jira JQL and Confluence CQL fallback if Teamwork Graph does not execute.";
		}
	}

	if (rovoDevFallback) {
		message += " RovoDev tool execution was interrupted, so this response stayed in plain-text mode.";
	}

	message += " If you need a tool-grounded result, retry after resolving the issue above.";
	return message;
}

const TOOL_FIRST_FAILURE_PARAGRAPH_PATTERN =
	/(?:^|\n)\s*I couldn't verify a successful[\s\S]{0,900}?If you need a tool-grounded result, retry after resolving the issue above\.\s*(?=\n|$)/gi;

const TOOL_FIRST_FAILURE_SENTENCE_PATTERN =
	/(?:^|\n)\s*I couldn't verify a successful[^\n]*tool result after \d+ attempt(?:s)?(?: \(\d+ retr(?:y|ies)\))?\.[^\n]*(?=\n|$)/gi;

function stripToolFirstFailureNarrative(value) {
	if (typeof value !== "string" || value.length === 0) {
		return {
			text: typeof value === "string" ? value : "",
			replaced: false,
		};
	}

	let nextText = value;
	nextText = nextText.replace(TOOL_FIRST_FAILURE_PARAGRAPH_PATTERN, "\n");
	nextText = nextText.replace(TOOL_FIRST_FAILURE_SENTENCE_PATTERN, "\n");
	if (nextText === value) {
		return {
			text: value,
			replaced: false,
		};
	}

	nextText = nextText.replace(/[ \t]+\n/g, "\n");
	nextText = nextText.replace(/\n{3,}/g, "\n\n");
	nextText = nextText.trim();

	return {
		text: nextText,
		replaced: true,
	};
}

function buildToolFirstWarningPayload({
	policy,
	execution,
	rovoDevFallback = false,
} = {}) {
	const domainLabels = Array.isArray(policy?.domainLabels)
		&& policy.domainLabels.length > 0
		? policy.domainLabels
		: getDomainLabels(execution?.domains);
	const message = buildToolFirstTextFallback({
		policy,
		execution,
		rovoDevFallback,
	});
	const attempts =
		typeof execution?.attempts === "number" && Number.isFinite(execution.attempts)
			? execution.attempts
			: 1;
	const retriesUsed =
		typeof execution?.retriesUsed === "number"
		&& Number.isFinite(execution.retriesUsed)
		&& execution.retriesUsed >= 0
			? execution.retriesUsed
			: 0;
	const relevantToolErrors =
		typeof execution?.relevantToolErrors === "number"
		&& Number.isFinite(execution.relevantToolErrors)
		&& execution.relevantToolErrors >= 0
			? execution.relevantToolErrors
			: 0;

	return {
		message,
		domains: domainLabels,
		attempts,
		retriesUsed,
		hadRelevantToolStart: Boolean(execution?.hadRelevantToolStart),
		relevantToolErrors,
		lastRelevantToolName: getNonEmptyString(execution?.lastRelevantToolName),
		lastRelevantErrorCategory: getNonEmptyString(execution?.lastRelevantErrorCategory),
		lastRelevantError: getNonEmptyString(execution?.lastRelevantError),
		rovoDevFallback: Boolean(rovoDevFallback),
	};
}

function resolveUnsatisfiedContextHints({ prompt, domains } = {}) {
	const text = getNonEmptyString(prompt);
	if (!text || !Array.isArray(domains) || domains.length === 0) {
		return [];
	}

	const unsatisfied = [];
	for (const domainId of domains) {
		const domain = TOOL_FIRST_DOMAIN_MAP.get(domainId);
		if (!domain || !Array.isArray(domain.requiredContextHints) || domain.requiredContextHints.length === 0) {
			continue;
		}

		if (Array.isArray(domain.requiresClarificationWhen) && domain.requiresClarificationWhen.length > 0) {
			const shouldGate = domain.requiresClarificationWhen.some((pattern) => pattern.test(text));
			if (!shouldGate) {
				continue;
			}
		}

		for (const hint of domain.requiredContextHints) {
			if (!hint || !hint.id || !Array.isArray(hint.satisfiedPatterns)) {
				continue;
			}

			const satisfied = hint.satisfiedPatterns.some((pattern) => pattern.test(text));
			if (!satisfied) {
				unsatisfied.push({
					domainId,
					...hint,
				});
			}
		}
	}

	return unsatisfied;
}

function isWorkSummaryTurn(policy) {
	return Boolean(policy?.teamworkGraphTimeWindow?.enabled);
}

function buildZeroToolCallRecoverySpec(state, { policy } = {}) {
	if (!state || typeof state !== "object" || !state.matched) {
		return null;
	}

	if (hasRelevantToolObservation(state)) {
		return null;
	}

	const domainLabels = Array.isArray(policy?.domainLabels) && policy.domainLabels.length > 0
		? policy.domainLabels
		: getDomainLabels(state.domains);
	const scopedDomains = domainLabels.length > 0
		? domainLabels.join(", ")
		: "the requested tool domain";

	const timeWindow = policy?.teamworkGraphTimeWindow;
	const windowDescription = timeWindow?.enabled && timeWindow?.windowDays
		? ` for the last ${timeWindow.windowDays} day${timeWindow.windowDays === 1 ? "" : "s"}`
		: "";

	const causeDescription = state.relevantToolErrors > 0
		? `Tool errors were reported (${state.relevantToolErrors} error${state.relevantToolErrors === 1 ? "" : "s"}).`
		: "No relevant integration tool was called during this turn.";

	const recoveryOptions = [
		{
			id: "jira-only",
			label: "Show Jira work only",
			description: "Search Jira issues using JQL for the requested time window.",
		},
		{
			id: "confluence-only",
			label: "Show Confluence work only",
			description: "Search Confluence pages using CQL for the requested time window.",
		},
		{
			id: "retry-with-identity",
			label: "Retry with my Atlassian user/site ID",
			description: "Re-run the work summary with explicit user and site identity context.",
		},
	];

	return {
		type: "zero-tool-call-recovery",
		title: `Could not retrieve ${scopedDomains} results${windowDescription}`,
		cause: causeDescription,
		recoveryOptions,
		metadata: {
			domains: state.domains,
			primaryDomains: state.primaryDomains,
			attempts: state.attempts,
			retriesUsed: state.retriesUsed,
			relevantToolErrors: state.relevantToolErrors,
			lastRelevantToolName: state.lastRelevantToolName || null,
			lastRelevantErrorCategory: state.lastRelevantErrorCategory || null,
		},
	};
}

function buildWorkSummaryExecutionLog(state, { policy, resolvedPort, durationMs } = {}) {
	if (!state || typeof state !== "object") {
		return null;
	}

	const toolNamesAttempted = Array.isArray(state.events)
		? [...new Set(
			state.events
				.filter((e) => e.phase === "start")
				.map((e) => e.toolName)
		)]
		: [];

	const zeroToolCallCause = (() => {
		if (hasRelevantToolObservation(state)) {
			return null;
		}
		if (state.relevantToolErrors > 0) {
			return `tool_errors:${state.lastRelevantErrorCategory || "unknown"}`;
		}
		if (state.totalToolStarts === 0) {
			return "no_tool_calls_at_all";
		}
		if (!state.hadRelevantToolStart) {
			return "no_relevant_tool_calls";
		}
		return "relevant_tools_started_but_no_observation";
	})();

	return {
		attempts: state.attempts,
		retriesUsed: state.retriesUsed,
		totalToolStarts: state.totalToolStarts,
		totalToolResults: state.totalToolResults,
		totalToolErrors: state.totalToolErrors,
		relevantToolStarts: state.relevantToolStarts,
		relevantToolResults: state.relevantToolResults,
		relevantToolErrors: state.relevantToolErrors,
		hadRelevantToolStart: state.hadRelevantToolStart,
		lastRelevantToolName: state.lastRelevantToolName || null,
		lastRelevantErrorCategory: state.lastRelevantErrorCategory || null,
		toolNamesAttempted,
		zeroToolCallCause,
		resolvedPort: resolvedPort ?? null,
		durationMs: typeof durationMs === "number" && Number.isFinite(durationMs) ? Math.round(durationMs) : null,
		windowDays: policy?.teamworkGraphTimeWindow?.windowDays ?? null,
		windowStart: policy?.teamworkGraphTimeWindow?.startIso ?? null,
		windowEnd: policy?.teamworkGraphTimeWindow?.endIso ?? null,
	};
}

function getPostClarificationDirective(domains) {
	if (!Array.isArray(domains)) {
		return null;
	}

	for (const domainId of domains) {
		const domain = TOOL_FIRST_DOMAIN_MAP.get(domainId);
		if (domain?.postClarificationDirective) {
			return domain.postClarificationDirective;
		}
	}

	return null;
}

module.exports = {
	TOOL_FIRST_DOMAIN_CONFIG,
	TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY,
	resolveToolFirstPolicy,
	resolveUnsatisfiedContextHints,
	getPostClarificationDirective,
	isToolNameRelevant,
	createToolFirstExecutionState,
	recordToolFirstAttempt,
	recordToolThinkingEvent,
	hasRelevantToolSuccess,
	hasRelevantToolObservation,
	isWorkSummaryTurn,
	shouldSuppressToolFirstIntentStatus,
	getToolFirstRetryDelayMs,
	buildToolFirstRetryInstruction,
	buildToolContextForGenui,
	classifyToolErrorCategory,
	buildToolFirstTextFallback,
	stripToolFirstFailureNarrative,
	buildToolFirstWarningPayload,
	buildZeroToolCallRecoverySpec,
	buildWorkSummaryExecutionLog,
};
