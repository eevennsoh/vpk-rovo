"use client";

import { type ReactNode } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

/**
 * A filled Details field row (video-matched): a small subtle label above the
 * value, with a hover row background and optional trailing hover actions on the
 * right of the value line. The `value` is typically an inline-edit trigger
 * (popover/menu) styled plain.
 */
export function DetailFieldRow({
	label,
	value,
	actions,
}: Readonly<{
	label: string;
	value: ReactNode;
	/** Trailing controls revealed on hover (e.g. assign-to-me, more). */
	actions?: ReactNode;
}>) {
	return (
		<div className="group/detail-row -mx-2 rounded-md px-2 py-1.5 transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered motion-reduce:transition-none">
			<div className="text-xs leading-4 text-text-subtle">{label}</div>
			<div className="mt-0.5 flex items-center justify-between gap-2">
				<div className="min-w-0 flex-1">{value}</div>
				{actions ? (
					<div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-normal ease-out-practical group-hover/detail-row:opacity-100 group-focus-within/detail-row:opacity-100 motion-reduce:transition-none">
						{actions}
					</div>
				) : null}
			</div>
		</div>
	);
}

/**
 * An empty click-to-add Details row (video-matched): a leading icon + label that
 * opens the field editor on click, with a hover row background and a trailing
 * more-menu affordance revealed on hover.
 */
export function DetailEmptyRow({
	icon: IconComponent,
	label,
	onOpen,
	trigger,
}: Readonly<{
	icon: React.ComponentType<NewCoreIconProps>;
	label: string;
	onOpen?: () => void;
	/**
	 * Optional custom trigger (e.g. a Popover/DropdownMenu trigger element) used
	 * instead of the default button when the row opens an anchored editor.
	 */
	trigger?: ReactNode;
}>) {
	const content = (
		<>
			<Icon aria-hidden className="text-icon-subtle" render={<IconComponent label="" size="small" />} />
			<span className="min-w-0 flex-1 truncate text-sm text-text-subtle">{label}</span>
			<Icon
				aria-hidden
				className="shrink-0 text-icon-subtle opacity-0 transition-opacity duration-normal ease-out-practical group-hover/detail-empty:opacity-100 motion-reduce:transition-none"
				render={<ShowMoreHorizontalIcon label="" size="small" />}
			/>
		</>
	);

	return (
		<div className="group/detail-empty -mx-2 rounded-md transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered motion-reduce:transition-none">
			{trigger ?? (
				<button
					className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
					onClick={onOpen}
					type="button"
				>
					{content}
				</button>
			)}
		</div>
	);
}

/**
 * Plain inline-edit value trigger — no border and no hover background: the row
 * (FloatingField) owns the single hover surface, so the trigger stays visually
 * flat and a click anywhere on the row opens the editor.
 */
export function DetailValueTrigger({ className, ...props }: Readonly<React.ComponentProps<"button">>) {
	return (
		<button
			className={cn(
				// `-mx-2 px-2` stretches the hit area to the full padded row width so
				// the row (FloatingField) is entirely clickable; the row owns the hover.
				"-mx-2 flex w-full min-w-0 max-w-full items-center gap-2 rounded-md px-2 py-0.5 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
				className,
			)}
			data-slot="detail-value-trigger"
			type="button"
			{...props}
		/>
	);
}
