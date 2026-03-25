"use client";

import type { ComponentProps, ComponentType, ReactNode } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";

import { useControllableState } from "@/hooks/use-controllable-state";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MorphingRovo } from "@/components/ui-ai/morphing-rovo";
import { Shimmer } from "@/components/ui-ai/shimmer";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import NodeIcon from "@atlaskit/icon/core/node";
import { createContext, memo, use, useEffect, useMemo, useState } from "react";

interface ChainOfThoughtContextValue {
	isOpen: boolean;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
	null
);

const useChainOfThought = () => {
	const context = use(ChainOfThoughtContext);
	if (!context) {
		throw new Error(
			"ChainOfThought components must be used within ChainOfThought"
		);
	}
	return context;
};

export type ChainOfThoughtProps = Omit<
	ComponentProps<typeof Collapsible>,
	"onOpenChange" | "open" | "defaultOpen"
> & {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
};

export const ChainOfThought = memo(
	({
		className,
		open,
		defaultOpen = false,
		onOpenChange,
		children,
		...props
	}: ChainOfThoughtProps) => {
		const [isOpen, setIsOpen] = useControllableState({
			defaultProp: defaultOpen,
			onChange: onOpenChange,
			prop: open,
		});

		const chainOfThoughtContext = useMemo(() => ({ isOpen }), [isOpen]);

		return (
			<ChainOfThoughtContext.Provider value={chainOfThoughtContext}>
				<Collapsible
					className={cn(
						"not-prose w-full",
						className
					)}
					onOpenChange={setIsOpen}
					open={isOpen}
					{...props}
				>
					{children}
				</Collapsible>
			</ChainOfThoughtContext.Provider>
		);
	}
);

export type ChainOfThoughtHeaderProps = ComponentProps<
	typeof CollapsibleTrigger
> & {
	showChevron?: boolean;
	shimmer?: boolean;
};

export const ChainOfThoughtHeader = memo(
	({ className, children, showChevron = true, shimmer = false, ...props }: ChainOfThoughtHeaderProps) => {
		const { isOpen } = useChainOfThought();
		const text = children ?? "Chain of Thought";

		return (
			<CollapsibleTrigger
				className={cn(
					"flex w-full items-center gap-2 text-sm text-text-subtle transition-colors",
					showChevron && "hover:text-text",
					className
				)}
				disabled={!showChevron}
				{...props}
			>
				<MorphingRovo.Shape size={16} duration={0.8} blur={1.25} className="shrink-0" />
				{shimmer && typeof text === "string" ? (
					<Shimmer
						as="span"
						wave
						baseColor="var(--color-muted-foreground)"
						baseGradientColor={["#1868db", "#bf63f3", "#fca700"]}
						duration={1.4}
						spread={2}
						xDistance={0}
						yDistance={0}
						zDistance={0}
						scaleDistance={1}
						rotateYDistance={14}
						transition={{ ease: "easeInOut", repeatDelay: 0.1 }}
						className="text-left"
					>
						{text}
					</Shimmer>
				) : (
					<span className="text-left">
						{text}
					</span>
				)}
				{showChevron ? (
					<Icon
						render={<ChevronDownIcon label="" size="small" spacing="none" />}
						className={cn(
							"size-4 shrink-0 transition-transform",
							isOpen ? "rotate-0" : "-rotate-90"
						)}
					/>
				) : null}
			</CollapsibleTrigger>
		);
	}
);

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
	icon?: ComponentType<NewCoreIconProps>;
	label: ReactNode;
	description?: ReactNode;
	status?: "complete" | "active" | "pending";
	collapsible?: boolean;
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
};

const stepStatusStyles = {
	active: "text-text",
	complete: "text-text-subtle",
	pending: "text-text-subtlest",
};

