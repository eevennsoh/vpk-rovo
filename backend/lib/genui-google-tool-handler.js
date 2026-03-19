const { getNonEmptyString, isObjectRecord, normalizeSentence, pluralize, parseMaybeJson } = require("./shared-utils");

const DEFAULT_MAX_ITEMS = 10;
const MAX_SCAN_NODES = 240;
const MAX_LABEL_LENGTH = 180;
const CALENDAR_SCOPE_PROMPT_PATTERNS = [
	{ pattern: /\btoday\b/i, label: "Today" },
	{ pattern: /\btomorrow\b/i, label: "Tomorrow" },
	{ pattern: /\bthis\s+week\b/i, label: "This week" },
	{ pattern: /\bnext\s+week\b/i, label: "Next week" },
	{ pattern: /\bthis\s+month\b/i, label: "This month" },
	{ pattern: /\bnext\s+month\b/i, label: "Next month" },
];

function clipText(value, maxLength = MAX_LABEL_LENGTH) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function isGenericToolTitle(value) {
	const normalized = normalizeSentence(value);
	return normalized === "tool results" || normalized === "tool result";
}

function isGenericToolDescription(value) {
	const normalized = normalizeSentence(value);
	return (
		normalized === "generated from tool execution results and errors" ||
		normalized === "generated from successful integration tool calls" ||
		normalized === "generated from successful and failed tool executions" ||
		normalized === "generated from tool executions"
	);
}

function resolveCandidateTitle(title, fallbackTitle) {
	const explicitTitle = clipText(title, 80);
	if (explicitTitle && !isGenericToolTitle(explicitTitle)) {
		return explicitTitle;
	}

	return fallbackTitle;
}

function resolveCandidateDescription(
	description,
	fallbackDescription,
	{ resultCount = 0 } = {}
) {
	const explicitDescription = clipText(description, 140);
	if (!explicitDescription) {
		return fallbackDescription;
	}

	if (resultCount > 0 && isGenericToolDescription(explicitDescription)) {
		return fallbackDescription;
	}

	return explicitDescription;
}

function toStructuredPayload(rawValue) {
	if (rawValue === null || rawValue === undefined) {
		return null;
	}

	if (Array.isArray(rawValue) || isObjectRecord(rawValue)) {
		return rawValue;
	}

	if (typeof rawValue === "string") {
		return parseMaybeJson(rawValue);
	}

	return null;
}

