"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface DigitDisplayProps {
	children: ReactNode;
	className?: string;
	weight?: number;
	tracking?: number;
	style?: CSSProperties;
}

export function DigitDisplay({
	children,
	className,
	weight = 200,
	tracking = -0.04,
	style,
}: DigitDisplayProps) {
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
			{children}
		</span>
	);
}
