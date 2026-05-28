"use client";

import type { ChatStatus, SourceDocumentUIPart } from "ai";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import {
	composerPromptInputClassName,
	composerTextareaClassName,
	textareaCSS,
} from "@/components/blocks/shared-ui/composer-styles";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import {
	CreateInput,
	CreateInputActionAddAttachments,
	CreateInputActionAddScreenshot,
	CreateInputActionMenu,
	CreateInputActionMenuContent,
	CreateInputActionMenuItem,
	CreateInputActionMenuTrigger,
	CreateInputBody,
	CreateInputButton,
	CreateInputCommand,
	CreateInputCommandEmpty,
	CreateInputCommandGroup,
	CreateInputCommandInput,
	CreateInputCommandItem,
	CreateInputCommandList,
	CreateInputCommandSeparator,

	CreateInputFooter,
	CreateInputHeader,
	CreateInputHoverCard,
	CreateInputHoverCardContent,
	CreateInputHoverCardTrigger,
	CreateInputProvider,
	CreateInputPreferencesButton,
	CreateInputSelect,
	CreateInputSelectContent,
	CreateInputSelectItem,
	CreateInputSelectTrigger,
	CreateInputSelectValue,
	CreateInputSubmit,
	CreateInputTab,
	CreateInputTabBody,
	CreateInputTabItem,
	CreateInputTabLabel,
	CreateInputTextarea,
	CreateInputTools,
	useCreateInputController,
	useCreateInputReferencedSources,
} from "@/components/ui-custom/create-input";
import { SpeechInput } from "@/components/ui-custom/speech-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AddIcon from "@atlaskit/icon/core/add";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import CustomizeIcon from "@atlaskit/icon/core/customize";
import GlobeIcon from "@atlaskit/icon/core/globe";
import ImageIcon from "@atlaskit/icon/core/image";

import LinkIcon from "@atlaskit/icon/core/link";
import MentionIcon from "@atlaskit/icon/core/mention";
import PageIcon from "@atlaskit/icon/core/page";
import ScreenIcon from "@atlaskit/icon/core/screen";
import SearchIcon from "@atlaskit/icon/core/search";
import UploadIcon from "@atlaskit/icon/core/upload";

interface DemoFrameProps {
	children: ReactNode;
	className?: string;
}

function DemoFrame({ children, className }: Readonly<DemoFrameProps>) {
	return (
		<div className={cn("mx-auto w-[680px] max-w-full", className)}>
			{children}
		</div>
	);
}

export default function CreateInputDemo() {
	return <CreateInputDemoChatComposer />;
}

