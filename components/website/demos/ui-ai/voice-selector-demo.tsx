"use client";

import { useCallback, useRef, useState } from "react";

import {
	VoiceSelector,
	VoiceSelectorAccent,
	VoiceSelectorAge,
	VoiceSelectorAttributes,
	VoiceSelectorBullet,
	VoiceSelectorContent,
	VoiceSelectorDescription,
	VoiceSelectorEmpty,
	VoiceSelectorGender,
	VoiceSelectorGroup,
	VoiceSelectorInput,
	VoiceSelectorItem,
	VoiceSelectorList,
	VoiceSelectorName,
	VoiceSelectorPreview,
	VoiceSelectorSeparator,
	VoiceSelectorTrigger,
} from "@/components/ui-ai/voice-selector";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "@/components/ui/vpk-icons";

// — Shared voice data —

interface Voice {
	id: string;
	name: string;
	gender: "male" | "female" | "non-binary";
	accent: string;
	age: number;
	description: string;
}

const OPENAI_VOICES: Voice[] = [
	{ id: "alloy", name: "Alloy", gender: "non-binary", accent: "american", age: 30, description: "Neutral and balanced" },
	{ id: "echo", name: "Echo", gender: "male", accent: "american", age: 35, description: "Warm and confident" },
	{ id: "fable", name: "Fable", gender: "male", accent: "british", age: 40, description: "Expressive and dramatic" },
	{ id: "onyx", name: "Onyx", gender: "male", accent: "american", age: 45, description: "Deep and authoritative" },
	{ id: "nova", name: "Nova", gender: "female", accent: "american", age: 28, description: "Friendly and upbeat" },
	{ id: "shimmer", name: "Shimmer", gender: "female", accent: "american", age: 32, description: "Clear and refined" },
];

const ELEVENLABS_VOICES: Voice[] = [
	{ id: "rachel", name: "Rachel", gender: "female", accent: "american", age: 29, description: "Calm and professional" },
	{ id: "drew", name: "Drew", gender: "male", accent: "american", age: 34, description: "Well-rounded and versatile" },
	{ id: "clyde", name: "Clyde", gender: "male", accent: "american", age: 50, description: "War veteran character" },
	{ id: "charlotte", name: "Charlotte", gender: "female", accent: "swedish", age: 26, description: "Seductive and confident" },
];

// — Default: minimal voice selector —

export default function VoiceSelectorDemo() {
	return (
		<VoiceSelector>
			<VoiceSelectorTrigger render={<Button variant="outline" size="sm" />}>
				Select voice
			</VoiceSelectorTrigger>
			<VoiceSelectorContent>
				<VoiceSelectorInput placeholder="Search voices..." />
				<VoiceSelectorList>
					<VoiceSelectorEmpty>No voices found.</VoiceSelectorEmpty>
					<VoiceSelectorGroup heading="Voices">
						{OPENAI_VOICES.map((voice) => (
							<VoiceSelectorItem key={voice.id} value={voice.id}>
								<VoiceSelectorName>{voice.name}</VoiceSelectorName>
								<VoiceSelectorDescription>{voice.description}</VoiceSelectorDescription>
							</VoiceSelectorItem>
						))}
					</VoiceSelectorGroup>
				</VoiceSelectorList>
			</VoiceSelectorContent>
		</VoiceSelector>
	);
}

// — With attributes: gender, accent flags, and age metadata —

export function VoiceSelectorDemoWithAttributes() {
	const [selected, setSelected] = useState("alloy");

	return (
		<VoiceSelector value={selected} onValueChange={(v) => setSelected(v ?? "")}>
			<VoiceSelectorTrigger render={<Button variant="outline" size="sm" />}>
				{OPENAI_VOICES.find((v) => v.id === selected)?.name ?? "Select voice"}
			</VoiceSelectorTrigger>
			<VoiceSelectorContent>
				<VoiceSelectorInput placeholder="Search voices..." />
				<VoiceSelectorList>
					<VoiceSelectorEmpty>No voices found.</VoiceSelectorEmpty>
					<VoiceSelectorGroup heading="OpenAI">
						{OPENAI_VOICES.map((voice) => (
							<VoiceSelectorItem
								key={voice.id}
								value={voice.id}
								onSelect={() => setSelected(voice.id)}
							>
								<VoiceSelectorName>{voice.name}</VoiceSelectorName>
								<VoiceSelectorAttributes>
									<VoiceSelectorGender value={voice.gender} />
									<VoiceSelectorBullet />
									<VoiceSelectorAccent value={voice.accent} />
									<VoiceSelectorBullet />
									<VoiceSelectorAge>{voice.age}</VoiceSelectorAge>
								</VoiceSelectorAttributes>
								{selected === voice.id ? (
									<CheckIcon className="ml-auto size-4 shrink-0 text-text-subtle" />
								) : null}
							</VoiceSelectorItem>
						))}
					</VoiceSelectorGroup>
				</VoiceSelectorList>
			</VoiceSelectorContent>
		</VoiceSelector>
	);
}

