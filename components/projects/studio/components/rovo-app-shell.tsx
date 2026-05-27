"use client";

import type { FileUIPart } from "ai";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type CSSProperties, startTransition, useCallback, useEffect, useMemo, useRef, useState, ViewTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArtifactPanel } from "@/components/ui-custom/artifact";
import { ChatTimelineNavigator } from "@/components/blocks/chat-timeline/chat-timeline-navigator";
import { CreateButton } from "@/components/blocks/top-navigation/components/create-button";
import { AgentsDirectoryDialog } from "@/components/blocks/agents-directory";
import { RovoAppBrowserArtifact } from "@/components/projects/studio/components/rovo-app-browser-artifact";
import { RovoAppComposer } from "@/components/projects/studio/components/rovo-app-composer";
import { RovoAppMessages } from "@/components/projects/studio/components/rovo-app-messages";
import { RovoAppHermesMemoryBar } from "@/components/projects/studio/components/rovo-app-hermes-memory-bar";
import { RovoAppHermesSkillDraftBar } from "@/components/projects/studio/components/rovo-app-hermes-skill-draft-bar";
import { RovoAppAgentConfigPanel } from "@/components/projects/studio/components/rovo-app-agent-config-panel";
import { RovoAppShellPaneLayout, type AgentConfigCompactTab } from "@/components/projects/studio/components/rovo-app-shell-pane-layout";
import { RovoAppSidebar } from "@/components/projects/studio/components/rovo-app-sidebar";
import { type RovoAppSteeringPhase } from "@/components/projects/studio/components/rovo-app-steering-lane";
import { SmoothGradientWaveform } from "@/components/blocks/visual-waveform/smooth-gradient-waveform";
import { useArtifactAnnotations } from "@/components/ui-custom/hooks/use-artifact-annotations";
import { formatAnnotationsForVoiceContext } from "@/components/ui-custom/lib/artifact-annotations";
import type { ArtifactAnnotation } from "@/components/ui-custom/lib/artifact-annotations";
import { useRovoApp } from "@/components/projects/studio/hooks/use-rovo-app";
import { useHmrReloadSuppression } from "@/components/projects/studio/hooks/use-hmr-reload-suppression";
import {
	buildRovoAppBrowserArtifactKey,
	shouldAutoOpenRovoAppBrowserArtifact,
	shouldShowReopenRovoAppBrowserArtifactControl,
} from "@/components/projects/studio/lib/rovo-app-browser-preview";
import { resolveRovoAppComposerPlaceholder } from "@/components/projects/studio/lib/rovo-app-composer-placeholder";
import { ROVO_APP_MAX_CHAT_PANE_WIDTH, ROVO_APP_MIN_ARTIFACT_PANE_WIDTH, ROVO_APP_MIN_CHAT_PANE_WIDTH, getRovoAppShellLayout } from "@/components/projects/studio/lib/rovo-app-shell-layout";
import { getRovoAppSmartGenerationLayoutContext } from "@/components/projects/studio/lib/rovo-app-smart-generation-layout";
import { deriveRovoAppTimelineItems } from "@/components/projects/studio/lib/rovo-app-timeline";
import { buildComposerHermesContext, shouldResetComposerHermesSkillSelection } from "@/components/projects/studio/lib/rovo-app-hermes-skill-selection";
import { buildRovoAppThreadPath } from "@/components/projects/studio/lib/rovo-app-thread-route-sync";
import { createRovoAppUserMessage } from "@/components/projects/studio/lib/rovo-app-user-message";
import { useLiveVoice } from "@/components/projects/studio/hooks/use-live-voice";
import { type DelegationRequest, useRealtimeVoice } from "@/components/projects/studio/hooks/use-realtime-voice";
import type { VoiceButtonState } from "@/components/ui-audio/voice-button";
import type { ConversationFollowMode } from "@/components/ui-custom/conversation";
import { useSidebar as useGlobalSidebar } from "@/app/contexts/context-sidebar";
import { LeftNavigation } from "@/components/blocks/top-navigation/components/left-navigation";
import { RightNavigation } from "@/components/blocks/top-navigation/components/right-navigation";
import SearchSuggestionsPanel from "@/components/blocks/top-navigation/components/search-suggestions-panel";
import { useTopNavigation } from "@/components/blocks/top-navigation/hooks/use-top-navigation";
import { ROVO_APP_SEPARATOR_LINE_OFFSET_PX, TOP_NAV_PADDING_PX } from "@/components/blocks/top-navigation/layout-constants";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SearchIcon from "@atlaskit/icon/core/search";
import { SidebarProvider, SidebarResizeHandle } from "@/components/ui/sidebar";
import { Footer } from "@/components/ui/footer";
import { useClicky } from "@/components/projects/studio/hooks/use-clicky";
import { useClickyVoice } from "@/components/projects/studio/hooks/use-clicky-voice";
import { ClickyOverlay } from "@/components/projects/studio/components/clicky/clicky-overlay";
import { parseClickyResponse } from "@/components/projects/studio/lib/clicky-point-parser";
import { useSidebarResize } from "@/components/projects/studio/hooks/use-sidebar-resize";
import { clamp, cn, createId } from "@/lib/utils";
import { token } from "@/lib/tokens";
import { getLatestDataPart, getLatestUserMessageId, getMessageAgentResult, getMessageArtifactResult, getMessageInterruption, getMessageText, type RovoDataParts } from "@/lib/rovo-ui-messages";
import { getRovoAppArtifactKindLabel, getRovoAppArtifactTypeLabel, sortRovoAppArtifacts } from "@/components/projects/rovo/lib/rovo-app-artifacts";
import { RovoAppHeader } from "@/components/projects/studio/components/rovo-app-header";
import { ApprovalCard } from "@/components/blocks/approval-card/page";
import { ClarificationQuestionCard } from "@/components/projects/shared/components/clarification-question-card";
import { QuestionCardShortcutsFooter } from "@/components/projects/shared/components/question-card-shortcuts-footer";
import { getLatestQuestionCardPayload, type ClarificationAnswers, type ParsedQuestionCardPayload } from "@/components/projects/shared/lib/question-card-widget";
import type { PlanApprovalSelection } from "@/components/projects/shared/lib/plan-approval";
import { getLatestPendingPlanWidget, type ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import { useDismissibleCards } from "@/components/projects/shared/hooks/use-dismissible-cards";
import { approveSkillDraft, fetchWikiStatus, fetchSkillDraftDetail, fetchSkillDrafts, fetchSkills, rejectSkillDraft } from "@/components/projects/control-plane/lib/control-plane-api";
import type { HermesSkillDraftDetail, HermesSkillDraftSummary, HermesSkillSummary, WikiStatus } from "@/lib/rovo-runtime-types";
import type { RovoAppHermesContext } from "@/lib/rovo-app-types";
import { useRovoSelectedAgent } from "@/app/contexts";
import { ROVO_AGENT_PROFILES, getRovoAgentPromptContext, isRovoAgentProfile, type RovoAgentProfile } from "@/components/projects/studio/data/agent-profiles";

interface RovoAppShellProps {
	embedded?: boolean;
	initialThreadId?: string | null;
}

const ROVO_APP_SIDEBAR_MOTION_DURATION = "--duration-medium";
const ROVO_APP_SIDEBAR_MOTION_FALLBACK_MS = 200;
const ROVO_APP_SIDEBAR_MIN_WIDTH = 240;
const ROVO_APP_SIDEBAR_MAX_WIDTH = 480;

const DEFAULT_COMPOSER_PLACEHOLDER = "Describe the agent you want to build";
const REALTIME_THREAD_SUMMARY_MAX_MESSAGES = 10;
const REALTIME_RESULT_SUMMARY_MAX_CHARS = 500;
const ROVO_APP_SPLIT_CHAT_PANEL_ID = "rovo-app-chat-pane";
const ROVO_APP_SPLIT_ARTIFACT_PANEL_ID = "rovo-app-artifact-pane";
const ROVO_APP_SPLIT_AGENT_CONFIG_PANEL_ID = "rovo-app-agent-config-pane";

type HomeStarterCategory = "analyze" | "brainstorm" | "review" | "summarize" | "create";

interface HomeStarterCategoryOption {
	iconClassName?: string;
	iconSrc?: string;
	id: HomeStarterCategory;
	label: string;
}

interface HomeStarterTemplate {
	description: string;
	iconSrc: string;
	layoutClassName: string;
	prompt: string;
	title: string;
}

const RICH_ICON_ROOT = "/illustration/rich-icon";
const HOME_STARTER_DEFAULT_CATEGORY: HomeStarterCategory = "analyze";
const HOME_STARTER_TAB_PROGRESS_DURATION_MS = 4_500;

const HOME_STARTER_CATEGORIES: ReadonlyArray<HomeStarterCategoryOption> = [
	{ id: "analyze", label: "Analyze", iconSrc: `${RICH_ICON_ROOT}/product-management/standard.png`, iconClassName: "translate-x-0.5 -translate-y-0.5 scale-[1.14]" },
	{ id: "brainstorm", label: "Brainstorm", iconSrc: `${RICH_ICON_ROOT}/lightbulb/standard.svg`, iconClassName: "-translate-y-px scale-[1.08]" },
	{ id: "review", label: "Review", iconSrc: `${RICH_ICON_ROOT}/checklist/standard.svg`, iconClassName: "-translate-x-0.5 -translate-y-0.5 scale-[0.92]" },
	{ id: "summarize", label: "Summarize", iconSrc: `${RICH_ICON_ROOT}/content-design/standard.svg`, iconClassName: "translate-y-px scale-[1.08]" },
	{ id: "create", label: "Create", iconSrc: `${RICH_ICON_ROOT}/design/standard.png`, iconClassName: "translate-x-px scale-[1.12]" },
];

function getNextHomeStarterCategory(category: HomeStarterCategory): HomeStarterCategory {
	const currentCategoryIndex = HOME_STARTER_CATEGORIES.findIndex((option) => option.id === category);
	const nextCategoryIndex = currentCategoryIndex === -1 ? 0 : (currentCategoryIndex + 1) % HOME_STARTER_CATEGORIES.length;

	return HOME_STARTER_CATEGORIES[nextCategoryIndex]?.id ?? HOME_STARTER_DEFAULT_CATEGORY;
}

const HOME_STARTER_VIEWS: Readonly<Record<HomeStarterCategory, ReadonlyArray<HomeStarterTemplate>>> = {
	analyze: [
		{
			description: "Surface customer feedback themes from trusted sources.",
			iconSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
			layoutClassName: "lg:col-start-1 lg:row-start-1",
			prompt: "Build a Studio agent named Customer Insights that analyzes customer feedback from provided pages, links, or projects, then returns themes, needs, risks, and recommended actions.",
			title: "Customer Insights",
		},
		{
			description: "Group Jira work items into clear themes and epics.",
			iconSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-2 lg:row-start-1",
			prompt: "Build a Studio agent named Jira Theme Analyzer that scans Jira work items from a JQL query, search results, or project context, then identifies themes and recommends epic groupings.",
			title: "Jira Theme Analyzer",
		},
		{
			description: "Turn transcripts into insights and next actions.",
			iconSrc: "/avatar-agent/service-agents/ops-guide.svg",
			layoutClassName: "sm:row-span-2 lg:col-start-4 lg:row-start-1",
			prompt: "Build a Studio agent named Transcript Insights Reporter that turns meeting transcripts into decisions, insights, recommendations, owners, and follow-up action items.",
			title: "Transcript Insights Reporter",
		},
		{
			description: "Find decisions, action items, and highlights in meetings.",
			iconSrc: "/avatar-agent/product-agents/wildcard-6.svg",
			layoutClassName: "sm:row-span-2 lg:col-start-5 lg:row-start-1",
			prompt: "Build a Studio agent named Meeting Insights that searches meeting notes, transcripts, and summaries to surface decisions, action items, highlights, and useful context.",
			title: "Meeting Insights",
		},
		{
			description: "Show in-flight project priorities and progress.",
			iconSrc: "/avatar-agent/service-agents/wildcard-1.svg",
			layoutClassName: "lg:col-start-1 lg:row-start-2",
			prompt: "Build a Studio agent named Progress Tracker that gives teams a real-time overview of in-flight projects, current priorities, owners, and what should be prioritized next.",
			title: "Progress Tracker",
		},
		{
			description: "Detect blocked work and explain the next move.",
			iconSrc: "/avatar-agent/teamwork-agents/blocker-checker.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Blocker Checker that detects work items likely to be blocked, explains the evidence, and recommends how to update or unblock the work.",
			title: "Blocker Checker",
		},
		{
			description: "Check whether work is ready to start.",
			iconSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Readiness Checker that reviews a work item against a team's definition of ready and suggests fixes when required details are missing.",
			title: "Readiness Checker",
		},
		{
			description: "Find meaningful signal across research and notes.",
			iconSrc: "/avatar-agent/teamwork-agents/work-organizer.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Impact Signal Mapper that clusters research, notes, and links into themes ranked by customer impact, confidence, urgency, and recommended next step.",
			title: "Impact Signal Mapper",
		},
	],
	brainstorm: [
		{
			description: "Clarify DACI decisions and close gaps.",
			iconSrc: "/avatar-agent/service-agents/wildcard-1.svg",
			layoutClassName: "lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Decision Director that reviews DACI decision documents, suggests improvements, identifies missing context, and points to useful resources.",
			title: "Decision Director",
		},
		{
			description: "Create and review clear, consistent OKRs.",
			iconSrc: "/avatar-agent/product-agents/wildcard-2.svg",
			layoutClassName: "lg:col-start-3 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Studio agent named OKR Generator that creates effective OKRs from scratch, reviews draft OKRs, finds similar examples, and shares guidance for stronger objectives and key results.",
			title: "OKR Generator",
		},
		{
			description: "Explore non-obvious directions before committing.",
			iconSrc: "/avatar-agent/dev-agents/code-planner.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-1",
			prompt: "Build a Studio agent named Opportunity Explorer that expands a rough idea into distinct approaches, adjacent opportunities, risks, and the strongest path to investigate first.",
			title: "Opportunity Explorer",
		},
		{
			description: "Turn ideas into experiments and decision points.",
			iconSrc: "/avatar-agent/teamwork-agents/customer-insights.svg",
			layoutClassName: "lg:col-start-3 lg:col-span-2 lg:row-start-2",
			prompt: "Build a Studio agent named Experiment Planner that turns ideas into experiments with hypotheses, success criteria, owners, decision points, and next steps.",
			title: "Experiment Planner",
		},
		{
			description: "Compare options by upside, cost, and risk.",
			iconSrc: "/avatar-agent/service-agents/service-request-helper.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Studio agent named Tradeoff Mapper that compares competing options by upside, cost, risk, reversibility, confidence, and team fit before recommending a direction.",
			title: "Tradeoff Mapper",
		},
		{
			description: "Stress-test ideas against weak assumptions.",
			iconSrc: "/avatar-agent/service-agents/wildcard-4.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Assumption Tester that lists likely failure modes, weak assumptions, unknowns, and the evidence that would change the recommendation.",
			title: "Assumption Tester",
		},
		{
			description: "Define practical criteria for choosing a path.",
			iconSrc: "/avatar-agent/dev-agents/basic-coding-agent-template.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Criteria Builder that defines must-haves, nice-to-haves, risks, disqualifiers, and a comparison rubric for evaluating options.",
			title: "Criteria Builder",
		},
	],
	review: [
		{
			description: "Create and review PRDs with direct feedback.",
			iconSrc: "/avatar-agent/service-agents/service-triage.svg",
			layoutClassName: "lg:col-start-1 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Product Requirements Guide that creates and reviews PRDs with direct language, customer empathy, supporting evidence, and actionable feedback.",
			title: "Product Requirements Guide",
		},
		{
			description: "Write concise bug reports with the details triage needs.",
			iconSrc: "/avatar-agent/dev-agents/code-vulnerability-scanner-npm-yarn.svg",
			layoutClassName: "lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Bug Report Assistant that turns issue context into clear, concise bug reports with reproduction details, impact, expected behavior, and triage-ready notes.",
			title: "Bug Report Assistant",
		},
		{
			description: "Rank risks and separate blockers from follow-ups.",
			iconSrc: "/avatar-agent/product-agents/wildcard-3.svg",
			layoutClassName: "lg:col-start-4 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Studio agent named Risk Review Coach that reviews proposals, plans, or launches for severity-ranked blockers, missing context, and follow-up improvements.",
			title: "Risk Review Coach",
		},
		{
			description: "Automate request triage and field updates.",
			iconSrc: "/avatar-agent/teamwork-agents/decision-director.svg",
			layoutClassName: "lg:col-start-4 lg:row-start-2",
			prompt: "Build a Studio agent named Service Triage that triages service requests, recommends field updates, explains automation-ready output, and asks for missing details when needed.",
			title: "Service Triage",
		},
		{
			description: "Review drafts against brand voice and tone.",
			iconSrc: "/avatar-agent/dev-agents/unit-test-creator.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Studio agent named Brand Voice Crafter that reviews or generates content against supplied brand voice and tone guidelines to help produce consistent communications.",
			title: "Brand Voice Crafter",
		},
		{
			description: "Help teammates document their working style.",
			iconSrc: "/avatar-agent/dev-agents/code-accessibility-checker.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named User Manual Writer that helps people write a friendly personal user manual covering working hours, preferred environments, communication norms, and collaboration tips.",
			title: "User Manual Writer",
		},
		{
			description: "Make drafts clearer, sharper, and easier to act on.",
			iconSrc: "/avatar-agent/service-agents/wildcard-5.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Content Quality Reviewer that checks drafts for clarity, missing context, audience fit, actionability, and concrete improvements.",
			title: "Content Quality Reviewer",
		},
	],
	summarize: [
		{
			description: "Translate writing for broader accessibility.",
			iconSrc: "/avatar-agent/product-agents/wildcard-4.svg",
			layoutClassName: "lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Global Translator that translates writing into most languages while preserving meaning, tone, and accessibility for speakers of other languages.",
			title: "Global Translator",
		},
		{
			description: "Turn Jira work items into clear release notes.",
			iconSrc: "/avatar-agent/service-agents/rca-agent.svg",
			layoutClassName: "lg:col-start-3 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Release Notes Drafter that summarizes up to 20 Jira work items, groups them into themes, and drafts clear release notes for stakeholders.",
			title: "Release Notes Drafter",
		},
		{
			description: "Write social posts and improve engagement.",
			iconSrc: "/avatar-agent/teamwork-agents/transcript-insights-reporter.svg",
			layoutClassName: "lg:col-start-4 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Studio agent named Social Media Writer that drafts social media posts, suggests more engaging variants, and adapts messaging for channel, audience, and tone.",
			title: "Social Media Writer",
		},
		{
			description: "Condense dense context for leadership updates.",
			iconSrc: "/avatar-agent/dev-agents/code-documentation-writer.svg",
			layoutClassName: "lg:col-start-4 lg:row-start-2",
			prompt: "Build a Studio agent named Executive Briefing Writer that condenses dense context into key points, decisions, risks, recommendations, and next steps for leadership.",
			title: "Executive Briefing Writer",
		},
		{
			description: "Package progress into stakeholder-ready updates.",
			iconSrc: "/avatar-agent/product-agents/wildcard-5.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Studio agent named Stakeholder Update Builder that summarizes progress, decisions, risks, blockers, and next steps in a concise update format.",
			title: "Stakeholder Update Builder",
		},
		{
			description: "Collect recent work into a concise team digest.",
			iconSrc: "/avatar-agent/teamwork-agents/global-translator.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Weekly Digest Writer that turns recent meetings, work items, and notes into a concise digest with decisions, progress, risks, and follow-ups.",
			title: "Weekly Digest Writer",
		},
		{
			description: "Turn unresolved context into clear follow-up asks.",
			iconSrc: "/avatar-agent/dev-agents/deployment-summarizer.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Open Questions Finder that scans notes and plans for unresolved decisions, owner gaps, missing context, deadlines, and the clearest follow-up asks.",
			title: "Open Questions Finder",
		},
	],
	create: [
		{
			description: "Break large work into actionable tasks.",
			iconSrc: "/avatar-agent/service-agents/wildcard-2.svg",
			layoutClassName: "lg:col-start-4 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Work Item Planner that breaks big projects, epics, or streams of work into smaller actionable tasks, owners, sequencing, and next steps.",
			title: "Work Item Planner",
		},
		{
			description: "Find, move, update, and organize work items.",
			iconSrc: "/avatar-agent/teamwork-agents/work-item-planner.svg",
			layoutClassName: "lg:col-start-1 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Studio agent named Work Item Organizer that finds and updates project work items, moves them into sprints, assigns epics, deletes stale items, and recommends cleanup actions.",
			title: "Work Item Organizer",
		},
		{
			description: "Draft support responses and suggest assignees.",
			iconSrc: "/avatar-agent/product-agents/wildcard-6.svg",
			layoutClassName: "lg:col-start-2 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Studio agent named Service Request Helper that drafts responses using prior request insights, suggests assignees and skills, and summarizes requests for faster resolution.",
			title: "Service Request Helper",
		},
		{
			description: "Guide incident response and on-call operations.",
			iconSrc: "/avatar-agent/dev-agents/code-standardizer.svg",
			layoutClassName: "lg:col-start-2 lg:row-start-2",
			prompt: "Build a Studio agent named Rovo Ops that assists incident management, on-call duties, mitigation guidance, and faster detection, response, and recovery.",
			title: "Rovo Ops",
		},
		{
			description: "Answer questions and link people to Rovo guidance.",
			iconSrc: "/avatar-agent/service-agents/wildcard-3.svg",
			layoutClassName: "lg:col-start-3 lg:row-start-2",
			prompt: "Build a Studio agent named Rovo Expert that introduces Rovo features, answers setup and usage questions, and shares helpful links for unlocking organizational knowledge.",
			title: "Rovo Expert",
		},
		{
			description: "Create staged workflows from goals and constraints.",
			iconSrc: "/avatar-agent/teamwork-agents/product-requirements-guide.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Studio agent named Workflow Builder that turns goals into stages, handoffs, required inputs, outputs, owners, validation checks, and likely failure points.",
			title: "Workflow Builder",
		},
		{
			description: "Answer policy and process questions from trusted context.",
			iconSrc: "/avatar-agent/teamwork-agents/workflow-builder.svg",
			layoutClassName: "",
			prompt: "Build a Studio agent named Knowledge Base Guide that answers policy and process questions from trusted source context, cites useful references, and flags missing information.",
			title: "Knowledge Base Guide",
		},
	],
};

function parseCssDurationMs(value: string): number | null {
	const trimmedValue = value.trim();

	if (!trimmedValue) {
		return null;
	}

	if (trimmedValue.endsWith("ms")) {
		const durationMs = Number.parseFloat(trimmedValue.slice(0, -2));
		return Number.isFinite(durationMs) ? durationMs : null;
	}

	if (trimmedValue.endsWith("s")) {
		const durationSeconds = Number.parseFloat(trimmedValue.slice(0, -1));
		return Number.isFinite(durationSeconds) ? durationSeconds * 1000 : null;
	}

	const numericDuration = Number.parseFloat(trimmedValue);
	return Number.isFinite(numericDuration) ? numericDuration : null;
}

function HomeStarterBento({
	onPreviewEnd,
	onPreviewStart,
	onSelect,
	sessionAgents,
}: Readonly<{
	onPreviewEnd: () => void;
	onPreviewStart: (prompt: string) => void;
	onSelect: (prompt: string) => void;
	sessionAgents: readonly RovoAgentProfile[];
}>) {
	const [activeCategory, setActiveCategory] = useState<HomeStarterCategory>(HOME_STARTER_DEFAULT_CATEGORY);
	const [browseOpen, setBrowseOpen] = useState(false);
	const [isTemplateFocused, setIsTemplateFocused] = useState(false);
	const [isTemplateHovered, setIsTemplateHovered] = useState(false);
	const shouldReduceMotion = useReducedMotion();
	const focusedTemplatePromptRef = useRef<string | null>(null);
	const hoveredTemplatePromptRef = useRef<string | null>(null);
	const tabProgressBarRef = useRef<HTMLSpanElement | null>(null);
	const tabProgressRef = useRef(0);
	const templates = HOME_STARTER_VIEWS[activeCategory];
	const visibleTemplates = templates.slice(0, 5);
	const canShowMore = templates.length > visibleTemplates.length;
	const isProgressPaused = isTemplateFocused || isTemplateHovered;
	const setHomeStarterTabProgress = useCallback((progress: number) => {
		const nextProgress = clamp(progress, 0, 1);

		tabProgressRef.current = nextProgress;
		tabProgressBarRef.current?.style.setProperty("--home-starter-tab-progress", String(nextProgress));
	}, []);
	const setTabProgressBarNode = useCallback((node: HTMLSpanElement | null) => {
		tabProgressBarRef.current = node;

		if (node) {
			node.style.setProperty("--home-starter-tab-progress", String(tabProgressRef.current));
		}
	}, []);
	const selectHomeStarterCategory = useCallback((category: HomeStarterCategory) => {
		setHomeStarterTabProgress(0);
		setActiveCategory(category);
	}, [setHomeStarterTabProgress]);
	const advanceHomeStarterCategory = useCallback(() => {
		setHomeStarterTabProgress(0);
		setActiveCategory((currentCategory) => getNextHomeStarterCategory(currentCategory));
	}, [setHomeStarterTabProgress]);
	const handleTemplateMouseEnter = useCallback((prompt: string) => {
		hoveredTemplatePromptRef.current = prompt;
		setIsTemplateHovered(true);
		onPreviewStart(prompt);
	}, [onPreviewStart]);
	const handleTemplateMouseLeave = useCallback(() => {
		hoveredTemplatePromptRef.current = null;
		setIsTemplateHovered(false);

		if (focusedTemplatePromptRef.current) {
			onPreviewStart(focusedTemplatePromptRef.current);
		} else {
			onPreviewEnd();
		}
	}, [onPreviewEnd, onPreviewStart]);
	const handleTemplateFocus = useCallback((prompt: string) => {
		focusedTemplatePromptRef.current = prompt;
		setIsTemplateFocused(true);
		onPreviewStart(prompt);
	}, [onPreviewStart]);
	const handleTemplateBlur = useCallback(() => {
		focusedTemplatePromptRef.current = null;
		setIsTemplateFocused(false);

		if (hoveredTemplatePromptRef.current) {
			onPreviewStart(hoveredTemplatePromptRef.current);
		} else {
			onPreviewEnd();
		}
	}, [onPreviewEnd, onPreviewStart]);

	useEffect(() => {
		if (shouldReduceMotion || isProgressPaused) {
			return;
		}

		let animationFrameId = 0;
		let previousFrameTime: number | null = null;

		const tick = (frameTime: number) => {
			if (previousFrameTime === null) {
				previousFrameTime = frameTime;
			}

			const elapsedMs = Math.min(frameTime - previousFrameTime, 100);
			previousFrameTime = frameTime;
			const nextProgress = tabProgressRef.current + elapsedMs / HOME_STARTER_TAB_PROGRESS_DURATION_MS;

			if (nextProgress >= 1) {
				advanceHomeStarterCategory();
			} else {
				setHomeStarterTabProgress(nextProgress);
			}

			animationFrameId = window.requestAnimationFrame(tick);
		};

		animationFrameId = window.requestAnimationFrame(tick);

		return () => {
			window.cancelAnimationFrame(animationFrameId);
		};
	}, [advanceHomeStarterCategory, isProgressPaused, setHomeStarterTabProgress, shouldReduceMotion]);

	return (
		<div className="w-full">
			<div className="no-scrollbar -mx-1 flex justify-center gap-2 overflow-x-auto px-1">
				{HOME_STARTER_CATEGORIES.map((category) => {
					const isActive = activeCategory === category.id;

					return (
						<button
							key={category.id}
							type="button"
							aria-pressed={isActive}
							onClick={() => {
								selectHomeStarterCategory(category.id);
							}}
							className={cn(
								"relative isolate inline-flex h-8 shrink-0 items-center overflow-hidden rounded-md border px-3 text-sm font-medium leading-5 outline-none transition-[border-color,color,box-shadow] duration-fast ease-out focus-visible:ring-3 focus-visible:ring-ring/50",
								isActive
									? "border-border-selected bg-bg-selected text-text-selected"
									: "border-border bg-background text-text-subtle hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
							)}
						>
							{isActive ? (
								<span
									ref={setTabProgressBarNode}
									aria-hidden
									className="pointer-events-none absolute inset-0 z-0 w-full bg-bg-selected-hovered"
									style={{
										transform: "scaleX(var(--home-starter-tab-progress, 0))",
										transformOrigin: "left center",
										willChange: "transform",
									}}
								/>
							) : null}
							<span className="relative z-[2] inline-flex items-center gap-1.5">
								{category.iconSrc ? (
									<span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center">
										<Image
											alt=""
											className={cn("size-6 object-contain", category.iconClassName)}
											height={24}
											src={category.iconSrc}
											width={24}
										/>
									</span>
								) : null}
								<span>{category.label}</span>
							</span>
						</button>
					);
				})}
			</div>

			<div className="@container/bento relative mt-6">
				<div
					className="relative -m-1 overflow-hidden p-1"
					style={
						canShowMore
							? {
									maskImage:
										"linear-gradient(to bottom, black calc(100% - 96px), transparent 100%)",
									WebkitMaskImage:
										"linear-gradient(to bottom, black calc(100% - 96px), transparent 100%)",
								}
							: undefined
					}
				>
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={activeCategory}
							className="grid grid-cols-1 gap-3 auto-rows-[144px] sm:grid-cols-2 lg:grid-cols-5"
							initial={shouldReduceMotion ? false : "hidden"}
							animate="visible"
							exit={shouldReduceMotion ? undefined : "exit"}
							variants={{
								hidden: {},
								visible: {
									transition: { staggerChildren: 0.04, delayChildren: 0.02 },
								},
								exit: {
									transition: { staggerChildren: 0.02, staggerDirection: -1 },
								},
							}}
						>
							{visibleTemplates.map((template) => {
								return (
									<motion.button
										key={template.title}
										type="button"
										aria-label={`Use prompt starter: ${template.title}`}
										onClick={() => onSelect(template.prompt)}
										onMouseEnter={() => handleTemplateMouseEnter(template.prompt)}
										onMouseLeave={handleTemplateMouseLeave}
										onFocus={() => handleTemplateFocus(template.prompt)}
										onBlur={handleTemplateBlur}
										className={cn(
											"group flex min-h-0 flex-col items-start overflow-hidden rounded-lg border border-border bg-background p-4 text-left outline-none transition-[background-color,border-color,box-shadow] duration-fast ease-out hover:border-border-bold hover:bg-bg-neutral-subtle focus-visible:ring-3 focus-visible:ring-ring/50",
											template.layoutClassName,
										)}
										variants={{
											hidden: { opacity: 0, y: 8, scale: 0.98 },
											visible: { opacity: 1, y: 0, scale: 1 },
											exit: { opacity: 0, y: -4, scale: 0.98 },
										}}
										transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
										whileHover={
											shouldReduceMotion
												? undefined
												: { y: -2, transition: { type: "spring", stiffness: 400, damping: 22 } }
										}
										whileTap={shouldReduceMotion ? undefined : { scale: 0.98, transition: { duration: 0.05 } }}
										style={{ willChange: "transform, opacity" }}
									>
										<span className="inline-flex size-8 shrink-0 items-center justify-center transition-opacity duration-fast ease-out group-hover:opacity-90">
											<Image
												alt=""
												aria-hidden
												className="size-8 object-contain"
												height={32}
												src={template.iconSrc}
												width={32}
											/>
										</span>
										<span className="mt-3 block w-full min-w-0 text-sm font-semibold leading-5 text-text">
											{template.title}
										</span>
										<span className="mt-1 line-clamp-2 w-full min-w-0 text-sm leading-5 text-text-subtle">
											{template.description}
										</span>
									</motion.button>
								);
							})}
						</motion.div>
					</AnimatePresence>
				</div>
				{canShowMore ? (
					<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2">
						<Button
							type="button"
							aria-label="Browse all agents"
							variant="ghost"
							size="xs"
							className="pointer-events-auto h-7 rounded-full border-0 bg-surface px-3 text-sm leading-5 font-normal text-text-subtle hover:bg-surface-hovered"
							style={{ boxShadow: token("elevation.shadow.overlay") }}
							onClick={() => setBrowseOpen(true)}
						>
							Browse all
						</Button>
					</div>
				) : null}
			</div>
			<AgentsDirectoryDialog
				open={browseOpen}
				onOpenChange={setBrowseOpen}
				agents={ROVO_AGENT_PROFILES}
				sessionAgents={sessionAgents}
			/>
		</div>
	);
}

function getCssDurationTokenMs(tokenName: string, fallbackMs: number): number {
	if (typeof window === "undefined") {
		return fallbackMs;
	}

	const tokenValue = window.getComputedStyle(document.documentElement).getPropertyValue(tokenName);

	return parseCssDurationMs(tokenValue) ?? fallbackMs;
}

function mergeContextDescriptions(...parts: Array<string | null | undefined>): string | undefined {
	const mergedParts = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));

	return mergedParts.length > 0 ? mergedParts.join("\n\n") : undefined;
}

function getNonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function buildStudioAgentCreationContext(originalBrief: string): string {
	return [
		"[Studio Agent Creation Request]",
		"Source: /studio prompt input.",
		"Surface: Studio home composer.",
		"Trigger: User submitted a free-form brief describing the agent they want to build.",
		"Original user brief:",
		originalBrief.trim(),
		"Required agent profile fields (infer reasonable values from the brief; only ask clarifying questions if the brief truly cannot be turned into a workable profile):",
		"- agentId: stable kebab-case slug",
		"- name: short display name",
		"- byline: one-line tagline (e.g. \"Generated agent\")",
		"- description: 1–2 sentence summary of what the agent does",
		"- instructions: how the agent should behave and what context it uses",
		"- conversationStarters: 2–4 starter prompts (strings)",
		"- avatarFallback: { initials: 2-letter shorthand derived from the name }",
		"- action: \"create\"",
		"Clarification rule: Use the existing ask_user_questions/question-card flow when needed; do not invent a separate Q&A format.",
		"Expected output: build the agent profile now and emit exactly one structured AGENT_RESULT marker on its own line OUTSIDE any code fence. Do not wrap the marker, its JSON, or the surrounding response inside ``` fences (no ```markdown, ```json, or other fences around the result). Keep assistant prose brief.",
		"[End Studio Agent Creation Request]",
	].join("\n");
}

function buildStudioAgentCreationContinuationContext(): string {
	return [
		"[Studio Agent Creation Request]",
		"Source: /studio prompt input clarification answer.",
		"Surface: Studio home composer.",
		"Trigger: The user has answered the clarification questions for the agent they want to build.",
		"Required agent profile fields (fill from the brief + clarification answers):",
		"- agentId: stable kebab-case slug",
		"- name: short display name",
		"- byline: one-line tagline (e.g. \"Generated agent\")",
		"- description: 1–2 sentence summary of what the agent does",
		"- instructions: how the agent should behave and what context it uses",
		"- conversationStarters: 2–4 starter prompts (strings)",
		"- avatarFallback: { initials: 2-letter shorthand derived from the name }",
		"- action: \"create\"",
		"Clarification rule: If required profile fields are still missing, ask another concise question-card round using the existing ask_user_questions flow.",
		"Expected output: otherwise, create the reusable custom agent now and emit exactly one structured AGENT_RESULT marker on its own line OUTSIDE any code fence. Do not wrap the marker, its JSON, or the surrounding response inside ``` fences (no ```markdown, ```json, or other fences around the result). Keep assistant prose brief.",
		"[End Studio Agent Creation Request]",
	].join("\n");
}