export function CreateInputDemoChatComposer() {
	const [prompt, setPrompt] = useState("");
	const [selectedReasoning, setSelectedReasoning] = useState("deep-research");
	const [webResultsEnabled, setWebResultsEnabled] = useState(false);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);
	const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
	const [isCustomizeMenuOpen, setIsCustomizeMenuOpen] = useState(false);

	const handleSpeechTranscription = useCallback((text: string) => {
		const trimmed = text.trim();
		if (!trimmed) return;
		setPrompt((prev) => (prev.trimEnd() ? `${prev.trimEnd()} ${trimmed}` : trimmed));
	}, []);

	return (
		<DemoFrame>
			<div className="px-1">
				<div
					className="rounded-xl border border-border bg-surface px-4 pb-4 pt-4 shadow-[0px_-2px_50px_8px_rgba(30,31,33,0.08)]"
				>
					<CreateInput
						allowOverflow
						onSubmit={() => {
							setPrompt("");
						}}
						className={composerPromptInputClassName}
					>
						<CreateInputBody>
							<CreateInputTextarea
								value={prompt}
								onChange={(event) => setPrompt(event.currentTarget.value)}
								placeholder="Ask, @mention, or / for skills"
								aria-label="Chat message input"
								rows={1}
								className={composerTextareaClassName}
							/>
						</CreateInputBody>

						<CreateInputFooter className="justify-between px-0 pb-0">
							<CreateInputTools>
								<CreateInputActionMenu open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
									<CreateInputActionMenuTrigger aria-label="Add" size="icon-sm" variant="ghost">
										<AddIcon label="" />
									</CreateInputActionMenuTrigger>
									<CreateInputActionMenuContent>
										<CreateInputActionAddAttachments
											elemBefore={<UploadIcon label="" />}
										>
											Upload file
										</CreateInputActionAddAttachments>
										<CreateInputActionAddScreenshot
											elemBefore={<ScreenIcon label="" />}
										>
											Take screenshot
										</CreateInputActionAddScreenshot>
										<CreateInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<LinkIcon label="" />}
										>
											Add a link
										</CreateInputActionMenuItem>
										<CreateInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<MentionIcon label="" />}
										>
											Mention someone
										</CreateInputActionMenuItem>
										<CreateInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<AddIcon label="" />}
										>
											More formatting
										</CreateInputActionMenuItem>
										<CreateInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<PageIcon label="" />}
										>
											Add current page as context
										</CreateInputActionMenuItem>
									</CreateInputActionMenuContent>
								</CreateInputActionMenu>

								<Popover open={isCustomizeMenuOpen} onOpenChange={setIsCustomizeMenuOpen}>
									<PopoverTrigger
										render={<CreateInputPreferencesButton aria-label="Customize" />}
									/>
									<PopoverContent side="top" align="start" sideOffset={8} className="w-auto p-2">
										<PopoverTitle className="sr-only">Customize sources</PopoverTitle>
										<CustomizeMenu
											selectedReasoning={selectedReasoning}
											onReasoningChange={setSelectedReasoning}
											showReasoning={false}
											webResultsEnabled={webResultsEnabled}
											onWebResultsChange={setWebResultsEnabled}
											companyKnowledgeEnabled={companyKnowledgeEnabled}
											onCompanyKnowledgeChange={setCompanyKnowledgeEnabled}
											onClose={() => setIsCustomizeMenuOpen(false)}
										/>
									</PopoverContent>
								</Popover>
							</CreateInputTools>

							<div className="flex items-center gap-1">
								<SpeechInput aria-label="Voice" onTranscriptionChange={handleSpeechTranscription} size="icon" />
								<CreateInputSubmit aria-label="Submit" disabled={!prompt.trim()} size="icon-sm">
									<ArrowUpIcon label="" />
								</CreateInputSubmit>
							</div>
						</CreateInputFooter>
					</CreateInput>

					<style>{textareaCSS}</style>
				</div>

			</div>
		</DemoFrame>
	);
}

const sampleSources: SourceDocumentUIPart[] = [
	{
		filename: "packages/elements/src",
		mediaType: "text/plain",
		sourceId: "1",
		title: "create-input.tsx",
		type: "source-document",
	},
	{
		filename: "apps/test/app/examples",
		mediaType: "text/plain",
		sourceId: "2",
		title: "queue.tsx",
		type: "source-document",
	},
	{
		filename: "packages/elements/src",
		mediaType: "text/plain",
		sourceId: "3",
		title: "queue.tsx",
		type: "source-document",
	},
];

const sampleTabs = {
	active: [{ path: "packages/elements/src/task-queue-panel.tsx" }],
	recents: [
		{ path: "apps/test/app/examples/task-queue-panel.tsx" },
		{ path: "apps/test/app/page.tsx" },
		{ path: "packages/elements/src/task.tsx" },
		{ path: "apps/test/app/examples/create-input.tsx" },
		{ path: "packages/elements/src/queue.tsx" },
		{ path: "apps/test/app/examples/queue.tsx" },
	],
};

const SUBMITTING_TIMEOUT = 200;
const STREAMING_TIMEOUT = 2000;

