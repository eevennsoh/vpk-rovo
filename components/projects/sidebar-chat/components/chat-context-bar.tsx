"use client";

import BoardIcon from "@atlaskit/icon/core/board";
import EditIcon from "@atlaskit/icon/core/edit";
import LocationIcon from "@atlaskit/icon/core/location";
import PageIcon from "@atlaskit/icon/core/page";
import PersonIcon from "@atlaskit/icon/core/person";
import WorkItemIcon from "@atlaskit/icon/core/work-item";
import Image from "next/image";
import { token } from "@/lib/tokens";
import {
	CollapsibleContextBar,
	ContextBar,
	ContextBarLead,
	ContextBarTag,
} from "@/components/ui-custom/context-bar";
import type {
	ChatContextBarDescriptor,
	ChatContextBarIconName,
} from "../lib/chat-context-bar";

interface ChatContextBarProps {
	context: ChatContextBarDescriptor | null | undefined;
	onDismiss?: () => void;
}

const ICON_MAP: Record<ChatContextBarIconName, typeof BoardIcon> = {
	agent: PersonIcon,
	artifact: PageIcon,
	board: BoardIcon,
	"work-item": WorkItemIcon,
};

export default function ChatContextBar({
	context,
	onDismiss,
}: Readonly<ChatContextBarProps>): React.ReactElement | null {
	if (!context) {
		return null;
	}

	const ContextIcon = ICON_MAP[context.iconName];
	const isEditContext = context.variant === "edit";
	const LeadIcon = isEditContext ? EditIcon : LocationIcon;
	const leadLabel = isEditContext ? "Edit:" : "Context:";
	const dismissLabel = isEditContext ? "Close edit context" : "Close context";

	// Agents carry an avatar; everything else falls back to its category icon.
	const tagElemBefore = context.avatarSrc ? (
		<Image
			alt=""
			aria-hidden
			className="size-4 shrink-0 rounded-xs object-contain"
			height={16}
			src={context.avatarSrc}
			width={16}
		/>
	) : (
		<ContextIcon color={token("color.icon.brand")} label="" size="small" />
	);

	const tag = (
		<ContextBarTag color="blue" elemBefore={tagElemBefore} title={context.label}>
			{context.label}
		</ContextBarTag>
	);

	if (context.collapsible) {
		const collapsedLabel = context.collapsedLabel ?? "Edit";
		return (
			<CollapsibleContextBar
				collapsedIcon={<EditIcon color={token("color.icon.subtle")} label="" size="small" />}
				collapsedLabel={collapsedLabel}
				dismissLabel={dismissLabel}
				lead={<LeadIcon color={token("color.icon.subtle")} label="" size="small" />}
				leadLabel={leadLabel}
				triggerAriaLabel={`${collapsedLabel}: ${context.label}`}
			>
				{tag}
			</CollapsibleContextBar>
		);
	}

	return (
		<ContextBar data-chat-context-bar dismissLabel={dismissLabel} onDismiss={onDismiss}>
			<ContextBarLead icon={<LeadIcon color={token("color.icon.subtle")} label="" size="small" />}>
				{leadLabel}
			</ContextBarLead>
			{tag}
		</ContextBar>
	);
}
