"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

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
	const idRef = useRef(0);
	const prevRef = useRef(char);

	if (prevRef.current !== char) {
		idRef.current += 1;
		prevRef.current = char;
	}

	return (
		<span className="relative inline-flex overflow-hidden">
			<span className="invisible" aria-hidden="true">{char}</span>
			<AnimatePresence initial={false}>
				<motion.span
					key={idRef.current}
					className="absolute left-0 top-0"
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
