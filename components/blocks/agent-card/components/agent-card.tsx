"use client";

import Image from "next/image";
import type { ComponentProps, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { AtlassianLogo } from "@/components/ui/logo";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface AgentCardProps extends Omit<ComponentProps<"section">, "children"> {
	name?: string;
	partnerName?: string;
	description?: string;
	avatarSrc?: string;
	coverSrc?: string;
	avatarAlt?: string;
	editLabel?: string;
	chatLabel?: string;
	onEdit?: () => void;
	onChat?: () => void;
}

function AgentCard({
	name = "Task Improver",
	partnerName = "Atlassian",
	description = "Proactively assists by automatically suggesting subtasks when you start adding one and providing comment summaries.",
	avatarSrc = "/avatar-agent/teamwork-agents/blocker-checker.svg",
	coverSrc = avatarSrc,
	avatarAlt = "",
	editLabel = "Edit",
	chatLabel = "Chat with agent",
	onEdit,
	onChat,
	className,
	...props
}: Readonly<AgentCardProps>): ReactElement {
	return (
		<section
			aria-label={`${name} agent card`}
			className={cn(
				"relative flex w-full max-w-[362px] flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-sm",
				className,
			)}
			data-slot="agent-card"
			{...props}
		>
			<div
				aria-hidden="true"
				className="relative h-12 shrink-0 overflow-hidden"
				style={{ backgroundColor: token("color.icon.accent.blue") }}
			>
				<Image
					alt=""
					aria-hidden
					className="absolute top-1/2 left-[76%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
					height={192}
					src={coverSrc}
					width={168}
				/>
			</div>

			<div className="flex flex-col gap-4 bg-surface-raised pt-6">
				<div className="flex flex-col gap-1 px-4 pt-2">
					<h3 className="truncate text-[20px] leading-6 font-bold text-text">
						{name}
					</h3>
					<p className="text-xs leading-4 text-text-subtle">
						By <span className="text-link">{partnerName}</span>
					</p>
				</div>
				<p className="px-4 pb-4 text-sm leading-5 text-text">
					{description}
				</p>
			</div>

			<footer className="flex items-center justify-end gap-2 border-t border-border p-4">
				<Button variant="outline" onClick={onEdit} type="button">
					{editLabel}
				</Button>
				<Button onClick={onChat} type="button">
					{chatLabel}
				</Button>
			</footer>

			<div className="absolute top-6 left-4 size-12" aria-hidden={avatarAlt === ""}>
				<Image
					alt={avatarAlt}
					className="h-12 w-[42px]"
					height={48}
					src={avatarSrc}
					width={42}
				/>
				<span
					className="absolute right-px bottom-0 flex size-4 items-center justify-center rounded-lg border-[1.5px] border-surface"
					style={{ backgroundColor: token("color.icon.brand") }}
				>
					<span className="flex size-2 items-center justify-center overflow-hidden text-text-inverse">
						<AtlassianLogo
							appearance="inverse"
							label=""
							name="atlassian"
							shouldUseNewLogoDesign
							size="xxsmall"
							themeAware={false}
						/>
					</span>
				</span>
			</div>
		</section>
	);
}

export { AgentCard };
