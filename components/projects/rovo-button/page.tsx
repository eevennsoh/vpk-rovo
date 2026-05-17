"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import AppLayout from "@/components/projects/page";
import FloatingRovoButton, {
	type FloatingRovoButtonOnboardingConfig,
	type FloatingRovoButtonOnboardingStatus,
	type FloatingRovoButtonPlacement,
	type FloatingRovoButtonSuggestion,
} from "@/components/projects/shared/components/floating-rovo-button";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import { useRovoChat } from "@/app/contexts";

const RFP_DRAFTER_AVATAR_SRC = "/avatar-agent/teamwork-agents/blocker-checker.svg";
const CHAT_BUTTON_PLACEMENT = { right: "176px", bottom: "32px" } satisfies FloatingRovoButtonPlacement;
const SUGGESTION_BUTTON_PLACEMENT = { right: "328px", bottom: "32px" } satisfies FloatingRovoButtonPlacement;
const ONBOARDING_BUTTON_PLACEMENT = { right: "24px", bottom: "32px" } satisfies FloatingRovoButtonPlacement;

type DemoSuggestionState = "hidden" | "visible" | "accepted";

function getDemoPrimaryActionLabel(status: FloatingRovoButtonOnboardingStatus): string {
	if (status === "creating") {
		return "Creating";
	}

	if (status === "created") {
		return "Created";
	}

	return "Create";
}

function getDemoStatusLabel(status: FloatingRovoButtonOnboardingStatus): string | undefined {
	if (status === "creating") {
		return "Creating...";
	}

	if (status === "created") {
		return "Created";
	}

	return undefined;
}

function RovoButtonDemoCaption({
	detail,
	placement,
	title,
}: Readonly<{
	detail: string;
	placement: FloatingRovoButtonPlacement;
	title: string;
}>) {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed z-[500] flex w-28 flex-col items-end gap-0.5 text-right"
			style={{
				right: placement.right,
				bottom: `calc(${placement.bottom ?? "32px"} + 60px)`,
			}}
		>
			<span className="rounded bg-surface-raised px-2 py-0.5 text-xs leading-4 font-semibold text-text">
				{title}
			</span>
			<span className="max-w-full rounded bg-surface-raised px-2 py-0.5 text-[11px] leading-4 text-text-subtle">
				{detail}
			</span>
		</div>
	);
}

interface RovoButtonProjectPageProps {
	embedded?: boolean;
}

