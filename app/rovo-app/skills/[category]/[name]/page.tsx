"use client";

import { use } from "react";
import { RovoAppSurfaceShell } from "@/components/projects/rovo-app/components/rovo-app-surface-shell";
import { SkillsSurfacePage } from "@/components/projects/control-plane/skills-surface";

interface SkillDetailPageProps {
	params: Promise<{ category: string; name: string }>;
}

export default function RovoAppSkillDetailPage({ params }: Readonly<SkillDetailPageProps>) {
	const { category, name } = use(params);
	return (
		<RovoAppSurfaceShell>
			<SkillsSurfacePage initialCategory={category} initialSlug={name} />
		</RovoAppSurfaceShell>
	);
}
