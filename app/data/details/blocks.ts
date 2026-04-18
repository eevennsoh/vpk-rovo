import type { ComponentDetail } from "@/app/data/component-detail-types";

export const BLOCK_DETAILS: Record<string, ComponentDetail> = {
	"mermaid-diagram": {
		description: "Dedicated Mermaid diagram block rendered through Streamdown’s Mermaid plugin so fenced mermaid content becomes an interactive SVG diagram instead of a plain code block.",
		usage: `import MermaidDiagram from "@/components/blocks/mermaid-diagram/page";

<MermaidDiagram />`,
	},
	cursor: {
		description: "AI-powered IDE layout with a file tree sidebar, syntax-highlighted code editor, integrated terminal, and an AI chat panel featuring plans, task queues, message streaming, and checkpoints.",
	},
	"agent-progress": {
		description: "ADS-style agent progress tracker with expandable task status groups, live elapsed timer, and agent attribution.",
		usage: `import AgentsProgress from "@/components/blocks/agent-progress/page";

<AgentsProgress />
<AgentsProgress runStatus="completed" defaultCollapsed />
<AgentsProgress runStatus="failed" />`,
		props: [
			{
				name: "planTitle",
				type: "string",
				default: '"Flexible Friday Plan"',
				description: "Title displayed in the progress header.",
			},
			{
				name: "planVisualIdentity",
				type: '{ iconName: string; tileVariant: "gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" }',
				description: "Icon tile identity shown in the progress header.",
			},
			{
				name: "taskStatusGroups",
				type: "ProgressStatusGroups",
				description: "Object with done, inReview, inProgress, failed, and todo task arrays.",
			},
			{
				name: "runStatus",
				type: '"running" | "completed" | "failed"',
				default: '"running"',
				description: "Current execution status of the run.",
			},
			{
				name: "runCreatedAt",
				type: "string | null",
				description: "ISO timestamp when the run started. Used for elapsed time calculation.",
			},
			{
				name: "runCompletedAt",
				type: "string | null",
				description: "ISO timestamp when the run finished. Stops the elapsed timer.",
			},
			{
				name: "runCount",
				type: "number",
				default: "1",
				description: "Number of runs displayed in the status bar.",
			},
			{
				name: "agentCount",
				type: "number",
				default: "10",
				description: "Number of agents shown in the running status text.",
			},
			{
				name: "defaultCollapsed",
				type: "boolean",
				default: "false",
				description: "When true, hides the task list and status bar, showing only the header.",
			},
		],
		examples: [
			{ title: "Running", description: "Default running state with mixed task progress.", demoSlug: "agent-progress-demo-running" },
			{ title: "Completed", description: "Completed run with all tasks done.", demoSlug: "agent-progress-demo-completed" },
			{ title: "Failed", description: "Failed run with remaining tasks.", demoSlug: "agent-progress-demo-failed" },
			{ title: "Collapsed", description: "Compact header-only view for completed runs.", demoSlug: "agent-progress-demo-collapsed" },
			{ title: "Collapsed (running)", description: "Compact header-only view while still running.", demoSlug: "agent-progress-demo-collapsed-running" },
			{ title: "With agents", description: "Tasks with agent attribution badges.", demoSlug: "agent-progress-demo-with-agents" },
			{ title: "Early progress", description: "Run just started with mostly todo tasks.", demoSlug: "agent-progress-demo-early-progress" },
			{ title: "Multiple runs", description: "Progress tracker showing multiple run count.", demoSlug: "agent-progress-demo-multiple-runs" },
			{ title: "All states", description: "Running, completed, and failed states side by side.", demoSlug: "agent-progress-demo-all-states" },
		],
	},
	"task-progress": {
		description: "ADS-style agent progress tracker with expandable task status groups, live elapsed timer, and agent attribution.",
		usage: `import TaskProgress from "@/components/blocks/task-progress/page";

<TaskProgress />
<TaskProgress runStatus="completed" defaultCollapsed />
<TaskProgress runStatus="failed" />`,
		props: [
			{
				name: "planTitle",
				type: "string",
				default: '"Flexible Friday Plan"',
				description: "Title displayed in the progress header.",
			},
			{
				name: "planVisualIdentity",
				type: '{ iconName: string; tileVariant: "gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" }',
				description: "Icon tile identity shown in the progress header.",
			},
			{
				name: "taskStatusGroups",
				type: "ProgressStatusGroups",
				description: "Object with done, inReview, inProgress, failed, and todo task arrays.",
			},
			{
				name: "runStatus",
				type: '"running" | "completed" | "failed"',
				default: '"running"',
				description: "Current execution status of the run.",
			},
			{
				name: "runCreatedAt",
				type: "string | null",
				description: "ISO timestamp when the run started. Used for elapsed time calculation.",
			},
			{
				name: "runCompletedAt",
				type: "string | null",
				description: "ISO timestamp when the run finished. Stops the elapsed timer.",
			},
			{
				name: "runCount",
				type: "number",
				default: "1",
				description: "Number of runs displayed in the status bar.",
			},
			{
				name: "agentCount",
				type: "number",
				default: "10",
				description: "Number of agents shown in the running status text.",
			},
			{
				name: "defaultCollapsed",
				type: "boolean",
				default: "false",
				description: "When true, hides the task list and status bar, showing only the header.",
			},
		],
		examples: [
			{ title: "Running", description: "Default running state with mixed task progress.", demoSlug: "task-progress-demo-running" },
			{ title: "Completed", description: "Completed run with all tasks done.", demoSlug: "task-progress-demo-completed" },
			{ title: "Failed", description: "Failed run with remaining tasks.", demoSlug: "task-progress-demo-failed" },
			{ title: "Collapsed", description: "Compact header-only view for completed runs.", demoSlug: "task-progress-demo-collapsed" },
			{ title: "Collapsed (running)", description: "Compact header-only view while still running.", demoSlug: "task-progress-demo-collapsed-running" },
			{ title: "With agents", description: "Tasks with agent attribution badges.", demoSlug: "task-progress-demo-with-agents" },
			{ title: "Early progress", description: "Run just started with mostly todo tasks.", demoSlug: "task-progress-demo-early-progress" },
			{ title: "Multiple runs", description: "Progress tracker showing multiple run count.", demoSlug: "task-progress-demo-multiple-runs" },
			{ title: "All states", description: "Running, completed, and failed states side by side.", demoSlug: "task-progress-demo-all-states" },
		],
	},
	"app-sidebar": {
		description: "Application sidebar with main navigation, documents, secondary nav, and user menu.",
	},
	"answer-card": {
		description: "Displays captured question/answer pairs as a compact summary card. Typically rendered after a user submits answers to a QuestionCard.",
		demoLayout: { previewHeight: "default" },
		usage: `import { AnswerCard } from "@/components/blocks/answer-card/page";
import type { AnswerCardRow } from "@/components/blocks/answer-card/page";

const rows: AnswerCardRow[] = [
  { question: "What type of data?", answer: "Product metrics" },
  { question: "Which chart types?", answer: "Line and bar" },
];

<AnswerCard rows={rows} />
<AnswerCard label="Your answers" rows={rows} />`,
		props: [
			{
				name: "rows",
				type: "ReadonlyArray<AnswerCardRow>",
				required: true,
				description: "Ordered list of question/answer pairs to display.",
			},
			{
				name: "label",
				type: "string",
				default: '"Your answers"',
				description: "Header label displayed in the card header.",
			},
			{
				name: "defaultCollapsed",
				type: "boolean",
				default: "false",
				description: "Whether the card starts in a collapsed state.",
			},
		],
	},
	dashboard: {
		description: "A full dashboard layout with sidebar navigation, charts, and data tables.",
	},
	"sidebar-01": {
		description: "Basic sidebar navigation layout.",
	},
	"sidebar-02": {
		description: "Sidebar with grouped navigation items and icons.",
	},
	"sidebar-03": {
		description: "Collapsible sidebar with toggle control.",
	},
	"sidebar-04": {
		description: "Sidebar with floating variant and rounded styling.",
	},
	"sidebar-05": {
		description: "Sidebar with secondary navigation rail.",
	},
	"sidebar-06": {
		description: "Sidebar with nested sub-navigation items.",
	},
	"sidebar-07": {
		description: "Sidebar with icon-only collapsed state.",
	},
	"sidebar-08": {
		description: "Sidebar with inset content area layout.",
	},
	"sidebar-09": {
		description: "Sidebar with controlled open/close state.",
	},
	"sidebar-10": {
		description: "Sidebar with header, search, and footer sections.",
	},
	"sidebar-11": {
		description: "Sidebar with collapsible grouped sections.",
	},
	"sidebar-12": {
		description: "Sidebar with user avatar and account switcher.",
	},
	"sidebar-13": {
		description: "Sidebar with right-aligned secondary panel.",
	},
	"sidebar-14": {
		description: "Sidebar with tabbed content sections.",
	},
	"sidebar-15": {
		description: "Sidebar with notification badges and indicators.",
	},
	"sidebar-16": {
		description: "Sidebar with drag-and-drop reorderable items.",
	},
	"login-01": {
		description: "Simple centered login form with email and password.",
	},
	"login-02": {
		description: "Login form with social authentication providers.",
	},
	"login-03": {
		description: "Split-screen login with illustration panel.",
	},
	"login-04": {
		description: "Login form embedded within a card layout.",
	},
	"login-05": {
		description: "Login form with two-column responsive layout.",
	},
	chatgpt: {
		description: "ChatGPT-style prompt form with model selector, group chat dialog, and project creation.",
	},
	"chat-timeline": {
		description: "Chat transcript with a floating prompt navigator that previews earlier user messages and jumps to them in place.",
		usage: `import ChatTimeline, { type ChatTimelineMessage } from "@/components/blocks/chat-timeline/page";

const messages: ChatTimelineMessage[] = [
  { id: "u1", role: "user", timestamp: "9:14 AM", text: "Can you summarize the handoff?" },
  { id: "a1", role: "assistant", timestamp: "9:15 AM", text: "Here is the condensed handoff..." },
];

<ChatTimeline messages={messages} />`,
		props: [
			{
				name: "messages",
				type: "ReadonlyArray<ChatTimelineMessage>",
				default: "CHAT_TIMELINE_DEMO_MESSAGES",
				description: "Ordered transcript used for the message thread and navigator snippets.",
			},
			{
				name: "className",
				type: "string",
				description: "Optional className applied to the outer block container.",
			},
		],
	},
	"terminal-switch": {
		description: "A switchable interface that toggles between Rovo Chat and a RovoDev CLI terminal, demonstrating dual-mode AI interaction.",
	},
	"data-table": {
		description: "Data table with sortable columns, status indicators, and reviewer assignments.",
	},
	"generative-card": {
		description:
			"A collapsible AI result card for generated artifacts, with branded source media, summary metadata, preview content, dense collapsed companions, and footer actions.",
		usage: `import {
  GenerativeCard,
  GenerativeCardHeader,
  GenerativeCardBody,
  GenerativeCardContent,
  GenerativeCardFooter,
} from "@/components/blocks/generative-card";
import { Tile } from "@/components/ui/tile";
import { Button } from "@/components/ui/button";
import { SheetIcon } from "@/components/ui/vpk-icons";

<GenerativeCard className="max-w-[420px]">
  <GenerativeCardHeader
    title="Apple Inc.: A Comprehensive Overview"
    description="Created sheet"
    leading={(
      <Tile label="Sheet" size="medium" variant="greenSubtle">
        <SheetIcon className="size-4" />
      </Tile>
    )}
  />
  <GenerativeCardBody>
    <GenerativeCardContent>
      <div className="rounded-md bg-surface p-4">Artifact preview</div>
    </GenerativeCardContent>
    <GenerativeCardFooter>
      <Button variant="outline">Open sheet</Button>
    </GenerativeCardFooter>
  </GenerativeCardBody>
</GenerativeCard>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "defaultExpanded",
				type: "boolean",
				default: "true",
				description: "Initial expanded state when used uncontrolled.",
			},
			{
				name: "expanded",
				type: "boolean",
				description: "Controlled expanded state.",
			},
			{
				name: "onExpandedChange",
				type: "(expanded: boolean) => void",
				description: "Callback fired when expand/collapse state changes.",
			},
			{
				name: "animate",
				type: "boolean",
				default: "false",
				description: "When true, plays a one-shot WebGL bulge distortion entrance animation with Rovo color fringe glow and shimmer border.",
			},
			{
				name: "animateDuration",
				type: "number",
				default: "2000",
				description: "Duration of the entrance animation in milliseconds.",
			},
			{
				name: "animateDistortionScale",
				type: "number",
				default: "100",
				description: "Maximum WebGL displacement scale used by the sweep effect. Increase for a stronger distortion.",
			},
			{
				name: "animateBlur",
				type: "number",
				default: "8",
				description: "Maximum blur amount applied inside the moving distortion band.",
			},
			{
				name: "animateRadius",
				type: "number",
				default: "0.4",
				description: "Distortion radius mapped to moving band height (0-1). Higher values distort a thicker region.",
			},
			{
				name: "animateSpeed",
				type: "number",
				default: "1.35",
				description: "Sweep playback speed multiplier. Higher values move the distortion band from top to bottom faster.",
			},
			{
				name: "animateScaleSmoothing",
				type: "number",
				default: "0.5",
				description: "Smoothing factor (0-1) for displacement scale changes. Higher values react faster.",
			},
			{
				name: "animateSweepSmoothing",
				type: "number",
				default: "0.5",
				description: "Smoothing factor (0-1) for vertical sweep movement. Higher values react faster.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the card root.",
			},
			{
				name: "borderEffect",
				type: '"shimmer" | "trace" | false',
				default: "false",
				description: "Border effect style: \"shimmer\" fills the border uniformly, \"trace\" shows a concentrated arc comet traveling the perimeter with an interior mesh gradient glow.",
			},
			{
				name: "borderEffectDuration",
				type: "number",
				description: "Duration of the border effect cycle in milliseconds. Defaults to 1750 for shimmer, 2400 for trace.",
			},
			{
				name: "borderEffectArcWidth",
				type: "number",
				default: "90",
				description: "Trace only — angular width of the visible arc in degrees.",
			},
		],
		subComponents: [
			{ name: "GenerativeCardHeader", description: "Header row with leading media, title, description, optional action, and built-in collapse toggle." },
			{ name: "GenerativeCardBody", description: "Animated collapsible container for card details." },
			{ name: "GenerativeCardContent", description: "Body content section with default paddings for previews." },
			{ name: "GenerativeCardPreview", description: "Preview placeholder surface for generated output." },
			{ name: "GenerativeCardFooter", description: "Footer actions row aligned to the end. Accepts an optional `action` prop for a primary action button." },
		],
		examples: [
			{ title: "Artifact preview", description: "Expanded inline artifact card with a content excerpt and explicit open CTA.", demoSlug: "generative-card-demo-artifact" },
			{ title: "Artifact collapsed", description: "Dense collapsed companion state for the same artifact card, with a header CTA and expandable body.", demoSlug: "generative-card-demo-artifact-collapsed" },
			{ title: "3P source", description: "Generative card with third-party source branding.", demoSlug: "generative-card-demo-3p" },
			{ title: "Atlassian source", description: "Generative card with Atlassian product branding.", demoSlug: "generative-card-demo-1p" },
			{ title: "Icon source", description: "Generative card with a semantic icon tile source.", demoSlug: "generative-card-demo-icon" },
			{ title: "With action", description: "Footer with a primary action button (e.g. Send) alongside the preview button.", demoSlug: "generative-card-demo-action" },
			{ title: "Distortion effect", description: "One-shot WebGL bulge distortion entrance with Rovo color fringe glow and shimmer border.", demoSlug: "generative-card-demo-animated" },
			{ title: "Border trace", description: "One-shot gradient comet tracing the card perimeter with a smooth fade-out and replay control.", demoSlug: "generative-card-demo-trace" },
			{ title: "Inner glow", description: "Contained CSS mesh-like inner edge glow without the border trace effect.", demoSlug: "generative-card-demo-inner-glow" },
		],
	},
	"top-navigation": {
		description: "ADS-inspired top navigation bar with app switcher and contextual actions.",
	},
	"chat-gallery": {
		description: "Standalone clone of the prompt gallery block for separate chat-focused iteration with quick chips, hover previews, and discover-more examples.",
	},
	"prompt-gallery": {
		description: "ADS prompt gallery block with quick chips, hover previews, and discover-more examples.",
	},
	"chat-configuration": {
		description: "Chat configuration panel with reasoning mode selection and data source toggles for web results and company knowledge.",
	},
	"settings-dialog": {
		description: "Settings dialog with configurable options and preferences.",
	},
	"product-sidebar": {
		description: "ADS-style product sidebar with Jira and Confluence navigation variants.",
	},
	"sidebar-rail": {
		description: "Pinned/hover sidebar rail block with header controls and responsive sidebar reveal behavior.",
	},
	"signup-01": {
		description: "Simple centered signup form with name, email, and password.",
	},
	"signup-02": {
		description: "Two-column signup with cover image and split layout.",
	},
	"signup-03": {
		description: "Signup form with social authentication providers on muted background.",
	},
	"signup-04": {
		description: "Signup form embedded within a card with image panel.",
	},
	"signup-05": {
		description: "Signup form with two-column social providers and branding.",
	},
	"work-item-widget": {
		description: "Embeddable ADS work-items widget with status rows and insert actions.",
	},
	"work-item-detail": {
		description: "Comprehensive work item detail view with description, comments, linked items, and activity history.",
	},
	"visual-waveform": {
		description: "Standalone Rovo App live-voice demo using the exact composer, gradient waveform, and GPT Realtime hook without the thread-persistence backend dependency.",
		importStatement: `import VisualWaveform from "@/components/blocks/visual-waveform/page";`,
		usage: `import VisualWaveform from "@/components/blocks/visual-waveform/page";

<VisualWaveform />`,
		demoLayout: { previewHeight: "default" },
	},
	"question-card": {
		description: "ADS-style question card with single-select (numbered) and multi-select (checkbox) options, keyboard navigation, question pagination, and free-form custom input.",
		usage: `import { QuestionCard } from "@/components/blocks/question-card/page";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/page";

const questions: QuestionCardQuestion[] = [
  {
    id: "deploy",
    label: "Which deployment strategy?",
    kind: "single-select",
    options: [
      { id: "blue-green", label: "Blue-green" },
      { id: "staged-rollout", label: "Staged rollout" },
    ],
  },
];

<QuestionCard
  questions={questions}
  onSubmit={(answers) => console.log(answers)}
  onDismiss={() => {}}
/>`,
		props: [
			{
				name: "questions",
				type: "ReadonlyArray<QuestionCardQuestion>",
				required: true,
				description: "Ordered list of questions to present. Each question defines its selection mode via the kind field.",
			},
			{
				name: "onSubmit",
				type: "(answers: QuestionCardAnswers) => void",
				required: true,
				description: "Called with the collected answers when the user completes all questions or clicks Submit.",
			},
			{
				name: "onDismiss",
				type: "() => void",
				description: "Called when the user dismisses the card. When omitted the dismiss button is hidden.",
			},
			{
				name: "isSubmitting",
				type: "boolean",
				default: "false",
				description: "Disables all interactions and shows a loading state on the submit button.",
			},
			{
				name: "maxVisibleOptions",
				type: "number",
				default: "4",
				description: "Maximum number of pre-defined options to show per question. Additional options are truncated.",
			},
			{
				name: "customInputPlaceholder",
				type: "string",
				default: '"Tell Rovo what to do..."',
				description: "Placeholder text for the free-form custom input row.",
			},
			{
				name: "showCustomInput",
				type: "boolean",
				default: "true",
				description: "Whether to show the free-form custom input row after the option list.",
			},
			{
				name: "defaultAnswers",
				type: "QuestionCardAnswers",
				default: "{}",
				description: "Pre-populated answers keyed by question ID. Useful for restoring previous selections.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes merged onto the root container.",
			},
		],
		subComponents: [
			{
				name: "QuestionCardQuestion",
				description: "Shape of each question in the questions array.",
				props: [
					{ name: "id", type: "string", required: true, description: "Unique identifier for the question." },
					{ name: "label", type: "string", required: true, description: "Question text displayed as a heading." },
					{
						name: "kind",
						type: '"single-select" | "multi-select" | "text"',
						required: true,
						description: "Selection mode. single-select shows numbered options and auto-advances. multi-select shows checkboxes on the right and allows multiple picks.",
					},
					{ name: "options", type: "ReadonlyArray<QuestionCardOption>", required: true, description: "Pre-defined answer options." },
				],
			},
			{
				name: "QuestionCardOption",
				description: "Shape of each option within a question.",
				props: [
					{ name: "id", type: "string", required: true, description: "Unique identifier for the option." },
					{ name: "label", type: "string", required: true, description: "Display label for the option." },
					{ name: "description", type: "string", description: "Optional secondary description shown below the label." },
				],
			},
		],
		examples: [
			{ title: "Single-select", description: "Numbered options with auto-advance on selection.", demoSlug: "question-card-demo-single-select" },
			{ title: "Multi-select", description: "Checkbox indicators on the right allow multiple selections.", demoSlug: "question-card-demo-multi-select" },
			{ title: "Text only", description: "Single free-form text input with no pre-defined options.", demoSlug: "question-card-demo-text-only" },
			{ title: "Mixed flow", description: "Multi-question flow combining single-select and multi-select with pagination.", demoSlug: "question-card-demo-mixed" },
			{ title: "Without custom input", description: "Custom input row hidden via showCustomInput={false}.", demoSlug: "question-card-demo-no-custom-input" },
			{ title: "Custom placeholder", description: "Custom placeholder text for the free-form input.", demoSlug: "question-card-demo-custom-placeholder" },
			{ title: "Pre-populated answers", description: "Answers pre-selected via defaultAnswers prop.", demoSlug: "question-card-demo-pre-populated" },
		],
	},
	"approval-card": {
		description: "ADS-style approval card for plan acceptance with ranked options and a custom input.",
		demoLayout: { previewHeight: "default" },
	},
	"tool-approval": {
		description: "Approval surface that docks above the prompt input when an AI tool invocation needs explicit user approval before continuing.",
		importStatement: `import { ToolApproval } from "@/components/blocks/tool-approval";`,
		usage: `import { ToolApproval } from "@/components/blocks/tool-approval";
import type { ToolApprovalPayload } from "@/lib/rovo-ui-messages";

const toolApproval: ToolApprovalPayload = {
  approvalId: "approval-1",
  items: [
    {
      id: "edit-1",
      toolCallId: "call-edit",
      toolName: "find_and_replace_code",
      title: "Edit file",
      description: "Update the release notes draft before the run continues.",
      targetPath: "docs/release-notes/q2-launch.md",
      riskLevel: "medium",
      permissionScenario: "workspace-write",
    },
  ],
};

<ToolApproval
  toolApproval={toolApproval}
  onSubmit={(payload, decisions) => console.log(payload, decisions)}
/>`,
		props: [
			{
				name: "toolApproval",
				type: "ToolApprovalPayload",
				required: true,
				description: "Normalized approval payload describing the blocked tool call or batch of tool calls.",
			},
			{
				name: "onSubmit",
				type: "(toolApproval: ToolApprovalPayload, decisions: ToolApprovalSubmitDecision[]) => Promise<void> | void",
				required: true,
				description: "Called once every visible tool step has an explicit Approve or Deny decision.",
			},
			{
				name: "isSubmitting",
				type: "boolean",
				default: "false",
				description: "Locks the controls and shows the pending submission state.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes merged onto the root section wrapper.",
			},
		],
		subComponents: [
			{
				name: "ToolApprovalSubmitDecision",
				description: "Decision shape returned to onSubmit for each tool call in the batch.",
				props: [
					{ name: "toolCallId", type: "string", required: true, description: "The paused tool call being approved or denied." },
					{ name: "approved", type: "boolean", required: true, description: "Whether the tool call should resume." },
					{ name: "denyMessage", type: "string", description: "Optional deny message passed back when a tool is rejected." },
				],
			},
		],
		examples: [
			{ title: "Single tool", description: "Default composer dock with one blocked workspace edit above the prompt input.", demoSlug: "tool-approval" },
			{ title: "Batch review", description: "Sequentially review multiple tool invocations before the run continues.", demoSlug: "tool-approval-demo-batch" },
			{ title: "Submitting state", description: "Locked state while the approval submission is already in flight.", demoSlug: "tool-approval-demo-submitting" },
		],
		demoLayout: { previewHeight: "default" },
	},
	chatbot: {
		description: "Full-featured AI chatbot with conversation, messages, reasoning, suggestions, and model selector.",
	},
	ide: {
		description: "IDE-style coding agent with file tree, code editor, terminal, and AI chat panel with tool calls.",
	},
	"kanban-sprint": {
		description: "Sprint planning kanban board with drag-and-drop task cards, status columns, sprint metrics, and story point tracking.",
	},
	generative: {
		description: "v0-style generative UI with prompt input, artifact container, and preview/code toggle.",
	},
	workflow: {
		description: "Multi-step agentic workflow with agent configuration, plan rendering, tool calls, and confirmation dialogs.",
	},
};
