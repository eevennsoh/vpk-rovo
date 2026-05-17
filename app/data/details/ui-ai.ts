import type { ComponentDetail } from "@/app/data/component-detail-types";

export const UI_AI_DETAILS: Record<string, ComponentDetail> = {
	"audio-player": {
		description:
			"A composable audio player built on media-chrome with play/pause, seek, time display, and volume controls. Supports remote URLs and AI SDK SpeechResult base64 audio.",
		usage: `import {
  AudioPlayer,
  AudioPlayerElement,
  AudioPlayerControlBar,
  AudioPlayerPlayButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerDurationDisplay,
  AudioPlayerMuteButton,
  AudioPlayerVolumeRange,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
} from "@/components/ui-ai/audio-player";

<AudioPlayer>
  <AudioPlayerElement src="/audio/sample.mp3" />
  <AudioPlayerControlBar>
    <AudioPlayerPlayButton />
    <AudioPlayerTimeDisplay />
    <AudioPlayerTimeRange />
    <AudioPlayerDurationDisplay />
  </AudioPlayerControlBar>
</AudioPlayer>`,
		props: [
			{
				name: "src",
				type: "string",
				description: "Remote audio URL passed to AudioPlayerElement.",
			},
			{
				name: "data",
				type: "SpeechResult[\"audio\"]",
				description: "AI SDK SpeechResult audio object with base64 and mediaType fields, passed to AudioPlayerElement.",
			},
			{
				name: "seekOffset",
				type: "number",
				default: "10",
				description: "Seconds to skip on seek backward/forward buttons.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to any sub-component.",
			},
		],
		subComponents: [
			{ name: "AudioPlayer", description: "Root MediaController wrapper for audio playback with theme variables." },
			{ name: "AudioPlayerElement", description: "Audio source element supporting remote URLs (src) or AI SDK SpeechResult data (base64)." },
			{ name: "AudioPlayerControlBar", description: "Control bar container that wraps child controls in a ButtonGroup." },
			{ name: "AudioPlayerPlayButton", description: "Play/pause toggle button." },
			{ name: "AudioPlayerSeekBackwardButton", description: "Rewind button (default: 10 seconds)." },
			{ name: "AudioPlayerSeekForwardButton", description: "Fast-forward button (default: 10 seconds)." },
			{ name: "AudioPlayerTimeDisplay", description: "Current playback position display." },
			{ name: "AudioPlayerDurationDisplay", description: "Total audio duration display." },
			{ name: "AudioPlayerTimeRange", description: "Seek slider for position control." },
			{ name: "AudioPlayerMuteButton", description: "Mute/unmute toggle button." },
			{ name: "AudioPlayerVolumeRange", description: "Volume level slider." },
		],
		examples: [
			{ title: "Full controls", description: "Audio player with seek, play/pause, time, duration, mute, and volume.", demoSlug: "audio-player-demo-full" },
			{ title: "Compact", description: "Minimal player with play, seek slider, and time display.", demoSlug: "audio-player-demo-compact" },
			{ title: "With volume", description: "Player with time range, duration, and volume controls.", demoSlug: "audio-player-demo-with-volume" },
		],
	},

	agent: {
		description:
			"A structured card for displaying AI agent configuration including name, model, instructions, tools, and output schema.",
		usage: `import {
  Agent,
  AgentHeader,
  AgentContent,
  AgentInstructions,
  AgentTools,
  AgentTool,
  AgentOutput,
} from "@/components/ui-ai/agent";

<Agent>
  <AgentHeader name="Sentiment Analyzer" model="anthropic/claude-sonnet-4-5" />
  <AgentContent>
    <AgentInstructions>
      Analyze text sentiment and return structured results.
    </AgentInstructions>
    <AgentTools multiple>
      <AgentTool tool={webSearch} value="web_search" />
    </AgentTools>
    <AgentOutput schema={outputSchema} />
  </AgentContent>
</Agent>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the outer container.",
			},
		],
		subComponents: [
			{ name: "AgentHeader", description: "Top bar with agent name, icon, and optional model badge." },
			{ name: "AgentContent", description: "Body container for instructions, tools, and output." },
			{ name: "AgentInstructions", description: "Instruction text block with label." },
			{ name: "AgentTools", description: "Accordion container for tool definitions." },
			{ name: "AgentTool", description: "Individual tool item with expandable JSON schema." },
			{ name: "AgentOutput", description: "Output schema display with syntax highlighting." },
		],
		examples: [
			{ title: "Full agent", description: "Agent card with instructions, tools, and output schema.", demoSlug: "agent-demo-full" },
			{ title: "With tools", description: "Agent card showing only the tools accordion.", demoSlug: "agent-demo-with-tools" },
			{ title: "With output", description: "Agent card with instructions and output schema, no tools.", demoSlug: "agent-demo-with-output" },
			{ title: "Minimal", description: "Header-only agent card with name and model badge.", demoSlug: "agent-demo-minimal" },
		],
	},

	"animated-dots": {
		description:
			"Animated colored dots with staggered opacity reveal, used as a loading or thinking indicator alongside text labels.",
		usage: `import { AnimatedDots } from "@/components/ui-ai/animated-dots";

<span className="inline-flex items-baseline text-sm">
  Thinking
  <AnimatedDots />
</span>`,
		props: [
			{
				name: "colors",
				type: "readonly string[]",
				default: '["#1868db", "#bf63f3", "#fca700"]',
				description: "Array of CSS color values for each dot.",
			},
			{
				name: "duration",
				type: "number",
				default: "1.2",
				description: "Animation cycle duration in seconds.",
			},
			{
				name: "staggerDelay",
				type: "number",
				default: "0.2",
				description: "Delay between each dot's animation start in seconds.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the wrapper span.",
			},
		],
		examples: [
			{ title: "Custom colors", description: "Dots with alternative color palettes.", demoSlug: "animated-dots-demo-custom-colors" },
			{ title: "Timing", description: "Fast, default, and slow animation speeds.", demoSlug: "animated-dots-demo-timing" },
			{ title: "Sizes", description: "Dots at various text sizes from xs to lg.", demoSlug: "animated-dots-demo-sizes" },
		],
	},

	"animated-rovo": {
		description:
			"An animated Rovo logo that combines floating, bouncing, dancing, and occasional spinning. Uses Motion for keyframe animation with configurable size, streaming mode, and transition controls.",
		demoLayout: { previewContentWidth: "full" },
		usage: `import { AnimatedRovo } from "@/components/ui-ai/animated-rovo";

<AnimatedRovo.Root size={32} />
<AnimatedRovo.Root size={64} streaming />
<AnimatedRovo.Root size={64} fullSpinProbability={0.7} danceDistancePercent={14} />
<AnimatedRovo.Root size={48} transition={{ type: "spring", duration: 1.5, bounce: 0.3 }} />
<AnimatedRovo.Shape size={48} transition={{ type: "tween", duration: 2, ease: "linear" }} />`,
		props: [
			{
				name: "size",
				type: "number",
				default: "32",
				description: "Width and height of the logo in pixels.",
			},
			{
				name: "streaming",
				type: "boolean",
				default: "false",
				description: "When true, outer pendulum/bounce/spin animations settle to rest while the inner color wheel keeps rotating.",
			},
			{
				name: "fullSpinProbability",
				type: "number",
				default: "0.35",
				description: "Probability from 0 to 1 that the next sporadic spin cycle will be a full 360-degree rotation.",
			},
			{
				name: "danceDistancePercent",
				type: "number",
				default: "8",
				description: "Vertical dance amplitude as a percentage of component size (clamped to 0-100).",
			},
			{
				name: "transition",
				type: "AnimatedRovoShapeTransition",
				description: "Transition config for the inner color-wheel rotation. Supports type (spring | tween), duration, ease (linear | easeInOut | circIn | circOut), and bounce (0\u20131, spring only).",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes applied to the wrapper.",
			},
		],
		examples: [
			{ title: "Interactive", description: "Control all AnimatedRovo props with GUI sliders and toggles.", demoSlug: "animated-rovo-demo" },
		],
	},

	"morphing-rovo": {
		description:
			"A morphing shape indicator that smoothly transitions between circle, square, triangle, and hexagon. Uses Motion's native path interpolation with compatible cubic bezier paths — no external shape-morphing library needed.",
		demoLayout: { previewContentWidth: "full" },
		usage: `import { MorphingRovo } from "@/components/ui-ai/morphing-rovo";

<MorphingRovo.Shape size={32} />
<MorphingRovo.Shape size={64} duration={0.8} rotationPerStep={180} />`,
		props: [
			{
				name: "size",
				type: "number",
				default: "32",
				description: "Width and height of the shape in pixels.",
			},
			{
				name: "duration",
				type: "number",
				default: "0.6",
				description: "Duration of each morph step in seconds.",
			},
			{
				name: "ease",
				type: "string",
				default: "backOut",
				description: "Easing function for each morph transition (e.g. backOut, easeInOut, circOut, linear).",
			},
			{
				name: "rotationPerStep",
				type: "number",
				default: "180",
				description: "Clockwise rotation in degrees applied during each morph step.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes applied to the wrapper.",
			},
		],
		examples: [
			{ title: "Interactive", description: "Control size, duration, easing, rotation, and blur with GUI sliders.", demoSlug: "morphing-rovo-demo" },
		],
	},

	attachments: {
		description:
			"A compound attachment system for displaying file and source-document attachments in grid, inline, or list layouts with hover previews, remove buttons, and media-aware icons.",
		usage: `import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentRemove,
} from "@/components/ui-ai/attachments";

<Attachments variant="grid">
  {files.map((file) => (
    <Attachment key={file.id} data={file} onRemove={() => remove(file.id)}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  ))}
</Attachments>`,
		props: [
			{
				name: "variant",
				type: '"grid" | "inline" | "list"',
				default: '"grid"',
				description: "Layout presentation mode: grid thumbnails, inline badges, or list rows.",
			},
			{
				name: "data",
				type: "(FileUIPart & { id: string }) | (SourceDocumentUIPart & { id: string })",
				required: true,
				description: "Attachment data object passed to each Attachment item.",
			},
			{
				name: "onRemove",
				type: "() => void",
				description: "Remove callback. When provided, AttachmentRemove renders a dismiss button.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes.",
			},
		],
		subComponents: [
			{ name: "Attachments", description: "Container establishing layout variant context." },
			{ name: "Attachment", description: "Individual item wrapper with data and remove callback." },
			{ name: "AttachmentPreview", description: "Media preview rendering images, video, or category icons." },
			{ name: "AttachmentInfo", description: "Filename and optional media type display." },
			{ name: "AttachmentRemove", description: "Hover-visible remove button with screen-reader label." },
			{ name: "AttachmentHoverCard", description: "Hover preview wrapper for inline attachments." },
			{ name: "AttachmentHoverCardTrigger", description: "Trigger element for the hover card." },
			{ name: "AttachmentHoverCardContent", description: "Content panel for the hover preview." },
			{ name: "AttachmentEmpty", description: "Empty state placeholder when no attachments exist." },
		],
		examples: [
			{ title: "Grid", description: "Grid thumbnail layout with mixed file types and remove buttons.", demoSlug: "attachments-demo-grid" },
			{ title: "Inline", description: "Compact inline badge layout with filename and remove.", demoSlug: "attachments-demo-inline" },
			{ title: "List", description: "Full-row list layout showing media type metadata.", demoSlug: "attachments-demo-list" },
			{ title: "Hover card", description: "Inline badges with hover preview for image attachments.", demoSlug: "attachments-demo-hover-card" },
			{ title: "Read-only", description: "Grid images without remove buttons.", demoSlug: "attachments-demo-read-only" },
			{ title: "Empty state", description: "Empty state when no attachments are present.", demoSlug: "attachments-demo-empty" },
		],
	},

	checkpoint: {
		description:
			"A conversation checkpoint marker that lets users save and restore specific points in a chat history. Renders a visual separator with a bookmark icon and a restore trigger button.",
		usage: `import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "@/components/ui-ai/checkpoint";

<Checkpoint>
  <CheckpointIcon />
  <CheckpointTrigger tooltip="Restore to this point">
    Restore checkpoint
  </CheckpointTrigger>
</Checkpoint>`,
		props: [
			{
				name: "children",
				type: "ReactNode",
				required: true,
				description: "CheckpointIcon and CheckpointTrigger sub-components.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "Checkpoint", description: "Root flex container with separator line." },
			{ name: "CheckpointIcon", description: "Visual indicator icon, defaults to BookmarkIcon. Pass custom children to override." },
			{ name: "CheckpointTrigger", description: "Ghost button that triggers a restore action. Supports an optional tooltip prop." },
		],
		examples: [
			{ title: "In conversation", description: "Checkpoints placed between messages with restore-on-click behavior.", demoSlug: "checkpoint-demo-conversation" },
			{ title: "Basic", description: "Minimal checkpoint with default bookmark icon and label.", demoSlug: "checkpoint-demo-basic" },
			{ title: "With tooltip", description: "Checkpoint trigger with a descriptive tooltip on hover.", demoSlug: "checkpoint-demo-with-tooltip" },
			{ title: "Custom icons", description: "Checkpoints using FlagIcon and HistoryIcon instead of the default bookmark.", demoSlug: "checkpoint-demo-custom-icon" },
		],
	},

	commit: {
		description:
			"A collapsible commit card displaying git commit details including hash, message, author avatar, relative timestamp, copy-to-clipboard, and an expandable file changes list with color-coded status badges and line change counts.",
		usage: `import {
  Commit,
  CommitHeader,
  CommitAuthor,
  CommitAuthorAvatar,
  CommitInfo,
  CommitMessage,
  CommitMetadata,
  CommitHash,
  CommitSeparator,
  CommitTimestamp,
  CommitActions,
  CommitCopyButton,
  CommitContent,
  CommitFiles,
  CommitFile,
  CommitFileInfo,
  CommitFileStatus,
  CommitFileIcon,
  CommitFilePath,
  CommitFileChanges,
  CommitFileAdditions,
  CommitFileDeletions,
} from "@/components/ui-ai/commit";

<Commit>
  <CommitHeader>
    <CommitAuthor>
      <CommitAuthorAvatar initials="ES" className="mr-3" />
      <CommitInfo>
        <CommitMessage>Refactor auth module</CommitMessage>
        <CommitMetadata>
          <CommitHash>a1b2c3d</CommitHash>
          <CommitSeparator />
          <CommitTimestamp date={new Date()} />
        </CommitMetadata>
      </CommitInfo>
    </CommitAuthor>
    <CommitActions>
      <CommitCopyButton hash="a1b2c3d" />
    </CommitActions>
  </CommitHeader>
  <CommitContent>
    <CommitFiles>
      <CommitFile>
        <CommitFileInfo>
          <CommitFileStatus status="modified" />
          <CommitFileIcon />
          <CommitFilePath>src/auth.ts</CommitFilePath>
        </CommitFileInfo>
        <CommitFileChanges>
          <CommitFileAdditions count={24} />
          <CommitFileDeletions count={8} />
        </CommitFileChanges>
      </CommitFile>
    </CommitFiles>
  </CommitContent>
</Commit>`,
		props: [
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root Collapsible container.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				default: "false",
				description: "Initial expanded state for the collapsible file list.",
			},
		],
		subComponents: [
			{ name: "CommitHeader", description: "Collapsible trigger row containing author, message, and actions." },
			{ name: "CommitAuthor", description: "Flex container for avatar and commit info." },
			{ name: "CommitAuthorAvatar", description: "Avatar with initials fallback. Requires `initials` prop." },
			{ name: "CommitInfo", description: "Column container for message and metadata." },
			{ name: "CommitMessage", description: "Commit message text." },
			{ name: "CommitMetadata", description: "Row for hash, separator, and timestamp." },
			{ name: "CommitHash", description: "Monospace commit hash with git icon." },
			{ name: "CommitSeparator", description: "Visual separator (defaults to \u2022)." },
			{ name: "CommitTimestamp", description: "Relative time element. Requires `date` prop." },
			{ name: "CommitActions", description: "Action button container (stops event propagation)." },
			{ name: "CommitCopyButton", description: "Copy hash to clipboard. Requires `hash` prop." },
			{ name: "CommitContent", description: "Collapsible content area for file changes." },
			{ name: "CommitFiles", description: "Container for file rows." },
			{ name: "CommitFile", description: "Individual file row with hover highlight." },
			{ name: "CommitFileInfo", description: "File metadata: status badge, icon, and path." },
			{ name: "CommitFileStatus", description: "Color-coded status badge (added/modified/deleted/renamed)." },
			{ name: "CommitFileIcon", description: "File type icon." },
			{ name: "CommitFilePath", description: "Truncated monospace file path." },
			{ name: "CommitFileChanges", description: "Line change statistics container." },
			{ name: "CommitFileAdditions", description: "Green additions count with plus icon." },
			{ name: "CommitFileDeletions", description: "Red deletions count with minus icon." },
		],
		examples: [
			{ title: "Full commit", description: "Complete commit card with author, metadata, copy button, and expandable file changes.", demoSlug: "commit-demo-full" },
			{ title: "Expanded files", description: "Commit with file list expanded by default.", demoSlug: "commit-demo-with-files" },
			{ title: "Minimal", description: "Header-only commit with message, hash, and timestamp.", demoSlug: "commit-demo-minimal" },
			{ title: "Commit list", description: "Multiple commits stacked in a list view.", demoSlug: "commit-demo-multiple" },
		],
	},

	"code-block": {
		description:
			"An ADS-aligned syntax-highlighted code block using Shiki with copy-to-clipboard, download, line numbers, and optional language selection.",
		adsUrl: "https://atlassian.design/components/code/code-block/",
		usage: `import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  CodeBlockTitle,
} from "@/components/ui-ai/code-block";

