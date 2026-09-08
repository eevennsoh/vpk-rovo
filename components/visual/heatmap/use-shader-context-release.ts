"use client";

import { useEffect, type RefObject } from "react";

/**
 * Hands a Paper Shaders WebGL2 context back to the browser when the shader unmounts.
 *
 * `ShaderMount.dispose()` deletes textures and the program and removes the canvas,
 * but never calls `WEBGL_lose_context.loseContext()`, so the context itself only goes
 * away whenever GC happens to run. Every remount (a shape swap, a page with several
 * instances, a route revisit) creates another one, so without an explicit release a
 * page walks past Chrome's ~16 live context cap, at which point the browser
 * force-loses the oldest contexts. The library registers no `webglcontextrestored`
 * handler, so anything it kills renders nothing for the rest of the page's life.
 *
 * The canvas is created asynchronously (the library awaits image decoding before
 * constructing its `ShaderMount`), so it is captured with a `MutationObserver`
 * rather than read once on mount.
 */
export function useShaderContextRelease(hostRef: RefObject<HTMLElement | null>): void {
	useEffect(() => {
		const host = hostRef.current;
		if (!host) return undefined;

		let canvas = host.querySelector("canvas");
		let observer: MutationObserver | null = null;

		if (!canvas) {
			observer = new MutationObserver(() => {
				const found = host.querySelector("canvas");
				if (!found) return;
				canvas = found;
				observer?.disconnect();
				observer = null;
			});
			observer.observe(host, { childList: true, subtree: true });
		}

		return () => {
			observer?.disconnect();
			observer = null;

			const released = canvas ?? host.querySelector("canvas");
			if (!released) return;

			// Deferred so the library's own `dispose()` still runs against a live
			// context during this same commit.
			queueMicrotask(() => {
				const gl = released.getContext("webgl2");
				if (!gl || gl.isContextLost()) return;
				gl.getExtension("WEBGL_lose_context")?.loseContext();
			});
		};
	}, [hostRef]);
}
