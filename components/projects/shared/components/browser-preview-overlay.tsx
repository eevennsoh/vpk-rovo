"use client";

import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import type {
	BrowserPreviewOverlayState,
	BrowserPreviewRenderGeometry,
} from "@/components/website/demos/utils/lib/browser-preview-overlay";

/**
 * Expect-style browser overlay constants.
 * Brand blue matches Expect's OVERLAY_BLUE (sRGB fallback for display-p3 0.25 0.61 0.98).
 */
const EXPECT_BLUE = "rgb(64, 156, 250)";

/** Cursor movement — Expect's asymmetric easing (horizontal vs vertical arrive at different times). */
const CURSOR_TRANSITION = {
	x: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
	y: { duration: 0.6, ease: [0.65, 0, 0.35, 1] as const },
};

/** Entrance/exit — Expect's fast-attack expo-out curve. */
const EXPO_OUT = [0.22, 1, 0.36, 1] as const;

interface BrowserPreviewOverlayProps {
	overlayState: BrowserPreviewOverlayState | null;
	geometry: BrowserPreviewRenderGeometry;
	className?: string;
}

function clampToRange(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

/**
 * 5-dot constellation indicator inside the activity label.
 * 4 orbit dots pulse with staggered timing, 1 center dot pulses independently.
 */
function StarDots() {
	const positions = [
		{ x: 0, y: -5 },
		{ x: 5, y: 0 },
		{ x: 0, y: 5 },
		{ x: -5, y: 0 },
	];
	const configs = [
		{ delay: "0s", duration: "1.4s" },
		{ delay: "0.3s", duration: "1.7s" },
		{ delay: "0.7s", duration: "1.5s" },
		{ delay: "1s", duration: "1.6s" },
	];

	return (
		<div className="relative shrink-0" style={{ width: 16, height: 16 }}>
			{positions.map((pos, i) => (
				<div
					key={i}
					className="absolute rounded-full"
					style={{
						width: 4,
						height: 4,
						backgroundColor: EXPECT_BLUE,
						left: "50%",
						top: "50%",
						marginLeft: pos.x - 2,
						marginTop: pos.y - 2,
						animation: `expect-dot-orbit ${configs[i].duration} ease-in-out ${configs[i].delay} infinite`,
					}}
				/>
			))}
			<div
				className="absolute rounded-full"
				style={{
					width: 4,
					height: 4,
					backgroundColor: EXPECT_BLUE,
					left: "50%",
					top: "50%",
					marginLeft: -2,
					marginTop: -2,
					animation: "expect-dot-center 2.2s ease-in-out 0.5s infinite",
				}}
			/>
		</div>
	);
}

export function BrowserPreviewOverlay({
	overlayState,
	geometry,
	className,
}: Readonly<BrowserPreviewOverlayProps>) {
	if (!overlayState?.cursor?.visible) {
		return null;
	}

	const offsetTop = geometry.offsetTop ?? 0;
	const sourceWidth = Math.max(1, geometry.sourceWidth);
	const sourceHeight = Math.max(1, geometry.sourceHeight);
	const renderedWidth = Math.max(1, geometry.renderedWidth);
	const renderedHeight = Math.max(1, geometry.renderedHeight);
	const clampedX = clampToRange(overlayState.cursor.x, 0, sourceWidth);
	const clampedY = clampToRange(overlayState.cursor.y, 0, sourceHeight);
	const previewLeft =
		geometry.offsetLeft + Math.round((clampedX / sourceWidth) * renderedWidth);
	const previewTop =
		offsetTop + Math.round((clampedY / sourceHeight) * renderedHeight);
	const previewRightEdge = geometry.offsetLeft + renderedWidth;
	const previewBottomEdge = offsetTop + renderedHeight;
	const shouldFlipX = previewRightEdge - previewLeft < 196;
	const shouldFlipY = previewBottomEdge - previewTop < 96;

	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-0 z-20 overflow-hidden",
				className,
			)}
		>
			{/* Full-screen halo — inset box-shadow pulse around viewport edges */}
			<div
				className="absolute inset-0"
				style={{
					animation: "expect-glow-pulse 2s ease-in-out infinite",
					willChange: "box-shadow",
					contain: "strict",
					transform: "translateZ(0)",
				}}
			/>

			{/* Cursor position — Motion-animated with Expect's asymmetric easing */}
			<motion.div
				className="absolute top-0 left-0"
				initial={false}
				animate={{ x: previewLeft, y: previewTop }}
				transition={CURSOR_TRANSITION}
				style={{ willChange: "transform" }}
			>
				{/* Cursor entrance — scale up from 40% on mount */}
				<motion.div
					className="relative"
					initial={{ scale: 0.4, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ duration: 0.3, ease: EXPO_OUT }}
				>
					{/* Cursor glow pulse — pulsing drop-shadow */}
					<div
						style={{
							animation:
								"expect-cursor-glow 2s ease-in-out infinite",
						}}
					>
						{/* Blue pointer cursor — black fill with blue stroke border (paintOrder renders stroke behind fill) */}
						<svg
							viewBox="0 0 32 32"
							aria-hidden="true"
							className="size-8"
							style={{
								filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.22))",
							}}
						>
							<path
								d="M5.5 3.2V20.8l4.9-4.9 3.4 8 3.3-1.4-3.4-8h6.8z"
								fill="#000"
								stroke={EXPECT_BLUE}
								strokeWidth="2.5"
								strokeLinejoin="round"
								strokeLinecap="round"
								paintOrder="stroke"
							/>
						</svg>
					</div>

					{/* Activity label — black pill with blue border */}
					<AnimatePresence mode="wait">
						{overlayState.activity ? (
							<motion.div
								key={overlayState.activity.label}
								initial={{ opacity: 0, scale: 0.8, y: 4 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.8, y: 4 }}
								transition={{
									duration: 0.25,
									ease: EXPO_OUT,
								}}
								className={cn(
									"absolute max-w-[240px] whitespace-nowrap",
									shouldFlipX
										? "-translate-x-[calc(100%+8px)]"
										: "translate-x-[25px]",
									shouldFlipY
										? "-translate-y-[calc(100%+8px)]"
										: "translate-y-[25px]",
								)}
							>
								<div
									className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold leading-none text-white antialiased"
									style={{
										background: "#000",
										border: `3px solid ${EXPECT_BLUE}`,
										boxShadow:
											"0 0 2px rgba(0,0,0,0.22)",
									}}
								>
									<StarDots />
									<span
										style={{
											background:
												"linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.85) 35%, #fff 50%, rgba(255,255,255,0.85) 65%, rgba(255,255,255,0.85) 100%)",
											backgroundSize: "250% 100%",
											WebkitBackgroundClip: "text",
											WebkitTextFillColor:
												"transparent",
											animation:
												"expect-text-shimmer 4s ease-in-out infinite",
										}}
									>
										{overlayState.activity.label}
									</span>
								</div>
							</motion.div>
						) : null}
					</AnimatePresence>
				</motion.div>
			</motion.div>
		</div>
	);
}
