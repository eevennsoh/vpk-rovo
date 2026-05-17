"use client";

import {
	Transcription,
	TranscriptionSegment,
} from "@/components/ui-custom/transcription";
import { useEffect, useRef, useState } from "react";

const SAMPLE_SEGMENTS = [
	{ text: "Welcome ", startSecond: 0, endSecond: 0.8 },
	{ text: "to ", startSecond: 0.8, endSecond: 1.0 },
	{ text: "the ", startSecond: 1.0, endSecond: 1.2 },
	{ text: "AI ", startSecond: 1.2, endSecond: 1.5 },
	{ text: "transcription ", startSecond: 1.5, endSecond: 2.2 },
	{ text: "component. ", startSecond: 2.2, endSecond: 3.0 },
	{ text: "It ", startSecond: 3.0, endSecond: 3.2 },
	{ text: "highlights ", startSecond: 3.2, endSecond: 3.8 },
	{ text: "each ", startSecond: 3.8, endSecond: 4.0 },
	{ text: "word ", startSecond: 4.0, endSecond: 4.3 },
	{ text: "as ", startSecond: 4.3, endSecond: 4.5 },
	{ text: "it ", startSecond: 4.5, endSecond: 4.7 },
	{ text: "plays. ", startSecond: 4.7, endSecond: 5.2 },
	{ text: "Click ", startSecond: 5.2, endSecond: 5.6 },
	{ text: "any ", startSecond: 5.6, endSecond: 5.8 },
	{ text: "word ", startSecond: 5.8, endSecond: 6.1 },
	{ text: "to ", startSecond: 6.1, endSecond: 6.3 },
	{ text: "seek ", startSecond: 6.3, endSecond: 6.6 },
	{ text: "to ", startSecond: 6.6, endSecond: 6.8 },
	{ text: "that ", startSecond: 6.8, endSecond: 7.0 },
	{ text: "position.", startSecond: 7.0, endSecond: 7.5 },
];

export default function TranscriptionDemo() {
	const [currentTime, setCurrentTime] = useState(0);
	const [isPlaying, setIsPlaying] = useState(true);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (isPlaying) {
			intervalRef.current = setInterval(() => {
				setCurrentTime((prev) => {
					if (prev >= 7.5) return 0;
					return prev + 0.1;
				});
			}, 100);
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [isPlaying]);

	return (
		<div className="flex w-full max-w-lg flex-col gap-3">
			<Transcription
				segments={SAMPLE_SEGMENTS}
				currentTime={currentTime}
				onSeek={(time) => {
					setCurrentTime(time);
					setIsPlaying(true);
				}}
			>
				{(segment, index) => (
					<TranscriptionSegment
						key={index}
						segment={segment}
						index={index}
					/>
				)}
			</Transcription>
			<div className="flex items-center gap-3">
				<button
					type="button"
					className="rounded border border-border px-3 py-1 text-xs text-text hover:bg-bg-neutral-hovered"
					onClick={() => setIsPlaying((prev) => !prev)}
				>
					{isPlaying ? "Pause" : "Play"}
				</button>
				<span className="text-xs text-text-subtle">
					{currentTime.toFixed(1)}s / 7.5s
				</span>
			</div>
		</div>
	);
}

export function TranscriptionDemoStatic() {
	return (
		<Transcription segments={SAMPLE_SEGMENTS}>
			{(segment, index) => (
				<TranscriptionSegment
					key={index}
					segment={segment}
					index={index}
				/>
			)}
		</Transcription>
	);
}

export function TranscriptionDemoWithSeek() {
	const [currentTime, setCurrentTime] = useState(3.5);

	return (
		<div className="flex w-full max-w-lg flex-col gap-3">
			<Transcription
				segments={SAMPLE_SEGMENTS}
				currentTime={currentTime}
				onSeek={setCurrentTime}
			>
				{(segment, index) => (
					<TranscriptionSegment
						key={index}
						segment={segment}
						index={index}
					/>
				)}
			</Transcription>
			<p className="text-xs text-text-subtle">
				Click any word to seek. Current: {currentTime.toFixed(1)}s
			</p>
		</div>
	);
}
