---
name: vpk-component-ext
description: Translate custom or third-party AI, voice, and adjacent component libraries into VPK-standardized primitives. Use when the user asks to "migrate to ui-ai", "replace custom chat", "use ui-ai message", "standardize AI components", "replace message bubble", "use conversation component", "migrate prompt input", "use code-block component", "replace custom suggestions", "switch to ui-ai", "adopt ai-elements", "elements.ai-sdk.dev", "port ElevenLabs UI", "use ui-audio", "voice picker", "waveform", "transcript viewer", "audio player", "speech input", "port this third-party component", "translate this library into VPK", or references an existing ui/ui-ai/ui-audio component and wants to migrate code to it.
---

# VPK Component External Translation

Translate custom or third-party component libraries into VPK-standardized primitives, with strong built-in support for AI chat and voice/audio surfaces.

This skill covers four source types:

1. Local custom UI in the repo
2. ai-elements components from `https://elements.ai-sdk.dev/components`
3. ElevenLabs UI components from `https://ui.elevenlabs.io/docs/components`
4. Other third-party component libraries that should be translated into VPK patterns

## Non-negotiable Defaults

- Prefer existing VPK primitives over importing upstream component packages directly
- Target `components/ui-ai/*` for chat, assistant, reasoning, prompt-composer, and AI-SDK-centric UI
- Target `components/ui-audio/*` for voice, waveform, transcript, playback, microphone, and voice-picker UI
- Target `components/ui/*` for generic reusable UI that is not specifically AI/voice oriented
- Use ADS MCP as the normalization layer for generic UI and shared interaction patterns: `ads_plan` first, then topic-specific a11y guidance before final polish
- Preserve VPK styling and docs conventions
- Do not vendor ElevenLabs output into `components/ui/*`
- Do not replace VPK primitives with raw upstream shadcn/base styles

## Context

- `components/ui-ai/` is the VPK family for AI chat, assistant messaging, prompt input, reasoning, code blocks, and related AI surfaces
- `components/ui-audio/` is the VPK family for voice playback, waveform rendering, transcript playback, microphone selection, and voice action UI
- `components/ui/` is the VPK family for generic reusable UI primitives
- `components/ui-ai/**` is excluded from TypeScript checking; call-site types must be validated manually
- `components/ui-audio/**` and `components/ui/**` are type-checked normally

## Quick Start

```bash
/vpk-component-ext components/projects/sidebar-chat/components/chat-composer.tsx
/vpk-component-ext https://elements.ai-sdk.dev/components/message
/vpk-component-ext https://ui.elevenlabs.io/docs/components/voice-picker
/vpk-component-ext https://example.com/some-component-library/button
```

---

## Workflow

### Phase 1 — Discover

1. **Read target code or docs** — inspect the file, folder, or component URL the user provided.
2. **Classify the source**:
   - Local custom repo code
   - ai-elements docs page / reference component
   - ElevenLabs docs page / upstream registry component
   - Other third-party library docs page / source component
3. **Resolve the target family** using the Family Resolver below.
4. **Read local VPK source**:
   - `components/ui/*` for generic UI targets
   - `components/ui-ai/*` for assistant/chat targets
   - `components/ui-audio/*` for voice/audio targets
5. **ADS alignment for reusable UI** — When the surface is generic UI or clearly matches an Atlassian interaction pattern, run `ads_plan` before implementation. Provide at least 2 likely search terms for every populated field (`components`, `icons`, `tokens`) and set `exactName: true` when the ADS component name is explicit. Use `ads_get_components` only for exhaustive candidate sweeps when `ads_plan` is still ambiguous, and escalate to `ads_get_all_tokens` / `ads_get_all_icons` only when you still need exhaustive token or icon lookup coverage.
6. **Read upstream reference when needed**:
   - ai-elements: `~/.agents/skills/ai-elements/references/[slug].md`
   - ElevenLabs: upstream docs or registry payload only if the local VPK port is missing or incomplete
   - Other third-party library: official docs, source examples, or registry payloads from the source library
