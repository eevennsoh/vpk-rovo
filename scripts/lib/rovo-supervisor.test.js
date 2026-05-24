const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");

const {
	startSupervisedRovoPorts,
} = require("./rovo-supervisor");

function createFakeChild() {
	const child = new EventEmitter();
	child.killCalls = [];
	child.kill = (signal) => {
		child.killCalls.push(signal);
	};
	return child;
}

test("startSupervisedRovoPorts restarts a dead port after the configured delay", () => {
	const spawnCalls = [];
	const children = [];
	const timers = [];
	const signalTarget = new EventEmitter();

	startSupervisedRovoPorts({
		ports: [8006],
		rovoBin: "/tmp/rovo",
		buildSpawnArgsForPort: (port) => ["serve", String(port)],
		spawnFn: (bin, args, options) => {
			spawnCalls.push({ bin, args, options });
			const child = createFakeChild();
			children.push(child);
			return child;
		},
		setTimeoutFn: (fn, delayMs) => {
			timers.push({ fn, delayMs });
			return timers.length;
		},
		clearTimeoutFn: () => {},
		signalTarget,
		exitFn: () => {},
		reemitSignalFn: () => {},
		cleanup: () => {},
		logger: {
			log: () => {},
			warn: () => {},
			error: () => {},
		},
	});

	assert.equal(spawnCalls.length, 1);
	assert.deepEqual(spawnCalls[0].args, ["serve", "8006"]);
	assert.equal(spawnCalls[0].options.env.ROVO_PORT, "8006");

	children[0].emit("exit", 1, null);

	assert.equal(timers.length, 1);
	assert.equal(timers[0].delayMs, 1_500);

	timers[0].fn();

	assert.equal(spawnCalls.length, 2);
	assert.deepEqual(spawnCalls[1].args, ["serve", "8006"]);
});

test("startSupervisedRovoPorts stops respawning after shutdown", () => {
	const children = [];
	const timers = [];
	const signalTarget = new EventEmitter();
	let reemittedSignal = null;

	startSupervisedRovoPorts({
		ports: [8007],
		rovoBin: "/tmp/rovo",
		buildSpawnArgsForPort: (port) => ["serve", String(port)],
		spawnFn: () => {
			const child = createFakeChild();
			children.push(child);
			return child;
		},
		setTimeoutFn: (fn, delayMs) => {
			timers.push({ fn, delayMs });
			return timers.length;
		},
		clearTimeoutFn: () => {},
		signalTarget,
		exitFn: () => {},
		reemitSignalFn: (signal) => {
			reemittedSignal = signal;
		},
		cleanup: () => {},
		logger: {
			log: () => {},
			warn: () => {},
			error: () => {},
		},
	});

	signalTarget.emit("SIGTERM");

	assert.deepEqual(children[0].killCalls, ["SIGTERM"]);

	children[0].emit("exit", 0, "SIGTERM");

	assert.equal(reemittedSignal, "SIGTERM");
	assert.equal(timers.length, 0);
});

test("startSupervisedRovoPorts forwards SIGHUP to children during shutdown", () => {
	const children = [];
	const signalTarget = new EventEmitter();
	let reemittedSignal = null;

	startSupervisedRovoPorts({
		ports: [8008],
		rovoBin: "/tmp/rovo",
		buildSpawnArgsForPort: (port) => ["serve", String(port)],
		spawnFn: () => {
			const child = createFakeChild();
			children.push(child);
			return child;
		},
		setTimeoutFn: () => 1,
		clearTimeoutFn: () => {},
		signalTarget,
		exitFn: () => {},
		reemitSignalFn: (signal) => {
			reemittedSignal = signal;
		},
		cleanup: () => {},
		logger: {
			log: () => {},
			warn: () => {},
			error: () => {},
		},
	});

	signalTarget.emit("SIGHUP");

	assert.deepEqual(children[0].killCalls, ["SIGHUP"]);

	children[0].emit("exit", 0, "SIGHUP");

	assert.equal(reemittedSignal, "SIGHUP");
});
