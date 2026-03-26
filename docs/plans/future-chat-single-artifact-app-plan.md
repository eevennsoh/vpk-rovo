# Future Chat: Single Persistent Artifact with Parallel Build Execution

## Summary

Change Future Chat so that **any plan-based execution** routes to a single persistent artifact in the artifact panel — with parallel agent execution visualized as a "make grid" — instead of emitting one `genui-preview` card per task in the chat transcript.

The artifact panel becomes the build workspace: it shows a **make grid** during execution (one tile per subagent, tasks claimed from the dependency graph), then transitions to the **final rendered artifact** on completion. Post-build, users can edit via chat or the existing annotate feature (point-and-click comments queued as tasks).

Non-plan interactions remain unchanged — GenUI cards still render in the chat window for quick questions, one-off visualizations, and simple requests that don't go through planning.

---

## Architecture Overview

### Panel State Machine

The artifact panel operates as a **tri-state** system:

| State | Content | Input routing | Transitions to |
|-------|---------|---------------|----------------|
| `closed` | Hidden | Normal chat (GenUI cards, text) | `building` (on plan approval) or `preview` (reopen existing artifact) |
| `building` | Make grid (agent tiles) | New chat messages queue as pending tasks at bottom of task list | `preview` (all tasks complete) or `closed` (hard cancel → discard all) |
| `preview` | Rendered artifact (existing FC renderer) | "Editing [ArtifactName]..." indicator; chat input routes to artifact edits | `closed` (panel close → return to normal chat) or `building` (new plan approved) |

Key behaviors:
- **Closing the panel during `building`** does NOT stop the build. Agents continue. New chat messages simply won't be queued as tasks.
- **Closing the panel during `preview`** returns to normal chat mode. GenUI cards resume for non-plan interactions.
- The "editing artifact..." indicator on the chat input is a UI decoration tied to the `preview` state, not a separate state.

### Routing Decision

```
User message arrives
  ├── Plan approved? ──────────────────────── → artifact panel (building → preview)
  ├── Artifact panel open (preview state)? ── → artifact_update on active artifact
  ├── Artifact panel closed? ─────────────── → normal chat (GenUI cards, text, etc.)
  └── Explicit "create new artifact" intent? → artifact_create (new artifact, existing intent detection)
```

The routing signal is a combination of:
1. **Plan approval** → triggers `closed → building` transition
2. **Panel state** → `preview` means input targets the active artifact; `closed` means normal chat
3. **Existing intent detection** → already distinguishes versioning (same artifact) vs. creating a new artifact

### Artifact Lifecycle

- **Creation**: First plan approval in a thread creates the artifact shell. If creation fails, the system retries on the next turn (no GenUI fallback — commits to artifact mode).
- **Updates**: All plan task outputs compose into the same artifact. Post-build edits (chat or annotations) also target the active artifact.
- **Multiple artifacts**: A thread can hold multiple artifacts, switchable via the existing artifact dropdown icon button. Creating a "new" artifact archives the current one.
- **Persistence**: Store `activeArtifactId` on the thread model. On page reload, if the thread has an active artifact, restore panel to `preview` state.
- **No expiration**: Artifacts persist indefinitely with the thread.

---

## Make Grid: Parallel Build Execution

### Agent Pool Model

**Subagent-first** — a single RovoDev Serve port is sufficient for parallelism.

- RovoDev Serve's `invoke_subagents` supports up to **4 concurrent subagents** per invocation via `asyncio.gather()`.
- Each make grid tile represents one subagent.
- A single serve port yields up to 4 parallel tiles. Multiple serve ports are a scaling bonus, not a requirement.
- Subagents operate in isolated contexts with their own model instances.

### Tile Behavior

Each tile in the make grid represents an agent in the pool:

| Tile element | Source |
|-------------|--------|
| Agent identity | Subagent name/index |
| Current task | Task claimed from `update_todo` queue |
| Status | `idle` → `claimed` → `in-progress` → `done` / `error` |
| Visual indicator | Which task the agent has claimed |

### Task Execution Flow

```
Plan approved
  → Panel transitions to `building` (make grid visible)
  → Agent(s) call update_todo to mark first eligible tasks as in-progress
  → Subagents claim independent tasks in parallel (respecting dependency graph)
  → Each completed task emits update_todo data parts → make grid tiles update
  → Dependent tasks become unblocked → next agents claim them
  → Final task (typically assembly/testing) runs last
  → All tasks complete → panel transitions to `preview` (motion-designed transition)
```

### Dependency & Merge Model

- The **planning phase** defines task dependencies (what blocks what, what depends on what).
- Independent tasks run in parallel across subagents. Dependent tasks wait for their blockers.
- No file-level locking or merge step needed — the plan structure itself prevents conflicts.
- All task outputs contribute to **one shared codebase** that composes into the final artifact.

