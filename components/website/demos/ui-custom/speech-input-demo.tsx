"use client";

import { SpeechInput } from "@/components/ui-custom/speech-input";
import { useState } from "react";

export default function SpeechInputDemo() {
	return <SpeechInput />;
}

export function SpeechInputDemoWithTranscript() {
	const [transcript, setTranscript] = useState("");

	return (
		<div className="flex flex-col items-center gap-4">
			<SpeechInput onTranscriptionChange={(text) => setTranscript((prev) => (prev ? `${prev} ${text}` : text))} />
			<div className="min-h-[3rem] w-full max-w-sm rounded-lg border border-border p-3 text-sm text-text-subtle">{transcript || "Press the mic button and start speaking..."}</div>
		</div>
	);
}

export function SpeechInputDemoSizes() {
	return (
		<div className="flex items-center gap-4">
			<SpeechInput size="sm" />
			<SpeechInput size="default" />
		</div>
	);
}

export function SpeechInputDemoDisabled() {
	return <SpeechInput disabled />;
}
