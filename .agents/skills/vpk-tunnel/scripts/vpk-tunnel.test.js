const assert = require("node:assert/strict");
const test = require("node:test");
const {
	DEFAULT_TARGET_URL,
	REQUIRED_TUNNEL_DEV_ORIGINS,
	assertTunnelDevOrigins,
	buildPublicUrl,
	checkDependencies,
	describeShareTarget,
	extractAllowedDevOrigins,
	extractPublicBaseUrl,
	missingTunnelDevOrigins,
	nextConfigPathForTarget,
	normalizeTargetUrl,
	parseCliArguments,
	resolvePortlessTarget,
	sessionNameForHostname,
	startTunnel,
	statusTunnel,
	stopTunnel,
	verifyHttpTarget,
} = require("./vpk-tunnel");

const ALLOWED_NEXT_CONFIG = `
	allowedDevOrigins: [
		"vpk-rovo.localhost",
		"*.vpk-rovo.localhost",
		"*.public.atlastunnel.com",
		"*.atlastunnel.com",
	],
`;

function result(status = 0, stdout = "", stderr = "") {
	return { error: null, status, stderr, stdout };
}

test("normalizes the stable main Portless URL by default", () => {
	assert.equal(normalizeTargetUrl().href, `${DEFAULT_TARGET_URL}/`);
});

test("resolves an exact custom Portless route and preserves its full local URL", async () => {
	const target = await resolvePortlessTarget({
		targetUrl: "https://feature.vpk-rovo.localhost/jira?view=board#activity",
		routes: [{ hostname: "feature.vpk-rovo.localhost", port: 4321, pid: 99 }],
		ownerAlive: () => true,
		probePort: async (port) => port === 4321,
		worktrees: [],
	});

	assert.equal(target.hostname, "feature.vpk-rovo.localhost");
	assert.equal(target.port, 4321);
	assert.equal(
		target.localUrl,
		"https://feature.vpk-rovo.localhost/jira?view=board#activity",
	);
	assert.equal(target.isCatalogRoot, false);
	assert.equal(target.pathname, "/jira");
});

test("rejects unknown and dead Portless routes", async () => {
	await assert.rejects(
		resolvePortlessTarget({
			targetUrl: "https://missing.localhost",
			routes: [],
			worktrees: [],
		}),
		/No Portless route matches/u,
	);
	await assert.rejects(
		resolvePortlessTarget({
			targetUrl: "https://dead.localhost",
			routes: [{ hostname: "dead.localhost", port: 4444, pid: 1 }],
			ownerAlive: () => true,
			probePort: async () => false,
			worktrees: [],
		}),
		/port 4444, but that port is not responding/u,
	);
	await assert.rejects(
		resolvePortlessTarget({
			targetUrl: "https://stale.localhost",
			routes: [{ hostname: "stale.localhost", port: 4555, pid: 1 }],
			ownerAlive: () => false,
			probePort: async () => true,
			worktrees: [],
		}),
		/route stale\.localhost is stale/u,
	);
});

test("constructs hostname-scoped session names", () => {
	assert.equal(
		sessionNameForHostname("Feature.VPK-Rovo.localhost"),
		"vpk-tunnel-feature-vpk-rovo-localhost",
	);
	const longName = sessionNameForHostname(`${"a".repeat(100)}.localhost`);
	assert.ok(longName.length <= 80);
	assert.match(longName, /^vpk-tunnel-/u);
});

test("preserves the local path, query, and fragment in the public URL", () => {
	assert.equal(
		buildPublicUrl(
			"https://research-session.atlastunnel.com",
			"https://feature.localhost/jira?view=board#activity",
		),
		"https://research-session.atlastunnel.com/jira?view=board#activity",
	);
});

test("extracts an external URL but ignores Portless URLs", () => {
	assert.equal(
		extractPublicBaseUrl(
			"Local https://vpk-rovo.localhost is available at https://research.atlastunnel.com",
		),
		"https://research.atlastunnel.com",
	);
	assert.equal(extractPublicBaseUrl("Help: https://example.com/tunnel"), null);
});

test("flags catalog-root shares separately from project routes", () => {
	assert.deepEqual(describeShareTarget("https://vpk-rovo.localhost"), {
		isCatalogRoot: true,
		pathname: "/",
	});
	assert.deepEqual(describeShareTarget("https://vpk-rovo.localhost/jira-golden-journeys-v4"), {
		isCatalogRoot: false,
		pathname: "/jira-golden-journeys-v4",
	});
});

