"use client";

import { RovoAppQueueBoundary } from "@/app/rovo-app/rovo-app-queue-provider";
import { RovoAppShell } from "@/components/projects/rovo-app/components/rovo-app-shell";

interface RovoAppPageProps {
	embedded?: boolean;
	initialThreadId?: string | null;
}

export default function RovoAppPage({
	embedded = false,
	initialThreadId = null,
}: Readonly<RovoAppPageProps>) {
	return (
		<RovoAppQueueBoundary>
			<RovoAppShell
				embedded={embedded}
				initialThreadId={initialThreadId}
			/>
		</RovoAppQueueBoundary>
	);
}
