const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { execSync } = require("node:child_process");

const unsupportedErrors = new Set([
	"EADDRNOTAVAIL",
	"EAFNOSUPPORT",
	"EPROTONOSUPPORT",
	"ENOTSUP",
]);

const canListen = (options, { allowUnsupported = false } = {}) =>
	new Promise((resolve) => {
		const server = net.createServer();
		server.unref();
		server.once("error", (err) => {
			if (err.code === "EADDRINUSE" || err.code === "EACCES") {
				resolve(false);
				return;
			}
			if (allowUnsupported && unsupportedErrors.has(err.code)) {
				resolve(true);
				return;
			}
			resolve(false);
		});
		server.once("listening", () => {
			server.close(() => resolve(true));
		});
		server.listen(options);
	});

const isPortAvailable = async (port) => {
	const ipv4Available = await canListen({ port, host: "0.0.0.0" }, {
		allowUnsupported: true,
	});
	if (!ipv4Available) {
		return false;
	}

	const ipv6Available = await canListen(
		{ port, host: "::", ipv6Only: true },
		{ allowUnsupported: true }
	);
	if (ipv6Available === false) {
		return false;
	}

	// On macOS, 0.0.0.0/:: can appear available while loopback is occupied.
	const localhostV4 = await canListen({ port, host: "127.0.0.1" }, {
		allowUnsupported: true,
	});
	if (!localhostV4) {
		return false;
	}

	const localhostV6 = await canListen(
		{ port, host: "::1" },
		{ allowUnsupported: true }
	);

	return localhostV6 !== false;
};

/**
 * Check health of a RovoDev instance on a given port.
 * Returns { healthy: boolean, status: string, mcpServers: object | null }
 */
const checkRovodevHealth = async (port) => {
	return new Promise((resolve) => {
		const options = {
			hostname: "localhost",
			port,
			path: "/healthcheck",
			method: "GET",
			timeout: 3000,
		};

		const req = http.request(options, (res) => {
			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});
			res.on("end", () => {
				if (res.statusCode === 401) {
					resolve({
						healthy: true,
						status: "auth-required",
						mcpServers: null,
					});
					return;
				}

				try {
					const parsed = JSON.parse(data);
					resolve({
						healthy: parsed.status === "healthy",
						status: parsed.status,
						mcpServers: parsed.mcp_servers || null,
					});
				} catch {
					resolve({ healthy: false, status: "parse-error", mcpServers: null });
				}
			});
		});

		req.on("error", () => {
			resolve({ healthy: false, status: "unreachable", mcpServers: null });
		});

		req.on("timeout", () => {
			req.destroy();
			resolve({ healthy: false, status: "timeout", mcpServers: null });
		});

		req.end();
	});
};

/**
 * Resolve the rovodev binary and return { bin, args } where `args` are any
 * extra arguments that must be prepended before "serve".
 *
 * For standalone `rovodev` binary: { bin: "/path/to/rovodev", servePrefix: [] }
 * For `acli` wrapper:              { bin: "/path/to/acli", servePrefix: ["rovodev"] }
 */
const resolveRovodevBin = () => {
	// 1. Check PATH for `rovodev` first
	try {
		const binPath = execSync("which rovodev", {
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
		if (binPath) {
			return { bin: binPath, servePrefix: [] };
		}
	} catch {
		// not on PATH
	}

	// 2. Check PATH for `acli` (user-managed, typically more up-to-date)
	//    Validate that `acli rovodev` actually supports the `serve` subcommand,
	//    since some acli versions only ship `auth` and silently ignore unknown
	//    subcommands (exit 0, no output).
	try {
		const acliBinPath = execSync("which acli", {
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
		if (acliBinPath) {
			let acliHasServe = false;
			try {
				// acli may auto-download a new rovodev binary on first run,
				// which can take well over 5 seconds.  Even without a download
				// the Python startup + CLI init routinely takes 2-3 s, so we
				// use a generous timeout to avoid false negatives.
				const helpOutput = execSync(`${acliBinPath} rovodev --help`, {
					encoding: "utf8",
					stdio: ["pipe", "pipe", "pipe"],
					timeout: 30000,
				});
				acliHasServe = helpOutput.includes("serve");
			} catch {
				// help failed — treat as unsupported
			}
			if (acliHasServe) {
				console.log(`[rovodev] Using acli wrapper: ${acliBinPath}`);
				return { bin: acliBinPath, servePrefix: ["rovodev"] };
			}
			console.log(`[rovodev] acli found at ${acliBinPath} but does not support "rovodev serve". Skipping.`);
		}
	} catch {
		// not on PATH
	}

	// 3. Check ~/.rovodev/bin as a common install location
	const homeDir = require("node:os").homedir();
	for (const binName of ["rovodev", "atlassian_cli_rovodev"]) {
		const homeBinPath = path.join(homeDir, ".rovodev", "bin", binName);
		if (fs.existsSync(homeBinPath)) {
			return { bin: homeBinPath, servePrefix: [] };
		}
	}

	// 4. Search Atlascode extension paths (Cursor / VS Code)
	const editorDirs = [
		path.join(homeDir, "Library", "Application Support", "Cursor", "User", "workspaceStorage"),
		path.join(homeDir, "Library", "Application Support", "Code", "User", "workspaceStorage"),
		path.join(homeDir, ".config", "Cursor", "User", "workspaceStorage"),
		path.join(homeDir, ".config", "Code", "User", "workspaceStorage"),
	];

	let latestBin = null;
	let latestVersion = [0, 0, 0];

	const parseVersion = (v) => {
		const parts = v.split(".").map(Number);
		return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
	};

	const isNewerVersion = (a, b) => {
		for (let i = 0; i < 3; i++) {
			if (a[i] !== b[i]) return a[i] > b[i];
		}
		return false;
	};

	for (const editorDir of editorDirs) {
		if (!fs.existsSync(editorDir)) {
			continue;
		}

		let workspaceDirs;
		try {
			workspaceDirs = fs.readdirSync(editorDir);
		} catch {
			continue;
		}

		for (const wsDir of workspaceDirs) {
			const rovodevBinDir = path.join(
				editorDir,
				wsDir,
				"atlassian.atlascode",
				"atlascode-rovodev-bin"
			);

			if (!fs.existsSync(rovodevBinDir)) {
				continue;
			}

			let versions;
			try {
				versions = fs.readdirSync(rovodevBinDir);
			} catch {
				continue;
			}

			for (const version of versions) {
				const binPath = path.join(rovodevBinDir, version, "atlassian_cli_rovodev");
				if (fs.existsSync(binPath)) {
					const parsed = parseVersion(version);
					if (!latestBin || isNewerVersion(parsed, latestVersion)) {
						latestBin = binPath;
						latestVersion = parsed;
					}
				}
			}
		}
	}

	if (latestBin) {
		console.log(`[rovodev] Found Atlascode binary (v${latestVersion.join(".")}): ${latestBin}`);
		return { bin: latestBin, servePrefix: [] };
	}

	return { bin: "rovodev", servePrefix: [] };
};

module.exports = {
	isPortAvailable,
	checkRovodevHealth,
	resolveRovodevBin,
};
