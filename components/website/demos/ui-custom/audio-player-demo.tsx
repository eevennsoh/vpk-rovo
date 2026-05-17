import {
	AudioPlayer,
	AudioPlayerControlBar,
	AudioPlayerDurationDisplay,
	AudioPlayerElement,
	AudioPlayerMuteButton,
	AudioPlayerPlayButton,
	AudioPlayerSeekBackwardButton,
	AudioPlayerSeekForwardButton,
	AudioPlayerTimeDisplay,
	AudioPlayerTimeRange,
	AudioPlayerVolumeRange,
} from "@/components/ui-custom/audio-player";

const SAMPLE_AUDIO =
	"https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3";

export default function AudioPlayerDemo() {
	return (
		<AudioPlayer>
			<AudioPlayerElement src={SAMPLE_AUDIO} />
			<AudioPlayerControlBar>
				<AudioPlayerPlayButton />
				<AudioPlayerTimeDisplay />
				<AudioPlayerTimeRange />
				<AudioPlayerDurationDisplay />
			</AudioPlayerControlBar>
		</AudioPlayer>
	);
}

export function AudioPlayerDemoFull() {
	return (
		<AudioPlayer>
			<AudioPlayerElement src={SAMPLE_AUDIO} />
			<AudioPlayerControlBar>
				<AudioPlayerSeekBackwardButton />
				<AudioPlayerPlayButton />
				<AudioPlayerSeekForwardButton />
				<AudioPlayerTimeDisplay />
				<AudioPlayerTimeRange />
				<AudioPlayerDurationDisplay />
				<AudioPlayerMuteButton />
				<AudioPlayerVolumeRange />
			</AudioPlayerControlBar>
		</AudioPlayer>
	);
}

export function AudioPlayerDemoCompact() {
	return (
		<AudioPlayer>
			<AudioPlayerElement src={SAMPLE_AUDIO} />
			<AudioPlayerControlBar>
				<AudioPlayerPlayButton />
				<AudioPlayerTimeRange />
				<AudioPlayerTimeDisplay />
			</AudioPlayerControlBar>
		</AudioPlayer>
	);
}

export function AudioPlayerDemoWithVolume() {
	return (
		<AudioPlayer>
			<AudioPlayerElement src={SAMPLE_AUDIO} />
			<AudioPlayerControlBar>
				<AudioPlayerPlayButton />
				<AudioPlayerTimeDisplay />
				<AudioPlayerTimeRange />
				<AudioPlayerDurationDisplay />
				<AudioPlayerMuteButton />
				<AudioPlayerVolumeRange />
			</AudioPlayerControlBar>
		</AudioPlayer>
	);
}
