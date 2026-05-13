"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ClickyState, ClickyPointTarget, ClickyExchange, ClickyScreenshotDimensions } from "@/components/projects/rovo/hooks/use-clicky";
import { ClickyCursor } from "./clicky-cursor";
import { ClickySpeechBubble } from "./clicky-speech-bubble";
import { ClickyResponseOverlay } from "./clicky-response-overlay";
import { ClickyHistoryPanel } from "./clicky-history-panel";

// ---------------------------------------------------------------------------
// Constants — matched to reference Clicky (farzaa/clicky)
// ---------------------------------------------------------------------------

const TRACKING_OFFSET_X = 35;
const TRACKING_OFFSET_Y = 25;
const CURSOR_TIP_X = 8;
const CURSOR_TIP_Y = 0;
const IDLE_ROTATION = -35;
const FOLLOW_SPRING = { damping: 12, stiffness: 250, mass: 0.4 };
const ARC_HEIGHT_RATIO = 0.2;
const ARC_HEIGHT_MAX = 80;
const FLIGHT_SPEED = 800;
const FLIGHT_MIN_S = 0.6;
const FLIGHT_MAX_S = 1.4;
const FLIGHT_SCALE_BOOST = 0.3;

/** Hold time at target before fade-out (ms) */
const POINT_HOLD_MS = 3000;
/** Bubble fade-out duration before return flight (ms) */
const BUBBLE_FADE_MS = 500;
/** Mouse movement threshold to interrupt return flight (px) */
const RETURN_INTERRUPT_DISTANCE = 100;

/** Random navigation phrases for the small blue bubble */
const NAV_PHRASES = [
	"right here!",
	"this one!",
	"over here!",
	"here it is!",
	"look here!",
	"see this?",
];

// ---------------------------------------------------------------------------
// Math utilities
// ---------------------------------------------------------------------------

function smoothstep(t: number): number {
	return t * t * (3 - 2 * t);
}

function quadBezier(t: number, p0: number, p1: number, p2: number): number {
	const u = 1 - t;
	return u * u * p0 + 2 * u * t * p1 + t * t * p2;
}

function quadBezierTangent(t: number, p0: number, p1: number, p2: number): number {
	return 2 * (1 - t) * (p1 - p0) + 2 * t * (p2 - p1);
}

function pickRandom<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Shared bezier flight runner
// ---------------------------------------------------------------------------

interface FlightOptions {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	onFrame: (bx: number, by: number, rotation: number, scale: number) => void;
	onComplete: () => void;
}

