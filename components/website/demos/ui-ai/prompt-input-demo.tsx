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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionAddScreenshot,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuItem,
	PromptInputActionMenuTrigger,
	PromptInputBody,
	PromptInputButton,
	PromptInputCommand,
	PromptInputCommandEmpty,
	PromptInputCommandGroup,
	PromptInputCommandInput,
	PromptInputCommandItem,
	PromptInputCommandList,
	PromptInputCommandSeparator,

	PromptInputFooter,
	PromptInputHeader,
	PromptInputHoverCard,
	PromptInputHoverCardContent,
	PromptInputHoverCardTrigger,
	PromptInputProvider,
	PromptInputSelect,
	PromptInputSelectContent,
	PromptInputSelectItem,
	PromptInputSelectTrigger,
	PromptInputSelectValue,
	PromptInputSubmit,
	PromptInputTab,
	PromptInputTabBody,
	PromptInputTabItem,
	PromptInputTabLabel,
	PromptInputTextarea,
	PromptInputTools,
	usePromptInputController,
	usePromptInputReferencedSources,
} from "@/components/ui-ai/prompt-input";
import { SpeechInput } from "@/components/ui-ai/speech-input";
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

export default function PromptInputDemo() {
	return <PromptInputDemoChatComposer />;
}

export function PromptInputDemoChatComposer() {
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
					<PromptInput
						allowOverflow
						onSubmit={() => {
							setPrompt("");
						}}
						className={composerPromptInputClassName}
					>
						<PromptInputBody>
							<PromptInputTextarea
								value={prompt}
								onChange={(event) => setPrompt(event.currentTarget.value)}
								placeholder="Ask, @mention, or / for skills"
								aria-label="Chat message input"
								rows={1}
								className={composerTextareaClassName}
							/>
						</PromptInputBody>

						<PromptInputFooter className="justify-between px-0 pb-0">
							<PromptInputTools>
								<PromptInputActionMenu open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
									<PromptInputActionMenuTrigger aria-label="Add" size="icon-sm" variant="ghost">
										<AddIcon label="" />
									</PromptInputActionMenuTrigger>
									<PromptInputActionMenuContent>
										<PromptInputActionAddAttachments
											elemBefore={<UploadIcon label="" />}
										>
											Upload file
										</PromptInputActionAddAttachments>
										<PromptInputActionAddScreenshot
											elemBefore={<ScreenIcon label="" />}
										>
											Take screenshot
										</PromptInputActionAddScreenshot>
										<PromptInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<LinkIcon label="" />}
										>
											Add a link
										</PromptInputActionMenuItem>
										<PromptInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<MentionIcon label="" />}
										>
											Mention someone
										</PromptInputActionMenuItem>
										<PromptInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<AddIcon label="" />}
										>
											More formatting
										</PromptInputActionMenuItem>
										<PromptInputActionMenuItem
											onSelect={() => setIsAddMenuOpen(false)}
											elemBefore={<PageIcon label="" />}
										>
											Add current page as context
										</PromptInputActionMenuItem>
									</PromptInputActionMenuContent>
								</PromptInputActionMenu>

								<Popover open={isCustomizeMenuOpen} onOpenChange={setIsCustomizeMenuOpen}>
									<PopoverTrigger
										render={
											<PromptInputButton
												aria-label="Customize"
												size="icon-sm"
												variant="ghost"
											/>
										}
									>
										<CustomizeIcon label="" />
									</PopoverTrigger>
									<PopoverContent side="top" align="start" sideOffset={8} className="w-auto p-2">
										<CustomizeMenu
											selectedReasoning={selectedReasoning}
											onReasoningChange={setSelectedReasoning}
											webResultsEnabled={webResultsEnabled}
											onWebResultsChange={setWebResultsEnabled}
											companyKnowledgeEnabled={companyKnowledgeEnabled}
											onCompanyKnowledgeChange={setCompanyKnowledgeEnabled}
											onClose={() => setIsCustomizeMenuOpen(false)}
										/>
									</PopoverContent>
								</Popover>
							</PromptInputTools>

							<div className="flex items-center gap-1">
								<SpeechInput aria-label="Voice" onTranscriptionChange={handleSpeechTranscription} size="icon" />
								<PromptInputSubmit aria-label="Submit" disabled={!prompt.trim()} size="icon-sm">
									<ArrowUpIcon label="" />
								</PromptInputSubmit>
							</div>
						</PromptInputFooter>
					</PromptInput>

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
		title: "prompt-input.tsx",
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
		{ path: "apps/test/app/examples/prompt-input.tsx" },
		{ path: "packages/elements/src/queue.tsx" },
		{ path: "apps/test/app/examples/queue.tsx" },
	],
};

