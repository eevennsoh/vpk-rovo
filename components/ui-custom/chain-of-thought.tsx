"use client";

import type { ComponentProps, ComponentType, ReactNode } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";

import { useControllableState } from "@/hooks/use-controllable-state";
import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { MorphingRovo } from "@/components/ui-custom/morphing-rovo";
import RovoIconGlyph from "@atlaskit/icon-lab/core/rovo";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import NodeIcon from "@atlaskit/icon/core/node";
import { createContext, memo, use, useEffect, useMemo, useState } from "react";

import { getDefaultThinkingLabel, getPreloadShimmerLabel, getReasoningCompletedLabel } from "@/components/projects/shared/lib/reasoning-labels";
import { token } from "@/lib/tokens";

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
	state?: "preload" | "thinking" | "completed";
	duration?: number;
};

function CyclingByline({ children, cycle }: Readonly<{ children: ReactNode; cycle?: boolean }>) {
	const key = typeof children === "string" ? children : undefined;

	return (
		<span className="block min-h-4 overflow-hidden text-xs leading-4 text-text-subtle">
			<span
				key={key}
				className={cn(
					"block truncate",
					cycle && "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-medium",
				)}
			>
				{children}
			</span>
		</span>
	);
}

function stripTrailingDots(label: string): string {
	return label.replace(/\s*\.+$/, "");
}

export const ChainOfThoughtHeader = memo(
	({
		className,
		children,
		showChevron = true,
		shimmer = false,
		state,
		duration,
		...props
	}: ChainOfThoughtHeaderProps) => {
		const { isOpen } = useChainOfThought();
		const resolvedState = state ?? (shimmer ? "preload" : undefined);
		const text = children ?? (
			resolvedState === "preload"
				? getPreloadShimmerLabel()
				: resolvedState === "thinking"
					? getDefaultThinkingLabel()
					: resolvedState === "completed"
						? getReasoningCompletedLabel(duration)
						: "Chain of Thought"
		);
		const isCompleted = resolvedState == "completed";
		const shouldShimmerLabel =
			typeof text === "string" &&
			resolvedState !== "completed" &&
			(shimmer || resolvedState === "preload" || resolvedState === "thinking");
		const shouldShowAnimatedDots =
			resolvedState === "preload" || resolvedState === "thinking";
		const renderedText =
			shouldShowAnimatedDots && typeof text === "string"
				? stripTrailingDots(text)
				: text;

		return (
			<CollapsibleTrigger
				className={cn(
					"flex w-full items-start gap-2 text-sm text-text-subtle transition-colors",
					showChevron && "hover:text-text",
					className
				)}
				disabled={!showChevron}
				{...props}
			>
				{isCompleted ? (
					<span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center">
						<RovoIconGlyph
							color={token("color.icon.subtlest")}
							label=""
							size="small"
						/>
					</span>
				) : (
					<MorphingRovo.Shape size={16} duration={0.8} blur={1.25} className="mt-0.5 shrink-0" />
				)}
				<span className="grid min-w-0 flex-1 gap-0.5 text-left">
					<span className="flex min-w-0 items-center gap-1.5">
						<span className="inline-flex min-w-0 items-baseline">
							{shouldShimmerLabel && typeof renderedText === "string" ? (
								<Shimmer
									as="span"
									duration={1.4}
									spread={2}
									className="min-w-0 truncate text-left"
								>
									{renderedText}
								</Shimmer>
							) : (
								<span className="min-w-0 truncate text-left">{renderedText}</span>
							)}
							{shouldShowAnimatedDots ? <AnimatedDots /> : null}
						</span>
						{showChevron ? (
							<Icon
								render={<ChevronDownIcon label="" size="small" spacing="none" />}
								className={cn(
									"size-4 shrink-0 transition-transform",
									isOpen ? "rotate-0" : "-rotate-90"
								)}
							/>
						) : null}
					</span>
				</span>
			</CollapsibleTrigger>
		);
	}
);

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
	icon?: ComponentType<NewCoreIconProps>;
	iconRender?: ReactNode;
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

