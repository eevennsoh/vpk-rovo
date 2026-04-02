"use client";

import {
	type CSSProperties,
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";
import { API_ENDPOINTS } from "@/lib/api-config";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { AgentRun, AgentRunListItem, AgentRunSummary } from "@/lib/make-run-types";
import NotificationIcon from "@atlaskit/icon/core/notification";
import { Icon } from "@/components/ui/icon";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import ClipboardIcon from "@atlaskit/icon/core/clipboard";
import PaintPaletteIcon from "@atlaskit/icon/core/paint-palette";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import { MakeArtifactSidebar } from "./components/make-artifact-sidebar";
import SummaryTitleRow from "./components/summary-title-row";
import TerminalSwitchPanel from "@/components/blocks/terminal-switch/page";
import {
	FileTree,
	FileTreeFile,
	FileTreeFolder,
} from "@/components/ui-ai/file-tree";
import { GUI } from "@/components/utils/gui";
import { MessageResponse } from "@/components/ui-ai/message";
import {
	getLatestPlanWidgetPayload,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import {
	resolvePlanDisplayTitle,
} from "@/components/projects/shared/lib/plan-identity";

type ArtifactRightPanelMode = "design" | "chat" | "files";
type ArtifactLeftPanelMode = "preview" | "plan";

interface DisplayPlanTask {
	id: string;
	label: string;
	agentName: string | null;
	blockedBy: string[];
}

interface DisplayPlan {
	source: "run" | "chat-draft";
	resolvedTitle: string;
	description?: string;
	agents: string[];
	tasks: DisplayPlanTask[];
}

interface ChatThreadRecord {
	id: string;
	messages?: unknown[];
}

interface RunsResponse {
	runs?: AgentRunListItem[];
	error?: string;
}

interface RunResponse {
	run?: AgentRun;
	error?: string;
}

interface RunSummaryResponse {
	run?: AgentRun;
	summary?: AgentRunSummary | null;
	error?: string;
}

interface ChatThreadsResponse {
	threads?: ChatThreadRecord[];
	error?: string;
}

function parseErrorMessage(payload: unknown): string {
	if (!payload || typeof payload !== "object") {
		return "Request failed";
	}

	const record = payload as { error?: unknown; details?: unknown };
	if (typeof record.error === "string" && record.error.trim()) {
		return record.error.trim();
	}
	if (typeof record.details === "string" && record.details.trim()) {
		return record.details.trim();
	}

	return "Request failed";
}

function normalizeSummaryMarkdown(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		return "";
	}

	const preMatch = trimmed.match(/^<pre(?:\s[^>]*)?>([\s\S]*?)<\/pre>$/i);
	const preUnwrapped = (preMatch?.[1] ?? trimmed).trim();
	const codeMatch = preUnwrapped.match(/^<code(?:\s[^>]*)?>([\s\S]*?)<\/code>$/i);

	return (codeMatch?.[1] ?? preUnwrapped).trim();
}

function TopNavBar() {
	return (
		<div className="flex items-center justify-between border-b border-border px-4 py-2">
			<Tabs defaultValue="make">
				<TabsList>
					<TabsTrigger value="home">Home</TabsTrigger>
					<TabsTrigger value="make">Make</TabsTrigger>
					<TabsTrigger value="chat">Chat</TabsTrigger>
					<TabsTrigger value="search">Search</TabsTrigger>
				</TabsList>
			</Tabs>

			<div className="flex items-center gap-1 text-icon-subtle">
				<ThemeToggle />
				<Button aria-label="Notifications" size="icon" variant="ghost">
					<NotificationIcon label="" />
				</Button>
				<Avatar size="sm">
					<AvatarImage src="/avatar-human/austin-lambert.png" alt="User avatar" />
					<AvatarFallback>A</AvatarFallback>
				</Avatar>
			</div>
		</div>
	);
}

function ContentTabBar({
	leftMode,
	onLeftModeChange,
	panelMode,
	onPanelModeChange,
}: Readonly<{
	leftMode: ArtifactLeftPanelMode;
	onLeftModeChange: (nextMode: ArtifactLeftPanelMode) => void;
	panelMode: ArtifactRightPanelMode;
	onPanelModeChange: (nextMode: ArtifactRightPanelMode) => void;
}>) {
	return (
		<div className="flex items-start justify-between">
			<ToggleGroup
				value={[leftMode]}
				onValueChange={(newValue: string[]) => {
					if (newValue.length > 0) {
						onLeftModeChange(newValue[0] as ArtifactLeftPanelMode);
					}
				}}
				variant="outline"
				spacing={0}
			>
				<ToggleGroupItem value="preview">
					<Icon render={<EyeOpenIcon label="" />} label="Preview" />
					Preview
				</ToggleGroupItem>
				<ToggleGroupItem value="plan">
					<Icon render={<ClipboardIcon label="" />} label="Plan" />
					Plan
				</ToggleGroupItem>
			</ToggleGroup>

			<ToggleGroup
				value={[panelMode]}
				onValueChange={(newValue: string[]) => {
					if (newValue.length > 0) {
						onPanelModeChange(newValue[0] as ArtifactRightPanelMode);
					}
				}}
				variant="outline"
				spacing={0}
			>
				<ToggleGroupItem value="design">
					<Icon render={<PaintPaletteIcon label="" />} label="Design" />
					Design
				</ToggleGroupItem>
				<ToggleGroupItem value="chat">
					<Icon render={<AiChatIcon label="" />} label="Chat" />
					Chat
				</ToggleGroupItem>
				<ToggleGroupItem value="files">
					<Icon render={<FolderClosedIcon label="" />} label="Files" />
					Files
				</ToggleGroupItem>
			</ToggleGroup>
		</div>
	);
}

function FilesPanel() {
	const [selectedPath, setSelectedPath] = useState("src/agents/designer.ts");

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex h-11 items-center border-border border-b px-4">
				<span style={{ font: token("font.heading.xsmall") }} className="text-text">
					File tree
				</span>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-3">
				<FileTree
					className="w-full text-xs"
					defaultExpanded={new Set([
						"src",
						"src/agents",
						"src/agents/prompts",
					])}
					selectedPath={selectedPath}
					{...{ onSelect: setSelectedPath } as Record<string, unknown>}
				>
					<FileTreeFolder path="src" name="src">
						<FileTreeFolder path="src/agents" name="agents">
							<FileTreeFile path="src/agents/designer.ts" name="designer.ts" />
							<FileTreeFile path="src/agents/coder.ts" name="coder.ts" />
							<FileTreeFolder path="src/agents/prompts" name="prompts">
								<FileTreeFile
									path="src/agents/prompts/brief.md"
									name="brief.md"
								/>
								<FileTreeFile
									path="src/agents/prompts/checklist.md"
									name="checklist.md"
								/>
							</FileTreeFolder>
						</FileTreeFolder>
						<FileTreeFolder path="src/ui" name="ui">
							<FileTreeFile path="src/ui/app-shell.tsx" name="app-shell.tsx" />
							<FileTreeFile path="src/ui/output-panel.tsx" name="output-panel.tsx" />
						</FileTreeFolder>
					</FileTreeFolder>
					<FileTreeFile path="package.json" name="package.json" />
					<FileTreeFile path="README.md" name="README.md" />
				</FileTree>
			</div>
		</div>
	);
}