<CodeBlock code={codeString} language="typescript" showLineNumbers>
  <CodeBlockHeader>
    <CodeBlockTitle>
      <CodeBlockFilename>example.ts</CodeBlockFilename>
    </CodeBlockTitle>
    <CodeBlockActions>
      <CodeBlockDownloadButton />
      <CodeBlockCopyButton />
    </CodeBlockActions>
  </CodeBlockHeader>
</CodeBlock>`,
		props: [
			{
				name: "code",
				type: "string",
				required: true,
				description: "The code string to highlight and display.",
			},
			{
				name: "language",
				type: "BundledLanguage",
				required: true,
				description: "Programming language for syntax highlighting.",
			},
			{
				name: "showLineNumbers",
				type: "boolean",
				default: "false",
				description: "Show line numbers in the gutter.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the outer container.",
			},
		],
		subComponents: [
			{ name: "CodeBlockContainer", description: "Wrapper with language data attribute." },
			{ name: "CodeBlockHeader", description: "Top bar for metadata and actions." },
			{ name: "CodeBlockTitle", description: "Title section in the header." },
			{ name: "CodeBlockFilename", description: "Filename display in the header." },
			{ name: "CodeBlockActions", description: "Container for action buttons." },
			{ name: "CodeBlockContent", description: "Syntax-highlighted code area." },
			{ name: "CodeBlockCopyButton", description: "Copy to clipboard button." },
			{ name: "CodeBlockDownloadButton", description: "Download raw code with a language-appropriate filename." },
			{ name: "CodeBlockLanguageSelector", description: "Select wrapper for choosing code language." },
		],
		examples: [
			{ title: "ADS basic", description: "Standard code block with filename and copy action.", demoSlug: "code-block-demo-ads-basic" },
			{ title: "ADS line numbers", description: "Code block with gutter line numbers for review workflows.", demoSlug: "code-block-demo-ads-line-numbers" },
			{ title: "ADS shell output", description: "Terminal-style command snippets following ADS usage.", demoSlug: "code-block-demo-ads-shell" },
			{ title: "ADS language selector", description: "Switch between languages in a single code block surface.", demoSlug: "code-block-demo-ads-language-selector" },
		],
	},

	"chain-of-thought": {
		description:
			"A collapsible reasoning timeline that shows an assistant's step-by-step process with status states, search-result chips, and optional image context.",
		usage: `import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "@/components/ui-ai/chain-of-thought";
import { SearchIcon } from "@/components/ui/vpk-icons";

<ChainOfThought defaultOpen>
  <ChainOfThoughtHeader>Tracing model reasoning</ChainOfThoughtHeader>
  <ChainOfThoughtContent>
    <ChainOfThoughtStep icon={SearchIcon} label="Searching source profiles" status="active">
      <ChainOfThoughtSearchResults>
        <ChainOfThoughtSearchResult>github.com</ChainOfThoughtSearchResult>
        <ChainOfThoughtSearchResult>x.com</ChainOfThoughtSearchResult>
      </ChainOfThoughtSearchResults>
    </ChainOfThoughtStep>
  </ChainOfThoughtContent>
</ChainOfThought>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "open",
				type: "boolean",
				description: "Controlled open state for the reasoning container.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				default: "false",
				description: "Initial open state when used uncontrolled.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				description: "Callback fired whenever open state changes.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes for the root container.",
			},
		],
		subComponents: [
			{ name: "ChainOfThoughtHeader", description: "Collapsible trigger row with label and chevron." },
			{ name: "ChainOfThoughtContent", description: "Animated content panel shown when open." },
			{ name: "ChainOfThoughtStep", description: "Individual reasoning step with icon, label, description, and status." },
			{ name: "ChainOfThoughtSearchResults", description: "Container for source/result chips attached to a step." },
			{ name: "ChainOfThoughtSearchResult", description: "Single result chip rendered as an ADS-aligned badge." },
			{ name: "ChainOfThoughtImage", description: "Image container with caption support for visual reasoning evidence." },
		],
		examples: [
			{ title: "Preload", description: "Collapsed initial state before reasoning begins — header visible, content hidden.", demoSlug: "chain-of-thought-demo-preload" },
			{ title: "Thinking", description: "Active processing — multiple steps with search results, image evidence, and one active step in progress.", demoSlug: "chain-of-thought-demo-thinking" },
			{ title: "Completed", description: "All reasoning steps complete, with the parent summary collapsed by default.", demoSlug: "chain-of-thought-demo-completed" },
			{ title: "Status variants", description: "Compare complete, active, and pending step states in one reasoning chain.", demoSlug: "chain-of-thought-demo-status-variants" },
			{ title: "Search results", description: "Standalone source-chip usage for search and retrieval phases.", demoSlug: "chain-of-thought-demo-search-results" },
			{ title: "Image step", description: "Reasoning step with image evidence and caption.", demoSlug: "chain-of-thought-demo-image-step" },
			{ title: "Tool icon table", description: "Reference table showing the resolved icon or logo used for native tools, Atlassian/VPK servers, 3P MCP servers, and fallback cases.", demoSlug: "chain-of-thought-demo-tool-icon-table" },
		],
	},

	canvas: {
		description:
			"A pre-configured React Flow canvas optimized for AI workflow visualization. Provides sensible defaults (fitView, panOnScroll, selectionOnDrag) and renders a themed Background. Use with Node, Edge, Connection, Controls, Panel, and Toolbar companion components.",
		usage: `import { Canvas } from "@/components/ui-ai/canvas";
import { Connection } from "@/components/ui-ai/connection";
import { Controls } from "@/components/ui-ai/controls";
import { Edge } from "@/components/ui-ai/edge";
import {
  Node, NodeHeader, NodeTitle, NodeDescription,
  NodeContent, NodeFooter,
} from "@/components/ui-ai/node";

<Canvas
  connectionLineComponent={Connection}
  edges={edges}
  edgeTypes={{ animated: Edge.Animated, temporary: Edge.Temporary }}
  nodes={nodes}
  nodeTypes={nodeTypes}
>
  <Controls />
</Canvas>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "children",
				type: "ReactNode",
				description: "Child components rendered inside the canvas (Controls, Panel, MiniMap, etc.).",
			},
			{
				name: "nodes",
				type: "Node[]",
				required: true,
				description: "Array of node objects with id, position, data, and optional type.",
			},
			{
				name: "edges",
				type: "Edge[]",
				required: true,
				description: "Array of edge objects with id, source, target, and optional type.",
			},
			{
				name: "nodeTypes",
				type: "Record<string, ComponentType>",
				description: "Map of custom node type renderers keyed by type name.",
			},
			{
				name: "edgeTypes",
				type: "Record<string, ComponentType>",
				description: "Map of custom edge type renderers keyed by type name.",
			},
			{
				name: "connectionLineComponent",
				type: "ConnectionLineComponent",
				description: "Custom component for rendering the connection line while dragging.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the ReactFlow container.",
			},
		],
		subComponents: [
			{ name: "Canvas", description: "Pre-configured ReactFlow wrapper with Background, fitView, panOnScroll, and selectionOnDrag defaults." },
		],
		examples: [
			{ title: "Workflow", description: "Full workflow canvas with six nodes, animated and temporary edges, and connection line.", demoSlug: "canvas-demo-workflow" },
			{ title: "Minimal", description: "Simple two-node input-to-output graph.", demoSlug: "canvas-demo-minimal" },
			{ title: "With controls", description: "Canvas with zoom, fit-view, and interactive toggle controls.", demoSlug: "canvas-demo-with-controls" },
			{ title: "With panel", description: "Canvas with an overlay status panel and controls.", demoSlug: "canvas-demo-with-panel" },
			{ title: "With toolbar", description: "Nodes with a bottom-positioned toolbar for edit, copy, and delete actions.", demoSlug: "canvas-demo-with-toolbar" },
		],
	},

	message: {
		description:
			"A compound message component system for rendering chat messages with branches (multiple responses), actions, and rich content rendering via Streamdown.",
		usage: `import { Message, MessageContent, MessageActions, MessageAction } from "@/components/ui-ai/message";

<Message from="assistant">
  <MessageContent>
    <p>Hello! How can I help you today?</p>
  </MessageContent>
  <MessageActions>
    <MessageAction tooltip="Copy" label="Copy">
      <CopyIcon />
    </MessageAction>
  </MessageActions>
</Message>`,
		demoLayout: {
			previewContentWidth: "full",
		},
		props: [
			{
				name: "from",
				type: '"user" | "assistant"',
				required: true,
				description: "The sender role, affects message styling.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes.",
			},
		],
		subComponents: [
			{ name: "MessageContent", description: "Main message body content area." },
			{ name: "MessageActions", description: "Container for action buttons." },
			{ name: "MessageAction", description: "Individual action button with tooltip." },
			{ name: "MessageBranch", description: "Branching container for multiple responses." },
			{ name: "MessageResponse", description: "Single response variant using Streamdown." },
		],
	},

	persona: {
		description:
			"An animated persona component using Rive WebGL animations with state-driven visuals. Supports multiple visual variants and lifecycle callbacks.",
		usage: `import { Persona } from "@/components/ui-ai/persona";

<Persona state="idle" variant="obsidian" />
<Persona state="thinking" variant="glint" />
<Persona state="speaking" variant="halo" />`,
		props: [
			{
				name: "state",
				type: '"idle" | "listening" | "thinking" | "speaking" | "asleep"',
				required: true,
				description: "Visual animation state of the persona.",
			},
			{
				name: "variant",
				type: '"command" | "glint" | "halo" | "mana" | "obsidian" | "opal"',
				default: '"obsidian"',
				description: "Rive animation variant.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes for sizing and styling.",
			},
			{
				name: "onLoad",
				type: "RiveParameters[\"onLoad\"]",
				description: "Callback when Rive animation begins loading.",
			},
			{
				name: "onLoadError",
				type: "RiveParameters[\"onLoadError\"]",
				description: "Callback when Rive animation fails to load.",
			},
			{
				name: "onReady",
				type: "() => void",
				description: "Callback when animation is ready to play.",
			},
			{
				name: "onPlay",
				type: "RiveParameters[\"onPlay\"]",
				description: "Callback when animation starts playing.",
			},
			{
				name: "onPause",
				type: "RiveParameters[\"onPause\"]",
				description: "Callback when animation pauses.",
			},
			{
				name: "onStop",
				type: "RiveParameters[\"onStop\"]",
				description: "Callback when animation stops.",
			},
		],
		examples: [
			{ title: "State management", description: "Cycle through idle, listening, thinking, speaking, and asleep states with buttons.", demoSlug: "persona-demo-states" },
			{ title: "All variants", description: "Grid showing every visual variant: obsidian, mana, opal, halo, glint, and command.", demoSlug: "persona-demo-variants" },
			{ title: "Custom styling", description: "Large persona with border styling applied via className.", demoSlug: "persona-demo-custom-styling" },
		],
	},

		plan: {
			description:
				"A composable collapsible plan card with supported summary and tasks-only patterns. Includes shimmer-ready title/description rendering, markdown summary content, numbered task lists with overflow handling, and optional footer actions.",
			usage: `import {
  Plan,
  PlanHeader,
  PlanAvatar,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanTabContent,
  PlanFooter,
} from "@/components/ui-ai/plan";
import { Button } from "@/components/ui/button";

<Plan open={isOpen} onOpenChange={setIsOpen}>
  <PlanHeader
    leading={<PlanAvatar visualIdentity={{ iconName: "dashboard", tileVariant: "blue" }} />}
    title={
      <PlanTitle className="truncate text-sm leading-5 font-semibold text-text">
        Implementation plan
      </PlanTitle>
    }
    description={
      <PlanDescription className="text-xs leading-4 text-text-subtlest">
        4 tasks
      </PlanDescription>
    }
  />
  <PlanContent className="pb-0">
    <PlanTabContent
      description={planSummaryMarkdown}
    />
    <PlanFooter className="justify-end gap-2">
      <Button variant="outline">Open preview</Button>
      <Button>Build</Button>
    </PlanFooter>
  </PlanContent>
</Plan>`,
			props: [
				{
					name: "isStreaming",
					type: "boolean",
					default: "false",
					description: "Enable shimmer loading animation for streamed content.",
				},
				{
					name: "className",
					type: "string",
					description: "Additional CSS classes.",
				},
			],
			subComponents: [
				{ name: "PlanHeader", description: "Generative-style plan header with built-in chevron toggle. Accepts `leading`, `title`, and optional `description` props." },
				{ name: "PlanAvatar", description: "IconTile-based avatar for plan headers. Accepts a `visualIdentity` prop with `iconName` and subtle `tileVariant`." },
				{ name: "PlanTitle", description: "Title text with shimmer support." },
				{ name: "PlanDescription", description: "Description text with shimmer support." },
				{ name: "PlanAction", description: "Legacy action slot used by custom headers." },
				{ name: "PlanChevronTrigger", description: "Legacy chevron toggle button for custom plan headers." },
				{ name: "PlanContent", description: "Collapsible content area." },
				{ name: "PlanTabContent", description: "Built-in markdown summary body. Accepts `description`, optional `markdown`, and summary layout overrides." },
				{ name: "PlanSummary", description: "Markdown summary renderer with collapsed overflow treatment. Accepts `summary`, optional `emptyMessage`, and optional `showMoreLabel` props." },
				{ name: "PlanAgentBar", description: "Agent count row with people icon. Accepts `agents` string array." },
				{ name: "PlanTaskList", description: "Ordered list with overflow detection and \"Show more\" button. Accepts optional `showMoreLabel`; expansion state is shared with `PlanSummary`." },
				{ name: "PlanTaskItem", description: "Animated numbered task row with optional `blockedByLabels`, `blockedByText`, and `agent` badge." },
				{ name: "PlanTrigger", description: "Legacy toggle button for expand/collapse (ChevronsUpDown icon)." },
				{ name: "PlanFooter", description: "Bottom section for actions." },
			],
			examples: [
				{ title: "Summary", description: "Plan card variant with markdown summary content.", demoSlug: "plan-demo-summary-and-tasks" },
				{ title: "Tasks only", description: "Classic plan card with task list content only.", demoSlug: "plan-demo-tasks-only" },
			],
		},

	"prompt-input": {
		description:
			"A composable AI prompt composer built on InputGroup primitives, with textarea submission semantics, action menus, model/tool controls, file attachments, and provider-based external control.",
		usage: `import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputSubmit,
} from "@/components/ui-ai/prompt-input";
import AddIcon from "@atlaskit/icon/core/add";

<PromptInput onSubmit={({ text, files }) => sendMessage({ text, files })}>
  <PromptInputBody>
    <PromptInputTextarea placeholder="Ask anything..." rows={1} />
  </PromptInputBody>
  <PromptInputFooter className="justify-between px-1">
    <PromptInputTools>
      <PromptInputActionMenu>
        <PromptInputActionMenuTrigger aria-label="Add">
          <AddIcon label="" />
        </PromptInputActionMenuTrigger>
        <PromptInputActionMenuContent>
          <PromptInputActionMenuItem>Add context</PromptInputActionMenuItem>
        </PromptInputActionMenuContent>
      </PromptInputActionMenu>
    </PromptInputTools>
    <PromptInputSubmit />
  </PromptInputFooter>