function getDefaultStepDescription(
	status: NonNullable<ChainOfThoughtStepProps["status"]>,
): ReactNode {
	if (status === "active") {
		return "In progress";
	}
	if (status === "pending") {
		return "Queued";
	}
	return "Complete";
}

function ChainOfThoughtIconSlot({
	children,
	shimmer,
}: Readonly<{
	children: ReactNode;
	shimmer: boolean;
}>): ReactNode {
	return (
		<span
			data-cot-icon-slot={shimmer ? "active" : undefined}
			className={cn(
				"inline-flex size-4 shrink-0 items-center justify-center",
				shimmer && "relative text-muted-foreground",
			)}
		>
			{children}
			{shimmer ? (
				<span
					aria-hidden="true"
					className="cot-icon-wash pointer-events-none absolute inset-0 inline-flex items-center justify-center motion-safe:animate-cot-icon-shimmer motion-reduce:hidden"
				>
					{children}
				</span>
			) : null}
		</span>
	);
}

export const ChainOfThoughtStep = memo(
	({
		className,
		icon: IconComponent = NodeIcon,
		iconRender,
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
		const shouldShowDescription = description !== null;
		const resolvedDescription =
			description === undefined ? getDefaultStepDescription(status) : description;
		const iconNode = iconRender ?? <Icon render={<IconComponent label="" size="small" spacing="none" />} className="size-4" />;

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
				className="group/step flex w-full items-start text-left transition-colors hover:text-text"
				onClick={() => handleOpenChange(!isOpen)}
			>
				<span className="grid min-w-0 flex-1 gap-0.5">
					<span className="inline-flex min-w-0 items-start gap-1.5">
						<span className="min-w-0 truncate">{label}</span>
						<Icon
							render={<ChevronDownIcon label="" size="small" spacing="none" />}
							className={cn(
								"mt-0.5 size-4 shrink-0 transition-[transform,opacity] duration-medium ease-out opacity-0 group-hover/step:opacity-100 group-focus-visible/step:opacity-100",
								isOpen ? "rotate-0" : "-rotate-90"
							)}
						/>
					</span>
					{shouldShowDescription ? <CyclingByline>{resolvedDescription}</CyclingByline> : null}
				</span>
			</button>
		) : (
			<div className="grid min-w-0 gap-0.5">
				<span className="min-w-0 truncate">{label}</span>
				{shouldShowDescription ? <CyclingByline>{resolvedDescription}</CyclingByline> : null}
			</div>
		);

		return (
			<div
				className={cn(
					"group/cot-step fade-in-0 slide-in-from-top-2 animate-in",
					"flex gap-2 text-sm",
					stepStatusStyles[status],
					className
				)}
				{...props}
			>
				<div className="relative mt-0.5">
					<ChainOfThoughtIconSlot shimmer={status === "active"}>
						{iconNode}
					</ChainOfThoughtIconSlot>
					<div
						className={cn(
							"absolute top-5 left-1/2 -mx-px w-px bg-border",
							hasExpandableContent && isOpen
								? "-bottom-3"
								: "-bottom-3 group-last/cot-step:hidden"
						)}
					/>
				</div>
				<div className="flex-1 space-y-2 overflow-hidden">
					{stepHeader}
					{hasExpandableContent ? (
						<Collapsible onOpenChange={handleOpenChange} open={isOpen}>
							<CollapsibleContent
								className="space-y-2 overflow-hidden h-(--collapsible-panel-height) transition-[height,opacity] ease-out duration-medium data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0"
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

export type ChainOfThoughtSearchResultProps = LozengeProps;

export const ChainOfThoughtSearchResult = memo(
	({ className, children, ...props }: ChainOfThoughtSearchResultProps) => (
		<Lozenge
			className={cn("max-w-none", className)}
			variant="neutral"
			{...props}
		>
			{children}
		</Lozenge>
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
				"outline-none overflow-hidden h-(--collapsible-panel-height) transition-[height,opacity] ease-out duration-medium data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0",
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
			<div className="relative flex max-h-[22rem] items-center justify-start overflow-hidden rounded-lg bg-surface-raised">
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
