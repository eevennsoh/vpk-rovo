# Rovo Dev Canvas modal extraction spec

This document is a handoff contract for rebuilding the Rovo Dev Canvas modal in
another codebase. It captures the behavior, file inventory, APIs, AI protocol,
and adaptation rules from this repository so another implementation can preserve
the user experience while swapping framework, design system, and backend
details.

The source implementation lives mostly under
`app/old-rovo/components/canvas/`, with state in `app/contexts/`, chat
components in `app/old-rovo/components/`, and AI/backend wiring in `app/api/`,
`backend/`, and `shared/`.

## 1. Scope and feature checklist

The extracted feature is a fullscreen, modal-based creation canvas with a left
work area and a right Rovo chat rail. The destination implementation must keep
the following behaviors unless the destination product explicitly chooses to
remove them.

- Fullscreen modal shell with sunken outer background, rounded modal, header
  strip, white left card, and fixed 400 px right chat rail.
- Header controls with title, Draft or Active lozenge, primary Save or Activate
  action, More menu, and Close action.
- Tabbed left content area with per-kind tab sets:
  - Dashboard, report, app, and integration: Plan, Preview, HTML.
  - Agent: Details, Preview, Surfaces.
  - Automation: Setup, Rule.
  - Script: Plan, Code.
- Per-tab toolbar controls:
  - Preview tabs: Refresh, Version history, and Select element.
  - HTML or Code tab: Refresh, Version history, and Copy code.
- Right-rail Rovo chat with streaming messages, suggested prompts, edit
  submission, annotation chips, Stop affordance, and artefact cards.
- Element selection mode in the iframe preview:
  - Hover highlight with label.
  - Click-to-comment popover.
  - Drag-rectangle batch selection.
  - Shift-click toggle selection.
  - Persistent numbered pin markers.
  - Return adds annotation to chat.
  - Command-Return sends directly to Rovo.
- Animated multi-color shimmer ring around elements being edited by AI.
- Slide-in Version history panel with grouped versions, avatars, actions, and
  pagination.
- Streaming AI generation with a strict `<PLAN>...</PLAN>` plus fenced
  `html` code-block parsing protocol.
- Local fast-path edit parser for simple scoped edits, such as "make it red,"
  "bold," "hide," "background blue," and "bigger."
- CodeMirror editable HTML or source-code tab with Save and Discard staged-edit
  toast.
- Editable Plan panel with Save and Discard staged-edit toast.
- Best-effort polish second pass for HTML artefacts.
- Cancel beacon on page unload so server-side Rovo Dev runs don't outlive the
  tab.
- Artefact store that lets chat cards reopen generated artefacts in the canvas.

## 2. File inventory grouped by purpose

Use this inventory as the migration checklist. The destination can copy the
files first and then adapt imports, styling primitives, routing, and backend
calls.

### Composition root

- `app/old-rovo/components/canvas/RovoCanvasAfm.tsx` - Main composition root.
  Defines the tab map, inner toolbar, panel switching, right rail, overlays,
  and generator hook registration.
- `app/old-rovo/components/canvas/RovoCanvas.tsx` - Legacy canvas sibling.
  Inspect before deleting if the destination has older references.
- `app/old-rovo/components/canvas/RovoChat.tsx` - Legacy canvas chat sibling.
  Not the AFM right rail, but useful for older behavior references.
- `app/old-rovo/components/canvas/CanvasHeader.tsx` - Legacy header sibling.
  The AFM implementation uses `afm/StagingAreaHeader.tsx` instead.

### State and providers

- `app/contexts/RovoCanvasContext.tsx` - Canvas state, artefact store, edit
  handlers, staged edits, selection state, version-history state, and public
  canvas API.
- `app/contexts/RovoChatContext.tsx` - Chat state with per-surface message
  slices. The canvas surface is pinned to Rovo.
- `app/contexts/RovoCanvasProviderWrapper.tsx` - Wraps the app in
  `RovoCanvasProvider` and mounts `RovoCanvasAfm`.

### Modal shell in `afm/`

- `app/old-rovo/components/canvas/afm/SmartCreationModal.tsx` - Full AFM shell
  composition and modal lifecycle keying.
- `app/old-rovo/components/canvas/afm/MaximisedModal.tsx` - Atlaskit modal
  wrapper plus portal-wide sizing and blanket CSS.
- `app/old-rovo/components/canvas/afm/CustomHeader.tsx` - Header frame.
- `app/old-rovo/components/canvas/afm/StagingAreaHeader.tsx` - Title,
  lozenge, Save or Activate button, More menu, Save as app, and Close.
- `app/old-rovo/components/canvas/afm/CanvasTabSwitcher.tsx` - Icon button tab
  switcher with per-kind icon vocabulary.
- `app/old-rovo/components/canvas/afm/CanvasRovoChat.tsx` - Right-rail chat
  frame and edit submission bridge.
- `app/old-rovo/components/canvas/afm/LoadingScreen.tsx` - Branded Rovo loading
  screen.
