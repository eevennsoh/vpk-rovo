"use client";

import BoardIcon from "@atlaskit/icon/core/board";
import CrossIcon from "@atlaskit/icon/core/cross";
import EditIcon from "@atlaskit/icon/core/edit";
import LocationIcon from "@atlaskit/icon/core/location";
import PageIcon from "@atlaskit/icon/core/page";
import WorkItemIcon from "@atlaskit/icon/core/work-item";
import { token } from "@/lib/tokens";
import { Tag } from "@/components/ui/tag";
import type {
	ChatContextBarDescriptor,
	ChatContextBarIconName,
} from "../lib/chat-context-bar";

interface ChatContextBarProps {
	context: ChatContextBarDescriptor | null | undefined;
	onDismiss?: () => void;
}

const ICON_MAP: Record<ChatContextBarIconName, typeof BoardIcon> = {
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

	return (
		<div
			className="mb-3 flex min-w-0 items-center justify-between gap-3 rounded-xl bg-bg-neutral px-3 py-2"
			data-chat-context-bar
		>
			<div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
				<span className="flex size-4 shrink-0 items-center justify-center text-icon-subtle">
					<LeadIcon color={token("color.icon.subtle")} label="" size="small" />
				</span>
				<span className="shrink-0 text-sm font-medium text-text-subtle">
					{leadLabel}
				</span>
				<Tag
					color="blue"
					elemBefore={
						<ContextIcon color={token("color.icon.brand")} label="" size="small" />
					}
					className="min-w-0 max-w-full shrink overflow-hidden"
					maxWidth="100%"
					title={context.label}
				>
					{context.label}
				</Tag>
			</div>
			{onDismiss ? (
				<button
					aria-label={dismissLabel}
					className="flex size-6 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-icon-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none"
					onClick={onDismiss}
					type="button"
				>
					<CrossIcon color="currentColor" label="" size="small" />
				</button>
			) : (
				<span
					aria-hidden
					className="flex size-6 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-icon-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none"
				>
					<CrossIcon color="currentColor" label="" size="small" />
				</span>
			)}
		</div>
	);
}
