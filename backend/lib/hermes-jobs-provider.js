"use strict";

const path = require("node:path");
const { createHermesJobsLocalProvider } = require("./hermes-jobs-local");

function createHermesJobsProvider(options = {}) {
	return createHermesJobsLocalProvider({
		...options,
		baseDir: typeof options.baseDir === "string" && options.baseDir.trim().length > 0
			? options.baseDir
			: path.join(__dirname, "..", "data"),
	});
}

module.exports = {
	createHermesJobsProvider,
	createHermesJobsLocalProvider,
};
