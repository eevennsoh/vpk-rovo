"use client";

import { useEffect, useState } from "react";

import { Shimmer } from "@/components/ui-custom/shimmer";
import TextEffects from "@/components/visual/text-effects";
import { configForEffect } from "@/components/visual/text-effects/data";
import { cn } from "@/lib/utils";

const STARTUP_INTRO_MS = 1800;
const STARTUP_CONTEXT_MS = 2200;
const INTRO_TEXT_CONFIG = {
	...configForEffect("mask-reveal-up", { autoLoop: false }),
	splitBy: "word",
} as const;
const SHIMMER_DURATION = 1.4;
const SHIMMER_SPREAD = 2;

export type JiraIssueAgentStartupPhase = "intro" | "gathering-context" | "working";

function getStartupPhase(startedAtMs: number | undefined): JiraIssueAgentStartupPhase {
	const elapsedMs = startedAtMs === undefined ? 0 : Math.max(0, Date.now() - startedAtMs);
	if (elapsedMs >= STARTUP_INTRO_MS + STARTUP_CONTEXT_MS) {
		return "working";
	}
	return elapsedMs >= STARTUP_INTRO_MS ? "gathering-context" : "intro";
}

export function useJiraIssueAgentStartupPhase(
	sequenceKey: string | null,
	shouldReduceMotion: boolean | null,
	startedAtMs?: number,
): JiraIssueAgentStartupPhase {
	const [state, setState] = useState<{
		key: string;
		phase: JiraIssueAgentStartupPhase;
	}>(() => ({
		key: sequenceKey ?? "",
		phase: sequenceKey ? getStartupPhase(startedAtMs) : "working",
	}));
	const currentPhase = sequenceKey ? getStartupPhase(startedAtMs) : "working";
	const phase: JiraIssueAgentStartupPhase = shouldReduceMotion ? "working"
		: sequenceKey === null ? "working"
			: state.key === sequenceKey ? state.phase : currentPhase;

	useEffect(() => {
		if (!sequenceKey || shouldReduceMotion) {
			return undefined;
		}

		const elapsedMs = startedAtMs === undefined ? 0 : Math.max(0, Date.now() - startedAtMs);
		const contextDelayMs = STARTUP_INTRO_MS - elapsedMs;
		const workingDelayMs = STARTUP_INTRO_MS + STARTUP_CONTEXT_MS - elapsedMs;
		const contextTimer = contextDelayMs > 0 ? window.setTimeout(() => {
			setState({ key: sequenceKey, phase: "gathering-context" });
		}, contextDelayMs) : undefined;
		const workingTimer = window.setTimeout(() => {
			setState({ key: sequenceKey, phase: "working" });
		}, Math.max(0, workingDelayMs));

		return () => {
			if (contextTimer !== undefined) {
				window.clearTimeout(contextTimer);
			}
			window.clearTimeout(workingTimer);
		};
	}, [sequenceKey, shouldReduceMotion, startedAtMs]);

	return phase;
}

export function JiraIssueAgentIntroLabel({ usesStrokeChrome }: Readonly<{ usesStrokeChrome: boolean }>) {
	return (
		<span
			className={cn(
				"flex min-w-0 flex-1 items-baseline gap-1 overflow-hidden text-text-subtlest",
				usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
			)}
		>
			<TextEffects
				className="min-w-0 truncate"
				config={INTRO_TEXT_CONFIG}
				presentation="inline"
				text="Let's get started"
			/>
			<span aria-hidden className="jira-agent-wave-motion shrink-0 motion-reduce:animate-none">
				👋
			</span>
		</span>
	);
}

export function JiraIssueShimmeringAgentLabel({
	label,
	usesStrokeChrome,
}: Readonly<{
	label: string;
	usesStrokeChrome: boolean;
}>) {
	return (
		<Shimmer
			as="span"
			className={cn(
				"block min-w-0 truncate",
				usesStrokeChrome ? "text-xs leading-4" : "text-sm leading-5",
			)}
			duration={SHIMMER_DURATION}
			spread={SHIMMER_SPREAD}
			wave={false}
		>
			{label}
		</Shimmer>
	);
}
