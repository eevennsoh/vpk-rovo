import { type ReactNode } from "react";

import { token } from "@/lib/tokens";

/**
 * Occupied-slot attach placeholder. Same `h-6` as an activity row so replacing
 * the last chin row does not change card height.
 */
export function JiraIssueAttachChinSlot({
	copy,
}: Readonly<{ copy: string }>) {
	return (
		<div
			aria-hidden
			className="pointer-events-none flex h-6 w-full items-center justify-center rounded-md"
			data-slot="jira-issue-attach-chin-slot"
		>
			<span className="text-xs font-normal text-text-subtlest">
				{copy}
			</span>
		</div>
	);
}

/**
 * Same footprint as a `medium-detached` AgentSession row (`h-[33px]` plus the
 * 2px gap those pills use under the shell) so attach copy can take that slot
 * without growing a second chin.
 */
export function JiraIssueDetachedAttachChinSlot({
	copy,
}: Readonly<{ copy: string }>) {
	return (
		<div
			className="flex h-[33px] w-full items-center justify-center"
			data-slot="jira-issue-attach-chin"
			style={{ marginTop: token("space.025") }}
		>
			<JiraIssueAttachChinSlot copy={copy} />
		</div>
	);
}

/**
 * Nearby/detached pills own `AgentSessionMediumDrag` pointer capture and the
 * window `pointerup`/`pointercancel` fallback. Keep that subtree mounted while
 * attach copy covers the slot, or the first armed move unmounts the source and
 * the board transaction never commits.
 */
export function JiraIssueDetachedSessionTransferSlot({
	attachCopy,
	children,
}: Readonly<{
	attachCopy?: string;
	children: ReactNode;
}>) {
	const replace = Boolean(attachCopy);
	return (
		<div
			className="grid"
			data-slot="jira-issue-detached-session-transfer"
		>
			<div
				aria-hidden={replace || undefined}
				className={replace ? "invisible col-start-1 row-start-1" : undefined}
				inert={replace || undefined}
			>
				{children}
			</div>
			{attachCopy ? (
				<div className="pointer-events-none col-start-1 row-start-1">
					<JiraIssueDetachedAttachChinSlot copy={attachCopy} />
				</div>
			) : null}
		</div>
	);
}
