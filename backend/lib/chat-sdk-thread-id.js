"use strict";

function getNonEmptyString(value) {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

function resolveChatSdkThreadId({
	chatSdkSource,
	threadId,
	id,
} = {}) {
	const explicitThreadId = getNonEmptyString(threadId);
	if (explicitThreadId) {
		return explicitThreadId;
	}

	if (getNonEmptyString(chatSdkSource) === "rovo-app") {
		return getNonEmptyString(id);
	}

	return null;
}

module.exports = {
	resolveChatSdkThreadId,
};