7. **Accessibility baseline** — Before finalizing interactive surfaces, fetch `ads_get_a11y_guidelines` for the closest topic (`buttons`, `forms`, `focus`, `keyboard`, `screenReaders`, or `general`). If the source uses legacy Atlaskit spotlight/onboarding patterns, use `ads_migration_guides` instead of improvising the migration shape. If the migration introduces or rewrites user-facing literals in an intl-aware file, run `ads_i18n_conversion_guide` before leaving hardcoded JSX/content behind.
8. **Trace data flow** — follow providers, callbacks, message schemas, playback state, transcript state, or controlled props through the target surface.

## Family Resolver

Use this table before doing any mapping work:

| Source pattern | Prefer | Why |
|---|---|---|
| Chat thread, assistant messages, prompt composer, reasoning, suggestions, code blocks | `components/ui-ai/*` | This family is aligned to AI SDK message flows and chat surfaces |
| Audio player, waveform, transcript playback, voice-picker, microphone device selection, standalone speech capture | `components/ui-audio/*` | This family is aligned to voice and audio interaction patterns |
| General presentational component with no AI/voice behavior | `components/ui/*` | Default VPK primitive family for generic reusable UI |
| ai-elements component page from `elements.ai-sdk.dev/components` | Usually `components/ui-ai/*` | ai-elements is primarily message/composer/chat oriented in VPK |
| ElevenLabs component page from `ui.elevenlabs.io/docs/components` | Usually `components/ui-audio/*` | ElevenLabs components map to VPK's voice/audio namespace |
| Unknown third-party component library | Choose by behavior first, then by nearest VPK family | The target family is determined by where the component belongs in VPK, not where it came from |

### Duplicate-name Resolver

Some names exist in multiple VPK families. Choose by behavior, not by name alone.

| If you need... | Use |
|---|---|
| AI/chat message rendering with `MessageResponse`, actions, or branching | `@/components/ui-ai/message` |
| Lightweight voice/transcript message shells | `@/components/ui-audio/message` |
| AI thread container for assistant chat | `@/components/ui-ai/conversation` |
| Transcript/history container with download/export | `@/components/ui-audio/conversation` |
| AI SDK speech result playback in assistant widgets | `@/components/ui-ai/audio-player` |
| Generic track preview, voice picker preview, or transcript tooling playback | `@/components/ui-audio/audio-player` |
| Inline composer voice affordance inside prompt input | `PromptInputMicrophone` or `@/components/ui-ai/speech-input` |
| Standalone voice capture/transcription control | `@/components/ui-audio/speech-input` |
| Microphone selector embedded in AI composer flows | `@/components/ui-ai/mic-selector` |
| Generic microphone device selector for voice/audio tools | `@/components/ui-audio/mic-selector` |

## Detection Checklist

### A. `ui-ai`-oriented patterns

| # | Pattern | Look For | Target |
|---|---|---|---|
| 1 | Message bubble/container | `role === "user"` / `role === "assistant"` styling | `Message` + `MessageContent` |
| 2 | Markdown/HTML rendering | `dangerouslySetInnerHTML`, `ReactMarkdown`, custom markdown | `MessageResponse` |
| 3 | Message action buttons | Copy/retry/like/dislike controls | `MessageActions` + `MessageAction` |
| 4 | Response branching | Branch navigation or version switching | `MessageBranch` |
| 5 | Scroll container | `overflow-y-auto`, `scrollIntoView`, scroll-to-bottom | `Conversation` + `ConversationContent` |
| 6 | Scroll-to-bottom button | Floating bottom button | `ConversationScrollButton` |
| 7 | Empty state | “No messages” / welcome screen | `ConversationEmptyState` |
| 8 | Text input area | `<textarea>` for message composition | `PromptInput` + `PromptInputTextarea` |
| 9 | Submit button | Send/submit trigger | `PromptInputSubmit` |
| 10 | Composer microphone | Inline dictation toggle | `PromptInputMicrophone` or `ui-ai/speech-input` |
| 11 | File attachments | Upload UI, attachment pills | `Attachments` + `Attachment` |
| 12 | Suggestion chips | Prompt suggestions | `Suggestions` + `Suggestion` |
| 13 | Code blocks | Syntax highlighting, copy button | `CodeBlock` + header/copy helpers |
| 14 | Reasoning/thinking | Expandable reasoning display | `Reasoning` |
| 15 | Loading shimmer | Streaming placeholder | `Shimmer` |
| 16 | Model selector | Provider/model dropdown | `ModelSelector` |

### B. `ui-audio`-oriented patterns

