"use client";

import { useState } from "react";
import { useIsMounted } from "@/components/hooks/use-is-mounted";
import { token } from "@/lib/tokens";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tag, type TagColor } from "@/components/ui/tag";
import PriorityMajorIcon from "@atlaskit/icon/core/priority-major";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import PriorityMinorIcon from "@atlaskit/icon/core/priority-minor";
import TaskIcon from "@atlaskit/icon/core/task";

type LegacyTagColor = TagColor | "lime" | "magenta";

interface TagData {
	text: string;
	color?: LegacyTagColor;
}

interface KanbanCardProps {
	title: string;
	code: string;
	tags?: TagData[];
	priority: "major" | "medium" | "minor";
	avatarSrc?: string;
	isDragging?: boolean;
	onClick?: () => void;
	onDragStart?: () => void;
	onDragEnd?: () => void;
}

function normalizeTagColor(color?: LegacyTagColor): TagColor {
	if (color === "lime") {
		return "green";
	}
	if (color === "magenta") {
		return "discovery";
	}
	return color ?? "standard";
}

const PRIORITY_ICONS = {
	major: PriorityMajorIcon,
	medium: PriorityMediumIcon,
	minor: PriorityMinorIcon,
} as const;

const PRIORITY_COLORS = {
	major: token("color.icon.danger"),
	medium: token("color.icon.information"),
	minor: token("color.icon.success"),
} as const;

export default function KanbanCard({
	title,
	code,
	tags,
	priority,
	avatarSrc,
	isDragging,
	onClick,
	onDragStart,
	onDragEnd,
}: Readonly<KanbanCardProps>) {
	const [isHovered, setIsHovered] = useState(false);
	const isMounted = useIsMounted();

	const PriorityIcon = PRIORITY_ICONS[priority];
	const priorityColor = PRIORITY_COLORS[priority];

	return (
		<button
			type="button"
			draggable
			onClick={onClick}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? token("color.background.neutral.subtle.hovered") : token("elevation.surface"),
				borderRadius: token("radius.small"),
				padding: token("space.150"),
				cursor: isDragging ? "grabbing" : "grab",
				boxShadow: token("elevation.shadow.raised"),
				transition: "background-color 0.2s ease",
				border: "none",
				textAlign: "left",
				width: "100%",
				opacity: isDragging ? 0.5 : 1,
			}}
		>
			<div className="flex flex-col gap-2">
				{/* Title */}
				<span className="text-sm">{title}</span>

				{/* Tags */}
				{tags && tags.length > 0 ? (
					<div className="flex gap-1">
						{tags.map((tag, index) => (
							<Tag key={index} color={normalizeTagColor(tag.color)}>
								{tag.text}
							</Tag>
						))}
					</div>
				) : null}

				{/* Footer */}
				<div className="pt-0.5">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<TaskIcon label="Task" color={token("color.icon.brand")} />
							<span className="text-xs font-semibold text-text-subtlest">{code}</span>
						</div>

						<div className="flex items-center gap-1.5">
							<PriorityIcon label={`${priority} priority`} color={priorityColor} />
							{isMounted ? (
								<Avatar size="sm">
									{avatarSrc ? <AvatarImage src={avatarSrc} alt={code} /> : null}
									<AvatarFallback>{code?.[0] ?? "U"}</AvatarFallback>
								</Avatar>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</button>
	);
}
