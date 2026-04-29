"use client";

import { useCallback, useRef, useState } from "react";
import { captureUrl, writeRawSource } from "./lib/personal-graph-api";

interface PersonalGraphDropzoneProps {
	onRawAdded: () => void;
}

function looksLikeUrl(value: string) {
	return /^https?:\/\//iu.test(value.trim());
}

export function PersonalGraphDropzone({ onRawAdded }: Readonly<PersonalGraphDropzoneProps>) {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [status, setStatus] = useState<string | null>(null);

	const addText = useCallback(async (name: string, content: string) => {
		setStatus(looksLikeUrl(content) ? "Capturing..." : "Adding source...");
		try {
			if (looksLikeUrl(content)) {
				await captureUrl(content.trim());
			} else {
				await writeRawSource(name, content);
			}
			setStatus("Added");
			onRawAdded();
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "Add failed");
		}
	}, [onRawAdded]);

	return (
		<div
			aria-describedby="personal-graph-dropzone-description"
			aria-label="Drop raw source"
			className="rounded-md border border-dashed border-border bg-surface/80 p-3 text-xs text-text-subtle outline-none focus-visible:border-border-selected focus-visible:ring-2 focus-visible:ring-ring/30 focus-within:border-border-selected focus-within:ring-2 focus-within:ring-ring/30"
			onDragOver={(event) => event.preventDefault()}
			onDrop={(event) => {
				event.preventDefault();
				const file = event.dataTransfer.files[0];
				const text = event.dataTransfer.getData("text/plain");
				if (file) {
					void file.text().then((content) => addText(file.name, content));
				} else if (text) {
					void addText("pasted-url.md", text);
				}
			}}
			onPaste={(event) => {
				const text = event.clipboardData.getData("text/plain");
				if (text) void addText("pasted-url.md", text);
			}}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					inputRef.current?.click();
				}
			}}
			role="region"
			tabIndex={0}
		>
			<div className="flex items-center justify-between gap-3">
				<span id="personal-graph-dropzone-description">{status ?? "Drop markdown, text, HTML, or paste a URL"}</span>
				<button
					aria-label="Add raw source"
					className="rounded-md border border-border px-2 py-1 text-xs font-medium text-text outline-none focus-visible:border-border-selected focus-visible:ring-2 focus-visible:ring-ring/30"
					onClick={() => inputRef.current?.click()}
					type="button"
				>
					Add raw source
				</button>
			</div>
			<input
				accept=".md,.markdown,.txt,.html,.htm"
				className="hidden"
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) void file.text().then((content) => addText(file.name, content));
				}}
				ref={inputRef}
				type="file"
			/>
		</div>
	);
}
