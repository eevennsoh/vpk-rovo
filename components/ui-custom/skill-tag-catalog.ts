import type { ReactNode } from "react";

import { getCreatedSkills } from "@/app/data/directory/created-skills-store";
import {
	DEFAULT_SKILLS,
	getSkillCollectionId,
	getSkillIcon,
	slugifySkillName,
} from "@/app/data/directory/skills";
import type { SkillTagColor } from "@/components/ui-custom/skill-tag";

/** Resolves a skill label to the catalog-owned collection color and icon. */
export function getSkillTagCatalogProps(label: string): {
	color: SkillTagColor;
	icon: ReactNode;
} {
	const normalized = slugifySkillName(label);
	// Include runtime-created skills so a freshly generated skill keeps its
	// collection treatment everywhere the shared SkillTag is rendered.
	const skill = [...DEFAULT_SKILLS, ...getCreatedSkills()].find(
		(entry) => entry.id === normalized || slugifySkillName(entry.name) === normalized,
	);

	return {
		color: skill ? getSkillCollectionId(skill) : "default",
		icon: getSkillIcon(skill?.icon ?? "page"),
	};
}
