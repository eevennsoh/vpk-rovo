"use client";

import { motion } from "motion/react";
import type { ClickyState } from "@/components/projects/rovo-app/hooks/use-clicky";

// ---------------------------------------------------------------------------
// Clicky cursor — matches reference implementation (farzaa/clicky)
// ---------------------------------------------------------------------------

const CURSOR_SIZE = 16;
const CLICKY_BLUE = "#3380FF";
const GLOW_SHADOW = `drop-shadow(0 0 8px ${CLICKY_BLUE})`;
const GLOW_SHADOW_INTENSE = `drop-shadow(0 0 8px rgba(51, 128, 255, 0.6))`;

// ---------------------------------------------------------------------------
// Idle — equilateral triangle at -35° rotation with gentle bob
// ---------------------------------------------------------------------------

function ClickyCursorIdle() {
	return (
		<motion.div
			animate={{ y: [0, -2, 0] }}
			transition={{
				duration: 2,
				repeat: Infinity,
				ease: "easeInOut",
			}}
			style={{ willChange: "transform, filter", filter: GLOW_SHADOW }}
		>
			<svg
				width={CURSOR_SIZE}
				height={CURSOR_SIZE}
				viewBox="0 0 16 16"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				{/* Equilateral triangle cursor shape */}
				<path
					d="M8 0L15.5 13H0.5L8 0Z"
					fill={CLICKY_BLUE}
				/>
			</svg>
		</motion.div>
	);
}

// ---------------------------------------------------------------------------
// Listening — 5 waveform bars with staggered idle pulse
// Bar profile: [0.4, 0.7, 1.0, 0.7, 0.4] (center tallest)
// ---------------------------------------------------------------------------

const BAR_PROFILE = [0.4, 0.7, 1.0, 0.7, 0.4];
const BAR_PHASE_OFFSETS = [0, 0.35, 0.7, 1.05, 1.4];

function ClickyCursorListening() {
	return (
		<div
			className="flex items-end gap-[2px]"
			style={{ height: CURSOR_SIZE, width: CURSOR_SIZE, filter: GLOW_SHADOW_INTENSE }}
		>
			{BAR_PROFILE.map((profile, i) => (
				<motion.div
					key={i}
					className="w-[2px] rounded-full"
					style={{
						backgroundColor: CLICKY_BLUE,
						willChange: "transform",
					}}
					animate={{
						height: [3, 3 + profile * 10, 3],
					}}
					transition={{
						duration: 0.55 + i * 0.04,
						repeat: Infinity,
						ease: "easeInOut",
						delay: BAR_PHASE_OFFSETS[i] * 0.1,
					}}
				/>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Processing — 70% arc spinner with gradient fade, 14x14, 0.8s rotation
// ---------------------------------------------------------------------------

function ClickyCursorProcessing() {
	return (
		<motion.div
			animate={{ rotate: 360 }}
			transition={{
				duration: 0.8,
				repeat: Infinity,
				ease: "linear",
			}}
			style={{
				width: 14,
				height: 14,
				willChange: "transform, filter",
				filter: GLOW_SHADOW_INTENSE,
			}}
		>
			<svg
				width={14}
				height={14}
				viewBox="0 0 14 14"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient id="clicky-spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
						<stop offset="0%" stopColor={CLICKY_BLUE} stopOpacity="0" />
						<stop offset="100%" stopColor={CLICKY_BLUE} stopOpacity="1" />
					</linearGradient>
				</defs>
				{/* 70% arc (trim 0.15 to 0.85 = ~252° arc) */}
				<circle
					cx="7"
					cy="7"
					r="5.5"
					stroke="url(#clicky-spinner-gradient)"
					strokeWidth="2.5"
					strokeLinecap="round"
					fill="none"
					strokeDasharray="34.56"
					strokeDashoffset="10.37"
				/>
			</svg>
		</motion.div>
	);
}

// ---------------------------------------------------------------------------
// Main cursor component
// ---------------------------------------------------------------------------

interface ClickyCursorProps {
	state: ClickyState;
	/** Rotation angle in degrees (tangent-following during flight). */
	rotation?: number;
	/** Scale factor (pulse during flight). */
	flightScale?: number;
}

export function ClickyCursor({
	state,
	rotation = -35,
	flightScale = 1,
}: Readonly<ClickyCursorProps>) {
	if (state === "off") return null;

	const isTriangleVisible = state !== "listening" && state !== "processing";

	return (
		<div style={{ width: CURSOR_SIZE, height: CURSOR_SIZE }}>
			{/* Triangle — always in tree, cross-fade via opacity */}
			<motion.div
				animate={{
					opacity: isTriangleVisible ? 1 : 0,
					rotate: rotation,
					scale: flightScale,
				}}
				transition={{
					opacity: { duration: 0.25, ease: "easeIn" },
					rotate: { duration: 0, ease: "linear" },
					scale: { duration: 0, ease: "linear" },
				}}
				style={{
					position: "absolute",
					width: CURSOR_SIZE,
					height: CURSOR_SIZE,
					willChange: "transform, opacity, filter",
					filter: `drop-shadow(0 0 ${8 + (flightScale - 1) * 20}px ${CLICKY_BLUE})`,
				}}
			>
				<ClickyCursorIdle />
			</motion.div>

			{/* Waveform — cross-fade in during listening */}
			<motion.div
				animate={{ opacity: state === "listening" ? 1 : 0 }}
				transition={{ duration: 0.25, ease: "easeIn" }}
				style={{
					position: "absolute",
					width: CURSOR_SIZE,
					height: CURSOR_SIZE,
				}}
			>
				{state === "listening" ? <ClickyCursorListening /> : null}
			</motion.div>

			{/* Spinner — cross-fade in during processing */}
			<motion.div
				animate={{ opacity: state === "processing" ? 1 : 0 }}
				transition={{ duration: 0.25, ease: "easeIn" }}
				style={{
					position: "absolute",
					width: CURSOR_SIZE,
					height: CURSOR_SIZE,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{state === "processing" ? <ClickyCursorProcessing /> : null}
			</motion.div>
		</div>
	);
}
