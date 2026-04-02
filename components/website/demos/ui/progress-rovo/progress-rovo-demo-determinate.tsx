"use client";

import { ProgressRovo } from "@/components/ui/progress-rovo";

export default function ProgressRovoDemoDeterminate() {
	return (
		<div className="flex w-full flex-col gap-4">
			<ProgressRovo value={25} />
			<ProgressRovo value={50} />
			<ProgressRovo value={75} />
		</div>
	);
}
