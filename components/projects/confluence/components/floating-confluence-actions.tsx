"use client";

import React from "react";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { useRovoChat } from "@/app/contexts";
import AiGenerativeAudioBriefingIcon from "@atlaskit/icon/core/audio";
import CommentIcon from "@atlaskit/icon/core/comment";
import InformationCircleIcon from "@atlaskit/icon/core/information-circle";
import VideoIcon from "@atlaskit/icon/core/video";

interface FloatingConfluenceActionsProps {
	embedded?: boolean;
}

export default function FloatingConfluenceActions({
	embedded = false,
}: Readonly<FloatingConfluenceActionsProps>) {
	const { isOpen } = useRovoChat();

	return (
		<div
			style={{
				position: embedded ? "absolute" : "fixed",
				bottom: isOpen ? "24px" : "80px", // 24px when chat is open, otherwise 80px (24px + 48px button + 8px gap)
				right: isOpen ? "424px" : "24px", // Move left by 400px (chat panel width) when open
				width: "48px",
				backgroundColor: token("elevation.surface.raised"),
				borderRadius: token("radius.xlarge"),
				display: "flex",
				flexDirection: "column",
				gap: token("space.100"), // 8px
				padding: token("space.100"), // 8px
				zIndex: 500,
				boxShadow: token("elevation.shadow.raised"),
				transition: "bottom var(--duration-normal) var(--ease-in-out), right var(--duration-normal) var(--ease-in-out)",
			}}
		>
			<Button aria-label="Comment" size="icon" variant="ghost">
				<CommentIcon label="" />
			</Button>
			<Button aria-label="Information" size="icon" variant="ghost">
				<InformationCircleIcon label="" />
			</Button>
			<Button aria-label="Audio briefing" size="icon" variant="ghost">
				<AiGenerativeAudioBriefingIcon label="" />
			</Button>
			<Button aria-label="Video" size="icon" variant="ghost">
				<VideoIcon label="" />
			</Button>
		</div>
	);
}