function CursorReferencedSourcesDisplay() {
	const refs = useCreateInputReferencedSources();

	const handleRemove = useCallback((id: string) => refs.remove(id), [refs]);

	if (refs.sources.length === 0) return null;

	return (
		<div className="flex flex-wrap gap-1">
			{refs.sources.map((source) => (
				<button
					key={source.id}
					type="button"
					onClick={() => handleRemove(source.id)}
					className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-0.5 text-xs text-text-subtle hover:bg-bg-neutral"
				>
					<GlobeIcon label="" />
					<span>{source.title}</span>
					<span className="ml-0.5 text-text-subtlest">×</span>
				</button>
			))}
		</div>
	);
}

/**
 * Prevents scroll-to-top when cmdk mounts inside a Portal (e.g. HoverCard).
 * Captures the current scroll position during render and restores it after
 * the browser has finished any focus/scrollIntoView adjustments.
 */
function ScrollLock({ children }: { children: ReactNode }) {
	const savedRef = useRef<number | null>(null);

	// Capture synchronously during render, before children mount.
	// Reading a ref during render is intentional here — we need to snapshot
	// the scroll position before cmdk's layout effects fire scrollIntoView.
	if (typeof window !== "undefined" && savedRef.current === null) {
		savedRef.current = window.scrollY;
	}

	useEffect(() => {
		const saved = savedRef.current;
		if (saved === null) return;
		savedRef.current = null;

		// Double-rAF to ensure we run after the browser has finished
		// both React layout effects and native focus scrolling
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (window.scrollY !== saved) {
					window.scrollTo(0, saved);
				}
			});
		});
	}, []);

	return children;
}

function CursorSampleFilesMenu() {
	const refs = useCreateInputReferencedSources();

	const handleAdd = useCallback(
		(source: SourceDocumentUIPart) => refs.add(source),
		[refs],
	);

	return (
		<CreateInputCommand>
			<CreateInputCommandInput
				className="border-none focus-visible:ring-0"
				placeholder="Add files, folders, docs..."
			/>
			<CreateInputCommandList>
				<CreateInputCommandEmpty className="p-3 text-sm text-text-subtle">
					No results found.
				</CreateInputCommandEmpty>
				<CreateInputCommandGroup heading="Added">
					<CreateInputCommandItem>
						<GlobeIcon label="" />
						<span>Active Tabs</span>
						<span className="ml-auto text-text-subtle">✓</span>
					</CreateInputCommandItem>
				</CreateInputCommandGroup>
				<CreateInputCommandSeparator />
				<CreateInputCommandGroup heading="Other Files">
					{sampleSources
						.filter(
							(source) =>
								!refs.sources.some(
									(s) =>
										s.title === source.title &&
										s.filename === source.filename,
								),
						)
						.map((source, index) => (
							<CreateInputCommandItem
								key={`${source.title}-${index}`}
								onSelect={() => handleAdd(source)}
							>
								<GlobeIcon label="" />
								<div className="flex flex-col">
									<span className="text-sm font-medium">
										{source.title}
									</span>
									<span className="text-xs text-text-subtlest">
										{source.filename}
									</span>
								</div>
							</CreateInputCommandItem>
						))}
				</CreateInputCommandGroup>
			</CreateInputCommandList>
		</CreateInputCommand>
	);
}

