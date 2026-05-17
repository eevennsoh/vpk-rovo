"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_COLORS = ["#1868db", "#bf63f3", "#fca700"] as const;
const DEFAULT_DURATION = 1.2;
const DEFAULT_STAGGER_DELAY = 0.2;

const DOT_REVEAL_KEYFRAMES = `
@keyframes dot-reveal {
	0%, 20% { opacity: 0; }
	40%, 100% { opacity: 1; }
}
`;

export interface AnimatedDotsProps {
	colors?: readonly string[];
	duration?: number;
	staggerDelay?: number;
	className?: string;
}

export const AnimatedDots = memo(
	({
		colors = DEFAULT_COLORS,
		duration = DEFAULT_DURATION,
		staggerDelay = DEFAULT_STAGGER_DELAY,
		className,
	}: Readonly<AnimatedDotsProps>) => {
		return (
			<>
				<style dangerouslySetInnerHTML={{ __html: DOT_REVEAL_KEYFRAMES }} />
				<span
					className={cn("shrink-0 inline-flex items-baseline", className)}
					aria-hidden="true"
				>
					{colors.map((color, i) => (
						<span
							key={i}
							className="text-sm leading-none"
							style={{
								animation: `dot-reveal ${duration}s ease-in-out infinite`,
								animationDelay: `${i * staggerDelay}s`,
								color,
							}}
						>
							.
						</span>
					))}
				</span>
			</>
		);
	}
);

AnimatedDots.displayName = "AnimatedDots";