const SUBMITTING_TIMEOUT = 200;
const STREAMING_TIMEOUT = 2000;

function CursorReferencedSourcesDisplay() {
	const refs = usePromptInputReferencedSources();

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
	// eslint-disable-next-line react-hooks/refs
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
	const refs = usePromptInputReferencedSources();

	const handleAdd = useCallback(
		(source: SourceDocumentUIPart) => refs.add(source),
		[refs],
	);

	return (
		<PromptInputCommand>
			<PromptInputCommandInput
				className="border-none focus-visible:ring-0"
				placeholder="Add files, folders, docs..."
			/>
			<PromptInputCommandList>
				<PromptInputCommandEmpty className="p-3 text-sm text-text-subtle">
					No results found.
				</PromptInputCommandEmpty>
				<PromptInputCommandGroup heading="Added">
					<PromptInputCommandItem>
						<GlobeIcon label="" />
						<span>Active Tabs</span>
						<span className="ml-auto text-text-subtle">✓</span>
					</PromptInputCommandItem>
				</PromptInputCommandGroup>
				<PromptInputCommandSeparator />
				<PromptInputCommandGroup heading="Other Files">
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
							<PromptInputCommandItem
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
							</PromptInputCommandItem>
						))}
				</PromptInputCommandGroup>
			</PromptInputCommandList>
		</PromptInputCommand>
	);
}

