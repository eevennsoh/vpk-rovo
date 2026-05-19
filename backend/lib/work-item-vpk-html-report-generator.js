const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {
	extractActiveWorkItemContext,
} = require("../../lib/work-item-report-intent");
const {
	createRepoAgentSkillHarness,
} = require("./agent-skill-harness");
const {
	clipText,
	getNonEmptyString,
	isObjectRecord,
} = require("./shared-utils");

const VPK_HTML_SKILL_NAME = "vpk-html";
const STATUS_REPORT_TEMPLATE_PATH = "assets/templates/status-report.html";
const DACI_ONE_PAGER_TEMPLATE_PATH = "assets/templates/one-pager.html";

const SECTION_LABELS = new Map([
	["buyer priorities:", "buyerPriorities"],
	["evaluation criteria:", "evaluationCriteria"],
	["win themes:", "winThemes"],
	["known risks:", "knownRisks"],
	["next actions:", "nextActions"],
	["response team needs:", "responseTeam"],
	["child work items:", "childItems"],
	["attachments:", "attachments"],
	["recent activity:", "recentActivity"],
]);

function escapeHtml(value) {
	return String(value ?? "")
		.replace(/&/gu, "&amp;")
		.replace(/</gu, "&lt;")
		.replace(/>/gu, "&gt;")
		.replace(/"/gu, "&quot;")
		.replace(/'/gu, "&#39;");
}

function stripTrailingPunctuation(value) {
	return String(value ?? "").replace(/[.!?]+$/u, "").trim();
}

function sentence(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return "";
	}

	return /[.!?]$/u.test(text) ? text : `${text}.`;
}

function uniqueStrings(items) {
	return Array.from(new Set(
		(Array.isArray(items) ? items : [])
			.map((item) => getNonEmptyString(item))
			.filter(Boolean),
	));
}

function formatSeries(items, {
	empty,
	limit = 5,
} = {}) {
	const values = Array.isArray(items)
		? items.map((item) => getNonEmptyString(item)).filter(Boolean)
		: [];
	if (values.length === 0) {
		return empty || "No evidence supplied in the Work Item context.";
	}

	const clipped = values.slice(0, limit).map(stripTrailingPunctuation);
	const suffix = values.length > clipped.length
		? `; plus ${values.length - clipped.length} more`
		: "";
	return `${clipped.join("; ")}${suffix}.`;
}

function formatListItemsHtml(items, {
	empty,
	limit = 6,
} = {}) {
	const values = uniqueStrings(items).slice(0, limit);
	const listItems = values.length > 0 ? values : [empty || "No evidence supplied in the Work Item context."];
	return listItems.map((item) => `<li>${escapeHtml(sentence(item))}</li>`).join("\n");
}

function titleCaseStatus(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return "";
	}

	if (/^todo$/iu.test(text)) return "To do";
	if (/^inprogress$/iu.test(text)) return "In progress";
	return text
		.split(/[\s_-]+/u)
		.map((part) => part ? `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}` : "")
		.join(" ");
}

function extractRolePerson(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return {
			name: null,
			role: null,
		};
	}

	const match = text.match(/^(.+?)\s+\(([^)]+)\)$/u);
	return {
		name: getNonEmptyString(match?.[1]) || text,
		role: getNonEmptyString(match?.[2]),
	};
}

function parseContextFieldSections(activeWorkItemContext) {
	const fields = {};
	const sections = {
		attachments: [],
		buyerPriorities: [],
		childItems: [],
		evaluationCriteria: [],
		knownRisks: [],
		nextActions: [],
		recentActivity: [],
		responseTeam: [],
		winThemes: [],
	};
	let activeSection = null;

	const lines = activeWorkItemContext.replace(/\r\n?/gu, "\n").split("\n");
	for (const rawLine of lines) {
		const line = rawLine.trimEnd();
		const trimmed = line.trim();
		if (
			!trimmed ||
			trimmed === "[Active Jira Work Item Context]" ||
			trimmed === "[End Active Jira Work Item Context]"
		) {
			continue;
		}

		const sectionName = SECTION_LABELS.get(trimmed.toLowerCase());
		if (sectionName) {
			activeSection = sectionName;
			continue;
		}

		if (activeSection && /^\s*-\s+/u.test(line)) {
			sections[activeSection].push(line.replace(/^\s*-\s+/u, "").trim());
			continue;
		}

		activeSection = null;
		const fieldMatch = trimmed.match(/^([^:]+):\s*(.+)$/u);
		if (!fieldMatch) {
			continue;
		}

		fields[fieldMatch[1].trim().toLowerCase()] = fieldMatch[2].trim();
	}

	return {
		fields,
		sections,
	};
}

function parseChildItem(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const match = text.match(/^([A-Z][A-Z0-9]+-\d+):\s+(.+?)\s+\(([^,]+),\s*([^,]+),\s*owner:\s*([^)]+)\)$/iu);
	if (!match) {
		return {
			key: null,
			owner: null,
			priority: null,
			status: null,
			summary: text,
		};
	}

	return {
		key: match[1],
		owner: match[5],
		priority: titleCaseStatus(match[4]),
		status: titleCaseStatus(match[3]),
		summary: match[2],
	};
}

