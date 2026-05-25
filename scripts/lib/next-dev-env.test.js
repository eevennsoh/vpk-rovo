const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { getNextDevEnv, getNextDevHostname } = require("./next-dev-env");

function makeFixture() {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "next-dev-env-"));
	const cwd = path.join(root, "project");
	const home = path.join(root, "home");
	fs.mkdirSync(cwd);
	fs.mkdirSync(home);
	return { root, cwd, home };
}

function cleanupFixture(fixture) {
	fs.rmSync(fixture.root, { recursive: true, force: true });
}

test("getNextDevEnv defaults Watchpack to polling for local dev route discovery", () => {
	const env = getNextDevEnv({
		env: { PATH: "/bin" },
		port: 3100,
	});

	assert.equal(env.PORT, "3100");
	assert.equal(env.WATCHPACK_POLLING, "true");
});

test("getNextDevEnv preserves explicit Watchpack polling overrides", () => {
	const env = getNextDevEnv({
		env: {
			PATH: "/bin",
			WATCHPACK_POLLING: "false",
		},
		port: 3100,
	});

	assert.equal(env.WATCHPACK_POLLING, "false");
});

test("getNextDevEnv forwards the backend port for frontend API calls", () => {
	const env = getNextDevEnv({
		backendPort: "8180",
		env: { PATH: "/bin" },
		port: 3100,
	});

	assert.equal(env.NEXT_PUBLIC_BACKEND_PORT, "8180");
});

test("getNextDevHostname defaults to localhost when no portless route is registered", () => {
	const fixture = makeFixture();
	try {
		assert.equal(
			getNextDevHostname({ env: {}, cwd: fixture.cwd, home: fixture.home }),
			"localhost",
		);
	} finally {
		cleanupFixture(fixture);
	}
});

test("getNextDevHostname respects an explicit HOST override", () => {
	const fixture = makeFixture();
	try {
		assert.equal(
			getNextDevHostname({
				env: { HOST: "127.0.0.1" },
				cwd: fixture.cwd,
				home: fixture.home,
			}),
			"127.0.0.1",
		);
	} finally {
		cleanupFixture(fixture);
	}
});

test("getNextDevHostname binds IPv4 when this project has a portless route", () => {
	const fixture = makeFixture();
	try {
		fs.writeFileSync(
			path.join(fixture.cwd, "package.json"),
			JSON.stringify({ name: "vpk-rovo" }),
		);
		fs.mkdirSync(path.join(fixture.home, ".portless"));
		fs.writeFileSync(
			path.join(fixture.home, ".portless", "routes.json"),
			JSON.stringify([
				{ hostname: "other-app.localhost", port: 5000, pid: 1 },
				{ hostname: "vpk-rovo.localhost", port: 4259, pid: 2 },
			]),
		);

		assert.equal(
			getNextDevHostname({ env: {}, cwd: fixture.cwd, home: fixture.home }),
			"0.0.0.0",
		);
	} finally {
		cleanupFixture(fixture);
	}
});

test("getNextDevHostname ignores portless routes for other projects", () => {
	const fixture = makeFixture();
	try {
		fs.writeFileSync(
			path.join(fixture.cwd, "package.json"),
			JSON.stringify({ name: "vpk-rovo" }),
		);
		fs.mkdirSync(path.join(fixture.home, ".portless"));
		fs.writeFileSync(
			path.join(fixture.home, ".portless", "routes.json"),
			JSON.stringify([
				{ hostname: "other-app.localhost", port: 5000, pid: 1 },
			]),
		);

		assert.equal(
			getNextDevHostname({ env: {}, cwd: fixture.cwd, home: fixture.home }),
			"localhost",
		);
	} finally {
		cleanupFixture(fixture);
	}
});
