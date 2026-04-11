"use client";

import { lazy, Suspense } from "react";
import type { PreviewVideoBody } from "@/components/projects/shared/lib/generative-widget";
import { cn } from "@/lib/utils";

const Player = lazy(() =>
	import("@remotion/player").then((mod) => ({ default: mod.Player }))
);

interface VideoPreviewBodyProps {
	readonly body: PreviewVideoBody;
	readonly withContainer?: boolean;
}

function VideoComposition(props: Record<string, unknown>) {
	const clips = (props.clips ?? []) as NonNullable<PreviewVideoBody["clips"]>;

	return (
		<div className="flex h-full w-full items-center justify-center bg-bg-neutral-bold text-text-inverse">
			<div className="text-center">
				<p className="text-lg font-semibold">Video Timeline</p>
				<p className="text-sm text-text-subtlest">
					{clips.length} clip{clips.length === 1 ? "" : "s"}
				</p>
			</div>
		</div>
	);
}

export function VideoPreviewBody({ body, withContainer = true }: VideoPreviewBodyProps) {
	const composition = body.composition;
	const clips = body.clips ?? [];

	if (body.videoUrl) {
		return (
			<div className={cn(withContainer && "overflow-hidden rounded-md")}>
				<video
					className="h-auto max-h-[360px] w-full rounded-md bg-bg-neutral"
					controls
					playsInline
					preload="metadata"
					poster={body.posterUrl}
				>
					<source
						src={body.videoUrl}
						type={body.mimeType || "video/mp4"}
					/>
				</video>
			</div>
		);
	}

	if (!composition) {
		return null;
	}

	return (
		<div className={cn(withContainer && "overflow-hidden rounded-md")}>
			<Suspense
				fallback={
					<div
						className="flex items-center justify-center bg-bg-neutral"
						style={{
							aspectRatio: `${composition.width}/${composition.height}`,
							maxHeight: 360,
						}}
					>
						<p className="text-sm text-text-subtle">Loading video player...</p>
					</div>
				}
			>
				<Player
					component={VideoComposition}
					inputProps={{ clips }}
					durationInFrames={composition.durationInFrames}
					fps={composition.fps}
					compositionWidth={composition.width}
					compositionHeight={composition.height}
					controls
					style={{
						width: "100%",
						maxHeight: 360,
						aspectRatio: `${composition.width}/${composition.height}`,
					}}
				/>
			</Suspense>
		</div>
	);
}
