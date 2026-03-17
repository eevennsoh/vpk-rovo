"use client";

import type { FileUIPart } from "ai";
import type { RovoMessageMetadata, RovoUIMessage } from "@/lib/rovo-ui-messages";

export function createFutureChatUserMessage({
	createdAt,
	files,
	id,
	metadata,
	text,
}: Readonly<{
	createdAt: string;
	files: ReadonlyArray<FileUIPart>;
	id: string;
	metadata?: RovoMessageMetadata;
	text: string;
}>): RovoUIMessage {
	return {
		id,
		role: "user",
		metadata: {
			origin: "rovodev",
			createdAt,
			updatedAt: createdAt,
			...(metadata ?? {}),
		},
		parts: [
			...files,
			...(text
				? [
					{
						type: "text" as const,
						text,
						state: "done" as const,
					},
				]
				: []),
		],
	};
}