| # | Pattern | Look For | Target |
|---|---|---|---|
| 17 | Audio playback | Play/pause, progress, speed, track preview | `AudioPlayerProvider` + related controls |
| 18 | Generic waveform | Static or scrolling audio bars | `Waveform` / `ScrollingWaveform` / `StaticWaveform` |
| 19 | Live microphone waveform | Device-reactive or synthetic processing waveform | `LiveWaveform` |
| 20 | Bar visualizer | Compact voice-state bars | `BarVisualizer` |
| 21 | Voice CTA button | Recording/processing/success/error voice button | `VoiceButton` |
| 22 | Voice picker | Voice search, preview playback, orb identity | `VoicePicker` |
| 23 | Microphone device selector | Mic dropdown, mute toggle | `MicSelector` |
| 24 | Standalone speech capture | Voice transcription control outside prompt composer | `SpeechInput` |
| 25 | Transcript playback | Word-level highlighting + scrubber + play/pause | `TranscriptViewer` + `ScrubBar` |
| 26 | Ambient voice motion | Orb, shimmering loading text, pixel matrix | `Orb`, `ShimmeringText`, `Matrix` |
| 27 | Downloadable voice history | Transcript/history export | `ui-audio/ConversationDownload` |

### C. Generic external-library patterns

| # | Pattern | Look For | Target |
|---|---|---|---|
| 28 | Generic buttons / inputs / menus / cards | Presentational UI with no AI or voice behavior | `components/ui/*` |
| 29 | Thin upstream wrapper | Vendored component with mostly styling differences | Replace with existing VPK primitive or keep a thin adapter |
| 30 | No direct VPK equivalent | New behavior not covered by ui/ui-ai/ui-audio | Create the smallest VPK-native wrapper and wire docs/examples immediately |

### Phase 2 — Map

Produce mapping tables that leave no ambiguity for the implementation.

#### 2a. Family Resolution Table

| Source Component | Source Type | VPK Family | Why |
|---|---|---|---|
| `elements Message` | ai-elements | `ui-ai` | Message rendering and markdown belong to AI chat surfaces |
| `voice-picker` | ElevenLabs | `ui-audio` | Voice preview and selection belong to audio tooling |
| `vendor button` | generic third-party | `ui` | Generic controls should land in VPK's base UI family |

#### 2b. Component Mapping

| Source Component | VPK Component | Match | Notes |
|---|---|---|---|
| `MessageBubble` | `ui-ai/Message` + `MessageContent` | Exact | Keep role styling via `from` |
| `voice-picker` | `ui-audio/VoicePicker` | Exact | Map previews and selected voice state |
| `custom waveform` | `ui-audio/Waveform` | Approximate | May need wrapper layout or scrub state |
| `third-party button` | `ui/Button` or adapter | Exact / Approximate | Choose native VPK primitive if it already exists |

Match quality:

- **Exact** — drop-in behavior match
- **Approximate** — local wrapper or `className` override needed
- **Gap** — no direct VPK primitive; compose or keep a thin custom layer

#### 2c. Props Mapping

| Source Prop | Target Prop | Notes |
|---|---|---|
| `message.role` | `from` | `ui-ai` and `ui-audio` message roots both use `from`-style semantics |
| `message.content` | children / `MessageResponse` | Choose plain content vs markdown response intentionally |
| `voiceId` | `value` | `VoicePicker` is controlled by selected id |
| `onVoiceChange` | `onValueChange` | Normalize to VPK controlled-input naming |
| `mediaStream` | `mediaStream` | `BarVisualizer` accepts live streams directly |
| upstream-only prop naming | nearest VPK naming | Normalize only if a thin adapter is necessary |

#### 2d. Gap Analysis

| Missing Feature | Coverage | Resolution |
|---|---|---|
| Custom widget rendering in assistant message | Gap | Compose inside `ui-ai/MessageContent` |
| ElevenLabs upstream writes to `components/ui/*` | Gap | Translate into `components/ui-audio/*` instead |
| Upstream visual language conflicts with VPK tokens | Gap | Rewrite classes to VPK semantic tokens and primitives |
| Specialized transcript segment logic | Approximate | Keep local hook if `ui-audio/use-transcript-viewer` is insufficient |
| Unknown third-party API shape | Gap | Map behavior to the nearest VPK family first, then keep a thin adapter if needed |

