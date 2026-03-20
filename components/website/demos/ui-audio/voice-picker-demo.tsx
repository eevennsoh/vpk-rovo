"use client";

import { useState } from "react";
import { VoicePicker } from "@/components/ui-audio/voice-picker";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DemoSurface, MOCK_VOICES } from "./demo-data";

function VoicePickerPreview() {
	const [voice, setVoice] = useState(MOCK_VOICES[0]?.voiceId);
	const [open, setOpen] = useState(false);
	const selectedVoice = MOCK_VOICES.find((item) => item.voiceId === voice);

	return (
		<DemoSurface className="p-4">
			<Card className="mx-auto w-full max-w-lg py-6">
				<CardHeader className="px-6">
					<CardTitle>Voice Picker</CardTitle>
					<CardDescription className="text-text-subtle">
						Controlled voice selection with preview playback and searchable presets.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 px-6">
					<VoicePicker
						className="w-full"
						onOpenChange={setOpen}
						onValueChange={setVoice}
						open={open}
						value={voice}
						voices={MOCK_VOICES}
					/>
					{selectedVoice ? (
						<div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-neutral-subtle p-4">
							<p className="text-sm font-medium text-text">{selectedVoice.name}</p>
							<p className="text-sm text-text-subtle">
								{selectedVoice.labels?.description ?? "Preset voice"}
							</p>
							<div className="flex flex-wrap gap-2 text-xs text-text-subtle">
								{selectedVoice.labels?.accent ? (
									<span>{selectedVoice.labels.accent}</span>
								) : null}
								{selectedVoice.labels?.gender ? (
									<span>{selectedVoice.labels.gender}</span>
								) : null}
								{selectedVoice.labels?.["use case"] ? (
									<span>{selectedVoice.labels["use case"]}</span>
								) : null}
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>
		</DemoSurface>
	);
}

export default function VoicePickerDemo() {
	return <VoicePickerPreview />;
}

export function VoicePickerDemoDefault() {
	return <VoicePickerPreview />;
}
