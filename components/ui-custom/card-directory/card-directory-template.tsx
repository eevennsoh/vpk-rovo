"use client";

import { type ReactNode } from "react";
import Image from "next/image";

import { SkillTag, SkillTagGroup, type SkillTagColor } from "@/components/ui-custom/skill-tag";
import { TwgToolSourceStack, type TwgToolSource } from "@/components/ui-custom/twg-tool";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryDescription,
	CardDirectoryHeader,
	CardDirectorySection,
} from "./card-directory-parts";

export interface CardDirectoryTemplateSkill {
	label: string;
	color?: SkillTagColor;
	icon?: ReactNode;
}

export interface CardDirectoryTemplateProps {
	name: string;
	/** Rich icon image source rendered at 32px. */
	iconSrc: string;
	description?: string;
	/** Connected data sources shown in the "Works with" section. */
	sources?: ReadonlyArray<TwgToolSource>;
	/** Skill tags shown in the "Skills" section. */
	skills?: ReadonlyArray<CardDirectoryTemplateSkill>;
	onSelect?: () => void;
	className?: string;
}

/**
 * Agent-template directory card — rich icon, "Works with" sources, and "Skills"
 * tags. A flat take on the studio bento tile (without the card glow effect).
 */
export function CardDirectoryTemplate({
	name,
	iconSrc,
	description,
	sources = [],
	skills = [],
	onSelect,
	className,
}: Readonly<CardDirectoryTemplateProps>) {
	return (
		<CardDirectory className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<CardDirectoryHeader
				leading={
					<Image alt="" aria-hidden className="size-8 object-contain" height={32} src={iconSrc} width={32} />
				}
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
		</CardDirectory>
	);
}