- `app/old-rovo/components/canvas/afm/AIFooter.tsx` - "Uses AI. Verify
  results." footer.
- `app/old-rovo/components/canvas/afm/FeedbackBanner.tsx` - Optional feedback
  banner.
- `app/old-rovo/components/canvas/afm/UserMessageBody.tsx` - User message
  renderer that turns serialized annotation blocks into annotation pills.
- `app/old-rovo/components/canvas/afm/ElementRefInlineCode.tsx` - Inline
  element reference chip with iframe hover highlight.
- `app/old-rovo/components/canvas/afm/intl-shim.tsx` - Minimal `react-intl`
  shim.
- `app/old-rovo/components/canvas/afm/messages.ts` - AFM message descriptors.

### Dashboard, script, and HTML panels

- `app/old-rovo/components/canvas/panels/PlanPanel.tsx` - Editable structured
  plan renderer with fallback plan fabrication and staged Save or Discard.
- `app/old-rovo/components/canvas/panels/PreviewPanel.tsx` - Iframe preview,
  loading states, HTML injection, iframe stamping, and anti-flicker behavior.
- `app/old-rovo/components/canvas/panels/HtmlPanel.tsx` - CodeMirror HTML or
  code editor with staged Save or Discard.

### Agent flow

- `app/old-rovo/components/canvas/agent/AgentDetailsPanel.tsx` - Agent details
  tab with profile card and editable sections.
- `app/old-rovo/components/canvas/agent/AgentPreviewPanel.tsx` - Agent preview
  chat tab.
- `app/old-rovo/components/canvas/agent/AgentSurfacesPanel.tsx` - Agent surfaces
  tab.
- `app/old-rovo/components/canvas/agent/useAgentStore.ts` - Reads and mutates
  the current agent payload from `RovoCanvasContext`.
- `app/old-rovo/components/canvas/agent/data/agentTypes.ts` - Agent type
  contract.
- `app/old-rovo/components/canvas/agent/data/generateAgentFromPrompt.ts` -
  Prompt-to-agent synthesizer.
- `app/old-rovo/components/canvas/agent/data/mockAgentLibrary.ts` - Demo agent
  library.
- `app/old-rovo/components/canvas/agent/fields/CoreInstructionsField.tsx` -
  Instructions editor.
- `app/old-rovo/components/canvas/agent/fields/ToolsField.tsx` - Tool selector.
- `app/old-rovo/components/canvas/agent/fields/KnowledgeSourcesField.tsx` -
  Knowledge-source selector.
- `app/old-rovo/components/canvas/agent/fields/ConversationStartersField.tsx` -
  Conversation starter editor.
- `app/old-rovo/components/canvas/agent/fields/WebSearchToggle.tsx` - Web search
  switch.
- `app/old-rovo/components/canvas/agent/fields/DeepResearchToggle.tsx` - Deep
  research switch.
- `app/old-rovo/components/canvas/agent/fields/SubagentsSection.tsx` - Subagent
  list.
- `app/old-rovo/components/canvas/agent/surfaces/DefaultSurfaces.tsx` - Default
  surfaces list.
- `app/old-rovo/components/canvas/agent/surfaces/ExtendedSurfaces.tsx` -
  Extended surfaces list.
- `app/old-rovo/components/canvas/agent/surfaces/SurfaceItem.tsx` - Surface row.
- `app/old-rovo/components/canvas/agent/heading/AgentHeadingToolbar.tsx` -
  Older in-panel heading toolbar.
- `app/old-rovo/components/canvas/agent/primitives/AgentAvatar.tsx` - Hex agent
  avatar.
- `app/old-rovo/components/canvas/agent/primitives/AgentChatIcon.tsx` - Agent
  chat icon.
- `app/old-rovo/components/canvas/agent/primitives/Card.tsx` - Shared card
  primitive.
- `app/old-rovo/components/canvas/agent/primitives/ChatPill.tsx` - Chat pill
  primitive.
- `app/old-rovo/components/canvas/agent/primitives/ConversationStarters.tsx` -
  Conversation starter primitive.
- `app/old-rovo/components/canvas/agent/primitives/ExpandableItem.tsx` -
  Expandable item primitive.
- `app/old-rovo/components/canvas/agent/primitives/MarkdownEditor.tsx` -
  Markdown editor primitive.
- `app/old-rovo/components/canvas/agent/primitives/agent-avatar-assets/*.tsx` -
  Avatar art modules:
  `auto-dev.tsx`, `auto-fix.tsx`, `auto-review.tsx`, `backlog-buddy.tsx`,
  `comms-crafter.tsx`, `culture.tsx`, `customer-insight.tsx`,
  `decision-director.tsx`, `feature-flag-avatar.tsx`,
  `generic-avatar.tsx`, `hire-writer.tsx`,
  `marketing-message-maestro.tsx`, `my-user-manual.tsx`,
  `okr-oracle.tsx`, `ops-agent.tsx`, `pitch-perfector.tsx`,
  `product-requirement.tsx`, `release-notes.tsx`, `research-scout.tsx`,
  `social-media-scribe.tsx`, and `team-connection.tsx`.