export function PromptInputDemoCursorStyle() {
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
			<PromptInputProvider>
				<PromptInput
					className="w-full [&>[data-slot=input-group]]:h-auto"
					globalDrop
					multiple
					onSubmit={handleSubmit}
				>
					<PromptInputHeader className="order-first border-b border-border px-1 pb-2">
						<PromptInputHoverCard>
							<PromptInputHoverCardTrigger>
								<PromptInputButton
									className="!h-8"
									size="icon-sm"
									variant="outline"
								>
									<MentionIcon label="" />
								</PromptInputButton>
							</PromptInputHoverCardTrigger>
							<PromptInputHoverCardContent className="w-[400px] overflow-hidden p-0">
								<ScrollLock>
									<CursorSampleFilesMenu />
								</ScrollLock>
							</PromptInputHoverCardContent>
						</PromptInputHoverCard>
						<PromptInputHoverCard>
							<PromptInputHoverCardTrigger>
								<PromptInputButton size="sm" variant="outline">
									<CustomizeIcon label="" />
									<span>1</span>
								</PromptInputButton>
							</PromptInputHoverCardTrigger>
							<PromptInputHoverCardContent className="divide-y overflow-hidden p-0">
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
							</PromptInputHoverCardContent>
						</PromptInputHoverCard>
						<PromptInputHoverCard>
							<PromptInputHoverCardTrigger>
								<PromptInputButton size="sm" variant="outline">
									<PageIcon label="" />
									<span>1 Tab</span>
								</PromptInputButton>
							</PromptInputHoverCardTrigger>
							<PromptInputHoverCardContent className="flex w-[300px] flex-col gap-4 px-0 py-3">
								<PromptInputTab>
									<PromptInputTabLabel>Active Tabs</PromptInputTabLabel>
									<PromptInputTabBody>
										{sampleTabs.active.map((tab) => (
											<PromptInputTabItem key={tab.path}>
												<GlobeIcon label="" />
												<span className="truncate" dir="rtl">
													{tab.path}
												</span>
											</PromptInputTabItem>
										))}
									</PromptInputTabBody>
								</PromptInputTab>
								<PromptInputTab>
									<PromptInputTabLabel>Recents</PromptInputTabLabel>
									<PromptInputTabBody>
										{sampleTabs.recents.map((tab) => (
											<PromptInputTabItem key={tab.path}>
												<GlobeIcon label="" />
												<span className="truncate" dir="rtl">
													{tab.path}
												</span>
											</PromptInputTabItem>
										))}
									</PromptInputTabBody>
								</PromptInputTab>
								<div className="border-t px-3 pt-2 text-xs text-text-subtlest">
									Only file paths are included
								</div>
							</PromptInputHoverCardContent>
						</PromptInputHoverCard>
						<CursorReferencedSourcesDisplay />
					</PromptInputHeader>

					<PromptInputBody>
						<PromptInputTextarea placeholder="Plan, search, build anything" />
					</PromptInputBody>

					<PromptInputFooter className="justify-between border-t border-border px-1 pt-2">
						<PromptInputTools>
							<PromptInputSelect
								value={model}
								onValueChange={(value) => setModel(String(value))}
							>
								<PromptInputSelectTrigger
									aria-label="Model"
									className="h-8 w-[160px] text-xs"
								>
									<PromptInputSelectValue />
								</PromptInputSelectTrigger>
								<PromptInputSelectContent>
									<PromptInputSelectItem value="gpt-4o">
										GPT-4o
									</PromptInputSelectItem>
									<PromptInputSelectItem value="gpt-4o-mini">
										GPT-4o Mini
									</PromptInputSelectItem>
									<PromptInputSelectItem value="claude-4-opus">
										Claude 4 Opus
									</PromptInputSelectItem>
									<PromptInputSelectItem value="claude-4-sonnet">
										Claude 4 Sonnet
									</PromptInputSelectItem>
									<PromptInputSelectItem value="gemini-2-flash">
										Gemini 2.0 Flash
									</PromptInputSelectItem>
								</PromptInputSelectContent>
							</PromptInputSelect>
						</PromptInputTools>
						<div className="flex items-center gap-2">
							<Button size="icon-sm" variant="ghost">
								<ImageIcon label="" />
							</Button>
							<PromptInputSubmit className="!h-8" status={status} />
						</div>
					</PromptInputFooter>
				</PromptInput>
			</PromptInputProvider>
		</DemoFrame>
	);
}

export function PromptInputDemoButtonTooltips() {
	const [prompt, setPrompt] = useState("");
	const [activeTool, setActiveTool] = useState<"attach" | "web" | "style">("attach");

	return (
		<DemoFrame>
			<PromptInput
				className="w-full [&>[data-slot=input-group]]:h-auto"
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<PromptInputBody>
					<PromptInputTextarea
						onChange={(event) => setPrompt(event.currentTarget.value)}
						placeholder="Try the tooltips on each action"
						rows={1}
						value={prompt}
					/>
				</PromptInputBody>
				<PromptInputFooter className="justify-between px-1">
					<PromptInputTools>
						<PromptInputButton
							aria-label="Add attachments"
							onClick={() => setActiveTool("attach")}
							size="icon-sm"
							tooltip={{ content: "Add attachments", shortcut: "⌘K" }}
							variant={activeTool === "attach" ? "secondary" : "ghost"}
						>
							<UploadIcon label="" />
						</PromptInputButton>
						<PromptInputButton
							aria-label="Search web"
							onClick={() => setActiveTool("web")}
							size="icon-sm"
							tooltip={{ content: "Search the web", shortcut: "⌘/" }}
							variant={activeTool === "web" ? "secondary" : "ghost"}
						>
							<SearchIcon label="" />
						</PromptInputButton>
						<PromptInputButton
							aria-label="Adjust response style"
							onClick={() => setActiveTool("style")}
							size="icon-sm"
							tooltip="Adjust response style"
							variant={activeTool === "style" ? "secondary" : "ghost"}
						>
							<CustomizeIcon label="" />
						</PromptInputButton>
					</PromptInputTools>
					<PromptInputSubmit aria-label="Submit" disabled={!prompt.trim()} />
				</PromptInputFooter>
			</PromptInput>
		</DemoFrame>
	);
}

