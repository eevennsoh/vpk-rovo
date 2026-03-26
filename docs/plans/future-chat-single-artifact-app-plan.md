# Future Chat: Reuse One Persistent App Artifact Instead of Emitting GenUI Cards Per Task

## Summary
Change Future Chat’s app-building flow so a thread creates **one persistent artifact/app workspace** and all subsequent task-style implementation turns update that same artifact instead of rendering a new `genui-preview` card per task.

This is a backend-routing fix first, with no new product surface required. It reuses the existing Future Chat artifact/document model and artifact pane. GenUI cards should remain available for true visualization/data-summary requests, but not for iterative app-building task execution.

## Implementation Changes
### 1) Treat app-building task runs as artifact flows, not GenUI card flows
- Add a clear guard in the Chat SDK / output-routing path so **task-like build turns in a persistent app-building thread do not enter card-first GenUI routing**.
- Specifically suppress the current `intent_task_toolable -> genui-preview` behavior when the thread is already in an app/artifact execution flow.
- Keep current GenUI behavior for genuine chart/dashboard/widget/data-view requests that are not part of iterative app construction.

### 2) Establish and preserve a single thread-owned app artifact
- Reuse the existing Future Chat artifact/document workspace as the canonical “app home.”
- On the first “build me an app” / artifact-capable turn, create one artifact/document shell and persist it as the thread’s active document.
- On later task turns, default to `artifact_update` for that same active artifact unless the user explicitly asks for a separate/new artifact.
- Ensure approved-plan task prompts like “Create route”, “Build KPI row”, “Compose final page” are interpreted as updates to the current app artifact, not new visual cards.

### 3) Add a decision signal for “persistent app build mode”
- Introduce a thread/run-level signal derived from existing context, such as:
  - plan approval already happened for an app-building request, and/or
  - an active artifact exists for the thread, and/or
  - the current request is a plan task execution turn
- Use that signal in the output-routing layer to bypass:
  - `shouldForceCardFirstGenui`
  - `tryEmitCreateIntentDirectGenuiWidget(...)`
  - generic post-tool `genui-preview` fallback
- Preserve existing explicit escape hatches:
  - user explicitly asks for a new/separate artifact
  - user explicitly asks for a dashboard/chart/widget/visual summary unrelated to the current app artifact

### 4) Keep transcript behavior simple and stable
- For artifact-update turns, emit normal artifact summary/status text plus artifact result/update signals, not a new `genui-preview` widget.
- The artifact pane should remain the single visible evolving workspace for the thread.
- Existing transcript cards already stored in old threads do not need migration; this change applies to new turns going forward.

### 5) Minimal interface/behavior changes
- No new public API route is required.
- Reuse existing route-decision and artifact-result shapes.
- The main behavior change is:
  - **before:** task execution turns often become `genui_card`
  - **after:** task execution turns in persistent app-build mode become `artifact_create`/`artifact_update`

## Test Plan
### Backend routing tests
- “build me an app” with no active artifact → creates one artifact, not a `genui-preview`
- approved-plan task turn with active artifact → routes to `artifact_update`
- repeated task turns in same thread → keep updating same document id
- explicit “create a new/separate app/artifact” → creates a new artifact
- explicit chart/dashboard/data-visualization request outside artifact execution flow → still uses GenUI card path

### Integration / persisted-thread behavior
- A thread like `35ba7541-8972-4a8a-910c-ef25c6f1288c` should stop accumulating one preview card per task for new turns
- Assistant turns for task execution should emit `data-artifact-result` and artifact summaries rather than `data-widget-data(type=genui-preview)`
- Active document id remains stable across sequential build tasks

### UI validation
- In Future Chat, the artifact pane stays open as the single evolving app workspace
- Transcript no longer stacks “Open preview” cards for each implementation step
- Existing GenUI-only use cases still render correctly

## Assumptions / Defaults
- Reuse the existing Future Chat artifact/document model rather than creating a new “App” workspace type.
- No migration is needed for already-persisted transcript messages; fix forward only.
- “Build me an app” and plan-task execution turns should prefer artifact updates by default once an active app artifact exists.
- GenUI remains valid for true visualization/card use cases, but not as the default surface for iterative app construction.
