"use client";

import { useState } from "react";
import { ProgressRovo } from "@/components/ui/progress-rovo";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export default function ProgressRovoDemo() {
	return <ProgressRovo isIndeterminate className="w-full max-w-md" />;
}

export function ProgressRovoDemoControlled() {
	const [value, setValue] = useState(50);

	return (
		<div className="flex w-full flex-col gap-4">
			<ProgressRovo value={value} />
			<Slider value={value} onValueChange={(v) => setValue(v as number)} min={0} max={100} step={1} />
		</div>
	);
}

export function ProgressRovoDemoTransition() {
	const [isIndeterminate, setIsIndeterminate] = useState(true);

	return (
		<div className="flex w-full flex-col gap-4">
			<ProgressRovo isIndeterminate={isIndeterminate} value={isIndeterminate ? null : 100} />
			<Button variant="default" size="sm" onClick={() => setIsIndeterminate((prev) => !prev)} className="w-fit">
				{isIndeterminate ? "Complete" : "Reset"}
			</Button>
		</div>
	);
}
