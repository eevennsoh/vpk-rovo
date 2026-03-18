const { getNonEmptyString } = require("./shared-utils");

const EXPLICIT_TRANSLATION_TRIGGER_PATTERN =
	/\b(translate|translation|how\s+do\s+you\s+say)\b/i;
const WHAT_IS_TRANSLATION_PATTERN =
	/\bwhat(?:'s|\s+is)\s+.+\s+\b(?:in|to|into)\s+\S+\b/i;
const EXPLICIT_TRANSLATION_TOOL_PATTERN =
	/\b(google\s+translate|google\s+cloud\s+translate|cloud\s+translation|translation\s+api|use\s+google\s+translate)\b/i;
const TARGET_LANGUAGE_PATTERN =
	/\b(?:in|to|into)\s+([\p{L}][\p{L}\p{N}\s-]{1,40})(?=$|[?.!,]|(?:\s+(?:for|please|now|today|thanks|thank)\b))/iu;
const QUOTED_TEXT_PATTERN = /["“”`]\s*([^"“”`]{1,400}?)\s*["“”`]/;
const MAX_VARIANTS = 3;
const MAX_LINE_LENGTH = 200;
const TRANSLATION_CLARIFICATION_SESSION_PREFIX = "translation-clarification-";
const TRANSLATION_CLARIFICATION_LEGACY_SESSION_ID = "translation-clarification";
const SOURCE_TEXT_QUESTION_ID = "source-text";
const TARGET_LANGUAGE_QUESTION_ID = "target-language";
const PROJECT_ID_QUESTION_ID = "gcp-project";
const DEFAULT_TRANSLATION_CLARIFICATION_TITLE = "Help me translate this";
const DEFAULT_TRANSLATION_CLARIFICATION_DESCRIPTION =
	"Answer these so I can translate accurately.";
const DEFAULT_TRANSLATION_CLARIFICATION_MAX_ROUNDS = 2;
const GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME =
	"google_gcp_atlassian_translate_translate_text";
const COMMON_TRANSLATION_TARGET_LANGUAGES = new Set([
	"arabic",
	"bengali",
	"brazilian portuguese",
	"bulgarian",
	"cantonese",
	"catalan",
	"chinese",
	"croatian",
	"czech",
	"danish",
	"dutch",
	"english",
	"estonian",
	"filipino",
	"finnish",
	"french",
	"german",
	"greek",
	"hebrew",
	"hindi",
	"hungarian",
	"indonesian",
	"italian",
	"japanese",
	"korean",
	"latin american spanish",
	"latvian",
	"lithuanian",
	"malay",
	"mandarin",
	"mandarin chinese",
	"norwegian",
	"polish",
	"portuguese",
	"portuguese brazil",
	"romanian",
	"russian",
	"serbian",
	"simplified chinese",
	"slovak",
	"slovenian",
	"spanish",
	"swedish",
	"tamil",
	"thai",
	"traditional chinese",
	"turkish",
	"ukrainian",
	"urdu",
	"vietnamese",
	"welsh",
]);

function createTranslationClarificationSessionId() {
	return `${TRANSLATION_CLARIFICATION_SESSION_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isTranslationClarificationSession(sessionId) {
	const normalizedSessionId = getNonEmptyString(sessionId);
	if (!normalizedSessionId) {
		return false;
	}

	return (
		normalizedSessionId === TRANSLATION_CLARIFICATION_LEGACY_SESSION_ID ||
		normalizedSessionId.startsWith(TRANSLATION_CLARIFICATION_SESSION_PREFIX)
	);
}

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

function normalizeLanguageKey(value) {
	return value
		.toLowerCase()
		.replace(/[()]/g, " ")
		.replace(/[^a-z0-9]+/g, " ")
		.trim()
		.replace(/\s+/g, " ");
}

function getFirstAnswerString(value) {
	if (typeof value === "string") {
		return getNonEmptyString(value);
	}

	if (!Array.isArray(value)) {
		return null;
	}

	for (const item of value) {
		const normalizedItem = getNonEmptyString(item);
		if (normalizedItem) {
			return normalizedItem;
		}
	}

	return null;
}

function getClarificationAnswer(answers, keys) {
	if (!answers || typeof answers !== "object" || !Array.isArray(keys)) {
		return null;
	}

	for (const key of keys) {
		const normalizedKey = getNonEmptyString(key);
		if (!normalizedKey) {
			continue;
		}

		const value = getFirstAnswerString(answers[normalizedKey]);
		if (value) {
			return value;
		}
	}

	return null;
}

function sanitizeProjectId(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const normalized = text.trim();
	// Allow common GCP project id chars while avoiding whitespace-heavy values.
	if (!/^[a-z][a-z0-9-]{4,62}$/.test(normalized)) {
		return null;
	}

	return normalized;
}

function clipText(value, maxLength = MAX_LINE_LENGTH) {
	const text = getNonEmptyString(value);
	if (!text) {
		return "";
	}

	return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
}

function extractQuotedText(prompt) {
	const match = prompt.match(QUOTED_TEXT_PATTERN);
	if (!match || !match[1]) {
		return null;
	}

	return getNonEmptyString(match[1]);
}

function sanitizeLanguageCandidate(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	const withoutTrailingFillers = text
		.replace(/\s+(?:for\s+me|please|thanks?|thank\s+you)\b[\s\S]*$/i, "")
		.replace(/[?.!,]+$/g, "");
	const normalized = normalizeWhitespace(withoutTrailingFillers);
	if (!normalized) {
		return null;
	}

	return clipText(normalized, 40);
}

function isLikelyHumanLanguage(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return false;
	}

	const normalized = normalizeLanguageKey(text);
	if (!normalized) {
		return false;
	}

	if (COMMON_TRANSLATION_TARGET_LANGUAGES.has(normalized)) {
		return true;
	}

	return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})+$/i.test(text.trim());
}

function extractTargetLanguage(prompt) {
	const match = prompt.match(TARGET_LANGUAGE_PATTERN);
	if (!match || !match[1]) {
		return null;
	}

	return sanitizeLanguageCandidate(match[1]);
}

function stripSurroundingQuotes(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	return text
		.replace(/^["'“”`]+/, "")
		.replace(/["'“”`]+$/, "")
		.trim();
}

function extractSourceByPattern(prompt, targetLanguage) {
	const targetPattern = targetLanguage
		? targetLanguage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		: "[\\p{L}][\\p{L}\\p{N}\\s-]{1,40}";
	const patterns = [
		new RegExp(
			`\\bhow\\s+do\\s+you\\s+say\\s+([\\s\\S]{1,220}?)\\s+\\b(?:in|to|into)\\s+${targetPattern}\\b`,
			"iu"
		),
		new RegExp(
			`\\bwhat(?:'s|\\s+is)\\s+([\\s\\S]{1,220}?)\\s+\\b(?:in|to|into)\\s+${targetPattern}\\b`,
			"iu"
		),
		new RegExp(
			`\\btranslate\\s+(?:the\\s+)?(?:phrase|text|sentence|word)?\\s*([\\s\\S]{1,220}?)\\s+\\b(?:in|to|into)\\s+${targetPattern}\\b`,
			"iu"
		),
	];

	for (const pattern of patterns) {
		const match = prompt.match(pattern);
		if (!match || !match[1]) {
			continue;
		}

		const candidate = stripSurroundingQuotes(match[1]);
		if (candidate) {
			return candidate;
		}
	}

	return null;
}

function detectDirectTranslationRequest(prompt) {
	const text = getNonEmptyString(prompt);
	if (!text) {
		return {
			isTranslationRequest: false,
			explicitToolingPreference: false,
			sourceText: null,
			targetLanguage: null,
			needsTargetLanguage: false,
		};
	}

	const normalizedPrompt = normalizeWhitespace(text);
	const targetLanguage = extractTargetLanguage(normalizedPrompt);
	const hasExplicitTranslationTrigger =
		EXPLICIT_TRANSLATION_TRIGGER_PATTERN.test(normalizedPrompt);
	const hasWhatIsTranslationShape =
		WHAT_IS_TRANSLATION_PATTERN.test(normalizedPrompt);
	const isTranslationRequest =
		hasExplicitTranslationTrigger ||
		(hasWhatIsTranslationShape && isLikelyHumanLanguage(targetLanguage));
	const explicitToolingPreference =
		EXPLICIT_TRANSLATION_TOOL_PATTERN.test(normalizedPrompt);
	if (!isTranslationRequest) {
		return {
			isTranslationRequest: false,
			explicitToolingPreference,
			sourceText: null,
			targetLanguage: null,
			needsTargetLanguage: false,
		};
	}

	const sourceText =
		extractQuotedText(normalizedPrompt) ||
		extractSourceByPattern(normalizedPrompt, targetLanguage);

	return {
		isTranslationRequest: true,
		explicitToolingPreference,
		sourceText: sourceText ? clipText(sourceText, 220) : null,
		targetLanguage,
		needsTargetLanguage: Boolean(sourceText) && !targetLanguage,
	};
}

function resolveTranslationRequestState(prompt) {
	const request = detectDirectTranslationRequest(prompt);
	const sourceText = getNonEmptyString(request.sourceText);
	const targetLanguage = sanitizeLanguageCandidate(request.targetLanguage);
	const project = null;
	const needsSourceText = request.isTranslationRequest && !sourceText;
	const needsTargetLanguage = request.isTranslationRequest && !targetLanguage;
	const needsProject = request.isTranslationRequest && !project;

	return {
		...request,
		sourceText,
		targetLanguage,
		project,
		needsSourceText,
		needsTargetLanguage,
		needsProject,
		needsClarification: needsSourceText || needsTargetLanguage || needsProject,
	};
}

function resolveTranslationRequestFromClarification({
	clarificationSubmission,
	latestVisibleUserMessage,
} = {}) {
	const fallbackState = resolveTranslationRequestState(latestVisibleUserMessage);
	const answers =
		clarificationSubmission && typeof clarificationSubmission === "object"
			? clarificationSubmission.answers
			: null;
	const submittedSourceText = getClarificationAnswer(answers, [
		SOURCE_TEXT_QUESTION_ID,
		"sourceText",
		"text",
		"What text should I translate?",
	]);
	const submittedTargetLanguage = getClarificationAnswer(answers, [
		TARGET_LANGUAGE_QUESTION_ID,
		"targetLanguage",
		"language",
		"What language should I translate it to?",
	]);
	const submittedProject = getClarificationAnswer(answers, [
		PROJECT_ID_QUESTION_ID,
		"project",
		"gcpProject",
		"GCP project ID",
	]);
	const sourceText = getNonEmptyString(submittedSourceText) || fallbackState.sourceText;
	const targetLanguage =
		sanitizeLanguageCandidate(submittedTargetLanguage) || fallbackState.targetLanguage;
	const project = sanitizeProjectId(submittedProject) || fallbackState.project;
	const isTranslationRequest =
		Boolean(fallbackState.isTranslationRequest) ||
		isTranslationClarificationSession(clarificationSubmission?.sessionId);
	const needsSourceText = isTranslationRequest && !sourceText;
	const needsTargetLanguage = isTranslationRequest && !targetLanguage;
	const needsProject = isTranslationRequest && !project;

	return {
		...fallbackState,
		isTranslationRequest,
		sourceText,
		targetLanguage,
		project,
		needsSourceText,
		needsTargetLanguage,
		needsProject,
		needsClarification: needsSourceText || needsTargetLanguage || needsProject,
	};
}

function buildTranslationClarificationPayload({
	sourceText,
	targetLanguage,
	project,
	sessionId,
	round = 1,
	maxRounds = DEFAULT_TRANSLATION_CLARIFICATION_MAX_ROUNDS,
} = {}) {
	const normalizedSourceText = getNonEmptyString(sourceText);
	const normalizedTargetLanguage = sanitizeLanguageCandidate(targetLanguage);
	const normalizedProject = sanitizeProjectId(project);
	const questions = [];

	if (!normalizedSourceText) {
		questions.push({
			id: SOURCE_TEXT_QUESTION_ID,
			label: "What text should I translate?",
			description: "Paste the exact source text.",
			required: true,
			kind: "text",
			options: [],
			placeholder: "Paste text to translate...",
		});
	}

	if (!normalizedTargetLanguage) {
		questions.push({
			id: TARGET_LANGUAGE_QUESTION_ID,
			label: "What language should I translate it to?",
			description: "Example: Spanish, Japanese, Portuguese (Brazil).",
			required: true,
			kind: "single-select",
			options: [
				{
					id: "spanish",
					label: "Spanish",
					description: "Español",
				},
				{
					id: "french",
					label: "French",
					description: "Français",
				},
				{
					id: "mandarin-chinese",
					label: "Mandarin Chinese",
					description: "中文 (Mandarin)",
				},
			],
			placeholder: "Type target language...",
		});
	}

	if (!normalizedProject) {
		questions.push({
			id: PROJECT_ID_QUESTION_ID,
			label: "What is the GCP project ID?",
			description:
				"Required for Google Translate tool execution.",
			required: true,
			kind: "text",
			options: [],
			placeholder: "your-gcp-project-id",
		});
	}

	if (questions.length === 0) {
		return null;
	}

	return {
		type: "question-card",
		title: DEFAULT_TRANSLATION_CLARIFICATION_TITLE,
		description: DEFAULT_TRANSLATION_CLARIFICATION_DESCRIPTION,
		sessionId: isTranslationClarificationSession(sessionId)
			? sessionId
			: createTranslationClarificationSessionId(),
		round:
			typeof round === "number" && Number.isFinite(round) && round > 0
				? Math.floor(round)
				: 1,
		maxRounds:
			typeof maxRounds === "number" && Number.isFinite(maxRounds) && maxRounds > 0
				? Math.floor(maxRounds)
				: DEFAULT_TRANSLATION_CLARIFICATION_MAX_ROUNDS,
		questions,
	};
}

function createTranslationToolExecutionPrompt({
	sourceText,
	targetLanguage,
	project,
} = {}) {
	const source = getNonEmptyString(sourceText);
	const target = sanitizeLanguageCandidate(targetLanguage);
	const projectValue = sanitizeProjectId(project);
	if (!source || !target || !projectValue) {
		return null;
	}

	return [
		"You must execute translation via integration tool call.",
		"Use `mcp__integrations__invoke_tool` and call exactly this tool name:",
		`- ${GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME}`,
		"",
		"Tool-call requirements:",
		`- \`project\` is REQUIRED and must be set to ${JSON.stringify(projectValue)}.`,
		"- `contents` must be the exact source text.",
		"- Resolve the user language request into `targetLanguageCode` (ISO-639-1/BCP-47).",
		"- `sourceLanguageCode` is optional; omit it unless confident.",
		"- Wait for tool result before final response.",
		"",
		"Return ONLY strict JSON (no markdown):",
		"{",
		'  "sourceText": "string",',
		'  "sourceLanguage": "string",',
		'  "targetLanguage": "string",',
		'  "variants": [',
		'    { "label": "Natural", "text": "string" }',
		"  ]",
		"}",
		"",
		`Source text: ${JSON.stringify(source)}`,
		`Target language requested by user: ${JSON.stringify(target)}`,
	].join("\n");
}

function decodeBasicHtmlEntities(value) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

function parseJsonObjectLike(value) {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value;
	}

	if (typeof value !== "string") {
		return null;
	}

	return parseJsonFromText(value);
}

