const { isPortAvailable } = require("./lib/rovo-utils");
const {
	buildSpawnArgsForPort,
	prepareRovoRuntime,
} = require("./lib/rovo-runtime");
const { startSupervisedRovoPorts } = require("./lib/rovo-supervisor");

const usage = [
	"Usage: node scripts/dev-rovo-port.js <port>",
	"Example:",
	"  node scripts/dev-rovo-port.js 8006",
].join("\n");

const parsePort = (argv) => {
	const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
	const rawPort = normalizedArgv[0];

	if (normalizedArgv.length === 1 && /^[1-9]\d*$/.test(rawPort)) {
		return Number.parseInt(rawPort, 10);
	}

	console.error("Invalid Rovo port argument.");
	console.error(usage);
	process.exit(1);
};

const port = parsePort(process.argv.slice(2));

const run = async () => {
	const {
		configState,
		configuredBillingSiteUrl,
		rovoBin,
		servePrefix,
	} = prepareRovoRuntime();

	if (!(await isPortAvailable(port))) {
		console.warn(
			`[rovo] Port ${port} is already in use before supervisor startup. ` +
				"The fixed-port supervisor will keep retrying until the port is free."
		);
	}

	console.log(`[rovo] Fixed-port supervisor active on port ${port}.`);

	startSupervisedRovoPorts({
		ports: [port],
		rovoBin,
		buildSpawnArgsForPort: (resolvedPort) =>
			buildSpawnArgsForPort({
				port: resolvedPort,
				servePrefix,
				configState,
				configuredBillingSiteUrl,
			}),
	});

};

run().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