</PromptInput>`,
		props: [
			{
				name: "onSubmit",
				type: '(message: { text: string; files: FileUIPart[] }, event: FormEvent<HTMLFormElement>) => void | Promise<void>',
				required: true,
				description: "Submit handler for the composed message. Supports sync and async flows.",
			},
			{
				name: "accept",
				type: "string",
				description: "Optional file MIME filter for uploads (for example, 'image/*,application/pdf').",
			},
			{
				name: "multiple",
				type: "boolean",
				default: "false",
				description: "Allow selecting multiple files from the file picker.",
			},
			{
				name: "globalDrop",
				type: "boolean",
				default: "false",
				description: "When true, file drag-and-drop is captured at the document level.",
			},
			{
				name: "maxFiles",
				type: "number",
				description: "Maximum number of files accepted by the composer.",
			},
			{
				name: "maxFileSize",
				type: "number",
				description: "Maximum file size in bytes for each uploaded file.",
			},
			{
				name: "onError",
				type: '(error: { code: \"max_files\" | \"max_file_size\" | \"accept\"; message: string }) => void',
				description: "Validation callback for file acceptance/size/count failures.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the form wrapper.",
			},
			{
				name: "variant",
				type: '"default" | "floating"',
				default: '"default"',
				description: 'Visual variant. "floating" applies rounded border, input background, padding, and elevated shadow for overlay use.',
			},
		],
		subComponents: [
			{ name: "PromptInputProvider", description: "Optional provider for externally controlled text input and attachments." },
			{ name: "PromptInputBody", description: "Body slot that wraps the main textarea input region." },
			{ name: "PromptInputTextarea", description: "Autosizing textarea with Enter-to-submit and paste-file support." },
			{ name: "PromptInputHeader", description: "Top aligned addon row for tabs, modes, or context chips." },
			{ name: "PromptInputFooter", description: "Bottom aligned addon row for tools and submit actions." },
			{ name: "PromptInputTools", description: "Inline tools container commonly used inside PromptInputFooter." },
			{ name: "PromptInputButton", description: "Action button primitive with optional tooltip support." },
			{ name: "PromptInputActionMenu", description: "Dropdown menu container for add/context actions." },
			{ name: "PromptInputActionMenuTrigger", description: "Menu trigger button specialized for PromptInput actions." },
			{ name: "PromptInputActionMenuContent", description: "Menu content panel aligned for prompt actions." },
			{ name: "PromptInputActionMenuItem", description: "Individual menu item for quick prompt actions." },
			{ name: "PromptInputActionAddAttachments", description: "Prebuilt menu item that opens the file picker." },
			{ name: "PromptInputSelect", description: "Select wrapper for model/reasoning/verbosity controls." },
			{ name: "PromptInputSubmit", description: "Submit/stop button with chat status-aware icon states." },
		],
		examples: [
			{ title: "Chat Composer style", description: "ADS-styled prompt input with add menu, customize options, and disclaimer.", demoSlug: "prompt-input-demo-chat-composer" },
			{ title: "Cursor style", description: "Compact assistant layout with mode tabs and model selector.", demoSlug: "prompt-input-demo-cursor-style" },
			{ title: "Button tooltips", description: "Action buttons with tooltip strings and shortcut hints.", demoSlug: "prompt-input-demo-button-tooltips" },
			{ title: "Action menu", description: "Quick insert actions and contextual prompt starters.", demoSlug: "prompt-input-demo-action-menu" },
			{ title: "Submit status", description: "Preview submitted, streaming, error, and stop button behaviors.", demoSlug: "prompt-input-demo-submit-status" },
			{ title: "Model selects", description: "Compose with model and response-style dropdown controls.", demoSlug: "prompt-input-demo-model-select" },
			{ title: "Provider controlled", description: "Drive PromptInput externally with PromptInputProvider and controller hooks.", demoSlug: "prompt-input-demo-provider-controlled" },
			{ title: "Floating bar", description: 'Uses variant="floating" for a minimal single-line input with elevated shadow, ideal for overlaying on content areas.', demoSlug: "prompt-input-demo-floating-bar" },
		],
	},

	queue: {
		description:
			"A composable queue/task list system with collapsible sections, status indicators, hover-revealed action buttons, and file attachment badges. Built on Collapsible and ScrollArea primitives.",
		usage: `import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
  QueueItemDescription,
  QueueItemActions,
  QueueItemAction,
  QueueItemAttachment,
  QueueItemFile,
} from "@/components/ui-ai/queue";

<Queue>
  <QueueSection>
    <QueueSectionTrigger>
      <QueueSectionLabel label="Pending" count={2} />
    </QueueSectionTrigger>
    <QueueSectionContent>
      <QueueList>
        <QueueItem>
          <div className="flex items-center gap-2">
            <QueueItemIndicator />
            <QueueItemContent>Write API endpoints</QueueItemContent>
          </div>
          <QueueItemDescription>REST endpoints for user CRUD</QueueItemDescription>
        </QueueItem>
      </QueueList>
    </QueueSectionContent>
  </QueueSection>
</Queue>`,
		props: [
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "Queue", description: "Root container with border, background, and rounded styling." },
			{ name: "QueueSection", description: "Collapsible section wrapper with defaultOpen control." },
			{ name: "QueueSectionTrigger", description: "Clickable trigger button to toggle section visibility." },
			{ name: "QueueSectionLabel", description: "Label content with optional count and icon." },
			{ name: "QueueSectionContent", description: "Animated content area within a collapsible section." },
			{ name: "QueueList", description: "Scrollable list container (max-h-40) wrapping items in a ul." },
			{ name: "QueueItem", description: "Individual list item with hover highlight and group context for actions." },
			{ name: "QueueItemIndicator", description: "Circular status indicator. Accepts completed prop for visual state." },
			{ name: "QueueItemContent", description: "Primary item text with line-clamp. Accepts completed prop for strikethrough." },
			{ name: "QueueItemDescription", description: "Secondary descriptive text below the item content." },
			{ name: "QueueItemActions", description: "Container for hover-revealed action buttons." },
			{ name: "QueueItemAction", description: "Ghost icon button that appears on item hover." },
			{ name: "QueueItemAttachment", description: "Flex-wrap container for file and image attachments." },
			{ name: "QueueItemFile", description: "File badge with paperclip icon and truncated filename." },
			{ name: "QueueItemImage", description: "Small thumbnail image (32x32) with rounded border." },
		],
		examples: [
			{ title: "Prompt queue", description: "Chat-style prompt queue with removable items, as used in agent team composers.", demoSlug: "queue-demo-prompt-queue" },
			{ title: "With actions", description: "Items with hover-revealed edit, copy, and delete action buttons.", demoSlug: "queue-demo-with-actions" },
			{ title: "With attachments", description: "Items with file attachment badges.", demoSlug: "queue-demo-with-attachments" },
			{ title: "Minimal", description: "Simple flat list without collapsible sections.", demoSlug: "queue-demo-minimal" },
		],
	},

	artifact: {
		description:
			"A card for displaying AI-generated artifacts like code, documents, images, or sheets. The high-level ArtifactCard component provides kind-based icons, expand/collapse, streaming state, and preview rendering built on GenerativeCard. Low-level compound components (Artifact, ArtifactHeader, etc.) are also available for custom layouts.",
		usage: `import { ArtifactCard } from "@/components/ui-ai/artifact";

<ArtifactCard
  kind="code"
  title="Algorithm Implementation"
  previewContent={codeString}
  onOpen={() => openArtifact()}
/>

{/* Or use compound components for custom layouts: */}
import {
  Artifact, ArtifactHeader, ArtifactTitle,
  ArtifactActions, ArtifactAction, ArtifactContent,
} from "@/components/ui-ai/artifact";`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{ name: "kind", type: '"text" | "code" | "image" | "sheet" | "react"', description: "The artifact content type. Determines the default icon tile and color." },
			{ name: "visualIdentity", type: '{ iconName: string; tileVariant: "gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" }', description: "Optional icon-tile override used instead of the kind-based default." },
			{ name: "title", type: "string", description: "Artifact title text." },
			{ name: "action", type: '"create" | "update" | null', description: "Optional action context for description text." },
			{ name: "isStreaming", type: "boolean", description: "Whether the artifact is currently streaming." },
			{ name: "displayMode", type: '"preview" | "chip"', description: 'Display mode. "preview" shows expanded card, "chip" shows compact inline card. Defaults to "preview".' },
			{ name: "previewContent", type: "string", description: "Content string for the preview (code text, image URL, etc.)." },
			{ name: "onOpen", type: "(element: HTMLDivElement) => void", description: 'Callback when the "Open" button is clicked. Receives the card root element.' },
			{ name: "onRegister", type: "(element: HTMLDivElement) => void", description: "Optional callback fired when a preview-mode card mounts. Receives the card root element." },
			{ name: "children", type: "ReactNode", description: "Optional children rendered inside the card content (overrides previewContent)." },
			{ name: "className", type: "string", description: "Additional classes for the outer wrapper." },
		],
		subComponents: [
			{ name: "ArtifactCard", description: "High-level artifact card built on GenerativeCard with kind-based icons, expand/collapse, and preview rendering." },
			{ name: "ArtifactPanel", description: "Full artifact viewer/editor panel with title, kind badge, edit/preview toggle, copy, and close. Renders code, images, or text." },
			{ name: "Artifact", description: "Low-level root container for custom artifact layouts." },
			{ name: "ArtifactHeader", description: "Header bar with title area and actions. Uses flexbox with justify-between." },
			{ name: "ArtifactTitle", description: "Title text rendered as a paragraph with medium font weight." },
			{ name: "ArtifactDescription", description: "Subtitle/description text in muted foreground color." },
			{ name: "ArtifactActions", description: "Container for grouping action buttons with gap spacing." },
			{ name: "ArtifactAction", description: "Individual icon button with optional tooltip. Accepts icon (LucideIcon), tooltip (string), and label (string) props." },
			{ name: "ArtifactClose", description: "Close button defaulting to an X icon. Renders a ghost Button." },
			{ name: "ArtifactContent", description: "Scrollable content area with padding. Use className='p-0' for edge-to-edge content like CodeBlock." },
		],
		examples: [
			{ title: "Code preview", description: "ArtifactCard displaying a code artifact with preview and expand/collapse.", demoSlug: "artifact-demo-code-preview" },
			{ title: "Image preview", description: "ArtifactCard displaying an image artifact with gradient overlay.", demoSlug: "artifact-demo-image-preview" },
			{ title: "Streaming", description: "ArtifactCard in streaming state showing skeleton loading and spinner.", demoSlug: "artifact-demo-streaming" },
			{ title: "Chip mode", description: "Compact inline artifact card with 'Open' action button.", demoSlug: "artifact-demo-chip" },
			{ title: "Compound (legacy)", description: "Custom layout using low-level compound components.", demoSlug: "artifact-demo-compound" },
		],
	},

	confirmation: {
		description:
			"A tool execution approval workflow component that displays approval requests and outcomes. Manages three states: pending approval, accepted, and rejected — with conditional sub-component rendering driven by AI SDK tool state.",
		usage: `import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ui-ai/confirmation";

<Confirmation approval={toolPart.approval} state={toolPart.state}>
  <ConfirmationTitle>Allow file access?</ConfirmationTitle>
  <ConfirmationRequest>
    <p>The assistant wants to read files from your workspace.</p>
    <ConfirmationActions>
      <ConfirmationAction variant="outline" onClick={onDeny}>Deny</ConfirmationAction>
      <ConfirmationAction onClick={onApprove}>Allow</ConfirmationAction>
    </ConfirmationActions>
  </ConfirmationRequest>
  <ConfirmationAccepted>
    <CheckIcon /> You approved file access
  </ConfirmationAccepted>
  <ConfirmationRejected>
    <XIcon /> You denied file access
  </ConfirmationRejected>
</Confirmation>`,
		props: [
			{
				name: "approval",
				type: "ToolUIPartApproval",
				required: true,
				description: "Approval object from the AI SDK ToolUIPart. Contains id, and optionally approved (boolean) and reason (string).",
			},
			{
				name: "state",
				type: "ToolUIPart[\"state\"]",
				required: true,
				description: "Current tool execution state: input-streaming, input-available, approval-requested, approval-responded, output-denied, or output-available.",
			},
			{
				name: "variant",
				type: '"default" | "info" | "warning" | "success" | "discovery" | "danger" | "error"',
				default: '"default"',
				description: "Alert variant inherited from the Alert component. Controls background and icon color.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the Alert wrapper.",
			},
		],
		subComponents: [
			{ name: "Confirmation", description: "Root container wrapping an Alert. Provides approval context to children. Renders nothing during input-streaming and input-available states." },
			{ name: "ConfirmationTitle", description: "Title text rendered via AlertDescription with inline display." },
			{ name: "ConfirmationRequest", description: "Content shown only during approval-requested state." },
			{ name: "ConfirmationAccepted", description: "Content shown when approval.approved is true and state is approval-responded, output-denied, or output-available." },
			{ name: "ConfirmationRejected", description: "Content shown when approval.approved is false and state is approval-responded, output-denied, or output-available." },
			{ name: "ConfirmationActions", description: "Action button container, only visible during approval-requested state. Right-aligned with gap spacing." },
			{ name: "ConfirmationAction", description: "Individual action button using the Button component. Accepts all Button props including variant." },
		],
		examples: [
			{ title: "Approval request", description: "Pending approval state with deny and allow action buttons.", demoSlug: "confirmation-demo-request" },
			{ title: "Accepted", description: "Approved state showing success message after user grants permission.", demoSlug: "confirmation-demo-accepted" },
			{ title: "Rejected", description: "Denied state showing rejection message after user declines.", demoSlug: "confirmation-demo-rejected" },
			{ title: "Interactive", description: "Full lifecycle demo: request, approve or deny, with reset. Shows state transitions.", demoSlug: "confirmation-demo-interactive" },
			{ title: "Alert variants", description: "Warning, danger, and discovery alert variants with contextual icons.", demoSlug: "confirmation-demo-variants" },
		],
	},

	context: {
		description:
			"A context window usage indicator that displays token consumption as a circular progress icon with a hover card breakdown of input, output, reasoning, and cache tokens with cost estimates powered by tokenlens.",
		usage: `import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from "@/components/ui-ai/context";

<Context
  maxTokens={128_000}
  usedTokens={21_490}
  usage={usage}
  modelId="openai:gpt-4o"
>
  <ContextTrigger />
  <ContextContent>
    <ContextContentHeader />
    <ContextContentBody>
      <ContextInputUsage />
      <ContextOutputUsage />
      <ContextReasoningUsage />
      <ContextCacheUsage />
    </ContextContentBody>
    <ContextContentFooter />
  </ContextContent>
</Context>`,
		props: [
			{
				name: "maxTokens",
				type: "number",
				required: true,
				description: "Total context window size in tokens.",
			},
			{
				name: "usedTokens",
				type: "number",
				required: true,
				description: "Currently consumed tokens.",
			},
			{
				name: "usage",
				type: "LanguageModelUsage",
				description: "AI SDK usage object with inputTokens, outputTokens, reasoningTokens, and cachedInputTokens breakdown.",
			},
			{
				name: "modelId",
				type: "string",
				description: "Model identifier for cost estimation via tokenlens (e.g., 'openai:gpt-4o').",
			},
		],
		subComponents: [
			{ name: "Context", description: "Root provider wrapping a HoverCard. Supplies token data to all children via React Context." },
			{ name: "ContextTrigger", description: "Ghost button showing usage percentage and a circular progress icon. Activates the hover card." },
			{ name: "ContextContent", description: "HoverCard content container with divided sections." },
			{ name: "ContextContentHeader", description: "Percentage label, compact token counts, and progress bar." },
			{ name: "ContextContentBody", description: "Container for usage breakdown rows." },
			{ name: "ContextContentFooter", description: "Total cost display computed from modelId via tokenlens." },
			{ name: "ContextInputUsage", description: "Input token count and cost row. Hidden when zero." },
			{ name: "ContextOutputUsage", description: "Output token count and cost row. Hidden when zero." },
			{ name: "ContextReasoningUsage", description: "Reasoning token count and cost row. Hidden when zero." },
			{ name: "ContextCacheUsage", description: "Cached input token count and cost row. Hidden when zero." },
		],
		examples: [
			{ title: "With cost", description: "Full context breakdown with input, output, reasoning, cache tokens and cost.", demoSlug: "context-demo-with-cost" },
			{ title: "Minimal", description: "Percentage and progress bar without usage breakdown or cost.", demoSlug: "context-demo-minimal" },
			{ title: "High usage", description: "Near-capacity context window showing 96% usage.", demoSlug: "context-demo-high-usage" },
			{ title: "Custom trigger", description: "Custom trigger text replacing the default percentage and icon.", demoSlug: "context-demo-custom-trigger" },
		],
	},

	image: {
		description:
			"Renders AI-generated images from the AI SDK's Experimental_GeneratedImage type. Converts base64-encoded image data into a responsive img element with data URI source.",
		usage: `import { Image } from "@/components/ui-ai/image";

<Image
  base64={generatedImage.base64}
  uint8Array={generatedImage.uint8Array}
  mediaType={generatedImage.mediaType}
  alt="AI-generated image"
/>`,
		props: [
			{
				name: "base64",
				type: "string",
				required: true,
				description: "Base64-encoded image data from AI SDK's generateImage result.",
			},
			{
				name: "uint8Array",
				type: "Uint8Array",
				description: "Raw image bytes from AI SDK (not used for rendering, available for download/processing).",
			},
			{
				name: "mediaType",
				type: "string",
				required: true,
				description: "MIME type of the image (e.g., 'image/png', 'image/jpeg').",
			},
			{
				name: "alt",
				type: "string",
				description: "Alternative text for the image element.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes applied to the img element.",
			},
		],
		subComponents: [
			{ name: "Image", description: "Responsive img element that constructs a data URI from base64 and mediaType. Defaults to rounded corners and max-width: 100%." },
		],
		examples: [
			{ title: "Custom styling", description: "Image with custom border, shadow, and aspect ratio via className.", demoSlug: "image-demo-custom-styling" },
			{ title: "Gallery", description: "Multiple generated images displayed in a responsive grid.", demoSlug: "image-demo-gallery" },
			{ title: "In message", description: "Image embedded within a Message compound component for chat contexts.", demoSlug: "image-demo-in-message" },
		],
	},

	reasoning: {
		description:
			"A collapsible reasoning/thinking indicator that auto-opens when streaming begins and auto-closes when complete. Triggers use AnimatedRovo (bouncy in thinking mode, calm in streaming mode), shimmer text, and animated color dots (optional). Pass streaming to the trigger to settle the AnimatedRovo while the inner color wheel keeps spinning.",
		usage: `import {
  Reasoning,
  ReasoningContent,
  AdsReasoningTrigger,
} from "@/components/ui-ai/reasoning";

