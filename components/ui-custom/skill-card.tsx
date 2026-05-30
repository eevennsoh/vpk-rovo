"use client"

import * as React from "react"
import Image from "next/image"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

export interface SkillCardIcon {
	render: React.ReactElement
	label: string
	className?: string
}

export type SkillCardSource =
	| {
			type: "app"
			name: string
			logoSrc?: string
	  }
	| {
			type: "custom"
			name: string
			avatarSrc?: string
			fallbackInitials?: string
	  }

export type SkillCardRootProps = React.ComponentProps<typeof HoverCard>

function SkillCardRoot(props: Readonly<SkillCardRootProps>) {
	return <HoverCard {...props} />
}

export type SkillCardTriggerProps = React.ComponentProps<typeof HoverCardTrigger>

function SkillCardTrigger(props: Readonly<SkillCardTriggerProps>) {
	return <HoverCardTrigger {...props} />
}

export interface SkillCardContentProps
	extends Omit<React.ComponentProps<typeof HoverCardContent>, "children"> {
	skillName: string
	description?: string
	icon?: SkillCardIcon
	source?: SkillCardSource
}

function getInitials(name: string): string {
	return (
		name
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase())
			.join("") || "?"
	)
}

function SkillCardContent({
	skillName,
	description,
	icon,
	source,
	className,
	side = "top",
	sideOffset = 8,
	align = "center",
	alignOffset = 0,
	...props
}: Readonly<SkillCardContentProps>) {
	return (
		<HoverCardContent
			side={side}
			sideOffset={sideOffset}
			align={align}
			alignOffset={alignOffset}
			className={cn(
				"bg-surface-overlay shadow-2xl w-80 rounded-md p-4",
				className,
			)}
			{...props}
		>
			<div data-slot="skill-card" className="flex flex-col gap-4">
				<div data-slot="skill-card-header" className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						{icon ? (
							<Icon
								render={icon.render}
								label={icon.label}
								className={cn("text-icon-subtle", icon.className)}
							/>
						) : null}
						<h3 className="text-sm leading-5 font-semibold text-text">
							{skillName}
						</h3>
					</div>
					{description ? (
						<p className="text-sm leading-5 text-text line-clamp-2">
							{description}
						</p>
					) : null}
				</div>

				{source ? (
					<div
						data-slot="skill-card-source"
						className="flex items-center gap-1"
					>
						{source.type === "custom" ? (
							<>
								<Avatar size="xs">
									{source.avatarSrc ? (
										<AvatarImage src={source.avatarSrc} alt={source.name} />
									) : null}
									<AvatarFallback>
										{source.fallbackInitials ?? getInitials(source.name)}
									</AvatarFallback>
								</Avatar>
								<p className="text-text-subtle text-xs">
									{source.name}
								</p>
							</>
						) : (
							<>
								{source.logoSrc ? (
										<Image
											src={source.logoSrc}
											alt={`${source.name} logo`}
											width={16}
											height={16}
											className="size-4 rounded-xs object-cover"
											unoptimized
										/>
								) : (
									<span
										aria-hidden
										className="bg-bg-neutral size-4 rounded-full"
									/>
								)}
								<p className="text-text-subtlest text-xs">
									{source.name}
								</p>
							</>
						)}
					</div>
				) : null}
			</div>
		</HoverCardContent>
	)
}

export const SkillCard = {
	Root: SkillCardRoot,
	Trigger: SkillCardTrigger,
	Content: SkillCardContent,
} as const

export {
	SkillCardRoot,
	SkillCardTrigger,
	SkillCardContent,
}