test("extracts allowedDevOrigins and reports missing Atlas Tunnel hosts", () => {
	assert.deepEqual(
		extractAllowedDevOrigins(ALLOWED_NEXT_CONFIG),
		[
			"vpk-rovo.localhost",
			"*.vpk-rovo.localhost",
			"*.public.atlastunnel.com",
			"*.atlastunnel.com",
		],
	);
	assert.deepEqual(
		missingTunnelDevOrigins(["vpk-rovo.localhost", "*.vpk-rovo.localhost"]),
		[...REQUIRED_TUNNEL_DEV_ORIGINS],
	);
	assert.deepEqual(missingTunnelDevOrigins([...REQUIRED_TUNNEL_DEV_ORIGINS]), []);
	assert.equal(
		nextConfigPathForTarget({ sourceWorktree: { path: "/tmp/worktree" } }),
		"/tmp/worktree/next.config.ts",
	);
	assert.throws(
		() => assertTunnelDevOrigins({
			configPath: "/tmp/worktree/next.config.ts",
			readFile: () => `allowedDevOrigins: ["vpk-rovo.localhost"]`,
		}),
		/allowedDevOrigins is missing \*\.public\.atlastunnel\.com, \*\.atlastunnel\.com/u,
	);
	assert.doesNotThrow(() => assertTunnelDevOrigins({
		configPath: "/tmp/worktree/next.config.ts",
		readFile: () => ALLOWED_NEXT_CONFIG,
	}));
});

test("requires a successful local HTTP response", () => {
	assert.equal(verifyHttpTarget("https://feature.localhost", () => result(0, "204")), 204);
	assert.throws(
		() => verifyHttpTarget("https://feature.localhost", () => result(28, "000", "timed out")),
		/Local prototype did not return a successful HTTP response: timed out/u,
	);
	assert.throws(
		() => verifyHttpTarget("https://feature.localhost", () => result(0, "500")),
		/HTTP 500/u,
	);
});

test("reports missing dependencies with setup guidance", () => {
	const run = (command, args) => {
		if (command === "/bin/sh" && args.at(-1).includes("atlas")) return result(1);
		return result(0, "/usr/bin/tool\n");
	};
	assert.throws(() => checkDependencies(run), /Missing required tunnel dependency: atlas/u);
});

test("treats a URL-only invocation as the documented start command", () => {
	assert.deepEqual(
		parseCliArguments(["https://feature.localhost/demo"]),
		{
			command: "start",
			targetUrl: "https://feature.localhost/demo",
		},
	);
});

test("reuses an existing scoped tunnel without starting another", async () => {
	const calls = [];
	const run = (command, args) => {
		calls.push([command, args]);
		if (command === "/bin/sh") return result(0, "/usr/bin/tool\n");
		if (command === "atlas") return result(0, "tunnel 141 Atlas Tunnel CLI\n");
		if (command === "curl") return result(0, "200");
		if (command === "tmux" && args[0] === "has-session") return result(0);
		if (command === "tmux" && args[0] === "show-options" && args.at(-1) === "@vpk-tunnel-port") {
			return result(0, "4321\n");
		}
		if (command === "tmux" && args[0] === "capture-pane") {
			return result(0, "Public URL: https://research.atlastunnel.com\n");
		}
		return result(0);
	};
	const tunnel = await startTunnel({
		readFile: () => ALLOWED_NEXT_CONFIG,
		resolveTarget: async () => ({
			hostname: "feature.localhost",
			localUrl: "https://feature.localhost/demo",
			port: 4321,
		}),
		run,
	});

	assert.equal(tunnel.reused, true);
	assert.equal(tunnel.publicUrl, "https://research.atlastunnel.com/demo");
	assert.equal(
		calls.some(([command, args]) => command === "tmux" && args[0] === "new-session"),
		false,
	);
});

test("restarts a scoped tunnel when its resolved frontend port changes", async () => {
	let sessionExists = true;
	const calls = [];
	const run = (command, args) => {
		calls.push([command, args]);
		if (command === "/bin/sh") return result(0, "/usr/bin/tool\n");
		if (command === "atlas") return result(0, "tunnel 141 Atlas Tunnel CLI\n");
		if (command === "curl") return result(0, "200");
		if (command === "tmux" && args[0] === "has-session") {
			return result(sessionExists ? 0 : 1);
		}
		if (command === "tmux" && args[0] === "show-options" && args.at(-1) === "@vpk-tunnel-port") {
			return result(0, "4000\n");
		}
		if (command === "tmux" && args[0] === "kill-session") {
			sessionExists = false;
			return result(0);
		}
		if (command === "tmux" && args[0] === "new-session") {
			sessionExists = true;
			return result(0);
		}
		return result(0);
	};
	const tunnel = await startTunnel({
		readFile: () => ALLOWED_NEXT_CONFIG,
		resolveTarget: async () => ({
			hostname: "feature.localhost",
			localUrl: "https://feature.localhost/demo",
			port: 4321,
		}),
		run,
		sleep: async () => {},
		waitForUrl: async () => "https://research.atlastunnel.com",
	});

	assert.equal(tunnel.reused, false);
	assert.equal(
		calls.some(([command, args]) => command === "tmux" && args[0] === "kill-session"),
		true,
	);
	assert.equal(
		calls.some(
			([command, args]) => command === "tmux"
				&& args[0] === "new-session"
				&& args.at(-1) === "atlas tunnel start --port 4321 --public",
		),
		true,
	);
});