### Compose Model

**File-per-task with stitch at end:**

1. Each agent produces code for its assigned scope (a route, a component, a utility module).
2. The final plan task (assembly/testing) takes all outputs and composes them into the renderable artifact.
3. The compose step resolves imports, entry points, and integration boundaries.
4. The composed artifact renders using the **existing FC artifact renderer** — same GenUI rendering technology, just displayed in the artifact panel instead of the chat window.

### Data Flow

Agent status updates flow through the existing streaming infrastructure:

1. Agents call `update_todo` to change task status.
2. `update_todo` emits data parts through the existing chat stream.
3. The make grid component subscribes to these data parts and updates tile states in real-time.
4. No polling, no new WebSocket connections, no new streaming infrastructure required.

### Error Handling

- **Auto-retry**: Failed tasks are retried up to N times automatically.
- **Independent tasks continue**: Other agents working on non-dependent tasks are not blocked.
- **Eventual pause**: If retries are exhausted, the build pauses and surfaces the error to the user.
- **Failed tile visual**: The errored tile shows failure state with details.

### Build Cancellation

- **Hard cancel, discard all**: Stopping all agents immediately, discarding all outputs.
- The artifact reverts to its state before the build started (or nothing if first build).
- User can restart by re-approving the plan or modifying and re-submitting.

### Grid-to-Preview Transition

When all tasks complete, the make grid transitions to the artifact preview with a **motion-designed animation** (use the `/motion` skill to design the transition — tiles converge/collapse into the rendered artifact).

---

## Post-Build Editing

### Chat-Based Edits

With the artifact panel open (preview state), the chat input shows "Editing [ArtifactName]..." and all messages route to artifact updates:

- Natural language: "change the button color to blue", "add a search bar"
- System interprets intent and patches the artifact code
- Uses `artifact_update` mechanism on the active artifact

### Annotation-Based Edits

The existing annotate feature (point-and-click on the artifact UI + add comment) works as follows:

1. User clicks on a UI element in the artifact preview and adds a comment.
2. Comments accumulate — user can add multiple annotations.
3. When the user triggers "Apply all", annotations are queued as individual tasks **in the order they were added** (not batched into one task).
4. **Annotations execute in the normal chat window** — they do NOT spawn the make grid. This is a lightweight single-agent path.
5. Each annotation task updates the artifact sequentially.

### New Tasks During Build

While the make grid is actively running:
- Users can send new messages via chat.
- New tasks get appended to the **bottom of the pending task queue** (via `update_todo`).
- They are picked up by the next idle agent in order.
- The plan structure is not modified — new tasks are simply appended with `pending` status.

---

## Plan Mode Integration

### Same Flow, Different Output

The existing plan mode flow (`qa → plan → execution`) is unchanged:

- **QA phase**: Same as today.
- **Plan phase**: Same plan format, same `update_todo` task structure with dependencies.
- **Execution phase**: Instead of sequential single-agent execution rendering GenUI cards, tasks execute in parallel via the make grid and compose into the artifact.

### Auto-Start on Plan Approval

Plan approval automatically:
1. Opens the artifact panel
2. Displays the make grid
3. Agents begin claiming tasks immediately

No explicit "Build" button required.

---

## Mobile / Responsive

- On mobile or narrow viewports, the artifact panel goes **full-screen**.
- Make grid tiles stack vertically.
- Chat is accessible via a back button.
- Same tri-state behavior applies.

---

## Non-Plan Interactions (No Change)

When the artifact panel is closed and the user is in normal chat mode:

- **No changes** to how non-plan interactions behave.
- GenUI cards still appear for one-off visualizations, data summaries, and quick requests.
- Text responses remain in the chat transcript.
- The system only engages artifact mode when a plan is approved.

---

## Implementation Changes

### 1) Route plan-based execution to artifact panel

- Add a guard in the output-routing path: **when a plan is approved, suppress `intent_task_toolable → genui-preview` routing**.
- Bypass:
  - `shouldForceCardFirstGenui`
  - `tryEmitCreateIntentDirectGenuiWidget(...)`
  - Generic post-tool `genui-preview` fallback
- Trigger: plan approval event (not just "app-building" — any plan-based execution).

### 2) Establish the artifact panel tri-state

- Add panel state management: `closed | building | preview`.
- `closed → building`: triggered on plan approval (auto-start).
- `building → preview`: triggered when final task completes (with motion transition).
- `preview → closed`: triggered on panel close (returns to normal chat).
- `closed → preview`: triggered when reopening an existing artifact.
- Store `activeArtifactId` on the thread model for persistence across reloads.

