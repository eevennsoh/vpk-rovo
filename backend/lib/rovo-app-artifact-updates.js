function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim() ? value.trim() : null;
}

const ARTIFACT_NOUN_REGEX =
	/\b(artifact|document|doc|memo|plan|brief|proposal|spec|summary|report|email|copy|article|blog|code|component|app|page|ui|table|spreadsheet|sheet)\b/;
const EXPLICIT_NEW_ARTIFACT_REGEX = /\b(new|another|separate|different)\b/;
const SAME_ARTIFACT_REFERENCE_REGEX = /\b(it|this|that|current|existing)\b/;
const SAME_ARTIFACT_CHANGE_CUE_REGEX =
	/\b(rename|retitle|change|update|edit|revise|rewrite|reword|shorten|expand|polish|refine|format|convert|improve|fix|translate|compare|add|detail(?:ed)?|report|summary|section|bullet|paragraph|introduction)\b/;

function isExplicitNewRovoAppArtifactRequest({
	latestUserMessage,
}) {
	const normalizedMessage = getNonEmptyString(latestUserMessage)?.toLowerCase() || "";
	if (!normalizedMessage) {
		return false;
	}

	return EXPLICIT_NEW_ARTIFACT_REGEX.test(normalizedMessage) &&
		ARTIFACT_NOUN_REGEX.test(normalizedMessage);
}

function isSameRovoAppArtifactVersionRequest({
	activeArtifact,
	latestUserMessage,
}) {
	const normalizedMessage = getNonEmptyString(latestUserMessage)?.toLowerCase() || "";
	if (!activeArtifact?.id || !normalizedMessage) {
		return false;
	}

	if (isExplicitNewRovoAppArtifactRequest({ latestUserMessage })) {
		return false;
	}

	if (
		/\b(rename|retitle)\b/.test(normalizedMessage) ||
		/\b(change|update)\b[\s\S]{0,24}\btitle\b/.test(normalizedMessage)
	) {
		return true;
	}

	const hasSameArtifactReference = SAME_ARTIFACT_REFERENCE_REGEX.test(normalizedMessage);
	const hasChangeCue = SAME_ARTIFACT_CHANGE_CUE_REGEX.test(normalizedMessage);
	const hasNewSubjectCreationCue =
		/\b(create|write|draft|generate|make|build|compose)\b[\s\S]{0,48}\b(?:about|on|for)\b/.test(
			normalizedMessage,
		) && !hasSameArtifactReference;

	if (hasSameArtifactReference && (hasChangeCue || /\b(turn|make|create)\b/.test(normalizedMessage))) {
		return true;
	}

	if (hasChangeCue && !hasNewSubjectCreationCue) {
		return true;
	}

	if (
		/\b(turn|convert)\b[\s\S]{0,24}\b(report|summary|brief|memo|spec)\b/.test(
			normalizedMessage,
		)
	) {
		return true;
	}

	return false;
}

function isRenameOnlyRovoAppArtifactRequest({
	latestUserMessage,
	nextTitle,
	previousTitle,
}) {
	const normalizedMessage = getNonEmptyString(latestUserMessage)?.toLowerCase() || "";
	const normalizedNextTitle = getNonEmptyString(nextTitle);
	const normalizedPreviousTitle = getNonEmptyString(previousTitle);

	if (!normalizedMessage || !normalizedNextTitle || !normalizedPreviousTitle) {
		return false;
	}

	if (normalizedNextTitle === normalizedPreviousTitle) {
		return false;
	}

	const hasRenameCue =
		/\b(rename|retitle)\b/.test(normalizedMessage) ||
		/\b(change|update)\b[\s\S]{0,24}\btitle\b/.test(normalizedMessage) ||
		/\btitle\b[\s\S]{0,16}\bto\b/.test(normalizedMessage);
	if (!hasRenameCue) {
		return false;
	}

	const hasAdditionalEditCue =
		/\b(shorter|longer|expand|rewrite|reword|translate|compare|detail(?:ed)?|introduction|report|summary|format|tone|style|section|bullet|paragraph|code|table|sheet|fix|improve)\b/.test(
			normalizedMessage,
		);

	return !hasAdditionalEditCue;
}