function startBezierFlight(
	opts: FlightOptions,
	timerRef: { current: ReturnType<typeof setInterval> | null },
) {
	const { startX, startY, endX, endY, onFrame, onComplete } = opts;
	const dx = endX - startX;
	const dy = endY - startY;
	const distance = Math.hypot(dx, dy);

	const midX = (startX + endX) / 2;
	const midY = (startY + endY) / 2;
	const arcHeight = Math.min(distance * ARC_HEIGHT_RATIO, ARC_HEIGHT_MAX);
	const controlX = midX;
	const controlY = midY - arcHeight;

	const durationS = Math.min(Math.max(distance / FLIGHT_SPEED, FLIGHT_MIN_S), FLIGHT_MAX_S);
	const frameMs = 1000 / 60;
	const totalFrames = Math.ceil(durationS * 60);
	let frame = 0;

	if (timerRef.current) clearInterval(timerRef.current);

	timerRef.current = setInterval(() => {
		frame++;
		const linearT = Math.min(frame / totalFrames, 1);
		const easedT = smoothstep(linearT);

		const bx = quadBezier(easedT, startX, controlX, endX);
		const by = quadBezier(easedT, startY, controlY, endY);

		const tx = quadBezierTangent(easedT, startX, controlX, endX);
		const ty = quadBezierTangent(easedT, startY, controlY, endY);
		const angle = Math.atan2(ty, tx) * (180 / Math.PI) + 90;

		const scalePulse = Math.sin(linearT * Math.PI);
		const scale = 1 + scalePulse * FLIGHT_SCALE_BOOST;

		onFrame(bx, by, angle, scale);

		if (linearT >= 1) {
			clearInterval(timerRef.current!);
			timerRef.current = null;
			onComplete();
		}
	}, frameMs);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FlightPhase =
	| "idle"         // following cursor
	| "flying"       // bezier arc to target
	| "holding"      // at target, showing bubble
	| "fading"       // bubble fading out
	| "returning";   // bezier arc back to cursor

interface ClickyOverlayProps {
	state: ClickyState;
	pointTarget?: ClickyPointTarget | null;
	responseText?: string | null;
	history?: ReadonlyArray<ClickyExchange>;
	screenshotDimensions?: ClickyScreenshotDimensions | null;
	/** Called when the pointing cycle completes (hold + return flight done). */
	onReturnToIdle?: () => void;
}

export function ClickyOverlay({
	state,
	pointTarget = null,
	responseText = null,
	history = [],
	screenshotDimensions = null,
	onReturnToIdle,
}: Readonly<ClickyOverlayProps>) {
	const x = useMotionValue(0);
	const y = useMotionValue(0);
	const springX = useSpring(x, FOLLOW_SPRING);
	const springY = useSpring(y, FOLLOW_SPRING);

	const isActive = state !== "off";
	const isPointing = state === "pointing" && pointTarget !== null;
	const isSpeaking = state === "speaking";

	const rafRef = useRef<number>(0);
	const mouseRef = useRef({ x: 0, y: 0 });
	const flightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Flight animation state
	const [rotation, setRotation] = useState(IDLE_ROTATION);
	const [flightScale, setFlightScale] = useState(1);
	const [flightPhase, setFlightPhase] = useState<FlightPhase>("idle");
	const [navPhrase, setNavPhrase] = useState("");
	const [bubbleOpacity, setBubbleOpacity] = useState(1);

	// Welcome message state
	const hasShownWelcomeRef = useRef(false);
	const [showWelcome, setShowWelcome] = useState(false);
	const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Return flight interruption
	const returnStartMouseRef = useRef({ x: 0, y: 0 });
	const flightPhaseRef = useRef<FlightPhase>("idle");
	useEffect(() => {
		flightPhaseRef.current = flightPhase;
	}, [flightPhase]);

	const cancelFlightAndResume = useCallback(() => {
		if (flightTimerRef.current) {
			clearInterval(flightTimerRef.current);
			flightTimerRef.current = null;
		}
		setFlightPhase("idle");
		setRotation(IDLE_ROTATION);
		setFlightScale(1);
		onReturnToIdle?.();
	}, [onReturnToIdle]);

	const cancelFlightRef = useRef(cancelFlightAndResume);
	useEffect(() => {
		cancelFlightRef.current = cancelFlightAndResume;
	}, [cancelFlightAndResume]);

	// Track mouse position
	const handleMouseMove = useCallback((e: MouseEvent) => {
		mouseRef.current = { x: e.clientX, y: e.clientY };

		// Interrupt return flight if mouse moved >100px
		if (flightPhaseRef.current === "returning") {
			const dx = e.clientX - returnStartMouseRef.current.x;
			const dy = e.clientY - returnStartMouseRef.current.y;
			if (Math.hypot(dx, dy) > RETURN_INTERRUPT_DISTANCE) {
				cancelFlightRef.current();
			}
		}
	}, []);

	// Cleanup all timers
	const clearAllTimers = useCallback(() => {
		if (flightTimerRef.current) {
			clearInterval(flightTimerRef.current);
			flightTimerRef.current = null;
		}
		if (holdTimerRef.current) {
			clearTimeout(holdTimerRef.current);
			holdTimerRef.current = null;
		}
		if (fadeTimerRef.current) {
			clearTimeout(fadeTimerRef.current);
			fadeTimerRef.current = null;
		}
	}, []);

	// Animate cursor to follow mouse (only when idle phase)
	useEffect(() => {
		if (!isActive) return;

		const tick = () => {
			if (flightPhaseRef.current === "idle") {
				x.set(mouseRef.current.x + TRACKING_OFFSET_X);
				y.set(mouseRef.current.y + TRACKING_OFFSET_Y);
			}
			rafRef.current = requestAnimationFrame(tick);
		};

		rafRef.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafRef.current);
	}, [isActive, x, y]);

	// Register/unregister mouse listener
	useEffect(() => {
		if (!isActive) return;
		window.addEventListener("mousemove", handleMouseMove, { passive: true });
		return () => window.removeEventListener("mousemove", handleMouseMove);
	}, [isActive, handleMouseMove]);

	// Welcome message on first activation
	useEffect(() => {
		if (isActive && !hasShownWelcomeRef.current) {
			hasShownWelcomeRef.current = true;
			welcomeTimerRef.current = setTimeout(() => {
				setShowWelcome(true);
				welcomeTimerRef.current = setTimeout(() => {
					setShowWelcome(false);
				}, 4000);
			}, 2000);
		}

		return () => {
			if (welcomeTimerRef.current) {
				clearTimeout(welcomeTimerRef.current);
				welcomeTimerRef.current = null;
			}
		};
	}, [isActive]);

	// Full pointing cycle: fly → hold → fade → return → idle
	// react-doctor-disable-next-line react-doctor/effect-needs-cleanup
	useEffect(() => {
		if (!isPointing || !pointTarget) {
			if (!isPointing) {
				clearAllTimers();
				// Reset state on next microtask to avoid synchronous setState in effect
				queueMicrotask(() => {
					setFlightPhase("idle");
					setRotation(IDLE_ROTATION);
					setFlightScale(1);
					setBubbleOpacity(1);
				});
			}
			return clearAllTimers;
		}

		// Compute target in viewport-space
		let targetX = pointTarget.x;
		let targetY = pointTarget.y;
		if (screenshotDimensions) {
			const scaleX = window.innerWidth / screenshotDimensions.width;
			const scaleY = window.innerHeight / screenshotDimensions.height;
			targetX = pointTarget.x * scaleX;
			targetY = pointTarget.y * scaleY;
		}
		targetX -= CURSOR_TIP_X;
		targetY -= CURSOR_TIP_Y;

		// Pick a random nav phrase for the small bubble
		const phrase = pickRandom(NAV_PHRASES);
		queueMicrotask(() => {
			setNavPhrase(phrase);
			setFlightPhase("flying");
			setBubbleOpacity(1);
		});

		const startX = springX.get();
		const startY = springY.get();

		// Phase 1: Fly to target
		startBezierFlight(
			{
				startX,
				startY,
				endX: targetX,
				endY: targetY,
				onFrame: (bx, by, angle, scale) => {
					x.set(bx);
					y.set(by);
					setRotation(angle);
					setFlightScale(scale);
				},
				onComplete: () => {
					x.set(targetX);
					y.set(targetY);
					setFlightScale(1);
					setRotation(IDLE_ROTATION);
					setFlightPhase("holding");

					// Phase 2: Hold at target
					holdTimerRef.current = setTimeout(() => {
						// Phase 3: Fade out bubble
						setFlightPhase("fading");
						setBubbleOpacity(0);

						fadeTimerRef.current = setTimeout(() => {
							// Phase 4: Return flight to cursor
							setFlightPhase("returning");
							returnStartMouseRef.current = { ...mouseRef.current };

							const returnTargetX = mouseRef.current.x + TRACKING_OFFSET_X;
							const returnTargetY = mouseRef.current.y + TRACKING_OFFSET_Y;

							startBezierFlight(
								{
									startX: targetX,
									startY: targetY,
									endX: returnTargetX,
									endY: returnTargetY,
									onFrame: (bx, by, angle, scale) => {
										x.set(bx);
										y.set(by);
										setRotation(angle);
										setFlightScale(scale);
									},
									onComplete: () => {
										setFlightPhase("idle");
										setRotation(IDLE_ROTATION);
										setFlightScale(1);
										onReturnToIdle?.();
									},
								},
								flightTimerRef,
							);
						}, BUBBLE_FADE_MS);
					}, POINT_HOLD_MS);
				},
			},
			flightTimerRef,
		);

		return () => clearAllTimers();
	}, [isPointing, pointTarget, screenshotDimensions, x, y, springX, springY, clearAllTimers, onReturnToIdle]);

	// Speaking state — show bubble immediately, auto-dismiss
	useEffect(() => {
		if (isSpeaking) {
			queueMicrotask(() => {
				setFlightPhase("holding");
				setBubbleOpacity(1);
			});

			holdTimerRef.current = setTimeout(() => {
				setBubbleOpacity(0);
				setFlightPhase("fading");

				fadeTimerRef.current = setTimeout(() => {
					setFlightPhase("idle");
					onReturnToIdle?.();
				}, BUBBLE_FADE_MS);
			}, POINT_HOLD_MS);

			return () => {
				if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
				if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
			};
		}
	}, [isSpeaking, onReturnToIdle]);

	const showNavBubble = (flightPhase === "holding" || flightPhase === "fading") && isPointing;
	const showResponseOverlay = (isPointing || isSpeaking) && responseText;

	return (
		<AnimatePresence>
			{isActive ? (
				<motion.div
					className="pointer-events-none fixed inset-0"
					data-clicky-overlay
					style={{ zIndex: 9998 }}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
				>
					{/* Cursor companion */}
					<motion.div
						className="absolute"
						style={{
							x: springX,
							y: springY,
							willChange: "transform",
						}}
						initial={{ scale: 0, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0, opacity: 0 }}
						transition={{
							type: "spring",
							damping: 15,
							stiffness: 300,
						}}
					>
						<ClickyCursor
							state={state}
							rotation={rotation}
							flightScale={flightScale}
						/>

						{/* Navigation phrase bubble (small blue pill at target) */}
						<AnimatePresence>
							{showNavBubble ? (
								<motion.div
									style={{ opacity: bubbleOpacity }}
									transition={{ duration: 0.5, ease: "easeOut" }}
								>
									<ClickySpeechBubble text={navPhrase} />
								</motion.div>
							) : null}
						</AnimatePresence>

						{/* Welcome message */}
						<AnimatePresence>
							{showWelcome && flightPhase === "idle" && !isPointing && !isSpeaking ? (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: 0.5, ease: "easeOut" }}
								>
									<ClickySpeechBubble text="hey! i'm clicky" />
								</motion.div>
							) : null}
						</AnimatePresence>
					</motion.div>

					{/* Response overlay (separate dark panel near cursor) */}
					<AnimatePresence>
						{showResponseOverlay ? (
							<ClickyResponseOverlay
								text={responseText}
								cursorX={springX}
								cursorY={springY}
								opacity={bubbleOpacity}
							/>
						) : null}
					</AnimatePresence>

					{/* Conversation history panel */}
					{history.length > 0 ? (
						<ClickyHistoryPanel history={history} />
					) : null}
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
