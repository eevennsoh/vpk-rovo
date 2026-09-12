"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { useRovoChat } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import JiraWorkItemModal from "@/components/projects/jira/components/jira-work-item-modal";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import type { JiraWorkItemPreset } from "@/components/blocks/jira-work-item/data/session-state";
import { ExperimentalJiraWorkItem } from "@/components/blocks/jira-work-item/experimental/experimental-jira-work-item";
import { ExperimentalV2JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v2/experimental-v2-jira-work-item";
import { ExperimentalV3JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v3/experimental-v3-jira-work-item";
import { ExperimentalV4JiraWorkItem } from "@/components/blocks/jira-work-item/experimental-v4/experimental-v4-jira-work-item";

const ExperimentalV5JiraWorkItem = dynamic(
	() => import("@/components/blocks/jira-work-item/experimental-v5/experimental-v5-jira-work-item")
		.then((module) => module.ExperimentalV5JiraWorkItem),
);

const TeamEu26JiraWorkItem = dynamic(
	() => import("@/components/blocks/jira-work-item/team-eu26/team-eu26-jira-work-item")
		.then((module) => module.TeamEu26JiraWorkItem),
);

export type JiraWorkItemVariant = "default" | "experimental" | "experimental-v2" | "experimental-v3" | "experimental-v4" | "experimental-v5" | "team-eu26";
export type JiraWorkItemExperimentalPreset = JiraWorkItemPreset;

/**
 * Experimental surfaces keyed by variant. `experimental-v2` is a full fork of
 * the v1 tree, with each later version continuing as a full fork so the
 * variants can diverge independently while sharing the model under `data/`.
 */
const EXPERIMENTAL_SURFACES = {
	experimental: ExperimentalJiraWorkItem,
	"experimental-v2": ExperimentalV2JiraWorkItem,
	"experimental-v3": ExperimentalV3JiraWorkItem,
	"experimental-v4": ExperimentalV4JiraWorkItem,
	"experimental-v5": ExperimentalV5JiraWorkItem,
	"team-eu26": TeamEu26JiraWorkItem,
} as const;

type ExperimentalVariant = keyof typeof EXPERIMENTAL_SURFACES;

export interface JiraWorkItemProps {
	/** Opens the work item on initial render. Used by docs variant chooser entry points. */
	initialIssueOpen?: boolean;
	/** Called after the work item closes. */
	onIssueClose?: () => void;
	/** Opt-in layout variation. The default variant keeps the current Jira sessions surface. */
	variant?: JiraWorkItemVariant;
	/** Deterministic starting state for the experimental variants. */
	initialExperimentalPreset?: JiraWorkItemExperimentalPreset;
}

export function JiraWorkItem({
	initialIssueOpen = false,
	onIssueClose,
	variant = "default",
	initialExperimentalPreset = "filled",
}: Readonly<JiraWorkItemProps>) {
	return variant === "default" ? (
		<JiraWorkItemDefaultView initialIssueOpen={initialIssueOpen} onIssueClose={onIssueClose} />
	) : (
		<JiraWorkItemExperimentalView
			initialIssueOpen={initialIssueOpen}
			onIssueClose={onIssueClose}
			initialExperimentalPreset={initialExperimentalPreset}
			surface={variant}
		/>
	);
}

/** Shared open/close shell: the centered "Open work item" launcher container. */
function JiraWorkItemShell({ onOpen, children }: Readonly<{ onOpen: () => void; children: ReactNode }>) {
	return (
		<div className="flex h-full min-h-[400px] items-center justify-center p-4">
			<Button type="button" onClick={onOpen}>
				Open work item
			</Button>
			{children}
		</div>
	);
}

function JiraWorkItemDefaultView({
	initialIssueOpen,
	onIssueClose,
}: Readonly<{
	initialIssueOpen: boolean;
	onIssueClose?: () => void;
}>) {
	const [isIssueOpen, setIsIssueOpen] = useState(initialIssueOpen);
	const { chatSurface } = useRovoChat();

	function handleIssueClose() {
		setIsIssueOpen(false);
		onIssueClose?.();
	}

	return (
		<JiraWorkItemShell onOpen={() => setIsIssueOpen(true)}>
			<JiraWorkItemModal isOpen={isIssueOpen} onClose={handleIssueClose} />
			{isIssueOpen && chatSurface === null ? (
				<FloatingRovoButton ariaLabel="Open Rovo chat" product="jira" />
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>
		</JiraWorkItemShell>
	);
}

function JiraWorkItemExperimentalView({
	initialIssueOpen,
	onIssueClose,
	initialExperimentalPreset,
	surface,
}: Readonly<{
	initialIssueOpen: boolean;
	onIssueClose?: () => void;
	initialExperimentalPreset: JiraWorkItemExperimentalPreset;
	surface: ExperimentalVariant;
}>) {
	const [isIssueOpen, setIsIssueOpen] = useState(initialIssueOpen);
	const ExperimentalSurface = EXPERIMENTAL_SURFACES[surface];

	function handleIssueClose() {
		setIsIssueOpen(false);
		onIssueClose?.();
	}

	return (
		<JiraWorkItemShell onOpen={() => setIsIssueOpen(true)}>
			<ExperimentalSurface
				open={isIssueOpen}
				onClose={handleIssueClose}
				initialPreset={initialExperimentalPreset}
			/>
		</JiraWorkItemShell>
	);
}

export default JiraWorkItem;
