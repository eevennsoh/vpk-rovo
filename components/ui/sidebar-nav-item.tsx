import * as React from "react"
import { cva } from "class-variance-authority"

import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

const sidebarNavItemVariants = cva(
	"group/sidebar-nav-item relative flex min-h-8 w-full min-w-0 items-center gap-1 rounded-md p-1 transition-colors duration-fast ease-out",
	{
		variants: {
			interactionState: {
				rest: "",
				hovered: "bg-bg-neutral-subtle-hovered",
				"focus-visible": "",
			},
			selected: {
				false:
					"bg-transparent hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
				true:
					"bg-bg-selected hover:bg-bg-selected-hovered active:bg-bg-selected-pressed",
			},
		},
		defaultVariants: {
			interactionState: "rest",
			selected: false,
		},
	}
)

export interface SidebarNavItemProps
	extends Omit<React.ComponentProps<"div">, "onClick" | "title"> {
	actions?: React.ReactNode
	/** Optional secondary text rendered below the label (e.g. timestamps, metadata). */
	description?: React.ReactNode
	disabled?: boolean
	interactionState?: "rest" | "hovered" | "focus-visible"
	isExpanded?: boolean
	isSelected?: boolean
	label: React.ReactNode
	leading?: React.ReactNode
	leadingSize?: "small" | "medium"
	meta?: React.ReactNode
	onClick?: React.MouseEventHandler<HTMLButtonElement>
	type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"]
}

function normalizeIconNode(
	node: React.ReactNode,
	size: "small" | "medium"
): React.ReactElement {
	if (React.isValidElement(node)) {
		return React.cloneElement(
			node as React.ReactElement<{ label?: string; size?: "small" | "medium" }>,
			{
				label: "",
				size,
			}
		)
	}

	return <span>{node}</span>
}

function SidebarNavItem({
	actions,
	className,
	description,
	disabled = false,
	interactionState = "rest",
	isExpanded,
	isSelected = false,
	label,
	leading,
	leadingSize = "small",
	meta,
	onClick,
	type = "button",
	...props
}: Readonly<SidebarNavItemProps>) {
	return (
		<div
			data-slot="sidebar-nav-item"
			data-interaction-state={interactionState}
			data-selected={isSelected ? "true" : "false"}
			className={cn(
				sidebarNavItemVariants({
					interactionState,
					selected: isSelected,
				}),
				disabled && "opacity-(--opacity-disabled)",
				className
			)}
			{...props}
			>
			<span
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute inset-0 rounded-md border border-transparent opacity-0 transition-[box-shadow,border-color,opacity] duration-fast ease-out peer-focus-visible/sidebar-nav-item-button:border-ring peer-focus-visible/sidebar-nav-item-button:ring-3 peer-focus-visible/sidebar-nav-item-button:ring-ring/50 peer-focus-visible/sidebar-nav-item-button:opacity-100",
					interactionState === "focus-visible" &&
						"border-ring ring-3 ring-ring/50 opacity-100"
				)}
			/>
			{isSelected ? (
				<span
					aria-hidden="true"
					className="absolute top-1/2 left-0 h-3 w-0.5 -translate-y-1/2 bg-current text-icon-selected"
				/>
			) : null}

			<button
				type={type}
				className="peer/sidebar-nav-item-button flex min-w-0 flex-1 items-center gap-1 rounded-md text-left outline-none"
				onClick={onClick}
				disabled={disabled}
				aria-current={isSelected ? "page" : undefined}
				aria-expanded={typeof isExpanded === "boolean" ? isExpanded : undefined}
			>
				{leading ? (
					<Icon
						aria-hidden
						data-slot="sidebar-nav-item-leading"
						label=""
						render={normalizeIconNode(leading, leadingSize)}
						className={cn(
							"flex size-6 shrink-0 items-center justify-center text-icon-subtle [&_svg]:shrink-0",
							leadingSize === "small" ? "[&_svg]:size-3" : "[&_svg]:size-4",
							isSelected && "text-icon-selected"
						)}
					/>
				) : null}

				<span className="min-w-0 flex-1 pl-0.5">
					<span
						data-slot="sidebar-nav-item-label"
						className={cn(
							"block truncate text-sm leading-5 font-medium",
							isSelected ? "text-text-selected" : "text-text-subtle"
						)}
					>
						{label}
					</span>
					{description ? (
						<span
							data-slot="sidebar-nav-item-description"
							className="block truncate text-xs text-text-subtlest"
						>
							{description}
						</span>
					) : null}
				</span>
			</button>

			{meta ? (
				<div
					data-slot="sidebar-nav-item-meta"
					className="flex shrink-0 items-center overflow-hidden"
				>
					{meta}
				</div>
			) : null}

			{actions ? (
				<div
					data-slot="sidebar-nav-item-actions"
					className="flex shrink-0 items-center gap-1"
				>
					{actions}
				</div>
			) : null}
		</div>
	)
}

export interface SidebarNavItemActionProps
	extends React.ComponentProps<"button"> {
	"aria-label": string
}

function SidebarNavItemAction({
	className,
	children,
	type = "button",
	...props
}: Readonly<SidebarNavItemActionProps>) {
	return (
		<button
			data-slot="button"
			type={type}
			className={cn(
				"inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent text-icon-subtle outline-none transition-colors duration-fast ease-out hover:bg-bg-neutral active:bg-bg-neutral-hovered focus-visible:border-transparent focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
				"group-data-[selected=true]/sidebar-nav-item:text-icon-selected hover:group-data-[selected=true]/sidebar-nav-item:bg-bg-neutral-subtle-hovered active:group-data-[selected=true]/sidebar-nav-item:bg-bg-selected-pressed",
				className
			)}
			{...props}
		>
			<Icon
				aria-hidden
				label=""
				render={normalizeIconNode(children, "small")}
				className="size-3 [&_svg]:size-3"
			/>
		</button>
	)
}

export type SidebarNavItemCountProps = Omit<BadgeProps, "variant">

function SidebarNavItemCount({
	children,
	className,
	...props
}: Readonly<SidebarNavItemCountProps>) {
	return (
		<Badge
			variant="neutral"
			max={false}
			className={cn(
				"pointer-events-none tabular-nums transition-opacity duration-fast ease-out group-data-[selected=true]/sidebar-nav-item:opacity-0 group-hover/sidebar-nav-item:!opacity-100",
				className,
				"h-4 min-h-4 max-h-4 leading-4"
			)}
			{...props}
		>
			{children}
		</Badge>
	)
}

export {
	SidebarNavItem,
	SidebarNavItemAction,
	SidebarNavItemCount,
}
