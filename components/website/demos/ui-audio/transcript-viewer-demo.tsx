"use client";

import { PlayIcon as Play } from "@/components/ui/vpk-icons";
import {
	TranscriptViewerAudio,
	TranscriptViewerContainer,
	TranscriptViewerPlayPauseButton,
} from "@/components/ui-audio/transcript-viewer";
import {
	AUDIO_SAMPLE_URL,
	TRANSCRIPT_ALIGNMENT,
} from "./demo-data";

function SkeletonLine({
	className,
}: Readonly<{ className?: string }>) {
	return (
		<div
			className={`h-5 animate-pulse rounded-md bg-bg-neutral ${className ?? ""}`}
			data-slot="skeleton-line"
		/>
	);
}

function TranscriptViewerPreview() {
	return (
		<div className="mx-auto flex w-full max-w-xl flex-col gap-4">
			<TranscriptViewerContainer
				alignment={TRANSCRIPT_ALIGNMENT}
				audioType="audio/mpeg"
				audioSrc={AUDIO_SAMPLE_URL}
				className="w-full rounded-xl border border-border bg-card p-4"
			>
				<TranscriptViewerAudio className="sr-only" />
				<div className="flex w-full flex-col gap-4">
					<div className="flex flex-col gap-3">
						<SkeletonLine className="w-full" />
						<SkeletonLine className="w-1/2" />
					</div>
					<SkeletonLine className="h-2 w-full" />
					<div className="-mt-1 flex items-center justify-between">
						<SkeletonLine className="h-2 w-6" />
						<SkeletonLine className="h-2 w-6" />
					</div>
				</div>
				<TranscriptViewerPlayPauseButton className="w-full" disabled>
					<>
						<Play className="size-4" />
						Play
					</>
				</TranscriptViewerPlayPauseButton>
			</TranscriptViewerContainer>
		</div>
	);
}

export default function TranscriptViewerDemo() {
	return <TranscriptViewerPreview />;
}

export function TranscriptViewerDemoDefault() {
	return <TranscriptViewerPreview />;
}