function findObjectContainingAnyKey(value, keys, depth = 0) {
	if (depth > 8 || !value || typeof value !== "object") {
		return null;
	}

	if (!Array.isArray(value)) {
		for (const key of keys) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				return value;
			}
		}
	}

	const children = Array.isArray(value)
		? value
		: Object.values(value);
	for (const child of children) {
		if (!child || typeof child !== "object") {
			continue;
		}
		const match = findObjectContainingAnyKey(child, keys, depth + 1);
		if (match) {
			return match;
		}
	}

	return null;
}

function getTranslationTextFromRecord(record) {
	if (!record || typeof record !== "object") {
		return null;
	}

	const candidates = [
		record.translatedText,
		record.translation,
		record.translated_text,
		record.text,
		record.value,
	];
	for (const candidate of candidates) {
		const normalizedCandidate = getNonEmptyString(candidate);
		if (normalizedCandidate) {
			return decodeBasicHtmlEntities(normalizedCandidate);
		}
	}

	return null;
}

function parseTranslationToolResult(rawOutput, defaults = {}) {
	const sourceText = getNonEmptyString(defaults.sourceText);
	const targetLanguage = sanitizeLanguageCandidate(defaults.targetLanguage);
	if (!sourceText || !targetLanguage) {
		return null;
	}

	const parsedOutput = parseJsonObjectLike(rawOutput);
	if (!parsedOutput) {
		return null;
	}

	const translationRecord =
		findObjectContainingAnyKey(parsedOutput, [
			"translatedText",
			"translation",
			"translated_text",
		]) ||
		findObjectContainingAnyKey(parsedOutput, ["translations"]);
	const translationList = Array.isArray(translationRecord?.translations)
		? translationRecord.translations
		: null;
	const translationText =
		getTranslationTextFromRecord(translationRecord) ||
		(translationList && translationList.length > 0
			? getTranslationTextFromRecord(translationList[0])
			: null);
	if (!translationText) {
		return null;
	}

	const sourceLanguage =
		getNonEmptyString(translationRecord?.detectedLanguageCode) ||
		getNonEmptyString(translationRecord?.sourceLanguageCode) ||
		getNonEmptyString(parsedOutput?.detectedLanguageCode) ||
		getNonEmptyString(parsedOutput?.sourceLanguageCode) ||
		undefined;

	return {
		sourceText: clipText(sourceText, 240),
		sourceLanguage,
		targetLanguage,
		variants: [
			{
				id: "natural",
				label: "Natural",
				text: clipText(translationText, 280),
			},
		],
	};
}

