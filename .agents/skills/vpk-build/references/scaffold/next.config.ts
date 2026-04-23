import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Pin Turbopack's workspace root to this project. Without this, Next walks
// up the filesystem looking for a pnpm-lock.yaml and may find an unrelated
// lockfile in a parent directory (e.g. the user's home dir), producing a
// confusing "multiple lockfiles detected" warning and potentially
// misbehaving caching. Pointing root at __dirname locks resolution to the
// extracted project's own boundaries.
const __dirname = dirname(fileURLToPath(import.meta.url));

// Extracted prototype: always builds as a static export so the Micros
// Express wrapper can serve it as plain files. No dev proxy, no API routes.
// If the extracted route later needs a backend, promote the project out of
// /vpk-build's static-export deploy mode.
const nextConfig: NextConfig = {
	output: "export",
	turbopack: {
		root: __dirname,
	},
	images: {
		// Static export has no server, so Next's default image optimizer is
		// unavailable. Setting unoptimized passes src/width/height through
		// without modification.
		unoptimized: true,
	},
};

export default nextConfig;
