"use client";

import {
	AudioPlayerButton,
	AudioPlayerDuration,
	AudioPlayerProgress,
	AudioPlayerProvider,
	AudioPlayerSpeed,
	AudioPlayerSpeedButtonGroup,
	AudioPlayerTime,
	exampleTracks,
	useAudioPlayer,
} from "@/components/ui-audio/audio-player";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
	AUDIO_PLAYER_ITEM,
	DEMO_TRACK_TITLE,
	DemoSurface,
} from "./demo-data";

const PLAYLIST_ITEMS = exampleTracks.map((track) => ({
	id: track.id,
	src: track.url,
	data: track,
}));

type PlaylistItem = (typeof PLAYLIST_ITEMS)[number];
type PlaylistTrack = PlaylistItem["data"];

function PlaylistTrackButton({
	item,
	index,
}: Readonly<{
	item: PlaylistItem;
	index: number;
}>) {
	const player = useAudioPlayer<PlaylistTrack>();
	const isSelected = player.isItemActive(item.id);

	return (
		<button
			type="button"
			aria-pressed={isSelected}
			className={cn(
				"flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors sm:h-9 sm:gap-4",
				isSelected
					? "bg-surface shadow-sm"
					: "hover:bg-bg-neutral-subtle-hovered"
			)}
			onClick={() => {
				void player.setActiveItem(item);
			}}
		>
			<span
				className={cn(
					"w-4 text-left text-xs tabular-nums sm:w-6 sm:text-sm",
					isSelected ? "text-text-subtle" : "text-text-subtlest"
				)}
			>
				{index + 1}
			</span>
			<span className="truncate text-xl font-medium tracking-tight text-text sm:text-2xl">
				{item.data.name}
			</span>
		</button>
	);
}

function AudioPlayerPlaylistPreview() {
	const player = useAudioPlayer<PlaylistTrack>();
	const activeItem = player.activeItem;
	const activeTrack = activeItem?.data ?? null;
	const hasActiveTrack = activeItem !== null;

	return (
		<DemoSurface className="mx-auto w-full max-w-[920px] gap-0 overflow-hidden rounded-[28px] border-border bg-surface p-0 shadow-sm">
			<div className="flex flex-col lg:h-[180px] lg:flex-row">
				<div className="border-border bg-bg-neutral-subtle/30 border-b lg:w-64 lg:border-r lg:border-b-0">
					<ScrollArea className="h-48 lg:h-full">
						<div className="flex flex-col gap-1 p-3">
							{PLAYLIST_ITEMS.map((item, index) => (
								<PlaylistTrackButton key={item.id} item={item} index={index} />
							))}
						</div>
					</ScrollArea>
				</div>

				<div className="flex flex-1 items-center p-4 sm:p-6">
					<div className="flex w-full max-w-2xl flex-col gap-4">
						<h3 className="text-base font-semibold tracking-tight text-text sm:text-lg">
							{activeTrack?.name ?? "No track selected"}
						</h3>

						<div className="flex items-center gap-3 sm:gap-4">
						<AudioPlayerButton
							aria-label={
								hasActiveTrack
									? `Play ${activeTrack?.name}`
									: "Select a track to preview"
							}
							className="h-12 w-12 shrink-0 rounded-2xl px-0 sm:h-10 sm:w-10 [&_svg]:size-5 sm:[&_svg]:size-4"
							disabled={!hasActiveTrack}
							item={activeItem ?? undefined}
							size="default"
							variant="outline"
						/>

						<div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
							<AudioPlayerTime className="shrink-0 text-xs sm:text-sm" />
							<AudioPlayerProgress className="flex-1" />
							<AudioPlayerDuration className="shrink-0 text-right text-xs sm:text-sm" />
						</div>

						<AudioPlayerSpeed
							aria-label="Playback speed"
							className="shrink-0 text-icon-subtle hover:text-text"
							disabled={!hasActiveTrack}
							size="icon"
							variant="ghost"
						/>
					</div>
				</div>
				</div>
			</div>
		</DemoSurface>
	);
}

function AudioPlayerCompactPreview({
	showSpeedButtons = false,
}: Readonly<{ showSpeedButtons?: boolean }>) {
	return (
		<AudioPlayerProvider>
			<DemoSurface className="mx-auto w-full max-w-[720px] rounded-[28px] p-4 sm:p-5">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<AudioPlayerButton
						aria-label={`Play ${DEMO_TRACK_TITLE}`}
						item={AUDIO_PLAYER_ITEM}
						size="default"
						variant="outline"
						className="h-12 w-12 shrink-0 rounded-2xl px-0 sm:h-10 sm:w-10 [&_svg]:size-5 sm:[&_svg]:size-4"
					/>
					<div className="flex min-w-0 flex-1 flex-col gap-3">
						<p className="truncate text-base font-semibold tracking-tight text-text sm:text-lg">
							{DEMO_TRACK_TITLE}
						</p>
						<AudioPlayerProgress />
					</div>
					<div className="flex shrink-0 items-center gap-2 text-xs text-text-subtle sm:text-sm">
						<AudioPlayerTime className="text-xs sm:text-sm" />
						<span className="text-text-subtlest">/</span>
						<AudioPlayerDuration className="text-xs sm:text-sm" />
					</div>
					<AudioPlayerSpeed
						aria-label="Playback speed"
						className="shrink-0 text-icon-subtle hover:text-text"
						size="icon"
					/>
				</div>
				{showSpeedButtons ? (
					<AudioPlayerSpeedButtonGroup className="flex-wrap" />
				) : null}
			</DemoSurface>
		</AudioPlayerProvider>
	);
}

export default function AudioPlayerDemo() {
	return (
		<AudioPlayerProvider>
			<AudioPlayerPlaylistPreview />
		</AudioPlayerProvider>
	);
}

export function AudioPlayerDemoDefault() {
	return <AudioPlayerCompactPreview showSpeedButtons />;
}

export function AudioPlayerDemoCompact() {
	return <AudioPlayerCompactPreview />;
}
