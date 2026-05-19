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
const ATLASSIAN_LOGO_MARKER = 'data-rovo-artifact-atlassian-logo="true"';
const ATLASSIAN_LOGO_CSS = `
.vpk-atlassian-logo {
\tdisplay: inline-flex;
\talign-items: center;
\twidth: 99px;
\theight: 16px;
\tmargin: 0 0 12pt 0;
\tcolor: var(--primary-blue, #0C66E4);
}
.vpk-atlassian-logo svg {
\tdisplay: block;
\twidth: 99px;
\theight: auto;
}
`;
const ATLASSIAN_LOGO_HTML = `<div class="vpk-atlassian-logo" ${ATLASSIAN_LOGO_MARKER} aria-label="Atlassian">
\t<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 198 32" focusable="false" role="img" aria-hidden="true" fill="none">
\t\t<path fill="currentColor" d="M22.878 24.378 12.293 3.208c-.208-.458-.416-.541-.666-.541-.209 0-.459.083-.709.5-1.5 2.375-2.167 5.125-2.167 8 0 4.001 2.042 7.752 5.043 13.794.333.667.583.792 1.166.792h7.335c.542 0 .833-.208.833-.625 0-.208-.041-.333-.25-.75M7.501 14.377c-.833-1.25-1.083-1.334-1.292-1.334s-.333.083-.708.834L.208 24.46c-.166.334-.208.459-.208.625 0 .334.292.667.917.667h7.46c.5 0 .874-.416 1.083-1.208.25-1 .333-1.876.333-2.917 0-2.917-1.292-5.751-2.292-7.251z"/>
\t\t<path fill="currentColor" d="M107.447 10.828c0 2.972 1.345 5.308 6.795 6.37 3.185.707 3.893 1.203 3.893 2.265 0 1.061-.708 1.698-2.973 1.698-2.619 0-5.733-.92-7.785-2.123v4.813c1.627.778 3.751 1.698 7.785 1.698 5.662 0 7.856-2.548 7.856-6.228m0 .07c0-3.538-1.84-5.166-7.148-6.298-2.902-.637-3.61-1.274-3.61-2.194 0-1.133 1.062-1.628 2.973-1.628 2.335 0 4.6.708 6.794 1.698v-4.6c-1.557-.779-3.892-1.345-6.653-1.345-5.237 0-7.927 2.265-7.927 5.945m72.475-5.803v20.17h4.318V9.979l1.769 4.035 6.087 11.324h5.379V5.166h-4.247v13.022l-1.628-3.821-4.883-9.201zm-27.319 0h-4.671v20.17h4.671zm-10.05 14.154c0-3.538-1.841-5.166-7.149-6.298-2.902-.637-3.609-1.274-3.609-2.194 0-1.133 1.061-1.628 2.972-1.628 2.336 0 4.601.708 6.795 1.699v-4.6c-1.557-.78-3.893-1.346-6.653-1.346-5.238 0-7.927 2.265-7.927 5.946 0 2.972 1.344 5.308 6.794 6.37 3.185.707 3.893 1.203 3.893 2.264 0 1.062-.708 1.699-2.973 1.699-2.618 0-5.733-.92-7.785-2.123v4.812c1.628.779 3.751 1.699 7.785 1.699 5.592 0 7.857-2.548 7.857-6.3M71.069 5.166v20.17h9.625l1.486-4.387h-6.44V5.166zm-19.039 0v4.317h5.167v15.854h4.741V9.483h5.592V5.166zm-6.866 0h-6.157L32 25.336h5.379l.99-3.396c1.204.353 2.478.566 3.752.566s2.548-.213 3.751-.567l.991 3.398h5.379c-.07 0-7.078-20.171-7.078-20.171M42.05 18.259c-.92 0-1.77-.141-2.548-.354L42.05 9.13l2.548 8.776a9.6 9.6 0 0 1-2.548.354zM97.326 5.166H91.17l-7.078 20.17h5.38l.99-3.396c1.203.353 2.477.566 3.751.566s2.548-.213 3.751-.567l.991 3.398h5.379zm-3.114 13.093c-.92 0-1.77-.141-2.548-.354l2.548-8.776 2.548 8.776a9.6 9.6 0 0 1-2.548.354m75.306-13.093h-6.157l-7.007 20.17h5.379l.991-3.396c1.203.353 2.477.566 3.751.566s2.548-.213 3.751-.567l.991 3.398h5.379zm-3.043 13.093c-.92 0-1.77-.141-2.548-.354l2.548-8.776 2.548 8.776a10 10 0 0 1-2.548.354"/>
\t</svg>
</div>`;

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

function isAtlassianLogoAdditionRequest({
	latestUserMessage,
}) {
	const normalizedMessage = getNonEmptyString(latestUserMessage)?.toLowerCase() || "";
	if (!normalizedMessage) {
		return false;
	}

	return (
		/\batlassian\b/.test(normalizedMessage) &&
		/\blogo\b/.test(normalizedMessage) &&
		/\b(add|insert|include|place|put)\b/.test(normalizedMessage) &&
		/\b(top|header|upper|left)\b/.test(normalizedMessage)
	);
}

function applyAtlassianLogoToHtmlArtifact({
	content,
	latestUserMessage,
}) {
	if (
		typeof content !== "string" ||
		!content.length ||
		!isAtlassianLogoAdditionRequest({ latestUserMessage }) ||
		!/<html[\s>]/iu.test(content)
	) {
		return null;
	}

	if (content.includes(ATLASSIAN_LOGO_MARKER)) {
		return content;
	}

	const withStyles = /<\/style>/iu.test(content)
		? content.replace(/<\/style>/iu, `${ATLASSIAN_LOGO_CSS}\n</style>`)
		: content.replace(/<\/head>/iu, `<style>${ATLASSIAN_LOGO_CSS}</style>\n</head>`);

	if (/<main\b[^>]*>/iu.test(withStyles)) {
		return withStyles.replace(
			/(<main\b[^>]*>)/iu,
			`$1\n${ATLASSIAN_LOGO_HTML}\n`,
		);
	}

	if (/<body\b[^>]*>/iu.test(withStyles)) {
		return withStyles.replace(
			/(<body\b[^>]*>)/iu,
			`$1\n${ATLASSIAN_LOGO_HTML}\n`,
		);
	}

	return null;
}

module.exports = {
	applyAtlassianLogoToHtmlArtifact,
	applyRovoAppArtifactTitleRename,
	deriveRovoAppVersionChangeLabel,
	extractRovoAppRequestedTitle,
	isAtlassianLogoAdditionRequest,
	isExplicitNewRovoAppArtifactRequest,
	isRenameOnlyRovoAppArtifactRequest,
	isSameRovoAppArtifactVersionRequest,
};