- `app/old-rovo/components/canvas/agent/primitives/agent-avatar-assets/index.ts`
  - Avatar asset registry.
- `app/old-rovo/components/canvas/agent/primitives/agent-avatar-assets/types.ts`
  - Avatar asset types.

### Automation flow

- `app/old-rovo/components/canvas/automation/AutomationSetupPanel.tsx` - Product
  and scope setup tab.
- `app/old-rovo/components/canvas/automation/AutomationRulePanel.tsx` - Rule
  editor with WHEN, IF, and THEN sections.
- `app/old-rovo/components/canvas/automation/useAutomationGenerator.ts` -
  Automation initial-generation guard and chat edit handler.
- `app/old-rovo/components/canvas/automation/useAutomationStore.ts` - Reads and
  mutates the current automation payload from `RovoCanvasContext`.
- `app/old-rovo/components/canvas/automation/data/automationTypes.ts` -
  Automation rule type contract.
- `app/old-rovo/components/canvas/automation/data/generateAutomationFromPrompt.ts`
  - Prompt-to-rule synthesizer and rule edit parser.
- `app/old-rovo/components/canvas/automation/data/mockAutomationLibrary.ts` -
  Demo automation library.
- `app/old-rovo/components/canvas/automation/primitives/AutomationCard.tsx` -
  Automation card primitive.
- `app/old-rovo/components/canvas/automation/primitives/ProductCards.tsx` -
  Product picker cards.
- `app/old-rovo/components/canvas/automation/primitives/RuleStepBlock.tsx` -
  WHEN, IF, and THEN block primitive.
- `app/old-rovo/components/canvas/automation/primitives/ScopeCards.tsx` - Scope
  picker cards.
- `app/old-rovo/components/canvas/automation/primitives/SpacePicker.tsx` - Space
  selector.

### Overlays and iframe glue

- `app/old-rovo/components/canvas/CanvasElementSelectOverlay.tsx` - Selection
  overlay, hit-testing, inline comment popover, batch selection, pin markers,
  and keyboard behavior.
- `app/old-rovo/components/canvas/CanvasShimmerOverlay.tsx` - Animated AI edit
  shimmer ring and success ring.
- `app/old-rovo/components/canvas/CanvasVersionHistoryPanel.tsx` - Version
  history drawer.
- `app/old-rovo/components/canvas/iframeMutate.ts` - Iframe lookup, stamping,
  outerHTML replacement, HTML snapshotting, and local fast-path edit parser.
- `app/old-rovo/components/canvas/iframePolyfill.ts` - Injected iframe
  interactivity polyfill for tabs, accordions, collapse, dialogs, dropdowns,
  filters, and custom actions.
- `app/old-rovo/components/canvas/useDashboardGenerator.ts` - Streaming Rovo Dev
  generation, edit handling, scoped edit handling, polish pass, fallback
  template generation, and unload cancel beacon.

### Right-rail chat dependencies

- `app/old-rovo/components/RovoChatMessages.tsx` - Shared message list. The
  canvas passes `variant="sidepanel"` and injects `RovoArtefactCard`.
- `app/old-rovo/components/RovoChatInput.tsx` - Shared input. The canvas uses
  `simplified`, `hideUsesAI`, `topAdornment`, `isThinking`, `onStop`, and
  `canSubmitWithoutPrompt`.
- `app/old-rovo/components/MessageArtefactCard.tsx` - Legacy artefact card
  fallback used by non-canvas call sites.
- `app/rovo/components/RovoArtefactCard.tsx` - Preferred artefact card for
  canvas chat, with Edit and View actions and first-click-safe canvas opening.
- `app/old-rovo/components/RovoChatPanel.tsx` and
  `app/old-rovo/components/RovoChatHeader.tsx` - Related side-panel chat
  shell. Not required for the AFM canvas, but useful if the destination also
  ports the global chat panel.

### API and backend

- `app/api/rovo-chat/route.ts` - Next.js local-development proxy to
  `backend/server.js`.
- `app/api/rovo-polish/route.ts` - Local-development proxy for the polish pass.
- `app/api/rovo/cancel/route.ts` - Local-development proxy for cancellation
  beacons.
- `backend/server.js` - Express backend. The `/api/rovo-chat` handler routes
  `mode: "rovo"` to local `rovo serve` when available, otherwise to
  AI Gateway. It also exposes `/api/rovo-polish` and `/api/rovo/cancel`.
- `backend/rovo-serve.js` - Starts or monitors local `rovo serve` on
  port 8765.
- `backend/rovo-handoff.js` - Session-based handoff bridge to the local Rovo
  CLI server.

### Shared logic and prompts

- `shared/rovo-canvas-templates.ts` - Deterministic fallback templates and
  fallback edit helpers.
- `shared/rovo-config.ts` and `shared/rovo-config.js` - AI Gateway payload
  builders, Rovo Dev payload builder, polish prompt builder export, and general
  Rovo system prompt.
