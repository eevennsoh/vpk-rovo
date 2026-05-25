"use client";

import { Suspense } from "react";
import { RovoAppSurfaceShell } from "@/components/projects/studio/components/rovo-app-surface-shell";
import { MemoriesSurfacePage } from "@/components/projects/control-plane/memories-surface";

export default function RovoAppMemoriesPage() {
	return (
		<RovoAppSurfaceShell>
			<Suspense>
				<MemoriesSurfacePage />
			</Suspense>
		</RovoAppSurfaceShell>
	);
}
