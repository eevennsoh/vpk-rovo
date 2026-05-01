"use client";

import { useMemo } from "react";
import { type HTMLMotionProps, motion, stagger } from "motion/react";
import { ScrambleText } from "motion-plus/react";

import { cn } from "@/lib/utils";

const MOTION_SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▀▄■□▪▫●○◆◇◈◊※†‡";
const PER_CHAR_STAGGER_S = 0.1;
const SCRAMBLE_DURATION_S = 1;

interface PersonalGraphTitleProps extends HTMLMotionProps<"h1"> {
	play?: boolean;
}

export function PersonalGraphTitle({ className, play = true, ...motionProps }: Readonly<PersonalGraphTitleProps>) {
	const centerStagger = useMemo(() => stagger(PER_CHAR_STAGGER_S, { from: "center" }), []);

	return (
		<motion.h1 aria-label="PERSONAL GRAPH" className={cn(className)} {...motionProps}>
			{play ? (
				<>
					<ScrambleText
						className="block"
						duration={SCRAMBLE_DURATION_S}
						delay={centerStagger}
						chars={MOTION_SPECIAL_CHARS}
					>
						PERSONAL
					</ScrambleText>
					<ScrambleText
						className="block"
						duration={SCRAMBLE_DURATION_S}
						delay={centerStagger}
						chars={MOTION_SPECIAL_CHARS}
					>
						GRAPH
					</ScrambleText>
				</>
			) : (
				<>
					<span aria-hidden className="block">
						PERSONAL
					</span>
					<span aria-hidden className="block">
						GRAPH
					</span>
				</>
			)}
		</motion.h1>
	);
}
