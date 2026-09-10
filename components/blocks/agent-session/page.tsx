"use client";

import { useCallback, useState } from "react";

import {
	AGENT_SESSION_CLOUD_ITEMS,
	AGENT_SESSION_ITEMS,
	AGENT_SESSION_ATTACHED_ITEMS,
	AgentSession,
	type AgentSessionDensity,
	type AgentSessionItem,
	type AgentSessionVariant,
} from "./index";

// One card is the whole story for the short local row — a second only repeats
// the same states. The cloud list keeps three so the lifecycle indicators
// (working, needs input, complete) can be compared side by side.
const AGENT_SESSION_DEMO_ITEMS = AGENT_SESSION_ITEMS.slice(0, 1);

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
			return AGENT_SESSION_ATTACHED_ITEMS;
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
	const handleUnlink = useCallback((item: AgentSessionItem) => {
		setItems((current) => current.map((candidate) => (
			candidate.id === item.id
				? { ...candidate, prStatus: undefined, sessionDetails: { ...candidate.sessionDetails, pullRequestNumber: undefined, pullRequestTitle: undefined } }
				: candidate
		)));
	}, []);

	return (
		<div className="flex h-full min-h-[360px] w-full flex-col items-center justify-center gap-2 bg-surface p-6">
			<AgentSession
				capturedItemIds={capturedIds}
				className={variant === "large" ? (isLong ? "w-[520px]" : "w-[320px]") : "w-fit"}
				density={density}
				items={items}
				onContinueInAgent={handleCapture}
				onCreateWorkItem={handleCapture}
				onDeleteSession={handleRemove}
				onLinkWorkItem={handleLink}
				onRenameSession={handleRename}
				onSubtasks={handleCapture}
				onToggleVisibility={handleRemove}
				onUnlinkSession={handleUnlink}
				variant={variant}
			/>
		</div>
	);
}
