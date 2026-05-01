"use client";

import { useCallback, useRef, useState } from "react";
import UploadIcon from "@atlaskit/icon/core/upload";
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
			className="rounded-2xl border border-dashed border-border bg-bg-neutral-subtle p-4 text-sm text-text-subtle outline-none transition-colors duration-normal hover:bg-bg-neutral-subtle-hovered focus-visible:border-border-focused focus-visible:ring-2 focus-visible:ring-ring/30 focus-within:border-border-focused focus-within:ring-2 focus-within:ring-ring/30"
			onClick={() => inputRef.current?.click()}
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
			role="button"
			tabIndex={0}
		>
			<div className="flex items-center gap-3">
				<UploadIcon label="" />
				<span id="personal-graph-dropzone-description">{status ?? "Drop markdown, text, HTML, or paste a URL"}</span>
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