### Phase 3 — Migrate

#### 3a. Import Replacement

Use the correct family explicitly.

```tsx
// Chat/assistant migration
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ui-ai/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ui-ai/conversation";
```

```tsx
// Voice/audio migration
import {
  AudioPlayerProvider,
  AudioPlayerButton,
  AudioPlayerProgress,
  AudioPlayerTime,
} from "@/components/ui-audio/audio-player";
import { VoicePicker } from "@/components/ui-audio/voice-picker";
import { TranscriptViewerContainer } from "@/components/ui-audio/transcript-viewer";
```

```tsx
// Generic UI migration
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
```

#### 3b. Replacement Rules

1. **Preserve VPK styling** — use VPK semantic classes and primitives, not raw upstream styles.
2. **Prefer composition over reimplementation** — if a local primitive exists, wrap it instead of recreating it.
3. **Choose the target family by behavior** — not by the source library’s folder structure.
4. **Choose markdown handling intentionally**:
   - Assistant/chat rich text -> `ui-ai/MessageResponse`
   - Plain transcript or voice labels -> plain children or `ui-audio/Response`
5. **Preserve callbacks and controlled state** — wire existing events into VPK props instead of introducing new shapes.
6. **Compose for gaps** — keep thin local wrappers only when VPK does not cover the behavior directly.

#### 3c. Extension Patterns

**Legacy composer shell (outer wrapper owns chrome)**:

```tsx
const promptInputClassName = cn(
  "w-full [&>[data-slot=input-group]]:h-auto [&>[data-slot=input-group]]:border-0 [&>[data-slot=input-group]]:bg-transparent [&>[data-slot=input-group]]:shadow-none [&>[data-slot=input-group]]:ring-0",
  customHeight ? "h-full [&>[data-slot=input-group]]:h-full [&>[data-slot=input-group]]:flex-1" : null
);
```

**Voice preview composition**:

```tsx
<AudioPlayerProvider>
  <VoicePicker voices={voices} value={voiceId} onValueChange={setVoiceId} />
</AudioPlayerProvider>
```

**Transcript player composition**:

```tsx
<TranscriptViewerContainer alignment={alignment} audioSrc={audioUrl} audioType="audio/mpeg">
  <TranscriptViewerPlayPauseButton />
  <TranscriptViewerScrubBar />
  <TranscriptViewerWords />
</TranscriptViewerContainer>
```

**Wrapping for layout/styling**:

```tsx
<div className="rounded-xl border border-border bg-surface-raised p-4">
  <BarVisualizer demo state="speaking" />
</div>
```

#### 3d. Accessibility and Lint Safety

1. **Always label icon-only controls**:
   - `PromptInputActionMenuTrigger aria-label="Add"`
   - `PromptInputButton aria-label="Customize"`
   - `PromptInputSubmit aria-label="Submit"`
   - `AudioPlayerProgress aria-label="Audio progress"`
   - `ScrubBarTrack aria-label="Timeline scrubber"`
   - `ScrubBarProgress aria-label="Timeline progress"`
   - `VoiceButton aria-label="Voice Button"` or a task-specific label
2. **Keep decorative icon labels empty**:
   - `AddIcon label=""`, `ArrowUpIcon label=""`, etc.
3. **Use ESLint-safe submit handlers**:
   - Prefer `onSubmit={() => handleSubmit()}` over unused args
4. **Avoid nested-button tooltip or trigger markup**:
   - Render trigger elements through the VPK `render={...}` API when the primitive expects it
   - Do not assume upstream `asChild` support if the local VPK wrapper does not expose it
5. **PromptInput action-menu callbacks**:
   - Use `onSelect` on `PromptInputActionMenuItem`
   - Do not rely on raw `onClick` for close behavior

### Phase 4 — Examples and Docs

Create docs artifacts in the correct family.

1. **Pick the correct demo folder**:
   - `components/website/demos/ui/`
   - `components/website/demos/ui-ai/`
   - `components/website/demos/ui-audio/`
2. **Register demos in `components/website/registry.ts`**:
   - default preview registry for the category
   - category-specific variant registry entries
3. **Add detail metadata**:
   - `app/data/details/ui.ts`
   - `app/data/details/ui-ai.ts`
   - `app/data/details/ui-audio.ts`