export const ChainOfThoughtStep = memo(
	({
		className,
		icon: IconComponent = NodeIcon,
		label,
		description,
		status = "complete",
		collapsible = false,
		defaultOpen = true,
		open,
		onOpenChange,
		children,
		...props
	}: ChainOfThoughtStepProps) => {
		const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
		const isControlled = open !== undefined;
		const isOpen = isControlled ? open : uncontrolledOpen;
		const hasExpandableContent = collapsible && children != null;

		const handleOpenChange = (nextOpen: boolean) => {
			if (!isControlled) {
				setUncontrolledOpen(nextOpen);
			}
			onOpenChange?.(nextOpen);
		};

		useEffect(() => {
			if (!isControlled) {
				setUncontrolledOpen(defaultOpen);
			}
		}, [defaultOpen, isControlled]);

		const stepHeader = hasExpandableContent ? (
			<button
				type="button"
				className="group/step flex w-full items-start gap-2 text-left transition-colors hover:text-text"
				onClick={() => handleOpenChange(!isOpen)}
			>
				<span className="flex-1">{label}</span>
				<Icon
					render={<ChevronDownIcon label="" size="small" spacing="none" />}
					className={cn(
						"mt-0.5 size-4 shrink-0 transition-[transform,opacity] opacity-0 group-hover/step:opacity-100 group-focus-visible/step:opacity-100",
						isOpen ? "rotate-180" : "rotate-0"
					)}
				/>
			</button>
		) : (
			<div>{label}</div>
		);

		return (
			<div
				className={cn(
					"fade-in-0 slide-in-from-top-2 animate-in",
					"flex gap-2 text-sm",
					stepStatusStyles[status],
					className
				)}
				{...props}
			>
				<div className="relative mt-0.5">
					<Icon render={<IconComponent label="" size="small" spacing="none" />} className="size-4" />
					<div className="absolute top-7 bottom-0 left-1/2 -mx-px w-px bg-border" />
				</div>
				<div className="flex-1 space-y-2 overflow-hidden">
					{stepHeader}
					{description ? (
						<div className="text-text-subtle text-xs">{description}</div>
					) : null}
					{hasExpandableContent ? (
						<Collapsible onOpenChange={handleOpenChange} open={isOpen}>
							<CollapsibleContent
								className="space-y-2 overflow-hidden data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=open]:animate-in"
							>
								{children}
							</CollapsibleContent>
						</Collapsible>
					) : (
						children
					)}
				</div>
			</div>
		);
	}
);

export type ChainOfThoughtSearchResultsProps = ComponentProps<"div">;

export const ChainOfThoughtSearchResults = memo(
	({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
		<div
			className={cn("flex flex-wrap items-center gap-1.5", className)}
			{...props}
		/>
	)
);

export type ChainOfThoughtSearchResultProps = ComponentProps<typeof Badge>;

export const ChainOfThoughtSearchResult = memo(
	({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
		<Badge
			className={cn(
				"gap-1 border border-border bg-bg-neutral px-2 py-0.5 font-normal text-text-subtle text-xs hover:bg-bg-neutral-hovered",
				className
			)}
			variant="secondary"
			{...props}
		>
			{children}
		</Badge>
	)
);

export type ChainOfThoughtContentProps = ComponentProps<
	typeof CollapsibleContent
>;

export const ChainOfThoughtContent = memo(
	({ className, children, ...props }: ChainOfThoughtContentProps) => (
		<CollapsibleContent
			className={cn(
				"mt-2 space-y-3",
				"data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
				className
			)}
			{...props}
		>
			{children}
		</CollapsibleContent>
	)
);

export type ChainOfThoughtImageProps = ComponentProps<"div"> & {
	caption?: string;
};

export const ChainOfThoughtImage = memo(
	({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
		<div className={cn("mt-2 space-y-2", className)} {...props}>
			<div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-surface-raised p-3">
				{children}
			</div>
			{caption ? <p className="text-text-subtle text-xs">{caption}</p> : null}
		</div>
	)
);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtImage.displayName = "ChainOfThoughtImage";