function createTranslationGenerationPrompt({
	sourceText,
	targetLanguage,
	variantLevel = "natural+formal",
}) {
	const source = getNonEmptyString(sourceText);
	const target = getNonEmptyString(targetLanguage);
	if (!source || !target) {
		return null;
	}

	return [
		"You translate text accurately and naturally.",
		"Return ONLY strict JSON and no markdown.",
		"",
		"Schema:",
		"{",
		'  "sourceText": "string",',
		'  "sourceLanguage": "string",',
		'  "targetLanguage": "string",',
		'  "variants": [',
		'    { "label": "Natural", "text": "string", "pronunciation": "string", "notes": "string" },',
		'    { "label": "Formal", "text": "string", "pronunciation": "string", "notes": "string" }',
		"  ],",
		'  "notes": "string"',
		"}",
		"",
		"Rules:",
		`- Translate source text into ${target}.`,
		`- Provide ${variantLevel} variants when possible.`,
		"- Keep meaning faithful and avoid adding unrelated content.",
		"- Include pronunciation in Latin script when target script is non-Latin or pronunciation is useful.",
		"- Keep each variant concise and production-ready.",
		"",
		`Source text: ${JSON.stringify(source)}`,
		`Target language: ${JSON.stringify(target)}`,
	].join("\n");
}

