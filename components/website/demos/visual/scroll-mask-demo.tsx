"use client";

import { ScrollMask } from "@/components/visual/scroll-mask";
import { token } from "@/lib/tokens";

const ROWS = Array.from({ length: 13 }, (_, index) => `Row ${index + 1}`);

function ScrollMaskHeader() {
	return (
		<div className="flex min-h-11 items-center">
			<div className="truncate text-sm font-semibold text-text">Sticky header</div>
		</div>
	);
}

function ScrollMaskFooter() {
	return (
		<div className="flex min-h-11 items-center">
			<div className="truncate text-sm font-semibold text-text">Sticky footer</div>
		</div>
	);
}

export default function ScrollMaskDemo() {
	return (
		<div
			className="flex w-full max-w-md flex-col items-center"
			style={{ gap: token("space.300") }}
		>
			<ScrollMask
				aria-label="Workspace menu"
				className="max-h-[28rem] w-full shadow-sm"
				header={<ScrollMaskHeader />}
				footer={<ScrollMaskFooter />}
			>
				<div className="px-2">
					{ROWS.map((row) => (
						<button
							key={row}
							type="button"
							className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-text transition-colors hover:bg-bg-neutral-hovered focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused"
						>
							{row}
						</button>
					))}
				</div>
			</ScrollMask>
		</div>
	);
}
