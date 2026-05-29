"use client";

import Image from "next/image";
import { type KeyboardEvent, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

const OVERLAY_SHADOW = token("elevation.shadow.overlay");
const HOVER_ANIMATION = {
	borderColor: "transparent",
	boxShadow: OVERLAY_SHADOW,
	scale: 1.006,
} as const;
const REDUCED_HOVER_ANIMATION = {
	borderColor: "transparent",
	boxShadow: OVERLAY_SHADOW,
} as const;
const TAP_ANIMATION = {
	scale: 0.998,
} as const;
const HOVER_TRANSITION = {
	type: "spring",
	bounce: 0.16,
	visualDuration: 0.22,
} as const;

function formatCompact(value: number): string {
	if (value >= 10000) return `${Math.round(value / 1000)}K`;
	if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
	return `${value}`;
}

export interface CardDirectoryProps {
	/** Primary title shown in the card heading. */
	name: string;
	/** Avatar image source rendered in the hexagon avatar. */
	avatarSrc: string;
	/** Attribution shown after "By" — typically a publisher, team, or person. */
	publisher: string;
	/** Supporting copy, clamped to two lines. */
	description?: string;
	/** Shows the verified badge next to the publisher when true. */
	verified?: boolean;
	/** Star rating (e.g. 4.6). Rendered with one decimal place. */
	rating?: number;
	/** Count behind the rating, shown as "(N feedback)". */
	feedbackCount?: number;
	/** Count of chats, shown as "N chats". */
	chatCount?: number;
	/** Extra classes applied to the avatar image (e.g. to scale a logo). */
	avatarImageClassName?: string;
	/** Invoked on click / Enter / Space. Presence makes the card a button. */
	onSelect?: () => void;
	/** Invoked from the hover-revealed more-actions button. */
	onMoreActions?: () => void;
	className?: string;
}

/**
 * Directory listing card — avatar, title, attribution, description, and stats.
 *
 * When `onSelect` is provided the whole card becomes a keyboard-operable button
 * (Enter/Space) with a tap animation; otherwise it renders as a static article.
 */
export function CardDirectory({
	name,
	avatarSrc,
	publisher,
	description,
	verified = false,
	rating,
	feedbackCount,
	chatCount,
	avatarImageClassName,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectoryProps>) {
	const interactive = Boolean(onSelect);
	const shouldReduceMotion = useReducedMotion();
	const hoverAnimation = shouldReduceMotion ? REDUCED_HOVER_ANIMATION : HOVER_ANIMATION;
	const tapAnimation = shouldReduceMotion ? undefined : TAP_ANIMATION;

	const handleSelect = () => onSelect?.();
	const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (!interactive) return;
		if (event.key !== "Enter" && event.key !== " ") return;

		event.preventDefault();
		handleSelect();
	};
	const handleMoreActionClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onMoreActions?.();
	};

	const showRating = typeof rating === "number";
	const showChats = typeof chatCount === "number";

	const content = (
		<>
			<div className="flex items-start gap-2">
				<Avatar size="default" shape="hexagon" className="shrink-0">
					<Image
						alt=""
						aria-hidden
						className={cn("size-full object-contain", avatarImageClassName)}
						height={32}
						src={avatarSrc}
						width={32}
					/>
				</Avatar>
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-text" style={{ font: token("font.heading.xsmall") }}>{name}</h3>
					<p className="flex items-center gap-1 text-xs leading-4 text-text-subtle">
						<span>By</span>
						<span className="truncate text-link">{publisher}</span>
						{verified ? (
							<Icon
								className="text-icon-information"
								render={<StatusVerifiedIcon label="Verified" size="small" color="currentColor" />}
							/>
						) : null}
					</p>
				</div>
				{onMoreActions ? (
					<Button
						aria-label={`More actions for ${name}`}
						className="size-6 shrink-0 cursor-pointer opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100"
						onClick={handleMoreActionClick}
						size="icon-xs"
						type="button"
						variant="ghost"
					>
						<ShowMoreHorizontalIcon label="" size="small" />
					</Button>
				) : null}
			</div>

			<p className="line-clamp-2 min-h-10 text-sm leading-5 text-text">
				{description ?? `Learn how ${name} can help your team work faster.`}
			</p>

			{showRating || showChats ? (
				<div className="flex items-center gap-4 text-xs leading-4 text-text-subtlest">
					{showRating ? (
						<span className="inline-flex items-center gap-1">
							<Icon
								className="size-3 text-icon-subtlest [&_svg]:size-3"
								render={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
							/>
							{rating.toFixed(1)}
							{typeof feedbackCount === "number" ? ` (${formatCompact(feedbackCount)} feedback)` : null}
						</span>
					) : null}
					{showChats ? (
						<span className="inline-flex items-center gap-1">
							<Icon
								className="size-3 text-icon-subtlest [&_svg]:size-3"
								render={<AiChatIcon label="" size="small" spacing="none" color="currentColor" />}
							/>
							{formatCompact(chatCount)} chats
						</span>
					) : null}
				</div>
			) : null}
		</>
	);

	const cardClassName = cn(
		"group/card flex h-full w-full flex-col gap-3 rounded-md border border-border bg-surface p-4 text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
		interactive && "cursor-pointer",
		className,
	);
	const cardMotionProps = {
		className: cardClassName,
		style: { willChange: "transform" },
		transition: HOVER_TRANSITION,
		whileHover: hoverAnimation,
	};

	if (interactive) {
		return (
			<motion.article
				aria-label={`Select ${name}`}
				onClick={handleSelect}
				onKeyDown={handleCardKeyDown}
				role="button"
				tabIndex={0}
				whileTap={tapAnimation}
				{...cardMotionProps}
			>
				{content}
			</motion.article>
		);
	}

	return <motion.article {...cardMotionProps}>{content}</motion.article>;
}