function parseAttachment(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const match = text.match(/^(.+?)\s+\(([^)]+)\)$/u);
	return {
		date: getNonEmptyString(match?.[2]),
		name: getNonEmptyString(match?.[1]) || text,
	};
}

function parseActivity(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const match = text.match(/^(.+?):\s+(.+?)(?:\s+\(([^)]+)\))?\s+-\s+(.+)$/u);
	if (!match) {
		return {
			author: null,
			content: text,
			role: null,
			timestamp: null,
		};
	}

	return {
		author: match[2],
		content: match[4],
		role: getNonEmptyString(match[3]),
		timestamp: match[1],
	};
}

function parseTeamMember(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const match = text.match(/^([^:]+):\s+(.+?)\s+-\s+(.+)$/u);
	if (!match) {
		return {
			need: text,
			owner: null,
			role: null,
		};
	}

	return {
		need: match[3],
		owner: match[2],
		role: match[1],
	};
}

function formatReportingPeriod(startDate, dueDate) {
	const start = getNonEmptyString(startDate);
	const due = getNonEmptyString(dueDate);
	if (!start && !due) {
		return "Timeline gap";
	}
	if (!start) {
		return `Due ${due}`;
	}
	if (!due) {
		return `Started ${start}`;
	}

	const startMatch = start.match(/^(.+?),\s*(\d{4})$/u);
	const dueMatch = due.match(/^(.+?),\s*(\d{4})$/u);
	if (startMatch && dueMatch && startMatch[2] === dueMatch[2]) {
		return `${startMatch[1]} to ${dueMatch[1]}, ${dueMatch[2]}`;
	}

	return `${start} to ${due}`;
}

function collectInformationGaps({
	fields,
	sections,
}) {
	const gaps = [];
	if (!fields["due date"] && !fields["response due date"]) {
		gaps.push("Due date or response deadline is not specified in the Work Item context.");
	}
	if (!fields.assignee) {
		gaps.push("Assignee is not specified in the Work Item context.");
	}
	if (!fields.reporter) {
		gaps.push("Reporter is not specified in the Work Item context.");
	}
	if (sections.attachments.length === 0) {
		gaps.push("Attachment metadata is not available in the Work Item context.");
	}
	if (sections.recentActivity.length === 0) {
		gaps.push("Recent activity is not available in the Work Item context.");
	}

	const joinedContext = [
		...Object.values(fields),
		...Object.values(sections).flat(),
	].join("\n").toLowerCase();
	if (/\brfp\b/u.test(joinedContext) && !/bid\/no-bid decision date|bid no bid decision date/u.test(joinedContext)) {
		gaps.push("Bid/no-bid decision date and approval owner are not specified in the Work Item context.");
	}
	if (/\brfp\b/u.test(joinedContext) && !/budget qualified|qualified budget|budget qualification/u.test(joinedContext)) {
		gaps.push("Client budget qualification is not confirmed in the Work Item context.");
	}
	if (/\brfp\b/u.test(joinedContext) && !/stakeholder relationship|executive sponsor|champion/u.test(joinedContext)) {
		gaps.push("Stakeholder relationship strength is not confirmed in the Work Item context.");
	}
	if (/data residency/u.test(joinedContext) && !/data residency region/u.test(joinedContext)) {
		gaps.push("Required data residency region is not recorded in the Work Item context.");
	}
	if (/reference customers?/u.test(joinedContext) && !/selected reference|reference customer selected/u.test(joinedContext)) {
		gaps.push("Reference customers for the competitor-displacement narrative are not listed.");
	}

	return Array.from(new Set(gaps));
}