function DesignPanel() {
	const [canvasScale, setCanvasScale] = useState(82);
	const [cornerRadius, setCornerRadius] = useState(18);
	const [motionEnabled, setMotionEnabled] = useState(true);
	const [palette, setPalette] = useState<"info" | "success">("info");
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface">
			<div className="flex h-11 items-center border-border border-b px-4">
				<span style={{ font: token("font.heading.xsmall") }} className="text-text">
					Design
				</span>
			</div>
			<div className="min-h-0 flex-1 overflow-auto p-4">
				<GUI.Panel
					title="GUI controls"
					values={{ canvasScale, cornerRadius, motionEnabled, palette }}
				>
					<GUI.Control
						id="make-artifact-canvas-scale"
						label="Canvas scale"
						description="Controls the preview block size."
						value={canvasScale}
						defaultValue={82}
						min={55}
						max={100}
						step={1}
						unit="%"
						onChange={setCanvasScale}
					/>
					<GUI.Control
						id="make-artifact-corner-radius"
						label="Corner radius"
						description="Adjusts the preview corner radius."
						value={cornerRadius}
						defaultValue={18}
						min={0}
						max={32}
						step={1}
						unit="px"
						onChange={setCornerRadius}
					/>
					<GUI.Toggle
						id="make-artifact-motion"
						label="Motion"
						description="Adds elevation and slight lift to the preview."
						checked={motionEnabled}
						onChange={setMotionEnabled}
					/>
					<GUI.Select
						id="make-artifact-palette"
						label="Palette"
						description="Switches between two semantic palettes."
						value={palette}
						options={[
							{ value: "info", label: "Info" },
							{ value: "success", label: "Success" },
						]}
						onChange={setPalette}
					/>
				</GUI.Panel>
			</div>
		</div>
	);
}

