import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { buildBackendUrlCandidates, fetchBackend } from "./backend-url.ts";

test("buildBackendUrlCandidates keeps the reserved backend port behind a stale recorded port", () => {
	assert.deepEqual(
		buildBackendUrlCandidates({
			recordedPort: 8081,
			reservedPort: 8080,
		}),
		["http://localhost:8081", "http://localhost:8080"],
	);
});

test("buildBackendUrlCandidates preserves env overrides ahead of port-file candidates", () => {
	assert.deepEqual(
		buildBackendUrlCandidates({
			backendUrlEnv: "http://remote.example",
			backendPortEnv: 8090,
			recordedPort: 8081,
			reservedPort: 8080,
		}),
		[
			"http://remote.example",
			"http://localhost:8090",
			"http://localhost:8081",
			"http://localhost:8080",
		],
	);
});

test("fetchBackend retries generic backend route 404 responses against later candidates", async (t) => {
	const originalFetch = globalThis.fetch;
	const requestedUrls: string[] = [];
	t.after(() => {
		globalThis.fetch = originalFetch;
	});

	globalThis.fetch = (async (url) => {
		requestedUrls.push(String(url));
		if (requestedUrls.length === 1) {
			return new Response(
				JSON.stringify({ error: "API route not found: /api/personal-graph/vault" }),
				{ status: 404 },
			);
		}

		return new Response(JSON.stringify({ status: "ready" }), {
			headers: { "Content-Type": "application/json" },
			status: 200,
		});
	}) as typeof fetch;

	const result = await fetchBackend("/api/personal-graph/vault", {
		backendUrls: ["http://stale-backend.local", "http://current-backend.local"],
		shouldRetryResponse: async (response) => {
			if (response.status !== 404) {
				return false;
			}
			const body = (await response.json()) as { error?: string };
			return body.error === "API route not found: /api/personal-graph/vault";
		},
	});

	assert.equal(result.backendUrl, "http://current-backend.local");
	assert.deepEqual(requestedUrls, [
		"http://stale-backend.local/api/personal-graph/vault",
		"http://current-backend.local/api/personal-graph/vault",
	]);
	assert.equal(result.response.status, 200);
});
