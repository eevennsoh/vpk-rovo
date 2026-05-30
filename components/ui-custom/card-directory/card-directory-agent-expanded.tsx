"use client";

import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SkillTag, SkillTagGroup } from "@/components/ui-custom/skill-tag";
import { TwgToolSourceStack, type TwgToolSource } from "@/components/ui-custom/twg-tool";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryBanner,
	CardDirectoryByline,
	CardDirectoryCapabilities,
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryHeader,
	CardDirectoryMoreButton,
	CardDirectorySection,
	CardDirectoryStat,
	formatCompact,
} from "./card-directory-parts";
import { type CardDirectoryTemplateSkill } from "./card-directory-template";

export interface CardDirectoryAgentExpandedProps {
	name: string;
	avatarSrc: string;
	publisher: string;
	description?: string;
	/** Capability lines rendered as a scrollable list. */
	capabilities: readonly string[];
	/** Optional label above the capabilities list. Omit to render the bare list. */
	capabilitiesLabel?: string;
	/** Connected data sources shown in the "Works with" section. */
	sources?: ReadonlyArray<TwgToolSource>;
	/** Skill tags shown in the "Skills" section. */
	skills?: ReadonlyArray<CardDirectoryTemplateSkill>;
	/** Footer metadata blocks (value over label), e.g. remix count, last update. */
	stats?: ReadonlyArray<{ value: string; label: string }>;
	/** Collaborator avatars shown at the footer's trailing edge. */
	collaborators?: ReadonlyArray<{ src: string; name: string }>;
	/** Overflow count appended to the collaborator group (e.g. 4 → "+4"). */
	collaboratorOverflow?: number;
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
	sources = [],
	skills = [],
	stats = [],
	collaborators = [],
	collaboratorOverflow,
	coverBackgroundColor,
	verified = false,
	rating,
	feedbackCount,
	chatCount,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectoryAgentExpandedProps>) {
	const showStats = stats.length > 0;
	const showRating = !showStats && typeof rating === "number";
	const showChats = !showStats && typeof chatCount === "number";
	const showCollaborators = collaborators.length > 0;
	const showFooter = showStats || showRating || showChats || showCollaborators;

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

			{sources.length > 0 ? (
				<CardDirectorySection label="Works with">
					<TwgToolSourceStack className="justify-start" iconSize="md" maxVisible={6} sources={sources} />
				</CardDirectorySection>
			) : null}

			{skills.length > 0 ? (
				<CardDirectorySection label="Skills">
					<SkillTagGroup>
						{skills.map((skill) => (
							<SkillTag color={skill.color ?? "default"} icon={skill.icon} key={skill.label}>
								{skill.label}
							</SkillTag>
						))}
					</SkillTagGroup>
				</CardDirectorySection>
			) : null}

			<Separator />

			<CardDirectoryCapabilities items={capabilities} label={capabilitiesLabel} />

			{showFooter ? (
				<>
					<Separator />
					<CardDirectoryFooter className="justify-between">
						<div className="flex items-center gap-6">
							{showStats ? (
								stats.map((stat) => (
									<div className="flex flex-col" key={stat.label}>
										<span className="text-sm font-semibold leading-5 text-text">{stat.value}</span>
										<span className="leading-4">{stat.label}</span>
									</div>
								))
							) : (
								<div className="flex items-center gap-4">
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
								</div>
							)}
						</div>
						{showCollaborators ? (
							<AvatarGroup label="Collaborators">
								{collaborators.map((person) => (
									<Avatar key={person.src} size="sm">
										<AvatarImage alt={person.name} src={person.src} />
										<AvatarFallback>{person.name.slice(0, 2)}</AvatarFallback>
									</Avatar>
								))}
								{typeof collaboratorOverflow === "number" ? (
									<AvatarGroupCount>+{collaboratorOverflow}</AvatarGroupCount>
								) : null}
							</AvatarGroup>
						) : null}
					</CardDirectoryFooter>
				</>
			) : null}
		</CardDirectory>
	);
}
