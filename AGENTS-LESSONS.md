# Lessons

Running log of corrections and patterns learned during sessions.
Distill recurring patterns into permanent rules in CLAUDE.md or .claude/rules/.
Mark promoted entries with `[Promoted]` prefix — see vpk-lesson skill for details.

---

### 2026-03-24 - Use the Serve-native deferred flow for plan-mode tools

- **What happened:** Future Chat repeatedly broke the planning chain by
  treating both `ask_user_questions` and `exit_plan_mode` like custom paused
  approval flows, mixing `resume_tool_calls`, synthetic approval payloads,
  manual agent-mode toggles, and a local make-grid build path. This caused
  stuck or invalid plan reviews, duplicate question cards, malformed tool
  history, and plan cards that drifted from the real `exit_plan_mode` payload.
- **Why:** Both tools are real deferred tools in RovoDev Serve and must be
  answered through the deferred-result contract instead of local approval
  plumbing. `exit_plan_mode` in particular depends on exact result strings like
  `"Accept."`, and plan rejection must cancel the pending deferred tool instead
  of reusing the next prompt as synthetic feedback.
- **Rule:** For `ask_user_questions` and `exit_plan_mode`, render UI from the
  actual deferred-tool request event and return results through the
  Serve-native deferred response path only. In Future Chat, map Build to
  `"Accept."`, a normal reply to plan feedback, and Plan-off plus the next
  prompt to cancel the pending deferred tool and send the new prompt in
  default mode; do not route plan acceptance through custom approval or
  make-grid logic.

- **What happened:** Future Chat app generation recreated host-level shell
  chrome, including top navigation and the floating Rovo launcher, which caused
  duplicate UI like a top nav inside a top nav.
- **Why:** The shared make-run prompt constrained file placement but did not
  tell the generator that Future Chat previews are embedded feature surfaces
  inside an existing shell.
- **Rule:** For Future Chat app generation, treat the output as a mini feature
  or widget by default. Do not add `AppLayout`, top navigation, product
  sidebar, floating Rovo button, global Rovo chat panel, or equivalent
  host-shell chrome unless the user explicitly asks to prototype the shell
  itself.

### 2026-03-30 - Future Chat plan card → Build → execution full flow reference

- **What happened:** Multiple AI sessions spent significant time rediscovering
  how the plan card works and what happens after clicking Build, leading to
  repeated back-and-forth before the flow worked correctly.
- **Why:** The flow spans ~8 files across frontend and backend with a non-obvious
  deferred-tool-call resume pattern. Without a documented trace, each session
  re-derives it from scratch and often gets the handoff wrong.
- **Rule:** The full plan card → Build → execution chain is:
  1. **Plan card renders** from `data-widget-data` parts with `deferredToolCallId`
     (`plan-widget.ts` → `plan-widget-inline-card.tsx`).
  2. **Build click** calls `acceptPlanReview()` in `use-future-chat.ts`, which
     creates a `PlanApprovalSubmission` with `decision: "auto-accept"` and the
     `deferredToolCallId` from the plan widget.
  3. **Frontend sends** `POST /v3/stream_chat` with
     `deferredToolResponse: { tool_call_id, result: "Accept." }` and
     `isPlanMode: false`, plus message metadata `source: "plan-approval-submit"`.
  4. **Backend** (`server.js`) extracts the deferred tool response, clears the
     active deferred tool call, transitions the plan session to `phase: "execution"`,
     builds resume decisions via `buildResumeDecisionsFromApprovalSubmission()`,
     and calls `rovoDevResumeToolCalls(port, { decisions })` → RovoDev Serve's
     `POST /v3/resume_tool_calls`.
  5. **RovoDev agent resumes** the paused `exit_plan_mode` tool with result
     `"Accept."` and begins executing the plan tasks.
  6. **Agent calls `update_todo`** during execution; the backend streams these
     tool-call results back.
  7. **Frontend** parses `update_todo` output via
     `getLatestFutureChatTodoProgress()` in `future-chat-update-todo-progress.ts`,
     then `resolveFutureChatPlanExecutionTracker()` merges todo snapshots with
     plan tasks to build a `PlanExecutionTrackerViewModel`.
  8. **TaskProgress UI** (`future-chat-plan-execution-tracker.tsx`) renders live
     status groups (done / in-progress / todo) with run timing and agent count.
     Key files: `plan-widget.ts`, `plan-approval.ts`, `use-future-chat.ts`,
     `server.js`, `rovodev-client.js`, `future-chat-update-todo-progress.ts`,
     `future-chat-plan-execution-tracker.ts/.tsx`.
