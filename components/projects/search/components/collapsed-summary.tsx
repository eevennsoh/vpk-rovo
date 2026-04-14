"use client";

import React from "react";
import { token } from "@/lib/tokens";

import SummaryFooter from "./summary-footer";

interface CollapsedSummaryProps {
	onExpand: () => void;
}

/**
 * Collapsed state preview for AI summary panel with truncated text and fade effect
 */
export default function CollapsedSummary({ onExpand }: Readonly<CollapsedSummaryProps>): React.ReactElement {
	function handleClick(): void {
		onExpand();
	}

	function handleReadMoreClick(e: React.MouseEvent): void {
		e.preventDefault();
		e.stopPropagation();
		onExpand();
	}

	return (
		<div onClick={handleClick} style={{ cursor: "pointer" }}>
			<div className="flex flex-col gap-4">
				{/* Preview Text - truncated with fade effect */}
				<div style={{ position: "relative", marginRight: token("space.200") }}>
					<div style={{ font: token("font.body") }}>
						<span className="text-sm">For detailed information on the OKRs for 2026, you can refer to the following resources:</span>
					</div>

					<div style={{ font: token("font.body"), paddingLeft: token("space.100") }}>
						<span className="text-sm font-semibold">1. 2026 OKR Planning</span>
						<span className="text-sm">: This page captures the work related to crafting KRs and OKRs for L2 and L3 objectives for 2026. You can view it </span>
					</div>

					{/* Fade out gradient overlay */}
					<div
						style={{
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
							height: "40px",
							background: `linear-gradient(to bottom, transparent, ${token("elevation.surface")})`,
							pointerEvents: "none",
						}}
					/>
				</div>

				{/* Read more button */}
				<div>
					<a href="#" onClick={handleReadMoreClick}>
						Read more
					</a>
				</div>

				<SummaryFooter stopPropagation />
			</div>
		</div>
	);
}