function normalizeStudioAgentResult(agentResult: RovoDataParts["agent-result"]): RovoAgentProfile | null {
	const id = getNonEmptyString(agentResult.agentId);
	const name = getNonEmptyString(agentResult.name);
	const summary = getNonEmptyString(agentResult.summary);
	const description = getNonEmptyString(agentResult.description) ?? summary;
	const conversationStarters = Array.isArray(agentResult.conversationStarters)
		? agentResult.conversationStarters.map((starter) => starter.trim()).filter(Boolean).slice(0, 4)
		: [];

	if (!id || !name || !description || conversationStarters.length === 0) {
		return null;
	}

	const contextDescription = [
		"[Selected Studio-generated agent]",
		`Agent: ${name}`,
		"Source: /studio agent creation result",
		`Description: ${description}`,
		summary ? `Summary: ${summary}` : null,
		conversationStarters.length > 0 ? `Conversation starters: ${conversationStarters.join(" | ")}` : null,
		"Answer as this selected generated agent while using the existing Studio chat capabilities and available context.",
		"[End selected Studio-generated agent]",
	]
		.filter((line): line is string => Boolean(line))
		.join("\n");

	return {
		avatarSrc: "/avatar-agent/teamwork-agents/wildcard-1.svg",
		byline: "Generated in Studio",
		contextDescription,
		description,
		id,
		name,
		starters: conversationStarters.map((starter, index) => ({
			id: `${id}-starter-${index + 1}`,
			label: starter,
			prompt: starter,
			type: "prompt",
		})),
	};
}

function getStudioAgentCreationThreadTitle(thread: { title: string } | null): string {
	const title = thread?.title.trim();

	if (title && title !== "New chat") {
		return title;
	}

	return "Agent creation";
}

type StudioAgentRegistrationResult =
	| string
	| {
			id?: string | null;
	  }
	| RovoAgentProfile
	| null
	| undefined
	| void;

type StudioAgentRegistryContext = ReturnType<typeof useRovoSelectedAgent> & {
	registerCreatedAgentFromResult?: (
		agentResult: RovoDataParts["agent-result"],
		options?: { preserveCurrentThread?: boolean; select?: boolean; sourceKey?: string }
	) => RovoAgentProfile | null;
	registerAgentResult?: (agentResult: RovoDataParts["agent-result"], normalizedAgent?: RovoAgentProfile) => StudioAgentRegistrationResult;
	registerSessionAgent?: (agent: RovoAgentProfile, options?: { source?: string; result?: RovoDataParts["agent-result"] }) => StudioAgentRegistrationResult;
	selectAgent: (agentId: string, options?: { preserveCurrentThread?: boolean }) => void;
};

type StudioSubmitPromptPayload = Parameters<ReturnType<typeof useRovoApp>["submitPrompt"]>[0] & {
	creationMode?: "agent";
};

function resolveRegisteredStudioAgentId(result: StudioAgentRegistrationResult, fallbackAgentId: string): string {
	if (typeof result === "string" && result.trim().length > 0) {
		return result.trim();
	}

	if (result && typeof result === "object" && typeof result.id === "string" && result.id.trim().length > 0) {
		return result.id.trim();
	}

	return fallbackAgentId;
}

type RealtimeInjectContextPayload = {
	type: string;
	content?: string;
	role?: string;
	summary?: string;
	[key: string]: unknown;
};

type RealtimeMessageMutationResult =
	| string
	| {
			id?: string | null;
	  }
	| void;

type RovoAppRealtimeShellAdapter = ReturnType<typeof useRovoApp> & {
	appendRealtimeMessage?: (role: "user" | "assistant", content: string, options?: Record<string, unknown>) => Promise<RealtimeMessageMutationResult> | RealtimeMessageMutationResult;
	delegateToRovo?: (messageId: string, options?: Record<string, unknown>) => Promise<void>;
	setRealtimeMessageContent?: (messageId: string, content: string) => Promise<void> | void;
	submitRealtimeText?: (payload: { contextDescription?: string; hermesContext?: RovoAppHermesContext; files: FileUIPart[]; text: string }) => Promise<void>;
	updateRealtimeMessage?: (messageId: string, contentDelta: string) => Promise<void> | void;
	setVoiceMode?: (next: boolean) => void;
};

type ExtendedDelegationRequest = DelegationRequest & {
	delegatedMessageId?: string;
	messageId?: string;
	realtimeMessageId?: string;
};

type RealtimeSpeechTranscriptPayload =
	| string
	| {
			delta?: string;
			messageId?: string;
			text?: string;
			transcript?: string;
	  };

type RealtimeAssistantTextPayload =
	| string
	| {
			delta?: string;
			messageId?: string;
			text?: string;
	  };

type RealtimeAssistantTextCompletedPayload =
	| string
	| {
			messageId?: string;
			text?: string;
	  };

type RealtimeVoiceShellOptions = Parameters<typeof useRealtimeVoice>[0] & {
	onAssistantTextCompleted?: (payload: string | { messageId?: string; text?: string }) => void;
	onAssistantTextDelta?: (payload: string | { delta?: string; messageId?: string; text?: string }) => void;
	onSpeechTranscriptCompleted?: (payload: string | { messageId?: string; transcript?: string; text?: string }) => void;
	onSpeechTranscriptDelta?: (payload: string | { delta?: string; messageId?: string; text?: string }) => void;
	onTextResponseStart?: (payload?: { messageId?: string }) => void;
};

type RealtimeVoiceShellResult = ReturnType<typeof useRealtimeVoice> & {
	connectionState?: string;
	connectionStatus?: string;
	currentAssistantMessageId?: string | null;
	currentUserMessageId?: string | null;
	isReconnecting?: boolean;
	sendTextInput?: (payload: { contextDescription?: string; messageId?: string; text: string }) => Promise<void>;
	sessionId?: string;
	sessionKey?: string;
	statusMessage?: string | null;
};

type TypedScrollAnchorSource = "none" | "standard" | "realtime";

type ScrollActiveTimelineSelection = {
	latestTimelineMessageId: string | null;
	messageId: string;
	runtimeThreadId: string | null;
};

function resolveRealtimeMutationId(result: RealtimeMessageMutationResult): string | null {
	if (typeof result === "string" && result.trim()) {
		return result;
	}

	if (result && typeof result === "object" && typeof result.id === "string" && result.id.trim()) {
		return result.id;
	}

	return null;
}

function buildRealtimeThreadSummary(messages: ReadonlyArray<ReturnType<typeof useRovoApp>["messages"][number]>): string {
	const summary = messages
		.filter((message) => message.role === "user" || message.role === "assistant")
		.slice(-REALTIME_THREAD_SUMMARY_MAX_MESSAGES)
		.map((message) => {
			const text = getMessageText(message).trim();
			const artifact = getMessageArtifactResult(message);
			const fragments = [text || null, artifact ? `${artifact.action === "update" ? "Updated" : "Created"} artifact "${artifact.title}".` : null].filter((fragment): fragment is string =>
				Boolean(fragment),
			);

			if (fragments.length === 0) {
				return null;
			}

			return `${message.role}: ${fragments.join(" ")}`.trim();
		})
		.filter((line): line is string => Boolean(line))
		.join("\n");

	return summary.slice(0, 2_000);
}

function buildRealtimeArtifactContextSummary(input: {
	annotationContext: string | null;
	document: {
		id: string;
		kind: string;
		title: string;
	} | null;
}): string | null {
	if (!input.document) {
		return null;
	}

	return [`Artifact open: ${input.document.title}`, `Document ID: ${input.document.id}`, `Kind: ${input.document.kind}`, input.annotationContext ? input.annotationContext : null]
		.filter((part): part is string => Boolean(part))
		.join("\n");
}

function resolveRealtimeStatusMessage(realtime: RealtimeVoiceShellResult): string | null {
	const directStatus = typeof realtime.statusMessage === "string" && realtime.statusMessage.trim() ? realtime.statusMessage.trim() : null;
	if (directStatus) {
		return directStatus;
	}

	const connectionState =
		typeof realtime.connectionState === "string" && realtime.connectionState.trim()
			? realtime.connectionState.trim().toLowerCase()
			: typeof realtime.connectionStatus === "string" && realtime.connectionStatus.trim()
				? realtime.connectionStatus.trim().toLowerCase()
				: null;

	if (connectionState === "reconnecting" || realtime.isReconnecting) {
		return "Reconnecting voice...";
	}

	if (connectionState === "disconnected") {
		return "Voice disconnected";
	}

	return null;
}

function resolveRealtimeSessionIdentity(realtime: RealtimeVoiceShellResult, activeThreadId: string | null, runtimeThreadId: string): string | null {
	const candidates = [realtime.sessionId, realtime.sessionKey, realtime.connectionState, realtime.connectionStatus];

	const explicitIdentity = candidates.find((candidate) => {
		return typeof candidate === "string" && candidate.trim().length > 0;
	});

	if (explicitIdentity) {
		return explicitIdentity;
	}

	return realtime.voiceState !== "idle" ? `${activeThreadId ?? runtimeThreadId}:${realtime.voiceState}` : null;
}