// — Multi-provider: grouped voices with separators —

export function VoiceSelectorDemoMultiProvider() {
	const [selected, setSelected] = useState("alloy");
	const allVoices = [...OPENAI_VOICES, ...ELEVENLABS_VOICES];

	return (
		<VoiceSelector value={selected} onValueChange={(v) => setSelected(v ?? "")}>
			<VoiceSelectorTrigger render={<Button variant="outline" size="sm" />}>
				{allVoices.find((v) => v.id === selected)?.name ?? "Select voice"}
			</VoiceSelectorTrigger>
			<VoiceSelectorContent>
				<VoiceSelectorInput placeholder="Search voices..." />
				<VoiceSelectorList>
					<VoiceSelectorEmpty>No voices found.</VoiceSelectorEmpty>
					<VoiceSelectorGroup heading="OpenAI">
						{OPENAI_VOICES.map((voice) => (
							<VoiceSelectorItem
								key={voice.id}
								value={voice.id}
								onSelect={() => setSelected(voice.id)}
							>
								<VoiceSelectorName>{voice.name}</VoiceSelectorName>
								<VoiceSelectorAttributes>
									<VoiceSelectorAccent value={voice.accent} />
									<VoiceSelectorBullet />
									<VoiceSelectorGender value={voice.gender} />
								</VoiceSelectorAttributes>
							</VoiceSelectorItem>
						))}
					</VoiceSelectorGroup>
					<VoiceSelectorSeparator />
					<VoiceSelectorGroup heading="ElevenLabs">
						{ELEVENLABS_VOICES.map((voice) => (
							<VoiceSelectorItem
								key={voice.id}
								value={voice.id}
								onSelect={() => setSelected(voice.id)}
							>
								<VoiceSelectorName>{voice.name}</VoiceSelectorName>
								<VoiceSelectorAttributes>
									<VoiceSelectorAccent value={voice.accent} />
									<VoiceSelectorBullet />
									<VoiceSelectorGender value={voice.gender} />
								</VoiceSelectorAttributes>
							</VoiceSelectorItem>
						))}
					</VoiceSelectorGroup>
				</VoiceSelectorList>
			</VoiceSelectorContent>
		</VoiceSelector>
	);
}

// — With preview: play/pause voice sample buttons —

export function VoiceSelectorDemoWithPreview() {
	const [selected, setSelected] = useState("alloy");
	const [playingId, setPlayingId] = useState<string | null>(null);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const handlePlay = useCallback((voiceId: string) => {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (playingId === voiceId) {
			setPlayingId(null);
			return;
		}
		setPlayingId(voiceId);
		timerRef.current = setTimeout(() => setPlayingId(null), 3000);
	}, [playingId]);

	return (
		<VoiceSelector value={selected} onValueChange={(v) => setSelected(v ?? "")}>
			<VoiceSelectorTrigger render={<Button variant="outline" size="sm" />}>
				{OPENAI_VOICES.find((v) => v.id === selected)?.name ?? "Select voice"}
			</VoiceSelectorTrigger>
			<VoiceSelectorContent>
				<VoiceSelectorInput placeholder="Search voices..." />
				<VoiceSelectorList>
					<VoiceSelectorEmpty>No voices found.</VoiceSelectorEmpty>
					<VoiceSelectorGroup heading="OpenAI">
						{OPENAI_VOICES.map((voice) => (
							<VoiceSelectorItem
								key={voice.id}
								value={voice.id}
								onSelect={() => setSelected(voice.id)}
							>
								<VoiceSelectorPreview
									playing={playingId === voice.id}
									onPlay={() => handlePlay(voice.id)}
								/>
								<VoiceSelectorName>{voice.name}</VoiceSelectorName>
								<VoiceSelectorDescription>{voice.description}</VoiceSelectorDescription>
							</VoiceSelectorItem>
						))}
					</VoiceSelectorGroup>
				</VoiceSelectorList>
			</VoiceSelectorContent>
		</VoiceSelector>
	);
}