- `shared/rovo-skills.ts` - Skill detection and skill prompt helpers.
- `shared/rovo-prompts/index.js` - Prompt composition entry point.
- `shared/rovo-prompts/core.js` - Cross-artefact generation rules.
- `shared/rovo-prompts/general.js` - General Rovo rules.
- `shared/rovo-prompts/viz.js` - Chart and visualization rules.
- `shared/rovo-prompts/interactivity.js` - Inline JavaScript and data-attribute
  interactivity rules.
- `shared/rovo-prompts/registry.js` - Artefact registry, aliases, modules, and
  polish opt-outs.
- `shared/rovo-prompts/polish.js` - Polish prompt composer.
- `shared/rovo-prompts/polish-core.js` - Cross-artefact polish checks.
- `shared/rovo-prompts/polish-viz.js` - Visualization polish checks.
- `shared/rovo-prompts/polish-interactivity.js` - Interactivity polish checks.
- `shared/rovo-prompts/artefacts/dashboard.js` - Dashboard-specific rules.
- `shared/rovo-prompts/artefacts/dashboard-polish.js` - Dashboard polish rules.
- `shared/rovo-prompts/artefacts/report.js` - Report-specific rules.
- `shared/rovo-prompts/artefacts/app.js` - App-specific rules.
- `shared/rovo-prompts/artefacts/integration.js` - Integration-specific rules.
- `shared/rovo-prompts/artefacts/script-py.js` - Python script rules.
- `shared/rovo-prompts/artefacts/script-js.js` - Node script rules.
- `shared/teamwork-graph/index.ts` - Teamwork Graph exports.
- `shared/teamwork-graph/schema.ts` - Graph schema.
- `shared/teamwork-graph/sources.ts` - Graph sources.
- `shared/teamwork-graph/aggregators.ts` - Graph aggregations.
- `shared/teamwork-graph/useTeamworkGraph.ts` - Frontend graph hook.
- `shared/teamwork-graph/skoda/*` - Demo graph generator, dictionaries, seeded
  random helpers, and README.

## 3. External dependencies and substitutions

The source implementation uses Atlassian Design System and Next.js. Treat those
as replaceable integration points unless your destination also uses them.

| Dependency | Used for | Keep or replace |
| --- | --- | --- |
| `react` | Component model, hooks, portals. | Keep if the destination is React. Otherwise port the component state and portals to the destination UI framework. |
| `next/navigation` | Header navigation after Save as app. | Replace with destination router. |
| `@atlaskit/modal-dialog` | Modal portal, `ModalTransition`, `CloseButton`, blanket, and dialog sizing. | Replace with destination modal and portal. Preserve the `openCycle` remount workaround if the destination modal has exit-transition races. |
| `@atlaskit/primitives` and `@atlaskit/primitives/compiled` | `Box`, `Stack`, `Flex`, `Inline`, and `Text` layout primitives. | Replace with local layout primitives or plain elements. |
| `@atlaskit/tokens` | `token("space.200")`, `token("color.border")`, `token("elevation.surface")`, and similar design tokens. | Map to destination tokens, CSS variables, or spacing/color constants. |
| `@atlaskit/button/new` | `Button` and `IconButton`. | Replace with destination buttons. Preserve `isSelected`, disabled, labels, and test IDs. |
| `@atlaskit/icon/core/*` | Standard toolbar, header, and row icons. | Replace with destination icon set. |
| `@atlaskit/icon-lab/core/cursor` | Select-element cursor icon. | Replace with equivalent cursor/select icon. |
| `@atlaskit/tooltip` | Toolbar and annotation tooltips. | Replace with destination tooltip. |
| `@atlaskit/dropdown-menu` | Header and version-row menus. | Replace with destination menu. |
| `@atlaskit/spinner` | Loading states. | Replace with destination spinner. |
| `@atlaskit/lozenge` | Draft, Active, and tip pills. | Replace with destination pill/badge. In Next.js Turbopack, prefer root imports over nested `/new` imports. |
| `@atlaskit/code/inline` | Element reference inline chips. | Replace with inline code or badge component. |
| `@uiw/react-codemirror` | Editable HTML/source panel. | Keep for React destinations or replace with Monaco, textarea, or another editor. |
| `@codemirror/lang-html` | HTML syntax highlighting. | Keep with CodeMirror or replace with destination editor language extension. |
| `react-intl` | Only abstracted through `afm/intl-shim.tsx`. | Remove and inline English labels, or replace the shim with the destination i18n API. |

The destination must also provide browser APIs used by the canvas:
`document.querySelector`, iframe `contentDocument`, `DOMRect`,
`elementsFromPoint`, `createPortal`, `navigator.clipboard`,
`navigator.sendBeacon`, and `crypto.randomUUID` or an ID fallback.

## 4. Canvas and chat context API reference

Port the state APIs before porting UI. The UI assumes these functions are
available and stable across renders.

