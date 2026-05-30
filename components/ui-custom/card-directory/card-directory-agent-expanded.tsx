"use client";

import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryBanner,
	CardDirectoryByline,
	CardDirectoryCapabilities,
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryHeader,
	CardDirectoryMoreButton,
	CardDirectoryStat,
	formatCompact,
} from "./card-directory-parts";

export interface CardDirectoryAgentExpandedProps {
	name: string;
	avatarSrc: string;
	publisher: string;
	description?: string;
	/** Capability lines rendered as a scrollable "what it can do" list. */
	capabilities: readonly string[];
	/** Label above the capabilities list. */
	capabilitiesLabel?: string;
	/** Override the avatar-category-derived cover color. */
	coverBackgroundColor?: string;
	verified?: boolean;
	rating?: number;
	feedbackCount?: number;
	chatCount?: number;
	onSelect?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

/**
 * Expanded agent directory card — cover banner, attribution, a scrollable capabilities
 * list, and rating/chat stats. A more fleshed-out take on `CardDirectoryAgent`.
 */
export function CardDirectoryAgentExpanded({
	name,
	avatarSrc,
	publisher,
	description,
	capabilities,
	capabilitiesLabel,
	coverBackgroundColor,
	verified = false,
	rating,
	feedbackCount,
	chatCount,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectoryAgentExpandedProps>) {
	const showRating = typeof rating === "number";
	const showChats = typeof chatCount === "number";

	return (
		<CardDirectory className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<CardDirectoryBanner avatarSrc={avatarSrc} backgroundColor={coverBackgroundColor} />

			<CardDirectoryHeader
				action={
					onMoreActions ? (
						<CardDirectoryMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
					) : null
				}
				byline={<CardDirectoryByline publisher={publisher} verified={verified} />}
				title={name}
			/>

			<CardDirectoryDescription>
				{description ?? `Learn how ${name} can help your team work faster.`}
			</CardDirectoryDescription>

			<CardDirectoryCapabilities items={capabilities} label={capabilitiesLabel} />

			{showRating || showChats ? (
				<CardDirectoryFooter>
					{showRating ? (
						<CardDirectoryStat
							icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{rating.toFixed(1)}
							{typeof feedbackCount === "number" ? ` (${formatCompact(feedbackCount)} feedback)` : null}
						</CardDirectoryStat>
					) : null}
					{showChats ? (
						<CardDirectoryStat
							icon={<AiChatIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{formatCompact(chatCount)} chats
						</CardDirectoryStat>
					) : null}
				</CardDirectoryFooter>
			) : null}
		</CardDirectory>
	);
}