export function PromptInputDemoActionMenu() {
	const [prompt, setPrompt] = useState("");
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<DemoFrame>
			<PromptInput
				className="w-full [&>[data-slot=input-group]]:h-auto"
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<PromptInputBody>
					<PromptInputTextarea
						onChange={(event) => setPrompt(event.currentTarget.value)}
						placeholder="Open the action menu to insert common prompt starters"
						rows={1}
						value={prompt}
					/>
				</PromptInputBody>
				<PromptInputFooter className="justify-between px-1">
					<PromptInputTools>
						<PromptInputActionMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
							<PromptInputActionMenuTrigger aria-label="Open actions" size="icon-sm" variant="ghost">
								<AddIcon label="" />
							</PromptInputActionMenuTrigger>
							<PromptInputActionMenuContent className="min-w-[240px] p-1">
								<PromptInputActionMenuItem
									onSelect={() => setPrompt("Summarize this thread into three bullet points.")}
									elemBefore={<UploadIcon label="" />}
								>
									Summarize thread
								</PromptInputActionMenuItem>
								<PromptInputActionMenuItem
									onSelect={() => setPrompt("List action items and owners from this conversation.")}
									elemBefore={<MentionIcon label="" />}
								>
									Extract action items
								</PromptInputActionMenuItem>
								<PromptInputActionMenuItem
									onSelect={() => setPrompt("Draft a response in a concise professional tone.")}
									elemBefore={<PageIcon label="" />}
								>
									Draft response
								</PromptInputActionMenuItem>
							</PromptInputActionMenuContent>
						</PromptInputActionMenu>
					</PromptInputTools>
					<PromptInputSubmit aria-label="Submit" disabled={!prompt.trim()} />
				</PromptInputFooter>
			</PromptInput>
		</DemoFrame>
	);
}

export function PromptInputDemoSubmitStatus() {
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
			<PromptInput
				className="w-full"
				onSubmit={() => {
					setStatus("submitted");
					setPrompt("");
				}}
			>
				<PromptInputBody>
					<PromptInputTextarea
						onChange={(event) => setPrompt(event.currentTarget.value)}
						placeholder="Submit to preview submit/streaming/error button states"
						rows={1}
						value={prompt}
					/>
				</PromptInputBody>
				<PromptInputFooter className="justify-end px-1">
					<PromptInputSubmit
						disabled={submitDisabled}
						onStop={() => setStatus(undefined)}
						status={status}
					>
						<ArrowUpIcon label="" />
					</PromptInputSubmit>
				</PromptInputFooter>
			</PromptInput>
			<p className="text-xs text-text-subtle">
				Status: <span className="font-medium text-text">{status ?? "idle"}</span>
			</p>
		</DemoFrame>
	);
}