### 3) Implement make grid in the artifact panel

- Render agent tiles in the artifact panel during `building` state.
- Each tile represents one RovoDev Serve subagent.
- Tiles subscribe to `update_todo` data parts for real-time status updates.
- Support up to 4 concurrent tiles per serve port via `invoke_subagents`.
- Tiles show: agent identity, claimed task, status (idle/claimed/in-progress/done/error).

### 4) Implement compose step

- The final plan task (assembly/testing) takes all agent outputs and produces the renderable artifact.
- Use the existing FC artifact renderer for display.
- GenUI rendering technology is reused — same generation, different display target (artifact panel instead of chat window).

### 5) Support post-build editing

- In `preview` state, show "Editing [ArtifactName]..." indicator on chat input.
- Route chat messages to `artifact_update` on the active artifact.
- Support annotation-to-task queue: annotations accumulate, apply in order, execute in normal chat window (not make grid).

### 6) Support multiple artifacts per thread

- Use the existing artifact dropdown icon button for switching.
- Existing intent detection distinguishes versioning (same artifact) vs. creating new artifact.
- Creating a new artifact archives the current one.

### 7) Handle artifact creation failure

- If first artifact creation fails, retry on the next turn.
- No GenUI fallback — the thread commits to artifact mode.
- The system does not enter a limbo state; it simply retries until successful.

---

## Test Plan

### Backend Routing Tests

- Plan approved with no active artifact → creates one artifact, make grid appears, not a `genui-preview`
- Plan task execution in `building` state → agents claim tasks and update artifact
- All plan tasks complete → panel transitions from `building` to `preview`
- Explicit "create a new/separate app/artifact" → creates new artifact (existing intent detection)
- Non-plan chat with panel closed → GenUI card path unchanged
- Non-plan chat with panel open in `preview` → routes to `artifact_update`

### Make Grid Tests

- Single serve port → up to 4 subagent tiles via `invoke_subagents`
- Independent tasks → claimed and run in parallel by different subagents
- Dependent tasks → wait for blockers to complete before being claimed
- Agent failure → auto-retry, independent tasks continue, eventual pause on exhaustion
- User cancels build → hard cancel, discard all outputs, artifact reverts
- New task added during build → appended to bottom of pending queue
- Panel closed during build → build continues, new messages don't queue

### Artifact Lifecycle Tests

- Thread with `activeArtifactId` → restores `preview` state on page reload
- Multiple artifacts in thread → dropdown switcher shows all, switching updates "Editing..." indicator
- Artifact persists indefinitely → old artifacts remain renderable
- Artifact creation failure → retries on next turn, no GenUI fallback

### Post-Build Editing Tests

- Chat message with panel open in `preview` → `artifact_update` on active artifact
- Multiple annotations added → accumulate and apply in order when triggered
- Annotations execute in normal chat window, not make grid
- Closing panel after build → normal chat mode, GenUI cards resume

### Integration Tests

- Full flow: plan approval → make grid → parallel execution → compose → artifact preview → post-build edit
- Thread with accumulated old GenUI cards → new plan-based turns use artifact, old cards untouched
- Mobile viewport → full-screen artifact panel, stacked tiles

### UI Validation

- Artifact panel opens automatically on plan approval
- Make grid tiles update in real-time via `update_todo` data parts
- Motion-designed transition from make grid to artifact preview
- "Editing [ArtifactName]..." indicator appears in `preview` state
- Transcript no longer stacks "Open preview" cards for plan-based execution
- Existing GenUI-only use cases still render correctly in normal chat

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| GenUI cards per plan-based thread | Near zero | Count `genui-preview` emissions in plan execution flows |
| Task completion rate | Increase | Users complete app-building tasks without piecing together multiple cards |
| Build time | Decrease (via parallelism) | Time from plan approval to viewable artifact |
| Post-build edit engagement | Track adoption | Users engage with annotation and chat-based artifact edits |

---

## Assumptions & Defaults

- Reuse the existing Future Chat artifact/document model and renderer — no new workspace type.
- Reuse GenUI rendering technology — same generation pipeline, different display target.
- No migration needed for already-persisted transcript messages; fix forward only.
- Any plan-based execution triggers the artifact flow, not just "build me an app" requests.
- `update_todo` is the single source of truth for task state and the data flow mechanism for the make grid.
- RovoDev Serve's `invoke_subagents` (up to 4 concurrent) is the parallelism mechanism.
- The plan's dependency graph is the merge/conflict prevention mechanism — no file-level locking needed.
- The last plan task (assembly/testing) serves as the compose step.
- Existing intent detection handles versioning vs. new artifact disambiguation.
- Panel state (open/closed) is the primary routing signal for whether input targets the artifact or normal chat.
