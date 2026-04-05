"use client";

import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactElement, useCallback, useMemo, useRef, useState } from "react";
import type { Spec } from "@json-render/react";
import { useChatUI } from "@json-render/react";
import { EXAMPLE_SPECS } from "@/lib/json-render/demos";
import { JsonRenderView } from "@/lib/json-render/renderer";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
	CodeIcon,
	MessageSquareIcon,
	LayoutGridIcon,
	SendIcon,
	Trash2Icon,
	XIcon,
} from "@/components/ui/vpk-icons";

const DEBOUNCE_MS = 300;
const GENUI_META_PREFIX = "[genui-meta]";

type ViewMode = "examples" | "chat";
type GenuiFailureType = "no-spec" | "malformed-spec" | null;

interface GenuiMeta {
	status?: "ok" | "failed";
	failureType?: GenuiFailureType;
	wasAutoFixed?: boolean;
	wasRetried?: boolean;
	usedWebLookup?: boolean;
	repairMode?: "none" | "synthesize-missing-children";
	synthesizedChildCount?: number;
	missingChildKeys?: string[];
	attempt?: "base" | "strict-retry" | "web-retry";
}

function parseGenuiMeta(rawText: string | null | undefined): {
	meta: GenuiMeta | null;
	text: string;
} {
	if (!rawText) {
		return { meta: null, text: "" };
	}

	const lines = rawText.split("\n");
	const firstLine = lines[0]?.trim() ?? "";
	if (!firstLine.startsWith(GENUI_META_PREFIX)) {
		return { meta: null, text: rawText };
	}

	const maybeJson = firstLine.slice(GENUI_META_PREFIX.length).trim();
	try {
		const parsed = JSON.parse(maybeJson) as GenuiMeta;
		const text = lines.slice(1).join("\n").trimStart();
		return { meta: parsed, text };
	} catch {
		return { meta: null, text: rawText };
	}
}

function getSpecStatusMessage(meta: GenuiMeta | null, hasSpec: boolean): string {
	if (meta?.failureType === "no-spec") {
		return "No renderable spec was produced for this prompt.";
	}

	if (meta?.failureType === "malformed-spec") {
		return "Spec patches were detected, but the final structure was malformed.";
	}

	if (hasSpec) {
		return "Spec parsing failed — try rephrasing your request.";
	}

	return "No spec was generated — ask for a concrete UI with sections and sample data.";
}

function getGenerationBadge(meta: GenuiMeta | null): string | null {
	if (!meta) {
		return null;
	}

	if (
		meta.repairMode === "synthesize-missing-children" &&
		typeof meta.synthesizedChildCount === "number"
	) {
		return `Recovered ${meta.synthesizedChildCount} missing section${
			meta.synthesizedChildCount === 1 ? "" : "s"
		} with placeholders`;
	}

	if (meta.wasAutoFixed && meta.usedWebLookup) {
		return "Auto-corrected with web context";
	}

	if (meta.wasAutoFixed) {
		return "Auto-corrected spec";
	}

	if (meta.wasRetried && meta.usedWebLookup) {
		return "Retried with web context";
	}

	if (meta.wasRetried) {
		return "Retried with stricter parsing";
	}

	return null;
}