export function PromptInputDemoModelSelect() {
	const [prompt, setPrompt] = useState("");
	const [model, setModel] = useState("gpt-5-mini");
	const [verbosity, setVerbosity] = useState("balanced");

	return (
		<DemoFrame>
			<PromptInput
				className="w-full [&>[data-slot=input-group]]:h-auto"
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<PromptInputBody>
					<PromptInputTextarea
						onChange={(event) => setPrompt(event.currentTarget.value)}
						placeholder="Choose model + style and send"
						rows={1}
						value={prompt}
					/>
				</PromptInputBody>
				<PromptInputFooter className="justify-between px-1">
					<PromptInputTools className="flex-wrap">
						<PromptInputSelect value={model} onValueChange={(value) => setModel(String(value))}>
							<PromptInputSelectTrigger aria-label="Model" className="h-8 w-[132px] text-xs">
								<PromptInputSelectValue />
							</PromptInputSelectTrigger>
							<PromptInputSelectContent>
								<PromptInputSelectItem value="gpt-5-mini">GPT-5 mini</PromptInputSelectItem>
								<PromptInputSelectItem value="claude-3-7">Claude 3.7</PromptInputSelectItem>
								<PromptInputSelectItem value="gemini-2.5">Gemini 2.5</PromptInputSelectItem>
							</PromptInputSelectContent>
						</PromptInputSelect>
						<PromptInputSelect value={verbosity} onValueChange={(value) => setVerbosity(String(value))}>
							<PromptInputSelectTrigger aria-label="Response style" className="h-8 w-[132px] text-xs">
								<PromptInputSelectValue />
							</PromptInputSelectTrigger>
							<PromptInputSelectContent>
								<PromptInputSelectItem value="concise">Concise</PromptInputSelectItem>
								<PromptInputSelectItem value="balanced">Balanced</PromptInputSelectItem>
								<PromptInputSelectItem value="detailed">Detailed</PromptInputSelectItem>
							</PromptInputSelectContent>
						</PromptInputSelect>
					</PromptInputTools>
					<PromptInputSubmit aria-label="Submit" disabled={!prompt.trim()} />
				</PromptInputFooter>
			</PromptInput>
			<p className="text-xs text-text-subtle">
				Model <span className="font-medium text-text">{model}</span> · Style <span className="font-medium text-text">{verbosity}</span>
			</p>
		</DemoFrame>
	);
}

export function PromptInputDemoProviderControlled() {
	return (
		<PromptInputProvider initialInput="Generate release notes from this sprint's pull requests.">
			<ProviderControlledPromptInput />
		</PromptInputProvider>
	);
}

function ProviderControlledPromptInput() {
	const [lastSubmittedPrompt, setLastSubmittedPrompt] = useState("");
	const controller = usePromptInputController();
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

			<PromptInput
				className="w-full"
				onSubmit={({ text }) => {
					setLastSubmittedPrompt(text);
				}}
			>
				<PromptInputBody>
					<PromptInputTextarea placeholder="Prompt is controlled by PromptInputProvider" rows={1} />
				</PromptInputBody>
				<PromptInputFooter className="justify-between px-1">
					<PromptInputTools>
						<PromptInputButton size="sm" tooltip="Append @mentions" variant="ghost">
							<MentionIcon label="" />
							Mentions
						</PromptInputButton>
					</PromptInputTools>
					<PromptInputSubmit aria-label="Submit" disabled={isSubmitDisabled} />
				</PromptInputFooter>
			</PromptInput>

			{lastSubmittedPrompt ? (
				<p className="text-xs text-text-subtle">
					Last submitted: <span className="font-medium text-text">{lastSubmittedPrompt}</span>
				</p>
			) : null}
		</DemoFrame>
	);
}

export function PromptInputDemoFloatingBar() {
	const [prompt, setPrompt] = useState("");

	const handleSpeechTranscription = useCallback(
		(transcription: string) => {
			setPrompt((prev) => (prev ? `${prev} ${transcription}` : transcription));
		},
		[],
	);

	return (
		<DemoFrame>
			<PromptInput
				variant="floating"
				allowOverflow
				onSubmit={() => {
					setPrompt("");
				}}
			>
				<PromptInputBody className="flex w-full items-center justify-between gap-2">
					<PromptInputTextarea
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
						<PromptInputSubmit
							disabled={!prompt.trim()}
							aria-label="Submit"
						>
							<ArrowUpIcon label="" />
						</PromptInputSubmit>
					</div>
				</PromptInputBody>
			</PromptInput>
		</DemoFrame>
	);
}
