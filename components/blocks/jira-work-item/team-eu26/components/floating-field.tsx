"use client";

import { type ReactNode } from "react";

import type { NewCoreIconProps } from "@atlaskit/icon/base-new";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Floating-label Details field (video-matched). Collapses to a single
 * `icon + label` line when empty and idle, and expands — floating the label up
 * and shrinking it while the value/editor reveals below — when the field has a
 * value or is being edited.
 *
 * "Expanded" is derived purely from CSS so it always tracks live DOM state with
 * no focus/blur races: the row expands when it is filled (`data-filled`), while
 * it holds focus (`:focus-within`), or while a descendant trigger's popover is
 * open (`:has([data-popup-open])`). The editor trigger (`children`) is always
 * full-width and clickable; when collapsed it fades to transparent so only the
 * overlaid label + icon show, so a click anywhere on the row still opens it.
 *
 * The whole row is the hit area: the trigger stretches to the full padded row
 * width (`-mx-2 px-2`) and, once expanded, pulls its box up over the floated
 * label's reserved space (`-mt-6 pt-6`), so clicking anywhere on the row — the
 * label region, the padding, or the value line — activates the editor, not just
 * the value's own bounding box.
 */

// Applied to a child so it takes its expanded form whenever the field is filled,
// focused, or has an open popover. Kept as one shared string per element so the
// three OR-conditions stay in lockstep.
const EXPANDED_ICON = cn(
	"group-data-[filled=true]/ff:-translate-x-1 group-data-[filled=true]/ff:opacity-0",
	"group-focus-within/ff:-translate-x-1 group-focus-within/ff:opacity-0",
	"group-has-[[data-popup-open]]/ff:-translate-x-1 group-has-[[data-popup-open]]/ff:opacity-0",
);

const EXPANDED_LABEL = cn(
	"group-data-[filled=true]/ff:top-1.5 group-data-[filled=true]/ff:translate-x-0 group-data-[filled=true]/ff:text-xs",
	"group-focus-within/ff:top-1.5 group-focus-within/ff:translate-x-0 group-focus-within/ff:text-xs",
	"group-has-[[data-popup-open]]/ff:top-1.5 group-has-[[data-popup-open]]/ff:translate-x-0 group-has-[[data-popup-open]]/ff:text-xs",
);

const EXPANDED_VALUE = cn(
	"group-data-[filled=true]/ff:pt-6 group-data-[filled=true]/ff:opacity-100",
	"group-focus-within/ff:pt-6 group-focus-within/ff:opacity-100",
	"group-has-[[data-popup-open]]/ff:pt-6 group-has-[[data-popup-open]]/ff:opacity-100",
);

export function FloatingField({
	label,
	icon: IconComponent,
	filled,
	readOnly = false,
	children,
}: Readonly<{
	label: string;
	icon: React.ComponentType<NewCoreIconProps>;
	filled: boolean;
	/**
	 * When true the field is display-only: no hover affordance and no pointer
	 * interaction reach the value. Used for fields the user cannot change (e.g.
	 * Reporter). The label still floats when the field is filled.
	 */
	readOnly?: boolean;
	/** The editor: a full-width popover/menu trigger that renders the value. */
	children: ReactNode;
}>) {
	return (
		<div
			className={cn(
				"group/ff relative -mx-2 rounded-md px-2 transition-colors duration-normal ease-out-practical motion-reduce:transition-none",
				readOnly ? null : "hover:bg-bg-neutral-subtle-hovered",
			)}
			data-filled={filled ? "true" : "false"}
			data-slot="floating-field"
		>
			{/* Leading icon — visible only when collapsed. */}
			<span
				aria-hidden
				className={cn(
					"pointer-events-none absolute left-2 top-1/2 flex -translate-y-1/2 text-icon-subtle",
					"transition-[opacity,transform] duration-medium ease-in-out motion-reduce:transition-none",
					EXPANDED_ICON,
				)}
			>
				<Icon aria-hidden render={<IconComponent label="" size="small" />} />
			</span>

			{/* Floating label — one element that rises + shrinks on expand. */}
			<span
				className={cn(
					"pointer-events-none absolute left-2 top-2.5 origin-top-left translate-x-6 text-sm leading-4 text-text-subtle",
					"transition-[transform,font-size,top] duration-medium ease-in-out motion-reduce:transition-none",
					EXPANDED_LABEL,
				)}
			>
				{label}
			</span>

			{/*
			 * Value / editor — full-width + clickable; fades + slides down into
			 * place. The wrapper's `pt-6` (on expand) reserves the floated-label
			 * space; the nested trigger reclaims that space as hit area by pulling
			 * its box up over it (`-mt-6 pt-6` on expand) and stretching to the row
			 * edges (`-mx-2 px-2`), so a click anywhere on the row — label region,
			 * padding, or value — opens the editor, not just the value's own box.
			 */}
			<div
				className={cn(
					"pt-1.5 pb-1.5 opacity-0",
					readOnly ? "pointer-events-none" : null,
					"group-data-[filled=true]/ff:[&>[data-slot=detail-value-trigger]]:-mt-6 group-data-[filled=true]/ff:[&>[data-slot=detail-value-trigger]]:pt-6",
					"group-focus-within/ff:[&>[data-slot=detail-value-trigger]]:-mt-6 group-focus-within/ff:[&>[data-slot=detail-value-trigger]]:pt-6",
					"group-has-[[data-popup-open]]/ff:[&>[data-slot=detail-value-trigger]]:-mt-6 group-has-[[data-popup-open]]/ff:[&>[data-slot=detail-value-trigger]]:pt-6",
					"transition-[padding,opacity] duration-medium ease-in-out motion-reduce:transition-none",
					EXPANDED_VALUE,
				)}
			>
				{children}
			</div>
		</div>
	);
}
