const { spawn } = require("node:child_process");

const usage = [
	"Usage: pnpm run rovodev -- <positive-integer>",
	"Examples:",
	"  pnpm run rovodev",
	"  pnpm run rovodev -- 1",
	"  pnpm run rovodev -- 6",
].join("\n");

const parsePoolSize = (argv) => {
	const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;

	if (normalizedArgv.length === 0) {
		return "1";
	}

	if (normalizedArgv.length === 1 && /^[1-9]\d*$/.test(normalizedArgv[0])) {
		return normalizedArgv[0];
	}

	console.error("Invalid RovoDev pool size argument.");
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
		"rovodev,backend,frontend",
		"-c",
		"blue,yellow,green",
		"node scripts/dev-rovodev.js",
		"pnpm run dev:backend",
		"pnpm run dev:frontend",
	],
	{
		stdio: "inherit",
		env: {
			...process.env,
			ROVODEV_POOL_SIZE: poolSize,
		},
	}
);

const forwardSignal = (signal) => {
	console.warn(`[rovodev-stack] Received ${signal}; forwarding to concurrently stack...`);
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
		`[rovodev-stack] concurrently exited (code=${code ?? "null"}, signal=${signal ?? "null"})`
	);

	if (signal) {
		process.kill(process.pid, signal);
		return;
	}

	process.exit(code ?? 0);
});