```ts
export type ArtefactKind =
  | 'dashboard'
  | 'report'
  | 'app'
  | 'integration'
  | 'script'
  | 'script-py'
  | 'script-js'
  | 'agent'
  | 'automation';

export type CanvasView =
  | 'plan'
  | 'preview'
  | 'html'
  | 'agent-details'
  | 'agent-preview'
  | 'agent-surfaces'
  | 'automation-setup'
  | 'automation-rule';

export type CanvasStatus =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'ready'
  | 'editing'
  | 'error';

export interface ElementComment {
  id: string;
  elementLabel: string;
  elementRect: {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };
  text: string;
  createdAt: number;
}

export interface PlanStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CanvasMessage {
  id: string;
  role: 'user' | 'rovo';
  content: string;
  isStreaming?: boolean;
}

export interface Artefact {
  id: string;
  kind: ArtefactKind;
  title: string;
  summary: string;
  prompt: string;
  html: string;
  planMarkdown: string;
  createdAt: string;
  agent?: Agent;
  automation?: AutomationRule;
}

export interface CanvasState {
  isOpen: boolean;
  view: CanvasView;
  status: CanvasStatus;
  prompt: string;
  plan: PlanStep[];
  planMarkdown: string;
  html: string;
  messages: CanvasMessage[];
  errorMessage?: string;
  artefactKind: ArtefactKind;
  artefactId?: string;
  openCycle: number;
}

export interface RovoCanvasContextType {
  state: CanvasState;
  openCanvas(prompt: string, kind?: ArtefactKind): void;
  openArtefact(artefactId: string): void;
  closeCanvas(): void;
  resetCanvas(): void;
  setView(view: CanvasView): void;
  setStatus(status: CanvasStatus): void;
  setPlan(plan: PlanStep[] | ((prev: PlanStep[]) => PlanStep[])): void;
  updatePlanStep(id: string, status: PlanStep['status']): void;
  setHtml(html: string | ((prev: string) => string)): void;
  setPlanMarkdown(markdown: string | ((prev: string) => string)): void;
  setError(message: string): void;

  registerEditHandler(handler: ((request: string) => Promise<void>) | null): void;
  registerScopedEditHandler(
    handler:
      | ((request: string, annotations: { label: string; text: string }[]) => Promise<void>)
      | null,
  ): void;
  registerChatLogger(logger: ((content: string) => void) | null): void;
  submitEdit(request: string): Promise<void>;
  submitScopedEdit(
    request: string,
    annotations: { label: string; text: string; id?: string }[],
  ): Promise<void>;
  activeEditTargets: string[];
  editPhase: 'idle' | 'editing' | 'success';

  pendingCodeEdit: string | null;
  setPendingCodeEdit(text: string | null): void;
  savePendingCodeEdit(): void;
  discardPendingCodeEdit(): void;
  pendingPlanEdit: string | null;
  setPendingPlanEdit(text: string | null): void;
  savePendingPlanEdit(): void;
  discardPendingPlanEdit(): void;

  artefacts: Record<string, Artefact>;
  saveArtefact(
    artefact: Omit<Artefact, 'id' | 'createdAt'> & { id?: string },
  ): string;
  getArtefact(id: string): Artefact | undefined;
  updateAgent(id: string, updater: (agent: Agent) => Agent): void;
  updateAutomation(id: string, updater: (rule: AutomationRule) => AutomationRule): void;

  isVersionHistoryOpen: boolean;
  openVersionHistory(): void;
  closeVersionHistory(): void;
  toggleVersionHistory(): void;

  isSelectMode: boolean;
  selectedElementLabel: string | null;
  pendingChatComment: { labels: string[]; ids: string[]; text: string } | null;
  consumeChatComment(): { labels: string[]; ids: string[]; text: string } | null;
  submitChatComment(labels: string[], text: string, ids?: string[]): void;
  elementComments: ElementComment[];
  addElementComment(comment: Omit<ElementComment, 'id' | 'createdAt'>): string;
  updateElementComment(id: string, text: string): void;
  removeElementComment(id: string): void;
  clearElementComments(): void;
  toggleSelectMode(): void;
  exitSelectMode(): void;
  setSelectedElement(label: string | null): void;
}
```

The behavior of each core method is:

