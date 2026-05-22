"use client";

import { type ReactNode } from "react";
import Link from "next/link";


export interface WebsiteCardProps {
	/** Display name for the component */
	name: string;
	/** Route/URL for the component documentation */
	href?: string;
	/** The component demo to render */
	children: ReactNode;
	/** Additional class names */
	className?: string;
	/** Full-width mode: single column, content-hugging height (no aspect-square) */
	fullWidth?: boolean;
}

/**
 * Card wrapper for displaying component demos in a grid.
 * Maintains aspect-square ratio with centered content.
 */
export function WebsiteCard({ name, href, children, className, fullWidth }: Readonly<WebsiteCardProps>) {
	const Title = href ? (
		<Link
			href={href}
			className="text-sm text-text-subtle no-underline transition-colors hover:text-text hover:underline"
		>
			{name}
		</Link>
	) : (
		<span className="text-sm text-text-subtle">
			{name}
		</span>
	);

	if (fullWidth) {
		return (
			<li
				className={`relative border-r border-b border-border bg-surface p-8 ${className ?? ""}`}
			>
				<span className="mb-4 block">
					{Title}
				</span>
				<div className="relative h-[900px] min-w-0 overflow-hidden rounded-lg border border-border">
					{children}
				</div>
			</li>
		);
	}

	return (
		<li
			className={`cv-auto relative flex aspect-square items-center justify-center bg-surface border-r border-b border-border ${className ?? ""}`}
			style={{ containIntrinsicSize: "auto 480px" }}
		>
			{/* Title positioned at top-left */}
			<span
				className="absolute left-4 top-4"
			>
				{Title}
			</span>

			{/* Centered demo content */}
			<div
				className="flex min-w-0 items-center justify-center overflow-hidden p-8 pt-12 w-full h-full [&>*]:w-full [&>*]:min-w-0"
			>
				{children}
			</div>
		</li>
	);
}
