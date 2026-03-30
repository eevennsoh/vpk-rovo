/**
 * Resolves a Next.js App Router file path to its corresponding URL route.
 * Ported from `make-artifact-surface.tsx:routeFromAppPageFilePath()` for
 * backend reuse during plan execution artifact generation.
 */

/**
 * Convert an `app/` page file path to its URL route.
 * Returns `null` for dynamic, parallel, or intercepting routes.
 *
 * @param {string} filePath — e.g. `"app/example/page.tsx"`
 * @returns {string | null} — e.g. `"/example"`, or `null`
 */
function routeFromAppPageFilePath(filePath) {
	if (filePath === "app/page.tsx") {
		return "/";
	}

	if (!filePath.startsWith("app/") || !filePath.endsWith("/page.tsx")) {
		return null;
	}

	const relativePath = filePath.slice("app/".length, -"/page.tsx".length);
	if (!relativePath) {
		return "/";
	}

	const rawSegments = relativePath.split("/").filter((segment) => segment.length > 0);
	const routeSegments = [];
	for (const rawSegment of rawSegments) {
		// Skip route groups like (marketing)
		if (/^\(.*\)$/.test(rawSegment)) {
			continue;
		}
		// Reject partial groups or parallel routes
		if (rawSegment.startsWith("(") || rawSegment.startsWith("@")) {
			return null;
		}
		// Reject dynamic segments like [id]
		if (rawSegment.includes("[") || rawSegment.includes("]")) {
			return null;
		}
		routeSegments.push(rawSegment);
	}

	if (routeSegments.length === 0) {
		return "/";
	}
	return `/${routeSegments.join("/")}`;
}

/**
 * Scan tool observation entries for create_file calls targeting app page files
 * and return a deduplicated list of resolvable routes.
 */
function extractAppRoutesFromObservations(observations) {
	if (!Array.isArray(observations)) {
		return [];
	}

	const routes = new Set();
	for (const obs of observations) {
		if (obs.toolName !== "create_file" && obs.toolName !== "write_to_file") {
			continue;
		}

		// Try rawOutput first (structured), then text
		let filePath = null;
		if (obs.rawOutput && typeof obs.rawOutput === "object") {
			filePath =
				typeof obs.rawOutput.path === "string"
					? obs.rawOutput.path
					: typeof obs.rawOutput.file_path === "string"
						? obs.rawOutput.file_path
						: null;
		}
		if (!filePath && typeof obs.text === "string") {
			// Pattern: "Created file: app/example/page.tsx"
			const match = obs.text.match(/(?:app\/[^\s"']+\/page\.tsx)/);
			if (match) {
				filePath = match[0];
			}
		}

		if (filePath) {
			const route = routeFromAppPageFilePath(filePath);
			if (route) {
				routes.add(route);
			}
		}
	}

	return Array.from(routes);
}

/**
 * Check the latest `update_todo` observation to see if all tasks are completed.
 *
 * @param {Array<{toolName: string, text?: string, rawOutput?: unknown}>} observations
 * @returns {boolean}
 */
function areAllPlanTasksCompleted(observations) {
	if (!Array.isArray(observations)) {
		return false;
	}

	// Find the last update_todo result
	let lastUpdateTodo = null;
	for (const obs of observations) {
		if (obs.toolName === "update_todo" && obs.phase === "result") {
			lastUpdateTodo = obs;
		}
	}

	if (!lastUpdateTodo) {
		return false;
	}

	// Check rawOutput first
	if (lastUpdateTodo.rawOutput && typeof lastUpdateTodo.rawOutput === "object") {
		const todos = lastUpdateTodo.rawOutput.todos;
		if (Array.isArray(todos) && todos.length > 0) {
			return todos.every(
				(todo) => todo.status === "completed" || todo.status === "done"
			);
		}
	}

	// Fall back to text parsing: "Total: N tasks (N completed, 0 in_progress, 0 pending)"
	const text = lastUpdateTodo.text || "";
	const summaryMatch = text.match(
		/Total:\s*(\d+)\s*tasks?\s*\(([^)]+)\)/i
	);
	if (summaryMatch) {
		const total = Number.parseInt(summaryMatch[1], 10);
		const completedMatch = summaryMatch[2].match(/(\d+)\s*completed/i);
		const completed = completedMatch
			? Number.parseInt(completedMatch[1], 10)
			: 0;
		return total > 0 && completed === total;
	}

	return false;
}

module.exports = {
	routeFromAppPageFilePath,
	extractAppRoutesFromObservations,
	areAllPlanTasksCompleted,
};
