"use client";

import { RovoAppSurfaceShell } from "@/components/projects/rovo-app/components/rovo-app-surface-shell";
import { WikiSurfacePage } from "@/components/projects/control-plane/wiki-surface";

export default function RovoAppWikiPage() {
	return (
		<RovoAppSurfaceShell>
			<WikiSurfacePage />
		</RovoAppSurfaceShell>
	);
}
