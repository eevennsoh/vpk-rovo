"use client";

import PageIcon from "@atlaskit/icon/core/page";

import { Button } from "@/components/ui/button";
import { SkillCard } from "@/components/ui-custom/skill-card";

export default function SkillCardDemo() {
	return (
		<SkillCard.Root>
			<SkillCard.Trigger render={<Button variant="outline" />}>
				Hover to preview
			</SkillCard.Trigger>
			<SkillCard.Content
				skillName="Create Google Drive document"
				description="Create a document, name it appropriately, and save it to the right folder so teammates can find it."
				icon={{ render: <PageIcon label="" size="small" />, label: "Document" }}
				source={{ type: "app", name: "Google Drive", logoSrc: "/3p/google-drive/16.svg" }}
			/>
		</SkillCard.Root>
	);
}

export function SkillCardDemoAppSource() {
	return (
		<SkillCard.Root>
			<SkillCard.Trigger render={<Button variant="outline" />}>
				App source
			</SkillCard.Trigger>
			<SkillCard.Content
				skillName="Search confluence pages"
				description="Search and rank Confluence pages by relevance to the active project context."
				icon={{ render: <PageIcon label="" size="small" />, label: "Page" }}
				source={{ type: "app", name: "Confluence" }}
			/>
		</SkillCard.Root>
	);
}

export function SkillCardDemoCustomSource() {
	return (
		<SkillCard.Root>
			<SkillCard.Trigger render={<Button variant="outline" />}>
				Custom source
			</SkillCard.Trigger>
			<SkillCard.Content
				skillName="Run compliance checklist"
				description="Validate release notes and confirm the launch checklist before deployment."
				source={{ type: "custom", name: "Maia Ma (You)", avatarSrc: "/avatar-user/01.png" }}
			/>
		</SkillCard.Root>
	);
}

export function SkillCardDemoWithoutDescription() {
	return (
		<SkillCard.Root>
			<SkillCard.Trigger render={<Button variant="outline" />}>
				No description
			</SkillCard.Trigger>
			<SkillCard.Content
				skillName="Trigger CI pipeline"
				source={{ type: "app", name: "Bitbucket" }}
			/>
		</SkillCard.Root>
	);
}
