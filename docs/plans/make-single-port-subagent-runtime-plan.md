# First Coding Pass: Rewrite Make Runtime for Single-Port Subagent Execution

## Summary

Implement the backend execution rewrite first, because that is the blocker for everything else. The current failure is caused by Make trying to execute multiple top-level RovoDev streams in parallel against one Serve port. The first pass should replace that with one parent orchestration stream per run, with up to 4 concurrent subagent lanes inside it.

Do **not** try to finish artifact import in the same pass. Get execution stable first.

## Implementation Changes

### 1) Replace per-task concurrent execution in `backend/make/make-runs.js`
- Remove the current scheduler behavior where `scheduleRun()` launches multiple `executeTaskWithRetry()` promises and each task calls `callModelForMarkdown(...)`.
- Introduce a parent orchestration loop per run:
  - compute ready tasks from the DAG
  - take up to `min(run.agentCount, 4)` ready tasks
  - assign them to existing logical lanes
  - issue one parent RovoDev request for that batch
  - wait for batch completion results
  - update run/task state
  - continue until no non-terminal tasks remain

### 2) Keep logical lanes exactly as the tile model
- Reuse `team-run-lanes.js` unchanged for lane naming/assignment unless a tiny cleanup is required.
- Lanes remain:
  - `lane-1`
  - `lane-2`
  - `lane-3`
  - `lane-4`
- They now represent subagent slots, not workers backed by separate ports.

### 3) Add a Make orchestration prompt that explicitly uses subagents
- Create a dedicated parent prompt builder in `backend/make/make-runs.js` for batch execution.
- It should include:
  - plan title / description
  - the ready task batch
  - dependency outputs for each task
  - lane assignment for each task
  - directives / skill context
  - instruction to use `invoke_subagents` for parallel work
  - instruction to produce structured per-task completion summaries
- The parent should treat the batch as a coordinated execution step, not as one monolithic response.

### 4) Run Make batches through a single RovoDev stream with subagent events enabled
- In the Make execution path, route the parent orchestration request through `streamViaRovoDev(...)` with:
  - `includeSubagentEvents: true`
  - single-port serialized top-level execution
- Do not open a second top-level stream while the parent run stream is active.

### 5) Translate subagent stream output back into Make run events
- Use gateway-provided `subagentName` / `subagentToolCallId` metadata to map streamed progress to lanes/tasks.
- Emit the existing Make event model:
  - `task.claimed`
  - `agent.update`
  - `task.completed`
  - `task.failed`
  - `run.completed`
- Preserve the current SSE shape in `lib/make-run-types.ts` so Make UI and Future Chat do not need a protocol rewrite in this pass.

### 6) Remove pool-style unhealthy-port handling from Make execution
- For the Make runtime path, do not treat a 409 as “pick another port.”
- A 409 during Make orchestration means the Make runtime incorrectly started overlapping top-level execution.
- Fail the run cleanly and surface the error if that happens.
- Keep generic pool logic for other surfaces, but Make should run in a single-port serialized mode.

### 7) Keep Future Chat integration unchanged in this pass
- Future Chat already creates a Make run and subscribes to Make SSE.
- Once Make emits real progress, Future Chat should begin working without more UI rewrites.
- Leave artifact import for the next pass.

## Test Plan

### Runtime behavior
- Start a Make run with at least 4 independent tasks:
  - only one top-level RovoDev stream is active
  - up to 4 logical lanes progress in parallel
  - no 409 “Chat already in progress” occurs during normal operation

### Scheduling
- Independent tasks start in the same batch.
- Dependent tasks wait until prerequisites are completed.
- Retry behavior still works for failures.
- Blocked tasks become terminal only when dependency failure truly prevents progress.

### SSE compatibility
- `GET /api/make/runs/:runId/stream` still emits valid:
  - `snapshot`
  - `agent.update`
  - `task.*`
  - `run.*`
- Existing Make UI and Future Chat build pane render from those events without new frontend protocol changes.

### Failure behavior
- Force orchestration failure:
  - run becomes failed cleanly
  - no port unhealthy/recovery thrash loop
  - explicit failure is visible in run state

## Assumptions

- There is exactly one local RovoDev Serve port.
- That single Serve turn can spawn up to 4 concurrent subagents.
- Future Chat can stay on the current Make-run bridge while Make backend execution is being corrected.
- Artifact import will be handled in the next pass, after backend execution is stable.
