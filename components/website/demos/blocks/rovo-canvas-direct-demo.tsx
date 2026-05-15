"use client";

import { useState } from "react";

import { RovoCanvas } from "@/components/blocks/rovo-canvas/page";
import { Button } from "@/components/ui/button";

export default function RovoCanvasDirectDemo(): React.ReactElement {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex h-full min-h-[520px] w-full items-center justify-center bg-surface p-6">
			<Button onClick={() => setOpen(true)}>
				Open Rovo canvas
			</Button>
			<RovoCanvas
				open={open}
				onOpenChange={setOpen}
				kind="dashboard"
				title="Dashboard artefact"
			/>
		</div>
	);
}
