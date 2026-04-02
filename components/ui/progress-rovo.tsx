"use client";

import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";

const ROVO_BANDS = [
	{ color: "#FCA700", delay: "450ms" },
	{ color: "#6A9A23", delay: "300ms" },
	{ color: "#1868DB", delay: "150ms" },
	{ color: "#AF59E0", delay: "0ms" },
] as const;

export interface ProgressRovoProps extends React.ComponentProps<"div"> {
	/** Progress value 0-100. Only used in determinate mode. */
	value?: number | null;
	/** When true, animates continually without regard to progress. */
	isIndeterminate?: boolean;
}

function ProgressRovo({ value, isIndeterminate = false, className, ...props }: Readonly<ProgressRovoProps>) {
	const clampedValue = Math.min(100, Math.max(0, value ?? 0));
	const isComplete = !isIndeterminate && clampedValue >= 100;

	return (
		<div
			data-slot="progress-rovo"
			role="progressbar"
			aria-valuenow={isIndeterminate ? undefined : clampedValue}
			aria-valuemin={0}
			aria-valuemax={100}
			className={cn("relative h-[3px] w-full overflow-hidden rounded-full bg-bg-neutral", className)}
			{...props}
		>
			<AnimatePresence initial={false}>
				{isIndeterminate ? (
					<motion.span
						key="indeterminate"
						className="absolute inset-y-0 flex w-[80%] overflow-hidden rounded-full"
						style={{
							animation: "progressRovoIndeterminate 1.5s cubic-bezier(0.35, 0, 0.15, 1) infinite",
						}}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
					>
						{ROVO_BANDS.map((band) => (
							<span
								key={band.color}
								className="h-full min-w-0"
								style={{
									backgroundColor: band.color,
									animation: "rovoBandPulse 1.3s cubic-bezier(0.45, 0, 0.15, 1) infinite",
									animationDelay: band.delay,
									flex: 1,
								}}
							/>
						))}
					</motion.span>
				) : isComplete ? (
					<motion.div
						key="complete"
						className="absolute inset-y-0 left-0 w-full rounded-full bg-success"
						style={{ transformOrigin: "left", willChange: "transform" }}
						initial={{ scaleX: 0 }}
						animate={{ scaleX: 1 }}
						transition={{ duration: 0.5, ease: [0, 0.4, 0, 1] }}
					/>
				) : (
					<motion.div
						key="determinate"
						className="absolute inset-y-0 left-0 overflow-hidden rounded-full"
						animate={{ width: `${clampedValue}%` }}
						transition={{ duration: 0.3, ease: [0, 0.4, 0, 1] }}
					>
						<span
							className="flex h-full"
							style={{
								width: "200%",
								animation: "rovoBandTraverse 1.5s linear infinite",
								willChange: "transform",
							}}
						>
							{[...ROVO_BANDS, ...ROVO_BANDS].map((band, i) => (
								<span
									key={i}
									className="h-full min-w-0 flex-1"
									style={{ backgroundColor: band.color }}
								/>
							))}
						</span>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export { ProgressRovo };
