"use client";

import { RovoAppQueueBoundary } from "@/app/rovo-app/rovo-app-queue-provider";
import { RovoAppShell } from "@/components/projects/rovo/components/rovo-app-shell";

interface RovoPageProps {
	embedded?: boolean;
	initialThreadId?: string | null;
}

export default function RovoPage({
	embedded = false,
	initialThreadId = null,
}: Readonly<RovoPageProps>) {
	return (
		<RovoAppQueueBoundary>
			<RovoAppShell
				embedded={embedded}
				initialThreadId={initialThreadId}
			/>
		</RovoAppQueueBoundary>
	);
}
