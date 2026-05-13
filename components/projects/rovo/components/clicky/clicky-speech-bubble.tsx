"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Speech bubble — matches reference Clicky (blue pill, white text, char stream)
// ---------------------------------------------------------------------------

const CLICKY_BLUE = "#3380FF";

interface ClickySpeechBubbleProps {
	text: string;
}

export function ClickySpeechBubble({ text }: Readonly<ClickySpeechBubbleProps>) {
	// Stream characters for natural appearance
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
		}, 30 + Math.random() * 30); // 30-60ms per char (reference uses variable delay)

		return () => clearInterval(interval);
	}, [text]);

	if (!displayedText) return null;

	return (
		<motion.div
			className="absolute"
			style={{
				left: 10,
				top: 18,
				willChange: "transform, opacity",
			}}
			initial={{ scale: 0.5, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			exit={{ scale: 0.5, opacity: 0 }}
			transition={{
				type: "spring",
				duration: 0.4,
				bounce: 0.4,
			}}
		>
			<div
				className="max-w-[340px] rounded-md px-2 py-1 text-[11px] font-medium leading-snug text-white"
				style={{
					backgroundColor: CLICKY_BLUE,
					boxShadow: `0 0 6px ${CLICKY_BLUE}80`,
				}}
			>
				{displayedText}
			</div>
		</motion.div>
	);
}
