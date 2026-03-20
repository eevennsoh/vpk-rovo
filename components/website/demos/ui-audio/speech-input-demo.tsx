"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	SpeechInput,
	SpeechInputCancelButton,
	SpeechInputPreview,
	SpeechInputRecordButton,
} from "@/components/ui-audio/speech-input";
import { DemoSurface } from "./demo-data";

function SpeechInputPreviewDemo({
	size = "default",
}: Readonly<{ size?: "default" | "sm" | "lg" }>) {
	return (
		<DemoSurface className="p-0">
			<div className="flex flex-col gap-4 overflow-auto rounded-2xl p-6">
				<div className="relative">
					<Textarea
						className="min-h-[120px] rounded-2xl px-3.5 pt-3 pb-14"
						placeholder="Jot down some thoughts..."
					/>
					<div className="absolute right-3 bottom-3 flex items-center gap-2">
						<SpeechInput getToken={async () => "demo-token"} size={size}>
							<SpeechInputCancelButton />
							<SpeechInputPreview placeholder="Listening..." />
							<SpeechInputRecordButton />
						</SpeechInput>
					</div>
				</div>

				<div className="relative">
					<Textarea
						className="min-h-[120px] rounded-2xl px-3.5 pt-3 pb-14"
						placeholder="Jot down some thoughts..."
					/>
					<div className="absolute bottom-3 left-3 flex items-center gap-2">
						<SpeechInput getToken={async () => "demo-token"} size={size}>
							<SpeechInputRecordButton />
							<SpeechInputPreview placeholder="Listening..." />
							<SpeechInputCancelButton />
						</SpeechInput>
					</div>
				</div>

				<div className="flex items-center gap-2.5">
					<Input
						className="flex-1 px-3.5 transition-[flex-basis] duration-200"
						placeholder="Give this idea a title..."
					/>
					<SpeechInput
						getToken={async () => "demo-token"}
						size={size === "default" ? "sm" : size}
					>
						<SpeechInputRecordButton />
						<SpeechInputPreview placeholder="Listening..." />
						<SpeechInputCancelButton />
					</SpeechInput>
				</div>
			</div>
		</DemoSurface>
	);
}

export default function SpeechInputDemo() {
	return <SpeechInputPreviewDemo />;
}

export function SpeechInputDemoCompact() {
	return <SpeechInputPreviewDemo size="sm" />;
}
