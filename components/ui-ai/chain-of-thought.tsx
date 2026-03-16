"use client";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { useControllableState } from "@/hooks/use-controllable-state";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { BrainIcon, ChevronDownIcon, DotIcon } from "lucide-react";
import { createContext, memo, use, useMemo } from "react";

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
						"not-prose w-full rounded-lg border border-border bg-surface p-3",
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
>;

export const ChainOfThoughtHeader = memo(
	({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
		const { isOpen } = useChainOfThought();

		return (
			<CollapsibleTrigger
				className={cn(
					"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-subtle transition-colors hover:bg-bg-neutral hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					className
				)}
				{...props}
			>
				<BrainIcon className="size-4" />
				<span className="flex-1 text-left">
					{children ?? "Chain of Thought"}
				</span>
				<ChevronDownIcon
					className={cn(
						"size-4 shrink-0 transition-transform",
						isOpen ? "rotate-180" : "rotate-0"
					)}
				/>
			</CollapsibleTrigger>
		);
	}
);

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
	icon?: LucideIcon;
	label: ReactNode;
	description?: ReactNode;
	status?: "complete" | "active" | "pending";
};

const stepStatusStyles = {
	active: "text-text",
	complete: "text-text-subtle",
	pending: "text-text-subtlest",
};

export const ChainOfThoughtStep = memo(
	({
		className,
		icon: Icon = DotIcon,
		label,
		description,
		status = "complete",
		children,
		...props
	}: ChainOfThoughtStepProps) => (
		<div
			className={cn(
				"fade-in-0 slide-in-from-top-2 animate-in",
				"flex gap-2 text-sm leading-relaxed",
				stepStatusStyles[status],
				className
			)}
			{...props}
		>
			<div className="relative mt-0.5">
				<Icon className="size-4" />
				<div className="absolute top-7 bottom-0 left-1/2 -mx-px w-px bg-border" />
			</div>
			<div className="flex-1 space-y-2 overflow-hidden">
				<div>{label}</div>
				{description ? (
					<div className="text-text-subtle text-xs">{description}</div>
				) : null}
				{children}
			</div>
		</div>
	)
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
				"mt-2 space-y-3 border-border border-t pt-3 text-sm text-text-subtle",
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
			<div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-raised p-3">
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
