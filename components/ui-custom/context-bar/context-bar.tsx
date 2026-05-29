"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import { useState } from "react";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

const DISMISS_BUTTON_CLASS =
	"flex size-6 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-icon-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none";

const LEAD_ICON_CLASS = "flex size-4 shrink-0 items-center justify-center text-icon-subtle";

interface ContextBarProps extends React.ComponentProps<"div"> {
	onDismiss?: () => void;
	dismissLabel?: string;
}

interface ContextBarLeadProps {
	icon?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

interface ContextBarTagProps {
	children: React.ReactNode;
	color?: React.ComponentProps<typeof Tag>["color"];
	elemBefore?: React.ReactNode;
	title?: string;
	className?: string;
}

interface ContextBarTriggerProps extends React.ComponentProps<"button"> {
	icon?: React.ReactNode;
}

interface CollapsibleContextBarProps {
	children: React.ReactNode;
	defaultOpen?: boolean;
	lead?: React.ReactNode;
	leadLabel: string;
	dismissLabel?: string;
	collapsedIcon?: React.ReactNode;
	collapsedLabel: string;
	triggerAriaLabel?: string;
}

/**
 * The expanded contextual bar that sits above a composer input. Content (lead +
 * tag) is passed as children; the dismiss affordance is rendered on the right.
 * When `onDismiss` is omitted a non-interactive placeholder keeps the layout
 * stable, matching the original chat context bar behavior.
 */
export function ContextBar({
	onDismiss,
	dismissLabel = "Close",
	className,
	children,
	...props
}: Readonly<ContextBarProps>): React.ReactElement {
	return (
		<div
			className={cn(
				"mb-3 flex min-w-0 items-center justify-between gap-3 rounded-xl bg-bg-neutral px-3 py-2",
				className,
			)}
			data-context-bar
			{...props}
		>
			<div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">{children}</div>
			{onDismiss ? (
				<button
					aria-label={dismissLabel}
					className={DISMISS_BUTTON_CLASS}
					onClick={onDismiss}
					type="button"
				>
					<CrossIcon color="currentColor" label="" size="small" />
				</button>
			) : (
				<span aria-hidden className={DISMISS_BUTTON_CLASS}>
					<CrossIcon color="currentColor" label="" size="small" />
				</span>
			)}
		</div>
	);
}

/** Lead icon + label (e.g. "Edit:" / "Context:") rendered inside `ContextBar`. */
export function ContextBarLead({
	icon,
	children,
	className,
}: Readonly<ContextBarLeadProps>): React.ReactElement {
	return (
		<>
			<span className={LEAD_ICON_CLASS}>{icon}</span>
			<span className={cn("shrink-0 text-sm font-medium text-text-subtle", className)}>
				{children}
			</span>
		</>
	);
}

/** The truncating chip that names the active context (artifact, agent, etc). */
export function ContextBarTag({
	children,
	color = "blue",
	elemBefore,
	title,
	className,
}: Readonly<ContextBarTagProps>): React.ReactElement {
	return (
		<Tag
			className={cn("min-w-0 max-w-full shrink overflow-hidden", className)}
			color={color}
			elemBefore={elemBefore}
			maxWidth="100%"
			title={title}
		>
			{children}
		</Tag>
	);
}

/**
 * The collapsed pill that replaces the bar once dismissed, giving the user an
 * easy way back into the context (e.g. "Edit agent").
 */
export function ContextBarTrigger({
	icon,
	children,
	className,
	type = "button",
	...props
}: Readonly<ContextBarTriggerProps>): React.ReactElement {
	return (
		<button
			className={cn(
				"mb-3 flex w-fit items-center gap-1.5 rounded-xl bg-bg-neutral px-3 py-2 text-sm font-medium text-text-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-text active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
				className,
			)}
			data-context-bar-trigger
			type={type}
			{...props}
		>
			<span className={LEAD_ICON_CLASS}>{icon}</span>
			{children}
		</button>
	);
}

/**
 * Self-contained collapsible context bar: starts expanded, collapses to a pill
 * trigger on dismiss, and re-expands when the trigger is pressed. Owns its open
 * state so consumers (and their tests) stay stateless. Remount with a `key` to
 * reset the open state when the underlying context identity changes.
 */
export function CollapsibleContextBar({
	children,
	defaultOpen = true,
	lead,
	leadLabel,
	dismissLabel,
	collapsedIcon,
	collapsedLabel,
	triggerAriaLabel,
}: Readonly<CollapsibleContextBarProps>): React.ReactElement {
	const [open, setOpen] = useState(defaultOpen);

	return open ? (
		<ContextBar dismissLabel={dismissLabel} onDismiss={() => setOpen(false)}>
			<ContextBarLead icon={lead}>{leadLabel}</ContextBarLead>
			{children}
		</ContextBar>
	) : (
		<ContextBarTrigger
			aria-label={triggerAriaLabel}
			icon={collapsedIcon}
			onClick={() => setOpen(true)}
		>
			{collapsedLabel}
		</ContextBarTrigger>
	);
}
