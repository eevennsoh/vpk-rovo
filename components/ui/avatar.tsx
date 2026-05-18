"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import type { NewCoreIconProps } from "@atlaskit/icon/base-new"
import AiAgentIcon from "@atlaskit/icon/core/ai-agent"
import CrossCircleIcon from "@atlaskit/icon/core/cross-circle"
import LockLockedIcon from "@atlaskit/icon/core/lock-locked"
import PersonIcon from "@atlaskit/icon/core/person"
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified"
import { cva, type VariantProps } from "class-variance-authority"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

const HEXAGON_CLIP =
	"[clip-path:polygon(45%_1.34%,46.58%_0.6%,48.26%_0.15%,50%_0%,51.74%_0.15%,53.42%_0.6%,55%_1.34%,89.64%_21.34%,91.07%_22.34%,92.3%_23.57%,93.3%_25%,94.04%_26.58%,94.49%_28.26%,94.64%_30%,94.64%_70%,94.49%_71.74%,94.04%_73.42%,93.3%_75%,92.3%_76.43%,91.07%_77.66%,89.64%_78.66%,55%_98.66%,53.42%_99.4%,51.74%_99.85%,50%_100%,48.26%_99.85%,46.58%_99.4%,45%_98.66%,10.36%_78.66%,8.93%_77.66%,7.7%_76.43%,6.7%_75%,5.96%_73.42%,5.51%_71.74%,5.36%_70%,5.36%_30%,5.51%_28.26%,5.96%_26.58%,6.7%_25%,7.7%_23.57%,8.93%_22.34%,10.36%_21.34%)]"

const HEXAGON_POINTS =
	"45,1.34 46.58,0.6 48.26,0.15 50,0 51.74,0.15 53.42,0.6 55,1.34 89.64,21.34 91.07,22.34 92.3,23.57 93.3,25 94.04,26.58 94.49,28.26 94.64,30 94.64,70 94.49,71.74 94.04,73.42 93.3,75 92.3,76.43 91.07,77.66 89.64,78.66 55,98.66 53.42,99.4 51.74,99.85 50,100 48.26,99.85 46.58,99.4 45,98.66 10.36,78.66 8.93,77.66 7.7,76.43 6.7,75 5.96,73.42 5.51,71.74 5.36,70 5.36,30 5.51,28.26 5.96,26.58 6.7,25 7.7,23.57 8.93,22.34 10.36,21.34"

const avatarVariants = cva(
	"group/avatar relative flex shrink-0 select-none after:absolute after:inset-0 after:border after:mix-blend-darken dark:after:mix-blend-lighten after:border-border",
	{
		variants: {
			size: {
				xs: "size-4",
				sm: "size-6",
				default: "size-8",
				lg: "size-10",
				xl: "size-12",
				"2xl": "size-24",
			},
			shape: {
				circle: "rounded-full after:rounded-full",
				square: "rounded-xs after:rounded-xs",
				hexagon: `${HEXAGON_CLIP} after:border-0`,
			},
		},
		defaultVariants: {
			size: "default",
			shape: "circle",
		},
	}
)

type AvatarPresence = "online" | "busy" | "offline" | "focus"
type AvatarUnassignedKind = "person" | "agent"
type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>["size"]>

interface AvatarProps
	extends AvatarPrimitive.Root.Props,
		VariantProps<typeof avatarVariants> {
	disabled?: boolean
	label?: string
}

function AvatarHexagonBorder() {
	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 z-[1] size-full p-px text-border! mix-blend-darken dark:mix-blend-lighten"
			focusable="false"
			viewBox="0 0 100 100"
		>
			<polygon
				fill="none"
				points={HEXAGON_POINTS}
				stroke="currentColor"
				strokeWidth="1"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	)
}

function Avatar({
	children,
	className,
	size = "default",
	shape = "circle",
	disabled = false,
	label,
	...props
}: Readonly<AvatarProps>) {
	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
				data-size={size}
				data-shape={shape}
				aria-label={label}
				aria-disabled={disabled || undefined}
				className={cn(
					avatarVariants({ size, shape }),
					disabled && "opacity-(--opacity-disabled) pointer-events-none grayscale",
					className
				)}
				{...props}
			>
				{children}
				{shape === "hexagon" ? <AvatarHexagonBorder /> : null}
			</AvatarPrimitive.Root>
	)
}

