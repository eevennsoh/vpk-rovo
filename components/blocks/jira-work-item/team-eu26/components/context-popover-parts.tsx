"use client";

import { useState, type ReactElement, type ReactNode } from "react";

import ReturnIcon from "@atlaskit/icon-lab/core/return";
import AiSparkleIcon from "@atlaskit/icon/core/ai-sparkle";
import BugIcon from "@atlaskit/icon/core/bug";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";
import EpicIcon from "@atlaskit/icon/core/epic";
import StoryIcon from "@atlaskit/icon/core/story";
import SubtasksIcon from "@atlaskit/icon/core/subtasks";
import TaskIcon from "@atlaskit/icon/core/task";
import ThumbsDownIcon from "@atlaskit/icon/core/thumbs-down";
import ThumbsUpIcon from "@atlaskit/icon/core/thumbs-up";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Footer } from "@/components/ui-custom/footer";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the three context popovers (attachments, subtasks, linked
 * work items). They are separate surfaces with separate data, but production
 * gives them one visual language: segmented tabs, a search field with a return
 * affordance, and a collapsible AI suggestion card with an "Uses AI" footer.
 * Keeping that language here stops the three from drifting apart row by row.
 *
 * This module is v2-only; the v1 tree keeps its original popover treatment.
 */

/** Segmented tab strip. Inset with `mx`, not `px` — the grey track is visible. */
export const CONTEXT_POPOVER_TABS_LIST_CLASS = "mx-2.5 mt-2.5 w-[calc(100%-1.25rem)]";

export const CONTEXT_POPOVER_ROW_CLASS =
	"flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-text transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none";

export const CONTEXT_POPOVER_SECTION_HEADING_CLASS = "px-2 py-1 text-sm font-semibold text-text";

// ── Work item type glyphs ────────────────────────────────────────────────────

/**
 * Jira work item types carry a fixed glyph + hue pairing across the product, so
 * a Task reads the same in a suggestion row as it does in the metadata rail.
 * Size stays at the new-core default (16px); `size="small"` would render 12px.
 */
const WORK_ITEM_TYPE_ICON: Record<string, { Glyph: typeof TaskIcon; tone: string }> = {
	Task: { Glyph: TaskIcon, tone: "text-icon-accent-blue" },
	Subtask: { Glyph: SubtasksIcon, tone: "text-icon-accent-blue" },
	Story: { Glyph: StoryIcon, tone: "text-icon-accent-green" },
	Bug: { Glyph: BugIcon, tone: "text-icon-accent-red" },
	Epic: { Glyph: EpicIcon, tone: "text-icon-accent-purple" },
};

export function WorkItemTypeIcon({ type }: Readonly<{ type?: string }>) {
	const { Glyph, tone } = WORK_ITEM_TYPE_ICON[type ?? "Task"] ?? WORK_ITEM_TYPE_ICON.Task;
	return (
		<span className={cn("shrink-0", tone)}>
			<Glyph label="" color="currentColor" />
		</span>
	);
}

// ── Option picker ────────────────────────────────────────────────────────────

/**
 * Relationship / type / scope picker backed by DropdownMenu rather than Select:
 * the experimental dialog sits at z-[501] and SelectContent hardcodes z-[200]
 * with no override, so a nested Select renders behind the dialog. DropdownMenu
 * accepts a positionerClassName, so we push it above the popover's z-[502].
 *
 * `field` fills its row as a bordered control; `inline` is a borderless prefix
 * that sits inside a search or name field.
 */
