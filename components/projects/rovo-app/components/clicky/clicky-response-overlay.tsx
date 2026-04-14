"use client";

import { motion, type MotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Response overlay — dark panel near cursor showing full AI response text.
// Matches reference Clicky's CompanionResponseOverlay.
// Smart repositioning: flips left/above if would clip off-screen.
// ---------------------------------------------------------------------------

const OFFSET_X = 22;
const OFFSET_Y = -6;
const MAX_WIDTH = 340;
const EDGE_PADDING = 20;

interface ClickyResponseOverlayProps {
	text: string;
	cursorX: MotionValue<number>;
	cursorY: MotionValue<number>;
	opacity?: number;
}

export function ClickyResponseOverlay({
	text,
	cursorX,
	cursorY,
	opacity = 1,
}: Readonly<ClickyResponseOverlayProps>) {
	const panelRef = useRef<HTMLDivElement>(null);
	const [flipX, setFlipX] = useState(false);
	const [flipY, setFlipY] = useState(false);

	// Stream characters
	const [displayedText, setDisplayedText] = useState("");

	useEffect(() => {
		setDisplayedText("");
		if (!text) return;

		let i = 0;
		const interval = setInterval(() => {
			i++;
			if (i >= text.length) {
				setDisplayedText(text);
				clearInterval(interval);
			} else {
				setDisplayedText(text.slice(0, i));
			}
		}, 25);

		return () => clearInterval(interval);
	}, [text]);

	// Compute position with edge avoidance
	const panelX = useTransform(cursorX, (cx) => {
		if (flipX) return cx - OFFSET_X - MAX_WIDTH;
		return cx + OFFSET_X;
	});

	const panelY = useTransform(cursorY, (cy) => {
		if (flipY) return cy - OFFSET_Y - (panelRef.current?.offsetHeight ?? 100);
		return cy + OFFSET_Y;
	});

	// Check if panel would clip off-screen and flip if needed
	useEffect(() => {
		const check = () => {
			const cx = cursorX.get();
			const cy = cursorY.get();
			const panelHeight = panelRef.current?.offsetHeight ?? 100;

			setFlipX(cx + OFFSET_X + MAX_WIDTH + EDGE_PADDING > window.innerWidth);
			setFlipY(cy + OFFSET_Y + panelHeight + EDGE_PADDING > window.innerHeight);
		};

		check();
		const unsub = cursorX.on("change", check);
		const unsub2 = cursorY.on("change", check);
		return () => { unsub(); unsub2(); };
	}, [cursorX, cursorY]);

	if (!displayedText) return null;

	return (
		<motion.div
			ref={panelRef}
			className="fixed"
			style={{
				x: panelX,
				y: panelY,
				maxWidth: MAX_WIDTH,
				opacity,
				zIndex: 9999,
				willChange: "transform, opacity",
			}}
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity, scale: 1 }}
			exit={{ opacity: 0, scale: 0.95 }}
			transition={{ duration: 0.2, ease: "easeOut" }}
		>
			<div
				className="rounded-[10px] border border-border/50 px-3.5 py-2.5 text-[13px] leading-relaxed text-text"
				style={{
					backgroundColor: "rgba(23, 25, 24, 0.95)",
					boxShadow: "0 8px 16px rgba(0, 0, 0, 0.35)",
					color: "#ECEEED",
					lineHeight: "1.5",
				}}
			>
				{displayedText}
			</div>
		</motion.div>
	);
}
