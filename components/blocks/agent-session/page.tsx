"use client";

import { useCallback, useState } from "react";

import {
	AGENT_SESSION_ATTACHED_FINISHED_ITEMS,
	AGENT_SESSION_CLOUD_ITEMS,
	AGENT_SESSION_ITEMS,
	AGENT_SESSION_ATTACHED_MULTI_WORKING_ITEMS,
	AGENT_SESSION_ATTACHED_NEEDS_INPUT_ITEMS,
	AGENT_SESSION_ATTACHED_WORKING_ITEMS,
	AgentSession,
	type AgentSessionDensity,
	type AgentSessionItem,
	type AgentSessionRole,
	type AgentSessionVariant,
} from "./index";

// One card is the whole story for the short local row — a second only repeats
// the same states. The cloud list keeps three so the lifecycle indicators
// (working, needs input, complete) can be compared side by side.
const AGENT_SESSION_DEMO_ITEMS = AGENT_SESSION_ITEMS.slice(0, 1);
const AGENT_SESSION_ATTACHED_STATES = [
	{ items: AGENT_SESSION_ATTACHED_WORKING_ITEMS, label: "1 agent working" },
	{ items: AGENT_SESSION_ATTACHED_MULTI_WORKING_ITEMS, label: "1–n agents working" },
	{ items: AGENT_SESSION_ATTACHED_NEEDS_INPUT_ITEMS, label: "Needs input" },
	{ items: AGENT_SESSION_ATTACHED_FINISHED_ITEMS, label: "Finished" },
] as const;

const AGENT_SESSION_ROLES = ["owner", "viewer"] as const satisfies readonly AgentSessionRole[];

function sessionRoleLabel(role: AgentSessionRole): string {
	switch (role) {
		case "owner":
			return "Owner";
		case "viewer":
			return "Viewer";
		case "expired":
			return "Expired";
		default: {
			const exhaustiveRole: never = role;
			return exhaustiveRole;
		}
	}
}

function withSessionRole(
	items: readonly AgentSessionItem[],
	role: AgentSessionRole,
): readonly AgentSessionItem[] {
	return items.map((item) => ({ ...item, role }));
}

export default function AgentSessionPage({
	density = "short",
	host = "local",
	variant = "large",
}: Readonly<{
	density?: AgentSessionDensity;
	/** Which fixture list to render. Host is a property of the data, not the layout. */
	host?: "local" | "cloud";
	variant?: AgentSessionVariant;
}>) {
	const [capturedIds, setCapturedIds] = useState<ReadonlySet<string>>(() => new Set());
	const isLong = variant === "large" && density === "long";
	const [items, setItems] = useState<readonly AgentSessionItem[]>(() => {
		if (variant === "medium-attached") {
			return AGENT_SESSION_ATTACHED_WORKING_ITEMS;
		}
		if (host === "cloud") {
			return isLong ? AGENT_SESSION_CLOUD_ITEMS : AGENT_SESSION_CLOUD_ITEMS.slice(0, 1);
		}
		return isLong ? AGENT_SESSION_ITEMS.slice(0, 3) : AGENT_SESSION_DEMO_ITEMS;
	});

	const handleCapture = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);
	const handleLink = useCallback((item: AgentSessionItem) => {
		setCapturedIds((current) => new Set(current).add(item.id));
	}, []);
	// The menu's destructive and dismissive rows really remove the row, so the
	// demo shows the outcome rather than an enabled control that does nothing.
	const handleRemove = useCallback((item: AgentSessionItem) => {
		setItems((current) => current.filter((candidate) => candidate.id !== item.id));
	}, []);
	const handleRename = useCallback((item: AgentSessionItem) => {
		setItems((current) => current.map((candidate) => (
			candidate.id === item.id
				? { ...candidate, shortTitle: `${candidate.shortTitle ?? candidate.title} (renamed)`, title: `${candidate.title} (renamed)` }
				: candidate
		)));
	}, []);
	return (
		<div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface p-6">
			{variant === "medium-attached" ? (
				<div className="flex flex-col gap-4">
					{AGENT_SESSION_ATTACHED_STATES.map((state) => (
						<section className="flex flex-col gap-1.5" key={state.label}>
							<span className="text-xs font-medium text-text-subtle">{state.label}</span>
							<AgentSession
								className="w-fit"
								items={state.items}
								variant="medium-attached"
							/>
						</section>
					))}
				</div>
			) : variant === "large" ? (
				<div className="flex w-full flex-col items-center gap-6">
					{AGENT_SESSION_ROLES.map((role) => (
						<section className="flex w-full flex-col items-center gap-1.5" key={role}>
							<span className="text-xs font-medium text-text-subtle">
								{sessionRoleLabel(role)}
							</span>
							<AgentSession
								capturedItemIds={capturedIds}
								className={isLong ? "w-[520px]" : "w-[320px]"}
								density={density}
								items={withSessionRole(items, role)}
								onContinueInAgent={handleCapture}
								onCreateWorkItem={handleCapture}
								onDeleteSession={handleRemove}
								onLinkWorkItem={handleLink}
								onRenameSession={handleRename}
								onSubtasks={handleCapture}
								onToggleVisibility={handleRemove}
								variant={variant}
							/>
						</section>
					))}
					{host === "cloud" && isLong ? (
						<section className="flex w-full flex-col items-center gap-1.5">
							<span className="text-xs font-medium text-text-subtle">
								{sessionRoleLabel("expired")}
							</span>
							<AgentSession
								className="w-[520px]"
								density={density}
								items={withSessionRole(items.slice(-1), "expired")}
								variant={variant}
							/>
						</section>
					) : null}
				</div>
			) : (
				<AgentSession
					capturedItemIds={capturedIds}
					className="w-fit"
					density={density}
					items={items}
					onContinueInAgent={handleCapture}
					onCreateWorkItem={handleCapture}
					onDeleteSession={handleRemove}
					onLinkWorkItem={handleLink}
					onRenameSession={handleRename}
					onSubtasks={handleCapture}
					onToggleVisibility={handleRemove}
					variant={variant}
				/>
			)}
		</div>
	);
}
