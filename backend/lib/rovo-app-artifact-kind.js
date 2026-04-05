const { getNonEmptyString } = require("./shared-utils");

const CODE_REQUEST_REGEX =
	/\b(code|component|tsx|jsx|react|javascript|typescript|python|sql|api|function|script|app|ui|page|web\s?page|website|site|landing\s?page|home\s?page|homepage|html|css|tailwind)\b/i;
const IMAGE_REQUEST_REGEX = /\b(image|photo|picture|illustration|graphic|logo)\b/i;
const SHEET_REQUEST_REGEX = /\b(table|spreadsheet|sheet|csv|matrix|grid)\b/i;

function normalizeRovoAppArtifactKind(value) {
	const normalizedValue = getNonEmptyString(value)?.toLowerCase();
	if (normalizedValue === "code") {
		return "code";
	}

	if (normalizedValue === "sheet" || normalizedValue === "spreadsheet" || normalizedValue === "table") {
		return "sheet";
	}

	if (normalizedValue === "image") {
		return "image";
	}

	return "text";
}

function inferRovoAppArtifactKindFromRequest(latestUserMessage, fallbackKind = "text") {
	const normalizedMessage = getNonEmptyString(latestUserMessage);
	if (!normalizedMessage) {
		return normalizeRovoAppArtifactKind(fallbackKind);
	}

	if (IMAGE_REQUEST_REGEX.test(normalizedMessage)) {
		return "image";
	}

	if (SHEET_REQUEST_REGEX.test(normalizedMessage)) {
		return "sheet";
	}

	if (CODE_REQUEST_REGEX.test(normalizedMessage)) {
		return "code";
	}

	return normalizeRovoAppArtifactKind(fallbackKind);
}

function inferRovoAppArtifactKindFromContent(content, fallbackKind = "text") {
	const normalizedContent = getNonEmptyString(content);
	if (!normalizedContent) {
		return normalizeRovoAppArtifactKind(fallbackKind);
	}

	if (/^data:image\//iu.test(normalizedContent)) {
		return "image";
	}

	if (
		/<!doctype html>/iu.test(normalizedContent) ||
		/<html[\s>]/iu.test(normalizedContent) ||
		/<head[\s>]/iu.test(normalizedContent) ||
		/<body[\s>]/iu.test(normalizedContent) ||
		/<style[\s>]/iu.test(normalizedContent) ||
		/<script[\s>]/iu.test(normalizedContent) ||
		/^```(?:html|tsx|jsx|css|js|javascript|ts|typescript)/imu.test(normalizedContent) ||
		/^\s*(?:import|export|const|let|var|function|class|interface|type)\s+/imu.test(normalizedContent)
	) {
		return "code";
	}

	if (
		/\|.+\|/u.test(normalizedContent) &&
		/\n\|(?:\s*[-:]+\s*\|)+/u.test(normalizedContent)
	) {
		return "sheet";
	}

	return normalizeRovoAppArtifactKind(fallbackKind);
}

module.exports = {
	inferRovoAppArtifactKindFromContent,
	inferRovoAppArtifactKindFromRequest,
	normalizeRovoAppArtifactKind,
};