export function CreateInputDemoCursorStyle() {
	const [model, setModel] = useState("claude-4-sonnet");
	const [status, setStatus] = useState<
		"submitted" | "streaming" | "ready" | "error"
	>("ready");

	const handleSubmit = useCallback(() => {
		setStatus("submitted");
		setTimeout(() => setStatus("streaming"), SUBMITTING_TIMEOUT);
		setTimeout(() => setStatus("ready"), STREAMING_TIMEOUT);
	}, []);

	return (
		<DemoFrame>
			<CreateInputProvider>
				<CreateInput
					className="w-full [&>[data-slot=input-group]]:h-auto"
					globalDrop
					multiple
					onSubmit={handleSubmit}
				>
					<CreateInputHeader className="order-first border-b border-border px-1 pb-2">
						<CreateInputHoverCard>
							<CreateInputHoverCardTrigger>
								<CreateInputButton
									className="!h-8"
									size="icon-sm"
									variant="outline"
								>
									<MentionIcon label="" />
								</CreateInputButton>
							</CreateInputHoverCardTrigger>
							<CreateInputHoverCardContent className="w-[400px] overflow-hidden p-0">
								<ScrollLock>
									<CursorSampleFilesMenu />
								</ScrollLock>
							</CreateInputHoverCardContent>
						</CreateInputHoverCard>
						<CreateInputHoverCard>
							<CreateInputHoverCardTrigger>
								<CreateInputButton size="sm" variant="outline">
									<CustomizeIcon label="" />
									<span>1</span>
								</CreateInputButton>
							</CreateInputHoverCardTrigger>
							<CreateInputHoverCardContent className="divide-y overflow-hidden p-0">
								<div className="flex flex-col gap-2 p-3">
									<p className="text-sm font-medium text-text-subtle">
										Attached Project Rules
									</p>
									<p className="ml-4 text-sm text-text-subtle">
										Always Apply:
									</p>
									<p className="ml-8 text-sm">ultracite.mdc</p>
								</div>
								<p className="bg-surface-sunken px-4 py-3 text-sm text-text-subtle">
									Click to manage
								</p>
							</CreateInputHoverCardContent>
						</CreateInputHoverCard>
						<CreateInputHoverCard>
							<CreateInputHoverCardTrigger>
								<CreateInputButton size="sm" variant="outline">
									<PageIcon label="" />
									<span>1 Tab</span>
								</CreateInputButton>
							</CreateInputHoverCardTrigger>
							<CreateInputHoverCardContent className="flex w-[300px] flex-col gap-4 px-0 py-3">
								<CreateInputTab>
									<CreateInputTabLabel>Active Tabs</CreateInputTabLabel>
									<CreateInputTabBody>
										{sampleTabs.active.map((tab) => (
											<CreateInputTabItem key={tab.path}>
												<GlobeIcon label="" />
												<span className="truncate" dir="rtl">
													{tab.path}
												</span>
											</CreateInputTabItem>
										))}
									</CreateInputTabBody>
								</CreateInputTab>
								<CreateInputTab>
									<CreateInputTabLabel>Recents</CreateInputTabLabel>
									<CreateInputTabBody>
										{sampleTabs.recents.map((tab) => (
											<CreateInputTabItem key={tab.path}>
												<GlobeIcon label="" />
												<span className="truncate" dir="rtl">
													{tab.path}
												</span>
											</CreateInputTabItem>
										))}
									</CreateInputTabBody>
								</CreateInputTab>
								<div className="border-t px-3 pt-2 text-xs text-text-subtlest">
									Only file paths are included
								</div>
							</CreateInputHoverCardContent>
						</CreateInputHoverCard>
						<CursorReferencedSourcesDisplay />
					</CreateInputHeader>

					<CreateInputBody>
						<CreateInputTextarea placeholder="Plan, search, build anything" />
					</CreateInputBody>

					<CreateInputFooter className="justify-between border-t border-border px-1 pt-2">
						<CreateInputTools>
							<CreateInputSelect
								value={model}
								onValueChange={(value) => setModel(String(value))}
							>
								<CreateInputSelectTrigger
									aria-label="Model"
									className="h-8 w-[160px] text-xs"
								>
									<CreateInputSelectValue />
								</CreateInputSelectTrigger>
								<CreateInputSelectContent>
									<CreateInputSelectItem value="gpt-4o">
										GPT-4o
									</CreateInputSelectItem>
									<CreateInputSelectItem value="gpt-4o-mini">
										GPT-4o Mini
									</CreateInputSelectItem>
									<CreateInputSelectItem value="claude-4-opus">
										Claude 4 Opus
									</CreateInputSelectItem>
									<CreateInputSelectItem value="claude-4-sonnet">
										Claude 4 Sonnet
									</CreateInputSelectItem>
									<CreateInputSelectItem value="gemini-2-flash">
										Gemini 2.0 Flash
									</CreateInputSelectItem>
								</CreateInputSelectContent>
							</CreateInputSelect>
						</CreateInputTools>
						<div className="flex items-center gap-2">
							<Button size="icon-sm" variant="ghost">
								<ImageIcon label="" />
							</Button>
							<CreateInputSubmit className="!h-8" status={status} />
						</div>
					</CreateInputFooter>
				</CreateInput>
			</CreateInputProvider>
		</DemoFrame>
	);
}