type AvatarImageProps = AvatarPrimitive.Image.Props

function AvatarImage({ className, ...props }: Readonly<AvatarImageProps>) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn(
				"rounded-full aspect-square size-full object-cover group-data-[shape=square]/avatar:rounded-xs",
				`group-data-[shape=hexagon]/avatar:rounded-none group-data-[shape=hexagon]/avatar:${HEXAGON_CLIP}`,
				className
			)}
			{...props}
		/>
	)
}

type AvatarFallbackProps = AvatarPrimitive.Fallback.Props

function AvatarFallback({
	className,
	...props
}: Readonly<AvatarFallbackProps>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"bg-muted text-foreground rounded-full flex size-full items-center justify-center text-sm group-data-[size=xs]/avatar:text-[8px] group-data-[size=sm]/avatar:text-xs group-data-[size=xl]/avatar:text-lg group-data-[size=2xl]/avatar:text-3xl group-data-[shape=square]/avatar:rounded-xs",
				`group-data-[shape=hexagon]/avatar:rounded-none group-data-[shape=hexagon]/avatar:${HEXAGON_CLIP}`,
				className
			)}
			{...props}
		/>
	)
}

const avatarUnassignedIconSizeMap: Record<AvatarSize, NewCoreIconProps["size"]> = {
	xs: "small",
	sm: "small",
	default: "medium",
	lg: "medium",
	xl: "medium",
	"2xl": "medium",
}

interface AvatarUnassignedProps extends Omit<AvatarProps, "shape"> {
	kind?: AvatarUnassignedKind
}

function AvatarUnassigned({
	children,
	className,
	kind = "person",
	label,
	size = "default",
	...props
}: Readonly<AvatarUnassignedProps>) {
	const isAgent = kind === "agent"
	const IconComponent = isAgent ? AiAgentIcon : PersonIcon
	const resolvedLabel = label ?? (isAgent ? "Unassigned agent" : "Unassigned person")
	const resolvedSize = size ?? "default"

	return (
		<Avatar
			data-unassigned={kind}
			className={cn(
				"items-center justify-center bg-muted text-icon-subtle after:border-border",
				className
			)}
			label={resolvedLabel}
			shape={isAgent ? "hexagon" : "circle"}
			size={resolvedSize}
			{...props}
		>
			<Icon
				aria-hidden
				className="text-icon-subtle"
				render={
					<IconComponent
						color="currentColor"
						label=""
						size={avatarUnassignedIconSizeMap[resolvedSize]}
					/>
				}
			/>
			{children}
		</Avatar>
	)
}

const presenceColorMap: Record<AvatarPresence, string> = {
	online: "bg-success",
	busy: "bg-destructive",
	offline: "bg-bg-neutral-bold",
	focus: "bg-discovery",
}

interface AvatarPresenceIndicatorProps extends React.ComponentProps<"span"> {
	presence: AvatarPresence
}

function AvatarPresenceIndicator({
	className,
	presence,
	...props
}: Readonly<AvatarPresenceIndicatorProps>) {
	return (
		<span
			data-slot="avatar-presence"
			role="img"
			aria-label={presence}
			className={cn(
				"ring-background absolute right-0 bottom-0 z-10 rounded-full ring-2",
				"group-data-[size=xs]/avatar:size-1.5",
				"group-data-[size=sm]/avatar:size-2",
				"group-data-[size=default]/avatar:size-2.5",
				"group-data-[size=lg]/avatar:size-3",
				"group-data-[size=xl]/avatar:size-3.5",
				"group-data-[size=2xl]/avatar:size-6",
				presenceColorMap[presence],
				className
			)}
			{...props}
		/>
	)
}

type AvatarBadgeProps = React.ComponentProps<"span">

