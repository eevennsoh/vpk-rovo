import type { NextConfig } from "next";

// Extracted prototype: always builds as a static export so the Micros
// Express wrapper can serve it as plain files. No dev proxy, no API routes.
// If the extracted route later needs a backend, promote the project out of
// /vpk-build's static-export deploy mode.
const nextConfig: NextConfig = {
	output: "export",
	images: {
		// Static export has no server, so Next's default image optimizer is
		// unavailable. Setting unoptimized passes src/width/height through
		// without modification.
		unoptimized: true,
	},
};

export default nextConfig;
