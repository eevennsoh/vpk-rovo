"use client";

import { motion, useAnimate } from "motion/react";
import { useEffect, useState, useId, useRef } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Center of the 16×16 viewBox */
const CX = 8;
const CY = 8;

/** Radius large enough to fully cover the logo from center */
const R = 12;

/** Build a 90° pie-wedge path starting at `startDeg` */
function wedgePath(startDeg: number) {
	const toRad = (d: number) => (d * Math.PI) / 180;
	// Increase radius slightly to prevent sub-pixel antialiasing gaps between wedges
	const endDeg = startDeg + 90.5;
	const x1 = CX + R * Math.cos(toRad(startDeg - 0.5));
	const y1 = CY + R * Math.sin(toRad(startDeg - 0.5));
	const x2 = CX + R * Math.cos(toRad(endDeg));
	const y2 = CY + R * Math.sin(toRad(endDeg));
	return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

/** Four equal 90° wedges — each color always occupies exactly 25% */
const WEDGES = [
	{ d: wedgePath(270 - 30), fill: "#FCA700" }, // Orange (Top-Right)
	{ d: wedgePath(0 - 30), fill: "#AF59E1" },   // Purple (Bottom-Right)
	{ d: wedgePath(90 - 30), fill: "#6A9A23" },  // Green (Bottom-Left)
	{ d: wedgePath(180 - 30), fill: "#1868DB" }, // Blue (Top-Left)
] as const;

/** Rovo logo silhouette paths */
const LOGO_PATHS = [
	"M7.17342 0.225632C7.72885 -0.0807374 8.40677 -0.0751091 8.9577 0.242517L13.2901 2.74211L14.3175 3.33486C14.8785 3.65826 15.2257 4.25827 15.2257 4.90464V11.0894C15.2257 11.7383 14.8806 12.3357 14.318 12.6589L10.2889 14.9835C10.2978 14.9587 10.3062 14.9338 10.3142 14.9087C10.389 14.6769 10.4286 14.4321 10.4286 14.1818V7.99702C10.4286 7.14738 9.97638 6.36386 9.23877 5.94L8.49458 5.51083L6.23539 4.20798V1.81225C6.23539 1.62347 6.26459 1.43906 6.31986 1.26449C6.45573 0.841996 6.74471 0.476236 7.14004 0.247911L7.14124 0.24722C7.15258 0.240681 7.16336 0.233429 7.17342 0.225632Z",
	"M5.80947 1.01655L1.78046 3.34108C1.21785 3.66432 0.872742 4.26167 0.872742 4.91061V11.0954C0.872742 11.7418 1.21988 12.3417 1.78083 12.6651L2.7361 13.2163L7.14073 15.7575C7.69164 16.0751 8.3696 16.0807 8.925 15.7744C8.93506 15.7666 8.94577 15.7594 8.9571 15.7528C9.35287 15.5247 9.64229 15.1588 9.77837 14.7361C9.83376 14.5614 9.86303 14.3768 9.86303 14.1878V11.792L7.53164 10.4475L6.85983 10.0601C6.12236 9.63624 5.66981 8.85256 5.66981 8.00299V1.81822C5.66981 1.56828 5.70934 1.32375 5.78393 1.09231C5.79202 1.0669 5.80054 1.04164 5.80947 1.01655Z",
	"M7.53164 10.4475L2.7361 13.2163L1.78083 12.6651C1.21988 12.3417 0.872742 11.7418 0.872742 11.0954V4.91061C0.872742 4.26167 1.21785 3.66432 1.78046 3.34108L5.80947 1.01655C5.80054 1.04164 5.79202 1.0669 5.78393 1.09231C5.70934 1.32375 5.66981 1.56828 5.66981 1.81822V8.00299C5.66981 8.85256 6.12236 9.63624 6.85983 10.0601L7.53164 10.4475Z",
	"M8.49458 5.51083L6.23539 4.20798V1.81225C6.23539 1.62347 6.26459 1.43906 6.31986 1.26449C6.45573 0.841996 6.74471 0.476236 7.14004 0.247911L7.14124 0.24722C7.15258 0.240681 7.16336 0.233429 7.17342 0.225632C7.72885 -0.0807374 8.40677 -0.0751091 8.9577 0.242517L13.2901 2.74211L8.49458 5.51083Z",
	"M14.3175 3.33486L13.2901 2.74211L8.49458 5.51083L9.23877 5.94C9.97638 6.36386 10.4286 7.14738 10.4286 7.99702V14.1818C10.4286 14.4321 10.389 14.6769 10.3142 14.9087C10.3062 14.9338 10.2978 14.9587 10.2889 14.9835L14.318 12.6589C14.8806 12.3357 15.2257 11.7383 15.2257 11.0894V4.90464C15.2257 4.25827 14.8785 3.65826 14.3175 3.33486Z",
	"M7.53164 10.4475L2.7361 13.2163L7.14073 15.7575C7.69164 16.0751 8.3696 16.0807 8.925 15.7744C8.93506 15.7666 8.94577 15.7594 8.9571 15.7528C9.35287 15.5247 9.64229 15.1588 9.77837 14.7361C9.83376 14.5614 9.86303 14.3768 9.86303 14.1878V11.792L7.53164 10.4475Z",
] as const;

/** Default transition config: linear spin, 2s duration per 360° step */
const DEFAULT_TRANSITION: AnimatedRovoShapeTransition = {
	type: "tween",
	duration: 2,
	ease: "linear",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Transition config for the inner color-wheel rotation */
export interface AnimatedRovoShapeTransition {
	type: "spring" | "tween";
	/** Visual duration in seconds */
	duration?: number;
	/** Easing function (for tween) */
	ease?: "linear" | "easeInOut" | "circIn" | "circOut";
	/** Bounce factor (0 = no bounce, 1 = max bounce, only used if type is "spring") */
	bounce?: number;
}

export interface AnimatedRovoShapeProps {
	/** Width and height of the logo in pixels. @default 32 */
	size?: number;
	/** Additional CSS classes applied to the SVG element. */
	className?: string;
	/** Transition config for the inner color-wheel rotation. */
	transition?: AnimatedRovoShapeTransition;
}

export interface AnimatedRovoRootProps {
	/** Width and height of the logo in pixels. @default 32 */
	size?: number;
	/** Additional CSS classes applied to the outer wrapper. */
	className?: string;
	/** Transition config forwarded to the inner \`AnimatedRovo.Shape\`. */
	transition?: AnimatedRovoShapeTransition;
	/**
	 * When true, outer pendulum/bounce/spin animations settle to rest
	 * while the inner color wheel keeps rotating.
	 */
	streaming?: boolean;
	/**
	 * Probability (0 to 1) that the next spin cycle is a full 360° rotation.
	 * @default 0.35
	 */
	fullSpinProbability?: number;
	/**
	 * Vertical dance distance as a percentage of component size.
	 * @default 8
	 */
	danceDistancePercent?: number;
	children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Standalone inner SVG shape with animated color-wheel rotation. */
export function AnimatedRovoShape({
	size = 32,
	transition = DEFAULT_TRANSITION,
	className,
}: Readonly<AnimatedRovoShapeProps>) {
	const maskId = useId();
	const [scope, animate] = useAnimate();
	const cancelledRef = useRef(false);

	useEffect(() => {
		cancelledRef.current = false;

		async function loop() {
			let angle = 0;
			while (!cancelledRef.current) {
				angle += 360;
				await animate(scope.current, { rotate: angle }, transition);
			}
		}

		loop();

		return () => {
			cancelledRef.current = true;
		};
	}, [animate, scope, transition]);

	return (
		<motion.svg
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			style={{ overflow: "visible" }}
		>
			<defs>
				<clipPath id={maskId}>
					{LOGO_PATHS.map((d, i) => (
						<path key={i} d={d} />
					))}
				</clipPath>
			</defs>

			<g clipPath={`url(#${maskId})`}>
				{/* Four equal pie-wedges rotating as one group.
				    Each wedge is exactly 90° so all four colors always have
				    equal visual presence. They tile perfectly with no overlap. */}
				<g ref={scope} style={{ transformOrigin: `${CX}px ${CY}px` }}>
					{WEDGES.map((w) => (
						<path key={w.fill} d={w.d} fill={w.fill} />
					))}
				</g>
			</g>
		</motion.svg>
	);
}

/** Pendulum wrapper — adds swing + bounce + occasional spin to any children. */
function AnimatedRovoRoot({
	size = 32,
	transition,
	className,
	streaming = false,
	fullSpinProbability = 0.35,
	danceDistancePercent = 8,
	children,
}: Readonly<AnimatedRovoRootProps>) {
	const [mounted, setMounted] = useState(false);
	const normalizedFullSpinProbability = Math.min(1, Math.max(0, fullSpinProbability));
	const normalizedDanceDistancePercent = Math.min(100, Math.max(0, danceDistancePercent));
	const danceOffset = size * (normalizedDanceDistancePercent / 100);

	const [spinAnimation, setSpinAnimation] = useState<{
		rotate: number;
		transition: { duration: number; ease: "linear" | "easeInOut" };
	}>({
		rotate: 0,
		transition: { duration: 3.5, ease: "linear" },
	});

	const generateSpin = (currentRotation: number) => {
		const isRapidSpin = Math.random() < normalizedFullSpinProbability;

		if (isRapidSpin) {
			return {
				rotate: currentRotation + 360,
				transition: {
					duration: 0.5 + Math.random() * 0.5,
					ease: "easeInOut" as const,
				},
			};
		}

		return {
			rotate: currentRotation + (90 + Math.random() * 90),
			transition: {
				duration: 1.0 + Math.random() * 1.5,
				ease: "linear" as const,
			},
		};
	};

	useEffect(() => {
		setMounted(true);
		setSpinAnimation(generateSpin(0));
	}, []);

	// Reset sporadic spin when entering/leaving streaming mode
	useEffect(() => {
		if (streaming) {
			setSpinAnimation({
				rotate: 0,
				transition: { duration: 0.3, ease: "easeInOut" },
			});
		} else if (mounted) {
			setSpinAnimation(generateSpin(0));
		}
	}, [streaming, mounted]);

	return (
		<motion.div
			className={className}
			style={{
				width: size,
				height: size,
				transformOrigin: "50% -50%",
			}}
			animate={
				streaming || danceOffset === 0
					? { rotate: 0, y: 0 }
					: {
							rotate: [15, -15, 15],
							y: [0, -danceOffset, 0, danceOffset, 0],
						}
			}
			transition={
				streaming || danceOffset === 0
					? { duration: 0.3, ease: "easeOut" }
					: { duration: 2, ease: "easeInOut", repeat: Infinity }
			}
		>
			<motion.div
				animate={mounted ? spinAnimation : { rotate: 0 }}
				onAnimationComplete={(definition) => {
					if (!streaming && mounted && typeof definition === "object" && definition !== null && "rotate" in definition && typeof definition.rotate === "number") {
						setSpinAnimation(generateSpin(definition.rotate));
					}
				}}
				style={{ width: "100%", height: "100%" }}
				className="dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]"
			>
				{children ?? <AnimatedRovoShape size={size} transition={transition} />}
			</motion.div>
		</motion.div>
	);
}

// ---------------------------------------------------------------------------
// Compound namespace
// ---------------------------------------------------------------------------

export const AnimatedRovo = {
	/** Full animated Rovo — pendulum wrapper + inner color-wheel shape. */
	Root: AnimatedRovoRoot,
	/** Standalone inner SVG shape with spring-driven color-wheel rotation. */
	Shape: AnimatedRovoShape,
} as const;