export function CreateInputDemoButtonTooltips() {
	const [prompt, setPrompt] = useState("");
	const [activeTool, setActiveTool] = useState<"attach" | "web" | "style">("attach");

	return (
		<DemoFrame>
			<CreateInput
				className="w-full [&>[data-slot=input-group]]:h-auto"
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<CreateInputBody>
					<CreateInputTextarea
						onChange={(event) => setPrompt(event.currentTarget.value)}
						placeholder="Try the tooltips on each action"
						rows={1}
						value={prompt}
					/>
				</CreateInputBody>
				<CreateInputFooter className="justify-between px-1">
					<CreateInputTools>
						<CreateInputButton
							aria-label="Add attachments"
							onClick={() => setActiveTool("attach")}
							size="icon-sm"
							tooltip={{ content: "Add attachments", shortcut: "⌘K" }}
							variant={activeTool === "attach" ? "secondary" : "ghost"}
						>
							<UploadIcon label="" />
						</CreateInputButton>
						<CreateInputButton
							aria-label="Search web"
							onClick={() => setActiveTool("web")}
							size="icon-sm"
							tooltip={{ content: "Search the web", shortcut: "⌘/" }}
							variant={activeTool === "web" ? "secondary" : "ghost"}
						>
							<SearchIcon label="" />
						</CreateInputButton>
						<CreateInputButton
							aria-label="Adjust response style"
							onClick={() => setActiveTool("style")}
							size="icon-sm"
							tooltip="Adjust response style"
							variant={activeTool === "style" ? "secondary" : "ghost"}
						>
							<CustomizeIcon label="" />
						</CreateInputButton>
					</CreateInputTools>
					<CreateInputSubmit aria-label="Submit" disabled={!prompt.trim()} />
				</CreateInputFooter>
			</CreateInput>
		</DemoFrame>
	);
}

export function CreateInputDemoActionMenu() {
	const [prompt, setPrompt] = useState("");
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<DemoFrame>
			<CreateInput
				className="w-full [&>[data-slot=input-group]]:h-auto"
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<CreateInputBody>
					<CreateInputTextarea
						onChange={(event) => setPrompt(event.currentTarget.value)}
						placeholder="Open the action menu to insert common prompt starters"
						rows={1}
						value={prompt}
					/>
				</CreateInputBody>
				<CreateInputFooter className="justify-between px-1">
					<CreateInputTools>
						<CreateInputActionMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
							<CreateInputActionMenuTrigger aria-label="Open actions" size="icon-sm" variant="ghost">
								<AddIcon label="" />
							</CreateInputActionMenuTrigger>
							<CreateInputActionMenuContent className="min-w-[240px] p-1">
								<CreateInputActionMenuItem
									onSelect={() => setPrompt("Summarize this thread into three bullet points.")}
									elemBefore={<UploadIcon label="" />}
								>
									Summarize thread
								</CreateInputActionMenuItem>
								<CreateInputActionMenuItem
									onSelect={() => setPrompt("List action items and owners from this conversation.")}
									elemBefore={<MentionIcon label="" />}
								>
									Extract action items
								</CreateInputActionMenuItem>
								<CreateInputActionMenuItem
									onSelect={() => setPrompt("Draft a response in a concise professional tone.")}
									elemBefore={<PageIcon label="" />}
								>
									Draft response
								</CreateInputActionMenuItem>
							</CreateInputActionMenuContent>
						</CreateInputActionMenu>
					</CreateInputTools>
					<CreateInputSubmit aria-label="Submit" disabled={!prompt.trim()} />
				</CreateInputFooter>
			</CreateInput>
		</DemoFrame>
	);
}

