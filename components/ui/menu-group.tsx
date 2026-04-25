import * as React from "react"

import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// MenuGroup — root container
// ---------------------------------------------------------------------------

type MenuGroupSpacing = "cozy" | "compact"

export interface MenuGroupProps extends Omit<React.ComponentProps<"div">, "title"> {
	/** Optional accessible label for the menu group. */
	title?: React.ReactNode
	/** Density of item padding within the group. */
	spacing?: MenuGroupSpacing
}

function MenuGroup({
	title,
	spacing = "cozy",
	className,
	children,
	...props
}: Readonly<MenuGroupProps>) {
	return (
		<div
			data-slot="menu-group"
			data-spacing={spacing}
			role="menu"
			aria-label={typeof title === "string" ? title : undefined}
			className={cn(className)}
			{...props}
		>
			{title ? (
				<div className="text-text-subtle px-3 py-2 text-xs leading-4 font-medium">
					{title}
				</div>
			) : null}
			{children}
		</div>
	)
}

// ---------------------------------------------------------------------------
// MenuSection — groups items within a MenuGroup with optional heading + divider
// ---------------------------------------------------------------------------

export interface MenuSectionProps extends React.ComponentProps<"div"> {
	/** Optional section heading rendered above items. */
	title?: string
	/** Show a separator line above this section. */
	hasSeparator?: boolean
}

function MenuSection({
	title,
	hasSeparator = false,
	className,
	children,
	...props
}: Readonly<MenuSectionProps>) {
	return (
		<div
			data-slot="menu-section"
			role="group"
			aria-label={title}
			className={cn("p-1", className)}
			{...props}
		>
			{hasSeparator ? <div className="bg-border mx-1 my-1 h-px" role="separator" /> : null}
			{title ? (
				<div className="text-text-subtle px-3 py-2 text-xs leading-4 font-medium">
					{title}
				</div>
			) : null}
			{children}
		</div>
	)
}

// ---------------------------------------------------------------------------
// MenuItem — interactive button-style menu item (maps to ADS ButtonItem)
// ---------------------------------------------------------------------------

export interface MenuItemProps extends React.ComponentProps<"button"> {
	/** Icon rendered before the label. */
	iconBefore?: React.ReactNode
	/** Icon rendered after the label. */
	iconAfter?: React.ReactNode
	/** Secondary description rendered below the label. */
	description?: string
	/** Whether the item appears selected / highlighted. */
	isSelected?: boolean
}

function MenuItem({
	iconBefore,
	iconAfter,
	description,
	isSelected,
	disabled,
	className,
	children,
	...props
}: Readonly<MenuItemProps>) {
	return (
		<button
			data-slot="menu-item"
			type="button"
			role="menuitem"
			aria-current={isSelected || undefined}
			aria-disabled={disabled || undefined}
			disabled={disabled}
			className={cn(
				"flex w-full items-start gap-3 rounded-sm px-3 py-2 text-left text-[13px] leading-5 transition-colors",
				"hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
				"disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
				isSelected && "bg-bg-selected text-text-selected",
				"[div[data-spacing=compact]_&]:py-1",
				className,
			)}
			{...props}
		>
			{iconBefore ? (
				<span className="text-icon flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
					{iconBefore}
				</span>
			) : null}
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="text-text truncate">{children}</span>
				{description ? (
					<span className="text-text-subtle truncate text-[11px] leading-4">
						{description}
					</span>
				) : null}
			</span>
			{iconAfter ? (
				<span className="text-icon-subtle flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
					{iconAfter}
				</span>
			) : null}
		</button>
	)
}

// ---------------------------------------------------------------------------
// MenuLinkItem — anchor-style menu item (maps to ADS LinkItem)
// ---------------------------------------------------------------------------

export interface MenuLinkItemProps extends React.ComponentProps<"a"> {
	/** Icon rendered before the label. */
	iconBefore?: React.ReactNode
	/** Icon rendered after the label. */
	iconAfter?: React.ReactNode
	/** Secondary description rendered below the label. */
	description?: string
}

function MenuLinkItem({
	iconBefore,
	iconAfter,
	description,
	className,
	children,
	...props
}: Readonly<MenuLinkItemProps>) {
	return (
		<a
			data-slot="menu-link-item"
			role="menuitem"
			className={cn(
				"flex w-full items-start gap-3 rounded-sm px-3 py-2 text-left text-[13px] leading-5 no-underline transition-colors",
				"hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
				"[div[data-spacing=compact]_&]:py-1",
				className,
			)}
			{...props}
		>
			{iconBefore ? (
				<span className="text-icon flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
					{iconBefore}
				</span>
			) : null}
			<span className="flex min-w-0 flex-1 flex-col">
				<span className="text-text truncate">{children}</span>
				{description ? (
					<span className="text-text-subtle truncate text-[11px] leading-4">
						{description}
					</span>
				) : null}
			</span>
			{iconAfter ? (
				<span className="text-icon-subtle flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
					{iconAfter}
				</span>
			) : null}
		</a>
	)
}

// ---------------------------------------------------------------------------
// MenuHeading — non-interactive heading (maps to ADS HeadingItem)
// ---------------------------------------------------------------------------

type MenuHeadingProps = React.ComponentProps<"div">

function MenuHeading({ className, children, ...props }: Readonly<MenuHeadingProps>) {
	return (
		<div
			data-slot="menu-heading"
			role="presentation"
			className={cn(
				"text-text-subtle px-3 py-2 text-xs leading-4 font-medium",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

// ---------------------------------------------------------------------------
// MenuSkeletonItem — loading placeholder (maps to ADS SkeletonItem)
// ---------------------------------------------------------------------------

export interface MenuSkeletonItemProps extends React.ComponentProps<"div"> {
	/** Show an icon-sized circle skeleton on the left. */
	hasIcon?: boolean
}

function MenuSkeletonItem({
	hasIcon = false,
	className,
	...props
}: Readonly<MenuSkeletonItemProps>) {
	return (
		<div
			data-slot="menu-skeleton-item"
			className={cn("flex items-center gap-3 px-3 py-2", className)}
			{...props}
		>
			{hasIcon ? (
				<div className="bg-muted size-4 shrink-0 animate-pulse rounded-sm" />
			) : null}
			<div className="bg-muted h-4 flex-1 animate-pulse rounded-sm" />
		</div>
	)
}

// ---------------------------------------------------------------------------
// MenuSkeletonHeading — loading placeholder heading (maps to ADS SkeletonHeadingItem)
// ---------------------------------------------------------------------------

type MenuSkeletonHeadingProps = React.ComponentProps<"div">

function MenuSkeletonHeading({ className, ...props }: Readonly<MenuSkeletonHeadingProps>) {
	return (
		<div
			data-slot="menu-skeleton-heading"
			className={cn("px-3 py-2", className)}
			{...props}
		>
			<div className="bg-muted h-3 w-24 animate-pulse rounded-sm" />
		</div>
	)
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
	MenuGroup,
	MenuSection,
	MenuItem,
	MenuLinkItem,
	MenuHeading,
	MenuSkeletonItem,
	MenuSkeletonHeading,
}
