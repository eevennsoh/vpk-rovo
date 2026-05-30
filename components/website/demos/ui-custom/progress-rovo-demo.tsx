"use client";

import { useState } from "react";
import { ProgressRovo } from "@/components/ui-custom/progress-rovo";
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

const transitionSteps = [
	{ value: 0, label: "0%", indeterminate: true },
	{ value: 30, label: "30%", indeterminate: false },
	{ value: 60, label: "60%", indeterminate: false },
	{ value: 100, label: "100%", indeterminate: false },
] as const;

export function ProgressRovoDemoTransition() {
	const [stepIndex, setStepIndex] = useState(0);
	const step = transitionSteps[stepIndex];

	return (
		<div className="flex w-full flex-col gap-4">
			<ProgressRovo isIndeterminate={step.indeterminate} value={step.indeterminate ? null : step.value} />
			<div className="flex gap-2">
				{transitionSteps.map((s, i) => (
					<Button
						key={s.label}
						variant={i === stepIndex ? "default" : "outline"}
						size="sm"
						onClick={() => setStepIndex(i)}
					>
						{s.label}
					</Button>
				))}
			</div>
		</div>
	);
}
