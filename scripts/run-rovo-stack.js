const { spawn } = require("node:child_process");

const usage = [
	"Usage: pnpm run rovo -- <positive-integer>",
	"Examples:",
	"  pnpm run rovo",
	"  pnpm run rovo -- 1",
	"  pnpm run rovo -- 6",
].join("\n");

const parsePoolSize = (argv) => {
	const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;

	if (normalizedArgv.length === 0) {
		return "1";
	}

	if (normalizedArgv.length === 1 && /^[1-9]\d*$/.test(normalizedArgv[0])) {
		return normalizedArgv[0];
	}

	console.error("Invalid Rovo pool size argument.");
	console.error(usage);
	process.exit(1);
};

const poolSize = parsePoolSize(process.argv.slice(2));
const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

const child = spawn(
	pnpmBin,
	[
		"exec",
		"concurrently",
		"--kill-others-on-fail",
		"-n",
		"rovo,backend,frontend",
		"-c",
		"blue,yellow,green",
		"node scripts/dev-rovo.js",
		"pnpm run dev:backend",
		"pnpm run dev:frontend",
	],
	{
		stdio: "inherit",
		env: {
			...process.env,
			ROVO_POOL_SIZE: poolSize,
		},
	}
);

const forwardSignal = (signal) => {
	console.warn(`[rovo-stack] Received ${signal}; forwarding to concurrently stack...`);
	try {
		child.kill(signal);
	} catch {
		// child may already have exited
	}
};

process.on("SIGINT", forwardSignal);
process.on("SIGTERM", forwardSignal);

child.on("error", (error) => {
	if (error?.code === "ENOENT") {
		console.error("Failed to start dev stack: pnpm is not available on PATH.");
		process.exit(1);
	}
	console.error("Failed to start dev stack:", error.message);
	process.exit(1);
});

child.on("exit", (code, signal) => {
	process.removeListener("SIGINT", forwardSignal);
	process.removeListener("SIGTERM", forwardSignal);

	console.warn(
		`[rovo-stack] concurrently exited (code=${code ?? "null"}, signal=${signal ?? "null"})`
	);

	if (signal) {
		process.kill(process.pid, signal);
		return;
	}

	process.exit(code ?? 0);
});