| API | Behavior |
| --- | --- |
| `getDefaultViewForKind(kind)` | Returns `agent-details` for agents, `automation-rule` for automations, `html` for scripts, and `preview` for everything else. |
| `isScriptKind(kind)` | Returns true for `script`, `script-py`, and `script-js`. |
| `openCanvas(prompt, kind)` | Opens a fresh canvas, sets kind-aware default view, clears plan and HTML, sets status to `planning`, and increments `openCycle`. |
| `openArtefact(id)` | Reopens a saved artefact in `ready` state with stored HTML, plan, prompt, kind, and `artefactId`. It reads from a ref to avoid stale-closure double-click bugs. |
| `closeCanvas()` | Sets `state.isOpen` to false. |
| `saveArtefact()` | Stores an artefact in memory, generating `id` and `createdAt` if needed. |
| `updateAgent()` and `updateAutomation()` | Mutate the typed payload on a stored artefact without replacing the rest of the store. |
| `registerEditHandler()` | Lets generator hooks register the current full-edit function. |
| `registerScopedEditHandler()` | Lets `useDashboardGenerator` register an annotation-scoped edit function. |
| `submitEdit()` | Discards staged plan/code edits, starts shimmer state, calls the registered full-edit handler, and flashes success on completion. |
| `submitScopedEdit()` | Discards staged edits, starts shimmer on annotation targets, tries `parseLocalEdit` first, snapshots iframe HTML on local success, otherwise calls the scoped edit handler, then flashes success. |
| `setPendingCodeEdit()` and `setPendingPlanEdit()` | Stage unsaved editor changes without mutating saved canvas state. |
| `savePendingCodeEdit()` and `savePendingPlanEdit()` | Commit staged text to `state.html` or `state.planMarkdown`. |
| `discardPendingCodeEdit()` and `discardPendingPlanEdit()` | Clear staged edits and let panels resync from saved state. |
| `submitChatComment()` | Moves element-selection annotations into the chat rail for the next submit. |
| `consumeChatComment()` | Returns and clears the pending annotation payload. |
| `addElementComment()` | Creates persistent pin marker data for selected iframe elements. |

The chat context exposes a surface-aware API:

```ts
export type RovoChatSurface = 'panel' | 'home' | 'canvas';

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  widget?: { type: string; data: unknown };
  widgetLoading?: boolean;
  isStreaming?: boolean;
  suggestedQuestions?: string[];
  loadingSuggestions?: boolean;
  researchSteps?: CompactResearchStep[];
  researchCompleted?: boolean;
  thinkingText?: string;
  artefact?: {
    artefactId: string;
    kind: 'dashboard' | 'report' | 'app' | 'script' | 'agent' | 'automation';
    title: string;
    summary: string;
    prompt: string;
  };
}
```

Use `useRovoChat({ surface: 'canvas' })` inside the canvas. The canvas surface
is always pinned to Rovo, and it prevents side-panel agent switches from
changing the canvas conversation.

## 5. Feature deep dives

This section explains the implementation rules that are easy to miss when
copying files.

### Tab switcher and kind defaults

`RovoCanvasAfm.tsx` defines the source of truth for canvas tabs:

- `dashboard`: Plan, Preview, HTML.
- `agent`: Details, Preview, Surfaces.
- `script`: Plan, Code.
- `automation`: Setup, Rule.

`RovoCanvasContext.tsx` defines the default landing view:

- Agents open on `agent-details`.
- Automations open on `automation-rule`.
- Scripts open on `html`, relabeled as Code.
- Everything else opens on `preview`.

The toolbar must compute the active tab set from `state.artefactKind` on every
render. Do not store the tab set separately from `artefactKind`.

### Streaming generation protocol

`useDashboardGenerator.ts` streams `/api/rovo-chat` and parses chunks with a
state machine:

