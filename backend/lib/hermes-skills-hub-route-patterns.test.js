const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const express = require("express");

const serverPath = path.join(__dirname, "..", "server.js");
const serverSource = fs.readFileSync(serverPath, "utf8");

function extractRoutePath(method, prefix) {
	const routeStart = serverSource.indexOf(`app.${method}("${prefix}`);
	assert.notEqual(routeStart, -1, `Expected to find ${method.toUpperCase()} route starting with ${prefix}`);

	const pathStart = routeStart + `app.${method}("`.length;
	const pathEnd = serverSource.indexOf('"', pathStart);
	assert.notEqual(pathEnd, -1, `Expected to find route terminator for ${prefix}`);

	return serverSource.slice(pathStart, pathEnd);
}

function extractRouteHandler(method, routePath) {
	const marker = `app.${method}("${routePath}"`;
	const start = serverSource.indexOf(marker);
	assert.notEqual(start, -1, `Expected to find route handler for ${routePath}`);

	const arrowStart = serverSource.indexOf("=>", start + marker.length);
	assert.notEqual(arrowStart, -1, `Expected to find route arrow function for ${routePath}`);
	const braceStart = serverSource.indexOf("{", arrowStart);
	let depth = 0;
	for (let index = braceStart; index < serverSource.length; index += 1) {
		const char = serverSource[index];
		if (char === "{") depth += 1;
		if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				return serverSource.slice(start, index + 1);
			}
		}
	}

	throw new Error(`Could not parse route handler for ${routePath}`);
}

test("skills hub wildcard routes register under Express 5", () => {
	const inspectRoute = extractRoutePath("get", "/api/skills/hub/inspect/");
	const uninstallRoute = extractRoutePath("delete", "/api/skills/hub/uninstall/");
	const tapsRoute = extractRoutePath("delete", "/api/skills/hub/taps/");

	const app = express();
	assert.doesNotThrow(() => {
		app.get(inspectRoute, (_req, res) => res.status(204).end());
		app.delete(uninstallRoute, (_req, res) => res.status(204).end());
		app.delete(tapsRoute, (_req, res) => res.status(204).end());
	});
});

test("skills hub wildcard handlers use named params instead of legacy positional params", () => {
	const inspectRoute = extractRoutePath("get", "/api/skills/hub/inspect/");
	const uninstallRoute = extractRoutePath("delete", "/api/skills/hub/uninstall/");
	const tapsRoute = extractRoutePath("delete", "/api/skills/hub/taps/");

	const inspectHandler = extractRouteHandler("get", inspectRoute);
	const uninstallHandler = extractRouteHandler("delete", uninstallRoute);
	const tapsHandler = extractRouteHandler("delete", tapsRoute);

	assert.ok(inspectHandler.includes("req.params.identifier"));
	assert.ok(uninstallHandler.includes("req.params.name"));
	assert.ok(tapsHandler.includes("req.params.repo"));
	assert.ok(!inspectHandler.includes("req.params[0]"));
	assert.ok(!uninstallHandler.includes("req.params[0]"));
	assert.ok(!tapsHandler.includes("req.params[0]"));
});