export default function RovoButtonProjectPage({
	embedded = false,
}: Readonly<RovoButtonProjectPageProps>) {
	const { chatSurface } = useRovoChat();
	const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
	const [demoOnboardingStatus, setDemoOnboardingStatus] =
		useState<FloatingRovoButtonOnboardingStatus>("idle");
	const [demoSuggestionState, setDemoSuggestionState] = useState<DemoSuggestionState>("hidden");
	const [demoSuggestionRun, setDemoSuggestionRun] = useState(0);

	useEffect(() => {
		if (demoOnboardingStatus !== "creating") {
			return;
		}

		const completionTimer = window.setTimeout(() => setDemoOnboardingStatus("created"), 900);
		return () => window.clearTimeout(completionTimer);
	}, [demoOnboardingStatus]);

	const handleOnboardingOpenChange = useCallback((open: boolean) => {
		setIsOnboardingOpen(open);
		if (open) {
			setDemoOnboardingStatus("idle");
			setDemoSuggestionState("hidden");
		}
	}, []);

	const handleOnboardingPrimaryAction = useCallback(() => {
		setDemoOnboardingStatus("creating");
	}, []);

	const handleOnboardingSecondaryAction = useCallback(() => {
		setDemoOnboardingStatus("idle");
	}, []);

	const handleSuggestionButtonClick = useCallback(() => {
		setIsOnboardingOpen(false);
		setDemoSuggestionRun((currentRun) => currentRun + 1);
		setDemoSuggestionState("visible");
	}, []);

	const handleSuggestionSelect = useCallback(() => {
		setDemoSuggestionState("accepted");
	}, []);

	const handleSuggestionDismiss = useCallback(() => {
		setDemoSuggestionState("hidden");
	}, []);

	const suggestion = useMemo<FloatingRovoButtonSuggestion | null>(() => {
		if (demoSuggestionState === "hidden") {
			return null;
		}

		return {
			id: `rovo-button-proactive-suggestion-demo-${demoSuggestionRun}-${demoSuggestionState}`,
			label: demoSuggestionState === "accepted" ? "Suggestion accepted" : "Summarize RFP requirements",
			ariaLabel: demoSuggestionState === "accepted"
				? "Proactive suggestion accepted"
				: "Accept proactive suggestion",
			onSelect: handleSuggestionSelect,
			onDismiss: handleSuggestionDismiss,
		};
	}, [
		demoSuggestionRun,
		demoSuggestionState,
		handleSuggestionDismiss,
		handleSuggestionSelect,
	]);

	const onboarding = useMemo<FloatingRovoButtonOnboardingConfig>(() => ({
		id: "rovo-button-rfp-drafter-onboarding-demo",
		title: "Create a new agent",
		agentName: "RFP Drafter",
		byline: "By you",
		description: "Proactively assists by automatically suggesting subtasks when you start adding one and providing comment summaries.",
		prompt: "Repeating RFP review manually every time? We can automate it.",
		primaryActionLabel: getDemoPrimaryActionLabel(demoOnboardingStatus),
		secondaryActionLabel: "Not now",
		avatarSrc: RFP_DRAFTER_AVATAR_SRC,
		coverSrc: RFP_DRAFTER_AVATAR_SRC,
		avatarAlt: "",
		closeLabel: "Dismiss create agent preview",
		status: demoOnboardingStatus,
		statusLabel: getDemoStatusLabel(demoOnboardingStatus),
		primaryActionDisabled: demoOnboardingStatus !== "idle",
		open: isOnboardingOpen,
		openOnButtonClick: true,
		onOpenChange: handleOnboardingOpenChange,
		onPrimaryAction: handleOnboardingPrimaryAction,
		onSecondaryAction: handleOnboardingSecondaryAction,
	}), [
		demoOnboardingStatus,
		handleOnboardingOpenChange,
		handleOnboardingPrimaryAction,
		handleOnboardingSecondaryAction,
		isOnboardingOpen,
	]);

	return (
		<AppLayout product="home" embedded={embedded} hideFloatingRovo>
			<div className="relative h-full w-full">
				<RovoButtonDemoCaption
					detail="opens chat"
					placement={CHAT_BUTTON_PLACEMENT}
					title="Chat"
				/>
				<RovoButtonDemoCaption
					detail="shows nudge"
					placement={SUGGESTION_BUTTON_PLACEMENT}
					title="Proactive"
				/>
				<RovoButtonDemoCaption
					detail="opens panel"
					placement={ONBOARDING_BUTTON_PLACEMENT}
					title="Onboarding"
				/>
				{chatSurface === null ? (
					<FloatingRovoButton
						ariaLabel="Open Rovo chat demo"
						placement={CHAT_BUTTON_PLACEMENT}
						product="home"
					/>
				) : null}
				<FloatingRovoButton
					ariaLabel="Show proactive suggestion demo"
					forceVisible
					onButtonClick={handleSuggestionButtonClick}
					placement={SUGGESTION_BUTTON_PLACEMENT}
					product="home"
					suggestion={suggestion}
				/>
				<FloatingRovoButton
					ariaLabel="Open onboarding demo"
					forceVisible
					onboarding={onboarding}
					placement={ONBOARDING_BUTTON_PLACEMENT}
					product="home"
				/>
				<AnimatePresence>
					{chatSurface === "floating" ? <RovoFloatingChat key="floating-chat" /> : null}
				</AnimatePresence>
			</div>
		</AppLayout>
	);
}
