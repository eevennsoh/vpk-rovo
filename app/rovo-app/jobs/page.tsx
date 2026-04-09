"use client";

import { RovoAppSurfaceShell } from "@/components/projects/rovo-app/components/rovo-app-surface-shell";
import { JobsSurfacePage } from "@/components/projects/control-plane/jobs-surface";

export default function RovoAppJobsPage() {
	return (
		<RovoAppSurfaceShell>
			<JobsSurfacePage />
		</RovoAppSurfaceShell>
	);
}
