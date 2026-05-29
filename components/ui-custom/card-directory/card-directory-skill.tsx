"use client";

import { type ReactNode } from "react";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { IconTile, type IconTileVariant } from "@/components/ui/icon-tile";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryHeader,
	CardDirectoryMoreButton,
	CardDirectoryStat,
	formatCompact,
} from "./card-directory-parts";

export interface CardDirectorySkillProps {
	name: string;
	/** Core icon element rendered inside the leading icon tile. */
	icon: ReactNode;
	iconVariant?: IconTileVariant;
	publisher: string;
	/** Small publisher logo shown beside the publisher name in the footer. */
	publisherLogo?: ReactNode;
	description?: string;
	starCount?: number;
	viewCount?: number;
	onSelect?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

/** Skill directory card — icon tile, publisher attribution, and usage stats. */
export function CardDirectorySkill({
	name,
	icon,
	iconVariant = "gray",
	publisher,
	publisherLogo,
	description,
	starCount,
	viewCount,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectorySkillProps>) {
	const showStars = typeof starCount === "number";
	const showViews = typeof viewCount === "number";

	return (
		<CardDirectory className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<CardDirectoryHeader
				action={
					onMoreActions ? (
						<CardDirectoryMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
					) : null
				}
				leading={<IconTile aria-hidden icon={icon} label={name} size="small" variant={iconVariant} />}
				title={name}
			/>

			<CardDirectoryDescription>
				{description ?? `Learn how ${name} can help your team work faster.`}
			</CardDirectoryDescription>

			<CardDirectoryFooter className="justify-between">
				<span className="inline-flex min-w-0 items-center gap-1 text-text-subtle">
					{publisherLogo ?? null}
					<span className="truncate">{publisher}</span>
				</span>
				{showStars || showViews ? (
					<span className="inline-flex shrink-0 items-center gap-4">
						{showStars ? (
							<CardDirectoryStat
								icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
							>
								{formatCompact(starCount)}
							</CardDirectoryStat>
						) : null}
						{showViews ? (
							<CardDirectoryStat
								icon={<EyeOpenIcon label="" size="small" spacing="none" color="currentColor" />}
							>
								{formatCompact(viewCount)}
							</CardDirectoryStat>
						) : null}
					</span>
				) : null}
			</CardDirectoryFooter>
		</CardDirectory>
	);
}