function buildFallbackReportFields(activeWorkItemContext) {
	const { fields, sections } = parseContextFieldSections(activeWorkItemContext);
	const childItems = sections.childItems.map(parseChildItem).filter(Boolean);
	const attachments = sections.attachments.map(parseAttachment).filter(Boolean);
	const recentActivity = sections.recentActivity.map(parseActivity).filter(Boolean);
	const responseTeam = sections.responseTeam.map(parseTeamMember).filter(Boolean);
	const assignee = extractRolePerson(fields.assignee);
	const reporter = extractRolePerson(fields.reporter);
	const key = getNonEmptyString(fields.key);
	const title = getNonEmptyString(fields.title) || (key ? `${key} Work Item Report` : "Work Item Report");
	const docTitle = key ? `${key} · ${title}` : title;
	const parent = getNonEmptyString(fields.parent);
	const customer = getNonEmptyString(fields.customer);
	const status = getNonEmptyString(fields.status);
	const priority = getNonEmptyString(fields.priority);
	const knownRisks = sections.knownRisks;
	const nextActions = sections.nextActions;
	const completedChildItems = childItems.filter((item) => /\bdone\b/iu.test(item.status || ""));
	const inProgressChildItems = childItems.filter((item) => /\bin progress\b/iu.test(item.status || ""));
	const todoChildItems = childItems.filter((item) => /\bto do\b/iu.test(item.status || ""));
	const confidence = knownRisks.length >= 3 || todoChildItems.length > 0 ? "Medium" : "High";
	const informationGaps = collectInformationGaps({ fields, sections });
	const activitySummary = recentActivity.map((activity) => {
		const author = [activity.author, activity.role ? `(${activity.role})` : null].filter(Boolean).join(" ");
		return author
			? `${author}: ${activity.content}`
			: activity.content;
	});
	const completedSummary = [
		...completedChildItems.map((item) => `${item.key || "Child item"} is done: ${item.summary}`),
		...inProgressChildItems.map((item) => `${item.key || "Child item"} is in progress with ${item.owner || "an owner not listed"}: ${item.summary}`),
	];
	const blockerSummary = [
		...knownRisks,
		...todoChildItems.map((item) => `${item.key || "Child item"} remains to do with ${item.owner || "an owner not listed"}: ${item.summary}`),
	];
	const attachmentsSummary = attachments.map((attachment) =>
		attachment.date ? `${attachment.name} (${attachment.date})` : attachment.name,
	);
	const teamSummary = responseTeam.map((member) =>
		[member.role, member.owner, member.need].filter(Boolean).join(": "),
	);

	return {
		artifactTitle: title,
		author: assignee.name || reporter.name || "Unassigned owner",
		blockerCount: String(knownRisks.length || todoChildItems.length || 0),
		blockersText: formatSeries(blockerSummary, {
			empty: "No blockers were supplied in the Work Item context.",
			limit: 6,
		}),
		confidence,
		confidenceText: sentence([
			`${confidence} confidence`,
			status ? `status is ${status}` : null,
			priority ? `priority is ${priority}` : null,
			knownRisks.length > 0 ? `${knownRisks.length} risk${knownRisks.length === 1 ? "" : "s"} need active management` : null,
			fields["due date"] ? `deadline is ${fields["due date"]}` : null,
		].filter(Boolean).join("; ")),
		date: getNonEmptyString(fields["start date"]) || getNonEmptyString(fields["due date"]) || new Date().toISOString().slice(0, 10),
		description: clipText(fields.description, 150) || `Status report for ${docTitle}.`,
		docTitle,
		executiveSummary: sentence(fields.description || `${docTitle} is being tracked as a Jira Work Item report.`),
		informationGaps,
		keywords: [
			key,
			customer,
			status,
			"Jira Work Item",
			"status report",
		].filter(Boolean).slice(0, 5).join(", "),
		milestonesText: sentence([
			fields["response due date"] || fields["due date"]
				? `Target date: ${fields["response due date"] || fields["due date"]}`
				: null,
			teamSummary.length > 0 ? `Ownership: ${formatSeries(teamSummary, { limit: 4 })}` : null,
			informationGaps.length > 0 ? `Resolve information gaps: ${formatSeries(informationGaps, { limit: 3 })}` : null,
		].filter(Boolean).join(" ")),
		nextWindowText: formatSeries(nextActions, {
			empty: "Next actions are not specified in the Work Item context.",
			limit: 6,
		}),
		progressText: sentence([
			completedSummary.length > 0
				? formatSeries(completedSummary, { limit: 5 })
				: "No completed child Work Items are listed",
			attachmentsSummary.length > 0
				? `Evidence files available: ${formatSeries(attachmentsSummary, { limit: 4 })}`
				: "Attachment evidence is not listed",
		].join(" ")),
		reportingPeriod: formatReportingPeriod(fields["start date"], fields["due date"] || fields["response due date"]),
		routeHint: key ? `${key} · active work item context` : "active work item context",
		summary: sentence([
			customer ? `${customer} report` : "Work Item report",
			key ? key : null,
			status ? `status: ${status}` : null,
			fields["due date"] ? `due ${fields["due date"]}` : null,
		].filter(Boolean).join(" · ")),
		teamOrContext: parent || customer || "Jira Work Item",
		whatChangedText: formatSeries([
			status ? `${key || "The Work Item"} is in ${status}` : null,
			fields["procurement stage"] ? `Procurement stage: ${fields["procurement stage"]}` : null,
			...activitySummary.slice(0, 3),
		].filter(Boolean), {
			limit: 5,
		}),
	};
}

function isRfpQualificationContext(activeWorkItemContext) {
	const { fields, sections } = parseContextFieldSections(activeWorkItemContext);
	const key = getNonEmptyString(fields.key);
	const joinedContext = [
		...Object.values(fields),
		...Object.values(sections).flat(),
	].join("\n");

	return /^RFP-\d+$/iu.test(key || "") || /\brfp\b/iu.test(joinedContext);
}

function findTeamMember(responseTeam, matcher) {
	return responseTeam.find((member) => {
		const text = [member.role, member.owner, member.need].filter(Boolean).join(" ").toLowerCase();
		return matcher.test(text);
	}) ?? null;
}