1. Wait for `<PLAN>`.
2. Stream text into `state.planMarkdown` until `</PLAN>`.
3. Wait for ````html`.
4. Stream text into `state.html` until the closing fence.
5. If the HTML fence never closes, flush the remaining HTML buffer at stream
   end so the preview is not empty.

The frontend tolerates two SSE payload shapes:

```json
{ "text": "chunk text" }
```

```json
{ "choices": [{ "delta": { "content": "chunk text" } }] }
```

### Element selection

Element selection depends on these invariants:

- The preview wrapper has `data-testid="canvas-preview-frame"`.
- The preview renders through an iframe `srcDoc`.
- The iframe sandbox includes `allow-same-origin` so the parent can read
  `iframe.contentDocument`.
- On iframe load, `stampIframeElements()` assigns unique `data-rovo-id`
  attributes to every body descendant.
- Hit-testing uses `iframe.contentDocument.elementsFromPoint()` with page
  coordinates translated into iframe-local coordinates.
- Element labels resolve in this order: `data-testid`, `aria-label`, visible
  text snippet, then friendly tag name.
- Scoped edits prefer `data-rovo-id` over labels so duplicate text cannot
  target the wrong element.

The overlay uses document-level portals for hover rings, badges, rubber-band
selection, pin markers, and popovers. The popover reserves 400 px on the right
for the chat rail when calculating its position.

### Local fast-path edit parser

`RovoCanvasContext.submitScopedEdit()` imports `parseLocalEdit()` from
`iframeMutate.ts` before calling AI. Supported local intents include:

- Bigger and smaller font sizing.
- Bold and not bold.
- Italic and not italic.
- Hide and show.
- Text color.
- Background color.
- Simple general color changes.

When a local intent applies:

1. The shimmer runs around selected `data-rovo-id` targets.
2. The DOM mutates in place inside the iframe.
3. `snapshotIframeHtml()` serializes the whole iframe document.
4. `setHtml()` updates canvas state so reloads preserve the change.
5. `registerChatLogger()` appends a concise assistant confirmation.

If local parsing fails or cannot apply, the same request falls through to the
registered scoped AI edit handler.

### Scoped AI edits

`useDashboardGenerator.scopedEdit()` builds a prompt that includes each target
element's current `outerHTML` and asks the model to return one fenced `html`
block per replacement. It then replaces each target's `outerHTML`, restamps new
subtrees, reruns the iframe polyfill init hook, snapshots full HTML, and writes
the result to state.

If no target is found, scoped edit falls back to full edit. If the model returns
no parseable replacements, the handler surfaces a failure message and throws so
the shimmer can reset.

### Shimmer overlay

`CanvasShimmerOverlay.tsx` resolves each `activeEditTargets` entry to an iframe
element and remeasures it on every animation frame while active. It draws a
fixed-position SVG around each target.

The ring uses four stacked `<rect>` strokes with different dash arrays and
brand colors. The success phase swaps the animated SVG for a short green
fade-out border.

### Version history

`CanvasVersionHistoryPanel.tsx` is controlled entirely by
`isVersionHistoryOpen`. It renders as a 280 px flex child on the right edge of
the left content card, not as a modal overlay. The toolbar toggles it from
Preview and HTML/Code tabs.

The source implementation uses deterministic mock version data. Replace that
data with real history if the destination has version persistence.

### CodeMirror and plan staged edits

`HtmlPanel.tsx` and `PlanPanel.tsx` stage edits in context instead of writing
directly to canonical state:

- `pendingCodeEdit` stores unsaved CodeMirror text.
- `pendingPlanEdit` stores unsaved markdown.
- Save commits to `state.html` or `state.planMarkdown`.
- Discard clears the pending value and lets the panel resync.
- Chat-driven edits clear both pending values before applying the AI edit.

Preserve this pattern to avoid merging stale user editor state with fresh AI
edits.

### Modal lifecycle

`SmartCreationModal.tsx` keys `MaximisedModal` with `state.openCycle`. Every
`openCanvas()` and `openArtefact()` call increments `openCycle`, forcing a
fresh modal mount.

This avoids an Atlaskit `ModalTransition` race where reopening during the exit
transition leaves the modal mounted but visually hidden. Keep the pattern if
your destination modal can reopen while an exit animation is still running.

### Cancel beacon

`useDashboardGenerator.ts` registers `pagehide` and `beforeunload` listeners and
calls:

```ts
navigator.sendBeacon('/api/rovo/cancel', new Blob([JSON.stringify({})]));
```

The backend derives the session key from IP and user agent if the body does not
include one. This prevents orphaned server-side code-generation sessions from
colliding with the user's next prompt after refresh.

### Right-rail artefact cards

Chat messages can include an `artefact` object. `RovoChatMessages.tsx` renders
that object through the injected `RovoArtefactCard` component. The card reads
the artefact from `RovoCanvasContext`, opens agents and automations directly in
the canvas, and creates a blob URL for standalone HTML preview when possible.

## 6. AI generation contract

The destination can use any model provider as long as it preserves this HTTP
contract and output format.

### Generate or edit an artefact

Send a POST request to `/api/rovo-chat`:

```json
{
  "message": "Build a project health dashboard",
  "mode": "rovo",
  "isEdit": false,
  "graphSummary": "{\"projects\":[]}",
  "conversationHistory": [],
  "contextDescription": "optional extra context",
  "scopedAnnotations": [
    { "label": "metric-card-1", "text": "make it red", "id": "r12" }
  ]
}
```

Required fields:

- `message`: The user request or augmented edit prompt.
- `mode`: Must be `"rovo"` for canvas generation.

Common optional fields:

- `isEdit`: True when editing an existing artefact.
- `graphSummary`: Serialized Teamwork Graph or destination data snapshot.
- `conversationHistory`: Prior user and assistant messages.
- `contextDescription`: Extra application context.
- `artefactType`: Recommended in destinations that support multiple output
  types. Use values such as `dashboard`, `report`, `app`, `integration`,
  `script-py`, and `script-js`.
- `canvasSessionKey`: Optional stable key for server-side session reuse and
  cancellation.

### Stream response

Return an SSE stream with one or more `data:` events and a final done event:

```text
data: {"choices":[{"delta":{"content":"<PLAN>\n# Plan\n"}}]}

data: {"choices":[{"delta":{"content":"</PLAN>\n```html\n<!DOCTYPE html>"}}]}

data: [DONE]
```

The frontend also accepts:

```text
data: {"text":"chunk text"}
```

The model output inside the stream must contain exactly this logical shape:

````markdown
<PLAN>
# Plan
**Summary:** ...

## Core capabilities
- ...
</PLAN>

```html
<!DOCTYPE html>
<html>
  ...