4. **Keep slug wiring consistent**:
   - named demo export
   - registry key
   - `demoSlug` in details metadata
5. **Docs page must render**:
   - visual preview
   - examples
   - API table / sub-component docs

### Phase 5 — Validate

1. **Run baseline checks (required)**:
   - `pnpm run lint`
   - `pnpm run typecheck`
2. **Validation fallback when global baseline is noisy (required)**:
   - `pnpm exec eslint <changed files...>`
   - Report both global baseline status and changed-file status
3. **Visual comparison** — verify in browser (light + dark):
   - AI/chat surfaces render correctly
   - Voice/audio controls render correctly
   - Generic UI translations render correctly
   - Playback, scrub, waveform, and picker states look correct where relevant
4. **Runtime smoke checks**:
   - No new console/hydration errors
   - At least one stateful interaction per migrated surface
5. **Accessibility**:
   - `ads_get_a11y_guidelines` for the relevant topic when the surface introduces controls, forms, or focus management
   - `ads_analyze_a11y` on migrated source
   - `ads_analyze_localhost_a11y` scoped to the narrowest stable component/demo selector available (`main article` only when no better root exists)
   - `ads_suggest_a11y_fixes` for each material violation before choosing the final remediation
6. **Residual import gate**:
   - `rg -n "OldComponentName|old-component-path" components app`
   - Remove dead wrappers only after consumers are migrated
7. **API safety**:
   - create API delta map if props/types/events changed
   - audit all consumers before deleting legacy code
8. **Third-party fallback discipline**:
   - if the library is not ai-elements or ElevenLabs, document which VPK family you chose and why
   - prefer translating into existing VPK APIs over preserving upstream naming blindly

---

## Generic Third-Party Fallback

When the source library is neither ai-elements nor ElevenLabs:

1. Identify the component’s actual behavior.
2. Choose the nearest VPK family:
   - `ui`
   - `ui-ai`
   - `ui-audio`
3. Map upstream props into VPK naming only when you are creating a thin adapter.
4. If VPK already has a direct primitive, migrate consumers to the VPK primitive instead of vendoring the source library.
5. If the source is legacy Atlaskit spotlight/onboarding, use `ads_migration_guides` before translating the result into VPK structure.
6. If VPK does not have a direct primitive, create the smallest possible wrapper and wire docs/examples immediately.

---

## TypeScript Notes

### `ui-ai`

`components/ui-ai/**` is excluded from TypeScript checking in `tsconfig.json`.

- Read source files directly before using them
- Validate call-site props manually
- Use JSDoc or targeted `@ts-expect-error` only when truly necessary

### `ui-audio` and `ui`

`components/ui-audio/**` and `components/ui/**` are type-checked normally.

- Fix local type issues instead of masking them
- Prefer local VPK types over importing ambiguous upstream shapes when a narrower type will do

## Gotchas

### Naming Collisions

`Message`, `Conversation`, `SpeechInput`, and `AudioPlayer` can collide across families.

```tsx
import { Message as UiAiMessage } from "@/components/ui-ai/message";
import { Message as UiAudioMessage } from "@/components/ui-audio/message";
```

Always alias imports when the consuming file already has a conflicting type, variable, or alternate-family component.

### ElevenLabs CLI Collision

Do **not** run ElevenLabs UI install commands directly into the repo root as the migration strategy:

```bash
pnpm dlx @elevenlabs/cli@latest components add audio-player
```

The upstream generator expects different `components.json` conventions and writes into `components/ui/*`, which conflicts with VPK. If you need upstream source, inspect it in a scratch area and translate it into `components/ui-audio/*`.

### Source Demo as Source of Truth

When adding or modifying family components, update the canonical demo in the matching docs folder first:

- `components/website/demos/ui/`
- `components/website/demos/ui-ai/`
- `components/website/demos/ui-audio/`

Feature surfaces should copy the canonical pattern, not invent their own divergent version.

### InputGroupTextarea Hover Override

`InputGroupTextarea` must use `variant="none"` on its inner `Textarea` when the outer shell owns the chrome. Do not try to fight the default textarea hover state with ad hoc utility overrides.

---

## Checklist

### Discovery

