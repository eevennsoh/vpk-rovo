"use client";

/**
 * Presentation primitives shared by the Text Continuity examples — the ADS-token
 * replacements for torph's `inline.module.scss` and `card.module.scss`.
 *
 * Geometry (sizes, radii, insets) is 1:1 with upstream; only the palette is
 * VPK-native, so the gallery works in light and dark.
 */

import { useRef } from "react";

import { cn } from "@/lib/utils";

/** Rest ring used by every custom-drawn control here. Matches ADS focus. */
export const FOCUS_RING =
	"outline-none focus-visible:ring-2 focus-visible:ring-border-focused focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

/** The value under test. Everything else in an example scaffolds one of these. */
export function Stage({
	size = "medium",
	mono = false,
	tabular = false,
	className,
	children,
}: Readonly<{
	size?: "small" | "medium" | "large";
	mono?: boolean;
	tabular?: boolean;
	className?: string;
	children: React.ReactNode;
}>) {
	return (
		<div
			className={cn(
				"font-semibold leading-snug text-text",
				size === "small" && "text-lg",
				size === "medium" && "text-2xl",
				size === "large" && "text-4xl",
				mono && "font-mono font-normal",
				tabular && "tabular-nums",
				className,
			)}
		>
			{children}
		</div>
	);
}

/** Sub-label under an example's value. */
export function Caption({ className, children }: Readonly<{ className?: string; children: React.ReactNode }>) {
	return <span className={cn("text-[0.6875rem] font-medium text-text-subtlest", className)}>{children}</span>;
}

/** Two or three of the same value side by side, for differences only motion shows. */
export function Split({ className, children }: Readonly<{ className?: string; children: React.ReactNode }>) {
	return <div className={cn("flex w-full items-center justify-center gap-6 px-4 text-center", className)}>{children}</div>;
}

export function SplitItem({ className, children }: Readonly<{ className?: string; children: React.ReactNode }>) {
	return <div className={cn("flex flex-col items-center justify-center gap-1.5 text-center", className)}>{children}</div>;
}

/** A pill that reads as a control, for examples about a button resizing. */
export function Chip({
	className,
	style,
	children,
}: Readonly<{ className?: string; style?: React.CSSProperties; children: React.ReactNode }>) {
	return (
		<div
			className={cn("inline-flex items-center gap-2 rounded-full bg-bg-neutral px-[1.125rem] py-2.5 text-base font-medium text-text", className)}
			style={style}
		>
			{children}
		</div>
	);
}

/** A tighter pill for a single figure. */
export function Badge({ className, children }: Readonly<{ className?: string; children: React.ReactNode }>) {
	return (
		<div className={cn("inline-flex items-center rounded-full bg-bg-neutral px-3.5 py-1.5 text-[1.375rem] font-semibold", className)}>
			{children}
		</div>
	);
}

/** A sunken inset panel — upstream's `#0d0d0d` boxes. */
export function Well({
	className,
	style,
	children,
	...rest
}: React.ComponentProps<"div">) {
	return (
		<div className={cn("rounded-xl border border-border bg-surface-sunken", className)} style={style} {...rest}>
			{children}
		</div>
	);
}

export type ResizeFrameProps = Readonly<{
	children: React.ReactNode;
	label: string;
	valueMin: number;
	valueMax: number;
	valueNow: number;
	valueText?: string;
	keyStep?: number;
	/** Read at grab time, so a caller animating width outside React still gets a live origin. */
	getWidth: () => number;
	onResize: (width: number) => void;
	onGrab?: () => void;
	onRelease?: () => void;
	/** Keyboard falls through to `onResize` unless a caller wants the step itself. */
	onStep?: (delta: number) => void;
	cellRef?: React.Ref<HTMLDivElement>;
	cellClassName?: string;
	cellStyle?: React.CSSProperties;
	className?: string;
}>;

/**
 * A content-box cell with a drag grip on its right edge. Content-box on purpose:
 * the width a caller sets is the width the text actually gets, so a measured
 * form comparison is not thrown off by padding.
 */
export const ResizeFrame = function ResizeFrame({
	children,
	label,
	valueMin,
	valueMax,
	valueNow,
	valueText,
	keyStep = 24,
	getWidth,
	onResize,
	onGrab,
	onRelease,
	onStep,
	cellRef,
	cellClassName,
	cellStyle,
	className,
}: ResizeFrameProps) {
	const origin = useRef(0);

	return (
		<div className={cn("flex items-stretch", className)}>
			<div
				ref={cellRef}
				className={cn("relative box-content flex items-center overflow-hidden rounded-l-lg border border-border bg-surface-sunken px-3.5", cellClassName)}
				style={cellStyle}
			>
				{children}
			</div>

			<span
				className={cn(
					"relative w-3 flex-none cursor-col-resize touch-none rounded-r-lg bg-bg-neutral",
					"after:absolute after:left-1/2 after:top-1/2 after:h-4 after:w-0.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-icon-subtlest after:content-['']",
					"hover:after:bg-icon-brand",
					FOCUS_RING,
				)}
				role="slider"
				tabIndex={0}
				aria-label={label}
				aria-valuemin={valueMin}
				aria-valuemax={valueMax}
				aria-valuenow={valueNow}
				aria-valuetext={valueText}
				onPointerDown={(event) => {
					event.currentTarget.setPointerCapture(event.pointerId);
					origin.current = event.clientX - getWidth();
					onGrab?.();
				}}
				onPointerMove={(event) => {
					if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
					onResize(event.clientX - origin.current);
				}}
				onPointerUp={() => onRelease?.()}
				onPointerCancel={() => onRelease?.()}
				onKeyDown={(event) => {
					const delta = event.key === "ArrowLeft" ? -keyStep : event.key === "ArrowRight" ? keyStep : 0;
					if (!delta) return;
					event.preventDefault();
					if (onStep) onStep(delta);
					else onResize(getWidth() + delta);
				}}
			/>
		</div>
	);
};