function ChatView() {
	const { messages, isStreaming, error, send, clear } = useChatUI({
		api: "/api/genui-chat",
	});
	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const formRef = useRef<HTMLFormElement>(null);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			const text = input.trim();
			if (!text || isStreaming) return;
			setInput("");
			await send(text);
		},
		[input, isStreaming, send],
	);

	const handleKeyDown = useCallback(
		(e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				formRef.current?.requestSubmit();
			}
		},
		[],
	);

	return (
		<div className="flex flex-col flex-1 min-h-0">
			{/* Messages */}
			<div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto pb-4">
				{messages.length === 0 ? (
					<div className="flex items-center justify-center h-full text-text-subtlest text-sm">
						Describe a UI and watch it render live.
					</div>
				) : null}
				{messages.map((msg) => {
					const parsedMessage =
						msg.role === "assistant"
							? parseGenuiMeta(msg.text)
							: { meta: null, text: msg.text ?? "" };
					const messageText = parsedMessage.text;
					const meta = parsedMessage.meta;
					const hasRenderableSpec = Boolean(
						msg.spec?.root &&
							msg.spec.elements &&
							Object.keys(msg.spec.elements).length > 0,
					);
					const statusMessage = getSpecStatusMessage(
						meta,
						Boolean(msg.spec),
					);
					const generationBadge = getGenerationBadge(meta);
					const showSpecCard = Boolean(
						msg.role === "assistant" && (msg.spec || meta?.failureType),
					);

					return (
						<div
							key={msg.id}
							className={cn(
								"flex flex-col gap-2",
								msg.role === "user"
									? "items-end"
									: "items-start",
							)}
						>
							{messageText ? (
								<div
									className={cn(
										"rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap",
										msg.role === "user"
											? "bg-primary text-primary-foreground"
											: "bg-bg-neutral text-text",
									)}
								>
									{messageText}
								</div>
							) : null}
							{showSpecCard ? (
								<div className="flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-4">
									{generationBadge ? (
										<p className="text-xs text-text-subtlest">
											{generationBadge}
										</p>
									) : null}
									{hasRenderableSpec ? (
										<JsonRenderView
											spec={msg.spec}
											loading={isStreaming}
										/>
									) : !isStreaming ? (
										<div className="text-sm text-text-subtlest py-2">
											{statusMessage}
										</div>
									) : null}
								</div>
							) : null}
						</div>
					);
				})}
				{isStreaming &&
				messages.length > 0 &&
				!messages[messages.length - 1].text &&
				!messages[messages.length - 1].spec ? (
					<div className="flex items-start">
						<div className="rounded-lg px-3 py-2 text-sm bg-bg-neutral text-text-subtlest">
							Generating...
						</div>
					</div>
				) : null}
				<div ref={messagesEndRef} />
			</div>

			{/* Error */}
			{error ? (
				<p className="text-xs text-text-danger px-1 pb-1">
					{error.message}
				</p>
			) : null}

			{/* Input */}
			<form
				ref={formRef}
				onSubmit={handleSubmit}
				className="flex items-end gap-2 border-t border-border pt-3"
			>
				<textarea
					className="flex-1 min-h-[40px] max-h-[120px] rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text resize-none focus:outline-none focus:ring-2 focus:ring-ring"
					placeholder="Describe a UI to generate..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					rows={1}
					disabled={isStreaming}
				/>
				<div className="flex gap-1">
					<Button
						type="submit"
						size="sm"
						disabled={!input.trim() || isStreaming}
					>
						<SendIcon className="size-4" />
					</Button>
					{messages.length > 0 ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={clear}
							disabled={isStreaming}
						>
							<Trash2Icon className="size-4" />
						</Button>
					) : null}
				</div>
			</form>
		</div>
	);
}