export function PopoverOptionPicker<T extends string>({
	ariaLabel,
	leading,
	onChange,
	options,
	placeholder,
	value,
	variant = "field",
}: Readonly<{
	ariaLabel: string;
	leading?: ReactNode;
	onChange: (value: T) => void;
	options: readonly T[];
	placeholder?: string;
	value: T | null;
	variant?: "field" | "inline";
}>) {
	const [open, setOpen] = useState(false);
	const isField = variant === "field";
	// An inline picker with a leading glyph is a type prefix: the glyph already
	// names the choice and the field's placeholder repeats it ("Name this Task"),
	// so spelling it out a third time just crowds the row.
	const showLabel = isField || !leading;

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger
				render={
					<button
						type="button"
						aria-label={ariaLabel}
						className={cn(
							"flex items-center gap-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
							isField
								? "h-9 w-full min-w-0 justify-between rounded-md border border-input bg-bg-input px-3 hover:bg-bg-input-hovered active:bg-bg-input-pressed aria-expanded:border-ring"
								: "h-7 shrink-0 rounded-md px-1.5 hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
							value === null ? "text-text-subtlest" : "text-text",
						)}
					>
						{leading}
						{showLabel ? <span className="min-w-0 truncate">{value ?? placeholder}</span> : null}
						<span className="shrink-0 text-icon-subtle">
							<ChevronDownIcon label="" size="small" color="currentColor" />
						</span>
					</button>
				}
			/>
			<DropdownMenuContent align="start" positionerClassName="z-[600]">
				<DropdownMenuRadioGroup
					value={value ?? ""}
					onValueChange={(next) => {
						onChange(next as T);
						setOpen(false);
					}}
				>
					{options.map((option) => (
						<DropdownMenuRadioItem key={option} value={option}>
							{option}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ── Search / name field ──────────────────────────────────────────────────────

/**
 * Text field with an optional inline prefix control and a trailing return chip.
 * The chip is a real submit button: a decorative `↵` would promise an action the
 * keyboard-only path already has but the pointer path would not.
 */
export function PopoverSubmitField({
	ariaLabel,
	leading,
	onChange,
	onSubmit,
	placeholder,
	submitLabel,
	value,
}: Readonly<{
	ariaLabel: string;
	leading?: ReactNode;
	onChange: (value: string) => void;
	onSubmit: () => void;
	placeholder: string;
	submitLabel: string;
	value: string;
}>) {
	const canSubmit = Boolean(value.trim());

	return (
		<div className="flex items-center gap-1 rounded-md border border-input bg-bg-input py-1 pe-1 ps-1.5 focus-within:border-ring">
			{leading}
			<input
				aria-label={ariaLabel}
				className="h-7 min-w-0 flex-1 bg-transparent px-1 text-sm text-text outline-none placeholder:text-text-subtlest"
				onChange={(event) => onChange(event.target.value)}
				onKeyDown={(event) => {
					if (event.key !== "Enter" || !canSubmit) return;
					event.preventDefault();
					onSubmit();
				}}
				placeholder={placeholder}
				value={value}
			/>
			<Button
				aria-label={submitLabel}
				className="shrink-0"
				disabled={!canSubmit}
				onClick={onSubmit}
				size="icon"
				type="button"
				variant="secondary"
			>
				<ReturnIcon label="" size="small" />
			</Button>
		</div>
	);
}

// ── AI suggestion card ───────────────────────────────────────────────────────

/**
 * Collapsible AI panel: count in the header, disclaimer + feedback in the
 * footer, optional trailing action (for example a "Create" confirm button).
 */
export function SuggestionPanel({
	action,
	children,
	title,
}: Readonly<{ action?: ReactElement; children: ReactNode; title: string }>) {
	const [expanded, setExpanded] = useState(true);
	const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(null);
	const ChevronIcon = expanded ? ChevronUpIcon : ChevronDownIcon;

	return (
		<section className="rounded-lg border border-border">
			<button
				type="button"
				aria-expanded={expanded}
				onClick={() => setExpanded((open) => !open)}
				className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-text transition-colors hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
			>
				<span className="shrink-0 text-icon">
					<AiSparkleIcon label="" color="currentColor" />
				</span>
				<span className="min-w-0 flex-1 truncate">{title}</span>
				<span className="shrink-0 text-icon-subtle">
					<ChevronIcon label="" color="currentColor" />
				</span>
			</button>
			{expanded ? (
				<div className="flex flex-col gap-0.5 px-1 pb-1">
					{children}
					<Footer className="justify-start gap-1 px-2 py-1">
						<span>Uses AI. Verify results.</span>
						<span className="ml-1 flex items-center gap-0.5">
							<Button
								aria-label="Helpful"
								aria-pressed={feedback === "helpful"}
								size="icon"
								variant="ghost"
								onClick={() => setFeedback((current) => (current === "helpful" ? null : "helpful"))}
							>
								<ThumbsUpIcon label="" size="small" />
							</Button>
							<Button
								aria-label="Not helpful"
								aria-pressed={feedback === "not-helpful"}
								size="icon"
								variant="ghost"
								onClick={() => setFeedback((current) => (current === "not-helpful" ? null : "not-helpful"))}
							>
								<ThumbsDownIcon label="" size="small" />
							</Button>
						</span>
						{action ? <span className="ml-auto">{action}</span> : null}
					</Footer>
				</div>
			) : null}
		</section>
	);
}
