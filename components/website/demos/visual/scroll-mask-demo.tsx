"use client";

import { ScrollMask } from "@/components/visual/scroll-mask";
import { token } from "@/lib/tokens";

const MENU_ITEMS = [
	{ title: "Project brief", meta: "Updated 2m ago" },
	{ title: "Discovery notes", meta: "3 comments" },
	{ title: "Storyboard", meta: "Draft" },
	{ title: "Voice capture", meta: "Ready" },
	{ title: "Agent plan", meta: "Needs review" },
	{ title: "Theme tokens", meta: "Synced" },
	{ title: "Prompt library", meta: "18 prompts" },
	{ title: "Knowledge sources", meta: "6 attached" },
	{ title: "Preview build", meta: "Queued" },
	{ title: "QA checklist", meta: "4 open" },
	{ title: "Release notes", meta: "Draft" },
	{ title: "Team handoff", meta: "Tomorrow" },
	{ title: "Archive", meta: "12 items" },
] as const;

function ScrollMaskHeader() {
	return (
		<div className="flex items-center justify-between gap-3">
			<div className="min-w-0">
				<div className="truncate text-sm font-semibold text-text">Workspace menu</div>
				<div className="truncate text-xs text-text-subtlest">Recent planning surfaces</div>
			</div>
			<div className="rounded-full bg-bg-neutral px-2 py-1 text-xs font-medium text-text-subtle">
				{MENU_ITEMS.length}
			</div>
		</div>
	);
}

function ScrollMaskFooter() {
	return (
		<div className="flex items-center justify-between gap-3">
			<button
				type="button"
				className="h-8 rounded-md px-2 text-sm font-medium text-text-subtle transition-colors hover:bg-bg-neutral-hovered hover:text-text"
			>
				Archive
			</button>
			<button
				type="button"
				className="h-8 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hovered"
			>
				Open
			</button>
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
				className="w-full shadow-sm"
				viewportClassName="max-h-[22rem]"
				header={<ScrollMaskHeader />}
				footer={<ScrollMaskFooter />}
			>
				<div className="px-2">
					{MENU_ITEMS.map((item) => (
						<button
							key={item.title}
							type="button"
							className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-bg-neutral-hovered focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused"
						>
							<span className="min-w-0">
								<span className="block truncate text-sm font-medium text-text">
									{item.title}
								</span>
								<span className="block truncate text-xs text-text-subtlest">
									{item.meta}
								</span>
							</span>
							<span className="size-2 shrink-0 rounded-full bg-blue-600" />
						</button>
					))}
				</div>
			</ScrollMask>
		</div>
	);
}