</html>
```
````

Do not stream prose outside those two sections. The parser discards content
before `<PLAN>` and only starts HTML after the `html` fence.

### Polish pass

Send a POST request to `/api/rovo-polish` after first-pass HTML completes:

```json
{
  "html": "<!DOCTYPE html>...",
  "originalRequest": "Build a project health dashboard",
  "artefactType": "dashboard"
}
```

Return:

```json
{
  "html": "<!DOCTYPE html>..."
}
```

The source backend skips polish when local Rovo Dev is active and when the
artefact registry marks the type with `skipPolish`, such as scripts.

### Cancel

Send a POST request to `/api/rovo/cancel`. The body can be empty or include a
session key:

```json
{
  "canvasSessionKey": "canvas-browser-tab-123"
}
```

Return HTTP 204. Cancellation is best-effort and idempotent.

## 7. Adaptation cheat sheet

Apply these mechanical transforms when moving the canvas into another codebase.

- Remove `'use client'` directives unless the destination uses Next.js App
  Router or an equivalent server/client boundary.
- Replace `next/navigation` with the destination router.
- Replace `@/app/...` path aliases with the destination alias or relative
  imports.
- Replace `token("space.200")`, `token("color.border")`, and related calls with
  destination design tokens or CSS variables.
- Replace Atlaskit `Box`, `Flex`, `Stack`, `Inline`, and `Text` primitives with
  local layout primitives or plain elements.
- Replace `Button`, `IconButton`, `Tooltip`, `DropdownMenu`, `Lozenge`,
  `Spinner`, and icons with local equivalents while keeping labels,
  disabled/selected states, and test IDs.
- Replace `ModalTransition` and `AkModalDialog` with the destination modal. Keep
  the `openCycle` remount key if needed.
- Keep `@uiw/react-codemirror` and `@codemirror/lang-html` if the destination is
  React. Otherwise replace `HtmlPanel` with a local editor.
- Delete `afm/intl-shim.tsx` once strings are inlined or integrated with the
  destination i18n system.
- Replace `useSavedApps`, `cleanAppTitle`, and saved-app navigation in
  `StagingAreaHeader.tsx` with the destination's persistence or remove the Save
  as app menu item.
- Replace `serializeGraphForLLM()` with the destination's data snapshot
  serializer.
- Keep the iframe selector convention:
  `[data-testid="canvas-preview-frame"]`.
- Preserve `data-rovo-id` stamping, even if the label resolver changes.
- If the destination cannot use same-origin iframe `srcDoc`, replace element
  selection with an in-frame script bridge using `postMessage`.
- If the destination does not need agents or automations, remove their tab sets,
  panels, stores, types, and artefact-card branches. Keep dashboard, report,
  app, integration, and script paths intact.
- If the destination does not use Rovo Dev CLI, implement `/api/rovo-chat` with
  any SSE-capable model provider that follows Section 6.

## 8. Build order

Build in this order so the canvas compiles and can be tested incrementally.

1. Port `RovoCanvasContext.tsx`, `RovoChatContext.tsx`, and
   `RovoCanvasProviderWrapper.tsx`. Stub imported agent and automation types if
   needed.
2. Port modal chrome: `SmartCreationModal`, `MaximisedModal`,
   `CustomHeader`, `StagingAreaHeader`, `LoadingScreen`, `AIFooter`,
   `FeedbackBanner`, `intl-shim`, and `messages`.
3. Port `CanvasTabSwitcher` and the `CanvasInnerToolbar` logic from
   `RovoCanvasAfm.tsx`.
4. Port `PlanPanel` and `HtmlPanel`. Verify staged Save and Discard without AI.
5. Stub `useDashboardGenerator()` so it writes canned `planMarkdown` and HTML.
   Verify open, close, tabs, and panels.
6. Port `PreviewPanel`, `iframePolyfill.ts`, and `iframeMutate.ts`. Verify the
   iframe renders and common data-attribute interactions work.
7. Port `CanvasRovoChat`, `RovoChatMessages`, `RovoChatInput`, and
   `RovoArtefactCard`. Verify chat messages and edit submission plumbing.
8. Port `CanvasElementSelectOverlay`, `CanvasShimmerOverlay`, and
   `CanvasVersionHistoryPanel`. Verify hover, click annotations, drag select,
   pin markers, shimmer, and version drawer.
9. Replace the stub generator with `/api/rovo-chat` and the streaming parser in
   `useDashboardGenerator.ts`.
10. Implement `/api/rovo-polish` and `/api/rovo/cancel`.
11. Port agent and automation panels if the destination needs those artefact
    types.
12. Replace fallback templates and prompt registry with destination-specific
    templates and prompt rules.

## 9. Things intentionally out of scope

Do not extract unrelated product workflows just because they share Rovo chat
infrastructure.

- Cross-app context and supplier-risk skills in `HomeView.tsx`.
- Counsel handoff and legal-matter flows under `app/matters/`.
- Tempo or marketplace-specific demo data outside the canvas generation path.
- Global Rovo side-panel behavior unless the destination wants to port it
  separately.
- Full Atlassian setup, Bitbucket deployment, ASAP credential generation, and
  local development scripts. Those are repository concerns, not canvas concerns.

The extraction target is the fullscreen creation canvas and its direct state,
chat, iframe, AI-generation, agent, and automation dependencies.
