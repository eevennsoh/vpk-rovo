"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import RefreshIcon from "@atlaskit/icon/core/refresh";
import { Button } from "@/components/ui/button";
import {
	ControlledRovoIllustration,
	RovoIllustration,
	SPOT_ILLUSTRATIONS,
} from "@/components/ui-custom/rovo-illustration";

const NON_CHAT_ILLUSTRATIONS = SPOT_ILLUSTRATIONS.filter(
	(illustration) => illustration.id !== "chat",
);

function IllustrationStage({
	children,
	label,
}: Readonly<{
	children: ReactNode;
	label: string;
	}>) {
	return (
		<div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg bg-surface p-6">
			<div className="flex min-h-[220px] items-center justify-center">
				{children}
			</div>
			<p className="text-sm font-medium text-text-subtle">{label}</p>
		</div>
	);
}

export default function RovoIllustrationDemo() {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<div className="flex h-full w-full flex-col gap-4">
			<div className="flex justify-end">
				<Button
					aria-label="Replay illustration entrance animations"
					onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
					size="sm"
					variant="outline"
				>
					<RefreshIcon label="" size="small" />
					Refresh
				</Button>
			</div>
			<div key={refreshKey} className="flex flex-col gap-4">
				<div className="grid gap-4">
					<IllustrationStage label="Default loop">
						<RovoIllustration illusIds={NON_CHAT_ILLUSTRATIONS.map((illustration) => illustration.id)} size={220} />
					</IllustrationStage>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{NON_CHAT_ILLUSTRATIONS.map((illustration) => (
						<IllustrationStage key={illustration.id} label={illustration.label}>
							<ControlledRovoIllustration illusId={illustration.id} size={180} />
						</IllustrationStage>
					))}
				</div>
			</div>
		</div>
	);
}