export function RovoAppShell({ embedded = false, initialThreadId = null }: Readonly<RovoAppShellProps>) {
	const router = useRouter();
	const nav = useTopNavigation();
	const studioAgentRegistry = useRovoSelectedAgent() as StudioAgentRegistryContext;
	const { selectedAgent } = studioAgentRegistry;
	const selectedAgentContextDescription = getRovoAgentPromptContext(selectedAgent);
	const isCustomAgentSelected = !isRovoAgentProfile(selectedAgent);
	const [viewportWidthPx, setViewportWidthPx] = useState<number | null>(null);
	const [shellSize, setShellSize] = useState({ width: 0, height: 0 });
	const smartGenerationLayout = useMemo(() => {
		return getRovoAppSmartGenerationLayoutContext({
			shellWidth: shellSize.width,
			viewportWidth: viewportWidthPx,
		});
	}, [shellSize.width, viewportWidthPx]);
	const chat = useRovoApp({
		embedded,
		initialThreadId,
		smartGenerationLayout,
	});
	useHmrReloadSuppression(chat.isStreaming);
	const chatRef = useRef(chat);
	chatRef.current = chat;
	const [wikiMemoryStatus, setWikiMemoryStatus] = useState<WikiStatus | null>(null);
	const [availableHermesSkills, setAvailableHermesSkills] = useState<HermesSkillSummary[]>([]);
	const [skillDrafts, setSkillDrafts] = useState<HermesSkillDraftSummary[]>([]);
	const [activePendingSkillDraftIndex, setActivePendingSkillDraftIndex] = useState(0);
	const [activePendingSkillDraftDetail, setActivePendingSkillDraftDetail] = useState<HermesSkillDraftDetail | null>(null);
	const [submittingSkillDraftId, setSubmittingSkillDraftId] = useState<string | null>(null);
	const [selectedHermesSkillIds, setSelectedHermesSkillIds] = useState<string[]>([]);
	const previousActiveThreadIdRef = useRef<string | null>(null);
	const activeThreadRecord = useMemo(() => chat.threads.find((thread) => thread.id === chat.activeThreadId) ?? null, [chat.activeThreadId, chat.threads]);
	const selectedHermesSkills = useMemo(
		() => selectedHermesSkillIds.map((skillId) => availableHermesSkills.find((skill) => skill.id === skillId) ?? null).filter((skill): skill is HermesSkillSummary => skill !== null),
		[selectedHermesSkillIds, availableHermesSkills],
	);
	const autoSelectedHermesSkills = useMemo(
		() =>
			(activeThreadRecord?.hermesContext?.autoSelectedSkillIds ?? [])
				.map((skillId) => availableHermesSkills.find((skill) => skill.id === skillId) ?? null)
				.filter((skill): skill is HermesSkillSummary => skill !== null),
		[activeThreadRecord?.hermesContext?.autoSelectedSkillIds, availableHermesSkills],
	);
	const pendingThreadSkillDrafts = useMemo(() => {
		const pendingDraftIdSet = new Set(activeThreadRecord?.hermesContext?.pendingDraftIds ?? []);
		return skillDrafts.filter((draft) => draft.status === "pending" && pendingDraftIdSet.has(draft.id));
	}, [activeThreadRecord?.hermesContext?.pendingDraftIds, skillDrafts]);
	const activeThreadMemoryProposals = useMemo(() => {
		const threadId = activeThreadRecord?.id;
		if (!threadId || !wikiMemoryStatus?.recentProposals) {
			return [];
		}

		const recentProposalIdSet = new Set(activeThreadRecord?.hermesContext?.recentMemoryProposalIds ?? []);
		const matchingById = wikiMemoryStatus.recentProposals.filter((proposal) => recentProposalIdSet.has(proposal.id));
		if (matchingById.length > 0) {
			return matchingById.slice(0, 3);
		}

		return wikiMemoryStatus.recentProposals
			.filter((proposal) => proposal.sourceThreadId === threadId)
			.slice(0, 3);
	}, [activeThreadRecord?.hermesContext?.recentMemoryProposalIds, activeThreadRecord?.id, wikiMemoryStatus?.recentProposals]);
	const activePendingSkillDraft = pendingThreadSkillDrafts[activePendingSkillDraftIndex] ?? pendingThreadSkillDrafts[0] ?? null;

	const hermesSurfaceMountedRef = useRef(true);
	const hermesSurfaceLastSerializedRef = useRef({ memory: "", skills: "", drafts: "" });
	const loadHermesSurfaceData = useCallback(async () => {
		if (typeof document !== "undefined" && document.visibilityState !== "visible") {
			return;
		}
		const [memoryResult, skillsResult, draftsResult] = await Promise.allSettled([fetchWikiStatus(), fetchSkills(), fetchSkillDrafts("pending")]);
		if (!hermesSurfaceMountedRef.current) {
			return;
		}

		const nextMemory = memoryResult.status === "fulfilled" ? memoryResult.value : null;
		const nextSkills = skillsResult.status === "fulfilled" ? skillsResult.value : [];
		const nextDrafts = draftsResult.status === "fulfilled" ? draftsResult.value : [];

		const memoryKey = JSON.stringify(nextMemory);
		if (memoryKey !== hermesSurfaceLastSerializedRef.current.memory) {
			hermesSurfaceLastSerializedRef.current.memory = memoryKey;
			setWikiMemoryStatus(nextMemory);
		}
		const skillsKey = JSON.stringify(nextSkills);
		if (skillsKey !== hermesSurfaceLastSerializedRef.current.skills) {
			hermesSurfaceLastSerializedRef.current.skills = skillsKey;
			setAvailableHermesSkills(nextSkills);
		}
		const draftsKey = JSON.stringify(nextDrafts);
		if (draftsKey !== hermesSurfaceLastSerializedRef.current.drafts) {
			hermesSurfaceLastSerializedRef.current.drafts = draftsKey;
			setSkillDrafts(nextDrafts);
		}
	}, []);

	useEffect(() => {
		hermesSurfaceMountedRef.current = true;
		void loadHermesSurfaceData();
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void loadHermesSurfaceData();
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			hermesSurfaceMountedRef.current = false;
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [loadHermesSurfaceData]);

	const hermesWasStreamingRef = useRef(false);
	useEffect(() => {
		if (hermesWasStreamingRef.current && !chat.isStreaming) {
			void loadHermesSurfaceData();
		}
		hermesWasStreamingRef.current = chat.isStreaming;
	}, [chat.isStreaming, loadHermesSurfaceData]);

	useEffect(() => {
		const previousThreadId = previousActiveThreadIdRef.current;
		previousActiveThreadIdRef.current = chat.activeThreadId;

		if (
			shouldResetComposerHermesSkillSelection({
				previousThreadId,
				nextThreadId: chat.activeThreadId,
			})
		) {
			setSelectedHermesSkillIds(activeThreadRecord?.hermesContext?.selectedSkillIds ?? []);
		}
	}, [activeThreadRecord?.hermesContext?.selectedSkillIds, chat.activeThreadId]);
	useEffect(() => {
		if (chat.activeThreadId && selectedHermesSkillIds.length === 0 && (activeThreadRecord?.hermesContext?.selectedSkillIds?.length ?? 0) > 0) {
			setSelectedHermesSkillIds(activeThreadRecord?.hermesContext?.selectedSkillIds ?? []);
		}
	}, [activeThreadRecord?.hermesContext?.selectedSkillIds, chat.activeThreadId, selectedHermesSkillIds.length]);
	useEffect(() => {
		if (pendingThreadSkillDrafts.length === 0) {
			setActivePendingSkillDraftIndex(0);
			setActivePendingSkillDraftDetail(null);
			return;
		}

		setActivePendingSkillDraftIndex((currentIndex) => Math.min(currentIndex, pendingThreadSkillDrafts.length - 1));
	}, [pendingThreadSkillDrafts]);

	useEffect(() => {
		if (!activePendingSkillDraft?.id) {
			setActivePendingSkillDraftDetail(null);
			return;
		}

		let cancelled = false;

		async function loadDraftDetail() {
			try {
				const detail = await fetchSkillDraftDetail(activePendingSkillDraft.id);
				if (!cancelled) {
					setActivePendingSkillDraftDetail(detail);
				}
			} catch {
				if (!cancelled) {
					setActivePendingSkillDraftDetail(null);
				}
			}
		}

		void loadDraftDetail();
		return () => {
			cancelled = true;
		};
	}, [activePendingSkillDraft?.id]);

	const selectHermesSkill = useCallback((skillId: string) => {
		setSelectedHermesSkillIds((previousSkillIds) => (previousSkillIds.includes(skillId) ? previousSkillIds.filter((currentSkillId) => currentSkillId !== skillId) : [skillId]));
	}, []);
	const clearHermesSkillSelection = useCallback(() => {
		setSelectedHermesSkillIds([]);
	}, []);

	const buildHermesPromptOptions = useCallback(
		(contextDescription?: string) => {
			const hermesContext = buildComposerHermesContext(selectedHermesSkillIds);
			const resolvedContextDescription = mergeContextDescriptions(
				contextDescription,
				selectedAgentContextDescription,
			);
			return {
				contextDescription: resolvedContextDescription,
				hermesContext,
			};
		},
		[selectedHermesSkillIds, selectedAgentContextDescription],
	);

	const [activeAgentConfig, setActiveAgentConfig] = useState<{
		profileId: string;
		sourceMessageId: string | null;
	} | null>(null);
	const [isSidebarAgentBrowserOpen, setIsSidebarAgentBrowserOpen] = useState(false);
	const [agentConfigCompactTab, setAgentConfigCompactTab] =
		useState<AgentConfigCompactTab>("config");

	const handleStudioAgentResultSelect = useCallback(
		(agentResult: RovoDataParts["agent-result"], options?: { sourceMessageId?: string; sourceKey?: string }): boolean => {
			const normalizedAgent = normalizeStudioAgentResult(agentResult);
			if (!normalizedAgent) {
				return false;
			}

			const sourceKey = options?.sourceKey
				?? (options?.sourceMessageId
					? `studio-agent-result:${chat.activeThreadId ?? chat.runtimeThreadId}:${options.sourceMessageId}:${agentResult.agentId}`
					: undefined);

			if (typeof studioAgentRegistry.registerCreatedAgentFromResult === "function") {
				const registered = studioAgentRegistry.registerCreatedAgentFromResult(agentResult, {
					preserveCurrentThread: true,
					select: true,
					sourceKey,
				});
				if (!registered) {
					return false;
				}
				setActiveAgentConfig({
					profileId: registered.id,
					sourceMessageId: options?.sourceMessageId ?? null,
				});
				setAgentConfigCompactTab("config");
				return true;
			}

			// Fallback integration point for older Worker C drafts: use session-agent
			// registration plus preserve-current-thread selection when available.
			let didRegisterAgent = false;
			let registrationResult: StudioAgentRegistrationResult = null;
			if (typeof studioAgentRegistry.registerAgentResult === "function") {
				didRegisterAgent = true;
				registrationResult = studioAgentRegistry.registerAgentResult(agentResult, normalizedAgent);
			} else if (typeof studioAgentRegistry.registerSessionAgent === "function") {
				didRegisterAgent = true;
				registrationResult = studioAgentRegistry.registerSessionAgent(normalizedAgent, {
					result: agentResult,
					source: "/studio",
				});
			}

			if (!didRegisterAgent) {
				return false;
			}

			const agentId = resolveRegisteredStudioAgentId(registrationResult, normalizedAgent.id);
			studioAgentRegistry.selectAgent(agentId, { preserveCurrentThread: true });
			setActiveAgentConfig({
				profileId: agentId,
				sourceMessageId: options?.sourceMessageId ?? null,
			});
			setAgentConfigCompactTab("config");
			return true;
		},
		[chat.activeThreadId, chat.runtimeThreadId, studioAgentRegistry],
	);

	const handleStudioSidebarAgentSelect = useCallback(
		(agentId: string) => {
			studioAgentRegistry.selectAgent(agentId, { preserveCurrentThread: true });
			setActiveAgentConfig({
				profileId: agentId,
				sourceMessageId: null,
			});
			setAgentConfigCompactTab("config");
		},
		[studioAgentRegistry],
	);

	const handleSidebarBrowseAgentSelect = useCallback(
		(agent: { id: string }) => {
			studioAgentRegistry.selectAgent(agent.id, { preserveCurrentThread: true });
			if (studioAgentRegistry.getSessionAgentEntry?.(agent.id)) {
				setActiveAgentConfig({
					profileId: agent.id,
					sourceMessageId: null,
				});
				setAgentConfigCompactTab("config");
			} else {
				setActiveAgentConfig(null);
			}
			setIsSidebarAgentBrowserOpen(false);
		},
		[studioAgentRegistry],
	);

	const handleCloseAgentConfigPane = useCallback(() => {
		setActiveAgentConfig(null);
	}, []);

	const handleUpdateAgentDraft = useCallback(
		(profileId: string, patch: Partial<RovoDataParts["agent-result"]>) => {
			studioAgentRegistry.updateSessionAgentDraft?.(profileId, patch);
		},
		[studioAgentRegistry],
	);

	const handleCommitAgentPublishReady = useCallback(
		(profileId: string) => {
			studioAgentRegistry.commitSessionAgentPublishReady?.(profileId);
		},
		[studioAgentRegistry],
	);

	const handlePublishAgent = useCallback(
		(profileId: string) => {
			studioAgentRegistry.publishSessionAgent?.(profileId);
		},
		[studioAgentRegistry],
	);

	const activeSessionAgentEntry = useMemo(() => {
		if (!activeAgentConfig) {
			return null;
		}
		const entries = studioAgentRegistry.sessionAgentEntries;
		if (!Array.isArray(entries)) {
			return null;
		}
		return entries.find((entry) => entry.profile.id === activeAgentConfig.profileId) ?? null;
	}, [activeAgentConfig, studioAgentRegistry.sessionAgentEntries]);
	const shouldShowAgentConfigPane = Boolean(activeSessionAgentEntry);

	// When the active agent disappears (e.g. provider remounts), clear the
	// config pane so we don't keep a stale reference around.
	useEffect(() => {
		if (activeAgentConfig && !activeSessionAgentEntry) {
			setActiveAgentConfig(null);
		}
	}, [activeAgentConfig, activeSessionAgentEntry]);

	// Bridge the global sidebar context (TopNavigation toggle) with the local
	// shadcn SidebarProvider so the nav bar button controls the thread sidebar.
	const globalSidebar = useGlobalSidebar();
	const globalSidebarVisibleRef = useRef(globalSidebar.isVisible);

	useEffect(() => {
		if (globalSidebar.isVisible !== globalSidebarVisibleRef.current) {
			globalSidebarVisibleRef.current = globalSidebar.isVisible;
			chat.setSidebarOpen(globalSidebar.isVisible);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only react to global sidebar changes
	}, [globalSidebar.isVisible]);

	useEffect(() => {
		if (chat.sidebarOpen !== globalSidebarVisibleRef.current) {
			globalSidebarVisibleRef.current = chat.sidebarOpen;
			globalSidebar.setSidebarVisible(chat.sidebarOpen);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only react to local sidebar changes
	}, [chat.sidebarOpen]);

	// Hover-reveal: show sidebar temporarily when hovering the toggle button.
	// Uses a debounced timer so the sidebar stays visible while the mouse
	// transitions from the toggle button to the sidebar content area.
	const [hoverRevealActive, setHoverRevealActive] = useState(false);
	const hoverLeaveTimerRef = useRef<number | null>(null);

	const clearHoverTimer = useCallback(() => {
		if (hoverLeaveTimerRef.current) {
			window.clearTimeout(hoverLeaveTimerRef.current);
			hoverLeaveTimerRef.current = null;
		}
	}, []);

	const scheduleSidebarHoverClose = useCallback(() => {
		clearHoverTimer();
		hoverLeaveTimerRef.current = window.setTimeout(
			() => {
				setHoverRevealActive(false);
			},
			getCssDurationTokenMs(ROVO_APP_SIDEBAR_MOTION_DURATION, ROVO_APP_SIDEBAR_MOTION_FALLBACK_MS),
		);
	}, [clearHoverTimer]);

	const handleSidebarHoverEnter = useCallback(() => {
		clearHoverTimer();
		setHoverRevealActive(true);
	}, [clearHoverTimer]);

	const handleSidebarHoverLeave = useCallback(() => {
		scheduleSidebarHoverClose();
	}, [scheduleSidebarHoverClose]);

	const handleSidebarContentMouseEnter = useCallback(() => {
		clearHoverTimer();
	}, [clearHoverTimer]);

	const handleSidebarContentMouseLeave = useCallback(() => {
		scheduleSidebarHoverClose();
	}, [scheduleSidebarHoverClose]);

	useEffect(() => {
		return () => clearHoverTimer();
	}, [clearHoverTimer]);

	// ⌘⇧O — create a new chat
	useEffect(() => {
		const handleNewChatShortcut = (e: KeyboardEvent) => {
			if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "o") {
				e.preventDefault();
				chatRef.current.openNewChat();
			}
		};

		document.addEventListener("keydown", handleNewChatShortcut);
		return () => document.removeEventListener("keydown", handleNewChatShortcut);
	}, []);

	const isHoverOpen = hoverRevealActive && !chat.sidebarOpen;

	const artifactContentRef = useRef<HTMLDivElement | null>(null);
	const stopSpeakingRef = useRef<() => void>(() => {});
	const skipNextAutoSpeakRef = useRef(false);
	const annotationContextRef = useRef<string | null>(null);
	const realtimeInjectContextRef = useRef<((payload: RealtimeInjectContextPayload) => void) | null>(null);
	const pendingVoiceTranscriptRef = useRef<{
		id: number;
		text: string;
	} | null>(null);
	const voiceTranscriptIdRef = useRef(0);
	const voiceDrainEpochRef = useRef(0);
	const isDrainingVoiceRef = useRef(false);
	const sidebarResize = useSidebarResize({
		defaultWidth: ROVO_APP_SEPARATOR_LINE_OFFSET_PX,
		minWidth: ROVO_APP_SIDEBAR_MIN_WIDTH,
		maxWidth: ROVO_APP_SIDEBAR_MAX_WIDTH,
		onCollapse: useCallback(() => {
			chat.setSidebarOpen(false);
		}, [chat]),
	});
	const rovoAppSidebarStyle = {
		"--sidebar-width": `${sidebarResize.sidebarWidth}px`,
	} as CSSProperties;
	const [steeringState, setSteeringState] = useState<{
		phase: RovoAppSteeringPhase;
		text: string | null;
	}>({
		phase: "idle",
		text: null,
	});
	const [cursorMode, setCursorMode] = useState(false);
	const [galleryExpanded, setGalleryExpanded] = useState(false);
	const [previewPrompt, setPreviewPrompt] = useState<string | null>(null);
	const [prefillText, setPrefillText] = useState<string | null>(null);
	const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
	const [scrollActiveTimelineSelection, setScrollActiveTimelineSelection] = useState<ScrollActiveTimelineSelection | null>(null);
	const [scrollAnchorMessageId, setScrollAnchorMessageId] = useState<string | null>(null);
	const [scrollFollowMode, setScrollFollowMode] = useState<ConversationFollowMode>("bottom");
	const [optimisticUserMessage, setOptimisticUserMessage] = useState<ReturnType<typeof createRovoAppUserMessage> | null>(null);
	const [dismissedBrowserArtifactKey, setDismissedBrowserArtifactKey] = useState<string | null>(null);
	const realtimeUserMessageIdRef = useRef<string | null>(null);
	const realtimeAssistantMessageIdRef = useRef<string | null>(null);
	const realtimeAssistantMessagePromiseRef = useRef<Promise<string | null> | null>(null);
	const realtimeUserTranscriptHasDeltaRef = useRef(false);
	const manualVoiceStopRef = useRef(false);
	const injectedRealtimeThreadContextKeyRef = useRef<string | null>(null);
	const injectedRealtimeArtifactContextKeyRef = useRef<string | null>(null);
	const pendingTypedScrollAnchorRef = useRef(false);
	const isDefaultAgentHomeStateRef = useRef(false);
	const studioAgentCreationThreadKeysRef = useRef<Set<string>>(new Set());
	const studioAgentCreationThreadTouchedAtRef = useRef<Map<string, number>>(new Map());
	const [studioAgentCreationThreadIds, setStudioAgentCreationThreadIds] = useState<ReadonlySet<string>>(() => new Set());
	const studioAgentCreationThreads = useMemo(() => {
		return Array.from(studioAgentCreationThreadIds).map((threadId) => {
			const thread = chat.threads.find((currentThread) => currentThread.id === threadId) ?? null;
			return {
				id: threadId,
				lastTouchedAt: studioAgentCreationThreadTouchedAtRef.current.get(threadId) ?? 0,
				title: getStudioAgentCreationThreadTitle(thread),
			};
		});
	}, [chat.threads, studioAgentCreationThreadIds]);
	const handledAgentResultKeysRef = useRef<Set<string>>(new Set());
	const previousTypedAnchorUserMessageIdRef = useRef<string | null>(null);
	const typedScrollAnchorSourceRef = useRef<TypedScrollAnchorSource>("none");
	const realtimeTypedResponseStartedRef = useRef(false);
	const speechStartedAtRef = useRef<string | null>(null);

	const markStudioAgentCreationThread = useCallback((threadId: string | null) => {
		if (!threadId) {
			return;
		}

		studioAgentCreationThreadKeysRef.current.add(threadId);
		studioAgentCreationThreadTouchedAtRef.current.set(threadId, Date.now());
		setStudioAgentCreationThreadIds((currentThreadIds) => {
			const nextThreadIds = new Set(currentThreadIds);
			nextThreadIds.add(threadId);
			return nextThreadIds;
		});
	}, []);

	const unmarkStudioAgentCreationThread = useCallback((threadId: string | null) => {
		if (!threadId) {
			return;
		}

		studioAgentCreationThreadKeysRef.current.delete(threadId);
		studioAgentCreationThreadTouchedAtRef.current.delete(threadId);
		setStudioAgentCreationThreadIds((currentThreadIds) => {
			if (!currentThreadIds.has(threadId)) {
				return currentThreadIds;
			}

			const nextThreadIds = new Set(currentThreadIds);
			nextThreadIds.delete(threadId);
			return nextThreadIds;
		});
	}, []);

	const handleGalleryPreviewStart = useCallback((prompt: string) => {
		setPreviewPrompt(prompt);
	}, []);

	const handleGalleryPreviewEnd = useCallback(() => {
		setPreviewPrompt(null);
	}, []);

	const handleGallerySelect = useCallback((prompt: string) => {
		setPrefillText(prompt);
		setPreviewPrompt(null);
	}, []);

	const handleRovoAppSuggestionSelect = useCallback(
		async (prompt: string) => {
			const contextDescription = annotationContextRef.current ?? undefined;
			try {
				await chat.submitPrompt({
					...buildHermesPromptOptions(contextDescription),
					files: [],
					text: prompt,
				});
			} catch {
				// submitPrompt already sets a user-visible error state.
			}
		},
		[buildHermesPromptOptions, chat],
	);

	// Question card / clarification support
	const activeQuestionCard = useMemo(() => getLatestQuestionCardPayload(chat.messages), [chat.messages]);
	const { acceptPlanReview, submitClarification } = chat;
	const getStudioAgentCreationClarificationOptions = useCallback(() => {
		const isStudioAgentCreationThread =
			studioAgentCreationThreadKeysRef.current.has(chat.runtimeThreadId) ||
			(chat.activeThreadId ? studioAgentCreationThreadKeysRef.current.has(chat.activeThreadId) : false);

		return isStudioAgentCreationThread
			? {
				contextDescription: buildStudioAgentCreationContinuationContext(),
				creationMode: "agent" as const,
			}
			: undefined;
	}, [chat.activeThreadId, chat.runtimeThreadId]);
	const handleCancelClarificationQuestionSet = useCallback(
		(questionCard: ParsedQuestionCardPayload) => {
			return chat.cancelClarificationQuestionSet(questionCard, getStudioAgentCreationClarificationOptions());
		},
		[chat, getStudioAgentCreationClarificationOptions],
	);
	const {
		shouldShowQuestionCard: shouldShowQuestionCardRaw,
		activeQuestionCardKey,
		hideQuestionCard,
		dismissQuestionCard,
	} = useDismissibleCards({
		activeQuestionCard,
		onDismissQuestionCard: handleCancelClarificationQuestionSet,
	});
	const isDeferredQuestionCard = Boolean(activeQuestionCard?.deferredToolCallId);
	const shouldShowQuestionCard = shouldShowQuestionCardRaw && (!chat.isStreaming || isDeferredQuestionCard);
	const handleClarificationSubmit = useCallback(
		(answers: ClarificationAnswers) => {
			if (!activeQuestionCard) return;
			void submitClarification(
				activeQuestionCard,
				answers,
				getStudioAgentCreationClarificationOptions(),
			);
		},
		[activeQuestionCard, getStudioAgentCreationClarificationOptions, submitClarification],
	);
	const handleBuildPlan = useCallback(
		(planWidget: ParsedPlanWidgetPayload) => {
			return acceptPlanReview(planWidget);
		},
		[acceptPlanReview],
	);

	// Plan approval card support
	const activePendingPlan = useMemo(() => getLatestPendingPlanWidget(chat.messages), [chat.messages]);
	const [dismissedApprovalCardKey, setDismissedApprovalCardKey] = useState<string | null>(null);
	const [dismissedMemoryBarThreadId, setDismissedMemoryBarThreadId] = useState<string | null>(null);
	const [isSubmittingPlanApproval, setIsSubmittingPlanApproval] = useState(false);
	const pendingPlanKey = activePendingPlan?.planWidget.deferredToolCallId ?? null;
	const shouldShowApprovalCard = activePendingPlan !== null && pendingPlanKey !== dismissedApprovalCardKey && !shouldShowQuestionCard && !chat.isStreaming;

	useEffect(() => {
		setDismissedApprovalCardKey(null);
		setIsSubmittingPlanApproval(false);
	}, [chat.runtimeThreadId]);

	const handlePlanApprovalSubmit = useCallback(
		(selection: PlanApprovalSelection) => {
			if (!activePendingPlan) return;
			setIsSubmittingPlanApproval(true);
			void (async () => {
				try {
					await chat.submitPlanApproval(activePendingPlan.planWidget, selection);
				} finally {
					setIsSubmittingPlanApproval(false);
				}
			})();
		},
		[activePendingPlan, chat],
	);
	const handleDismissApprovalCard = useCallback(() => {
		setDismissedApprovalCardKey(pendingPlanKey);
	}, [pendingPlanKey]);

	const handleHermesSkillDraftApprove = useCallback(async (draft: HermesSkillDraftSummary) => {
		setSubmittingSkillDraftId(draft.id);
		try {
			await approveSkillDraft(draft.id);
			const [nextSkills, nextDrafts] = await Promise.all([fetchSkills(), fetchSkillDrafts("pending")]);
			setAvailableHermesSkills(nextSkills);
			setSkillDrafts(nextDrafts);
			setActivePendingSkillDraftDetail((currentDraft) => (currentDraft?.id === draft.id ? null : currentDraft));
		} finally {
			setSubmittingSkillDraftId((currentId) => (currentId === draft.id ? null : currentId));
		}
	}, []);
	const handleHermesSkillDraftReject = useCallback(async (draft: HermesSkillDraftSummary) => {
		setSubmittingSkillDraftId(draft.id);
		try {
			await rejectSkillDraft(draft.id);
			const nextDrafts = await fetchSkillDrafts("pending");
			setSkillDrafts(nextDrafts);
			setActivePendingSkillDraftDetail((currentDraft) => (currentDraft?.id === draft.id ? null : currentDraft));
		} finally {
			setSubmittingSkillDraftId((currentId) => (currentId === draft.id ? null : currentId));
		}
	}, []);
	const handleOpenHermesSkillDraftReview = useCallback(() => {
		router.push("/studio/skills");
	}, [router]);
	const handleOpenPlanPreview = useCallback(
		(planWidget: ParsedPlanWidgetPayload, sourceMessageId?: string) => {
			chat.openPlanAsDocument({
				title: planWidget.title,
				markdown: planWidget.markdown,
				sourceMessageId: sourceMessageId ?? null,
			});
		},
		[chat],
	);

	const resetTypedScrollAnchorState = useCallback(() => {
		pendingTypedScrollAnchorRef.current = false;
		previousTypedAnchorUserMessageIdRef.current = null;
		typedScrollAnchorSourceRef.current = "none";
		realtimeTypedResponseStartedRef.current = false;
	}, []);

	const activateTailFollowMode = useCallback(() => {
		resetTypedScrollAnchorState();
		setScrollAnchorMessageId(null);
		setScrollFollowMode("bottom");
	}, [resetTypedScrollAnchorState]);

	const queueTypedScrollAnchor = useCallback((source: Exclude<TypedScrollAnchorSource, "none">, latestUserMessageId: string | null) => {
		pendingTypedScrollAnchorRef.current = true;
		previousTypedAnchorUserMessageIdRef.current = latestUserMessageId;
		typedScrollAnchorSourceRef.current = source;
		realtimeTypedResponseStartedRef.current = false;
	}, []);

	const setChatVoiceMode = useCallback((next: boolean) => {
		const realtimeChat = chatRef.current as RovoAppRealtimeShellAdapter;
		if (typeof realtimeChat.setVoiceMode === "function") {
			realtimeChat.setVoiceMode(next);
			return;
		}

		if (realtimeChat.isVoiceMode !== next) {
			realtimeChat.toggleVoiceMode();
		}
	}, []);

	const injectRealtimeContext = useCallback((payload: RealtimeInjectContextPayload | null) => {
		if (!payload) {
			return;
		}

		realtimeInjectContextRef.current?.(payload);
	}, []);

	const appendRealtimeMessage = useCallback(async (role: "user" | "assistant", content: string, options?: Record<string, unknown>): Promise<string | null> => {
		const realtimeChat = chatRef.current as RovoAppRealtimeShellAdapter;
		if (typeof realtimeChat.appendRealtimeMessage !== "function") {
			return null;
		}

		const result = await realtimeChat.appendRealtimeMessage(role, content, options);
		return resolveRealtimeMutationId(result);
	}, []);

	const updateRealtimeMessage = useCallback(async (messageId: string | null, content: string, options?: { replace?: boolean }) => {
		if (!messageId || !content) {
			return;
		}

		const realtimeChat = chatRef.current as RovoAppRealtimeShellAdapter;
		if (options?.replace && typeof realtimeChat.setRealtimeMessageContent === "function") {
			await realtimeChat.setRealtimeMessageContent(messageId, content);
			return;
		}

		if (typeof realtimeChat.updateRealtimeMessage === "function") {
			await realtimeChat.updateRealtimeMessage(messageId, content);
		}
	}, []);

	const resetRealtimeAssistantMessageState = useCallback(() => {
		realtimeAssistantMessageIdRef.current = null;
		realtimeAssistantMessagePromiseRef.current = null;
	}, []);

	const ensureRealtimeAssistantMessage = useCallback(
		async (preferredMessageId?: string | null): Promise<string | null> => {
			// If we already have an active assistant message for this user turn,
			// always reuse it. The ref is only cleared by onSpeechStarted (when
			// the user speaks again), so all GPT responses within the same turn
			// merge into one bubble.
			if (realtimeAssistantMessageIdRef.current) {
				return realtimeAssistantMessageIdRef.current;
			}

			if (realtimeAssistantMessagePromiseRef.current) {
				return realtimeAssistantMessagePromiseRef.current;
			}

			const existingMessageId = preferredMessageId && chatRef.current.messages.some((message) => message.id === preferredMessageId && message.role === "assistant") ? preferredMessageId : null;
			if (existingMessageId) {
				realtimeAssistantMessageIdRef.current = existingMessageId;
				return existingMessageId;
			}

			const assistantCreatedAt = speechStartedAtRef.current ? new Date(new Date(speechStartedAtRef.current).getTime() + 1).toISOString() : undefined;
			const messageCreationPromise = appendRealtimeMessage("assistant", "", {
				messageId: preferredMessageId ?? undefined,
				createdAt: assistantCreatedAt,
			})
				.then((createdMessageId) => {
					if (createdMessageId) {
						realtimeAssistantMessageIdRef.current = createdMessageId;
					}
					return createdMessageId;
				})
				.finally(() => {
					if (realtimeAssistantMessagePromiseRef.current === messageCreationPromise) {
						realtimeAssistantMessagePromiseRef.current = null;
					}
				});
			realtimeAssistantMessagePromiseRef.current = messageCreationPromise;
			return messageCreationPromise;
		},
		[appendRealtimeMessage],
	);

	const clearSteeringState = useCallback(() => {
		setSteeringState({
			phase: "idle",
			text: null,
		});
	}, []);

	const clearPendingVoiceWork = useCallback(
		(reason: string) => {
			voiceDrainEpochRef.current += 1;
			pendingVoiceTranscriptRef.current = null;
			clearSteeringState();
			console.info("[RovoAppVoice] Cleared pending voice work", { reason });
		},
		[clearSteeringState],
	);

	const drainLatestVoiceTranscript = useCallback(() => {
		if (isDrainingVoiceRef.current) {
			return;
		}

		isDrainingVoiceRef.current = true;
		const drainEpoch = voiceDrainEpochRef.current;

		void (async () => {
			try {
				while (true) {
					const pendingTranscript = pendingVoiceTranscriptRef.current;
					if (!pendingTranscript) {
						return;
					}

					const shouldArtifactSteer = chatRef.current.panelState === "preview";
					if (!shouldArtifactSteer) {
						await chatRef.current.interruptActiveTurn({
							source: "voice-barge-in",
						});
					}

					if (voiceDrainEpochRef.current !== drainEpoch) {
						return;
					}

					if (pendingVoiceTranscriptRef.current?.id !== pendingTranscript.id) {
						console.info("[RovoAppVoice] Dropped stale finalized transcript", {
							droppedTranscriptId: pendingTranscript.id,
							latestTranscriptId: pendingVoiceTranscriptRef.current?.id ?? null,
						});
						continue;
					}

					pendingVoiceTranscriptRef.current = null;
					console.info("[RovoAppVoice] Submitting finalized transcript", {
						transcriptId: pendingTranscript.id,
						length: pendingTranscript.text.length,
					});
					setSteeringState({
						phase: shouldArtifactSteer ? "applying" : "idle",
						text: shouldArtifactSteer ? pendingTranscript.text : null,
					});
					const annotationContext = annotationContextRef.current ?? undefined;
					if (shouldArtifactSteer) {
						void chatRef.current
							.applyVoiceSteer({
								...buildHermesPromptOptions(annotationContext),
								text: pendingTranscript.text,
							})
							.catch((error) => {
								clearSteeringState();
								console.error("[RovoAppVoice] Voice steer submission failed:", error);
							});
					} else {
						void chatRef.current
							.submitPrompt({
								...buildHermesPromptOptions(annotationContext),
								text: pendingTranscript.text,
								files: [],
							})
							.catch((error) => {
								console.error("[RovoAppVoice] Voice transcript submission failed:", error);
							});
					}

					// Let the newly-submitted turn start before checking for a newer transcript.
					await Promise.resolve();
				}
			} finally {
				isDrainingVoiceRef.current = false;
				if (pendingVoiceTranscriptRef.current) {
					drainLatestVoiceTranscript();
				}
			}
		})().catch((error) => {
			console.error("[RovoAppVoice] Voice drain failed:", error);
		});
	}, [buildHermesPromptOptions, clearSteeringState]);

	const voice = useLiveVoice({
		onBargeInStart: useCallback(() => {
			stopSpeakingRef.current();
			if (chatRef.current.panelState === "preview") {
				if (chatRef.current.isStreaming) {
					skipNextAutoSpeakRef.current = true;
				}
				setSteeringState((currentState) =>
					currentState.phase === "pending" || currentState.phase === "applying"
						? currentState
						: {
								phase: "listening",
								text: null,
							},
				);
				console.info("[RovoAppVoice] Barge-in detected for artifact steering");
				return;
			}

			if (chatRef.current.isStreaming) {
				skipNextAutoSpeakRef.current = true;
				console.info("[RovoAppVoice] Barge-in detected while assistant turn is active");
				void chatRef.current
					.interruptActiveTurn({
						source: "voice-barge-in",
					})
					.catch((error) => {
						console.error("[RovoAppVoice] Failed to interrupt active turn:", error);
					});
			}
		}, []),
		onTranscription: useCallback(
			(text: string) => {
				const trimmedText = text.trim();
				if (!trimmedText) {
					return;
				}

				const transcriptId = voiceTranscriptIdRef.current + 1;
				voiceTranscriptIdRef.current = transcriptId;
				pendingVoiceTranscriptRef.current = {
					id: transcriptId,
					text: trimmedText,
				};
				if (chatRef.current.panelState === "preview") {
					setSteeringState({
						phase: "pending",
						text: trimmedText,
					});
				}
				console.info("[RovoAppVoice] Final transcript ready", {
					transcriptId,
					length: trimmedText.length,
				});
				drainLatestVoiceTranscript();
			},
			[drainLatestVoiceTranscript],
		),
		preferBrowserRecognition: false,
	});
	stopSpeakingRef.current = voice.stopSpeaking;
	const wasStreamingRef = useRef(false);

	const isVoiceActive = voice.state !== "idle";

	useEffect(() => {
		setSteeringState((currentState) => {
			if (currentState.phase === "idle" || currentState.phase === "pending" || currentState.phase === "applying") {
				return currentState;
			}

			if (voice.state === "processing") {
				return {
					...currentState,
					phase: "transcribing",
				};
			}

			if (voice.state === "recording" && currentState.phase === "transcribing") {
				return {
					...currentState,
					phase: "listening",
				};
			}

			if (voice.state === "idle") {
				return {
					phase: "idle",
					text: null,
				};
			}

			return currentState;
		});
	}, [voice.state]);

	useEffect(() => {
		if (steeringState.phase !== "applying") {
			return;
		}

		if (chat.status !== "submitted" && chat.status !== "streaming") {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setSteeringState((currentState) =>
				currentState.phase === "applying"
					? {
							phase: "idle",
							text: null,
						}
					: currentState,
			);
		}, 220);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [chat.status, steeringState.phase]);

	useEffect(() => {
		if (wasStreamingRef.current && !chat.isStreaming && voice.state !== "idle") {
			if (skipNextAutoSpeakRef.current) {
				skipNextAutoSpeakRef.current = false;
				wasStreamingRef.current = chat.isStreaming;
				return;
			}

			const lastAssistantMessage = [...chat.messages].reverse().find((message) => message.role === "assistant");
			if (lastAssistantMessage && getMessageInterruption(lastAssistantMessage)) {
				wasStreamingRef.current = chat.isStreaming;
				return;
			}

			const text = lastAssistantMessage ? getMessageText(lastAssistantMessage) : null;
			if (text) {
				// If the response created an artifact, the text part already says
				// 'Created artifact "Title".' — use the document title directly
				// to avoid double-wrapping that confuses TTS.
				const createdArtifact = lastAssistantMessage ? getMessageArtifactResult(lastAssistantMessage) : null;
				const spokenText = createdArtifact ? `${createdArtifact.action === "update" ? "Updated" : "Created"} artifact ${createdArtifact.title}.` : text;
				voice.speak(spokenText);
			}
		}
		wasStreamingRef.current = chat.isStreaming;
		// eslint-disable-next-line react-hooks/exhaustive-deps -- voice.speak is stable; including voice object would cause spurious re-runs
	}, [chat.isStreaming, chat.messages, chat.documents, voice.state, voice.speak]);

	const handleToggleVoice = useCallback(() => {
		if (voice.state === "idle") {
			clearSteeringState();
			voice.start();
		} else {
			// Clear any pending transcript without incrementing the drain epoch.
			// This avoids aborting an in-flight drain mid-interrupt, which would
			// leave the active generation stopped with no replacement prompt.
			// voice.stop() disables the mic/VAD/TTS so no new transcripts arrive.
			pendingVoiceTranscriptRef.current = null;
			clearSteeringState();
			voice.stop();
		}
	}, [clearSteeringState, voice]);

	const handleStop = useCallback(async () => {
		const hadActiveTurn = chatRef.current.isStreaming;
		clearPendingVoiceWork("manual-stop");
		voice.cancelPendingTranscription();
		stopSpeakingRef.current();
		if (hadActiveTurn) {
			skipNextAutoSpeakRef.current = true;
		}
		await chat.interruptActiveTurn({ source: "user-stop" });
	}, [chat, clearPendingVoiceWork, voice]);

	const voiceButtonState: VoiceButtonState = voice.state === "speaking" ? "processing" : voice.state;

	// --- Studio AI cursor companion ---
	const clicky = useClicky();
	const {
		toggle: toggleClicky,
		isActive: isClickyActive,
		deactivate: deactivateClicky,
		startListening: clickyStartListening,
		startProcessing: clickyStartProcessing,
		startPointing: clickyStartPointing,
		startSpeaking: clickyStartSpeaking,
		returnToIdle: clickyReturnToIdle,
		addExchange: clickyAddExchange,
		screenshotDimensions: clickyScreenshotDimensions,
		setScreenshotDimensions: clickySetScreenshotDimensions,
	} = clicky;

	const handleToggleClicky = useCallback(() => {
		toggleClicky();
	}, [toggleClicky]);

	// Keyboard shortcuts for Rovo
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd+Shift+K (Mac) / Ctrl+Shift+K (other) toggles Rovo
			if (e.key === "K" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggleClicky();
				return;
			}

			// Escape deactivates Rovo
			if (e.key === "Escape" && isClickyActive) {
				deactivateClicky();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isClickyActive, deactivateClicky, toggleClicky]);

	// --- Realtime voice (live conversation mode) ---
	const realtime = useRealtimeVoice({
		onDelegateToRovo: useCallback(
			async (request: DelegationRequest) => {
				try {
					const c = chatRef.current as RovoAppRealtimeShellAdapter;
					const contextDescription = mergeContextDescriptions(request.conversationSummary ? `[Voice context] ${request.conversationSummary}` : undefined, annotationContextRef.current);
					const extendedRequest = request as ExtendedDelegationRequest;
					const delegatedMessageId = extendedRequest.delegatedMessageId ?? extendedRequest.realtimeMessageId ?? extendedRequest.messageId ?? realtimeUserMessageIdRef.current;

					if (delegatedMessageId && typeof c.delegateToRovo === "function") {
						await c.delegateToRovo(delegatedMessageId, {
							...buildHermesPromptOptions(contextDescription),
							conversationSummary: request.conversationSummary,
							existingRealtimeMessageId: realtimeAssistantMessageIdRef.current ?? undefined,
							intentType: request.intentType,
							prompt: request.prompt,
							referencedFiles: request.referencedFiles,
							urgency: request.urgency,
						});
						return;
					}

					if (c.isStreaming && c.panelState === "preview") {
						await c.applyVoiceSteer({
							...buildHermesPromptOptions(contextDescription),
							text: request.prompt,
						});
					} else {
						if (c.isStreaming) {
							await c.interruptActiveTurn({ source: "voice-barge-in" });
						}
						await c.submitPrompt({
							...buildHermesPromptOptions(contextDescription),
							text: request.prompt,
							files: [],
						});
					}
				} catch (error) {
					injectRealtimeContext({
						type: "delegation_error",
						content: error instanceof Error ? error.message : "Studio failed to process the delegated request.",
					});
					throw error;
				}
			},
			[buildHermesPromptOptions, injectRealtimeContext],
		),
		onSpeechStarted: useCallback(() => {
			activateTailFollowMode();
			speechStartedAtRef.current = new Date().toISOString();
			realtimeUserTranscriptHasDeltaRef.current = false;
			resetRealtimeAssistantMessageState();
			realtimeUserMessageIdRef.current = null;
			setVoiceTranscript("");

			// Rovo: transition to listening
			if (isClickyActive) {
				clickyStartListening();
			}

			const annotationContext = annotationContextRef.current;
			if (!annotationContext) {
				return;
			}

			injectRealtimeContext({
				type: "artifact_annotations",
				content: annotationContext,
			});
		}, [activateTailFollowMode, injectRealtimeContext, isClickyActive, clickyStartListening, resetRealtimeAssistantMessageState]),
		onSpeechTranscriptDelta: useCallback((payload: RealtimeSpeechTranscriptPayload) => {
			// Browser SpeechRecognition sends { text } (full replacement);
			// OpenAI transcription deltas send { delta, text } (accumulated).
			// In both cases, `text` is the complete current transcript — use SET, not APPEND.
			const text = typeof payload === "string" ? payload : (payload.text ?? payload.delta ?? "");
			if (!text) {
				return;
			}

			realtimeUserTranscriptHasDeltaRef.current = true;
			setVoiceTranscript(text);
		}, []),
		onSpeechTranscriptCompleted: useCallback(
			async (payload: RealtimeSpeechTranscriptPayload) => {
				const transcript = typeof payload === "string" ? payload : (payload.transcript ?? payload.text ?? "");

				// Rovo: transition to processing and record user exchange
				if (isClickyActive) {
					clickyStartProcessing();
					if (transcript) {
						clickyAddExchange({ role: "user", content: transcript });
					}
				}

				// If the user manually stopped voice, skip auto-submit and leave
				// the transcribed text in the composer for manual review/submit
				if (manualVoiceStopRef.current) {
					manualVoiceStopRef.current = false;
					if (transcript) {
						setVoiceTranscript(transcript);
					}
					return;
				}

				if (!transcript) {
					setVoiceTranscript(null);
					return;
				}

				const messageId = await appendRealtimeMessage("user", transcript, {
					createdAt: speechStartedAtRef.current ?? undefined,
				});
				if (messageId) {
					realtimeUserMessageIdRef.current = messageId;
				}
				speechStartedAtRef.current = null;
				realtimeUserTranscriptHasDeltaRef.current = false;
				setVoiceTranscript(null);
			},
			[appendRealtimeMessage, isClickyActive, clickyStartProcessing, clickyAddExchange],
		),
		onTextResponseStart: useCallback(
			async (payload?: { messageId?: string }) => {
				if (typedScrollAnchorSourceRef.current === "realtime") {
					realtimeTypedResponseStartedRef.current = true;
				}
				realtimeAssistantMessageIdRef.current = await ensureRealtimeAssistantMessage(payload?.messageId ?? null);
			},
			[ensureRealtimeAssistantMessage],
		),
		onAssistantTextDelta: useCallback(
			async (payload: RealtimeAssistantTextPayload) => {
				const delta = typeof payload === "string" ? payload : (payload.delta ?? payload.text ?? "");
				if (!delta) {
					return;
				}

				const messageId = typeof payload === "string" ? await ensureRealtimeAssistantMessage() : await ensureRealtimeAssistantMessage(payload.messageId ?? null);
				await updateRealtimeMessage(messageId, delta);
			},
			[ensureRealtimeAssistantMessage, updateRealtimeMessage],
		),
		onAssistantTextCompleted: useCallback(
			async (payload: RealtimeAssistantTextCompletedPayload) => {
				const text = typeof payload === "string" ? payload : (payload.text ?? "");
				if (!text) {
					return;
				}

				const messageId = typeof payload === "string" ? await ensureRealtimeAssistantMessage() : await ensureRealtimeAssistantMessage(payload.messageId ?? null);
				await updateRealtimeMessage(messageId, text, {
					replace: true,
				});

				// Rovo: parse POINT tag and transition to speaking/pointing
				if (isClickyActive) {
					const parsed = parseClickyResponse(text, clickyScreenshotDimensions);
					clickyAddExchange({ role: "assistant", content: parsed.text || text });
					if (parsed.point) {
						clickyStartPointing(parsed.point, parsed.text);
					} else {
						clickyStartSpeaking(text);
					}
				}
			},
			[ensureRealtimeAssistantMessage, updateRealtimeMessage, isClickyActive, clickyStartPointing, clickyStartSpeaking, clickyAddExchange, clickyScreenshotDimensions],
		),
		chatMessages: chat.messages,
		isGenerating: chat.isStreaming,
	} satisfies RealtimeVoiceShellOptions) as RealtimeVoiceShellResult;

	const isRealtimeActive = realtime.voiceState !== "idle";

	// --- Rovo voice bridge ---
	useClickyVoice({
		clickyState: clicky.state,
		isClickyActive,
		sendImageInput: realtime.sendImageInput,
		isRealtimeConnected: realtime.isConnected,
		connectRealtime: realtime.connect,
		disconnectRealtime: realtime.disconnect,
		injectContext: realtime.injectContext,
		onScreenshotCaptured: clickySetScreenshotDimensions,
	});

	const realtimeStatusMessage = resolveRealtimeStatusMessage(realtime);
	const shouldChatVoiceModeBeEnabled = isVoiceActive || isRealtimeActive;
	const realtimeSessionIdentity = resolveRealtimeSessionIdentity(realtime, chat.activeThreadId, chat.runtimeThreadId);
	const wasRealtimeStreamingRef = useRef(false);

	useEffect(() => {
		realtimeInjectContextRef.current = realtime.injectContext as typeof realtimeInjectContextRef.current;
	}, [realtime.injectContext]);

	useEffect(() => {
		if (shouldChatVoiceModeBeEnabled !== chat.isVoiceMode) {
			setChatVoiceMode(shouldChatVoiceModeBeEnabled);
		}
	}, [chat.isVoiceMode, setChatVoiceMode, shouldChatVoiceModeBeEnabled]);

	// Inject Rovo results back into GPT session for context continuity
	useEffect(() => {
		if (wasRealtimeStreamingRef.current && !chat.isStreaming && isRealtimeActive) {
			const lastAssistantMessage = [...chat.messages].reverse().find((m) => m.role === "assistant");
			if (lastAssistantMessage) {
				const text = getMessageText(lastAssistantMessage);
				const artifact = getMessageArtifactResult(lastAssistantMessage);
				const summary = artifact ? `Studio ${artifact.action === "update" ? "updated" : "created"} artifact "${artifact.title}". ${text || ""}` : text || "Studio completed the task.";
				injectRealtimeContext({
					type: "thread_message",
					content: summary.slice(0, REALTIME_RESULT_SUMMARY_MAX_CHARS),
				});
			}
		}
		wasRealtimeStreamingRef.current = chat.isStreaming;
	}, [chat.isStreaming, chat.messages, injectRealtimeContext, isRealtimeActive]);

	useEffect(() => {
		if (!isRealtimeActive || !realtimeSessionIdentity) {
			injectedRealtimeThreadContextKeyRef.current = null;
			return;
		}

		const contextKey = `${chat.activeThreadId ?? chat.runtimeThreadId}:${realtimeSessionIdentity}`;
		if (injectedRealtimeThreadContextKeyRef.current === contextKey) {
			return;
		}

		const summary = buildRealtimeThreadSummary(chat.messages);
		if (summary) {
			injectRealtimeContext({
				type: "thread_context",
				summary,
			});
		}
		injectedRealtimeThreadContextKeyRef.current = contextKey;
	}, [chat.activeThreadId, chat.messages, chat.runtimeThreadId, injectRealtimeContext, isRealtimeActive, realtimeSessionIdentity]);

	const handleToggleRealtimeVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			// Stop legacy voice if active
			if (voice.state !== "idle") {
				pendingVoiceTranscriptRef.current = null;
				clearSteeringState();
				voice.stop();
			}
			clearSteeringState();
			manualVoiceStopRef.current = false;
			realtime.connect();
		} else {
			// Capture the hook's transcript before disconnect clears it.
			// This covers the case where transcription_completed fired
			// (setting currentTranscript) but no streaming deltas arrived
			// (voiceTranscript would still be empty).
			const transcriptToPreserve = realtime.currentTranscript;
			pendingVoiceTranscriptRef.current = null;
			clearSteeringState();
			realtimeUserMessageIdRef.current = null;
			resetRealtimeAssistantMessageState();
			speechStartedAtRef.current = null;
			// Set flag to prevent auto-submit race from a late transcription_completed
			manualVoiceStopRef.current = true;
			// Don't clear voiceTranscript — leave text in composer for manual review/submit
			realtime.disconnect();
			// If voiceTranscript is empty but the hook had a completed transcript,
			// populate the composer so the user can review/submit
			if (transcriptToPreserve.trim()) {
				setVoiceTranscript(transcriptToPreserve);
			}
		}
	}, [clearSteeringState, realtime, resetRealtimeAssistantMessageState, voice]);

	const handleComposerSubmit = useCallback(
		async ({ files, text }: { files: FileUIPart[]; text: string }) => {
			const realtimeChat = chatRef.current as RovoAppRealtimeShellAdapter;
			const realtimeVoice = realtime as RealtimeVoiceShellResult;
			const shouldStartStudioAgentCreation = isDefaultAgentHomeStateRef.current && !isRealtimeActive;
			const studioAgentCreationContext = shouldStartStudioAgentCreation ? buildStudioAgentCreationContext(text) : undefined;
			const contextDescription = mergeContextDescriptions(annotationContextRef.current, studioAgentCreationContext);
			const hermesPromptOptions = buildHermesPromptOptions(contextDescription);
			const shouldClearHermesSkillSelection = Boolean(hermesPromptOptions.hermesContext);
			const latestUserMessageIdBeforeSubmit = getLatestUserMessageId(chat.messages);

			if (isRealtimeActive) {
				if (typeof realtimeChat.submitRealtimeText === "function") {
					queueTypedScrollAnchor("realtime", latestUserMessageIdBeforeSubmit);
					try {
						await realtimeChat.submitRealtimeText({
							...hermesPromptOptions,
							files,
							text,
						});
						if (shouldClearHermesSkillSelection) {
							clearHermesSkillSelection();
						}
					} catch (error) {
						resetTypedScrollAnchorState();
						throw error;
					}
					return;
				}

				if (typeof realtimeVoice.sendTextInput === "function") {
					queueTypedScrollAnchor("realtime", latestUserMessageIdBeforeSubmit);
					resetRealtimeAssistantMessageState();

					// Rovo: capture screenshot + transition to processing for text input
					if (isClickyActive) {
						clickyAddExchange({ role: "user", content: text });
						clickyStartProcessing();
					}

					let messageId: string | null = null;
					if (typeof realtimeChat.appendRealtimeMessage === "function") {
						messageId = await appendRealtimeMessage("user", text, {
							contextDescription,
						});
						if (messageId) {
							realtimeUserMessageIdRef.current = messageId;
						}
					}

					try {
						await realtimeVoice.sendTextInput({
							contextDescription,
							messageId: messageId ?? undefined,
							text,
						});
					} catch (error) {
						resetTypedScrollAnchorState();
						throw error;
					}
					return;
				}
			}

			const trimmedText = text.trim();
			const shouldShowOptimisticPrompt = !chat.shouldQueueNextSubmission && (trimmedText || files.length > 0);
			if (shouldShowOptimisticPrompt) {
				setOptimisticUserMessage(
					createRovoAppUserMessage({
						id: createId("rovo-app-user"),
						createdAt: new Date().toISOString(),
						files,
						text: trimmedText,
					}),
				);
			}

			queueTypedScrollAnchor("standard", latestUserMessageIdBeforeSubmit);
			try {
				if (shouldStartStudioAgentCreation) {
					markStudioAgentCreationThread(chat.runtimeThreadId);
					markStudioAgentCreationThread(chat.activeThreadId);
				}
				const submitPrompt = realtimeChat.submitPrompt as (payload: StudioSubmitPromptPayload) => Promise<void>;
				await submitPrompt({
					...hermesPromptOptions,
					files,
					text,
					...(shouldStartStudioAgentCreation ? { creationMode: "agent" as const } : {}),
				});
				if (shouldClearHermesSkillSelection) {
					clearHermesSkillSelection();
				}
			} catch (error) {
				setOptimisticUserMessage(null);
				resetTypedScrollAnchorState();
				throw error;
			}
		},
		[
			appendRealtimeMessage,
			chat.messages,
			isRealtimeActive,
			isClickyActive,
			clickyAddExchange,
			clickyStartProcessing,
			queueTypedScrollAnchor,
			realtime,
			resetRealtimeAssistantMessageState,
			resetTypedScrollAnchorState,
			setOptimisticUserMessage,
			buildHermesPromptOptions,
			clearHermesSkillSelection,
			markStudioAgentCreationThread,
			chat.activeThreadId,
			chat.shouldQueueNextSubmission,
			chat.runtimeThreadId,
		],
	);

	const displayMessages = useMemo(() => {
		if (!optimisticUserMessage) {
			return chat.messages;
		}

		const optimisticText = getMessageText(optimisticUserMessage).trim();
		const hasVisibleUserMessage = chat.messages.some((message) => {
			if (message.role !== "user") {
				return false;
			}

			if (message.id === optimisticUserMessage.id) {
				return true;
			}

			return optimisticText.length > 0 && getMessageText(message).trim() === optimisticText;
		});

		return hasVisibleUserMessage ? chat.messages : [...chat.messages, optimisticUserMessage];
	}, [chat.messages, optimisticUserMessage]);

	const visibleMessages = useMemo(() => {
		return displayMessages.filter((message) => {
			return message.role === "user" || message.role === "assistant";
		});
	}, [displayMessages]);
	useEffect(() => {
		if (studioAgentCreationThreadKeysRef.current.has(chat.runtimeThreadId) && chat.activeThreadId) {
			markStudioAgentCreationThread(chat.activeThreadId);
		}
	}, [chat.activeThreadId, chat.runtimeThreadId, markStudioAgentCreationThread]);
	useEffect(() => {
		if (
			!studioAgentCreationThreadKeysRef.current.has(chat.runtimeThreadId) &&
			(!chat.activeThreadId || !studioAgentCreationThreadKeysRef.current.has(chat.activeThreadId))
		) {
			return;
		}

		for (const message of chat.messages) {
			const agentResult = getMessageAgentResult(message);
			if (!agentResult) {
				continue;
			}

			const agentResultKey = `${chat.runtimeThreadId}:${message.id}:${agentResult.agentId}:${agentResult.action}`;
			if (handledAgentResultKeysRef.current.has(agentResultKey)) {
				continue;
			}

			if (handleStudioAgentResultSelect(agentResult, { sourceMessageId: message.id })) {
				handledAgentResultKeysRef.current.add(agentResultKey);
				unmarkStudioAgentCreationThread(chat.runtimeThreadId);
				unmarkStudioAgentCreationThread(chat.activeThreadId);
			}
		}
	}, [chat.activeThreadId, chat.messages, chat.runtimeThreadId, handleStudioAgentResultSelect, unmarkStudioAgentCreationThread]);
	const timelineItems = useMemo(() => {
		return deriveRovoAppTimelineItems(displayMessages);
	}, [displayMessages]);
	const latestTimelineMessageId = timelineItems[0]?.id ?? null;
	const scrollActiveTimelineId = scrollActiveTimelineSelection
		&& scrollActiveTimelineSelection.runtimeThreadId === chat.runtimeThreadId
		&& scrollActiveTimelineSelection.latestTimelineMessageId === latestTimelineMessageId
		? scrollActiveTimelineSelection.messageId
		: null;
	const activeTimelineMessageId = scrollActiveTimelineId ?? latestTimelineMessageId;
	const handleScrollActiveTimelineChange = useCallback((messageId: string | null) => {
		setScrollActiveTimelineSelection(
			messageId
				? {
					latestTimelineMessageId,
					messageId,
					runtimeThreadId: chat.runtimeThreadId,
				}
				: null,
		);
	}, [chat.runtimeThreadId, latestTimelineMessageId]);

	useEffect(() => {
		if (!optimisticUserMessage) {
			return;
		}

		const hasVisibleUserMessage = chat.messages.some((message) => {
			if (message.role !== "user") {
				return false;
			}

			return message.id === optimisticUserMessage.id || getMessageText(message).trim() === getMessageText(optimisticUserMessage).trim();
		});

		if (hasVisibleUserMessage) {
			setOptimisticUserMessage(null);
		}
	}, [chat.messages, optimisticUserMessage]);

	useEffect(() => {
		const latestUserMessageId = getLatestUserMessageId(chat.messages);
		if (pendingTypedScrollAnchorRef.current && latestUserMessageId && latestUserMessageId !== previousTypedAnchorUserMessageIdRef.current) {
			pendingTypedScrollAnchorRef.current = false;
			previousTypedAnchorUserMessageIdRef.current = null;
			setScrollAnchorMessageId(latestUserMessageId);
			setScrollFollowMode("target");
		}
	}, [chat.messages]);

	useEffect(() => {
		activateTailFollowMode();
	}, [activateTailFollowMode, chat.runtimeThreadId]);

	useEffect(() => {
		if (typedScrollAnchorSourceRef.current !== "realtime" || !realtimeTypedResponseStartedRef.current) {
			return;
		}

		if (realtime.generationState !== "complete" && realtime.generationState !== "idle") {
			return;
		}

		activateTailFollowMode();
	}, [activateTailFollowMode, realtime.generationState]);

	useEffect(() => {
		if (typedScrollAnchorSourceRef.current !== "standard" || chat.isStreaming) {
			return;
		}

		activateTailFollowMode();
	}, [activateTailFollowMode, chat.isStreaming]);

	const visibleWorkspaceDocumentId = chat.visibleArtifactDocumentId;
	const workspaceDocument = useMemo(() => {
		return visibleWorkspaceDocumentId && chat.streamingArtifact?.documentId === visibleWorkspaceDocumentId
			? {
					id: chat.streamingArtifact.documentId ?? "streaming-artifact",
					threadId: chat.activeThreadId ?? chat.runtimeThreadId,
					title: chat.streamingArtifact.title || "Artifact draft",
					kind: chat.streamingArtifact.kind,
					sourceMessageId: null,
					createdAt: chat.streamingArtifact.createdAt,
					updatedAt: chat.streamingArtifact.updatedAt,
					versions: [
						{
							changeLabel: "Generating",
							id: "streaming",
							content: chat.streamingArtifact.content,
							createdAt: chat.streamingArtifact.updatedAt,
							title: chat.streamingArtifact.title || "Artifact draft",
						},
					],
				}
			: visibleWorkspaceDocumentId
				? (chat.documents.find((document) => document.id === visibleWorkspaceDocumentId) ?? null)
				: null;
	}, [chat.activeThreadId, chat.documents, chat.runtimeThreadId, chat.streamingArtifact, visibleWorkspaceDocumentId]);
	const selectedDocumentVersion = useMemo(() => {
		return workspaceDocument?.versions.find((version) => version.id === chat.selectedVersionId) ?? workspaceDocument?.versions.at(-1) ?? null;
	}, [chat.selectedVersionId, workspaceDocument]);
	const isArtifactOpen = chat.panelState !== "closed";

	const artifactMenuItems = useMemo(() => {
		const items = sortRovoAppArtifacts(chat.documents).map((artifact) => ({
			id: artifact.id,
			typeLabel: getRovoAppArtifactTypeLabel(artifact),
			title: artifact.title,
		}));
		const seenIds = new Set(items.map((item) => item.id));

		for (let index = chat.messages.length - 1; index >= 0; index--) {
			const artifactResult = getMessageArtifactResult(chat.messages[index]);
			if (!artifactResult || seenIds.has(artifactResult.documentId)) {
				continue;
			}

			seenIds.add(artifactResult.documentId);
			items.push({
				id: artifactResult.documentId,
				typeLabel: getRovoAppArtifactKindLabel(artifactResult.kind),
				title: artifactResult.title,
			});
		}

		return items;
	}, [chat.documents, chat.messages]);

	// Derive the latest browser state from message data parts
	const latestBrowserArtifact = useMemo(() => {
		let browserState = null;
		let browserStateMessageId: string | null = null;
		let browserScreenshot = null;

		for (let i = chat.messages.length - 1; i >= 0; i--) {
			const message = chat.messages[i];
			if (!browserState) {
				const part = getLatestDataPart(message, "data-browser-state");
				if (part) {
					browserState = part.data;
					browserStateMessageId = message.id;
				}
			}

			if (!browserScreenshot) {
				const part = getLatestDataPart(message, "data-browser-screenshot");
				if (part) {
					browserScreenshot = part.data;
				}
			}

			if (browserState && browserScreenshot) {
				break;
			}
		}

		return {
			browserArtifactKey: buildRovoAppBrowserArtifactKey({
				browserScreenshot,
				browserState,
				messageId: browserStateMessageId,
			}),
			browserScreenshot,
			browserState,
		};
	}, [chat.messages]);
	const browserArtifactKey = latestBrowserArtifact.browserArtifactKey;
	const browserState = latestBrowserArtifact.browserState;
	const browserScreenshot = latestBrowserArtifact.browserScreenshot;

	useEffect(() => {
		setDismissedBrowserArtifactKey(null);
	}, [chat.runtimeThreadId]);

	// Auto-open artifact panel when browser state arrives and no document artifact is active
	useEffect(() => {
		if (shouldAutoOpenRovoAppBrowserArtifact({
			browserArtifactKey,
			dismissedBrowserArtifactKey,
			hasWorkspaceDocument: Boolean(workspaceDocument),
			panelState: chat.panelState,
		})) {
			chat.setPanelState("preview");
		}
	}, [browserArtifactKey, chat, dismissedBrowserArtifactKey, workspaceDocument]);
	const shouldShowReopenBrowserPreviewControl = shouldShowReopenRovoAppBrowserArtifactControl({
		browserArtifactKey,
		dismissedBrowserArtifactKey,
		hasWorkspaceDocument: Boolean(workspaceDocument),
		panelState: chat.panelState,
	});
	const hasActiveThreadRun = typeof chat.activeThreadId === "string" && chat.backgroundStreamThreadIds.has(chat.activeThreadId);
	const showHomeState = !chat.isLoadingThread && !isArtifactOpen && !hasActiveThreadRun && visibleMessages.length === 0;
	const shouldShowChatHeader = visibleMessages.length > 0 || hasActiveThreadRun || chat.isStreaming;
	const isDefaultAgentHomeState = showHomeState && !isCustomAgentSelected;
	isDefaultAgentHomeStateRef.current = isDefaultAgentHomeState;
	const shouldReduceMotion = useReducedMotion();
	const shouldShowTimelineNavigator = !showHomeState && !isArtifactOpen && timelineItems.length > 1;
	const composerPreviewState = resolveRovoAppComposerPlaceholder({
		defaultPlaceholder: DEFAULT_COMPOSER_PLACEHOLDER,
		previewPrompt,
		showHomeState,
	});
	const canAnnotateWorkspaceDocument = workspaceDocument !== null;
	const annotationState = useArtifactAnnotations({
		active: cursorMode && isArtifactOpen && !chat.streamingArtifact && chat.artifactMode === "preview" && process.env.NODE_ENV === "development",
		documentId: workspaceDocument?.id ?? null,
		documentKind: workspaceDocument?.kind ?? null,
		documentVersionId: selectedDocumentVersion?.id ?? null,
		containerRef: artifactContentRef,
	});
	const {
		annotations: artifactAnnotations,
		addComment: addArtifactAnnotationComment,
		clearAnnotations,
		dismissSelection: dismissArtifactSelection,
		formatContextForVoice,
		pendingSelection: pendingArtifactSelection,
		removeAnnotation: removeArtifactAnnotation,
	} = annotationState;

	const handleApplyAnnotations = useCallback(
		(annotationsToApply: ArtifactAnnotation[]) => {
			if (annotationsToApply.length === 0) {
				return;
			}

			for (const annotation of annotationsToApply) {
				const contextDescription = formatAnnotationsForVoiceContext([annotation]);
				void chat
					.submitPrompt({
						...buildHermesPromptOptions(contextDescription),
						text: annotation.comment,
						files: [],
					})
					.catch(() => {});
			}

			clearAnnotations();
			setCursorMode(false);
		},
		[buildHermesPromptOptions, chat, clearAnnotations],
	);

	const shellRef = useRef<HTMLDivElement | null>(null);
	const composerDockRef = useRef<HTMLDivElement | null>(null);
	const artifactCardOriginRef = useRef<DOMRect | null>(null);
	const artifactPreviewOriginRef = useRef<Map<string, DOMRect>>(new Map());
	const [artifactOrigin, setArtifactOrigin] = useState({
		left: 0,
		top: 0,
		width: 320,
		height: 96,
	});
	const artifactSplitChatPaneWidthRef = useRef<number | null>(null);
	const artifactLayout = getRovoAppShellLayout(shellSize.width);
	const isAgentConfigOverlayActive = shouldShowAgentConfigPane && artifactLayout.mode !== "split";
	const shouldSplitArtifactPane = !shouldShowAgentConfigPane && isArtifactOpen && artifactLayout.mode === "split";
	const splitChatPaneMaxSize = shouldSplitArtifactPane || (shouldShowAgentConfigPane && !isAgentConfigOverlayActive)
		? Math.min(ROVO_APP_MAX_CHAT_PANE_WIDTH, Math.max(ROVO_APP_MIN_CHAT_PANE_WIDTH, shellSize.width - ROVO_APP_MIN_ARTIFACT_PANE_WIDTH))
		: ROVO_APP_MAX_CHAT_PANE_WIDTH;
	const splitChatPaneDefaultSize = shouldSplitArtifactPane || (shouldShowAgentConfigPane && !isAgentConfigOverlayActive)
		? clamp(artifactSplitChatPaneWidthRef.current ?? artifactLayout.chatPaneWidth ?? ROVO_APP_MIN_CHAT_PANE_WIDTH, ROVO_APP_MIN_CHAT_PANE_WIDTH, splitChatPaneMaxSize)
		: ROVO_APP_MIN_CHAT_PANE_WIDTH;
	const splitArtifactPaneDefaultSize = shouldSplitArtifactPane || (shouldShowAgentConfigPane && !isAgentConfigOverlayActive)
		? Math.max(ROVO_APP_MIN_ARTIFACT_PANE_WIDTH, shellSize.width - splitChatPaneDefaultSize)
		: ROVO_APP_MIN_ARTIFACT_PANE_WIDTH;

	useEffect(() => {
		if (!isRealtimeActive) {
			injectedRealtimeArtifactContextKeyRef.current = null;
			return;
		}

		const artifactContext = buildRealtimeArtifactContextSummary({
			annotationContext: annotationContextRef.current,
			document: workspaceDocument
				? {
						id: workspaceDocument.id,
						kind: workspaceDocument.kind,
						title: workspaceDocument.title,
					}
				: null,
		});
		if (!artifactContext) {
			return;
		}

		const contextKey = [workspaceDocument?.id ?? "none", selectedDocumentVersion?.id ?? "latest", annotationContextRef.current ?? "no-annotations"].join(":");
		if (injectedRealtimeArtifactContextKeyRef.current === contextKey) {
			return;
		}

		injectRealtimeContext({
			type: "artifact_context",
			content: artifactContext,
		});
		injectedRealtimeArtifactContextKeyRef.current = contextKey;
	}, [injectRealtimeContext, isRealtimeActive, selectedDocumentVersion?.id, workspaceDocument]);

	useEffect(() => {
		if (isArtifactOpen || visibleMessages.length > 0) {
			setGalleryExpanded(false);
		}
	}, [isArtifactOpen, visibleMessages.length]);

	useEffect(() => {
		if (!showHomeState && previewPrompt !== null) {
			setPreviewPrompt(null);
		}
	}, [previewPrompt, showHomeState]);

	useEffect(() => {
		const nextContext = formatContextForVoice().trim();
		annotationContextRef.current = nextContext.length > 0 ? nextContext : null;
	}, [artifactAnnotations, formatContextForVoice]);

	useEffect(() => {
		if (!isArtifactOpen) {
			setCursorMode(false);
		}
	}, [isArtifactOpen]);

	useEffect(() => {
		if (chat.streamingArtifact) {
			setCursorMode(false);
		}
	}, [chat.streamingArtifact]);

	useEffect(() => {
		if (!canAnnotateWorkspaceDocument) {
			setCursorMode(false);
		}
	}, [canAnnotateWorkspaceDocument]);

	useEffect(() => {
		clearAnnotations();
	}, [clearAnnotations, workspaceDocument?.id]);

	useEffect(() => {
		clearAnnotations();
	}, [clearAnnotations, selectedDocumentVersion?.id]);

	useEffect(() => {
		if (chat.artifactMode !== "preview") {
			setCursorMode(false);
			clearAnnotations();
		}
	}, [chat.artifactMode, clearAnnotations]);

	useEffect(() => {
		const updateViewportWidth = () => {
			if (typeof window === "undefined") {
				return;
			}

			const width = Math.max(1, Math.round(window.innerWidth));
			setViewportWidthPx((prev) => (prev === width ? prev : width));
		};

		updateViewportWidth();
		window.addEventListener("resize", updateViewportWidth);
		return () => window.removeEventListener("resize", updateViewportWidth);
	}, []);

	useEffect(() => {
		const shellElement = shellRef.current;
		if (!shellElement || typeof ResizeObserver === "undefined") {
			return;
		}

		const updateBounds = () => {
			setShellSize((prev) => {
				const width = shellElement.clientWidth;
				const height = shellElement.clientHeight;
				return prev.width === width && prev.height === height ? prev : { width, height };
			});
		};

		updateBounds();
		const observer = new ResizeObserver(() => {
			updateBounds();
		});
		observer.observe(shellElement);
		return () => observer.disconnect();
	}, []);

	const handleOpenArtifactFromCard = useCallback(
		(documentId: string, element: HTMLElement) => {
			const shellElement = shellRef.current;
			if (shellElement) {
				const shellRect = shellElement.getBoundingClientRect();
				const cardRect = element.getBoundingClientRect();
				artifactCardOriginRef.current = new DOMRect(cardRect.left - shellRect.left, cardRect.top - shellRect.top, cardRect.width, cardRect.height);
			}
			void chat.openDocument(documentId);
		},
		[chat],
	);

	const handleRegisterArtifactCard = useCallback((documentId: string, element: HTMLElement) => {
		const shellElement = shellRef.current;
		if (!shellElement) {
			return;
		}

		const shellRect = shellElement.getBoundingClientRect();
		const cardRect = element.getBoundingClientRect();
		artifactPreviewOriginRef.current.set(documentId, new DOMRect(cardRect.left - shellRect.left, cardRect.top - shellRect.top, cardRect.width, cardRect.height));
	}, []);

	useEffect(() => {
		if (!isArtifactOpen) {
			return;
		}

		const cardOrigin = artifactCardOriginRef.current;
		if (cardOrigin) {
			artifactCardOriginRef.current = null;
			setArtifactOrigin({
				left: Math.max(cardOrigin.x, 16),
				top: Math.max(cardOrigin.y, 16),
				width: Math.min(Math.max(cardOrigin.width, 260), 420),
				height: Math.min(Math.max(cardOrigin.height, 40), 140),
			});
			return;
		}

		const previewOrigin = workspaceDocument?.id ? (artifactPreviewOriginRef.current.get(workspaceDocument.id) ?? null) : null;
		if (previewOrigin) {
			setArtifactOrigin({
				left: Math.max(previewOrigin.x, 16),
				top: Math.max(previewOrigin.y, 16),
				width: Math.min(Math.max(previewOrigin.width, 260), 420),
				height: Math.min(Math.max(previewOrigin.height, 40), 220),
			});
			return;
		}

		const shellElement = shellRef.current;
		const composerElement = composerDockRef.current;
		if (!shellElement || !composerElement) {
			return;
		}

		const shellRect = shellElement.getBoundingClientRect();
		const composerRect = composerElement.getBoundingClientRect();
		const nextWidth = Math.min(Math.max(composerRect.width - 56, 260), 420);
		const nextHeight = Math.min(Math.max(composerRect.height, 72), 140);
		const nextLeft = Math.max(composerRect.left - shellRect.left + 28, 16);
		const nextTop = Math.max(composerRect.top - shellRect.top + 8, 16);

		setArtifactOrigin({
			left: nextLeft,
			top: nextTop,
			width: nextWidth,
			height: nextHeight,
		});
	}, [isArtifactOpen, workspaceDocument?.id]);

	const handleArtifactSplitLayoutChanged = useCallback(
		(layout: Record<string, number>) => {
			const nextChatPanePercentage = layout[ROVO_APP_SPLIT_CHAT_PANEL_ID];
			if (!Number.isFinite(nextChatPanePercentage) || shellSize.width <= 0) {
				return;
			}

			artifactSplitChatPaneWidthRef.current = Math.round((shellSize.width * nextChatPanePercentage) / 100);
		},
		[shellSize.width],
	);

	const handleCloseArtifactPane = useCallback(() => {
		if (!workspaceDocument) {
			return;
		}

		if (chat.streamingArtifact?.documentId !== workspaceDocument.id) {
			chat.setActiveDocumentId(null);
		}
		chat.hideArtifactPane();
	}, [workspaceDocument, chat]);

	const handleOpenBrowserPreview = useCallback(() => {
		setDismissedBrowserArtifactKey(null);
		if (chat.panelState === "closed") {
			chat.setPanelState("preview");
		}
	}, [chat]);

	const handleCloseBrowserPreview = useCallback(() => {
		if (browserArtifactKey) {
			setDismissedBrowserArtifactKey(browserArtifactKey);
		}
		chat.hideArtifactPane();
	}, [browserArtifactKey, chat]);

	const agentConfigPane = activeSessionAgentEntry ? (
		<RovoAppAgentConfigPanel
			entry={activeSessionAgentEntry}
			onClose={handleCloseAgentConfigPane}
			onCommitPublishReady={handleCommitAgentPublishReady}
			onPublish={handlePublishAgent}
			onUpdateDraft={handleUpdateAgentDraft}
		/>
	) : null;

	const artifactPane = (() => {
		if (!isArtifactOpen) {
			return null;
		}

		if (!workspaceDocument && browserState) {
			return (
				<RovoAppBrowserArtifact
					url={browserState.url}
					title={browserState.title}
					status={browserState.status}
					screenshot={browserScreenshot}
					streamConfig={browserState.streamConfig ?? null}
					workspaceId={browserState.workspaceId ?? null}
					onClose={handleCloseBrowserPreview}
				/>
			);
		}

		if (!workspaceDocument) {
			return null;
		}

		return (
			<ArtifactPanel
				annotations={artifactAnnotations}
				contentRef={artifactContentRef}
				cursorMode={cursorMode}
				document={workspaceDocument}
				draftContent={chat.streamingArtifact?.content ?? chat.artifactDraftContent}
				isStreaming={Boolean(chat.streamingArtifact)}
				mode={chat.artifactMode}
				onAddComment={addArtifactAnnotationComment}
				onApplyAnnotations={handleApplyAnnotations}
				onClose={handleCloseArtifactPane}
				onCursorModeChange={canAnnotateWorkspaceDocument ? setCursorMode : undefined}
				onDelete={() => chat.deleteDocument(workspaceDocument.id)}
				onDraftChange={chat.setArtifactDraftContent}
				onDismissSelection={dismissArtifactSelection}
				onModeChange={chat.setArtifactMode}
				onRemoveAnnotation={removeArtifactAnnotation}
				onSave={chat.saveArtifactDraft}
				onVersionChange={(versionId) => {
					chat.setSelectedVersionId(versionId);
					const nextVersion = workspaceDocument?.versions.find((version) => version.id === versionId) ?? selectedDocumentVersion;
					chat.setArtifactDraftContent(nextVersion?.content ?? "");
				}}
				pendingSelection={pendingArtifactSelection}
				selectedVersionId={selectedDocumentVersion?.id ?? null}
			/>
		);
	})();

	const chatPane = (
		<>
			<ViewTransition key={chat.runtimeThreadId} enter="fade-in" exit="fade-out" default="none">
				<RovoAppMessages
					activeDocumentId={chat.activeDocument?.id ?? null}
					compact={isArtifactOpen || shouldShowAgentConfigPane}
					extraHorizontalPaddingWhenCompact
					isMaxMode={chat.isPlanMode}
					documents={chat.documents}
					editingMessageId={chat.editingMessageId}
					isStreaming={chat.isStreaming}
					messages={displayMessages}
					onBuildPlan={handleBuildPlan}
					onEditMessage={chat.editMessage}
					onOpenArtifactFromCard={handleOpenArtifactFromCard}
					onOpenBrowserPreview={handleOpenBrowserPreview}
					onOpenPlanPreview={handleOpenPlanPreview}
					onAgentResultSelect={handleStudioAgentResultSelect}
					onRegisterArtifactCard={handleRegisterArtifactCard}
					onRegenerate={chat.regenerateLatest}
					onScrollActiveUserMessageChange={handleScrollActiveTimelineChange}
					onSelectSuggestion={handleRovoAppSuggestionSelect}
					onSetEditingMessageId={chat.setEditingMessageId}
					onVote={chat.voteOnMessage}
					pendingPlanMetadataMessageIds={chat.pendingPlanMetadataMessageIds}
					pendingArtifactResult={chat.pendingArtifactResult}
					scrollAnchorMessageId={scrollAnchorMessageId}
					scrollFollowMode={scrollFollowMode}
					selectedAgent={selectedAgent}
					showEmptyState={showHomeState}
					shouldSuppressLatestAssistantSuggestions={chat.shouldSuppressLatestAssistantSuggestions}
					streamingArtifact={chat.streamingArtifact}
					streamingArtifactMessageId={chat.streamingArtifactMessageId}
					votes={chat.votes}
				/>
			</ViewTransition>

			{isDefaultAgentHomeState ? (
				<motion.div
					className="z-10 mx-auto mb-5 w-[90%] px-3"
					initial={shouldReduceMotion ? false : { opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.25, ease: [0, 0.4, 0, 1], delay: 0.2 }}
					style={{ willChange: "opacity" }}
				>
					<HomeStarterBento
						onSelect={handleGallerySelect}
						onPreviewStart={handleGalleryPreviewStart}
						onPreviewEnd={handleGalleryPreviewEnd}
						sessionAgents={studioAgentRegistry.sessionAgentEntries.map((entry) => entry.profile)}
					/>
				</motion.div>
			) : null}

			<div
				ref={composerDockRef}
				className={cn(
					"z-10 mx-auto flex min-w-0 w-full flex-col gap-3 overflow-visible",
					!showHomeState && "sticky bottom-0 bg-background/90 backdrop-blur",
					isArtifactOpen || shouldShowAgentConfigPane ? "max-w-none px-3" : "max-w-[800px]",
				)}
			>
				{realtimeStatusMessage ? <div className="px-1 text-text-subtle text-xs">{realtimeStatusMessage}</div> : null}
				{shouldShowReopenBrowserPreviewControl ? (
					<div className="flex justify-center px-1">
						<Button onClick={handleOpenBrowserPreview} size="sm" type="button" variant="outline">
							Reopen browser preview
						</Button>
					</div>
				) : null}
				<div>
					{shouldShowQuestionCard && activeQuestionCard ? (
						<>
							<ClarificationQuestionCard
								key={activeQuestionCardKey ?? undefined}
								questionCard={activeQuestionCard}
								onSubmit={(answers) => {
									handleClarificationSubmit(answers);
									hideQuestionCard();
								}}
								onDismiss={() => {
									dismissQuestionCard();
									hideQuestionCard();
								}}
							/>
							<QuestionCardShortcutsFooter />
						</>
					) : shouldShowApprovalCard && activePendingPlan ? (
						<>
							<ApprovalCard key={pendingPlanKey ?? undefined} onDismiss={handleDismissApprovalCard} onSelect={handlePlanApprovalSubmit} isSubmitting={isSubmittingPlanApproval} />
							<QuestionCardShortcutsFooter escLabel="cancel" />
						</>
					) : (
						<>
							{activeThreadRecord?.id && activeThreadMemoryProposals.length > 0 && dismissedMemoryBarThreadId !== activeThreadRecord.id ? (
								<div className="mb-3">
									<RovoAppHermesMemoryBar
										onDismiss={() => setDismissedMemoryBarThreadId(activeThreadRecord.id)}
										onOpenMemories={() => router.push(`/studio/memories?threadId=${encodeURIComponent(activeThreadRecord.id)}`)}
										proposals={activeThreadMemoryProposals}
										threadId={activeThreadRecord.id}
									/>
								</div>
							) : null}
							{activePendingSkillDraft ? (
								<div className="mb-3">
									<RovoAppHermesSkillDraftBar
										activeIndex={activePendingSkillDraftIndex}
										draft={activePendingSkillDraft}
										draftDetail={activePendingSkillDraftDetail}
										isSubmitting={submittingSkillDraftId === activePendingSkillDraft.id}
										onApprove={handleHermesSkillDraftApprove}
										onOpenReview={handleOpenHermesSkillDraftReview}
										onReject={handleHermesSkillDraftReject}
										onSelectIndex={setActivePendingSkillDraftIndex}
										totalDrafts={pendingThreadSkillDrafts.length}
									/>
								</div>
							) : null}
							<motion.div
								initial={showHomeState && !shouldReduceMotion ? { opacity: 0, y: 20 } : false}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.4, ease: [0, 0.4, 0, 1], delay: 0.2 }}
								style={{ willChange: "transform, opacity" }}
							>
								{autoSelectedHermesSkills.length > 0 || pendingThreadSkillDrafts.length > 0 ? (
									<div className="mb-3">
										<Card size="sm">
											<CardHeader className="pb-2">
												<CardTitle>Hermes turn state</CardTitle>
												<CardDescription>Server-resolved skills and Hermes draft-review state for this thread.</CardDescription>
											</CardHeader>
											<CardContent className="space-y-3">
												{autoSelectedHermesSkills.length > 0 ? (
													<div className="space-y-2">
														<div className="text-xs font-medium uppercase tracking-wide text-text-subtlest">Auto-loaded on the last turn</div>
														<div className="flex flex-wrap gap-2">
															{autoSelectedHermesSkills.map((skill) => (
																<Badge key={skill.id} variant="neutral">
																	{skill.title}
																</Badge>
															))}
														</div>
													</div>
												) : null}
												{pendingThreadSkillDrafts.length > 0 ? (
													<div className="space-y-2">
														<div className="text-xs font-medium uppercase tracking-wide text-text-subtlest">Pending inline review</div>
														<div className="text-sm text-text-subtle">
															{pendingThreadSkillDrafts.length} draft{pendingThreadSkillDrafts.length === 1 ? "" : "s"} waiting for approval in this thread.
														</div>
													</div>
												) : null}
											</CardContent>
										</Card>
									</div>
								) : null}
								<RovoAppComposer
									key={chat.runtimeThreadId}
									artifactTitle={workspaceDocument?.title ?? null}
									availableHermesSkills={availableHermesSkills}
									autoFocus={!embedded}
									backgroundArtifactLabel={chat.backgroundArtifactLabel}
									composerStatus={chat.composerStatus}
									compact={isArtifactOpen || shouldShowAgentConfigPane}
									errorMessage={chat.inputError}
									galleryExpanded={galleryExpanded}
									isPlanMode={chat.isPlanMode}
									micStream={realtime.micStream}
									onDismissArtifactContext={handleCloseArtifactPane}
									onDismissPlanExecutionTracker={chat.dismissPlanExecutionTracker}
									onRemoveHermesSkill={selectHermesSkill}
									onSelectHermesSkill={selectHermesSkill}
									onStop={handleStop}
									onRemoveQueuedPrompt={chat.removeQueuedPrompt}
									onSubmit={handleComposerSubmit}
									onTogglePlanMode={chat.togglePlanMode}
									onToggleRealtimeVoice={handleToggleRealtimeVoice}
									onToggleClicky={handleToggleClicky}
									clickyActive={isClickyActive}
									onToggleVoice={handleToggleVoice}
									placeholder={composerPreviewState.placeholder}
									prefillText={voiceTranscript ?? prefillText}
									previewPrompt={composerPreviewState.activePreviewPrompt}
									planExecutionTracker={chat.planExecutionTracker}
									queuedPrompts={chat.queuedPrompts}
									realtimeGenerationState={realtime.generationState}
									realtimeOutputWaveformBars={realtime.outputWaveformBars}
									realtimeVoiceActive={isRealtimeActive}
									realtimeVoiceState={realtime.voiceState}
									selectedHermesSkills={selectedHermesSkills.map((skill) => ({
										id: skill.id,
										title: skill.title,
									}))}
									renderResponseGradient={(props) => <SmoothGradientWaveform {...props} />}
									showBackgroundStop={chat.hasBackgroundDelegation}
									voiceState={voiceButtonState}
								/>
							</motion.div>
							{!showHomeState ? <Footer className="relative z-10" /> : null}
						</>
					)}
				</div>
			</div>
		</>
	);

	const chatPaneContainer = (
		<div className="overscroll-behavior-contain relative z-10 flex h-full min-w-0 flex-1 flex-col touch-pan-y bg-background">
			{shouldShowAgentConfigPane && activeSessionAgentEntry ? (
				<div
					className="absolute left-3 top-3 z-20 hidden items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 text-xs md:flex"
					data-testid="chat-agent-testing-chrome"
				>
					<Badge
						variant={
							activeSessionAgentEntry.publishStatus === "published"
								? "success"
								: "primary"
						}
					>
						{activeSessionAgentEntry.publishStatus === "published"
							? "Published"
							: "Testing"}
					</Badge>
					<span className="max-w-[180px] truncate text-text-subtle">
						{activeSessionAgentEntry.profile.name}
					</span>
				</div>
			) : null}
			{shouldShowTimelineNavigator ? (
				<ChatTimelineNavigator
					activeItemId={activeTimelineMessageId}
					className="absolute right-3 top-5 z-20 hidden md:block"
					items={timelineItems}
					onSelectItem={(messageId) => {
						handleScrollActiveTimelineChange(messageId);
						setScrollAnchorMessageId(messageId);
						setScrollFollowMode("target");
					}}
				/>
			) : null}
			{showHomeState && !shouldSplitArtifactPane ? <div className="min-h-[40px] flex-1 shrink" /> : null}
			{chatPane}
			{showHomeState && !shouldSplitArtifactPane ? (
				<>
					<div className="flex-1 shrink" />
					<Footer className="shrink-0" />
				</>
			) : null}
		</div>
	);

	return (
			<SidebarProvider className={cn(embedded ? "h-full" : "h-svh", "overflow-hidden")} defaultOpen={!embedded} onOpenChange={chat.setSidebarOpen} open={chat.sidebarOpen} style={rovoAppSidebarStyle}>
			<RovoAppSidebar
				activeThreadId={chat.activeThreadId}
				agentCreationThreads={studioAgentCreationThreads}
				hoverOpen={isHoverOpen}
				isResizing={sidebarResize.isResizing}
				onCancelThreadRun={async (threadId) => {
					await chat.cancelThreadRun(threadId);
				}}
				onDeleteThread={async (threadId) => {
					startTransition(() => {
						void chat.deleteThread(threadId);
					});
				}}
				onNewChat={() => {
					setOptimisticUserMessage(null);
					startTransition(() => {
						void chat.openNewChat();
					});
				}}
				onSelectAgent={handleStudioSidebarAgentSelect}
				onSelectThread={async (threadId) => {
					setOptimisticUserMessage(null);
					startTransition(async () => {
						await chat.loadThread(threadId);
						if (embedded) {
							return;
						}
						window.history.pushState(null, "", buildRovoAppThreadPath(threadId));
					});
				}}
				onSidebarMouseEnter={handleSidebarContentMouseEnter}
				onSidebarMouseLeave={handleSidebarContentMouseLeave}
				onViewAllAgents={() => setIsSidebarAgentBrowserOpen(true)}
				resizeHandle={
					<SidebarResizeHandle
						data-active={sidebarResize.isResizing ? "" : undefined}
						data-will-collapse={sidebarResize.willCollapse ? "" : undefined}
						onDoubleClick={sidebarResize.onResizeHandleDoubleClick}
						onPointerDown={sidebarResize.onResizeHandlePointerDown}
						onPointerEnter={sidebarResize.onResizeHandlePointerEnter}
						onPointerLeave={sidebarResize.onResizeHandlePointerLeave}
					/>
				}
				selectedAgentId={studioAgentRegistry.selectedAgentId}
				sessionAgentEntries={studioAgentRegistry.sessionAgentEntries}
				threads={chat.threads}
				threadsLoaded={chat.threadsLoaded}
				topOffset={!embedded}
			/>
			<AgentsDirectoryDialog
				open={isSidebarAgentBrowserOpen}
				onOpenChange={setIsSidebarAgentBrowserOpen}
				agents={ROVO_AGENT_PROFILES}
				onSelectAgent={handleSidebarBrowseAgentSelect}
				sessionAgents={studioAgentRegistry.sessionAgentEntries.map((entry) => entry.profile)}
			/>

			{!embedded ? (
				<div
					className={cn(
						"fixed top-0 left-0 z-50 flex h-12 items-center px-3 transition-[width,border-color] duration-medium ease-in-out",
						sidebarResize.isResizing && "transition-none",
						chat.sidebarOpen
							? cn(
									"w-(--sidebar-width) overflow-x-clip border-r",
									// Match resize-handle hover/active (blue). Do not use
									// `border-border-warning` here — it reads as orange/red in the
									// chrome; collapse intent stays on the handle (`data-will-collapse`).
									sidebarResize.isResizing || sidebarResize.isResizeHandleHovered ? "border-border-selected" : "border-border",
								)
							: "w-40 border-b border-border",
					)}
					style={{ backgroundColor: token("elevation.surface"), viewTransitionName: "persistent-sidebar" as never }}
				>
					<LeftNavigation
						product="studio"
						windowWidth={nav.windowWidth}
						isVisible={nav.isVisible}
						isAppSwitcherOpen={nav.isAppSwitcherOpen}
						isSidebarResizing={sidebarResize.isResizing}
						hideAppSwitcher
						separatorLineOffsetPx={sidebarResize.sidebarWidth - TOP_NAV_PADDING_PX}
						onToggleSidebar={nav.toggleSidebar}
						onToggleAppSwitcher={nav.handleToggleAppSwitcher}
						onCloseAppSwitcher={nav.handleCloseAppSwitcher}
						onNavigate={(path) => nav.handleNavigate(path === "/" ? "/studio" : path)}
						onHoverEnter={handleSidebarHoverEnter}
						onHoverLeave={handleSidebarHoverLeave}
					/>
				</div>
			) : null}

			<div className="flex min-h-0 min-w-0 flex-1 flex-col">
				{!embedded ? (
					<div
						className={cn("flex h-12 shrink-0 items-center border-b px-3 transition-[padding] duration-medium ease-in-out", !chat.sidebarOpen && "pl-44")}
						style={{
							borderColor: token("color.border"),
							backgroundColor: token("elevation.surface"),
							viewTransitionName: "persistent-header" as never,
						}}
					>
						<div className="relative flex min-w-0 flex-1 items-center justify-start gap-2">
							<div ref={nav.searchContainerRef} className="relative flex h-9 w-full max-w-[680px] items-center">
								<InputGroup
									className={cn(
										"h-7 rounded-md bg-bg-input shadow-none transition-[height,background-color,box-shadow] duration-medium ease-out hover:bg-bg-input-hovered",
										"has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0",
										nav.isSearchFocused && "h-9",
										nav.isSearchFocused && "relative z-[1001]",
									)}
									style={
										nav.isSearchFocused
											? {
													backgroundColor: token("elevation.surface.overlay"),
													boxShadow: token("elevation.shadow.overlay"),
												}
											: undefined
									}
								>
									<InputGroupAddon align="inline-start">
										<span className="size-4 shrink-0 text-icon-subtle">
											<SearchIcon label="" spacing="none" />
										</span>
									</InputGroupAddon>
									<InputGroupInput
										type="search"
										aria-label="Search"
										value={nav.searchValue}
										onChange={(event) => nav.setSearchValue(event.currentTarget.value)}
										onFocus={nav.handleFocusSearch}
										onKeyDown={nav.handleSearchKeyDown}
										placeholder="Search"
										className="h-full text-sm placeholder:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
									/>
								</InputGroup>
								<SearchSuggestionsPanel
									anchorRef={nav.searchContainerRef}
									isVisible={nav.isSearchFocused}
									onSearchAllApps={nav.handleSearchAllApps}
									onRecentItemClick={nav.handleRecentItemClick}
									onRecentSearchClick={nav.handleRecentSearchClick}
									panelRef={nav.searchPanelRef}
								/>
							</div>

							<CreateButton windowWidth={nav.windowWidth} />
						</div>
						<RightNavigation product="studio" windowWidth={nav.windowWidth} onToggleChat={nav.toggleChat} onToggleTheme={nav.toggleTheme} />
					</div>
				) : null}
				{shouldShowChatHeader ? (
					<RovoAppHeader
						artifactMenuItems={artifactMenuItems}
						isArtifactOpen={isArtifactOpen}
						onNewChat={() => {
							setOptimisticUserMessage(null);
							void chat.openNewChat();
						}}
						onOpenDocument={(documentId) => void chat.openDocument(documentId)}
					/>
				) : null}
				<main ref={shellRef} className="relative flex min-h-0 min-w-0 flex-1 bg-background px-3 text-foreground">
					<RovoAppShellPaneLayout
						agentConfigPane={agentConfigPane}
						agentConfigPanelId={ROVO_APP_SPLIT_AGENT_CONFIG_PANEL_ID}
						agentConfigCompact={
							shouldShowAgentConfigPane && isAgentConfigOverlayActive
								? {
									activeTab: agentConfigCompactTab,
									onChangeTab: setAgentConfigCompactTab,
								}
								: undefined
						}
						artifactOrigin={artifactOrigin}
						artifactPane={artifactPane}
						artifactPanelId={ROVO_APP_SPLIT_ARTIFACT_PANEL_ID}
						chatPane={chatPaneContainer}
						chatPanelId={ROVO_APP_SPLIT_CHAT_PANEL_ID}
						minArtifactPaneWidth={ROVO_APP_MIN_ARTIFACT_PANE_WIDTH}
						minChatPaneWidth={ROVO_APP_MIN_CHAT_PANE_WIDTH}
						onArtifactSplitLayoutChanged={handleArtifactSplitLayoutChanged}
						shouldShowAgentConfigPane={shouldShowAgentConfigPane}
						shouldSplitArtifactPane={shouldSplitArtifactPane}
						shellSize={shellSize}
						splitArtifactPaneDefaultSize={splitArtifactPaneDefaultSize}
						splitChatPaneDefaultSize={splitChatPaneDefaultSize}
						splitChatPaneMaxSize={splitChatPaneMaxSize}
					/>
				</main>
			</div>
			<ClickyOverlay
				state={clicky.state}
				pointTarget={clicky.pointTarget}
				responseText={clicky.responseText}
				history={clicky.history}
				screenshotDimensions={clickyScreenshotDimensions}
				onReturnToIdle={clickyReturnToIdle}
			/>
		</SidebarProvider>
	);
}