function LoadingPanel({
	title,
}: Readonly<{
	title: string;
}>) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface p-6 text-center">
			<div className="size-5 animate-spin rounded-full border border-border border-t-text-subtle" />
			<p className="text-sm text-text-subtle">{title}</p>
		</div>
	);
}

function EmptyPanel({
	title,
	description,
}: Readonly<{
	title: string;
	description: string;
}>) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface p-6 text-center">
			<p style={{ font: token("font.heading.xsmall") }} className="text-text">
				{title}
			</p>
			<p className="max-w-md text-sm text-text-subtle">{description}</p>
		</div>
	);
}

function PreviewOutputPanel({
	isRunLoading,
	hasSelectedRun,
	hasDraftPlan,
}: Readonly<{
	isRunLoading: boolean;
	hasSelectedRun: boolean;
	hasDraftPlan: boolean;
}>) {
	if (isRunLoading) {
		return <LoadingPanel title="Loading preview..." />;
	}

	if (hasSelectedRun) {
		return (
			<EmptyPanel
				title="No preview yet"
				description="Visual preview will appear here once an artifact is generated."
			/>
		);
	}

	if (hasDraftPlan) {
		return (
			<EmptyPanel
				title="No preview yet"
				description="A draft plan was found in chat history, but no artifact preview exists yet."
			/>
		);
	}

	return (
		<EmptyPanel
			title="No saved output"
			description="Start a make run to persist one plan and one output."
		/>
	);
}

