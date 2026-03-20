"use client";

import type { ElevenLabs } from "@elevenlabs/elevenlabs-js";
import type { CharacterAlignmentResponseModel } from "@elevenlabs/elevenlabs-js/api/types/CharacterAlignmentResponseModel";
import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const AUDIO_SAMPLE_URL =
	"https://storage.googleapis.com/eleven-public-cdn/audio/ui-elevenlabs-io/00.mp3";

export const AUDIO_PLAYER_ITEM = {
	id: "demo-track",
	src: AUDIO_SAMPLE_URL,
};

export const DEMO_TRACK_TITLE = "Realtime Voice Preview";

export function DemoSurface({
	children,
	className,
}: Readonly<{ children: ReactNode; className?: string }>) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-4 shadow-sm",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function DemoCard({
	children,
	className,
	contentClassName,
	description,
	title,
}: Readonly<{
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	description?: ReactNode;
	title: ReactNode;
}>) {
	return (
		<Card className={cn("mx-auto w-full max-w-xl gap-6 py-6", className)}>
			<CardHeader className="px-6">
				<CardTitle>{title}</CardTitle>
				{description ? (
					<CardDescription className="text-text-subtle">
						{description}
					</CardDescription>
				) : null}
			</CardHeader>
			<CardContent className={cn("flex flex-col gap-4 px-6", contentClassName)}>
				{children}
			</CardContent>
		</Card>
	);
}

export const CONVERSATION_DOWNLOAD_MESSAGES = [
	{
		role: "assistant" as const,
		content:
			"I can summarize the latest user interview notes and flag follow-up actions.",
	},
	{
		role: "user" as const,
		content: "Turn the three strongest insights into a launch checklist.",
	},
];

export const RESPONSE_MARKDOWN = `### Voice-ready response

- Natural pacing for customer support flows
- Reusable waveform, scrubbing, and transcript primitives
- Mock-friendly demos for docs and onboarding
`;

export const TRANSCRIPT_TEXT =
	"Welcome to the ElevenLabs ui-audio gallery. Every preview uses deterministic mock data.";

export function createAlignment(text: string): CharacterAlignmentResponseModel {
	const characters = [...text];
	const characterStartTimesSeconds: number[] = [];
	const characterEndTimesSeconds: number[] = [];
	let time = 0;

	for (const character of characters) {
		const duration = character === " " ? 0.04 : 0.07;
		characterStartTimesSeconds.push(time);
		time += duration;
		characterEndTimesSeconds.push(time);
	}

	return {
		characterEndTimesSeconds,
		characterStartTimesSeconds,
		characters,
	};
}

export const TRANSCRIPT_ALIGNMENT = createAlignment(TRANSCRIPT_TEXT);

export function createWaveformData(length: number) {
	return Array.from({ length }, (_, index) => {
		const base = (Math.sin(index / 3) + 1) / 2;
		const accent = (Math.cos(index / 5) + 1) / 6;
		return Math.max(0.16, Math.min(1, base * 0.72 + accent));
	});
}

export const WAVEFORM_DATA = createWaveformData(72);

export const MOCK_VOICES = [
	{
		voiceId: "aria-support",
		name: "Aria Support",
		labels: {
			accent: "US",
			age: "adult",
			description: "Clear and conversational",
			gender: "female",
			"use case": "support",
		},
		previewUrl: AUDIO_SAMPLE_URL,
	},
	{
		voiceId: "sol-sales",
		name: "Sol Sales",
		labels: {
			accent: "UK",
			age: "adult",
			description: "Warm and energetic",
			gender: "male",
			"use case": "sales",
		},
		previewUrl: AUDIO_SAMPLE_URL,
	},
	{
		voiceId: "nova-guide",
		name: "Nova Guide",
		labels: {
			accent: "AU",
			age: "young",
			description: "Helpful and precise",
			gender: "female",
			"use case": "education",
		},
		previewUrl: AUDIO_SAMPLE_URL,
	},
] as ElevenLabs.Voice[];
