"use client";

import { cn } from "@/lib/utils";
import {
	AudioWaveformIcon,
	LoaderCircleIcon,
	MessageSquareDiffIcon,
	MicIcon,
} from "@/components/ui/vpk-icons";

export type FutureChatSteeringPhase =
	| "idle"
	| "listening"
	| "transcribing"
	| "pending"
	| "applying";

interface FutureChatSteeringLaneProps {
	className?: string;
	phase: Exclude<FutureChatSteeringPhase, "idle">;
	text?: string | null;
}

const PHASE_COPY: Record<
	Exclude<FutureChatSteeringPhase, "idle">,
	{
		description: string;
		label: string;
	}
> = {
	listening: {
		label: "Listening for steer",
		description: "The active artifact keeps generating while you speak.",
	},
	transcribing: {
		label: "Transcribing steer",
		description: "Finalizing the voice steer before redirecting the artifact.",
	},
	pending: {
		label: "Pending steer",
		description: "The steer is ready to apply to the current artifact workspace.",
	},
	applying: {
		label: "Applying steer",
		description: "Saving a checkpoint and redirecting the artifact.",
	},
};

function renderPhaseIcon(phase: Exclude<FutureChatSteeringPhase, "idle">) {
	if (phase === "listening") {
		return <MicIcon className="size-4" />;
	}

	if (phase === "pending") {
		return <MessageSquareDiffIcon className="size-4" />;
	}

	if (phase === "applying") {
		return <LoaderCircleIcon className="size-4 animate-spin" />;
	}

	return <AudioWaveformIcon className="size-4" />;
}

export function FutureChatSteeringLane({
	className,
	phase,
	text,
}: Readonly<FutureChatSteeringLaneProps>) {
	const copy = PHASE_COPY[phase];

	return (
		<div
			className={cn(
				"rounded-[24px] border border-border bg-surface-raised/95 px-4 py-3 shadow-sm backdrop-blur",
				className,
			)}
		>
			<div className="flex items-start gap-3">
				<div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-text">
					{renderPhaseIcon(phase)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<p className="font-medium text-sm text-text">{copy.label}</p>
						<span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-text-subtle uppercase tracking-[0.16em]">
							Voice steer
						</span>
					</div>
					<p className="mt-1 text-sm text-text-subtle">{copy.description}</p>
					{text ? (
						<div className="mt-3 rounded-2xl border border-border/70 bg-background/90 px-3 py-2 text-sm text-text">
							{text}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
