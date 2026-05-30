import * as React from "react";
import CrossIcon from "@atlaskit/icon/core/cross";

import { cn } from "@/lib/utils";

type SkillTagColor = "default" | "2p3p" | "platform" | "teamwork" | "software" | "strategy" | "service" | "product";

const collectionStyles: Record<SkillTagColor, { slash: string; icon: string }> = {
	default: { slash: "bg-border", icon: "text-icon-subtlest" },
	"2p3p": { slash: "bg-border", icon: "text-icon-subtlest" },
	platform: { slash: "bg-border", icon: "text-icon-subtlest" },
	teamwork: { slash: "bg-border-brand", icon: "text-icon-brand" },
	software: { slash: "bg-border-success", icon: "text-icon-success" },
	strategy: { slash: "bg-border-warning", icon: "text-icon-warning" },
	service: { slash: "bg-yellow-400", icon: "text-yellow-400" },
	product: { slash: "bg-border-discovery", icon: "text-icon-discovery" },
};

interface SkillTagProps extends Omit<React.ComponentProps<"span">, "color"> {
	icon?: React.ReactNode;
	color?: SkillTagColor;
	onRemove?: () => void;
	removeButtonLabel?: string;
}

function SkillTag({ children, icon, color = "default", onClick, onRemove, removeButtonLabel = "Remove", className, ...props }: Readonly<SkillTagProps>) {
	const isInteractive = Boolean(onClick);

	return (
		<span
			{...props}
			onClick={onClick}
			className={cn(
				"relative inline-flex h-5 -skew-x-12 items-center gap-1 rounded-sm bg-bg-neutral py-1 pl-2.5 align-middle text-xs leading-4 font-normal text-text transition-colors",
				onRemove ? "pr-1" : "pr-1.5",
				isInteractive ? "cursor-pointer hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed" : "cursor-default",
				className,
			)}
			data-slot="skill-tag"
		>
			{/* Colored slash bar */}
			<span className={cn("absolute top-0 bottom-0 left-0 z-[1] w-0.5 rounded-l-sm", collectionStyles[color].slash)} />

			{/* Icon */}
			{icon ? (
				<span className={cn("flex size-3 shrink-0 skew-x-12 items-center justify-center [&>svg]:size-3", collectionStyles[color].icon)} data-slot="skill-tag-icon">
					{icon}
				</span>
			) : null}

			{/* Label */}
			<span className="skew-x-12 truncate whitespace-nowrap" data-slot="skill-tag-label">
				{children}
			</span>

			{/* Remove button */}
			{onRemove ? (
				<button
					type="button"
					aria-label={removeButtonLabel}
					onClick={(event) => {
						event.stopPropagation();
						onRemove();
					}}
					className="inline-flex size-3.5 shrink-0 skew-x-12 items-center justify-center rounded-xs text-icon-subtle transition-colors hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed"
					data-slot="skill-tag-remove"
				>
					<CrossIcon label="" size="small" />
				</button>
			) : null}
		</span>
	);
}

type SkillTagGroupProps = React.ComponentProps<"div">;

function SkillTagGroup({ className, ...props }: Readonly<SkillTagGroupProps>) {
	return <div data-slot="skill-tag-group" className={cn("flex flex-wrap gap-1", className)} {...props} />;
}

export { SkillTag, SkillTagGroup, type SkillTagProps, type SkillTagGroupProps, type SkillTagColor };
