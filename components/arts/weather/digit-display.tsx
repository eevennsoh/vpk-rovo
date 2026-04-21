"use client";

import type { CSSProperties, ReactNode } from "react";

import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface DigitDisplayProps {
	children: ReactNode;
	className?: string;
	weight?: number;
	tracking?: number;
	style?: CSSProperties;
}

function FlipChar({ char }: { char: string }) {
	return (
		<span className="inline-flex overflow-hidden">
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.span
					key={char}
					className="inline-block"
					initial={{ y: "100%", filter: "blur(4px)", opacity: 0 }}
					animate={{ y: 0, filter: "blur(0px)", opacity: 1 }}
					exit={{ y: "-100%", filter: "blur(4px)", opacity: 0 }}
					transition={{
						type: "spring",
						bounce: 0,
						visualDuration: 0.3,
					}}
					style={{ willChange: "transform, filter" }}
				>
					{char}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}

export function FlipText({ text }: { text: string }) {
	return (
		<>
			{text.split("").map((char, i) => (
				<FlipChar key={i} char={char} />
			))}
		</>
	);
}

export function DigitDisplay({
	children,
	className,
	weight = 200,
	tracking = -0.04,
	style,
}: DigitDisplayProps) {
	const text = typeof children === "string" ? children : null;

	return (
		<span
			className={cn(
				"inline-flex items-baseline font-sans tabular-nums leading-[0.85] [font-feature-settings:'tnum','ss01','ss02']",
				className,
			)}
			style={{
				fontWeight: weight,
				letterSpacing: `${tracking}em`,
				fontVariantNumeric: "tabular-nums",
				...style,
			}}
		>
			{text
				? text.split("").map((char, i) => (
						<FlipChar key={i} char={char} />
					))
				: children}
		</span>
	);
}
