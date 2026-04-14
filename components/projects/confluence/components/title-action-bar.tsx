"use client";

import React from "react";
import { token } from "@/lib/tokens";

import { Button } from "@/components/ui/button";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import GrowHorizontalIcon from "@atlaskit/icon/core/grow-horizontal";
import ImageIcon from "@atlaskit/icon/core/image";
import MicrophoneIcon from "@atlaskit/icon/core/microphone";
import RovoIcon from "@atlaskit/icon-lab/core/rovo";
import TaskToDoIcon from "@atlaskit/icon/core/task-to-do";
import TextDensityCompressIcon from "@atlaskit/icon-lab/core/text-density-compress";

interface TitleActionBarProps {
	isVisible: boolean;
}

export default function TitleActionBar({ isVisible }: Readonly<TitleActionBarProps>) {
	return (
		<div
			style={{
				height: "32px",
				display: "flex",
				alignItems: "center",
				marginLeft: token("space.negative.050"),
				opacity: isVisible ? 1 : 0,
				visibility: isVisible ? "visible" : "hidden",
				transition: "opacity 0.2s ease, visibility 0.2s ease",
				overflow: "visible",
			}}
		>
			<div className="flex items-center">
				{/* Alignment dropdown */}
				<Button aria-label="Alignment options" className="gap-2" size="sm" variant="ghost">
					<AlignTextLeftIcon label="" size="small" />
					<ChevronDownIcon label="" size="small" />
				</Button>

				{/* Remove emoji button */}
				<Button className="gap-2" size="sm" variant="ghost">
					<CrossIcon label="" size="small" />
					Remove emoji
				</Button>

				{/* Status button */}
				<Button className="gap-2" size="sm" variant="ghost">
					<TaskToDoIcon label="" size="small" />
					Status
				</Button>

				{/* Header image button */}
				<Button className="gap-2" size="sm" variant="ghost">
					<ImageIcon label="" size="small" />
					Header image
				</Button>

				{/* Suggest title button */}
				<Button className="gap-2" size="sm" variant="ghost">
					<RovoIcon label="" size="small" />
					Suggest title
				</Button>

				{/* Text density button */}
				<Button aria-label="Text density" size="icon-sm" variant="ghost">
					<TextDensityCompressIcon label="" size="small" />
				</Button>

				{/* Width dropdown */}
				<Button aria-label="Width options" className="gap-2" size="sm" variant="ghost">
					<GrowHorizontalIcon label="" size="small" />
					<ChevronDownIcon label="" size="small" />
				</Button>

				{/* Voice typing button */}
				<Button className="gap-2" size="sm" variant="ghost">
					<MicrophoneIcon label="" size="small" />
					Voice typing
				</Button>
			</div>
		</div>
	);
}