function parseJsonFromText(rawText) {
	if (typeof rawText !== "string") {
		return null;
	}

	try {
		return JSON.parse(rawText);
	} catch {
		const objectMatch = rawText.match(/\{[\s\S]*\}/);
		if (!objectMatch) {
			return null;
		}

		try {
			return JSON.parse(objectMatch[0]);
		} catch {
			return null;
		}
	}
}

function getVariantId(label, index) {
	const normalizedLabel = getNonEmptyString(label)?.toLowerCase() || "";
	if (normalizedLabel.includes("natural")) {
		return "natural";
	}
	if (normalizedLabel.includes("formal")) {
		return "formal";
	}
	return `variant-${index + 1}`;
}

function normalizeVariant(variant, index) {
	if (!variant || typeof variant !== "object") {
		return null;
	}

	const text =
		getNonEmptyString(variant.text) ||
		getNonEmptyString(variant.translation) ||
		getNonEmptyString(variant.value);
	if (!text) {
		return null;
	}

	const label =
		getNonEmptyString(variant.label) ||
		getNonEmptyString(variant.style) ||
		`Variant ${index + 1}`;

	return {
		id: getVariantId(label, index),
		label: clipText(label, 32),
		text: clipText(text, 280),
		pronunciation:
			getNonEmptyString(variant.pronunciation) ||
			getNonEmptyString(variant.transliteration) ||
			getNonEmptyString(variant.pinyin) ||
			undefined,
		notes:
			getNonEmptyString(variant.notes) ||
			getNonEmptyString(variant.note) ||
			getNonEmptyString(variant.description) ||
			undefined,
	};
}