- [ ] Target file, folder, or URL inspected
- [ ] Source type identified (local / ai-elements / ElevenLabs / generic external)
- [ ] Target family resolved (`ui`, `ui-ai`, or `ui-audio`)
- [ ] Relevant local target source files read
- [ ] Upstream docs/reference consulted when needed
- [ ] Data flow traced through providers/callbacks

### Mapping

- [ ] Family Resolution table produced
- [ ] Component Mapping table produced
- [ ] Props Mapping table produced
- [ ] Gap Analysis table produced

### Migration

- [ ] Imports replaced with the correct VPK family
- [ ] Components replaced or wrapped appropriately
- [ ] VPK styling preserved with semantic classes
- [ ] Icon-only controls have explicit labels
- [ ] Trigger wrappers do not rely on unsupported `asChild` behavior
- [ ] Dead local wrappers removed when unreferenced

### Examples

- [ ] Demo file created/updated in the correct category folder
- [ ] Demo registered in `components/website/registry.ts`
- [ ] Detail metadata updated in the correct `app/data/details/*` file

### Validation

- [ ] `pnpm run lint` checked
- [ ] If global lint is noisy, targeted ESLint on changed files passed
- [ ] `pnpm run typecheck` checked
- [ ] Accessibility code scan passed
- [ ] Accessibility live scan passed on scoped selector
- [ ] Residual import scan passed

---

## File Reference

| File | Role |
|---|---|
| `components/ui-ai/message.tsx` | AI/chat message compound component |
| `components/ui-ai/conversation.tsx` | AI/chat conversation container |
| `components/ui-ai/prompt-input.tsx` | AI/chat composer primitive |
| `components/ui-ai/code-block.tsx` | AI code display |
| `components/ui-ai/reasoning.tsx` | AI reasoning display |
| `components/ui-ai/shimmer.tsx` | AI loading shimmer |
| `components/ui-audio/audio-player.tsx` | Audio playback primitives |
| `components/ui-audio/voice-picker.tsx` | Voice selection with preview playback |
| `components/ui-audio/speech-input.tsx` | Standalone voice capture/transcription |
| `components/ui-audio/transcript-viewer.tsx` | Transcript playback + highlighting |
| `components/ui-audio/waveform.tsx` | Waveform and scrubber primitives |
| `components/ui-audio/live-waveform.tsx` | Live or synthetic microphone waveform |
| `components/ui-audio/mic-selector.tsx` | Microphone device picker |
| `components/website/registry.ts` | Demo registry for all docs categories |
| `app/data/details/ui.ts` | generic UI detail metadata |
| `app/data/details/ui-ai.ts` | ui-ai detail metadata |
| `app/data/details/ui-audio.ts` | ui-audio detail metadata |
| `~/.agents/skills/ai-elements/references/` | ai-elements reference docs |

## References

- **`references/api-reference.md`** — ui-ai compound API reference
- **`references/migration-examples.md`** — common ui-ai migration examples
- **`references/migration-catalog.md`** — ui-ai migration catalog
- **`https://elements.ai-sdk.dev/components`** — ai-elements component source docs
- **`https://ui.elevenlabs.io/docs/components`** — ElevenLabs UI source docs

## MCP Tool Reference

| Tool | Purpose |
|---|---|
| `ads_plan` | Primary ADS lookup for matching components, icons, and tokens; use 2+ search terms per populated field and `exactName` when the target is explicit |
| `ads_get_components` | Exhaustive ADS component/package lookup when `ads_plan` leaves multiple candidates |
| `ads_get_all_tokens` | Exhaustive token lookup fallback when `ads_plan` is still insufficient |
| `ads_get_all_icons` | Exhaustive icon lookup fallback when `ads_plan` is still insufficient |
| `ads_get_a11y_guidelines` | Fetch topic-specific ADS accessibility rules before finalizing interactive surfaces |
| `ads_analyze_a11y` | Analyze component code for accessibility |
| `ads_analyze_localhost_a11y` | Analyze live page for accessibility |
| `ads_suggest_a11y_fixes` | Convert concrete a11y violations into actionable before/after fixes |
| `ads_migration_guides` | Use official ADS migration playbooks for spotlight/onboarding migrations instead of guessing |
| `ads_i18n_conversion_guide` | Use when migration work introduces new literal UI strings in intl-aware codepaths |
| `resolve-library-id` + `query-docs` | Fetch library docs when primary references are needed |
| `/agent-browser` | Visual comparison in browser |
