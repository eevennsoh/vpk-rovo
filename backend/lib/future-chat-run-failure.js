"use strict";

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function createFutureChatRunFailure({
	canRetry = true,
	code = "future_chat_run_failed",
	details,
	message,
} = {}) {
	const resolvedMessage = getNonEmptyString(message) || "Future Chat run failed";
	const error = new Error(resolvedMessage);
	error.code = getNonEmptyString(code) || "future_chat_run_failed";
	error.details = getNonEmptyString(details) || undefined;
	error.canRetry = canRetry !== false;
	error.isFutureChatRunFailure = true;
	return error;
}

function isFutureChatRunFailure(error) {
	return Boolean(
		error &&
		typeof error === "object" &&
		error.isFutureChatRunFailure === true &&
		getNonEmptyString(error.message),
	);
}

function getFutureChatRunFailurePayload(error, fallbackMessage) {
	if (!isFutureChatRunFailure(error)) {
		return {
			code: "future_chat_run_failed",
			message: getNonEmptyString(fallbackMessage) || "Future Chat run failed",
			details: undefined,
			canRetry: true,
		};
	}

	return {
		code: getNonEmptyString(error.code) || "future_chat_run_failed",
		message: getNonEmptyString(error.message) || "Future Chat run failed",
		details: getNonEmptyString(error.details) || undefined,
		canRetry: error.canRetry !== false,
	};
}

module.exports = {
	createFutureChatRunFailure,
	getFutureChatRunFailurePayload,
	isFutureChatRunFailure,
};