function parseTranslationModelOutput(rawText, defaults = {}) {
	const parsed = parseJsonFromText(rawText);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return null;
	}

	const sourceText =
		getNonEmptyString(parsed.sourceText) ||
		getNonEmptyString(defaults.sourceText);
	const targetLanguage =
		sanitizeLanguageCandidate(parsed.targetLanguage) ||
		sanitizeLanguageCandidate(defaults.targetLanguage);
	if (!sourceText || !targetLanguage) {
		return null;
	}

	let variants = [];
	if (Array.isArray(parsed.variants)) {
		variants = parsed.variants
			.map((variant, index) => normalizeVariant(variant, index))
			.filter(Boolean)
			.slice(0, MAX_VARIANTS);
	}

	if (variants.length === 0) {
		const fallbackText =
			getNonEmptyString(parsed.translation) ||
			getNonEmptyString(parsed.translatedText);
		if (fallbackText) {
			variants = [
				{
					id: "natural",
					label: "Natural",
					text: clipText(fallbackText, 280),
				},
			];
		}
	}

	if (variants.length === 0) {
		return null;
	}

	return {
		sourceText: clipText(sourceText, 240),
		sourceLanguage: getNonEmptyString(parsed.sourceLanguage) || undefined,
		targetLanguage,
		variants,
		notes: getNonEmptyString(parsed.notes) || undefined,
	};
}

