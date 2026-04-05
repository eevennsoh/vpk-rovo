"use strict";

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function createRovoAppRunFailure({
	canRetry = true,
	code = "future_chat_run_failed",
	details,
	message,
} = {}) {
	const resolvedMessage = getNonEmptyString(message) || "Rovo App run failed";
	const error = new Error(resolvedMessage);
	error.code = getNonEmptyString(code) || "future_chat_run_failed";
	error.details = getNonEmptyString(details) || undefined;
	error.canRetry = canRetry !== false;
	error.isRovoAppRunFailure = true;
	return error;
}

function isRovoAppRunFailure(error) {
	return Boolean(
		error &&
		typeof error === "object" &&
		error.isRovoAppRunFailure === true &&
		getNonEmptyString(error.message),
	);
}

function getRovoAppRunFailurePayload(error, fallbackMessage) {
	if (!isRovoAppRunFailure(error)) {
		return {
			code: "future_chat_run_failed",
			message: getNonEmptyString(fallbackMessage) || "Rovo App run failed",
			details: undefined,
			canRetry: true,
		};
	}

	return {
		code: getNonEmptyString(error.code) || "future_chat_run_failed",
		message: getNonEmptyString(error.message) || "Rovo App run failed",
		details: getNonEmptyString(error.details) || undefined,
		canRetry: error.canRetry !== false,
	};
}

module.exports = {
	createRovoAppRunFailure,
	getRovoAppRunFailurePayload,
	isRovoAppRunFailure,
};
