"use client";

import { useEffect, useState } from "react";
import {
	type AgentState,
	BarVisualizer,
} from "@/components/ui-audio/bar-visualizer";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const BAR_STATES: AgentState[] = [
	"connecting",
	"initializing",
	"listening",
	"speaking",
	"thinking",
];

function formatStateLabel(state: AgentState) {
	return state.charAt(0).toUpperCase() + state.slice(1);
}

function BarVisualizerPreview({
	initialState = "listening",
	centerAlign = false,
	showControls = true,
	title = "Audio Frequency Visualizer",
	description = "Real-time frequency band visualization with animated state transitions",
}: Readonly<{
	initialState?: AgentState;
	centerAlign?: boolean;
	showControls?: boolean;
	title?: string;
	description?: string;
}>) {
	const [state, setState] = useState<AgentState>(initialState);

	useEffect(() => {
		setState(initialState);
	}, [initialState]);

	return (
		<Card className="mx-auto w-full max-w-xl gap-6 py-6">
			<CardHeader className="px-6">
				<CardTitle>{title}</CardTitle>
				<CardDescription className="text-text-subtle">
					{description}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4 px-6">
				<BarVisualizer
					barCount={20}
					centerAlign={centerAlign}
					className="h-40 max-w-full bg-bg-neutral"
					demo
					state={state}
				/>
				{showControls ? (
					<div className="flex flex-wrap gap-2">
						{BAR_STATES.map((nextState) => (
							<Button
								key={nextState}
								aria-pressed={state === nextState}
								onClick={() => {
									setState(nextState);
								}}
								size="sm"
								variant={state === nextState ? "default" : "outline"}
							>
								{formatStateLabel(nextState)}
							</Button>
						))}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

export default function BarVisualizerDemo() {
	return <BarVisualizerPreview />;
}

export function BarVisualizerDemoSpeaking() {
	return (
		<BarVisualizerPreview
			centerAlign
			description="Centered demo mode for higher-energy playback or agent speech."
			initialState="speaking"
			showControls={false}
			title="Speaking Visualizer"
		/>
	);
}