test("starts the canonical public Atlas command in a new scoped session", async () => {
	const calls = [];
	const run = (command, args) => {
		calls.push([command, args]);
		if (command === "/bin/sh") return result(0, "/usr/bin/tool\n");
		if (command === "atlas") return result(0, "tunnel 141 Atlas Tunnel CLI\n");
		if (command === "curl") return result(0, "200");
		if (command === "tmux" && args[0] === "has-session") return result(1);
		return result(0);
	};
	const tunnel = await startTunnel({
		readFile: () => ALLOWED_NEXT_CONFIG,
		resolveTarget: async () => ({
			hostname: "feature.localhost",
			localUrl: "https://feature.localhost/demo",
			port: 4321,
		}),
		run,
		waitForUrl: async () => "https://research.atlastunnel.com",
	});

	assert.equal(tunnel.reused, false);
	assert.deepEqual(
		calls.find(([command, args]) => command === "tmux" && args[0] === "new-session"),
		[
			"tmux",
			[
				"new-session",
				"-d",
				"-s",
				"vpk-tunnel-feature-localhost",
				"atlas tunnel start --port 4321 --public",
			],
		],
	);
	assert.deepEqual(
		calls.find(([command, args]) => command === "tmux" && args[0] === "set-option"),
		[
			"tmux",
			[
				"set-option",
				"-t",
				"vpk-tunnel-feature-localhost",
				"@vpk-tunnel-public-url",
				"https://research.atlastunnel.com",
			],
		],
	);
	assert.deepEqual(
		calls.find(
			([command, args]) => command === "tmux"
				&& args[0] === "set-option"
				&& args.at(-2) === "@vpk-tunnel-port",
		),
		[
			"tmux",
			[
				"set-option",
				"-t",
				"vpk-tunnel-feature-localhost",
				"@vpk-tunnel-port",
				"4321",
			],
		],
	);
});

test("refuses to start when Next.js allowedDevOrigins omits Atlas Tunnel hosts", async () => {
	let calls = 0;
	await assert.rejects(
		startTunnel({
			readFile: () => `allowedDevOrigins: ["vpk-rovo.localhost"]`,
			resolveTarget: async () => ({
				hostname: "feature.localhost",
				localUrl: "https://feature.localhost/demo",
				port: 4321,
				sourceWorktree: { path: "/tmp/worktree" },
			}),
			run: () => {
				calls += 1;
				return result();
			},
		}),
		/blank public page because allowedDevOrigins is missing/u,
	);
	assert.equal(calls, 0);
});

test("reports a stored public URL after startup logs scroll away", () => {
	const run = (command, args) => {
		if (command === "tmux" && args[0] === "has-session") return result(0);
		if (command === "tmux" && args[0] === "show-options") {
			return args.at(-1) === "@vpk-tunnel-port"
				? result(0, "4321\n")
				: result(0, "https://research.atlastunnel.com\n");
		}
		if (command === "tmux" && args[0] === "capture-pane") return result(0, "request logs\n");
		return result(1);
	};
	const status = statusTunnel({ run, targetUrl: "https://feature.localhost/demo" });

	assert.equal(status.running, true);
	assert.equal(status.port, 4321);
	assert.equal(status.publicUrl, "https://research.atlastunnel.com/demo");
});

test("stops only the target hostname session", async () => {
	let hasSessionChecks = 0;
	const calls = [];
	const run = (command, args) => {
		calls.push([command, args]);
		if (command === "tmux" && args[0] === "has-session") {
			hasSessionChecks += 1;
			return result(hasSessionChecks <= 2 ? 0 : 1);
		}
		return result(0);
	};
	const stopped = await stopTunnel({
		run,
		sleep: async () => {},
		targetUrl: "https://feature.localhost/demo",
	});

	assert.equal(stopped.stopped, true);
	assert.deepEqual(
		calls.filter(([command]) => command === "tmux").map(([, args]) => args.slice(0, 3)),
		[
			["has-session", "-t", "vpk-tunnel-feature-localhost"],
			["send-keys", "-t", "vpk-tunnel-feature-localhost"],
			["has-session", "-t", "vpk-tunnel-feature-localhost"],
			["kill-session", "-t", "vpk-tunnel-feature-localhost"],
		],
	);
});
