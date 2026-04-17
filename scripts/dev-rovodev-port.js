const { isPortAvailable } = require("./lib/rovodev-utils");
const {
	buildSpawnArgsForPort,
	prepareRovodevRuntime,
} = require("./lib/rovodev-runtime");
const { startSupervisedRovodevPorts } = require("./lib/rovodev-supervisor");

const usage = [
	"Usage: node scripts/dev-rovodev-port.js <port>",
	"Example:",
	"  node scripts/dev-rovodev-port.js 8006",
].join("\n");

const parsePort = (argv) => {
	const normalizedArgv = argv[0] === "--" ? argv.slice(1) : argv;
	const rawPort = normalizedArgv[0];

	if (normalizedArgv.length === 1 && /^[1-9]\d*$/.test(rawPort)) {
		return Number.parseInt(rawPort, 10);
	}

	console.error("Invalid RovoDev port argument.");
	console.error(usage);
	process.exit(1);
};

const port = parsePort(process.argv.slice(2));

const run = async () => {
	const {
		configState,
		configuredBillingSiteUrl,
		rovodevBin,
		servePrefix,
	} = prepareRovodevRuntime();

	if (!(await isPortAvailable(port))) {
		console.warn(
			`[rovodev] Port ${port} is already in use before supervisor startup. ` +
				"The fixed-port supervisor will keep retrying until the port is free."
		);
	}

	console.log(`[rovodev] Fixed-port supervisor active on port ${port}.`);

	startSupervisedRovodevPorts({
		ports: [port],
		rovodevBin,
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
