"use client";

import { RovoAppQueueBoundary } from "@/app/studio/rovo-queue-provider";
import { RovoAppShell } from "@/components/projects/studio/components/rovo-app-shell";

interface StudioPageProps {
	embedded?: boolean;
	initialThreadId?: string | null;
}

export default function StudioPage({
	embedded = false,
	initialThreadId = null,
}: Readonly<StudioPageProps>) {
	return (
		<RovoAppQueueBoundary>
			<RovoAppShell
				embedded={embedded}
				initialThreadId={initialThreadId}
			/>
		</RovoAppQueueBoundary>
	);
}
