"use client";

import { Fragment, useCallback, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import AppLayout from "@/components/projects/page";
import FloatingRovoButton, {
	type FloatingRovoButtonPositioning,
} from "@/components/projects/shared/components/floating-rovo-button";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import { useRovoChatControls } from "@/app/contexts";
import RovoButtonDemoCaption from "./components/rovo-button-demo-caption";
import {
	CHAT_BUTTON_PLACEMENT,
	INSIGHTS_BUTTON_PLACEMENT,
	ONBOARDING_BUTTON_PLACEMENT,
	SUGGESTION_BUTTON_PLACEMENT,
	TOOLBAR_BUTTON_PLACEMENT,
} from "./data/rovo-button-demo-placements";
import { useRovoButtonDemoInsights } from "./hooks/use-rovo-button-demo-insights";
import { useRovoButtonDemoLiveChat } from "./hooks/use-rovo-button-demo-live-chat";
import { useRovoButtonDemoOnboarding } from "./hooks/use-rovo-button-demo-onboarding";
import { useRovoButtonDemoSuggestion } from "./hooks/use-rovo-button-demo-suggestion";
import type { RovoButtonDemoVariant } from "./types";

interface RovoButtonProjectPageProps {
	embedded?: boolean;
	embeddedHeight?: "parent" | "viewport";
}

export default function RovoButtonProjectPage({
	embedded = false,
	embeddedHeight = "viewport",
}: Readonly<RovoButtonProjectPageProps>) {
	const { chatSurface } = useRovoChatControls();
	const liveChat = useRovoButtonDemoLiveChat();
	const insights = useRovoButtonDemoInsights();
	const { suggestion, show: showSuggestion, hide: hideSuggestion } = useRovoButtonDemoSuggestion();
	const { config: onboarding, close: closeOnboarding } = useRovoButtonDemoOnboarding({
		onOpened: hideSuggestion,
	});
	const positioning: FloatingRovoButtonPositioning = embedded ? "container" : "viewport";

	// Onboarding and the nudge morph the same kind of surface, so showing one
	// stands the other down.
	const handleSuggestionButtonClick = useCallback(() => {
		closeOnboarding();
		showSuggestion();
	}, [closeOnboarding, showSuggestion]);

	const variants = useMemo<readonly RovoButtonDemoVariant[]>(() => [
		{
			id: "toolbar",
			title: "Toolbar",
			detail: "persistent bar",
			placement: TOOLBAR_BUTTON_PLACEMENT,
			captionLiftPx: 188,
			render: (context) => (
				<FloatingRovoButton
					{...context}
					ariaLabel="Open Rovo chat demo with persistent toolbar"
					forceVisible
					onButtonClick={liveChat.open}
					persistentBar={liveChat.persistentBar}
					product="home"
				/>
			),
		},
		{
			id: "proactive",
			title: "Proactive",
			detail: "shows nudge",
			placement: SUGGESTION_BUTTON_PLACEMENT,
			render: (context) => (
				<FloatingRovoButton
					{...context}
					ariaLabel="Show proactive suggestion demo"
					forceVisible
					onButtonClick={handleSuggestionButtonClick}
					product="home"
					suggestion={suggestion}
				/>
			),
		},
		{
			id: "insights",
			title: "Insights",
			detail: "daily digest",
			placement: INSIGHTS_BUTTON_PLACEMENT,
			render: (context) => (
				<FloatingRovoButton
					{...context}
					ariaLabel="Open daily insights demo"
					forceVisible
					insights={insights}
					product="home"
				/>
			),
		},
		{
			id: "chat",
			title: "Chat",
			detail: "opens chat",
			placement: CHAT_BUTTON_PLACEMENT,
			// The floating chat replaces this button while it is open.
			render: (context) => chatSurface === null ? (
				<FloatingRovoButton {...context} ariaLabel="Open Rovo chat demo" forceVisible product="home" />
			) : null,
		},
		{
			id: "onboarding",
			title: "Onboarding",
			detail: "opens panel",
			placement: ONBOARDING_BUTTON_PLACEMENT,
			render: (context) => (
				<FloatingRovoButton
					{...context}
					ariaLabel="Open onboarding demo"
					forceVisible
					onboarding={onboarding}
					product="home"
				/>
			),
		},
	], [chatSurface, handleSuggestionButtonClick, insights, liveChat, onboarding, suggestion]);

	return (
		<AppLayout product="home" embedded={embedded} embeddedHeight={embeddedHeight} hideFloatingRovo>
			<div className="relative h-full w-full">
				{variants.map((variant) => (
					<Fragment key={variant.id}>
						<RovoButtonDemoCaption
							detail={variant.detail}
							liftPx={variant.captionLiftPx}
							placement={variant.placement}
							positioning={positioning}
							title={variant.title}
						/>
						{variant.render({ placement: variant.placement, positioning })}
					</Fragment>
				))}
				<AnimatePresence>
					{chatSurface === "floating" ? (
						<RovoFloatingChat key="floating-chat" startRealtimeVoiceRequestKey={liveChat.requestKey} />
					) : null}
				</AnimatePresence>
			</div>
		</AppLayout>
	);
}
