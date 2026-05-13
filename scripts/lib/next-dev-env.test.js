const assert = require("node:assert/strict");
const test = require("node:test");

const { getNextDevEnv } = require("./next-dev-env");

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