export function CreateInputDemoSubmitStatus() {
	const [prompt, setPrompt] = useState("");
	const [status, setStatus] = useState<ChatStatus | undefined>(undefined);
	const submitDisabled = status ? false : !prompt.trim();

	return (
		<DemoFrame className="flex flex-col gap-2">
			<div className="flex flex-wrap gap-1">
				<Button onClick={() => setStatus(undefined)} size="sm" variant="outline">Idle</Button>
				<Button onClick={() => setStatus("submitted")} size="sm" variant="outline">Submitted</Button>
				<Button onClick={() => setStatus("streaming")} size="sm" variant="outline">Streaming</Button>
				<Button onClick={() => setStatus("error")} size="sm" variant="outline">Error</Button>
			</div>
			<CreateInput
				className="w-full"
				onSubmit={() => {
					setStatus("submitted");
					setPrompt("");
				}}
			>
				<CreateInputBody>
					<CreateInputTextarea
						onChange={(event) => setPrompt(event.currentTarget.value)}
						placeholder="Submit to preview submit/streaming/error button states"
						rows={1}
						value={prompt}
					/>
				</CreateInputBody>
				<CreateInputFooter className="justify-end px-1">
					<CreateInputSubmit
						disabled={submitDisabled}
						onStop={() => setStatus(undefined)}
						status={status}
					>
						<ArrowUpIcon label="" />
					</CreateInputSubmit>
				</CreateInputFooter>
			</CreateInput>
			<p className="text-xs text-text-subtle">
				Status: <span className="font-medium text-text">{status ?? "idle"}</span>
			</p>
		</DemoFrame>
	);
}

export function CreateInputDemoModelSelect() {
	const [prompt, setPrompt] = useState("");
	const [model, setModel] = useState("gpt-5-mini");
	const [verbosity, setVerbosity] = useState("balanced");

	return (
		<DemoFrame>
			<CreateInput
				className="w-full [&>[data-slot=input-group]]:h-auto"
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<CreateInputBody>
					<CreateInputTextarea
						onChange={(event) => setPrompt(event.currentTarget.value)}
						placeholder="Choose model + style and send"
						rows={1}
						value={prompt}
					/>
				</CreateInputBody>
				<CreateInputFooter className="justify-between px-1">
					<CreateInputTools className="flex-wrap">
						<CreateInputSelect value={model} onValueChange={(value) => setModel(String(value))}>
							<CreateInputSelectTrigger aria-label="Model" className="h-8 w-[132px] text-xs">
								<CreateInputSelectValue />
							</CreateInputSelectTrigger>
							<CreateInputSelectContent>
								<CreateInputSelectItem value="gpt-5-mini">GPT-5 mini</CreateInputSelectItem>
								<CreateInputSelectItem value="claude-3-7">Claude 3.7</CreateInputSelectItem>
								<CreateInputSelectItem value="gemini-2.5">Gemini 2.5</CreateInputSelectItem>
							</CreateInputSelectContent>
						</CreateInputSelect>
						<CreateInputSelect value={verbosity} onValueChange={(value) => setVerbosity(String(value))}>
							<CreateInputSelectTrigger aria-label="Response style" className="h-8 w-[132px] text-xs">
								<CreateInputSelectValue />
							</CreateInputSelectTrigger>
							<CreateInputSelectContent>
								<CreateInputSelectItem value="concise">Concise</CreateInputSelectItem>
								<CreateInputSelectItem value="balanced">Balanced</CreateInputSelectItem>
								<CreateInputSelectItem value="detailed">Detailed</CreateInputSelectItem>
							</CreateInputSelectContent>
						</CreateInputSelect>
					</CreateInputTools>
					<CreateInputSubmit aria-label="Submit" disabled={!prompt.trim()} />
				</CreateInputFooter>
			</CreateInput>
			<p className="text-xs text-text-subtle">
				Model <span className="font-medium text-text">{model}</span> · Style <span className="font-medium text-text">{verbosity}</span>
			</p>
		</DemoFrame>
	);
}