function resolvePronunciationLabel(targetLanguage) {
	const normalizedLanguage = getNonEmptyString(targetLanguage)?.toLowerCase() || "";
	if (!normalizedLanguage) {
		return "Pronunciation";
	}
	if (/\b(mandarin|chinese)\b/.test(normalizedLanguage)) {
		return "Pinyin";
	}
	if (/\bjapanese\b/.test(normalizedLanguage)) {
		return "Romaji";
	}
	if (/\bkorean\b/.test(normalizedLanguage)) {
		return "Romanization";
	}
	if (/\barabic\b/.test(normalizedLanguage)) {
		return "Transliteration";
	}
	return "Pronunciation";
}

function buildTranslationTextSummary(payload) {
	if (!payload || typeof payload !== "object" || !Array.isArray(payload.variants)) {
		return "Translation completed.";
	}

	const firstVariant = payload.variants.find(
		(variant) => variant && typeof variant.text === "string"
	);
	if (!firstVariant) {
		return `Translated to ${payload.targetLanguage || "the target language"}.`;
	}

	return `${firstVariant.label || "Natural"} ${payload.targetLanguage || "translation"}: ${firstVariant.text}`;
}

function buildTranslationGenuiSpec(payload) {
	if (
		!payload ||
		typeof payload !== "object" ||
		!Array.isArray(payload.variants) ||
		payload.variants.length === 0
	) {
		return null;
	}

	const sourceLanguageLabel = payload.sourceLanguage || "English";
	const firstVariant = payload.variants[0];

	return {
		root: "root",
		elements: {
			root: {
				type: "Stack",
				props: { direction: "vertical", gap: "md" },
				children: ["original-section", "separator", "translated-section"],
			},
			"original-section": {
				type: "Stack",
				props: { direction: "vertical", gap: "sm" },
				children: ["original-heading", "original-text"],
			},
			"original-heading": {
				type: "Heading",
				props: {
					text: `Original (${sourceLanguageLabel})`,
					level: "h4",
					className: null,
				},
			},
			"original-text": {
				type: "Text",
				props: { content: payload.sourceText, muted: null },
			},
			separator: {
				type: "Separator",
				props: { orientation: "horizontal" },
			},
			"translated-section": {
				type: "Stack",
				props: { direction: "vertical", gap: "sm" },
				children: ["translated-heading", "translated-text"],
			},
			"translated-heading": {
				type: "Heading",
				props: {
					text: `Translated (${payload.targetLanguage})`,
					level: "h4",
					className: "text-sm font-semibold",
				},
			},
			"translated-text": {
				type: "Heading",
				props: {
					text: firstVariant.text,
					level: "h4",
					className: "text-lg font-medium",
				},
			},
		},
	};
}

module.exports = {
	GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME,
	TRANSLATION_CLARIFICATION_SESSION_PREFIX,
	detectDirectTranslationRequest,
	resolveTranslationRequestState,
	resolveTranslationRequestFromClarification,
	createTranslationClarificationSessionId,
	isTranslationClarificationSession,
	buildTranslationClarificationPayload,
	createTranslationToolExecutionPrompt,
	createTranslationGenerationPrompt,
	parseTranslationToolResult,
	parseTranslationModelOutput,
	resolvePronunciationLabel,
	buildTranslationTextSummary,
	buildTranslationGenuiSpec,
};