function extractRovoAppRequestedTitle({
	latestUserMessage,
}) {
	const normalizedMessage = getNonEmptyString(latestUserMessage);
	if (!normalizedMessage) {
		return null;
	}

	const patterns = [
		/\b(?:rename|retitle)\b[\s\S]{0,24}\b(?:to|as)\b\s+(.+)$/i,
		/\b(?:change|update)\b[\s\S]{0,24}\btitle\b[\s\S]{0,16}\bto\b\s+(.+)$/i,
		/\btitle\b[\s\S]{0,16}\bto\b\s+(.+)$/i,
	];

	for (const pattern of patterns) {
		const match = normalizedMessage.match(pattern);
		const candidateTitle = getNonEmptyString(match?.[1]);
		if (!candidateTitle) {
			continue;
		}

		const normalizedTitle = candidateTitle
			.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
			.split(
				/\s+(?:and|but)\s+(?:make|add|turn|also|then|include|rewrite|shorten|expand|polish|refine|format|improve|fix)\b/i,
			)[0]
			.replace(/[.?!]+$/g, "")
			.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
			.trim();
		if (normalizedTitle) {
			return normalizedTitle;
		}
	}

	return null;
}

function deriveRovoAppVersionChangeLabel({
	artifactAction,
	artifactSteering,
	latestUserMessage,
	nextTitle,
	previousTitle,
}) {
	if (artifactAction === "createDocument") {
		return "Created";
	}

	const normalizedMessage = getNonEmptyString(latestUserMessage)?.toLowerCase() || "";
	if (
		isRenameOnlyRovoAppArtifactRequest({
			latestUserMessage,
			nextTitle,
			previousTitle,
		})
	) {
		return "Renamed title";
	}

	if (/\btranslate\b/.test(normalizedMessage)) {
		return "Translated";
	}

	if (
		/\b(turn|convert)\b[\s\S]{0,24}\breport\b/.test(normalizedMessage) ||
		/\breport\b/.test(normalizedMessage)
	) {
		return "Turned into report";
	}

	if (/\bcompare\b/.test(normalizedMessage)) {
		return "Compared topics";
	}

	if (
		/\b(add)\b[\s\S]{0,24}\b(introduction|section|details?|paragraph|bullet)\b/.test(
			normalizedMessage,
		) ||
		/\b(expand|detail(?:ed)?|elaborate)\b/.test(normalizedMessage)
	) {
		return "Expanded";
	}

	if (
		/\b(shorten|rewrite|reword|polish|refine|format|fix|improve|update|edit|revise)\b/.test(
			normalizedMessage,
		)
	) {
		return "Rewritten";
	}

	if (artifactSteering?.source === "voice") {
		return "Steered update";
	}

	return "Updated";
}

function applyRovoAppArtifactTitleRename({
	content,
	nextTitle,
	previousTitle,
}) {
	if (typeof content !== "string" || !content.length) {
		return content;
	}

	const normalizedNextTitle = getNonEmptyString(nextTitle);
	const normalizedPreviousTitle = getNonEmptyString(previousTitle);
	if (!normalizedNextTitle || !normalizedPreviousTitle || normalizedNextTitle === normalizedPreviousTitle) {
		return content;
	}

	const titleHeadingPattern = new RegExp(
		`^(#{1,6}\\s*)${escapeRegExp(normalizedPreviousTitle)}(\\s*)$`,
		"m",
	);
	if (titleHeadingPattern.test(content)) {
		return content.replace(
			titleHeadingPattern,
			(_, prefix, suffix) => `${prefix}${normalizedNextTitle}${suffix}`,
		);
	}

	const firstLinePattern = new RegExp(
		`^${escapeRegExp(normalizedPreviousTitle)}$`,
		"m",
	);
	if (firstLinePattern.test(content)) {
		return content.replace(firstLinePattern, normalizedNextTitle);
	}

	const frontmatterPattern = new RegExp(
		`^(title:\\s*)${escapeRegExp(normalizedPreviousTitle)}(\\s*)$`,
		"m",
	);
	if (frontmatterPattern.test(content)) {
		return content.replace(
			frontmatterPattern,
			(_, prefix, suffix) => `${prefix}${normalizedNextTitle}${suffix}`,
		);
	}

	return content;
}

module.exports = {
	applyRovoAppArtifactTitleRename,
	deriveRovoAppVersionChangeLabel,
	extractRovoAppRequestedTitle,
	isExplicitNewRovoAppArtifactRequest,
	isRenameOnlyRovoAppArtifactRequest,
	isSameRovoAppArtifactVersionRequest,
};
