"use client";

import { type ReactNode } from "react";
import WrenchIcon from "@atlaskit/icon-lab/core/wrench";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";

import { Tile } from "@/components/ui/tile";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryHeader,
	CardDirectoryMoreButton,
	CardDirectoryStat,
} from "./card-directory-parts";

export interface CardDirectoryToolProps {
	name: string;
	/** App logo element rendered inside the leading tile. */
	appLogo: ReactNode;
	description?: string;
	toolCount?: number;
	teammateCount?: number;
	onSelect?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

/** Tool/app directory card — app logo tile, tool count, and teammate usage. */
export function CardDirectoryTool({
	name,
	appLogo,
	description,
	toolCount,
	teammateCount,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectoryToolProps>) {
	const showTools = typeof toolCount === "number";
	const showTeammates = typeof teammateCount === "number";

	return (
		<CardDirectory className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<CardDirectoryHeader
				action={
					onMoreActions ? (
						<CardDirectoryMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
					) : null
				}
				leading={
					<Tile isInset={false} label={name} size="small" variant="transparent">
						{appLogo}
					</Tile>
				}
				title={name}
			/>

			<CardDirectoryDescription>
				{description ?? `Learn how ${name} can help your team work faster.`}
			</CardDirectoryDescription>

			{showTools || showTeammates ? (
				<CardDirectoryFooter>
					{showTools ? (
						<CardDirectoryStat
							icon={<WrenchIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{toolCount} tools
						</CardDirectoryStat>
					) : null}
					{showTeammates ? (
						<CardDirectoryStat
							icon={<PeopleGroupIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							Used by {teammateCount} teammates
						</CardDirectoryStat>
					) : null}
				</CardDirectoryFooter>
			) : null}
		</CardDirectory>
	);
}