function normalizeToolName(toolName) {
	const normalized = getNonEmptyString(toolName);
	if (!normalized) {
		return "";
	}

	return normalized
		.toLowerCase()
		.replace(/[_:/.-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function detectGoogleDomainFromToolName(toolName) {
	const normalized = normalizeToolName(toolName);
	if (!normalized || !normalized.includes("google")) {
		return null;
	}

	if (
		/\bcalendar\b/.test(normalized)
	) {
		return "calendar";
	}

	if (
		/\b(drive|docs?|sheets?|slides?)\b/.test(normalized)
	) {
		return "drive";
	}

	return null;
}

function detectPreferredDomainFromPrompt(prompt) {
	const normalized = getNonEmptyString(prompt)?.toLowerCase() ?? "";
	if (!normalized) {
		return null;
	}

	if (/\bgoogle\s+calendar\b|\bcalendar\b/.test(normalized)) {
		return "calendar";
	}

	if (
		/\bgoogle\s+drive\b|\bdrive\b|\bgoogle\s+docs?\b|\bgoogle\s+sheets?\b|\bgoogle\s+slides?\b/.test(
			normalized
		)
	) {
		return "drive";
	}

	return null;
}

function walkNodes(rootValue, visit, maxNodes = MAX_SCAN_NODES) {
	const queue = [rootValue];
	let visited = 0;

	while (queue.length > 0 && visited < maxNodes) {
		const value = queue.shift();
		if (value === undefined || value === null) {
			continue;
		}

		visited += 1;
		visit(value);

		if (Array.isArray(value)) {
			for (const entry of value) {
				queue.push(entry);
			}
			continue;
		}

		if (isObjectRecord(value)) {
			for (const nested of Object.values(value)) {
				queue.push(nested);
			}
		}
	}
}

function firstString(record, keys) {
	if (!isObjectRecord(record)) {
		return null;
	}

	for (const key of keys) {
		const candidate = clipText(record[key]);
		if (candidate) {
			return candidate;
		}
	}

	return null;
}

function resolveDateValue(rawValue) {
	if (typeof rawValue === "string") {
		return clipText(rawValue, 80);
	}

	if (!isObjectRecord(rawValue)) {
		return null;
	}

	return firstString(rawValue, [
		"dateTime",
		"date",
		"time",
		"iso",
		"value",
	]);
}

function formatTime(isoString) {
	const resolved = resolveDateValue(isoString);
	if (!resolved) {
		return null;
	}

	const parsed = new Date(resolved);
	if (Number.isNaN(parsed.getTime())) {
		return resolved;
	}

	const hours = parsed.getHours();
	const minutes = parsed.getMinutes();
	const period = hours >= 12 ? "PM" : "AM";
	const displayHours = hours % 12 || 12;
	const displayMinutes = minutes === 0 ? "" : `:${String(minutes).padStart(2, "0")}`;
	return `${displayHours}${displayMinutes} ${period}`;
}

function computeDuration(startValue, endValue) {
	const startResolved = resolveDateValue(startValue);
	const endResolved = resolveDateValue(endValue);
	if (!startResolved || !endResolved) {
		return null;
	}

	const startDate = new Date(startResolved);
	const endDate = new Date(endResolved);
	if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
		return null;
	}

	const diffMs = endDate.getTime() - startDate.getTime();
	if (diffMs <= 0) {
		return null;
	}

	const totalMinutes = Math.round(diffMs / 60000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours > 0 && minutes > 0) {
		return `${hours} hr ${minutes} min`;
	}
	if (hours > 0) {
		return `${hours} hr`;
	}
	return `${minutes} min`;
}

function formatDateRange(startValue, endValue) {
	const start = resolveDateValue(startValue);
	const end = resolveDateValue(endValue);
	if (start && end) {
		return `${start} -> ${end}`;
	}
	if (start) {
		return `Starts: ${start}`;
	}
	if (end) {
		return `Ends: ${end}`;
	}
	return null;
}

function toValidDate(rawValue) {
	const resolved = resolveDateValue(rawValue);
	if (!resolved) {
		return null;
	}

	const parsed = new Date(resolved);
	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	return parsed;
}

function formatDateWithTimeZone(date, { timeZone, locale = "en-US", options }) {
	const formatterOptions = {
		...options,
		...(timeZone ? { timeZone } : {}),
	};
	try {
		return new Intl.DateTimeFormat(locale, formatterOptions).format(date);
	} catch {
		return new Intl.DateTimeFormat(locale, options).format(date);
	}
}

function toDateKey(date, timeZone) {
	return formatDateWithTimeZone(date, {
		timeZone,
		locale: "en-CA",
		options: { year: "numeric", month: "2-digit", day: "2-digit" },
	});
}

function toShortDateLabel(date, timeZone) {
	return formatDateWithTimeZone(date, {
		timeZone,
		locale: "en-US",
		options: { month: "short", day: "numeric" },
	});
}

function normalizeCalendarEvent(rawEvent) {
	if (!isObjectRecord(rawEvent)) {
		return null;
	}

	const rawTitle = firstString(rawEvent, ["summary", "title", "name"]);
	const rawStart = rawEvent.start ?? rawEvent.startTime ?? rawEvent.begin;
	const rawEnd = rawEvent.end ?? rawEvent.endTime ?? rawEvent.finish;
	const startDateValue = resolveDateValue(rawStart);
	const endDateValue = resolveDateValue(rawEnd);
	const when = formatDateRange(startDateValue, endDateValue);
	const startTime = formatTime(rawStart);
	const duration = computeDuration(rawStart, rawEnd);
	const location = firstString(rawEvent, ["location"]);
	const status = firstString(rawEvent, ["status"]);
	const link = firstString(rawEvent, [
		"htmlLink",
		"webViewLink",
		"url",
		"link",
		"alternateLink",
	]);
	const id = firstString(rawEvent, ["id", "eventId"]);

	if (!rawTitle && !when && !location && !status && !link && !id) {
		return null;
	}

	return {
		id,
		title: rawTitle || "Untitled event",
		when,
		startDateValue,
		startTime,
		duration,
		location,
		status,
		link,
	};
}

function normalizeDriveFile(rawFile) {
	if (!isObjectRecord(rawFile)) {
		return null;
	}

	const rawName = firstString(rawFile, ["name", "title", "filename"]);
	const mimeType = firstString(rawFile, ["mimeType", "type"]);
	const modifiedTime = firstString(rawFile, [
		"modifiedTime",
		"modified",
		"updatedTime",
		"updated",
	]);
	const link = firstString(rawFile, [
		"webViewLink",
		"alternateLink",
		"url",
		"htmlLink",
		"link",
	]);
	const id = firstString(rawFile, ["id", "fileId"]);

	let owner = null;
	if (Array.isArray(rawFile.owners) && rawFile.owners.length > 0) {
		const firstOwner = rawFile.owners[0];
		if (isObjectRecord(firstOwner)) {
			owner = firstString(firstOwner, ["displayName", "name", "emailAddress", "email"]);
		}
	}
	if (!owner) {
		owner = firstString(rawFile, ["owner", "ownerName"]);
	}

	if (!rawName && !mimeType && !modifiedTime && !owner && !link && !id) {
		return null;
	}

	return {
		id,
		name: rawName || "Untitled file",
		mimeType,
		modifiedTime,
		owner,
		link,
	};
}

function collectArraysByKeys(payloads, keys) {
	const normalizedKeys = new Set(keys.map((key) => key.toLowerCase()));
	const arrays = [];
	for (const payload of payloads) {
		if (Array.isArray(payload)) {
			arrays.push(payload);
		}

		walkNodes(payload, (node) => {
			if (!isObjectRecord(node)) {
				return;
			}

			for (const [key, value] of Object.entries(node)) {
				if (!Array.isArray(value)) {
					continue;
				}
				if (normalizedKeys.has(key.toLowerCase())) {
					arrays.push(value);
				}
			}
		});
	}

	return arrays;
}

function dedupeBy(items, keyFn) {
	const seen = new Set();
	const result = [];
	for (const item of items) {
		const key = keyFn(item);
		if (!key || seen.has(key)) {
			continue;
		}
		seen.add(key);
		result.push(item);
	}
	return result;
}

function extractCalendarData(payloads, maxItems) {
	const arrays = collectArraysByKeys(payloads, ["events", "items"]);
	const normalizedEvents = [];
	for (const collection of arrays) {
		for (const entry of collection) {
			const normalized = normalizeCalendarEvent(entry);
			if (normalized) {
				normalizedEvents.push(normalized);
			}
		}
	}

	const dedupedEvents = dedupeBy(normalizedEvents, (event) =>
		[event.id, event.link, event.title, event.when].filter(Boolean).join("|")
	);
	const limitedEvents = dedupedEvents.slice(0, maxItems);

	let calendarId = null;
	let timeZone = null;
	let calendarName = null;
	let timeMin = null;
	let timeMax = null;
	let message = null;
	for (const payload of payloads) {
		if (isObjectRecord(payload)) {
			if (!calendarId) {
				calendarId = firstString(payload, ["calendarId"]);
			}
			if (!timeZone) {
				timeZone = firstString(payload, ["timeZone", "timezone"]);
			}
			if (!calendarName) {
				calendarName = firstString(payload, ["summary", "name", "title"]);
			}
			if (!timeMin) {
				timeMin = firstString(payload, ["timeMin", "rangeStart", "startDate", "startDateTime"]);
			}
			if (!timeMax) {
				timeMax = firstString(payload, ["timeMax", "rangeEnd", "endDate", "endDateTime"]);
			}
			if (!message) {
				message = firstString(payload, ["message", "note", "description"]);
			}
		}

		walkNodes(payload, (node) => {
			if (!isObjectRecord(node)) {
				return;
			}

			if (!calendarId) {
				calendarId = firstString(node, ["calendarId"]);
			}
			if (!timeZone) {
				timeZone = firstString(node, ["timeZone", "timezone"]);
			}
			if (!calendarName) {
				const hasCalendarContext =
					Object.prototype.hasOwnProperty.call(node, "calendarId") ||
					Object.prototype.hasOwnProperty.call(node, "timeZone") ||
					Object.prototype.hasOwnProperty.call(node, "timezone") ||
					Object.prototype.hasOwnProperty.call(node, "calendarName") ||
					Object.prototype.hasOwnProperty.call(node, "calendarSummary");
				if (hasCalendarContext) {
					calendarName = firstString(node, ["calendarName", "calendarSummary", "summary", "name", "title"]);
				}
			}
			if (!timeMin) {
				timeMin = firstString(node, ["timeMin", "rangeStart", "startDate", "startDateTime"]);
			}
			if (!timeMax) {
				timeMax = firstString(node, ["timeMax", "rangeEnd", "endDate", "endDateTime"]);
			}
			if (!message) {
				message = firstString(node, ["message", "note", "description"]);
			}
		});
	}

	return {
		events: limitedEvents,
		totalEvents: dedupedEvents.length,
		info: {
			calendarId,
			timeZone,
			calendarName,
			timeMin,
			timeMax,
			message,
		},
	};
}

function resolveCalendarScopeLabel(prompt, data) {
	const promptText = getNonEmptyString(prompt);
	for (const matcher of CALENDAR_SCOPE_PROMPT_PATTERNS) {
		if (matcher.pattern.test(promptText ?? "")) {
			return matcher.label;
		}
	}

	const rangeStart = toValidDate(data.info.timeMin);
	const rangeEnd = toValidDate(data.info.timeMax);
	if (rangeStart && rangeEnd) {
		const startLabel = toShortDateLabel(rangeStart, data.info.timeZone);
		const endLabel = toShortDateLabel(rangeEnd, data.info.timeZone);
		return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
	}

	const eventDates = data.events
		.map((event) => toValidDate(event.startDateValue))
		.filter((value) => value instanceof Date);
	if (eventDates.length === 0) {
		return null;
	}

	const uniqueDateKeys = new Set(
		eventDates.map((value) => toDateKey(value, data.info.timeZone))
	);
	if (uniqueDateKeys.size !== 1) {
		return null;
	}

	const eventDayKey = Array.from(uniqueDateKeys)[0];
	const now = new Date();
	const todayKey = toDateKey(now, data.info.timeZone);
	if (eventDayKey === todayKey) {
		return "Today";
	}

	const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
	const tomorrowKey = toDateKey(tomorrow, data.info.timeZone);
	if (eventDayKey === tomorrowKey) {
		return "Tomorrow";
	}

	return toShortDateLabel(eventDates[0], data.info.timeZone);
}

function buildCalendarDescription(prompt, data) {
	const eventsCount = data.totalEvents > 0 ? data.totalEvents : data.events.length;
	const calendarName = data.info.calendarName;
	const scopeLabel = resolveCalendarScopeLabel(prompt, data);

	if (eventsCount > 0) {
		const eventLabel = `${eventsCount} ${pluralize(eventsCount, "event", "events")}`;
		const calendarLabel = calendarName
			? ` in ${calendarName} calendar`
			: " in Google Calendar";
		return scopeLabel
			? `${scopeLabel}: ${eventLabel}${calendarLabel}.`
			: `${eventLabel}${calendarLabel}.`;
	}

	const targetLabel = calendarName ? `${calendarName} calendar` : "Google Calendar";
	const normalizedScopeLabel =
		/^(Today|Tomorrow|This|Next)\b/.test(scopeLabel ?? "")
			? scopeLabel.toLowerCase()
			: scopeLabel;
	return scopeLabel
		? `No events ${normalizedScopeLabel} in ${targetLabel}.`
		: `No events found in ${targetLabel}.`;
}

function buildDriveDescription(data) {
	const filesCount = data.totalFiles > 0 ? data.totalFiles : data.files.length;
	const ownerLabel = data.info.accountName || data.info.email;

	if (filesCount > 0) {
		return `${filesCount} ${pluralize(filesCount, "file", "files")} from Google Drive${
			ownerLabel ? ` for ${ownerLabel}` : ""
		}.`;
	}

	if (ownerLabel || data.info.storageUsed || data.info.storageLimit) {
		return `Google Drive account details${ownerLabel ? ` for ${ownerLabel}` : ""}.`;
	}

	return "Google Drive details.";
}

function extractDriveData(payloads, maxItems) {
	const arrays = collectArraysByKeys(payloads, ["files", "items"]);
	const normalizedFiles = [];
	for (const collection of arrays) {
		for (const entry of collection) {
			const normalized = normalizeDriveFile(entry);
			if (normalized) {
				normalizedFiles.push(normalized);
			}
		}
	}

	const dedupedFiles = dedupeBy(normalizedFiles, (file) =>
		[file.id, file.link, file.name, file.modifiedTime].filter(Boolean).join("|")
	);
	const limitedFiles = dedupedFiles.slice(0, maxItems);

	let accountName = null;
	let email = null;
	let storageUsed = null;
	let storageLimit = null;
	let message = null;

	for (const payload of payloads) {
		walkNodes(payload, (node) => {
			if (!isObjectRecord(node)) {
				return;
			}

			if (!accountName) {
				accountName = firstString(node, ["displayName", "accountName", "ownerName"]);
			}
			if (!email) {
				email = firstString(node, ["emailAddress", "email"]);
			}
			if (!accountName && email) {
				accountName = firstString(node, ["name"]);
			}

			const quota = isObjectRecord(node.storageQuota) ? node.storageQuota : null;
			if (quota) {
				if (!storageUsed) {
					storageUsed = firstString(quota, [
						"usageInDrive",
						"usage",
						"usageInDriveTrash",
						"storageUsed",
					]);
				}
				if (!storageLimit) {
					storageLimit = firstString(quota, ["limit", "storageLimit", "quota"]);
				}
			}

			if (!message) {
				message = firstString(node, ["message", "note", "description"]);
			}
		});
	}

	return {
		files: limitedFiles,
		totalFiles: dedupedFiles.length,
		info: {
			accountName,
			email,
			storageUsed,
			storageLimit,
			message,
		},
	};
}

function pushTextLine(elements, parentChildren, key, content, muted = false) {
	if (!content) {
		return;
	}

	parentChildren.push(key);
	elements[key] = {
		type: "Text",
		props: {
			content,
			...(muted ? { muted: true } : {}),
		},
	};
}

function toCalendarTimelineStatus(rawStatus) {
	const normalized = getNonEmptyString(rawStatus)?.toLowerCase() ?? "";
	if (!normalized) {
		return "upcoming";
	}

	if (/\b(cancelled|canceled|done|completed)\b/.test(normalized)) {
		return "past";
	}
	if (/\b(ongoing|in progress|active|tentative)\b/.test(normalized)) {
		return "current";
	}

	return "upcoming";
}

const CALENDAR_COLORS = ["blue", "green", "purple", "teal", "yellow", "red"];

function toCalendarTimelineItem(event, index) {
	return {
		time: event.startTime ?? event.when ?? "",
		title: event.title,
		duration: event.duration ?? null,
		location: event.location ?? null,
		color: CALENDAR_COLORS[index % CALENDAR_COLORS.length],
		status: toCalendarTimelineStatus(event.status),
	};
}

function buildCalendarSpec({ title, description, data }) {
	const elements = {};
	const cardChildren = [];
	const rootChildren = ["summary-card"];

	elements.root = {
		type: "Stack",
		props: { direction: "vertical", gap: "md" },
		children: rootChildren,
	};

	elements["summary-card"] = {
		type: "Card",
		props: { title, description },
		children: cardChildren,
	};

	if (data.events.length > 0) {
		const lineSegments = [];
		if (data.totalEvents > 0) {
			lineSegments.push(
				`Showing ${data.events.length} of ${data.totalEvents} event${
					data.totalEvents === 1 ? "" : "s"
				}.`
			);
		}
		if (data.info.calendarName) {
			lineSegments.push(`Calendar: ${data.info.calendarName}`);
		}
		if (data.info.timeZone) {
			lineSegments.push(`Time zone: ${data.info.timeZone}`);
		}

		pushTextLine(
			elements,
			cardChildren,
			"calendar-overview",
			lineSegments.join(" "),
			true
		);

		const timelineEvents = data.events.map(toCalendarTimelineItem);
		const timelineKey = "calendar-events-timeline";
		cardChildren.push(timelineKey);
		elements[timelineKey] = {
			type: "CalendarTimeline",
			props: {
				events: timelineEvents,
			},
		};

		return { root: "root", elements };
	}

	const emptyLines = [];
	pushTextLine(
		elements,
		emptyLines,
		"calendar-empty",
		"No events were returned in the tool response."
	);
	pushTextLine(
		elements,
		emptyLines,
		"calendar-name",
		data.info.calendarName ? `Calendar: ${data.info.calendarName}` : null,
		true
	);
	pushTextLine(
		elements,
		emptyLines,
		"calendar-id",
		data.info.calendarId ? `Calendar ID: ${data.info.calendarId}` : null,
		true
	);
	pushTextLine(
		elements,
		emptyLines,
		"calendar-timezone",
		data.info.timeZone ? `Time zone: ${data.info.timeZone}` : null,
		true
	);
	pushTextLine(
		elements,
		emptyLines,
		"calendar-message",
		data.info.message ? `Details: ${data.info.message}` : null,
		true
	);

	const infoStackKey = "calendar-info-stack";
	cardChildren.push(infoStackKey);
	elements[infoStackKey] = {
		type: "Stack",
		props: {
			direction: "vertical",
			gap: "sm",
		},
		children: emptyLines,
	};

	return { root: "root", elements };
}

function buildDriveSpec({ title, description, data }) {
	const elements = {};
	const cardChildren = [];
	const rootChildren = ["summary-card"];

	elements.root = {
		type: "Stack",
		props: { direction: "vertical", gap: "md" },
		children: rootChildren,
	};

	elements["summary-card"] = {
		type: "Card",
		props: { title, description },
		children: cardChildren,
	};

	if (data.files.length > 0) {
		pushTextLine(
			elements,
			cardChildren,
			"drive-overview",
			`Showing ${data.files.length} of ${data.totalFiles} file${
				data.totalFiles === 1 ? "" : "s"
			}.`,
			true
		);

		data.files.forEach((file, index) => {
			const fileCardKey = `drive-file-${index}`;
			const fileChildKeys = [];
			cardChildren.push(fileCardKey);

			const fileDescriptionParts = [];
			if (file.mimeType) {
				fileDescriptionParts.push(file.mimeType);
			}
			if (file.modifiedTime) {
				fileDescriptionParts.push(`Updated: ${file.modifiedTime}`);
			}

			elements[fileCardKey] = {
				type: "Card",
				props: {
					title: file.name,
					description:
						fileDescriptionParts.length > 0
							? fileDescriptionParts.join(" · ")
							: undefined,
				},
				children: fileChildKeys,
			};

			pushTextLine(
				elements,
				fileChildKeys,
				`${fileCardKey}-owner`,
				file.owner ? `Owner: ${file.owner}` : null,
				true
			);

			if (file.link) {
				const linkKey = `${fileCardKey}-link`;
				fileChildKeys.push(linkKey);
				elements[linkKey] = {
					type: "Link",
					props: {
						text: "Open file",
						href: file.link,
					},
				};
			}
		});

		return { root: "root", elements };
	}

	const infoLines = [];
	pushTextLine(
		elements,
		infoLines,
		"drive-empty",
		"No files were returned in the tool response."
	);
	pushTextLine(
		elements,
		infoLines,
		"drive-account",
		data.info.accountName ? `Account: ${data.info.accountName}` : null,
		true
	);
	pushTextLine(
		elements,
		infoLines,
		"drive-email",
		data.info.email ? `Email: ${data.info.email}` : null,
		true
	);
	pushTextLine(
		elements,
		infoLines,
		"drive-storage",
		data.info.storageUsed || data.info.storageLimit
			? `Storage: ${data.info.storageUsed || "unknown"} / ${
					data.info.storageLimit || "unknown"
				}`
			: null,
		true
	);
	pushTextLine(
		elements,
		infoLines,
		"drive-message",
		data.info.message ? `Details: ${data.info.message}` : null,
		true
	);

	const infoStackKey = "drive-info-stack";
	cardChildren.push(infoStackKey);
	elements[infoStackKey] = {
		type: "Stack",
		props: {
			direction: "vertical",
			gap: "sm",
		},
		children: infoLines,
	};

	return { root: "root", elements };
}

function scoreCandidate(candidate, preferredDomain) {
	if (!candidate) {
		return -1;
	}

	let score = 0;
	if (candidate.domain === preferredDomain) {
		score += 2000;
	}

	if (candidate.listCount > 0) {
		score += 1000 + candidate.listCount;
	}
	if (candidate.hasInfo) {
		score += 100 + candidate.infoFieldCount;
	}

	return score;
}

function buildCalendarCandidate({
	observations,
	payloads,
	prompt,
	title,
	description,
	maxItems,
}) {
	if (payloads.length === 0) {
		return null;
	}

	const data = extractCalendarData(payloads, maxItems);
	const hasInfo = Boolean(
		data.info.calendarId || data.info.timeZone || data.info.calendarName || data.info.message
	);
	if (data.events.length === 0 && !hasInfo) {
		return null;
	}

	const resultCount = observations.filter((entry) => entry.phase === "result").length;
	const errorCount = observations.filter((entry) => entry.phase === "error").length;
	const defaultDescription = buildCalendarDescription(prompt, data);
	const resolvedTitle = resolveCandidateTitle(title, "Google Calendar");
	const resolvedDescription = resolveCandidateDescription(
		description,
		defaultDescription,
		{ resultCount }
	);

	return {
		domain: "calendar",
		spec: buildCalendarSpec({
			title: resolvedTitle,
			description: resolvedDescription,
			data,
		}),
		summary:
			data.events.length > 0
				? `Rendered ${data.events.length} Google Calendar event${
						data.events.length === 1 ? "" : "s"
					}.`
				: "Rendered Google Calendar details.",
		source: "tool-observation-google-calendar-structured",
		observationUsed: true,
		observationCount: observations.length,
		resultCount,
		errorCount,
		listCount: data.events.length,
		hasInfo,
		infoFieldCount: [
			data.info.calendarId,
			data.info.timeZone,
			data.info.calendarName,
			data.info.message,
		].filter(Boolean).length,
	};
}

function buildDriveCandidate({
	observations,
	payloads,
	title,
	description,
	maxItems,
}) {
	if (payloads.length === 0) {
		return null;
	}

	const data = extractDriveData(payloads, maxItems);
	const hasInfo = Boolean(
		data.info.accountName ||
			data.info.email ||
			data.info.storageUsed ||
			data.info.storageLimit ||
			data.info.message
	);
	if (data.files.length === 0 && !hasInfo) {
		return null;
	}

	const resultCount = observations.filter((entry) => entry.phase === "result").length;
	const errorCount = observations.filter((entry) => entry.phase === "error").length;
	const defaultDescription = buildDriveDescription(data);
	const resolvedTitle = resolveCandidateTitle(title, "Google Drive");
	const resolvedDescription = resolveCandidateDescription(
		description,
		defaultDescription,
		{ resultCount }
	);

	return {
		domain: "drive",
		spec: buildDriveSpec({
			title: resolvedTitle,
			description: resolvedDescription,
			data,
		}),
		summary:
			data.files.length > 0
				? `Rendered ${data.files.length} Google Drive file${
						data.files.length === 1 ? "" : "s"
					}.`
				: "Rendered Google Drive account details.",
		source: "tool-observation-google-drive-structured",
		observationUsed: true,
		observationCount: observations.length,
		resultCount,
		errorCount,
		listCount: data.files.length,
		hasInfo,
		infoFieldCount: [
			data.info.accountName,
			data.info.email,
			data.info.storageUsed,
			data.info.storageLimit,
			data.info.message,
		].filter(Boolean).length,
	};
}

function filterDomainObservations(observations, domain) {
	return observations.filter((entry) => {
		const detectedDomain = detectGoogleDomainFromToolName(entry.toolName);
		return detectedDomain === domain;
	});
}

function collectStructuredPayloads(observations) {
	const payloads = [];
	for (const observation of observations) {
		if (!observation || observation.phase !== "result") {
			continue;
		}

		const payload =
			toStructuredPayload(observation.rawOutput)
			|| toStructuredPayload(observation.text);
		if (payload) {
			payloads.push(payload);
		}
	}
	return payloads;
}

function buildGoogleStructuredSpec({
	observations,
	prompt,
	title,
	description,
	maxItems = DEFAULT_MAX_ITEMS,
} = {}) {
	const entries = Array.isArray(observations) ? observations : [];
	if (entries.length === 0) {
		return null;
	}

	const boundedMaxItems =
		typeof maxItems === "number" && Number.isFinite(maxItems) && maxItems > 0
			? Math.min(Math.floor(maxItems), 20)
			: DEFAULT_MAX_ITEMS;

	const calendarObservations = filterDomainObservations(entries, "calendar");
	const driveObservations = filterDomainObservations(entries, "drive");

	const calendarPayloads = collectStructuredPayloads(calendarObservations);
	const drivePayloads = collectStructuredPayloads(driveObservations);

	const calendarCandidate = buildCalendarCandidate({
		observations: calendarObservations,
		payloads: calendarPayloads,
		prompt,
		title: title || "Google Calendar",
		description,
		maxItems: boundedMaxItems,
	});
	const driveCandidate = buildDriveCandidate({
		observations: driveObservations,
		payloads: drivePayloads,
		title: title || "Google Drive",
		description,
		maxItems: boundedMaxItems,
	});

	if (!calendarCandidate && !driveCandidate) {
		return null;
	}

	const preferredDomain = detectPreferredDomainFromPrompt(prompt);
	const candidates = [calendarCandidate, driveCandidate].filter(Boolean);
	candidates.sort(
		(a, b) => scoreCandidate(b, preferredDomain) - scoreCandidate(a, preferredDomain)
	);

	const selected = candidates[0];
	return {
		spec: selected.spec,
		summary: selected.summary,
		source: selected.source,
		observationUsed: true,
		observationCount: selected.observationCount,
		resultCount: selected.resultCount,
		errorCount: selected.errorCount,
	};
}

module.exports = {
	buildGoogleStructuredSpec,
};