function PlanPanel({
	isRunLoading,
	plan,
	summaryContent,
}: Readonly<{
	isRunLoading: boolean;
	plan: DisplayPlan | null;
	summaryContent: string;
}>) {
	if (isRunLoading) {
		return <LoadingPanel title="Loading plan..." />;
	}

	if (!plan && summaryContent.length === 0) {
		return (
			<EmptyPanel
				title="No saved plan"
				description="No plan was found in saved runs or chat threads."
			/>
		);
	}

	const normalizedSummaryContent = normalizeSummaryMarkdown(summaryContent);

	return (
		<div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
			<Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col !gap-0">
				<div className="pt-3">
					<TabsList variant="line" className="w-full justify-start px-4">
						<TabsTrigger value="summary" className="flex-initial">Summary</TabsTrigger>
						<TabsTrigger value="tasks" className="flex-initial">Tasks ({plan?.tasks.length ?? 0})</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="summary" className="min-h-0 flex-1 overflow-auto px-4 py-4">
					{normalizedSummaryContent.length > 0 ? (
						<MessageResponse
							isAnimating={false}
							className="size-full text-sm leading-6 text-text [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_h1]:mt-3 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:leading-7 [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:leading-6 [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:leading-5 [&_h3]:font-semibold [&_p]:my-0"
						>
							{normalizedSummaryContent}
						</MessageResponse>
					) : (
						<p className="text-sm text-text-subtle">No summary yet.</p>
					)}
				</TabsContent>
				<TabsContent value="tasks" className="min-h-0 flex-1 overflow-auto px-4 py-4">
					{plan ? (
						<ol className="flex flex-col gap-0">
							{plan.tasks.map((task, index) => {
								const blockedByText = task.blockedBy.length > 0
									? `Blocked by ${task.blockedBy.map((id) => `#${id.replace(/^task-/, "")}`).join(", ")}`
									: undefined;
								return (
									<li
										key={task.id}
										className="flex min-h-8 shrink-0 items-center gap-4 rounded-lg bg-surface px-2 py-1.5"
									>
										<span className="inline-flex size-5 shrink-0 items-center justify-center rounded-[4px] border border-border bg-surface text-sm leading-5 font-medium text-text">
											{index + 1}
										</span>
										<div className="flex min-w-0 flex-1 flex-col gap-0.5">
											<span className="text-sm leading-5 text-text">{task.label}</span>
											{blockedByText ? (
												<span className="text-xs leading-4 text-text-subtlest">{blockedByText}</span>
											) : null}
										</div>
									</li>
								);
							})}
						</ol>
					) : (
						<p className="text-sm text-text-subtle">No plan available.</p>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}

function TwoPanelLayout({
	leftMode,
	panelMode,
	isRunLoading,
	plan,
	hasSelectedRun,
	hasDraftPlan,
	summaryContent,
}: Readonly<{
	leftMode: ArtifactLeftPanelMode;
	panelMode: ArtifactRightPanelMode;
	isRunLoading: boolean;
	plan: DisplayPlan | null;
	hasSelectedRun: boolean;
	hasDraftPlan: boolean;
	summaryContent: string;
}>) {
	const rightPanel =
		panelMode === "chat"
			? <TerminalSwitchPanel />
			: panelMode === "files"
				? <FilesPanel />
				: <DesignPanel />;

	return (
		<div className="flex min-h-0 flex-1 gap-4">
			<div className="min-h-0 min-w-0 flex-1">
				{leftMode === "plan" ? (
					<PlanPanel isRunLoading={isRunLoading} plan={plan} summaryContent={summaryContent} />
				) : (
					<PreviewOutputPanel
						isRunLoading={isRunLoading}
						hasSelectedRun={hasSelectedRun}
						hasDraftPlan={hasDraftPlan}
					/>
				)}
			</div>
			<div className="min-h-0 w-[400px] max-w-full shrink-0">
				{rightPanel}
			</div>
		</div>
	);
}

export default function MakeArtifactBlock() {
	const [isOpen, setIsOpen] = useState(true);
	const [isHovered, setIsHovered] = useState(false);
	const [panelMode, setPanelMode] = useState<ArtifactRightPanelMode>("chat");
	const [leftMode, setLeftMode] = useState<ArtifactLeftPanelMode>("preview");
	const [runs, setRuns] = useState<AgentRunListItem[]>([]);
	const [activeRunId, setActiveRunId] = useState<string | null>(null);
	const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);
	const [fallbackPlan, setFallbackPlan] = useState<ParsedPlanWidgetPayload | null>(null);
	const [isRunsLoading, setIsRunsLoading] = useState(true);
	const [isRunLoading, setIsRunLoading] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const runSelectionTokenRef = useRef(0);
	const isSidebarCollapsedAndHovered = !isOpen && isHovered;

	const handleHoverEnter = useCallback(() => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setIsHovered(true);
	}, []);

	const handleHoverLeave = useCallback(() => {
		hoverTimeoutRef.current = setTimeout(() => {
			setIsHovered(false);
		}, 100);
	}, []);

	const handlePinSidebar = useCallback(() => {
		setIsOpen(true);
		setIsHovered(false);
	}, []);

	const loadFallbackPlanFromThreads = useCallback(async (): Promise<ParsedPlanWidgetPayload | null> => {
		try {
			const response = await fetch(API_ENDPOINTS.chatThreads(30), {
				cache: "no-store",
			});
			if (!response.ok) {
				return null;
			}

			const payload = (await response.json()) as ChatThreadsResponse;
			const threads = Array.isArray(payload.threads) ? payload.threads : [];
			for (const thread of threads) {
				const threadMessages = Array.isArray(thread.messages)
					? (thread.messages as RovoUIMessage[])
					: [];
				const parsedPlan = getLatestPlanWidgetPayload(threadMessages);
				if (parsedPlan) {
					return parsedPlan;
				}
			}
		} catch {
			return null;
		}

		return null;
	}, []);

	const loadRunById = useCallback(async (runId: string): Promise<AgentRun | null> => {
		const [runResponse, summaryResponse] = await Promise.all([
			fetch(API_ENDPOINTS.makeRun(runId), {
				cache: "no-store",
			}),
			fetch(API_ENDPOINTS.makeRunSummary(runId), {
				cache: "no-store",
			}),
		]);

		const runPayload = runResponse.ok
			? ((await runResponse.json()) as RunResponse)
			: null;
		const summaryPayload = summaryResponse.ok
			? ((await summaryResponse.json()) as RunSummaryResponse)
			: null;

		const baseRun = runPayload?.run ?? summaryPayload?.run ?? null;
		if (!baseRun) {
			return null;
		}

		const resolvedSummary = summaryPayload
			? (summaryPayload.summary ?? baseRun.summary)
			: baseRun.summary;

		return {
			...baseRun,
			summary: resolvedSummary,
		};
	}, []);

	const selectRun = useCallback(async (runId: string) => {
		runSelectionTokenRef.current += 1;
		const tokenValue = runSelectionTokenRef.current;

		setActiveRunId(runId);
		setIsRunLoading(true);
		setLoadError(null);
		setFallbackPlan(null);

		try {
			const run = await loadRunById(runId);
			if (runSelectionTokenRef.current !== tokenValue) {
				return;
			}
			setSelectedRun(run);
			if (!run) {
				setLoadError("Failed to load the selected run.");
			}
		} catch {
			if (runSelectionTokenRef.current === tokenValue) {
				setSelectedRun(null);
				setLoadError("Failed to load the selected run.");
			}
		} finally {
			if (runSelectionTokenRef.current === tokenValue) {
				setIsRunLoading(false);
			}
		}
	}, [loadRunById]);

	useEffect(() => {
		let cancelled = false;

		const loadInitialData = async () => {
			setIsRunsLoading(true);
			setLoadError(null);
			setSelectedRun(null);
			setFallbackPlan(null);

			try {
				const runsResponse = await fetch(API_ENDPOINTS.makeRuns(50), {
					cache: "no-store",
				});
				if (!runsResponse.ok) {
					const payload = (await runsResponse.json().catch(() => ({}))) as unknown;
					throw new Error(parseErrorMessage(payload));
				}

				const runsPayload = (await runsResponse.json()) as RunsResponse;
				const nextRuns = Array.isArray(runsPayload.runs) ? runsPayload.runs : [];
				if (cancelled) {
					return;
				}

				setRuns(nextRuns);

				if (nextRuns.length > 0) {
					setIsRunLoading(true);
					await selectRun(nextRuns[0].runId);
					if (cancelled) {
						return;
					}
				} else {
					setActiveRunId(null);
					setSelectedRun(null);
					setIsRunLoading(false);
					const fallback = await loadFallbackPlanFromThreads();
					if (cancelled) {
						return;
					}
					setFallbackPlan(fallback);
				}
			} catch (error) {
				if (cancelled) {
					return;
				}
				setRuns([]);
				setActiveRunId(null);
				setSelectedRun(null);
				setIsRunLoading(false);
				setLoadError(
					error instanceof Error && error.message.trim().length > 0
						? error.message.trim()
						: "Failed to load saved runs."
				);
			}

			if (!cancelled) {
				setIsRunsLoading(false);
			}
		};

		void loadInitialData();

		return () => {
			cancelled = true;
		};
	}, [loadFallbackPlanFromThreads, selectRun]);

	const handleSelectRun = useCallback((runId: string) => {
		if (runId === activeRunId) {
			return;
		}
		void selectRun(runId);
	}, [activeRunId, selectRun]);

	const previewSummaryContent = useMemo(() => {
		const runSummaryContent = selectedRun?.summary?.content;
		if (typeof runSummaryContent !== "string") {
			return "";
		}
		return runSummaryContent.trim();
	}, [selectedRun]);

	const displayPlan = useMemo<DisplayPlan | null>(() => {
		if (selectedRun) {
			const resolvedTitle = resolvePlanDisplayTitle(
				selectedRun.plan.title,
				selectedRun.plan.tasks,
			);
			return {
				source: "run",
				resolvedTitle,
				description: selectedRun.plan.description,
				agents: selectedRun.plan.agents,
				tasks: selectedRun.plan.tasks.map((task) => ({
					id: task.id,
					label: task.label,
					agentName: task.agent,
					blockedBy: task.blockedBy,
				})),
			};
		}

		if (fallbackPlan) {
			const resolvedTitle = resolvePlanDisplayTitle(fallbackPlan.title, fallbackPlan.tasks);
			return {
				source: "chat-draft",
				resolvedTitle,
				description: fallbackPlan.description,
				agents: fallbackPlan.agents,
				tasks: fallbackPlan.tasks.map((task) => ({
					id: task.id,
					label: task.label,
					agentName: task.agent ?? null,
					blockedBy: task.blockedBy,
				})),
			};
		}

		return null;
	}, [fallbackPlan, selectedRun]);

	const summaryTitle = useMemo(() => {
		if (!displayPlan) {
			return "Artifact output";
		}

		return displayPlan.resolvedTitle;
	}, [displayPlan]);

	return (
		<SidebarProvider
			open={isOpen || isHovered}
			onOpenChange={setIsOpen}
			style={
				{
					"--sidebar-width": "320px",
				} as CSSProperties
			}
			className={cn(
				"[&_[data-slot=sidebar-gap]]:ease-[var(--ease-in-out)] [&_[data-slot=sidebar-container]]:ease-[var(--ease-in-out)]",
			)}
		>
			<MakeArtifactSidebar
				isOverlay={false}
				isHoverReveal={isSidebarCollapsedAndHovered}
				onPinSidebar={handlePinSidebar}
				onMouseEnter={handleHoverEnter}
				onMouseLeave={handleHoverLeave}
				runs={runs}
				activeRunId={activeRunId}
				onSelectRun={handleSelectRun}
				isRunsLoading={isRunsLoading}
			/>
			<SidebarInset className="h-svh overflow-hidden">
				<div className="flex h-full min-h-0 flex-col">
					<TopNavBar />
					<SummaryTitleRow
						title={summaryTitle}
						sidebarOpen={isOpen}
						sidebarHovered={isHovered}
						onExpandSidebar={handlePinSidebar}
						onHoverEnter={handleHoverEnter}
						onHoverLeave={handleHoverLeave}
						runId={activeRunId ?? undefined}
					/>
					<main className="flex min-h-0 flex-1 flex-col gap-4 bg-surface p-4">
						<ContentTabBar
							leftMode={leftMode}
							onLeftModeChange={setLeftMode}
							panelMode={panelMode}
							onPanelModeChange={setPanelMode}
						/>
						{loadError ? (
							<p className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-danger">
								{loadError}
							</p>
						) : null}
						<TwoPanelLayout
							leftMode={leftMode}
							panelMode={panelMode}
							isRunLoading={isRunLoading}
							plan={displayPlan}
							hasSelectedRun={selectedRun !== null}
							hasDraftPlan={selectedRun === null && fallbackPlan !== null}
							summaryContent={previewSummaryContent}
						/>
					</main>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
