"use client";

import { RovoAppSurfaceShell } from "@/components/projects/rovo-app/components/rovo-app-surface-shell";
import { MemoriesSurfacePage } from "@/components/projects/control-plane/memories-surface";

export default function RovoAppMemoriesPage() {
	return (
		<RovoAppSurfaceShell>
			<MemoriesSurfacePage />
		</RovoAppSurfaceShell>
	);
}
