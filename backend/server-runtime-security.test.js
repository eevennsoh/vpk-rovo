const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const serverPath = path.join(process.cwd(), "backend/server.js");
const serverSource = fs.readFileSync(serverPath, "utf8");

function assertRouteUsesRuntimeAdmin(method, routePath) {
	const pattern = new RegExp(
		`app\\.${method}\\("${routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}",\\s*requireRuntimeAdmin`,
		"u",
	);
	assert.match(serverSource, pattern, `${method.toUpperCase()} ${routePath} should require runtime admin`);
}

test("runtime-control mutations require runtime admin authorization", () => {
	for (const [method, routePath] of [
		["post", "/api/checkpoints"],
		["post", "/api/checkpoints/:id/rollback"],
		["delete", "/api/checkpoints/:id"],
		["post", "/api/rovo/threads/:threadId/browser-workspace"],
		["delete", "/api/rovo/threads/:threadId/browser-workspace"],
		["delete", "/api/orchestrator/log"],
		["post", "/api/jobs"],
		["patch", "/api/jobs/:id"],
		["delete", "/api/jobs/:id"],
		["post", "/api/jobs/:id/run"],
		["post", "/api/jobs/:id/pause"],
		["post", "/api/jobs/:id/resume"],
		["post", "/api/skills/hub/install"],
		["post", "/api/skills/hub/install-by-id"],
		["post", "/api/skills/hub/taps"],
		["post", "/api/skills/:category/:name/toggle"],
		["get", "/api/realtime/audio-conversation-token"],
	]) {
		assertRouteUsesRuntimeAdmin(method, routePath);
	}

	assert.match(serverSource, /app\.use\("\/api\/browser-workspaces", requireRuntimeAdmin\);/u);
	assert.match(serverSource, /app\.use\("\/api\/skills\/drafts", requireRuntimeAdmin\);/u);
	assert.match(serverSource, /app\.delete\("\/api\/skills\/hub\/uninstall\/\*name", requireRuntimeAdmin/u);
	assert.match(serverSource, /app\.delete\("\/api\/skills\/hub\/taps\/\*repo", requireRuntimeAdmin/u);
});

test("runtime admin fails closed in production when token is missing", () => {
	assert.match(serverSource, /process\.env\.NODE_ENV === "production"/u);
	assert.match(serverSource, /VPK_RUNTIME_ADMIN_TOKEN is required/u);
	assert.match(serverSource, /process\.exit\(1\)/u);
});

test("websocket upgrades validate origin and runtime token before upgrade", () => {
	assert.match(serverSource, /function createRuntimeSocketToken/u);
	assert.match(serverSource, /function verifyRuntimeSocketUpgrade/u);
	assert.match(serverSource, /origin && !isAllowedOrigin\(origin\)/u);
	assert.match(serverSource, /isRuntimeSocketTokenValid\(socketToken, scope\)/u);
	assert.match(serverSource, /previewToken/u);
	assert.match(serverSource, /realtimeToken/u);
	assert.match(serverSource, /browserPreviewWss\.handleUpgrade/u);
	assert.match(serverSource, /realtimeWss\.handleUpgrade/u);
});

test("costly or mutating body routes have route-scoped rate and size limits", () => {
	for (const routePath of [
		"/api/chat-sdk",
		"/api/rovo/suggestions",
		"/api/sound-generation",
		"/api/speech-transcription",
		"/api/rovo/files/upload",
		"/api/skills/hub/install",
		"/api/skills/hub/install-by-id",
	]) {
		assert.match(serverSource, new RegExp(routePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"));
	}

	assert.match(serverSource, /express\.json\(\{ limit: "8mb" \}\)/u);
	assert.match(serverSource, /express\.json\(\{ limit: "12mb" \}\)/u);
	assert.match(serverSource, /express\.json\(\{ limit: "5mb" \}\)/u);
});