function buildFallbackDaciReportFields(activeWorkItemContext) {
	const { fields, sections } = parseContextFieldSections(activeWorkItemContext);
	const childItems = sections.childItems.map(parseChildItem).filter(Boolean);
	const attachments = sections.attachments.map(parseAttachment).filter(Boolean);
	const recentActivity = sections.recentActivity.map(parseActivity).filter(Boolean);
	const responseTeam = sections.responseTeam.map(parseTeamMember).filter(Boolean);
	const assignee = extractRolePerson(fields.assignee);
	const reporter = extractRolePerson(fields.reporter);
	const key = getNonEmptyString(fields.key);
	const customer = getNonEmptyString(fields.customer) || "the client";
	const title = getNonEmptyString(fields.title) || (key ? `${key} RFP qualification` : "RFP qualification");
	const dueDate = getNonEmptyString(fields["response due date"]) || getNonEmptyString(fields["due date"]);
	const dealSize = getNonEmptyString(fields["deal size"]) || getNonEmptyString(fields["seat count"]);
	const knownRisks = sections.knownRisks;
	const buyerPriorities = sections.buyerPriorities;
	const evaluationCriteria = sections.evaluationCriteria;
	const winThemes = sections.winThemes;
	const nextActions = sections.nextActions;
	const informationGaps = collectInformationGaps({ fields, sections });
	const legalApprover = findTeamMember(responseTeam, /\b(legal|security)\b/u);
	const dealDeskApprover = findTeamMember(responseTeam, /\bdeal\s+desk\b/u);
	const driverName = assignee.name || findTeamMember(responseTeam, /\bproposal\b/u)?.owner || "Proposal owner not specified";
	const approverNames = uniqueStrings([
		dealDeskApprover?.owner,
		legalApprover?.owner,
	]);
	const contributorNames = uniqueStrings([
		reporter.name,
		...responseTeam
			.filter((member) => !approverNames.includes(member.owner || "") && member.owner !== driverName)
			.map((member) => member.owner),
	]);
	const inProgressChildItems = childItems.filter((item) => /\bin progress\b/iu.test(item.status || ""));
	const todoChildItems = childItems.filter((item) => /\bto do\b/iu.test(item.status || ""));
	const relationshipEvidence = uniqueStrings([
		reporter.name ? `${reporter.name} is the account contact in the Work Item context` : null,
		assignee.name ? `${assignee.name} is driving proposal coordination` : null,
		...recentActivity.slice(0, 2).map((activity) => activity.content),
	]);
	const openGapItems = uniqueStrings([
		...informationGaps,
		...todoChildItems.map((item) => `${item.key || "Child item"} remains to do: ${item.summary}`),
		...inProgressChildItems.map((item) => `${item.key || "Child item"} is still in progress: ${item.summary}`),
	]);

	return {
		artifactTitle: `${customer} RFP qualification DACI`,
		author: assignee.name || reporter.name || "Unassigned owner",
		budgetText: dealSize
			? `${customer} scale is recorded as ${dealSize}; budget qualification still needs explicit owner confirmation before a full response commitment.`
			: `${customer} budget is not confirmed in the Work Item context; treat budget as a qualification gate before committing response capacity.`,
		calloutText: `Recommendation: respond only if ${customer} confirms budget, stakeholder access, and review owners for legal, security, pricing, and product commitments.`,
		campaignFitText: formatSeries([
			...buyerPriorities.slice(0, 2),
			...evaluationCriteria.slice(0, 2),
		], {
			empty: `${customer} campaign fit needs confirmation against enterprise service-management priorities.`,
			limit: 4,
		}),
		competitiveAdvantages: uniqueStrings(winThemes).length > 0
			? uniqueStrings(winThemes)
			: [
					"Atlassian System of Work can connect service, software, knowledge, and business teams.",
					"Rovo and Teamwork Graph can make RFP evidence reusable and contextual.",
				],
		contributorsText: contributorNames.length > 0
			? `Contributors: ${contributorNames.join(", ")}.`
			: "Contributors: sales engineering, product, legal, security, deal desk, and partner owners need assignment.",
		date: getNonEmptyString(fields["start date"]) || dueDate || new Date().toISOString().slice(0, 10),
		decisionRisks: uniqueStrings(knownRisks).length > 0
			? uniqueStrings(knownRisks)
			: ["Legal, security, pricing, product, and partner commitments still need review."],
		description: clipText(`${customer} RFP qualification DACI covering recommendation, roles, budget, relationship, campaign fit, advantages, risks, and open gaps.`, 150),
		docTitle: `${customer} RFP qualification DACI`,
		driverText: `Driver: ${driverName}.`,
		eyebrow: "RFP Qualification / DACI",
		footerLeft: "Internal qualification draft",
		footerRight: key ? `${key} · ${customer}` : customer,
		headline: `${customer} RFP qualification DACI`,
		includeAtlassianLogo: false,
		informedText: "Informed: response leadership, support, partner teams, and executive stakeholders after the bid/no-bid decision is recorded.",
		keywords: uniqueStrings([
			key,
			customer,
			"RFP qualification",
			"DACI",
			"bid recommendation",
		]).slice(0, 5).join(", "),
		metricPairs: [
			{ label: "client", value: customer },
			{ label: "decision", value: "Qualify" },
			{ label: "due", value: dueDate || "Gap" },
			{ label: "open gaps", value: String(openGapItems.length || 1) },
		],
		openGaps: openGapItems.length > 0 ? openGapItems : ["No open gaps were supplied in the Work Item context."],
		approverText: approverNames.length > 0
			? `Approver: ${approverNames.join(" and ")}.`
			: "Approver: deal desk plus legal/security approver not fully confirmed.",
		recommendationText: `Provisional recommendation: respond to ${customer} if the team confirms budget, stakeholder access, and review ownership for high-risk commitments before final drafting.`,
		relationshipText: formatSeries(relationshipEvidence, {
			empty: `${customer} stakeholder relationship strength is not documented; confirm champion and executive sponsor access.`,
			limit: 4,
		}),
		roadmap: [
			{ head: "Qualify", body: "Confirm budget, stakeholder access, and mandatory deal-breaker requirements before committing the full response team." },
			{ head: "Own", body: `Lock Driver, Approver, Contributors, and Informed stakeholders so risky ${customer} answers have named decision owners.` },
			{ head: "Respond", body: "Draft only after open gaps have owners and the bid/no-bid recommendation is recorded." },
		],
		statusText: fields.status ? `${fields.status} · ${fields.priority || "Priority unknown"}` : "Qualification draft",
		subtitle: `${key || "RFP"} · should we respond to this RFP?`,
		title,
		nextActions,
		attachments,
	};
}

