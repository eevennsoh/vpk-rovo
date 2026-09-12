import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
	AgentListRowActionButton,
	type AgentListRowAction,
} from "./agent-list-row-action";

/** Hover/focus actions for an agent row, including the lifecycle-slot overlay. */
export function AgentListCardActions({
	menu,
	overlay = false,
	pinned = false,
	primary,
	secondary,
}: Readonly<{
	menu?: ReactNode;
	overlay?: boolean;
	pinned?: boolean;
	primary?: AgentListRowAction;
	secondary?: AgentListRowAction;
}>) {
	if (overlay) {
		return (
			<div
				className={cn(
					"pointer-events-none absolute inset-y-0 right-0 flex w-6 items-center justify-center opacity-0",
					"group-hover/agent-row:pointer-events-auto group-hover/agent-row:opacity-100",
					"has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100",
					"group-has-[[aria-expanded=true]]/agent-row:pointer-events-auto group-has-[[aria-expanded=true]]/agent-row:opacity-100",
					pinned && "pointer-events-auto opacity-100",
				)}
				data-agent-list-card-actions=""
				data-session-drag-ignore=""
			>
				{menu}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"grid shrink-0 grid-cols-[0fr] transition-[grid-template-columns] duration-normal ease-out-practical",
				"group-hover/agent-row:grid-cols-[1fr] group-has-[:focus-visible]/agent-row:grid-cols-[1fr]",
				"motion-reduce:transition-none",
				"group-data-[variant=uncaptured-work]/agent-row:transition-none",
				pinned && "grid-cols-[1fr]",
			)}
		>
			<div
				className={cn(
					"min-w-0 overflow-hidden has-[:focus-visible]:overflow-visible",
					pinned && "overflow-visible",
				)}
			>
				<div
					className={cn(
						"pointer-events-none flex shrink-0 items-center gap-1 pl-3 opacity-0 transition-opacity duration-normal ease-out-practical",
						"group-hover/agent-row:pointer-events-auto group-hover/agent-row:opacity-100",
						"group-has-[:focus-visible]/agent-row:pointer-events-auto group-has-[:focus-visible]/agent-row:opacity-100",
						"motion-reduce:transition-none",
						"group-data-[variant=uncaptured-work]/agent-row:transition-none",
						pinned && "pointer-events-auto opacity-100",
					)}
					data-session-drag-ignore=""
				>
					{primary ? <AgentListRowActionButton action={primary} /> : null}
					{secondary ? <AgentListRowActionButton action={secondary} /> : null}
					{menu}
				</div>
			</div>
		</div>
	);
}
