const { getNonEmptyString } = require("./shared-utils");

const GENERIC_ARTIFACT_TITLE_REGEX =
	/^(?:an?\s+)?artifact(?:\s+(?:about|from|for|of|based on)\s+(?:it|this|that|them))?$/i;

function decodeHtmlEntities(value) {
	return value
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, "\"")
		.replace(/&#39;/g, "'");
}

function sanitizeRovoAppArtifactTitle(value) {
	const normalizedValue = getNonEmptyString(value);
	if (!normalizedValue) {
		return null;
	}

	const sanitizedValue = decodeHtmlEntities(normalizedValue)
		.replace(/<[^>]+>/g, " ")
		.replace(/^#+\s*/u, "")
		.replace(/\*\*([^*]+)\*\*/gu, "$1")
		.replace(/\*([^*]+)\*/gu, "$1")
		.replace(/`([^`]+)`/gu, "$1")
		.replace(/^["'“”‘’]+|["'“”‘’]+$/gu, "")
		.replace(/[.?!:;]+$/u, "")
		.replace(/\s+/gu, " ")
		.trim();
	if (!sanitizedValue) {
		return null;
	}

	return sanitizedValue.slice(0, 80);
}

function normalizeRovoAppTitleCandidateFromRequest(value) {
	const normalizedValue = getNonEmptyString(value);
	if (!normalizedValue) {
		return null;
	}

	const cleanedValue = normalizedValue
		.replace(
			/^(?:please\s+)?(?:write|draft|create|build|generate|make|compose|outline|summari[sz]e|plan|design|implement|refactor|turn|convert)\s+/iu,
			"",
		)
		.replace(
			/^(?:me\s+)?(?:an?\s+)?(?:new\s+|another\s+|separate\s+|different\s+)?(?:artifact|document|doc|memo|plan|brief|proposal|spec|summary|report|email|copy|article|blog|code|component|app|page|ui|table|spreadsheet|sheet)\s+(?:about|on|for|of|from)\s+/iu,
			"",
		)
		.replace(
			/^(?:an?\s+)?(?:artifact|document|doc|memo|plan|brief|proposal|spec|summary|report|email|copy|article|blog|code|component|app|page|ui|table|spreadsheet|sheet)\s+(?:about|on|for|of|from)\s+/iu,
			"",
		)
		.replace(/^(?:about|on|for|of)\s+/iu, "")
		.trim();

	if (!cleanedValue || GENERIC_ARTIFACT_TITLE_REGEX.test(cleanedValue)) {
		return null;
	}

	return sanitizeRovoAppArtifactTitle(cleanedValue);
}

function deriveRovoAppArtifactTitle({
	action,
	activeArtifact,
	conversationHistory,
	decisionTitle,
	latestUserMessage,
}) {
	const normalizedDecisionTitle = sanitizeRovoAppArtifactTitle(decisionTitle);
	if (normalizedDecisionTitle && !GENERIC_ARTIFACT_TITLE_REGEX.test(normalizedDecisionTitle)) {
		return normalizedDecisionTitle;
	}

	if (action === "updateDocument") {
		return sanitizeRovoAppArtifactTitle(activeArtifact?.title) || "Artifact draft";
	}

	const candidateMessages = [latestUserMessage];
	if (action !== "createDocument" && Array.isArray(conversationHistory)) {
		for (let index = conversationHistory.length - 1; index >= 0; index--) {
			const message = conversationHistory[index];
			if (message?.type === "user" && typeof message.content === "string") {
				candidateMessages.push(message.content);
			}
		}
	}

	for (const candidate of candidateMessages) {
		const normalizedCandidate = normalizeRovoAppTitleCandidateFromRequest(candidate);
		if (normalizedCandidate) {
			return normalizedCandidate;
		}
	}

	return "Artifact draft";
}

function extractRovoAppArtifactTitleFromContent(content) {
	const normalizedContent = getNonEmptyString(content);
	if (!normalizedContent) {
		return null;
	}

	const titleTagMatch = normalizedContent.match(/<title[^>]*>([\s\S]*?)<\/title>/iu);
	const htmlTitle = sanitizeRovoAppArtifactTitle(titleTagMatch?.[1]);
	if (htmlTitle) {
		return htmlTitle;
	}

	const frontmatterTitleMatch = normalizedContent.match(/^\s*title:\s*(.+)$/imu);
	const frontmatterTitle = sanitizeRovoAppArtifactTitle(frontmatterTitleMatch?.[1]);
	if (frontmatterTitle) {
		return frontmatterTitle;
	}

	const markdownHeadingMatch = normalizedContent.match(/^\s*#\s+(.+)$/imu);
	const markdownHeading = sanitizeRovoAppArtifactTitle(markdownHeadingMatch?.[1]);
	if (markdownHeading) {
		return markdownHeading;
	}

	const h1Match = normalizedContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/iu);
	const htmlHeading = sanitizeRovoAppArtifactTitle(h1Match?.[1]);
	if (htmlHeading) {
		return htmlHeading;
	}

	const firstLine = normalizedContent
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.find((line) => {
			if (!line || line.length > 120) {
				return false;
			}

			return !/^(?:<!doctype|<html|<head|<body|<style|<script|```|---+$|\* \{|\{|\})/iu.test(
				line,
			);
		});

	return sanitizeRovoAppArtifactTitle(firstLine);
}

module.exports = {
	deriveRovoAppArtifactTitle,
	extractRovoAppArtifactTitleFromContent,
	sanitizeRovoAppArtifactTitle,
};