function parseJsonObjectFromText(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const stripped = text
		.replace(/^```(?:json)?\s*/iu, "")
		.replace(/\s*```$/u, "")
		.trim();
	const candidate = stripped.startsWith("{")
		? stripped
		: stripped.match(/\{[\s\S]*\}/u)?.[0];
	if (!candidate) {
		return null;
	}

	try {
		const parsed = JSON.parse(candidate);
		return isObjectRecord(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function pickDistilledString(distilledFields, key) {
	const value = distilledFields?.[key];
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function mergeDistilledReportFields(fallbackFields, distilledFields) {
	if (!isObjectRecord(distilledFields)) {
		return fallbackFields;
	}

	const overridableKeys = [
		"blockersText",
		"confidenceText",
		"executiveSummary",
		"milestonesText",
		"nextWindowText",
		"progressText",
		"summary",
		"whatChangedText",
	];
	const merged = {
		...fallbackFields,
	};

	for (const key of overridableKeys) {
		const value = pickDistilledString(distilledFields, key);
		if (value) {
			merged[key] = value;
		}
	}

	if (Array.isArray(distilledFields.informationGaps)) {
		const nextGaps = distilledFields.informationGaps
			.map((gap) => getNonEmptyString(gap))
			.filter(Boolean);
		if (nextGaps.length > 0) {
			merged.informationGaps = Array.from(new Set([
				...fallbackFields.informationGaps,
				...nextGaps,
			]));
		}
	}

	return merged;
}

function mergeDistilledDaciReportFields(fallbackFields, distilledFields) {
	if (!isObjectRecord(distilledFields)) {
		return fallbackFields;
	}

	const merged = {
		...fallbackFields,
	};
	const overridableStringKeys = [
		"budgetText",
		"calloutText",
		"campaignFitText",
		"contributorsText",
		"description",
		"driverText",
		"informedText",
		"approverText",
		"recommendationText",
		"relationshipText",
		"statusText",
		"subtitle",
	];
	for (const key of overridableStringKeys) {
		const value = pickDistilledString(distilledFields, key);
		if (value) {
			merged[key] = value;
		}
	}

	for (const [key, limit] of [
		["competitiveAdvantages", 6],
		["decisionRisks", 6],
		["openGaps", 6],
		["informationGaps", 6],
	]) {
		if (!Array.isArray(distilledFields[key])) {
			continue;
		}
		const values = uniqueStrings(distilledFields[key]).slice(0, limit);
		if (values.length === 0) {
			continue;
		}
		if (key === "informationGaps") {
			merged.openGaps = uniqueStrings([
				...merged.openGaps,
				...values,
			]);
			continue;
		}
		merged[key] = values;
	}
	if (distilledFields.includeAtlassianLogo === true) {
		merged.includeAtlassianLogo = true;
	}

	return merged;
}

async function distillStructuredReportFields({
	activeWorkItemContext,
	generateText,
	provider,
	reportKind = "status-report",
	signal,
}) {
	if (typeof generateText !== "function") {
		return null;
	}

	const isDaciReport = reportKind === "rfp-qualification-daci";
	const system = isDaciReport
		? [
				"You extract structured fields for an RFP qualification DACI one-pager.",
				"Use only facts present in the supplied context. Do not invent dates, owners, metrics, budget status, stakeholder relationships, or evidence.",
				"Return only valid JSON. No markdown.",
			].join(" ")
		: [
				"You extract structured fields for a Jira Work Item status report.",
				"Use only facts present in the supplied context. Do not invent dates, owners, metrics, or evidence.",
				"Return only valid JSON. No markdown.",
			].join(" ");
	const prompt = isDaciReport
		? [
				"Extract concise RFP qualification DACI fields from this Work Item context.",
				"Schema:",
				"{",
				'  "recommendationText": "one evidence-backed bid/no-bid recommendation paragraph",',
				'  "driverText": "Driver: name and role",',
				'  "approverText": "Approver: name(s) and role(s)",',
				'  "contributorsText": "Contributors: name(s) and role(s)",',
				'  "informedText": "Informed: group(s) or stakeholder(s)",',
				'  "relationshipText": "one paragraph on stakeholder relationship strength",',
				'  "budgetText": "one paragraph on whether client budget is qualified",',
				'  "campaignFitText": "one paragraph on campaign fit",',
				'  "competitiveAdvantages": ["concise advantages"],',
				'  "decisionRisks": ["concise decision risks"],',
				'  "openGaps": ["concise missing evidence statements"]',
				"}",
				"",
				activeWorkItemContext,
			].join("\n")
		: [
				"Extract concise report fields from this Work Item context.",
				"Schema:",
				"{",
				'  "summary": "one sentence",',
				'  "whatChangedText": "one evidence-backed paragraph",',
				'  "confidenceText": "one evidence-backed paragraph",',
				'  "progressText": "one evidence-backed paragraph",',
				'  "blockersText": "one evidence-backed paragraph",',
				'  "nextWindowText": "one evidence-backed paragraph",',
				'  "milestonesText": "one evidence-backed paragraph",',
				'  "informationGaps": ["concise missing evidence statements"]',
				"}",
				"",
				activeWorkItemContext,
			].join("\n");
	const rawText = await generateText({
		maxOutputTokens: 1600,
		prompt,
		provider,
		signal,
		system,
		temperature: 0.1,
	});

	return parseJsonObjectFromText(rawText);
}

function buildChecklistHtml(informationGaps) {
	const gaps = Array.isArray(informationGaps) && informationGaps.length > 0
		? informationGaps
		: ["No major information gaps were detected in the supplied Work Item context."];

	return [
		'\t\t<aside class="checklist">',
		"\t\t\t<h2>Information gaps</h2>",
		"\t\t\t<ul>",
		...gaps.slice(0, 6).map((gap) => `\t\t\t<li>${escapeHtml(gap)}</li>`),
		"\t\t\t</ul>",
		"\t\t</aside>",
	].join("\n");
}

function fillStatusReportTemplate(templateHtml, reportFields) {
	const escapedParagraph = (value) => escapeHtml(sentence(value));
	const replacements = new Map([
		["{{AUTHOR}}", escapeHtml(reportFields.author)],
		["{{BLOCKER_COUNT}}", escapeHtml(reportFields.blockerCount)],
		["{{CONFIDENCE}}", escapeHtml(reportFields.confidence)],
		["{{DATE}}", escapeHtml(reportFields.date)],
		["{{DESCRIPTION}}", escapeHtml(reportFields.description)],
		["{{DOC_TITLE}}", escapeHtml(reportFields.docTitle)],
		["{{KEYWORDS}}", escapeHtml(reportFields.keywords)],
		["{{REPORTING_PERIOD}}", escapeHtml(reportFields.reportingPeriod)],
		["{{TEAM_OR_CONTEXT}}", escapeHtml(reportFields.teamOrContext)],
		["{{What changed since the last update.}}", escapedParagraph(reportFields.whatChangedText)],
		["{{Current confidence and why.}}", escapedParagraph(reportFields.confidenceText)],
		["{{Shipped or completed work.}}", escapedParagraph(reportFields.progressText)],
		["{{Blocked or slipping work with owner and next action.}}", escapedParagraph(reportFields.blockersText)],
		["{{What happens next and what decision/help is needed.}}", escapedParagraph(reportFields.nextWindowText)],
		["{{Validation or delivery milestones.}}", escapedParagraph(reportFields.milestonesText)],
	]);

	let html = templateHtml;
	for (const [placeholder, value] of replacements) {
		html = html.split(placeholder).join(value);
	}

	html = html
		.replace(
			/<p class="summary">[\s\S]*?<\/p>/u,
			`<p class="summary">${escapeHtml(reportFields.summary)}</p>`,
		)
		.replace(
			/(<p class="source-label">Route hint<\/p>\s*)<p>[\s\S]*?<\/p>/u,
			`$1<p>${escapeHtml(reportFields.routeHint)}</p>`,
		)
		.replace(
			/<aside class="checklist">[\s\S]*?<\/aside>/u,
			buildChecklistHtml(reportFields.informationGaps),
		);

	return html;
}

function buildMetricHtml(metricPairs) {
	const metrics = Array.isArray(metricPairs) ? metricPairs.slice(0, 4) : [];
	while (metrics.length < 4) {
		metrics.push({ label: "metric", value: "Gap" });
	}

	return metrics.map((metric) => [
		'\t<div class="metric">',
		`\t\t<div class="metric-value">${escapeHtml(metric.value)}</div>`,
		`\t\t<div class="metric-label">${escapeHtml(metric.label)}</div>`,
		"\t</div>",
	].join("\n")).join("\n");
}

function buildRoadmapHtml(roadmap) {
	const steps = Array.isArray(roadmap) && roadmap.length >= 3
		? roadmap.slice(0, 3)
		: [
				{ head: "Qualify", body: "Confirm budget, stakeholders, and mandatory requirements." },
				{ head: "Own", body: "Lock DACI owners for risky commitments." },
				{ head: "Respond", body: "Draft only after the bid/no-bid decision is recorded." },
			];

	return steps.map((step, index) => [
		'\t\t<div class="tl-step">',
		`\t\t\t<div class="tl-year">Phase ${index + 1}</div>`,
		`\t\t\t<div class="tl-head">${escapeHtml(step.head)}</div>`,
		`\t\t\t<div class="tl-body">${escapeHtml(step.body)}</div>`,
		"\t\t</div>",
	].join("\n")).join("\n");
}

function fillDaciOnePagerTemplate(templateHtml, reportFields) {
	const metaReplacements = new Map([
		["{{AUTHOR}}", escapeHtml(reportFields.author)],
		["{{DESCRIPTION}}", escapeHtml(reportFields.description)],
		["{{DOC_TITLE}}", escapeHtml(reportFields.docTitle)],
		["{{KEYWORDS}}", escapeHtml(reportFields.keywords)],
	]);
	let html = templateHtml;
	for (const [placeholder, value] of metaReplacements) {
		html = html.split(placeholder).join(value);
	}

	const body = [
		"<body>",
		"<main>",
		"",
		'<div class="header">',
		reportFields.includeAtlassianLogo
			? [
					'\t<div aria-label="Atlassian" style="align-items:center;display:flex;gap:8px;margin-right:24px;min-width:132px;">',
					'\t\t<svg aria-hidden="true" focusable="false" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">',
					'\t\t\t<path d="M7.4 4.2c.5-.9 1.8-.9 2.3 0l6.6 11.6c.5.9-.1 2-1.1 2h-3.1c-.5 0-1-.3-1.2-.7L7.4 11 4 17.1c-.2.4-.7.7-1.2.7H.9c-1 0-1.6-1.1-1.1-2L7.4 4.2Z" fill="var(--primary-blue)" transform="translate(2 1)"/>',
					'\t\t\t<path d="M14.3 4.2c.5-.9 1.8-.9 2.3 0l7.6 13.6h-4.1c-.5 0-1-.3-1.2-.7L12.5 5.7l1.8-1.5Z" fill="var(--link)" transform="translate(-2 1)"/>',
					"\t\t</svg>",
					'\t\t<span style="color:var(--body-text);font-size:13px;font-weight:700;letter-spacing:0;">Atlassian</span>',
					"\t</div>",
				].join("\n")
			: "",
		'\t<div class="title-block">',
		`\t\t<div class="eyebrow">${escapeHtml(reportFields.eyebrow)}</div>`,
		`\t\t<h1>${escapeHtml(reportFields.headline)}</h1>`,
		`\t\t<div class="subtitle">${escapeHtml(reportFields.subtitle)}</div>`,
		"\t</div>",
		'\t<div class="meta">',
		`\t\t${escapeHtml(reportFields.author)}<br>`,
		`\t\t${escapeHtml(reportFields.date)}<br>`,
		`\t\t${escapeHtml(reportFields.statusText)}`,
		"\t</div>",
		"</div>",
		"",
		'<div class="metrics">',
		buildMetricHtml(reportFields.metricPairs),
		"</div>",
		"",
		`<p class="lead">${escapeHtml(sentence(reportFields.recommendationText))}</p>`,
		"",
		'<div class="two-col">',
		"\t<section>",
		"\t\t<h2>DACI roles</h2>",
		`\t\t<p>${escapeHtml("Decision-making ownership for the qualification phase is intentionally explicit so the response team can avoid drafting around unresolved approval gaps.")}</p>`,
		'\t\t<ul class="dash">',
		`\t\t\t<li>${escapeHtml(reportFields.driverText)}</li>`,
		`\t\t\t<li>${escapeHtml(reportFields.approverText)}</li>`,
		`\t\t\t<li>${escapeHtml(reportFields.contributorsText)}</li>`,
		`\t\t\t<li>${escapeHtml(reportFields.informedText)}</li>`,
		"\t\t</ul>",
		"\t</section>",
		"",
		"\t<section>",
		"\t\t<h2>Qualification readout</h2>",
		`\t\t<p>${escapeHtml(sentence(reportFields.relationshipText))}</p>`,
		'\t\t<ul class="dash">',
		`\t\t\t<li>${escapeHtml(sentence(reportFields.budgetText))}</li>`,
		`\t\t\t<li>${escapeHtml(sentence(reportFields.campaignFitText))}</li>`,
		`\t\t\t<li>${escapeHtml(`Competitive advantages: ${formatSeries(reportFields.competitiveAdvantages, { limit: 3 })}`)}</li>`,
		"\t\t</ul>",
		"\t</section>",
		"</div>",
		"",
		"<section>",
		"\t<h2>Decision path<span class=\"sub\">qualification before response drafting</span></h2>",
		'\t<div class="timeline">',
		buildRoadmapHtml(reportFields.roadmap),
		"\t</div>",
		"</section>",
		"",
		'<section>',
		"\t<h2>Decision risks and open gaps</h2>",
		'\t<div class="two-col">',
		"\t\t<div>",
		"\t\t\t<h3>Decision risks</h3>",
		'\t\t\t<ul class="dash">',
		formatListItemsHtml(reportFields.decisionRisks, { empty: "No decision risks were supplied in the Work Item context." }),
		"\t\t\t</ul>",
		"\t\t</div>",
		"\t\t<div>",
		"\t\t\t<h3>Open gaps</h3>",
		'\t\t\t<ul class="dash">',
		formatListItemsHtml(reportFields.openGaps, { empty: "No open gaps were supplied in the Work Item context." }),
		"\t\t\t</ul>",
		"\t\t</div>",
		"\t</div>",
		"</section>",
		"",
		`<div class="callout">${escapeHtml(sentence(reportFields.calloutText))}</div>`,
		"",
		'<div class="footer">',
		`\t<span>${escapeHtml(reportFields.footerLeft)}</span>`,
		`\t<span>${escapeHtml(reportFields.footerRight)}</span>`,
		"</div>",
		"",
		"</main>",
		"</body>",
	].join("\n");

	return html.replace(/<body>[\s\S]*?<\/body>/u, body);
}

function assertVpkHtmlReportContract(html) {
	if (!/<!doctype html>/iu.test(html) || !/<html[\s>]/iu.test(html)) {
		throw new Error("vpk-html report generation did not return a complete HTML document.");
	}
	if (/\{\{[^}]+\}\}/u.test(html)) {
		throw new Error("vpk-html report generation left unresolved placeholders.");
	}
	if (!/<meta\s+name="generator"\s+content="vpk-html">/iu.test(html)) {
		throw new Error("vpk-html report generation did not preserve the generator metadata.");
	}
	if (!/font-family:\s*"Charlie Display"/u.test(html) || !/--grid-background/u.test(html) || !/(class="masthead"|class="header")/u.test(html)) {
		throw new Error("vpk-html report generation did not preserve the template visual identity.");
	}
	if (!/<main\b/iu.test(html)) {
		throw new Error("vpk-html report generation did not preserve the main landmark.");
	}
	if (
		/<script\b[^>]*\bsrc=["']https?:\/\//iu.test(html) ||
		/<link\b[^>]*\bhref=["']https?:\/\//iu.test(html) ||
		/<(?:img|source|iframe|audio|video|object|embed)\b[^>]*(?:src|data|poster)=["']https?:\/\//iu.test(html) ||
		/url\(\s*["']?https?:\/\//iu.test(html) ||
		/@import\s+(?:url\()?["']?https?:\/\//iu.test(html)
	) {
		throw new Error("vpk-html report generation included remote runtime dependencies.");
	}
}

async function runVpkHtmlValidationScripts({
	harness,
	html,
	runVisualVerify = false,
	signal,
}) {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-html-report-"));
	const reportPath = path.join(tempDir, "report.html");

	try {
		await fs.writeFile(reportPath, html, "utf8");
		const results = [];
		results.push(await harness.runSkillScript(
			VPK_HTML_SKILL_NAME,
			"scripts/build.mjs",
			["--check-placeholders", reportPath],
			{ signal },
		));
		results.push(await harness.runSkillScript(
			VPK_HTML_SKILL_NAME,
			"scripts/check-html.mjs",
			[reportPath],
			{ signal },
		));
		if (runVisualVerify) {
			results.push(await harness.runSkillScript(
				VPK_HTML_SKILL_NAME,
				"scripts/build.mjs",
				["--verify", reportPath],
				{ signal, timeoutMs: 60_000 },
			));
		}
		return {
			reportPath,
			results,
		};
	} finally {
		await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
	}
}

async function generateWorkItemVpkHtmlReport({
	contextDescription,
	generateText,
	harness = createRepoAgentSkillHarness(),
	provider,
	runSkillValidation = true,
	runVisualVerify = false,
	signal,
} = {}) {
	const activeWorkItemContext = extractActiveWorkItemContext(contextDescription);
	if (!activeWorkItemContext) {
		throw new Error("Cannot generate a vpk-html Work Item report without active Work Item context.");
	}

	const skillMetadata = await harness.loadSkillMetadata(VPK_HTML_SKILL_NAME);
	const skill = await harness.loadSkill(VPK_HTML_SKILL_NAME);
	const reportKind = isRfpQualificationContext(activeWorkItemContext)
		? "rfp-qualification-daci"
		: "status-report";
	const templatePath = reportKind === "rfp-qualification-daci"
		? DACI_ONE_PAGER_TEMPLATE_PATH
		: STATUS_REPORT_TEMPLATE_PATH;
	const templateHtml = await harness.readSkillFile(
		VPK_HTML_SKILL_NAME,
		templatePath,
	);
	const fallbackFields = reportKind === "rfp-qualification-daci"
		? buildFallbackDaciReportFields(activeWorkItemContext)
		: buildFallbackReportFields(activeWorkItemContext);
	let distilledFields = null;
	try {
		distilledFields = await distillStructuredReportFields({
			activeWorkItemContext,
			generateText,
			provider,
			reportKind,
			signal,
		});
	} catch (error) {
		console.warn(
			"[VPK-HTML] AI Gateway report distillation failed; using deterministic Work Item fields:",
			error instanceof Error ? error.message : error,
		);
	}

	const reportFields = reportKind === "rfp-qualification-daci"
		? mergeDistilledDaciReportFields(fallbackFields, distilledFields)
		: mergeDistilledReportFields(fallbackFields, distilledFields);
	const html = reportKind === "rfp-qualification-daci"
		? fillDaciOnePagerTemplate(templateHtml, reportFields)
		: fillStatusReportTemplate(templateHtml, reportFields);
	assertVpkHtmlReportContract(html);
	const validation = runSkillValidation
		? await runVpkHtmlValidationScripts({
				harness,
				html,
				runVisualVerify,
				signal,
			})
		: null;

	return {
		artifactTitle: reportFields.artifactTitle,
		html,
		skill: {
			description: skillMetadata.description,
			name: skill.name,
			root: skill.skillRoot,
			templatePath,
		},
		validation,
	};
}

module.exports = {
	DACI_ONE_PAGER_TEMPLATE_PATH,
	STATUS_REPORT_TEMPLATE_PATH,
	VPK_HTML_SKILL_NAME,
	assertVpkHtmlReportContract,
	buildFallbackDaciReportFields,
	buildFallbackReportFields,
	fillDaciOnePagerTemplate,
	fillStatusReportTemplate,
	generateWorkItemVpkHtmlReport,
	parseContextFieldSections,
	runVpkHtmlValidationScripts,
};
