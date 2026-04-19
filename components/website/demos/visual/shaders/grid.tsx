"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export type GridVariant = "Desktop" | "Tablet" | "Phone";

export interface GridProps {
	/** Layout variant. Controls the number of columns. */
	variant?: GridVariant;
	/** Gap (in px) between grid tiles. */
	gap?: number;
	/** Padding (in px) around the grid container. */
	padding?: number;
	/** Border radius (in px) applied to each tile. */
	borderRadius?: number;
	/** Height (in px) of each tile. */
	tileHeight?: number;
	/** Optional className for the outer container. */
	className?: string;
}

const VARIANT_COLUMNS: Record<GridVariant, number> = {
	Desktop: 3,
	Tablet: 2,
	Phone: 1,
};

const TILES = [
	{ from: "#7C3AED", to: "#22D3EE" },
	{ from: "#F472B6", to: "#FB923C" },
	{ from: "#34D399", to: "#0EA5E9" },
	{ from: "#FACC15", to: "#EF4444" },
	{ from: "#A78BFA", to: "#F472B6" },
	{ from: "#10B981", to: "#FACC15" },
] as const;

/**
 * Grid — a responsive image grid ported from the Framer Grid component.
 * https://framer.com/m/framer/Grid.js
 *
 * Columns are driven by the `variant` prop (Desktop=3, Tablet=2, Phone=1)
 * rather than viewport media queries, matching the original Framer behavior.
 */
export default function Grid({
	variant = "Desktop",
	gap = 20,
	padding = 20,
	borderRadius = 20,
	tileHeight = 500,
	className,
}: GridProps) {
	const reactId = useId();
	const columns = VARIANT_COLUMNS[variant];

	return (
		<div
			className={cn("relative w-full overflow-hidden bg-surface", className)}
			style={{
				display: "grid",
				gridTemplateColumns: `repeat(${columns}, minmax(50px, 1fr))`,
				gridAutoRows: "min-content",
				gap: `${gap}px`,
				padding: `${padding}px`,
				justifyContent: "center",
			}}
			data-variant={variant}
		>
			{TILES.map((tile, index) => {
				const gradientId = `grid-tile-${reactId}-${index}`;
				return (
					<div
						key={gradientId}
						className="relative w-full"
						style={{
							height: `${tileHeight}px`,
							borderRadius: `${borderRadius}px`,
							overflow: "hidden",
						}}
					>
						<svg
							role="img"
							aria-label={`Grid tile ${index + 1}`}
							viewBox="0 0 100 100"
							preserveAspectRatio="none"
							className="h-full w-full"
						>
							<defs>
								<linearGradient
									id={gradientId}
									x1="0%"
									y1="0%"
									x2="100%"
									y2="100%"
								>
									<stop offset="0%" stopColor={tile.from} />
									<stop offset="100%" stopColor={tile.to} />
								</linearGradient>
							</defs>
							<rect
								width="100"
								height="100"
								fill={`url(#${gradientId})`}
							/>
						</svg>
					</div>
				);
			})}
		</div>
	);
}