// Thinking state — AnimatedRovo bounces
<Reasoning isStreaming={isStreaming}>
  <AdsReasoningTrigger />
  <ReasoningContent>{reasoningText}</ReasoningContent>
</Reasoning>

// Streaming state — AnimatedRovo settles, only inner wheel spins
<Reasoning isStreaming={isStreaming}>
  <AdsReasoningTrigger streaming />
  <ReasoningContent>{reasoningText}</ReasoningContent>
</Reasoning>`,
		props: [
			{
				name: "isStreaming",
				type: "boolean",
				default: "false",
				description: "Whether reasoning content is actively streaming. Controls auto-open/close behavior.",
			},
			{
				name: "streamingWave",
				type: "boolean",
				default: "false",
				description: "Enable wave motion layered on top of shimmer while streaming. When false, uses shimmer-only text.",
			},
			{
				name: "streamingWaveGradientColor",
				type: "string | string[]",
				description: "Optional wave highlight color (or color stops) forwarded to Shimmer when streamingWave is enabled.",
			},
			{
				name: "streamingWaveDuration",
				type: "number",
				description: "Optional wave duration override (seconds) forwarded to Shimmer while streaming.",
			},
			{
				name: "streamingWaveSpread",
				type: "number",
				description: "Optional wave spread override forwarded to Shimmer while streaming.",
			},
			{
				name: "animatedDots",
				type: "boolean",
				default: "true",
				description: "Show animated color dots after the streaming label. Set false to render label text only.",
			},
			{
				name: "open",
				type: "boolean",
				description: "Controlled open state of the collapsible.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				description: "Initial open state. Defaults to the value of isStreaming. Set to false to prevent auto-open.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				description: "Callback when the open state changes.",
			},
			{
				name: "duration",
				type: "number",
				description: "Thinking duration in seconds. Auto-computed from streaming start/stop when not provided.",
			},
		],
			subComponents: [
				{ name: "ReasoningTrigger", description: "Default trigger with Rovo logo, shimmer text, optional animated color dots, and chevron." },
				{ name: "AdsReasoningTrigger", description: "ADS-styled trigger with Rovo logo, shimmer text, optional animated color dots, and optional chevron." },
				{ name: "ReasoningContent", description: "Collapsible content area that shows timeline entries and renders non-timeline text as raw markdown source inside CodeBlock." },
			],
			examples: [
				{ title: "Preload", description: "Immediate feedback on query submission — bouncy AnimatedRovo with gradient wave shimmer and \"Rovo is cooking...\" label.", demoSlug: "reasoning-demo-preload" },
				{ title: "Thinking", description: "Active processing state — calm AnimatedRovo with chevron and expanded tool call timeline.", demoSlug: "reasoning-demo-thinking" },
				{ title: "Completed", description: "Completed state showing duration and static Rovo icon.", demoSlug: "reasoning-demo-completed" },
			],
	},

	sandbox: {
		description:
			"A collapsible container for displaying AI-generated code alongside execution output, with status indicators and tabbed navigation between code and output views. Integrates with the AI SDK's ToolUIPart state to show code execution progress.",
		usage: `import {
  Sandbox,
  SandboxHeader,
  SandboxContent,
  SandboxTabs,
  SandboxTabsBar,
  SandboxTabsList,
  SandboxTabsTrigger,
  SandboxTabContent,
} from "@/components/ui-ai/sandbox";
import { CodeBlock } from "@/components/ui-ai/code-block";

<Sandbox>
  <SandboxHeader state={toolPart.state} title="code.tsx" />
  <SandboxContent>
    <SandboxTabs defaultValue="code">
      <SandboxTabsBar>
        <SandboxTabsList>
          <SandboxTabsTrigger value="code">Code</SandboxTabsTrigger>
          <SandboxTabsTrigger value="output">Output</SandboxTabsTrigger>
        </SandboxTabsList>
      </SandboxTabsBar>
      <SandboxTabContent value="code">
        <CodeBlock code={code} language="tsx" />
      </SandboxTabContent>
      <SandboxTabContent value="output">
        <CodeBlock code={output} language="log" />
      </SandboxTabContent>
    </SandboxTabs>
  </SandboxContent>