function AvatarBadge({ className, ...props }: Readonly<AvatarBadgeProps>) {
	return (
		<span
			data-slot="avatar-badge"
			className={cn(
				"bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blend-color ring-2 select-none",
				"group-data-[size=xs]/avatar:size-1.5 group-data-[size=xs]/avatar:[&>svg]:hidden",
				"group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
				"group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
				"group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
				"group-data-[size=xl]/avatar:size-3.5 group-data-[size=xl]/avatar:[&>svg]:size-2.5",
				"group-data-[size=2xl]/avatar:size-6 group-data-[size=2xl]/avatar:[&>svg]:size-4",
				className
			)}
			{...props}
		/>
	)
}

type AvatarStatus = "approved" | "declined" | "locked"

const statusConfig: Record<AvatarStatus, { icon: typeof StatusVerifiedIcon; className: string; label: string }> = {
	approved: { icon: StatusVerifiedIcon, className: "bg-success text-success-foreground", label: "Approved" },
	declined: { icon: CrossCircleIcon, className: "bg-destructive text-destructive-foreground", label: "Declined" },
	locked: { icon: LockLockedIcon, className: "bg-warning text-warning-foreground", label: "Locked" },
}

interface AvatarStatusIndicatorProps extends React.ComponentProps<"span"> {
	status: AvatarStatus
}

function AvatarStatusIndicator({
	className,
	status,
	...props
}: Readonly<AvatarStatusIndicatorProps>) {
	const config = statusConfig[status]
	const StatusIcon = config.icon

	return (
		<span
			data-slot="avatar-status"
			role="img"
			aria-label={config.label}
			className={cn(
				"ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full ring-2",
				config.className,
				"group-data-[size=xs]/avatar:size-1.5",
				"group-data-[size=sm]/avatar:size-2",
				"group-data-[size=default]/avatar:size-2.5",
				"group-data-[size=lg]/avatar:size-3",
				"group-data-[size=xl]/avatar:size-3.5",
				"group-data-[size=2xl]/avatar:size-6",
				className
			)}
			{...props}
		>
			<Icon
				aria-hidden
				className="group-data-[size=xs]/avatar:hidden group-data-[size=sm]/avatar:hidden group-data-[size=default]/avatar:[&>span>svg]:size-2 group-data-[size=lg]/avatar:[&>span>svg]:size-2 group-data-[size=xl]/avatar:[&>span>svg]:size-2.5 group-data-[size=2xl]/avatar:[&>span>svg]:size-4"
				render={<StatusIcon label="" size="small" color="currentColor" />}
			/>
		</span>
	)
}

interface AvatarGroupProps extends React.ComponentProps<"div"> {
	label?: string
}

function AvatarGroup({ className, label, ...props }: Readonly<AvatarGroupProps>) {
	return (
		<div
			data-slot="avatar-group"
			role="group"
			aria-label={label}
			className={cn(
				"*:data-[slot=avatar]:ring-background group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2",
				className
			)}
			{...props}
		/>
	)
}

type AvatarGroupCountProps = React.ComponentProps<"div">

function AvatarGroupCount({
	className,
	...props
}: Readonly<AvatarGroupCountProps>) {
	return (
		<div
			data-slot="avatar-group-count"
			className={cn("bg-muted text-muted-foreground size-8 rounded-full text-sm group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 ring-background relative flex shrink-0 items-center justify-center ring-2", className)}
			{...props}
		/>
	)
}

export {
	Avatar,
	avatarVariants,
	AvatarImage,
	AvatarFallback,
	AvatarUnassigned,
	AvatarGroup,
	AvatarGroupCount,
	AvatarBadge,
	AvatarPresenceIndicator,
	AvatarStatusIndicator,
	type AvatarProps,
	type AvatarImageProps,
	type AvatarFallbackProps,
	type AvatarUnassignedProps,
	type AvatarUnassignedKind,
	type AvatarBadgeProps,
	type AvatarGroupProps,
	type AvatarGroupCountProps,
	type AvatarPresenceIndicatorProps,
	type AvatarPresence,
	type AvatarStatusIndicatorProps,
	type AvatarStatus,
}
