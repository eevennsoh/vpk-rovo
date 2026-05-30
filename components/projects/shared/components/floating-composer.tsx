"use client";

import type { ComponentProps, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
	PromptInput,
	PromptInputBody,
	PromptInputButton,
} from "@/components/ui-custom/prompt-input";
import { composerPromptInputClassName } from "@/components/blocks/shared-ui/composer-styles";
import { cn } from "@/lib/utils";
import AddIcon from "@atlaskit/icon/core/add";

export type FloatingComposerProps = Omit<
	ComponentProps<typeof PromptInput>,
	"variant" | "children"
> & {
	// The text field — render a <PromptInputTextarea> with your own ref/value/handlers.
	children: ReactNode;
	// Trailing action cluster (e.g. <RovoComposerActionButton />). Sits at the far right.
	actions: ReactNode;
	// Full override for the leading "+" control. Defaults to a ghost Add icon button.
	addButton?: ReactNode;
	// Props forwarded to the default "+" button (ignored when `addButton` is provided).
	addButtonProps?: ComponentProps<typeof PromptInputButton>;
};

/**
 * Shared floating prompt composer shell.
 *
 * Single-line: lays out `[ + ] [ textarea ] [ actions ]` on one vertically-centered flex row.
 * Multi-line: once the textarea wraps to 2+ lines, the `+` and `actions` cluster drop into
 * their own bottom strip below a full-width textarea (mirroring the default chat composer's
 * `PromptInputFooter`). The transition is an instant reflow.
 *
 * This is the single source of truth for the floating composer layout: the Studio composer and
 * the Prompt Input demo both render it, so any layout change here propagates to both surfaces.
 *
 * The reflow uses a stable DOM order with flex `order`/`basis`/`flex-wrap` rather than swapping
 * subtrees — the textarea is passed in as `children` and owns focus/cursor/value, so it must
 * never unmount across the transition.
 */
export function FloatingComposer({
	actions,
	addButton,
	addButtonProps,
	children,
	className,
	...props
}: Readonly<FloatingComposerProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isMultiline, setIsMultiline] = useState(false);

	// Detecting whether the textarea has wrapped to a second line can't be done in pure CSS
	// (`:has()`/container queries can't observe text wrapping), so we measure `scrollHeight`.
	useEffect(() => {
		const container = containerRef.current;
		const textarea = container?.querySelector("textarea");
		if (!container || !textarea) {
			return;
		}

		const measure = () => {
			const styles = window.getComputedStyle(textarea);
			const lineHeight = parseFloat(styles.lineHeight) || 20;
			const verticalPadding =
				(parseFloat(styles.paddingTop) || 0) +
				(parseFloat(styles.paddingBottom) || 0);
			const contentHeight = textarea.scrollHeight - verticalPadding;
			// 1.5× line-height cleanly separates one line (≈1×) from two lines (≈2×).
			setIsMultiline(contentHeight > lineHeight * 1.5);
		};

		measure();

		// Observe the textarea itself so we catch *programmatic* value changes — gallery
		// prefill, voice transcript streaming, paste, and clear all update the controlled
		// React value without firing a DOM `input` event, so a typing-only listener misses
		// them and the layout never stacks.
		//
		// The hazard is a feedback loop: stacking widens the textarea (it gains the button
		// row's width), which can un-wrap borderline content and flip the layout straight
		// back. We break the loop by ignoring callbacks caused by our own width change and
		// only re-measuring when the content height changes at a stable width.
		let lastTextareaWidth = textarea.getBoundingClientRect().width;
		const textareaObserver = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width ?? lastTextareaWidth;
			if (width !== lastTextareaWidth) {
				lastTextareaWidth = width;
				return;
			}
			measure();
		});
		textareaObserver.observe(textarea);

		// React to real responsive width changes of the whole composer. The outer container's
		// width is set by its parent and does not change when the internal layout reflows, so
		// guarding on width keeps our own height growth from feeding back into a measurement.
		let lastWidth = container.getBoundingClientRect().width;
		const containerObserver = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width ?? lastWidth;
			if (width === lastWidth) {
				return;
			}
			lastWidth = width;
			// The textarea width tracks the container here, so resync the baseline to keep the
			// textarea observer from treating this genuine reflow as a content change next tick.
			lastTextareaWidth = textarea.getBoundingClientRect().width;
			measure();
		});
		containerObserver.observe(container);

		return () => {
			textareaObserver.disconnect();
			containerObserver.disconnect();
		};
	}, []);

	const addButtonNode = addButton ?? (
		<PromptInputButton
			size="icon-sm"
			variant="ghost"
			aria-label="Add"
			{...addButtonProps}
		>
			<AddIcon label="" />
		</PromptInputButton>
	);

	return (
		<PromptInput
			variant="floating"
			className={cn(composerPromptInputClassName, className)}
			{...props}
		>
			<PromptInputBody>
				<div
					ref={containerRef}
					className="flex w-full flex-wrap items-center gap-2"
				>
					<div className={cn(isMultiline ? "order-2" : "order-1")}>
						{addButtonNode}
					</div>
					<div
						className={cn(
							"flex min-w-0",
							isMultiline ? "order-1 basis-full" : "order-2 flex-1",
						)}
					>
						{children}
					</div>
					<div className="order-3 ml-auto flex shrink-0 items-center gap-1">
						{actions}
					</div>
				</div>
			</PromptInputBody>
		</PromptInput>
	);
}