export default function UIGenerationDemo(): ReactElement {
	const [viewMode, setViewMode] = useState<ViewMode>("examples");
	const [activeSpecId, setActiveSpecId] = useState(EXAMPLE_SPECS[0].id);
	const [showEditor, setShowEditor] = useState(false);
	const [editorText, setEditorText] = useState<string | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);
	const [parsedSpec, setParsedSpec] = useState<Spec | null>(null);
	const [lastSyncedId, setLastSyncedId] = useState(EXAMPLE_SPECS[0].id);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const activeExample = useMemo(
		() =>
			EXAMPLE_SPECS.find((s) => s.id === activeSpecId) ??
			EXAMPLE_SPECS[0],
		[activeSpecId],
	);

	// Reset editor state when switching examples (no useEffect needed)
	if (lastSyncedId !== activeSpecId) {
		setLastSyncedId(activeSpecId);
		setEditorText(null);
		setParsedSpec(null);
		setParseError(null);
	}

	const displayText =
		editorText ?? JSON.stringify(activeExample.spec, null, 2);
	const displaySpec = parsedSpec ?? activeExample.spec;

	const handleEditorChange = useCallback((text: string) => {
		setEditorText(text);
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			try {
				const parsed = JSON.parse(text) as Spec;
				setParsedSpec(parsed);
				setParseError(null);
			} catch (e) {
				setParseError(
					e instanceof Error ? e.message : "Invalid JSON",
				);
			}
		}, DEBOUNCE_MS);
	}, []);

	return (
		<div className="flex flex-col gap-4 p-4 h-full">
			{/* Header */}
			<div className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold text-text">
					UI Generation
				</h1>
				<p className="text-sm text-text-subtle">
					Render structured JSON specs into live UIs with charts,
					forms, and 3D scenes via json-render.
				</p>
			</div>

			{/* Mode toggle + controls */}
			<div className="flex min-h-8 items-center gap-2 flex-wrap">
				{/* View mode toggle */}
				<ToggleGroup
					value={[viewMode]}
					onValueChange={(value) => {
						if (value.length > 0) setViewMode(value[value.length - 1] as ViewMode);
					}}
					variant="outline"
					size="sm"
					aria-label="UI generation mode"
				>
					<ToggleGroupItem value="examples" aria-label="Examples">
						<LayoutGridIcon className="size-3.5" />
						Examples
					</ToggleGroupItem>
					<ToggleGroupItem value="chat" aria-label="Chat">
						<MessageSquareIcon className="size-3.5" />
						Chat
					</ToggleGroupItem>
				</ToggleGroup>

				{/* Example spec buttons (only in examples mode) */}
				{viewMode === "examples" ? (
					<div className="flex min-w-0 flex-1 items-center gap-2">
						<div className="min-w-0 flex-1 overflow-x-auto">
							<Tabs
								value={activeSpecId}
								onValueChange={setActiveSpecId}
							>
								<TabsList variant="line" className="min-w-max">
									{EXAMPLE_SPECS.map((example) => (
										<TabsTrigger
											key={example.id}
											value={example.id}
											className="px-3"
										>
											{example.name}
										</TabsTrigger>
									))}
								</TabsList>
							</Tabs>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="shrink-0"
							onClick={() =>
								setShowEditor((prev) => !prev)
							}
						>
							{showEditor ? (
								<>
									<XIcon className="size-4" />
									Hide Editor
								</>
							) : (
								<>
									<CodeIcon className="size-4" />
									Edit JSON
								</>
							)}
						</Button>
					</div>
				) : null}
			</div>

			{/* Content */}
			<div className={cn("flex-1 min-h-0 flex-col", viewMode === "chat" ? "flex" : "hidden")}>
				<ChatView />
			</div>
			<div
				className={cn(
					"flex-1 min-h-0 flex-col",
					viewMode === "examples" ? "flex" : "hidden",
					showEditor ? "gap-4" : "gap-2",
				)}
			>
				<p className="text-xs text-text-subtlest shrink-0">
					{activeExample.description}
				</p>
				<div
					className={cn(
						"flex-1 min-h-0",
						showEditor ? "flex gap-4" : "",
					)}
				>
				{showEditor ? (
					<>
						{/* Editor pane */}
						<div className="flex w-1/2 min-h-0 flex-col gap-1">
							<textarea
								className="flex-1 min-h-0 rounded-lg border border-border bg-surface p-3 font-mono text-xs text-text resize-none focus:outline-none focus:ring-2 focus:ring-ring"
								value={displayText}
								onChange={(e) =>
									handleEditorChange(e.target.value)
								}
								spellCheck={false}
							/>
							{parseError ? (
								<p className="text-xs text-text-danger">
									{parseError}
								</p>
							) : null}
						</div>
						{/* Preview pane */}
						<div className="w-1/2 min-h-0 overflow-auto rounded-lg border border-border bg-surface p-4">
							<JsonRenderView
								key={activeSpecId}
								spec={displaySpec}
							/>
						</div>
					</>
				) : (
					<div className="overflow-auto rounded-lg border border-border bg-surface p-4">
						<JsonRenderView
							key={activeSpecId}
							spec={displaySpec}
						/>
					</div>
				)}
				</div>
			</div>
		</div>
	);
}
