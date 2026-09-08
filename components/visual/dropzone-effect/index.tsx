"use client";

/**
 * Dropzone effect — a continuous river of holographic die-cut stickers tumbling
 * out of the dark and being swallowed by a small glass orb.
 *
 * Full-bleed by default: the component fills its nearest positioned ancestor.
 * It is decorative, so it is hidden from assistive technology and takes no
 * pointer input; under Reduce Motion it renders a single composed still.
 *
 * ```tsx
 * <div className="relative h-dvh w-full bg-black">
 *   <DropzoneEffect />
 * </div>
 * ```
 */

import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { DropzoneScene } from "./scene";
import type { DropzoneTuning } from "./tuning";

export interface DropzoneEffectProps {
	/** Merged onto the full-bleed wrapper. */
	className?: string;
	/**
	 * Pauses the river. The last frame stays on screen — useful for a
	 * screenshot, or for a page that wants the effect quiet until interacted
	 * with.
	 */
	paused?: boolean;
	/** Live overrides. Anything omitted keeps its measured default. */
	tuning?: Partial<DropzoneTuning>;
}

export function DropzoneEffect({
	className,
	paused = false,
	tuning,
}: Readonly<DropzoneEffectProps>) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const reducedMotion = useReducedMotion() ?? false;
	const [inView, setInView] = useState(false);
	const [tabVisible, setTabVisible] = useState(true);

	useEffect(() => {
		const element = wrapperRef.current;
		if (!element) {
			return;
		}
		const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
			rootMargin: "120px",
		});
		observer.observe(element);
		const onVisibility = () => setTabVisible(document.visibilityState === "visible");
		onVisibility();
		document.addEventListener("visibilitychange", onVisibility);
		return () => {
			observer.disconnect();
			document.removeEventListener("visibilitychange", onVisibility);
		};
	}, []);

	// A WebGL scene off-screen or in a background tab is pure waste. Reduce
	// Motion also drops to `demand`, which renders the still exactly once.
	const animating = inView && tabVisible && !paused && !reducedMotion;

	return (
		<div
			ref={wrapperRef}
			aria-hidden="true"
			className={cn(
				"absolute inset-0 overflow-hidden bg-black",
				// Decorative, so it must never be a hit target when it sits behind
				// interactive content. `aria-hidden` only hides it from assistive
				// technology. The descendant selector is load-bearing: React Three
				// Fiber inserts its own container div and canvas, and both set
				// `pointer-events` themselves.
				"pointer-events-none [&_*]:pointer-events-none",
				className,
			)}
		>
			<Canvas
				frameloop={animating ? "always" : "demand"}
				style={{ pointerEvents: "none" }}
				dpr={[1, 2]}
				// The composite pass owns tone mapping and the sRGB encode, so
				// three's own output conversion has to stay out of the way.
				flat
				gl={{
					alpha: false,
					antialias: false,
					powerPreference: "high-performance",
				}}
			>
				<DropzoneScene reducedMotion={reducedMotion} tuning={tuning} />
			</Canvas>
		</div>
	);
}

export default DropzoneEffect;
export { DROPZONE_TUNING_DEFAULTS, type DropzoneTuning } from "./tuning";