export function CreateInputDemoProviderControlled() {
	return (
		<CreateInputProvider initialInput="Generate release notes from this sprint's pull requests.">
			<ProviderControlledCreateInput />
		</CreateInputProvider>
	);
}

function ProviderControlledCreateInput() {
	const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState("");
	const controller = useCreateInputController();
	const isSubmitDisabled = controller.textInput.value.trim().length === 0;

	return (
		<DemoFrame className="flex flex-col gap-2">
			<div className="flex flex-wrap items-center gap-1">
				<Button
					onClick={() => controller.textInput.setInput("Summarize the latest release highlights in 5 bullets.")}
					size="sm"
					variant="outline"
				>
					Insert template
				</Button>
				<Button
					onClick={() => controller.textInput.setInput("/fix TypeScript errors in components/website/registry.ts")}
					size="sm"
					variant="outline"
				>
					Insert command
				</Button>
				<Button
					onClick={() => controller.textInput.clear()}
					size="sm"
					variant="outline"
				>
					Clear
				</Button>
				<span className="ml-auto text-xs text-text-subtle">{controller.textInput.value.length} chars</span>
			</div>

			<CreateInput
				className="w-full"
				onSubmit={({ text }) => {
					setLastSubmittedPrompt(text);
				}}
			>
				<CreateInputBody>
					<CreateInputTextarea placeholder="Prompt is controlled by CreateInputProvider" rows={1} />
				</CreateInputBody>
				<CreateInputFooter className="justify-between px-1">
					<CreateInputTools>
						<CreateInputButton size="sm" tooltip="Append @mentions" variant="ghost">
							<MentionIcon label="" />
							Mentions
						</CreateInputButton>
					</CreateInputTools>
					<CreateInputSubmit aria-label="Submit" disabled={isSubmitDisabled} />
				</CreateInputFooter>
			</CreateInput>

			{lastSubmittedPrompt ? (
				<p className="text-xs text-text-subtle">
					Last submitted: <span className="font-medium text-text">{lastSubmittedPrompt}</span>
				</p>
			) : null}
		</DemoFrame>
	);
}

export function CreateInputDemoFloatingBar() {
	const [prompt, setPrompt] = useState("");

	const handleSpeechTranscription = useCallback(
		(transcription: string) => {
			setPrompt((prev) => (prev ? `${prev} ${transcription}` : transcription));
		},
		[],
	);

	return (
		<DemoFrame>
			<CreateInput
				variant="floating"
				allowOverflow
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<CreateInputBody className="flex w-full items-center justify-between gap-2">
					<CreateInputTextarea
						value={prompt}
						onChange={(e) => setPrompt(e.currentTarget.value)}
						placeholder="Ask, @mention, or / for actions"
						rows={1}
						className="min-h-0 flex-1 py-0"
					/>
					<div className="flex shrink-0 items-center gap-1">
						<SpeechInput
							aria-label="Voice"
							onTranscriptionChange={handleSpeechTranscription}
							variant="ghost"
						/>
						<CreateInputSubmit
							disabled={!prompt.trim()}
							aria-label="Submit"
						>
							<ArrowUpIcon label="" />
						</CreateInputSubmit>
					</div>
				</CreateInputBody>
			</CreateInput>
		</DemoFrame>
	);
}
