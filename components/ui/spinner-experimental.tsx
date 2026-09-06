"use client";

import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import styles from "./spinner-experimental.module.css";

const HEX = "M 10 4 L 11.3 4.75 L 12.6 5.5 L 13.9 6.25 L 15.2 7 L 15.2 8.5 L 15.2 10 L 15.2 11.5 L 15.2 13 L 13.9 13.75 L 12.6 14.5 L 11.3 15.25 L 10 16 L 8.7 15.25 L 7.4 14.5 L 6.1 13.75 L 4.8 13 L 4.8 11.5 L 4.8 10 L 4.8 8.5 L 4.8 7 L 6.1 6.25 L 7.4 5.5 L 8.7 4.75 Z";
const SPARKLE = "M 10 4 L 10.64 5.36 L 11.27 6.73 L 11.91 8.09 L 13.27 8.73 L 14.64 9.36 L 16 10 L 14.64 10.64 L 13.27 11.27 L 11.91 11.91 L 11.27 13.27 L 10.64 14.64 L 10 16 L 9.36 14.64 L 8.73 13.27 L 8.09 11.91 L 6.73 11.27 L 5.36 10.64 L 4 10 L 5.36 9.36 L 6.73 8.73 L 8.09 8.09 L 8.73 6.73 L 9.36 5.36 Z";

interface ExperimentalSpinnerProps {
	className?: string;
	label: string;
	style?: React.CSSProperties;
}

export function ExperimentalSpinner({
	className,
	label,
	style,
}: Readonly<ExperimentalSpinnerProps>): React.ReactElement {
	const shouldReduceMotion = useReducedMotion();

	return (
		<svg
			aria-label={label}
			className={cn("pointer-events-none shrink-0", className)}
			data-slot="spinner"
			fill="none"
			role="status"
			style={style}
			viewBox="0 0 20 20"
		>
			<g className={cn(styles.scale, !shouldReduceMotion && styles.scaleMotion)}>
				<g className={shouldReduceMotion ? undefined : styles.rotatorMotion}>
					<path
						className={shouldReduceMotion ? undefined : styles.morphMotion}
						d={shouldReduceMotion ? HEX : SPARKLE}
						fill="currentColor"
					/>
				</g>
			</g>
		</svg>
	);
}
