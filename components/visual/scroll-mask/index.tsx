"use client";

import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { buildScrollMaskStyle } from "./lib";

export interface ScrollMaskProps
	extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	children: ReactNode;
	header?: ReactNode;
	footer?: ReactNode;
	viewportClassName?: string;
	viewportStyle?: CSSProperties;
	headerClassName?: string;
	footerClassName?: string;
	fadeSize?: number | string;
	scrollbarWidth?: number | string;
}

export function ScrollMask({
	children,
	header,
	footer,
	className,
	viewportClassName,
	viewportStyle,
	headerClassName,
	footerClassName,
	fadeSize,
	scrollbarWidth,
	style,
	...props
}: Readonly<ScrollMaskProps>) {
	const maskStyle = buildScrollMaskStyle({ fadeSize, scrollbarWidth });

	return (
		<div
			data-slot="scroll-mask"
			className={cn(
				"flex flex-col overflow-hidden rounded-lg border border-border bg-surface text-text",
				className,
			)}
			style={{ maxHeight: `calc(${token("space.600")} * 8)`, ...style }}
			{...props}
		>
			{header ? (
				<div
					data-slot="scroll-mask-header"
					className={cn("shrink-0 bg-surface px-4 py-3", headerClassName)}
				>
					{header}
				</div>
			) : null}
			<div
				data-slot="scroll-mask-viewport"
				className={cn(
					"min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
					viewportClassName,
				)}
				style={{ ...maskStyle, ...viewportStyle }}
			>
				<div data-slot="scroll-mask-content" className="py-1">
					{children}
				</div>
			</div>
			{footer ? (
				<div
					data-slot="scroll-mask-footer"
					className={cn("shrink-0 bg-surface px-4 py-3", footerClassName)}
				>
					{footer}
				</div>
			) : null}
		</div>
	);
}

export default ScrollMask;
