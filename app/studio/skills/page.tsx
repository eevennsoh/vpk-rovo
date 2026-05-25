"use client";

import { RovoAppSurfaceShell } from "@/components/projects/studio/components/rovo-app-surface-shell";
import { SkillsSurfacePage } from "@/components/projects/control-plane/skills-surface";

export default function RovoAppSkillsPage() {
	return (
		<RovoAppSurfaceShell>
			<SkillsSurfacePage />
		</RovoAppSurfaceShell>
	);
}