</Sandbox>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "state",
				type: 'ToolUIPart["state"]',
				required: true,
				description: "Execution state from the AI SDK ToolUIPart, rendered as a status badge in the header.",
			},
			{
				name: "title",
				type: "string",
				description: "Filename or label displayed in the header next to the code icon.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				default: "true",
				description: "Initial expanded state of the collapsible container.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root Collapsible container.",
			},
		],
		subComponents: [
			{ name: "Sandbox", description: "Root Collapsible container with border and rounded corners. Defaults to open." },
			{ name: "SandboxHeader", description: "Collapsible trigger row with code icon, title, status badge, and chevron." },
			{ name: "SandboxContent", description: "Animated collapsible content area with slide/fade transitions." },
			{ name: "SandboxTabs", description: "Tabs wrapper for code/output views." },
			{ name: "SandboxTabsBar", description: "Container for the tab list with top and bottom borders." },
			{ name: "SandboxTabsList", description: "Tab list with transparent background and no rounding." },
			{ name: "SandboxTabsTrigger", description: "Individual tab button with active underline indicator." },
			{ name: "SandboxTabContent", description: "Tab content panel with no top margin." },
		],
		examples: [
			{ title: "Running", description: "Sandbox in running state with animated status badge.", demoSlug: "sandbox-demo-running" },
			{ title: "Error", description: "Error state with output tab showing stack trace.", demoSlug: "sandbox-demo-error" },
			{ title: "Collapsed", description: "Sandbox starting in collapsed state.", demoSlug: "sandbox-demo-collapsed" },
		],
	},

	"environment-variables": {
		description:
			"A compound component for displaying environment variables with automatic value masking, visibility toggle, copy-to-clipboard in multiple formats, and required status badges.",
		usage: `import {
  EnvironmentVariables,
  EnvironmentVariablesHeader,
  EnvironmentVariablesTitle,
  EnvironmentVariablesToggle,
  EnvironmentVariablesContent,
  EnvironmentVariable,
  EnvironmentVariableName,
  EnvironmentVariableValue,
  EnvironmentVariableCopyButton,
  EnvironmentVariableRequired,
  EnvironmentVariableGroup,
} from "@/components/ui-ai/environment-variables";

<EnvironmentVariables>
  <EnvironmentVariablesHeader>
    <EnvironmentVariablesTitle />
    <EnvironmentVariablesToggle />
  </EnvironmentVariablesHeader>
  <EnvironmentVariablesContent>
    <EnvironmentVariable name="API_KEY" value="sk-123abc">
      <EnvironmentVariableGroup>
        <EnvironmentVariableName />
        <EnvironmentVariableRequired />
      </EnvironmentVariableGroup>
      <EnvironmentVariableGroup>
        <EnvironmentVariableValue />
        <EnvironmentVariableCopyButton />
      </EnvironmentVariableGroup>
    </EnvironmentVariable>
  </EnvironmentVariablesContent>
</EnvironmentVariables>`,
		props: [
			{
				name: "showValues",
				type: "boolean",
				description: "Controlled visibility state for all variable values.",
			},
			{
				name: "defaultShowValues",
				type: "boolean",
				default: "false",
				description: "Initial visibility state when used uncontrolled.",
			},
			{
				name: "onShowValuesChange",
				type: "(show: boolean) => void",
				description: "Callback fired when visibility state changes.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "EnvironmentVariables", description: "Root container with visibility context provider." },
			{ name: "EnvironmentVariablesHeader", description: "Header row with title and toggle controls." },
			{ name: "EnvironmentVariablesTitle", description: "Title text, defaults to 'Environment Variables'." },
			{ name: "EnvironmentVariablesToggle", description: "Switch to toggle value visibility with eye icon." },
			{ name: "EnvironmentVariablesContent", description: "Content container with dividers between variables." },
			{ name: "EnvironmentVariable", description: "Individual variable row providing name/value context to children." },
			{ name: "EnvironmentVariableGroup", description: "Flex group for laying out name/value/action elements." },
			{ name: "EnvironmentVariableName", description: "Monospace variable name display." },
			{ name: "EnvironmentVariableValue", description: "Value display with automatic dot masking when hidden." },
			{ name: "EnvironmentVariableCopyButton", description: "Copy button with format options: value, name, or export." },
			{ name: "EnvironmentVariableRequired", description: "Badge indicating a variable is required." },
		],
		examples: [
			{ title: "With copy buttons", description: "Variables with individual copy buttons supporting value and export formats.", demoSlug: "environment-variables-demo-with-copy" },
			{ title: "With required badges", description: "Variables marked as required alongside optional ones.", demoSlug: "environment-variables-demo-with-required" },
			{ title: "Values revealed", description: "Custom title with values visible by default.", demoSlug: "environment-variables-demo-revealed" },
			{ title: "Minimal", description: "Default rendering without copy buttons or badges.", demoSlug: "environment-variables-demo-minimal" },
		],
	},

	"file-tree": {
		description:
			"A hierarchical file system explorer with expandable folders, file selection, custom icons, and inline action buttons. Supports both controlled and uncontrolled expand/select state.",
		usage: `import {
  FileTree,
  FileTreeFolder,
  FileTreeFile,
  FileTreeIcon,
  FileTreeName,
  FileTreeActions,
} from "@/components/ui-ai/file-tree";

<FileTree
  defaultExpanded={new Set(["src"])}
  selectedPath={selectedPath}
  onSelect={setSelectedPath}
>
  <FileTreeFolder path="src" name="src">
    <FileTreeFile path="src/index.ts" name="index.ts" />
    <FileTreeFile path="src/utils.ts" name="utils.ts" />
  </FileTreeFolder>
  <FileTreeFile path="package.json" name="package.json" />
</FileTree>`,
		props: [
			{
				name: "expanded",
				type: "Set<string>",
				description: "Controlled expanded folder paths.",
			},
			{
				name: "defaultExpanded",
				type: "Set<string>",
				default: "new Set()",
				description: "Default expanded folder paths for uncontrolled usage.",
			},
			{
				name: "selectedPath",
				type: "string",
				description: "Currently selected file or folder path.",
			},
			{
				name: "onSelect",
				type: "(path: string) => void",
				description: "Callback when a file or folder is selected.",
			},
			{
				name: "onExpandedChange",
				type: "(expanded: Set<string>) => void",
				description: "Callback when expanded folder paths change.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "FileTree", description: "Root container with tree role and expand/select context provider." },
			{ name: "FileTreeFolder", description: "Collapsible folder node with chevron, folder icon, and nested children." },
			{ name: "FileTreeFile", description: "Leaf file node with click/keyboard selection and optional custom icon." },
			{ name: "FileTreeIcon", description: "Inline icon wrapper for custom file or folder icons." },
			{ name: "FileTreeName", description: "Truncated text display for file or folder names." },
			{ name: "FileTreeActions", description: "Right-aligned action button container with click propagation isolation." },
		],
		examples: [
			{ title: "Project structure", description: "Nested folder hierarchy with multiple levels expanded.", demoSlug: "file-tree-demo-project" },
			{ title: "With selection", description: "Interactive file tree with controlled selection state.", demoSlug: "file-tree-demo-with-selection" },
			{ title: "Custom icons", description: "File-type-specific icons for code, image, JSON, and text files.", demoSlug: "file-tree-demo-custom-icons" },
			{ title: "With actions", description: "File rows with inline copy, download, and delete action buttons.", demoSlug: "file-tree-demo-with-actions" },
		],
	},

	controls: {
		description:
			"Themed zoom and fit-view controls for React Flow canvases. Wraps @xyflow/react Controls with ADS-aligned card styling, rounded buttons, and hover states.",
		usage: `import { Canvas } from "@/components/ui-ai/canvas";
import { Controls } from "@/components/ui-ai/controls";

<Canvas nodes={nodes} edges={edges}>
  <Controls />
</Canvas>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the controls container.",
			},
			{
				name: "showZoom",
				type: "boolean",
				default: "true",
				description: "Show zoom in/out buttons.",
			},
			{
				name: "showFitView",
				type: "boolean",
				default: "true",
				description: "Show fit-view button to center and scale content.",
			},
			{
				name: "showInteractive",
				type: "boolean",
				default: "true",
				description: "Show interactive toggle (lock/unlock) button.",
			},
			{
				name: "position",
				type: '"top-left" | "top-right" | "bottom-left" | "bottom-right"',
				default: '"bottom-left"',
				description: "Position of the controls overlay within the canvas.",
			},
		],
		subComponents: [
			{ name: "Controls", description: "Themed React Flow controls with card background, rounded buttons, and secondary hover states." },
		],
		examples: [
			{ title: "Default", description: "Controls with zoom, fit-view, and interactive toggle in bottom-left position.", demoSlug: "controls-demo-default" },
			{ title: "Position", description: "Controls placed in the bottom-right corner of the canvas.", demoSlug: "controls-demo-position" },
			{ title: "Zoom only", description: "Only zoom in/out buttons, fit-view and interactive toggle hidden.", demoSlug: "controls-demo-zoom-only" },
			{ title: "Fit only", description: "Only fit-view button, zoom and interactive toggle hidden.", demoSlug: "controls-demo-fit-only" },
		],
	},

	conversation: {
		description:
			"A bounded conversation surface with follow-to-latest behavior, user escape detection, empty-state scaffolding, a scroll-to-bottom affordance, and markdown export for transcript-style interfaces.",
		importStatement: `import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
  messagesToMarkdown,
} from "@/components/ui-ai/conversation";`,
		usage: `import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationScrollButton,
} from "@/components/ui-ai/conversation";
import { Message, MessageContent } from "@/components/ui-ai/message";

const messages = [
  { role: "user", content: "Summarize the latest conversation changes." },
  { role: "assistant", content: "I added the markdown export and updated the follow-to-bottom behavior." },
];

<Conversation className="h-80 rounded-xl border bg-background">
  <ConversationContent className="min-h-full pr-20">
    {messages.map((message) => (
      <Message
        key={\`\${message.role}-\${message.content}\`}
        from={message.role}
      >
        <MessageContent>{message.content}</MessageContent>
      </Message>
    ))}
  </ConversationContent>
  <ConversationDownload messages={messages} />
  <ConversationScrollButton />
</Conversation>`,
		props: [
			{
				name: "followMode",
				type: '"bottom" | "target"',
				default:
					'"bottom" (or `"target"` when `targetScrollTop` is provided)',
				description:
					"Controls whether the surface follows the true bottom edge or a computed target scroll position.",
			},
			{
				name: "initial",
				type: 'boolean | ScrollBehavior | "instant" | { damping: number; stiffness: number; mass: number }',
				default: '"smooth"',
				description:
					"Initial scroll behavior applied when the conversation mounts.",
			},
			{
				name: "resize",
				type: 'boolean | ScrollBehavior | "instant" | { damping: number; stiffness: number; mass: number }',
				default: '"smooth"',
				description:
					"Follow behavior used when the transcript height changes.",
			},
			{
				name: "targetScrollTop",
				type: "(defaultTargetTop: number, options: ConversationScrollTargetOptions) => number",
				description:
					"Overrides the computed follow target used by auto-scroll and the scroll-to-bottom action.",
			},
			{
				name: "messages",
				type: "ConversationMessage[] | UIMessage[]",
				description:
					"Transcript entries serialized by ConversationDownload and messagesToMarkdown.",
			},
			{
				name: "filename",
				type: "string",
				default: '"conversation.md"',
				description: "Download filename used for the markdown export.",
			},
			{
				name: "formatMessage",
				type: "(message: ConversationMessage | UIMessage, index: number) => string",
				description:
					"Custom serializer used to turn each message into markdown output.",
			},
			{
				name: "className",
				type: "string",
				description:
					"Additional classes applied to the conversation root or action buttons.",
			},
		],
		subComponents: [
			{
				name: "ConversationContent",
				description:
					"Scrollable inner viewport and message stack with stable scrollbar gutter handling.",
			},
			{
				name: "ConversationEmptyState",
				description:
					"Centered placeholder for empty transcripts and first-run states.",
			},
			{
				name: "ConversationScrollButton",
				description:
					"Floating jump-to-latest action that appears once the user scrolls away from the follow target.",
			},
			{
				name: "ConversationDownload",
				description:
					"Floating export action that downloads the current transcript as markdown.",
			},
			{
				name: "messagesToMarkdown",
				description:
					"Helper for generating markdown outside the built-in download button.",
			},
			{
				name: "useConversationContext",
				description:
					"Hook exposing the scroll refs, current bottom state, and scrollToBottom() for custom controls.",
			},
		],
		demoLayout: {
			previewContentWidth: "full",
		},
	},

	edge: {
		description:
			"Custom edge renderers for React Flow canvases. Provides Animated (bezier path with a flowing dot indicator) and Temporary (dashed stroke) edge variants for AI workflow visualization.",
		usage: `import { Canvas } from "@/components/ui-ai/canvas";
import { Edge } from "@/components/ui-ai/edge";

const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

<Canvas
  nodes={nodes}
  edges={edges}
  edgeTypes={edgeTypes}
  nodeTypes={nodeTypes}
/>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "id",
				type: "string",
				required: true,
				description: "Unique identifier for the edge (provided by React Flow).",
			},
			{
				name: "source",
				type: "string",
				required: true,
				description: "ID of the source node (provided by React Flow).",
			},
			{
				name: "target",
				type: "string",
				required: true,
				description: "ID of the target node (provided by React Flow).",
			},
			{
				name: "sourceX / sourceY",
				type: "number",
				description: "Coordinates of the source handle (provided by React Flow).",
			},
			{
				name: "targetX / targetY",
				type: "number",
				description: "Coordinates of the target handle (provided by React Flow).",
			},
			{
				name: "sourcePosition / targetPosition",
				type: "Position",
				description: "Handle position enum (Left, Right, Top, Bottom) from @xyflow/react.",
			},
			{
				name: "markerEnd",
				type: "string",
				description: "SVG marker reference for the edge endpoint (Animated only).",
			},
			{
				name: "style",
				type: "CSSProperties",
				description: "Inline styles applied to the base edge path (Animated only).",
			},
		],
		subComponents: [
			{ name: "Edge.Animated", description: "Bezier edge with a flowing dot that travels along the path on a 2s loop. Uses source/target handle positions for accurate routing." },
			{ name: "Edge.Temporary", description: "Dashed bezier edge indicating a pending or conditional connection. Uses a simple bezier path with strokeDasharray styling." },
		],
		examples: [
			{ title: "Animated", description: "Edge with a flowing dot indicator between two nodes.", demoSlug: "edge-demo-animated" },
			{ title: "Temporary", description: "Dashed edge indicating a conditional or pending connection.", demoSlug: "edge-demo-temporary" },
			{ title: "Mixed", description: "Both animated and temporary edges in a branching workflow.", demoSlug: "edge-demo-mixed" },
		],
	},

	"jsx-preview": {
		description:
			"Renders JSX strings dynamically using react-jsx-parser, supporting streaming scenarios where JSX may be incomplete. Automatically closes unclosed tags during streaming and supports custom component injection and error handling.",
		usage: `import {
  JSXPreview,
  JSXPreviewContent,
  JSXPreviewError,
} from "@/components/ui-ai/jsx-preview";

<JSXPreview jsx={jsxString} isStreaming={isStreaming} components={{ Button }}>
  <JSXPreviewContent />
  <JSXPreviewError />
</JSXPreview>`,
		props: [
			{
				name: "jsx",
				type: "string",
				required: true,
				description: "The JSX string to render.",
			},
			{
				name: "isStreaming",
				type: "boolean",
				default: "false",
				description: "When true, auto-completes unclosed tags so partial JSX renders safely during streaming.",
			},
			{
				name: "components",
				type: "Record<string, React.ComponentType>",
				description: "Custom components available within the rendered JSX scope.",
			},
			{
				name: "bindings",
				type: "Record<string, unknown>",
				description: "Variables and functions available within the JSX execution scope.",
			},
			{
				name: "onError",
				type: "(error: Error) => void",
				description: "Callback when parsing or rendering fails.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "JSXPreview", description: "Root provider with JSX processing, tag completion, and error state management." },
			{ name: "JSXPreviewContent", description: "Renders the parsed JSX output via react-jsx-parser with error deduplication." },
			{ name: "JSXPreviewError", description: "Displays error information when parsing fails. Accepts static children or a render function receiving the Error object." },
		],
		examples: [
			{ title: "Basic", description: "Static JSX string rendered dynamically.", demoSlug: "jsx-preview-demo-basic" },
			{ title: "Streaming", description: "Simulated streaming with automatic tag completion for partial JSX.", demoSlug: "jsx-preview-demo-streaming" },
			{ title: "Custom components", description: "Injecting shadcn Badge components into the JSX render scope.", demoSlug: "jsx-preview-demo-with-components" },
			{ title: "Error state", description: "Default error display when JSX references an unknown component.", demoSlug: "jsx-preview-demo-with-error" },
			{ title: "Custom error", description: "Custom error content with styled warning appearance.", demoSlug: "jsx-preview-demo-custom-error" },
		],
	},

	"mic-selector": {
		description:
			"A composable microphone selector dropdown built on Command and Popover primitives. Provides permission-aware device enumeration, real-time device detection, searchable device list, and intelligent hardware ID label parsing.",
		usage: `import {
  MicSelector,
  MicSelectorTrigger,
  MicSelectorValue,
  MicSelectorContent,
  MicSelectorInput,
  MicSelectorList,
  MicSelectorEmpty,
  MicSelectorItem,
  MicSelectorLabel,
  useAudioDevices,
} from "@/components/ui-ai/mic-selector";

<MicSelector>
  <MicSelectorTrigger className="w-[280px]">
    <MicSelectorValue />
  </MicSelectorTrigger>
  <MicSelectorContent>
    <MicSelectorInput />
    <MicSelectorList>
      {(devices) =>
        devices.length > 0 ? (
          devices.map((device) => (
            <MicSelectorItem key={device.deviceId} value={device.deviceId}>
              <MicSelectorLabel device={device} />
            </MicSelectorItem>
          ))
        ) : (
          <MicSelectorEmpty />
        )
      }
    </MicSelectorList>
  </MicSelectorContent>
</MicSelector>`,
		props: [
			{
				name: "value",
				type: "string",
				description: "Controlled selected device ID.",
			},
			{
				name: "defaultValue",
				type: "string",
				description: "Default selected device ID for uncontrolled usage.",
			},
			{
				name: "onValueChange",
				type: "(value: string | undefined) => void",
				description: "Callback fired when the selected device changes.",
			},
			{
				name: "open",
				type: "boolean",
				description: "Controlled open state of the popover.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				description: "Callback fired when the popover open state changes.",
			},
		],
		subComponents: [
			{ name: "MicSelector", description: "Root provider wrapping a Popover. Manages device enumeration, permission requests, and selection state." },
			{ name: "MicSelectorTrigger", description: "Outline button trigger with chevron icon and ResizeObserver-synced width." },
			{ name: "MicSelectorValue", description: "Displays the selected device label or a placeholder." },
			{ name: "MicSelectorContent", description: "Popover content wrapping a Command for searchable selection." },
			{ name: "MicSelectorInput", description: "Search input for filtering the device list." },
			{ name: "MicSelectorList", description: "Device list container with render-prop children receiving MediaDeviceInfo[]." },
			{ name: "MicSelectorEmpty", description: "Empty state shown when no devices match the search." },
			{ name: "MicSelectorItem", description: "Individual selectable device item." },
			{ name: "MicSelectorLabel", description: "Device label with intelligent hardware ID parsing (extracts XXXX:XXXX format)." },
		],
		examples: [
			{ title: "Controlled", description: "Controlled selector showing the selected device ID below.", demoSlug: "mic-selector-demo-controlled" },
			{ title: "With checkmark", description: "Selector with a check icon next to the active device.", demoSlug: "mic-selector-demo-with-checkmark" },
			{ title: "Compact", description: "Small-sized trigger without search input.", demoSlug: "mic-selector-demo-compact" },
		],
	},

	"inline-citation": {
		description:
			"An inline citation system for AI-generated text that displays source references as hover-triggered badges with a carousel of source details, quotes, and descriptions.",
		usage: `import {
  InlineCitation,
  InlineCitationText,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselHeader,
  InlineCitationCarouselItem,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationQuote,
} from "@/components/ui-ai/inline-citation";

<InlineCitation>
  <InlineCitationText>React uses a virtual DOM</InlineCitationText>
  <InlineCitationCard>
    <InlineCitationCardTrigger sources={["https://react.dev"]} />
    <InlineCitationCardBody>
      <InlineCitationCarousel>
        <InlineCitationCarouselContent>
          <InlineCitationCarouselItem>
            <InlineCitationSource
              title="React Docs"
              url="https://react.dev"
              description="Official React documentation."
            />
          </InlineCitationCarouselItem>
        </InlineCitationCarouselContent>
      </InlineCitationCarousel>
    </InlineCitationCardBody>
  </InlineCitationCard>
</InlineCitation>`,
		props: [
			{
				name: "sources",
				type: "string[]",
				required: true,
				description: "Array of source URLs displayed on InlineCitationCardTrigger. The first URL hostname is shown as the badge label; additional sources show as a +N count.",
			},
			{
				name: "title",
				type: "string",
				description: "Source title displayed in InlineCitationSource.",
			},
			{
				name: "url",
				type: "string",
				description: "Source URL displayed in InlineCitationSource.",
			},
			{
				name: "description",
				type: "string",
				description: "Brief source description displayed in InlineCitationSource.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes applied to any sub-component.",
			},
		],
		subComponents: [
			{ name: "InlineCitation", description: "Root inline container grouping text and citation badge." },
			{ name: "InlineCitationText", description: "Text span that highlights on group hover." },
			{ name: "InlineCitationCard", description: "HoverCard wrapper managing open/close with zero delay." },
			{ name: "InlineCitationCardTrigger", description: "Badge trigger showing hostname and source count from the sources prop." },
			{ name: "InlineCitationCardBody", description: "HoverCard content panel (w-80, no padding)." },
			{ name: "InlineCitationCarousel", description: "Carousel wrapper with internal API context for multi-source navigation." },
			{ name: "InlineCitationCarouselContent", description: "Carousel content container." },
			{ name: "InlineCitationCarouselItem", description: "Individual carousel slide for a single source." },
			{ name: "InlineCitationCarouselHeader", description: "Navigation header with prev/next buttons and index indicator." },
			{ name: "InlineCitationCarouselIndex", description: "Position indicator displaying current/total (e.g., 1/3)." },
			{ name: "InlineCitationCarouselPrev", description: "Previous source navigation button." },
			{ name: "InlineCitationCarouselNext", description: "Next source navigation button." },
			{ name: "InlineCitationSource", description: "Source metadata display with title, URL, and description." },
			{ name: "InlineCitationQuote", description: "Blockquote for source excerpts with left border styling." },
		],
		examples: [
			{ title: "With carousel", description: "Multi-source citation with carousel navigation, descriptions, and a quote.", demoSlug: "inline-citation-demo-with-carousel" },
			{ title: "Basic", description: "Minimal inline citation badge without hover card body.", demoSlug: "inline-citation-demo-basic" },
			{ title: "Multiple citations", description: "Paragraph with two separate inline citations referencing different topics.", demoSlug: "inline-citation-demo-multiple" },
			{ title: "Single source", description: "Single-source citation with description and quote excerpt.", demoSlug: "inline-citation-demo-single-source" },
		],
	},

	"model-selector": {
		description:
			"A searchable command palette for selecting AI models, built on cmdk with fuzzy search, keyboard navigation, grouped provider organization, and provider logos fetched from models.dev.",
		usage: `import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorSeparator,
} from "@/components/ui-ai/model-selector";

<ModelSelector>
  <ModelSelectorTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
    <ModelSelectorLogoGroup>
      <ModelSelectorLogo provider="anthropic" />
    </ModelSelectorLogoGroup>
    Claude 4 Sonnet
  </ModelSelectorTrigger>
  <ModelSelectorContent>
    <ModelSelectorInput placeholder="Search models..." />
    <ModelSelectorList>
      <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
      <ModelSelectorGroup heading="Anthropic">
        <ModelSelectorItem value="claude-4-sonnet" onSelect={() => setModel("claude-4-sonnet")}>
          <ModelSelectorLogo provider="anthropic" />
          <ModelSelectorName>Claude 4 Sonnet</ModelSelectorName>
        </ModelSelectorItem>
      </ModelSelectorGroup>
    </ModelSelectorList>
  </ModelSelectorContent>
</ModelSelector>`,
		props: [
			{
				name: "children",
				type: "ReactNode",
				required: true,
				description: "ModelSelectorTrigger and ModelSelectorContent sub-components.",
			},
			{
				name: "open",
				type: "boolean",
				description: "Controlled open state for the dialog.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				description: "Callback when dialog open state changes.",
			},
		],
		subComponents: [
			{ name: "ModelSelector", description: "Root Dialog wrapper." },
			{ name: "ModelSelectorTrigger", description: "Button trigger to open the command palette." },
			{ name: "ModelSelectorContent", description: "Dialog content with embedded Command, configurable title (default: 'Model Selector')." },
			{ name: "ModelSelectorDialog", description: "Alternative CommandDialog wrapper." },
			{ name: "ModelSelectorInput", description: "Search input with fuzzy filtering." },
			{ name: "ModelSelectorList", description: "Scrollable list container for groups and items." },
			{ name: "ModelSelectorEmpty", description: "Fallback content when search yields no results." },
			{ name: "ModelSelectorGroup", description: "Provider category group with heading." },
			{ name: "ModelSelectorItem", description: "Individual model option with value and onSelect callback." },
			{ name: "ModelSelectorName", description: "Truncated model name text." },
			{ name: "ModelSelectorLogo", description: "Provider logo fetched from models.dev/logos. Supports autocomplete-friendly provider union type." },
			{ name: "ModelSelectorLogoGroup", description: "Stacked logo container with overlapping ring styling." },
			{ name: "ModelSelectorShortcut", description: "Keyboard shortcut display alongside an item." },
			{ name: "ModelSelectorSeparator", description: "Visual separator between groups." },
		],
		examples: [
			{ title: "With search", description: "Searchable model palette with grouped providers, selection state, and empty state.", demoSlug: "model-selector-demo-with-search" },
			{ title: "With logos", description: "Provider logos on trigger and items with separators between groups.", demoSlug: "model-selector-demo-with-logos" },
			{ title: "Multi-provider trigger", description: "Trigger showing stacked logos from multiple providers.", demoSlug: "model-selector-demo-multi-provider" },
		],
	},

	"package-info": {
		description:
			"A compound component for displaying package dependency information with version transitions (current → new), color-coded change type badges (major, minor, patch, added, removed), optional descriptions, and a dependencies list.",
		usage: `import {
  PackageInfo,
  PackageInfoHeader,
  PackageInfoName,
  PackageInfoChangeType,
  PackageInfoVersion,
  PackageInfoDescription,
  PackageInfoContent,
  PackageInfoDependencies,
  PackageInfoDependency,
} from "@/components/ui-ai/package-info";

<PackageInfo name="react" currentVersion="18.2.0" newVersion="19.0.0" changeType="major">
  <PackageInfoHeader>
    <PackageInfoName />
    <PackageInfoChangeType />
  </PackageInfoHeader>
  <PackageInfoVersion />
  <PackageInfoDescription>
    A JavaScript library for building user interfaces.
  </PackageInfoDescription>
</PackageInfo>`,
		props: [
			{
				name: "name",
				type: "string",
				required: true,
				description: "Package name displayed via PackageInfoName.",
			},
			{
				name: "currentVersion",
				type: "string",
				description: "Currently installed version shown in the version transition.",
			},
			{
				name: "newVersion",
				type: "string",
				description: "Target version shown after the arrow in the version transition.",
			},
			{
				name: "changeType",
				type: '"major" | "minor" | "patch" | "added" | "removed"',
				description: "Change category that controls badge color and icon.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "PackageInfo", description: "Root container with context provider for name, versions, and change type." },
			{ name: "PackageInfoHeader", description: "Flex row for package name and change type badge." },
			{ name: "PackageInfoName", description: "Package name with package icon. Defaults to name from context." },
			{ name: "PackageInfoChangeType", description: "Color-coded badge showing the change category with icon." },
			{ name: "PackageInfoVersion", description: "Version transition display (e.g., 18.2.0 → 19.0.0)." },
			{ name: "PackageInfoDescription", description: "Paragraph element for package description text." },
			{ name: "PackageInfoContent", description: "Content area with top border separator." },
			{ name: "PackageInfoDependencies", description: "Container with 'Dependencies' label and stacked dependency rows." },
			{ name: "PackageInfoDependency", description: "Individual dependency row with name and optional version." },
		],
		examples: [
			{ title: "Full", description: "Package card with version transition, change badge, description, and dependencies list.", demoSlug: "package-info-demo-full" },
			{ title: "Change types", description: "All five change type variants: major, minor, patch, added, and removed.", demoSlug: "package-info-demo-change-types" },
			{ title: "With dependencies", description: "Package with a dependencies section listing related packages.", demoSlug: "package-info-demo-with-dependencies" },
			{ title: "Minimal", description: "Header-only package card with name and version arrow.", demoSlug: "package-info-demo-minimal" },
		],
	},

	"open-in-chat": {
		description:
			"A dropdown menu that lets users open a query in different AI chat platforms with a single click. Supports ChatGPT, Claude, T3 Chat, Scira AI, v0, and Cursor with branded icons and automatic URL parameter encoding.",
		usage: `import {
  OpenIn,
  OpenInTrigger,
  OpenInContent,
  OpenInChatGPT,
  OpenInClaude,
  OpenInT3,
  OpenInScira,
  OpenInv0,
  OpenInCursor,
  OpenInLabel,
  OpenInSeparator,
} from "@/components/ui-ai/open-in-chat";

<OpenIn query="Explain React hooks">
  <OpenInTrigger />
  <OpenInContent>
    <OpenInLabel>AI Assistants</OpenInLabel>
    <OpenInSeparator />
    <OpenInChatGPT />
    <OpenInClaude />
    <OpenInCursor />
  </OpenInContent>
</OpenIn>`,
		props: [
			{
				name: "query",
				type: "string",
				required: true,
				description: "The query text sent to all AI platforms via URL parameters.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the dropdown content via OpenInContent.",
			},
		],
		subComponents: [
			{ name: "OpenIn", description: "Root provider wrapping DropdownMenu. Supplies query via React Context to all platform items." },
			{ name: "OpenInTrigger", description: "Outline button trigger with 'Open in chat' label and chevron. Accepts custom children to override." },
			{ name: "OpenInContent", description: "Dropdown content panel (240px wide) aligned to start." },
			{ name: "OpenInChatGPT", description: "Menu item linking to ChatGPT with OpenAI icon." },
			{ name: "OpenInClaude", description: "Menu item linking to Claude with Anthropic icon." },
			{ name: "OpenInT3", description: "Menu item linking to T3 Chat." },
			{ name: "OpenInScira", description: "Menu item linking to Scira AI with branded icon." },
			{ name: "OpenInv0", description: "Menu item linking to v0 with Vercel icon." },
			{ name: "OpenInCursor", description: "Menu item linking to Cursor with branded icon." },
			{ name: "OpenInItem", description: "Generic menu item for custom platform entries." },
			{ name: "OpenInLabel", description: "Section label wrapped in a DropdownMenuGroup." },
			{ name: "OpenInSeparator", description: "Visual separator between menu sections." },
		],
		examples: [
			{ title: "All providers", description: "Dropdown with all six AI platform options and a section label.", demoSlug: "open-in-chat-demo-all-providers" },
			{ title: "Minimal", description: "Two-provider dropdown without labels or separators.", demoSlug: "open-in-chat-demo-minimal" },
			{ title: "Custom trigger", description: "Custom trigger button with a send icon and 'Ask AI' label.", demoSlug: "open-in-chat-demo-custom-trigger" },
			{ title: "Grouped", description: "Providers organized into Chat, Code, and Search sections.", demoSlug: "open-in-chat-demo-grouped" },
		],
	},

	node: {
		description:
			"A composable, Card-based node for React Flow canvases. Supports connection handles (target/source), structured layouts with header, content, and footer sections, and consistent styling via shadcn/ui Card primitives.",
		usage: `import {
  Node, NodeHeader, NodeTitle, NodeDescription,
  NodeAction, NodeContent, NodeFooter,
} from "@/components/ui-ai/node";

<Node handles={{ target: true, source: true }}>
  <NodeHeader>
    <NodeTitle>Process Data</NodeTitle>
    <NodeDescription>Transform input</NodeDescription>
  </NodeHeader>
  <NodeContent>
    <p className="text-sm">Validating records</p>
  </NodeContent>
  <NodeFooter>
    <p className="text-xs text-muted-foreground">Duration: ~2.5s</p>
  </NodeFooter>
</Node>`,
		props: [
			{
				name: "handles",
				type: "{ target: boolean; source: boolean }",
				required: true,
				description: "Connection handle configuration. Target renders on the left, source on the right.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root Card container.",
			},
			{
				name: "children",
				type: "ReactNode",
				description: "NodeHeader, NodeContent, and NodeFooter sub-components.",
			},
		],
		subComponents: [
			{ name: "Node", description: "Root Card container with fixed small width, connection handles, and rounded styling." },
			{ name: "NodeHeader", description: "Header section with secondary background and bottom border. Wraps CardHeader." },
			{ name: "NodeTitle", description: "Title text. Wraps CardTitle." },
			{ name: "NodeDescription", description: "Description text below the title. Wraps CardDescription." },
			{ name: "NodeAction", description: "Action slot positioned at the top-right of the header. Wraps CardAction." },
			{ name: "NodeContent", description: "Main content area with padding. Wraps CardContent." },
			{ name: "NodeFooter", description: "Footer section with secondary background and top border. Wraps CardFooter." },
		],
		examples: [
			{ title: "Full", description: "Node with header, content, footer, and both target/source handles.", demoSlug: "node-demo-full" },
			{ title: "Header only", description: "Minimal node with only title and description.", demoSlug: "node-demo-header-only" },
			{ title: "With action", description: "Node with a header action button for copy.", demoSlug: "node-demo-with-action" },
			{ title: "With badge", description: "Node with rich content including a status badge.", demoSlug: "node-demo-with-badge" },
		],
	},

	"schema-display": {
		description:
			"A compound component for visualizing REST API endpoints with color-coded HTTP method badges, path parameter highlighting, collapsible parameters/request/response sections, and recursive nested property display.",
		usage: `import {
  SchemaDisplay,
  SchemaDisplayHeader,
  SchemaDisplayMethod,
  SchemaDisplayPath,
  SchemaDisplayDescription,
  SchemaDisplayContent,
  SchemaDisplayParameters,
  SchemaDisplayRequest,
  SchemaDisplayResponse,
  SchemaDisplayProperty,
  SchemaDisplayExample,
} from "@/components/ui-ai/schema-display";

<SchemaDisplay
  method="GET"
  path="/api/users/{id}"
  description="Retrieve a user by their unique identifier."
  parameters={[
    { name: "id", type: "string", required: true, location: "path" },
  ]}
  responseBody={[
    { name: "id", type: "string", required: true },
    { name: "name", type: "string", required: true },
    { name: "email", type: "string", required: true },
  ]}
/>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "method",
				type: '"GET" | "POST" | "PUT" | "PATCH" | "DELETE"',
				required: true,
				description: "HTTP method displayed as a color-coded badge.",
			},
			{
				name: "path",
				type: "string",
				required: true,
				description: "API endpoint path. Parameters in {braces} are highlighted.",
			},
			{
				name: "description",
				type: "string",
				description: "Endpoint description shown below the header.",
			},
			{
				name: "parameters",
				type: "SchemaParameter[]",
				description: "URL, query, or header parameters with name, type, required, description, and location.",
			},
			{
				name: "requestBody",
				type: "SchemaProperty[]",
				description: "Request body properties with recursive nesting support.",
			},
			{
				name: "responseBody",
				type: "SchemaProperty[]",
				description: "Response body properties with recursive nesting support.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "SchemaDisplay", description: "Root container with context provider for method, path, parameters, and body schemas." },
			{ name: "SchemaDisplayHeader", description: "Header row for method badge and path." },
			{ name: "SchemaDisplayMethod", description: "Color-coded HTTP method badge (GET=green, POST=blue, PUT=orange, PATCH=yellow, DELETE=red)." },
			{ name: "SchemaDisplayPath", description: "Monospace endpoint path with highlighted {parameters}." },
			{ name: "SchemaDisplayDescription", description: "Endpoint description paragraph below the header." },
			{ name: "SchemaDisplayContent", description: "Content area with divided sections." },
			{ name: "SchemaDisplayParameters", description: "Collapsible parameters section with count badge." },
			{ name: "SchemaDisplayParameter", description: "Individual parameter row with name, type, location, and required badges." },
			{ name: "SchemaDisplayRequest", description: "Collapsible request body section." },
			{ name: "SchemaDisplayResponse", description: "Collapsible response body section." },
			{ name: "SchemaDisplayProperty", description: "Recursive property display with collapsible nested objects and arrays." },
			{ name: "SchemaDisplayBody", description: "Generic body container with dividers." },
			{ name: "SchemaDisplayExample", description: "Preformatted code example block." },
		],
		examples: [
			{ title: "With parameters", description: "GET endpoint with path, query, and header parameters.", demoSlug: "schema-display-demo-with-params" },
			{ title: "Request and response", description: "POST endpoint with request body and response schema.", demoSlug: "schema-display-demo-with-body" },
			{ title: "Nested properties", description: "Complex schema with nested objects and arrays.", demoSlug: "schema-display-demo-nested" },
			{ title: "HTTP methods", description: "All five HTTP method variants with color-coded badges.", demoSlug: "schema-display-demo-methods" },
			{ title: "Custom composition", description: "Selective sub-component rendering with explicit children.", demoSlug: "schema-display-demo-custom-composition" },
		],
	},

	shimmer: {
		demoLayout: { previewContentWidth: "full" },
		description:
			"An animated text shimmer effect that sweeps across content, ideal for indicating loading states or drawing attention to dynamic content in AI applications. Supports optional wave motion with full geometry, timing, and color controls inspired by Motion Primitives.",
		usage: `import { Shimmer } from "@/components/ui-ai/shimmer";

<Shimmer>Thinking...</Shimmer>
<Shimmer duration={1} as="span">Fast shimmer</Shimmer>
<Shimmer spread={4} className="text-lg">Wide spread shimmer</Shimmer>
<Shimmer wave duration={1.2}>Shimmer with wave</Shimmer>
<Shimmer
  wave
  baseColor="var(--color-muted-foreground)"
  baseGradientColor={["#1868db", "#bf63f3", "#fca700"]}
  xDistance={3}
  yDistance={-2}
  zDistance={12}
  scaleDistance={1.12}
  rotateYDistance={14}
  transition={{ ease: "easeInOut", repeatDelay: 0.1 }}
>
  Full wave configuration
</Shimmer>`,
		props: [
			{
				name: "children",
				type: "string",
				required: true,
				description: "The text content receiving the shimmer effect.",
			},
			{
				name: "as",
				type: "ElementType",
				default: '"p"',
				description: "HTML element or React component to render as.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes for styling.",
			},
			{
				name: "duration",
				type: "number",
				default: "2 (shimmer), 1 (wave)",
				description: "Animation duration in seconds.",
			},
			{
				name: "spread",
				type: "number",
				default: "2 (shimmer), 1 (wave)",
				description: "Shimmer gradient spread multiplier and wave stagger spread.",
			},
			{
				name: "wave",
				type: "boolean",
				default: "false",
				description: "Enables an additional per-character wave animation layered on top of the shimmer effect.",
			},
			{
				name: "baseColor",
				type: "string",
				description: "Base/resting text color used by wave mode.",
			},
			{
				name: "baseGradientColor",
				type: "string | string[]",
				description: "Highlight color (or color stops) used by wave mode.",
			},
			{
				name: "zDistance",
				type: "number",
				default: "10",
				description: "Wave depth translation on the Z axis.",
			},
			{
				name: "xDistance",
				type: "number",
				default: "2",
				description: "Wave horizontal translation distance.",
			},
			{
				name: "yDistance",
				type: "number",
				default: "-2",
				description: "Wave vertical translation distance.",
			},
			{
				name: "scaleDistance",
				type: "number",
				default: "1.1",
				description: "Peak scale multiplier for wave characters.",
			},
			{
				name: "rotateYDistance",
				type: "number",
				default: "10",
				description: "Peak Y-axis rotation for wave characters.",
			},
			{
				name: "transition",
				type: "Transition",
				description: "Optional Motion transition overrides for wave characters.",
			},
		],
		subComponents: [
			{ name: "Shimmer", description: "Memoized motion component with infinite linear gradient sweep across text, and optional wave-only foreground animation when wave mode is enabled." },
		],
		examples: [
			{ title: "Custom duration", description: "Shimmer with varying animation speeds: fast (1s), slow (3s), and very slow (5s).", demoSlug: "shimmer-demo-custom-duration" },
			{ title: "Custom spread", description: "Shimmer with narrow, wide, and extra wide gradient spread.", demoSlug: "shimmer-demo-custom-spread" },
			{ title: "Wave", description: "Shimmer with optional wave motion enabled.", demoSlug: "shimmer-demo-wave" },
			{ title: "Wave colors", description: "Neutral wave plus a dot-inspired gradient highlight using baseColor/baseGradientColor.", demoSlug: "shimmer-demo-wave-colors" },
			{ title: "Wave geometry", description: "Compare xDistance and yDistance permutations.", demoSlug: "shimmer-demo-wave-geometry" },
			{ title: "Wave depth", description: "Compare zDistance, scaleDistance, and rotateYDistance permutations.", demoSlug: "shimmer-demo-wave-depth" },
			{ title: "Wave timing and spread", description: "Compare duration and spread permutations in wave mode.", demoSlug: "shimmer-demo-wave-timing-spread" },
			{ title: "Wave full config", description: "Single showcase combining all wave controls including transition override.", demoSlug: "shimmer-demo-wave-full-config" },
			{ title: "Polymorphic", description: "Shimmer rendered as heading and span elements with different text sizes.", demoSlug: "shimmer-demo-heading" },
		],
	},

	snippet: {
		description:
			"A lightweight composable snippet for displaying terminal commands and short code strings with copy-to-clipboard functionality. Built on InputGroup primitives with optional prefix text and animated copy state.",
		usage: `import {
  Snippet,
  SnippetAddon,
  SnippetText,
  SnippetInput,
  SnippetCopyButton,
} from "@/components/ui-ai/snippet";

<Snippet code="npm install ai">
  <SnippetAddon>
    <SnippetText>$</SnippetText>
  </SnippetAddon>
  <SnippetInput />
  <SnippetCopyButton />
</Snippet>`,
		props: [
			{
				name: "code",
				type: "string",
				required: true,
				description: "The code content to display and copy.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root InputGroup container.",
			},
			{
				name: "children",
				type: "ReactNode",
				description: "SnippetAddon, SnippetInput, and SnippetCopyButton sub-components.",
			},
		],
		subComponents: [
			{ name: "Snippet", description: "Root provider wrapping InputGroup. Supplies code value via React Context to SnippetInput and SnippetCopyButton." },
			{ name: "SnippetAddon", description: "Wrapper for supplementary elements like prefix text. Delegates to InputGroupAddon." },
			{ name: "SnippetText", description: "Prefix text display (e.g., '$' for terminal prompts). Delegates to InputGroupText." },
			{ name: "SnippetInput", description: "Read-only input displaying the code string. Value and readOnly are set automatically from context." },
			{ name: "SnippetCopyButton", description: "Copy-to-clipboard button with animated check icon on success. Accepts onCopy, onError, and timeout props." },
		],
		examples: [
			{ title: "Without prefix", description: "Plain snippet without terminal prompt prefix.", demoSlug: "snippet-demo-plain" },
			{ title: "Multiple commands", description: "Stacked snippets for multi-step install instructions.", demoSlug: "snippet-demo-multiple" },
			{ title: "With callbacks", description: "Snippet with onCopy/onError callbacks and custom timeout.", demoSlug: "snippet-demo-callbacks" },
		],
	},

	"speech-input": {
		description:
			"A voice input button with animated pulse rings and automatic browser capability detection. Uses Web Speech API (Chrome/Edge) or MediaRecorder fallback (Firefox/Safari) with external transcription service support.",
		usage: `import { SpeechInput } from "@/components/ui-ai/speech-input";

<SpeechInput
  onTranscriptionChange={(text) => console.log(text)}
  onAudioRecorded={async (blob) => {
    // Send blob to transcription API, return text
    return "transcribed text";
  }}
  lang="en-US"
/>`,
		props: [
			{
				name: "onTranscriptionChange",
				type: "(text: string) => void",
				description: "Callback fired when final transcription is available. Does not fire for interim results.",
			},
			{
				name: "onAudioRecorded",
				type: "(audioBlob: Blob) => Promise<string>",
				description: "Required for Firefox/Safari. Receives audio Blob (audio/webm) and should return transcribed text from an external service.",
			},
			{
				name: "lang",
				type: "string",
				default: '"en-US"',
				description: "BCP 47 language tag for speech recognition.",
			},
			{
				name: "...props",
				type: "ComponentProps<typeof Button>",
				description: "All Button props (variant, size, disabled, className) are forwarded.",
			},
		],
		subComponents: [
			{ name: "SpeechInput", description: "Standalone button with mic/stop icon, animated pulse rings when listening, and spinner when processing audio." },
		],
		examples: [
			{ title: "With transcript", description: "Speech input that displays transcribed text below the button.", demoSlug: "speech-input-demo-with-transcript" },
			{ title: "Sizes", description: "Small, default, and large button sizes.", demoSlug: "speech-input-demo-sizes" },
			{ title: "Disabled", description: "Disabled state when speech input is unavailable.", demoSlug: "speech-input-demo-disabled" },
		],
	},

	sources: {
		description:
			"A collapsible component that allows users to view the sources or citations used to generate an AI response. Built on Collapsible with animated expand/collapse and customizable trigger and content areas.",
		usage: `import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ui-ai/sources";

<Sources>
  <SourcesTrigger count={3} />
  <SourcesContent>
    <Source href="https://react.dev" title="React Documentation" />
    <Source href="https://developer.mozilla.org" title="MDN Web Docs" />
    <Source href="https://www.typescriptlang.org/docs" title="TypeScript Handbook" />
  </SourcesContent>
</Sources>`,
		props: [
			{
				name: "count",
				type: "number",
				required: true,
				description: "The number of sources displayed in the trigger label.",
			},
			{
				name: "href",
				type: "string",
				description: "URL for an individual Source link. Opens in a new tab with rel=\"noreferrer\".",
			},
			{
				name: "title",
				type: "string",
				description: "Display title for an individual Source when using default rendering.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes applied to any sub-component.",
			},
		],
		subComponents: [
			{ name: "Sources", description: "Root Collapsible wrapper with default text styling." },
			{ name: "SourcesTrigger", description: "Collapsible trigger button displaying \"Used N sources\" label with chevron icon. Accepts children to override default rendering." },
			{ name: "SourcesContent", description: "Animated collapsible content container with slide-in/slide-out transitions." },
			{ name: "Source", description: "Individual source link opening in a new tab. Renders a BookIcon + title by default, or custom children." },
		],
		examples: [
			{ title: "Custom rendering", description: "Sources with custom trigger label, external link icons, and custom source titles.", demoSlug: "sources-demo-custom-rendering" },
		],
	},

	"stack-trace": {
		description:
			"A compound component for displaying parsed JavaScript/Node.js error stack traces with collapsible frames, clickable file paths, internal-frame dimming, and copy-to-clipboard. Parses raw stack trace strings into structured error type, message, and frame data.",
		usage: `import {
  StackTrace,
  StackTraceHeader,
  StackTraceError,
  StackTraceErrorType,
  StackTraceErrorMessage,
  StackTraceActions,
  StackTraceCopyButton,
  StackTraceExpandButton,
  StackTraceContent,
  StackTraceFrames,
} from "@/components/ui-ai/stack-trace";

<StackTrace trace={errorString} defaultOpen>
  <StackTraceHeader>
    <StackTraceError>
      <StackTraceErrorType />
      <StackTraceErrorMessage />
    </StackTraceError>
    <StackTraceActions>
      <StackTraceCopyButton />
      <StackTraceExpandButton />
    </StackTraceActions>
  </StackTraceHeader>
  <StackTraceContent>
    <StackTraceFrames />
  </StackTraceContent>
</StackTrace>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "trace",
				type: "string",
				required: true,
				description: "Raw stack trace string to parse and display.",
			},
			{
				name: "open",
				type: "boolean",
				description: "Controlled open/closed state for the collapsible frames section.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				default: "false",
				description: "Initial open state when uncontrolled.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				description: "Callback fired when the collapse state changes.",
			},
			{
				name: "onFilePathClick",
				type: "(path: string, line?: number, column?: number) => void",
				description: "Callback when a file path in a stack frame is clicked. Enables clickable file paths for IDE integration.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "StackTrace", description: "Root provider and container. Parses the raw trace string and supplies context to all sub-components." },
			{ name: "StackTraceHeader", description: "Clickable header row that toggles the collapsible content. Wraps CollapsibleTrigger." },
			{ name: "StackTraceError", description: "Flex container for the error icon, type, and message." },
			{ name: "StackTraceErrorType", description: "Displays the parsed error type (e.g., 'TypeError'). Falls back to context value when no children provided." },
			{ name: "StackTraceErrorMessage", description: "Displays the parsed error message text. Falls back to context value when no children provided." },
			{ name: "StackTraceActions", description: "Container for action buttons with click/keydown event isolation." },
			{ name: "StackTraceCopyButton", description: "Copies the full raw stack trace to clipboard with animated check icon feedback." },
			{ name: "StackTraceExpandButton", description: "Chevron icon that rotates to indicate expand/collapse state." },
			{ name: "StackTraceContent", description: "Collapsible content area with max-height scroll and fade animations." },
			{ name: "StackTraceFrames", description: "Renders parsed stack frames with function names, clickable file paths, and dimmed internal (node_modules/node:) frames." },
		],
		examples: [
			{ title: "Expanded", description: "Stack trace with frames visible by default.", demoSlug: "stack-trace-demo-open" },
			{ title: "Filter internals", description: "Hides node_modules and Node.js internal frames.", demoSlug: "stack-trace-demo-filter-internals" },
			{ title: "Clickable paths", description: "File paths trigger a callback for IDE integration.", demoSlug: "stack-trace-demo-clickable" },
		],
	},

	suggestion: {
		description:
			"Clickable suggestion chips that present follow-up prompts or quick actions to users. Supports horizontal scrollable and vertical stacked layouts via the Suggestions container, with each Suggestion rendered as a rounded pill Button.",
		usage: `import { Suggestions, Suggestion } from "@/components/ui-ai/suggestion";

<Suggestions>
  <Suggestion suggestion="Tell me a joke" />
  <Suggestion suggestion="Explain AI" />
  <Suggestion suggestion="Write code" />
</Suggestions>

// Vertical layout (right-aligned, for follow-up suggestions)
<Suggestions orientation="vertical">
  <Suggestion suggestion="How does this work?" />
  <Suggestion suggestion="Show me an example" />
</Suggestions>`,
		props: [
			{
				name: "suggestion",
				type: "string",
				required: true,
				description: "The suggestion text to display and emit on click.",
			},
			{
				name: "onClick",
				type: "(suggestion: string) => void",
				description: "Callback fired with the suggestion string when clicked.",
			},
			{
				name: "variant",
				type: "ButtonProps[\"variant\"]",
				default: '"outline"',
				description: "Button variant passed to the underlying Button component.",
			},
			{
				name: "size",
				type: "ButtonProps[\"size\"]",
				default: '"sm"',
				description: "Button size passed to the underlying Button component.",
			},
			{
				name: "children",
				type: "ReactNode",
				description: "Custom content. Falls back to the suggestion text when not provided.",
			},
		],
		subComponents: [
			{ name: "Suggestions", description: "Container that arranges Suggestion chips. Horizontal (default) uses ScrollArea; vertical stacks right-aligned." },
			{ name: "Suggestion", description: "Individual clickable suggestion button rendered as a rounded pill." },
		],
		examples: [
			{ title: "Vertical", description: "Right-aligned vertical stack with icons, matching the plan follow-up suggestion pattern.", demoSlug: "suggestion-demo-vertical" },
			{ title: "With icons", description: "Horizontal suggestions with leading icons using the same button styling as the vertical follow-up pattern.", demoSlug: "suggestion-demo-with-icons" },
		],
	},

	tool: {
		description:
			"A collapsible container for displaying AI tool invocation details including parameters and execution results. Integrates with the AI SDK's ToolUIPart and DynamicToolUIPart types to show tool execution progress, status badges, and formatted JSON input/output.",
		usage: `import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ui-ai/tool";

<Tool defaultOpen>
  <ToolHeader type="tool-invocation" state="output-available" title="fetch_weather_data" />
  <ToolContent>
    <ToolInput input={{ location: "San Francisco", units: "fahrenheit" }} />
    <ToolOutput output={{ temperature: 64, condition: "Partly Cloudy" }} errorText={undefined} />
  </ToolContent>
</Tool>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "type",
				type: '"tool-invocation" | "dynamic-tool"',
				required: true,
				description: "Tool part type from the AI SDK. Determines how the tool name is derived.",
			},
			{
				name: "state",
				type: '"input-streaming" | "input-available" | "output-available" | "output-error" | "approval-requested" | "approval-responded" | "output-denied"',
				required: true,
				description: "Current tool execution state. Controls the status badge icon and label.",
			},
			{
				name: "title",
				type: "string",
				description: "Custom display name for the tool. Falls back to derived name from the type string.",
			},
			{
				name: "toolName",
				type: "string",
				description: "Required for dynamic-tool type. Provides the tool name when type is 'dynamic-tool'.",
			},
			{
				name: "input",
				type: "object",
				description: "Tool parameter data object. Rendered as formatted JSON inside ToolInput.",
			},
			{
				name: "output",
				type: "ReactNode | object | string",
				description: "Tool execution result. Objects and strings render as formatted JSON via CodeBlock. ReactNodes render directly.",
			},
			{
				name: "errorText",
				type: "string",
				description: "Error message displayed in ToolOutput when the tool execution fails.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				description: "Initial collapsed state for the Collapsible wrapper.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root Collapsible container.",
			},
		],
		subComponents: [
			{ name: "Tool", description: "Root Collapsible container with border and rounded corners." },
			{ name: "ToolHeader", description: "Collapsible trigger row with wrench icon, tool name, status badge, and chevron." },
			{ name: "ToolContent", description: "Animated collapsible content area with slide/fade transitions." },
			{ name: "ToolInput", description: "Parameter display section with 'Parameters' label and formatted JSON via CodeBlock." },
			{ name: "ToolOutput", description: "Result display section showing output as JSON or error text with color-coded background." },
		],
		examples: [
			{ title: "Running", description: "Tool in running state with only input parameters visible.", demoSlug: "tool-demo-running" },
			{ title: "Error", description: "Error state with connection timeout error message.", demoSlug: "tool-demo-error" },
			{ title: "Collapsed", description: "Completed tool starting in collapsed state.", demoSlug: "tool-demo-collapsed" },
			{ title: "Pending", description: "Tool in input-streaming state before parameters are available.", demoSlug: "tool-demo-pending" },
			{ title: "Approval requested", description: "Tool awaiting user approval before execution.", demoSlug: "tool-demo-approval" },
		],
	},

	"twg-tool": {
		description:
			"A compact Teamwork Graph thinking trace row for showing search progress, source context, and source icon stacks inside AI reasoning surfaces.",
		usage: `import {
  TwgTool,
  TwgToolSourceIcon,
  type TwgToolSource,
} from "@/components/ui-ai/twg-tool";
import {
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ui-ai/chain-of-thought";
import SearchIcon from "@atlaskit/icon/core/search";

const sources: TwgToolSource[] = [
  { id: "twg", label: "Teamwork Graph", provider: "twg" },
  { id: "confluence", label: "Confluence", provider: "confluence" },
  { id: "google-drive", label: "Google Drive", provider: "google-drive" },
];

<TwgTool
  defaultOpen
  description={
    <div className="flex min-w-0 items-center gap-1">
      Looking into
      <TwgToolSourceIcon source={sources[0]} size="sm" />
      <span className="italic">Upper arm strain repair</span>
    </div>
  }
  sources={sources}
>
  <ChainOfThoughtStep
    icon={SearchIcon}
    label="Evaluating sources"
    description="Ranking sources by recency and authority"
    status="complete"
  >
    <ChainOfThoughtSearchResults>
      <ChainOfThoughtSearchResult>www.atlassian.com</ChainOfThoughtSearchResult>
      <ChainOfThoughtSearchResult>www.github.com</ChainOfThoughtSearchResult>
    </ChainOfThoughtSearchResults>
  </ChainOfThoughtStep>
</TwgTool>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "title",
				type: "ReactNode",
				default: '"Searching Teamwork Graph"',
				description: "Title rendered in the first line of the trace banner.",
			},
			{
				name: "status",
				type: '"active" | "complete" | "pending"',
				default: '"active"',
				description: "Visual status for the trace row.",
			},
			{
				name: "description",
				type: "ReactNode",
				description: "Second-line status content. Can include TwgToolSourceIcon elements.",
			},
			{
				name: "sources",
				type: "ReadonlyArray<TwgToolSource>",
				default: "[]",
				description: "Sources shown as the overlapping right-side icon stack.",
			},
			{
				name: "showChevron",
				type: "boolean",
				default: "true",
				description: "Shows the chevron affordance and enables collapsible content when children are provided.",
			},
			{
				name: "open",
				type: "boolean",
				description: "Controlled open state passed to the underlying Collapsible root.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				description: "Initial open state when the component is uncontrolled.",
			},
			{
				name: "onOpenChange",
				type: "CollapsibleRootProps[\"onOpenChange\"]",
				description: "Callback fired when the collapsible trace content opens or closes.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "TwgTool", description: "Root trace row with rail icon, banner, source stack, and optional collapsible content." },
			{ name: "TwgToolSourceIcon", description: "Tile-backed 16px or 24px provider icon using Teamwork Graph, Atlassian product logos, or local third-party assets." },
			{ name: "TwgToolSourceStack", description: "Right-aligned overlapping source icon stack with overflow count support." },
		],
		examples: [
			{ title: "Single source", description: "Searching Teamwork Graph with one source in the icon stack.", demoSlug: "twg-tool-demo-single-source" },
			{ title: "Multiple sources", description: "Progress row with Teamwork Graph, Confluence, Google Drive, and Jira sources.", demoSlug: "twg-tool-demo-multiple-sources" },
			{ title: "Completed", description: "Completed state after reading six sources.", demoSlug: "twg-tool-demo-completed" },
		],
	},

	"test-results": {
		description:
			"A compound component for displaying test suite results with summary statistics, progress visualization, collapsible suites, individual test status indicators with duration, and error details with stack traces. Supports passed, failed, skipped, and running states with color-coded indicators.",
		usage: `import {
  TestResults,
  TestResultsHeader,
  TestResultsSummary,
  TestResultsDuration,
  TestResultsProgress,
  TestResultsContent,
  TestSuite,
  TestSuiteName,
  TestSuiteStats,
  TestSuiteContent,
  Test,
  TestStatus,
  TestName,
  TestDuration,
  TestError,
  TestErrorMessage,
  TestErrorStack,
} from "@/components/ui-ai/test-results";

<TestResults summary={{ passed: 8, failed: 1, skipped: 0, total: 9, duration: 2340 }}>
  <TestResultsHeader>
    <TestResultsSummary />
    <TestResultsDuration />
  </TestResultsHeader>
  <TestResultsProgress />
  <TestResultsContent>
    <TestSuite name="utils.test.ts" status="failed" defaultOpen>
      <TestSuiteName />
      <TestSuiteContent>
        <Test name="adds numbers" status="passed" duration={12}>
          <TestStatus />
          <TestName />
          <TestDuration />
        </Test>
        <Test name="handles nulls" status="failed" duration={8}>
          <TestStatus />
          <TestName />
          <TestDuration />
        </Test>
      </TestSuiteContent>
    </TestSuite>
  </TestResultsContent>
</TestResults>`,
		props: [
			{
				name: "summary",
				type: "{ passed: number; failed: number; skipped: number; total: number; duration?: number }",
				description: "Overall test run summary data. Consumed by TestResultsSummary, TestResultsDuration, and TestResultsProgress via context.",
			},
			{
				name: "name",
				type: "string",
				description: "Test suite or individual test name. Used by TestSuite, TestSuiteName, Test, and TestName.",
			},
			{
				name: "status",
				type: '"passed" | "failed" | "skipped" | "running"',
				description: "Test status for TestSuite and Test. Controls the color-coded icon indicator.",
			},
			{
				name: "duration",
				type: "number",
				description: "Execution time in milliseconds. Used by Test and displayed via TestDuration.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				default: "false",
				description: "Initial collapsed state for TestSuite. Uses Collapsible under the hood.",
			},
			{
				name: "passed",
				type: "number",
				default: "0",
				description: "Passed test count for TestSuiteStats.",
			},
			{
				name: "failed",
				type: "number",
				default: "0",
				description: "Failed test count for TestSuiteStats.",
			},
			{
				name: "skipped",
				type: "number",
				default: "0",
				description: "Skipped test count for TestSuiteStats.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes applied to any sub-component.",
			},
		],
		subComponents: [
			{ name: "TestResults", description: "Root container and context provider. Renders children or a default header with summary and duration." },
			{ name: "TestResultsHeader", description: "Flex header row for summary badges and duration." },
			{ name: "TestResultsSummary", description: "Badge group showing passed/failed/skipped counts from context." },
			{ name: "TestResultsDuration", description: "Total run duration from context, formatted as ms or seconds." },
			{ name: "TestResultsProgress", description: "Stacked progress bar showing passed (green) and failed (red) proportions." },
			{ name: "TestResultsContent", description: "Padded content area for test suites." },
			{ name: "TestSuite", description: "Collapsible test suite container with name and status context." },
			{ name: "TestSuiteName", description: "Collapsible trigger with chevron icon, status icon, and suite name." },
			{ name: "TestSuiteStats", description: "Inline passed/failed/skipped counts for a suite header." },
			{ name: "TestSuiteContent", description: "Collapsible content area with divided test rows." },
			{ name: "Test", description: "Individual test row with name, status, and optional duration context." },
			{ name: "TestStatus", description: "Color-coded status icon (check, x, circle, or pulsing dot)." },
			{ name: "TestName", description: "Test name text, falls back to context value." },
			{ name: "TestDuration", description: "Test execution time in milliseconds." },
			{ name: "TestError", description: "Error detail container with red background." },
			{ name: "TestErrorMessage", description: "Error message text in red." },
			{ name: "TestErrorStack", description: "Monospace stack trace display with horizontal scroll." },
		],
		examples: [
			{ title: "With progress", description: "Full test run with summary, duration, progress bar, suite stats, and individual test durations.", demoSlug: "test-results-demo-with-progress" },
			{ title: "With errors", description: "Failed tests with inline error messages and stack traces.", demoSlug: "test-results-demo-with-errors" },
			{ title: "Running", description: "In-progress test run with running status indicator and pending tests.", demoSlug: "test-results-demo-running" },
		],
	},

	terminal: {
		description:
			"A composable terminal output display with ANSI color support, streaming indicators, auto-scroll, copy-to-clipboard, and clear functionality. Uses ansi-to-react for escape sequence parsing (256 colors, bold, italic, underline).",
		usage: `import {
  Terminal,
  TerminalHeader,
  TerminalTitle,
  TerminalStatus,
  TerminalActions,
  TerminalCopyButton,
  TerminalClearButton,
  TerminalContent,
} from "@/components/ui-ai/terminal";

<Terminal output={output} isStreaming={isStreaming} onClear={handleClear}>
  <TerminalHeader>
    <TerminalTitle />
    <TerminalActions>
      <TerminalCopyButton />
      <TerminalClearButton />
    </TerminalActions>
  </TerminalHeader>
  <TerminalContent />
</Terminal>`,
		props: [
			{
				name: "output",
				type: "string",
				required: true,
				description: "Terminal output text. Supports ANSI escape sequences for color and formatting.",
			},
			{
				name: "isStreaming",
				type: "boolean",
				default: "false",
				description: "When true, shows a streaming status indicator and blinking cursor.",
			},
			{
				name: "autoScroll",
				type: "boolean",
				default: "true",
				description: "Auto-scroll to bottom when new output arrives.",
			},
			{
				name: "onClear",
				type: "() => void",
				description: "Callback to clear output. When provided, enables the clear button.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
			{
				name: "children",
				type: "ReactNode",
				description: "Custom compound composition. Falls back to default layout with header, status, actions, and content.",
			},
		],
		subComponents: [
			{ name: "Terminal", description: "Root container and context provider. Renders default header + content layout when no children are provided." },
			{ name: "TerminalHeader", description: "Flex header row with border-bottom separator." },
			{ name: "TerminalTitle", description: "Title with terminal icon. Renders 'Terminal' by default, accepts custom children." },
			{ name: "TerminalStatus", description: "Streaming status indicator using Shimmer. Only visible when isStreaming is true." },
			{ name: "TerminalActions", description: "Flex container for action buttons (copy, clear)." },
			{
				name: "TerminalCopyButton",
				description: "Copy-to-clipboard button with animated check icon on success.",
				props: [
					{ name: "onCopy", type: "() => void", description: "Callback after successful copy." },
					{ name: "onError", type: "(error: Error) => void", description: "Callback if copying fails." },
					{ name: "timeout", type: "number", default: "2000", description: "Duration to show copied state in milliseconds." },
				],
			},
			{ name: "TerminalClearButton", description: "Clear button that calls onClear from context. Only renders when onClear is provided." },
			{ name: "TerminalContent", description: "Scrollable output area with monospace font and ANSI rendering. Shows blinking cursor when streaming." },
		],
		examples: [
			{ title: "Streaming", description: "Simulated streaming output with line-by-line rendering and blinking cursor.", demoSlug: "terminal-demo-streaming" },
			{ title: "Clearable", description: "Terminal with clear button to reset output.", demoSlug: "terminal-demo-clearable" },
			{ title: "Composed", description: "Custom compound composition with custom title and explicit sub-component layout.", demoSlug: "terminal-demo-composed" },
			{ title: "ANSI colors", description: "Terminal output with ANSI escape sequences for colored git status.", demoSlug: "terminal-demo-ansi" },
		],
	},

	panel: {
		description:
			"A positioned overlay container for React Flow canvases. Wraps @xyflow/react Panel with card styling, rounded corners, and border for status indicators, toolbars, or metadata overlays.",
		usage: `import { Canvas } from "@/components/ui-ai/canvas";
import { Panel } from "@/components/ui-ai/panel";

<Canvas nodes={nodes} edges={edges}>
  <Panel position="top-right">
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-xs">Status: Running</span>
    </div>
  </Panel>
</Canvas>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "position",
				type: '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"',
				description: "Where the panel appears on the canvas.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the panel container.",
			},
			{
				name: "children",
				type: "ReactNode",
				description: "Content rendered inside the panel.",
			},
		],
		subComponents: [
			{ name: "Panel", description: "Themed React Flow panel with card background, rounded corners, border, and padding." },
		],
		examples: [
			{ title: "Status badge", description: "Panel with a running status badge and graph stats.", demoSlug: "panel-demo-status-badge" },
			{ title: "Positions", description: "Panels placed in all six canvas positions.", demoSlug: "panel-demo-positions" },
		],
	},

	toolbar: {
		description:
			"A styled toolbar component for React Flow nodes with flexible positioning and custom actions. Wraps @xyflow/react NodeToolbar with card styling, rounded corners, and border.",
		usage: `import { Toolbar } from "@/components/ui-ai/toolbar";
import { Node, NodeHeader, NodeTitle } from "@/components/ui-ai/node";
import { Button } from "@/components/ui/button";

<Node handles={{ source: true, target: true }}>
  <Toolbar>
    <Button size="sm" variant="ghost" aria-label="Edit">
      <EditIcon label="" />
    </Button>
    <Button size="sm" variant="ghost" aria-label="Copy">
      <CopyIcon label="" />
    </Button>
  </Toolbar>
  <NodeHeader>
    <NodeTitle>Process Data</NodeTitle>
  </NodeHeader>
</Node>`,
		demoLayout: {
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes applied to the toolbar container.",
			},
			{
				name: "position",
				type: "Position",
				default: "Position.Bottom",
				description: "Where the toolbar appears relative to the node. Uses @xyflow/react Position enum.",
			},
			{
				name: "...props",
				type: "ComponentProps<typeof NodeToolbar>",
				description: "Any other props from @xyflow/react NodeToolbar component (offset, isVisible, etc.).",
			},
		],
		subComponents: [
			{ name: "Toolbar", description: "Themed React Flow NodeToolbar with card background, flexbox layout, rounded corners, and border. Defaults to bottom positioning." },
		],
		examples: [
			{ title: "With node actions", description: "Nodes with a bottom-positioned toolbar for edit, copy, and delete actions.", demoSlug: "toolbar-demo-with-nodes" },
		],
	},

	transcription: {
		description:
			"A synchronized transcript display that highlights words in time with audio playback. Supports controlled and uncontrolled current-time state, click-to-seek navigation, and automatic filtering of empty segments. Designed for use with AI SDK transcription results.",
		usage: `import { Transcription, TranscriptionSegment } from "@/components/ui-ai/transcription";

<Transcription
  segments={transcriptionResult.segments}
  currentTime={currentTime}
  onSeek={(time) => setCurrentTime(time)}
>
  {(segment, index) => (
    <TranscriptionSegment key={index} segment={segment} index={index} />
  )}
</Transcription>`,
		props: [
			{
				name: "segments",
				type: "TranscriptionSegment[]",
				required: true,
				description: "Array of transcription segments from AI SDK transcribe(). Each segment has text, startSecond, and endSecond fields.",
			},
			{
				name: "currentTime",
				type: "number",
				default: "0",
				description: "Current playback position in seconds. Enables controlled mode when provided.",
			},
			{
				name: "onSeek",
				type: "(time: number) => void",
				description: "Callback fired when a segment is clicked with the segment's start time. Also fires on controlled time changes.",
			},
			{
				name: "children",
				type: "(segment: TranscriptionSegment, index: number) => ReactNode",
				required: true,
				description: "Render function that receives each non-empty segment and its index.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the root container.",
			},
		],
		subComponents: [
			{ name: "Transcription", description: "Root container and context provider. Wraps segments in a flex-wrap layout and filters out empty/whitespace-only segments." },
			{ name: "TranscriptionSegment", description: "Individual word button with automatic state styling. Active segments show primary color, past segments use muted foreground, future segments are dimmed. Clickable when onSeek is provided." },
		],
		examples: [
			{ title: "Static", description: "Transcript without playback — all segments rendered in dimmed state.", demoSlug: "transcription-demo-static" },
			{ title: "With seek", description: "Click-to-seek navigation with controlled current time.", demoSlug: "transcription-demo-with-seek" },
		],
	},

	"voice-selector": {
		description:
			"A searchable voice selection dialog built on cmdk and Dialog primitives. Supports voice metadata (gender, accent, age), grouped provider organization, voice preview playback, and controlled/uncontrolled selection state.",
		usage: `import {
  VoiceSelector,
  VoiceSelectorTrigger,
  VoiceSelectorContent,
  VoiceSelectorInput,
  VoiceSelectorList,
  VoiceSelectorEmpty,
  VoiceSelectorGroup,
  VoiceSelectorItem,
  VoiceSelectorName,
  VoiceSelectorDescription,
  VoiceSelectorAttributes,
  VoiceSelectorGender,
  VoiceSelectorAccent,
  VoiceSelectorAge,
  VoiceSelectorBullet,
  VoiceSelectorPreview,
  VoiceSelectorSeparator,
} from "@/components/ui-ai/voice-selector";

<VoiceSelector>
  <VoiceSelectorTrigger render={<Button variant="outline" size="sm" />}>
    Select voice
  </VoiceSelectorTrigger>
  <VoiceSelectorContent>
    <VoiceSelectorInput placeholder="Search voices..." />
    <VoiceSelectorList>
      <VoiceSelectorEmpty>No voices found.</VoiceSelectorEmpty>
      <VoiceSelectorGroup heading="Voices">
        <VoiceSelectorItem value="alloy">
          <VoiceSelectorName>Alloy</VoiceSelectorName>
          <VoiceSelectorAttributes>
            <VoiceSelectorGender value="non-binary" />
            <VoiceSelectorBullet />
            <VoiceSelectorAccent value="american" />
          </VoiceSelectorAttributes>
        </VoiceSelectorItem>
      </VoiceSelectorGroup>
    </VoiceSelectorList>
  </VoiceSelectorContent>
</VoiceSelector>`,
		props: [
			{
				name: "value",
				type: "string",
				description: "Controlled selected voice ID.",
			},
			{
				name: "defaultValue",
				type: "string",
				description: "Default selected voice ID for uncontrolled usage.",
			},
			{
				name: "onValueChange",
				type: "(value: string | undefined) => void",
				description: "Callback fired when the selected voice changes.",
			},
			{
				name: "open",
				type: "boolean",
				description: "Controlled open state of the dialog.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				description: "Callback fired when the dialog open state changes.",
			},
		],
		subComponents: [
			{ name: "VoiceSelector", description: "Root provider wrapping a Dialog. Manages voice selection and open state." },
			{ name: "VoiceSelectorTrigger", description: "DialogTrigger for opening the voice selection dialog." },
			{ name: "VoiceSelectorContent", description: "Dialog content with embedded Command, configurable title (default: 'Voice Selector')." },
			{ name: "VoiceSelectorDialog", description: "Alternative CommandDialog wrapper for full-screen command palette." },
			{ name: "VoiceSelectorInput", description: "Search input for filtering the voice list." },
			{ name: "VoiceSelectorList", description: "Scrollable list container for groups and items." },
			{ name: "VoiceSelectorEmpty", description: "Fallback content when search yields no results." },
			{ name: "VoiceSelectorGroup", description: "Category group with heading for organizing voices by provider." },
			{ name: "VoiceSelectorItem", description: "Individual selectable voice option with value and onSelect callback." },
			{ name: "VoiceSelectorName", description: "Truncated voice name text with font-medium styling." },
			{ name: "VoiceSelectorDescription", description: "Muted description text for a voice." },
			{ name: "VoiceSelectorAttributes", description: "Flex container for grouping gender, accent, and age metadata." },
			{ name: "VoiceSelectorGender", description: "Gender indicator with Lucide icons. Supports male, female, transgender, androgyne, non-binary, and intersex." },
			{ name: "VoiceSelectorAccent", description: "Accent representation with emoji flags for 27+ regions." },
			{ name: "VoiceSelectorAge", description: "Age metadata display with tabular-nums alignment." },
			{ name: "VoiceSelectorBullet", description: "Bullet separator (•) between attributes, hidden from screen readers." },
			{ name: "VoiceSelectorPreview", description: "Play/pause button for voice sample preview with loading spinner state." },
			{ name: "VoiceSelectorShortcut", description: "Keyboard shortcut display alongside an item." },
			{ name: "VoiceSelectorSeparator", description: "Visual separator between voice groups." },
		],
		examples: [
			{ title: "With attributes", description: "Voice items with gender icons, accent flags, and age metadata.", demoSlug: "voice-selector-demo-with-attributes" },
			{ title: "Multi-provider", description: "Grouped voices from multiple providers with separators.", demoSlug: "voice-selector-demo-multi-provider" },
			{ title: "With preview", description: "Play/pause buttons for previewing voice samples.", demoSlug: "voice-selector-demo-with-preview" },
		],
	},

	"web-preview": {
		description:
			"A composable browser-like preview container with navigation controls, editable URL bar, auto-switching Chromium mirroring for external URLs, iframe fallback for relative routes, and an optional collapsible console output panel.",
		usage: `import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
  WebPreviewConsole,
} from "@/components/ui-ai/web-preview";

<WebPreview defaultUrl="https://example.com">
  <WebPreviewNavigation>
    <WebPreviewNavigationButton action="back" tooltip="Back">
      <ArrowLeft className="size-4" />
    </WebPreviewNavigationButton>
    <WebPreviewNavigationButton action="forward" tooltip="Forward">
      <ArrowRight className="size-4" />
    </WebPreviewNavigationButton>
    <WebPreviewNavigationButton action="reload" tooltip="Reload">
      <RotateCw className="size-4" />
    </WebPreviewNavigationButton>
    <WebPreviewUrl />
  </WebPreviewNavigation>
  <WebPreviewBody />
  <WebPreviewConsole logs={logs} />
</WebPreview>`,
		props: [
			{
				name: "defaultUrl",
				type: "string",
				default: '""',
				description: "Initial URL loaded in the preview. Absolute web URLs use Chromium mirroring by default; relative URLs stay in the iframe renderer.",
			},
			{
				name: "engine",
				type: '"auto" | "iframe" | "chromium"',
				default: '"auto"',
				description: "Choose how the preview body renders. `auto` uses Chromium for external URLs and the iframe body for relative/local routes.",
			},
			{
				name: "proxy",
				type: "boolean",
				default: "false",
				description: "When the iframe renderer is active, external URLs can still be fetched through the legacy server-side proxy that strips frame-blocking headers.",
			},
			{
				name: "onUrlChange",
				type: "(url: string) => void",
				description: "Callback fired when the preview URL changes, including Chromium-side redirects after navigation.",
			},
			{
				name: "logs",
				type: '{ level: "log" | "warn" | "error"; message: string; timestamp: Date }[]',
				description: "Console log entries displayed in the WebPreviewConsole panel.",
			},
			{
				name: "loading",
				type: "ReactNode",
				description: "Optional loading overlay rendered inside WebPreviewBody.",
			},
			{
				name: "tooltip",
				type: "string",
				description: "Hover tooltip text for WebPreviewNavigationButton.",
			},
			{
				name: "action",
				type: '"back" | "forward" | "reload"',
				description: "Optional built-in navigation action for WebPreviewNavigationButton when Chromium preview is active.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to any sub-component.",
			},
		],
		subComponents: [
			{ name: "WebPreview", description: "Root container and context provider managing URL and console open state." },
			{ name: "WebPreviewNavigation", description: "Flex navigation bar with border separator for buttons and URL input." },
			{ name: "WebPreviewNavigationButton", description: "Ghost button with tooltip for navigation actions (back, forward, reload, fullscreen)." },
			{ name: "WebPreviewUrl", description: "Editable URL input synced with context. Pressing Enter navigates to the entered URL." },
			{ name: "WebPreviewBody", description: "Sandboxed iframe wrapper rendering the current URL. Supports an optional loading overlay." },
			{ name: "WebPreviewConsole", description: "Collapsible console panel with color-coded log levels (log, warn, error) and timestamps." },
		],
		examples: [
			{ title: "With console", description: "Preview with collapsible console showing log, warn, and error entries.", demoSlug: "web-preview-demo-with-console" },
			{ title: "With extra actions", description: "Navigation bar with select, open in new tab, and maximize buttons.", demoSlug: "web-preview-demo-fullscreen" },
			{ title: "URL change callback", description: "Tracks URL changes via onUrlChange callback.", demoSlug: "web-preview-demo-url-change" },
			{ title: "With proxy", description: "Server-side proxy to load external websites that block iframe embedding.", demoSlug: "web-preview-demo-proxy" },
		],
	},
};
