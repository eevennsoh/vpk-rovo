import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
	devIndicators: false,

	experimental: {
		viewTransition: true,
	},

	turbopack: {
		// Prevent Turbopack from inferring the wrong workspace root.
		root: projectRoot,
		resolveAlias: {
			// onnxruntime-web's default CJS entry uses dynamic import patterns that
			// Turbopack cannot resolve. Redirect to the pre-bundled ESM build which
			// embeds the WASM loader inline.
			"onnxruntime-web/wasm": "onnxruntime-web/dist/ort.wasm.bundle.min.mjs",
		},
	},

	images: {
		unoptimized: true,
	},

	// Cross-origin isolation headers required for SharedArrayBuffer (ONNX WASM threading)
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin",
					},
					{
						key: "Cross-Origin-Embedder-Policy",
						value: "credentialless",
					},
				],
			},
		];
	},

	// Static export for production deployment
	// Enabled when NEXT_OUTPUT=export is set (during Docker build)
	...(process.env.NEXT_OUTPUT === "export" && {
		output: "export",
	}),
};

export default nextConfig;
