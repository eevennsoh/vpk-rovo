"use client";

import type { ComponentProps } from "react";

import DragHandleVerticalIcon from "@atlaskit/icon/core/drag-handle-vertical";
import StrokeWeightLargeIcon from "@atlaskit/icon/core/stroke-weight-large";
import { motion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	ChevronDownIcon,
	PaperclipIcon,
} from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";

export interface QueueMessagePart {
	type: string;
	text?: string;
	url?: string;
	filename?: string;
	mediaType?: string;
}

export interface QueueMessage {
	id: string;
	parts: QueueMessagePart[];
}

export interface QueueTodo {
	id: string;
	title: string;
	description?: string;
	status?: "pending" | "completed";
}

const queueDragHandleVariants: Variants = {
	rest: {
		marginRight: -8,
		opacity: 0,
		transform: "translateX(-4px) scale(0.92)",
		width: 0,
		transition: { duration: 0.12, ease: [0.2, 0, 0, 1] },
	},
	hover: {
		marginRight: 0,
		opacity: 1,
		transform: "translateX(0px) scale(1)",
		width: 12,
		transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
	},
};

const queueDescriptionVariants: Variants = {
	rest: {
		marginLeft: 20,
		transition: { duration: 0.12, ease: [0.2, 0, 0, 1] },
	},
	hover: {
		marginLeft: 40,
		transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 },
	},
};

export type QueueItemProps = ComponentProps<typeof motion.li>;

export const QueueItem = ({ className, ...props }: QueueItemProps) => (
	<motion.li
		animate="rest"
		className={cn("group flex h-8 flex-col justify-center gap-1 rounded-2xl pl-3 pr-0.5 text-sm transition-colors hover:bg-muted", className)}
		initial="rest"
		whileHover="hover"
		{...props}
	/>
);

export type QueueItemDragHandleProps = ComponentProps<typeof motion.span>;

export const QueueItemDragHandle = ({ className, style, ...props }: QueueItemDragHandleProps) => (
	<motion.span
		aria-hidden
		className={cn("inline-flex shrink-0 cursor-grab items-center justify-center overflow-hidden text-icon-subtlest active:cursor-grabbing [&_svg]:text-icon-subtlest", className)}
		style={{ willChange: "width, margin-right, transform, opacity", ...style }}
		variants={queueDragHandleVariants}
		{...props}
	>
		<Icon aria-hidden render={<DragHandleVerticalIcon label="" size="small" />} />
	</motion.span>
);

export type QueueItemIndicatorProps = ComponentProps<"span"> & {
	completed?: boolean;
};

export const QueueItemIndicator = ({ completed = false, className, ...props }: QueueItemIndicatorProps) => (
	<Icon
		aria-hidden
		className={cn("mt-0.5 shrink-0", completed ? "text-icon-disabled" : "text-icon-subtle", className)}
		render={<StrokeWeightLargeIcon label="" size="small" />}
		{...props}
	/>
);

export type QueueItemContentProps = ComponentProps<"span"> & {
	completed?: boolean;
};

export const QueueItemContent = ({ completed = false, className, ...props }: QueueItemContentProps) => (
	<span className={cn("line-clamp-1 grow break-words", completed ? "text-muted-foreground/50 line-through" : "text-muted-foreground", className)} {...props} />
);

export type QueueItemDescriptionProps = ComponentProps<typeof motion.div> & {
	completed?: boolean;
};

export const QueueItemDescription = ({ completed = false, className, ...props }: QueueItemDescriptionProps) => (
	<motion.div
		className={cn("text-xs", completed ? "text-muted-foreground/40 line-through" : "text-muted-foreground", className)}
		variants={queueDescriptionVariants}
		{...props}
	/>
);

export type QueueItemActionsProps = ComponentProps<"div">;

export const QueueItemActions = ({ className, ...props }: QueueItemActionsProps) => <div className={cn("flex gap-0", className)} {...props} />;

export type QueueItemActionProps = Omit<ComponentProps<typeof Button>, "variant" | "size" | "shape">;

export const QueueItemAction = ({ className, ...props }: QueueItemActionProps) => (
	<Button
		className={cn("text-icon-subtlest opacity-0 transition-opacity duration-normal group-hover:opacity-100 [&_svg]:text-icon-subtlest", className)}
		shape="circle"
		size="icon-xs"
		type="button"
		variant="ghost"
		{...props}
	/>
);

export type QueueItemAttachmentProps = ComponentProps<"div">;

export const QueueItemAttachment = ({ className, ...props }: QueueItemAttachmentProps) => <div className={cn("mt-1 flex flex-wrap gap-2", className)} {...props} />;

export type QueueItemImageProps = ComponentProps<"img">;

export const QueueItemImage = ({ className, ...props }: QueueItemImageProps) => <img alt="" className={cn("h-8 w-8 rounded border object-cover", className)} height={32} width={32} {...props} />;

export type QueueItemFileProps = ComponentProps<"span">;

export const QueueItemFile = ({ children, className, ...props }: QueueItemFileProps) => (
	<span className={cn("flex items-center gap-1 rounded border bg-muted px-2 py-1 text-xs", className)} {...props}>
		<PaperclipIcon size={12} />
		<span className="max-w-[100px] truncate">{children}</span>
	</span>
);

export type QueueListProps = ComponentProps<typeof ScrollArea>;

export const QueueList = ({ children, className, ...props }: QueueListProps) => (
	<ScrollArea className={cn("mt-2 -mb-1", className)} {...props}>
		<div className="max-h-40 pr-4">
			<ul>{children}</ul>
		</div>
	</ScrollArea>
);

// QueueSection - collapsible section container
export type QueueSectionProps = ComponentProps<typeof Collapsible>;

export const QueueSection = ({ className, defaultOpen = true, ...props }: QueueSectionProps) => <Collapsible className={cn(className)} defaultOpen={defaultOpen} {...props} />;

// QueueSectionTrigger - section header/trigger
export type QueueSectionTriggerProps = ComponentProps<"button">;

export const QueueSectionTrigger = ({ children, className, ...props }: QueueSectionTriggerProps) => (
	<CollapsibleTrigger
		render={
			<button
				className={cn(
					"group flex w-full items-center justify-between rounded-2xl bg-muted/40 px-3 py-2 text-left font-medium text-muted-foreground text-sm transition-colors hover:bg-muted",
					className,
				)}
				type="button"
				{...props}
			/>
		}
	>
		{children}
	</CollapsibleTrigger>
);

// QueueSectionLabel - label content with icon and count
export type QueueSectionLabelProps = ComponentProps<"span"> & {
	count?: number;
	label: string;
	icon?: React.ReactNode;
};

export const QueueSectionLabel = ({ count, label, icon, className, ...props }: QueueSectionLabelProps) => (
	<span className={cn("flex items-center gap-2", className)} {...props}>
		<ChevronDownIcon className="size-3 transition-transform group-data-[state=closed]:-rotate-90" size={12} />
		{icon}
		<span>
			{count} {label}
		</span>
	</span>
);

// QueueSectionContent - collapsible content area
export type QueueSectionContentProps = ComponentProps<typeof CollapsibleContent>;

export const QueueSectionContent = ({ className, ...props }: QueueSectionContentProps) => <CollapsibleContent className={cn(className)} {...props} />;

export type QueueProps = ComponentProps<"div">;

export const Queue = ({ className, ...props }: QueueProps) => (
	<div className={cn("flex flex-col gap-2 rounded-2xl border border-border bg-background px-3 pt-2 pb-0 shadow-xs", className)} {...props} />
);
