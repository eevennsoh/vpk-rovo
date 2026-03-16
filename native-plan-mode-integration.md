# Native Plan Mode Integration

## Summary

Replace VPK's bespoke planning flow (planning gate + `planMode`/`planModeSource` body params + `create-plan` skill gating) with RovoDev's native `PUT /agent-mode { mode: "plan" }` for both Future Chat and Make.

## Context

### Current bespoke flow (broken in Future Chat, working in Make)

1. Frontend planning gate (LLM classification) detects planning intent
2. VPK generates a question card widget before RovoDev sees the message
3. User answers → `submitClarification` sends with `planMode: true` + `source: "clarification-submit"`
4. `rovo/config.js` system prompt tells RovoDev it can use `get_skill("create-plan")`
5. Backend `extractPlanWidgetPayloadFromStructuredText` parses plan output

**Problem**: Future Chat's `submitClarification` (`use-future-chat.ts:1530-1552`) was missing both `source: "clarification-submit"` metadata and `planMode` context. But rather than patch the bespoke flow, we're replacing it entirely.

### Native plan mode flow (target)

RovoDev Serve exposes `PUT /agent-mode` with modes: `ask`, `default`, `plan`.

Plan mode is a host-controlled state machine:
- **Manual entry**: User toggles "Plan" button in composer → VPK calls `PUT /agent-mode { mode: "plan" }`
- **Programmatic entry**: Host auto-enters for complex artifact creation requests
- **Agent cannot self-enter** plan mode, but can recommend it

When in plan mode, RovoDev:
1. Enters readonly mode (filesystem-tools restricted)
2. Explores codebase with readonly tools
3. Optionally calls `ask_user_questions` (deferred tool) if clarification is needed
4. Calls `exit_plan_mode` (deferred tool) with a markdown plan
5. VPK renders plan card + approve/reject buttons
6. On approval, RovoDev internally switches to DEFAULT mode, creates todolist, implements

`ask_user_questions` is NOT automatic — RovoDev uses it only when:
- Requirements are ambiguous
- Multiple valid implementation directions exist
- User needs to choose scope, behavior, or tradeoffs

## Architecture decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Plan mode mechanism | Native `PUT /agent-mode` | Aligned with RovoDev's capabilities; replaces bespoke gate |
| Who decides when to ask questions | RovoDev (in plan mode) | Agent has context to judge; simpler VPK code |
| Who decides when to enter plan mode | Host (VPK) + user toggle | Explicit state machine, not implicit |
| Plan approval handling | RovoDev handles mode switch internally | Deferred tool response triggers internal transition |
| Auto-entry trigger | Artifact creation + complexity check | Extend `smart-generation-intent` classification |
| Surfaces | Both Future Chat and Make | Clean break, remove all bespoke code |
| Toggle state | Ephemeral (React state, resets on reload) | Auto-resets after plan approval anyway |
| Session affinity | Per-session (existing mechanism) | VPK already tracks which RovoDev port a thread uses |
| Plan rendering | Plan card (already supports markdown) | `exit_plan_mode` markdown → plan card widget |
| Toggle during streaming | Disabled | Prevents state confusion mid-response |
| Post-approval toggle state | Auto-resets to OFF | RovoDev switches to DEFAULT internally |
| Bespoke code | Remove entirely | Clean architecture, no dead paths |

## Implementation plan

### Phase 1: RovoDev Serve client for `/agent-mode`

**New file**: `backend/lib/rovodev-agent-mode.js`

Add client functions to call the RovoDev Serve `/agent-mode` endpoints:
- `getAgentMode(port)` — `GET /agent-mode`
- `setAgentMode(port, mode)` — `PUT /agent-mode { mode }` where mode is `"plan"` | `"default"` | `"ask"`
- `getAvailableModes(port)` — `GET /available-modes`

Use the existing `request()` helper from `rovodev-client.js`.

### Phase 2: Deferred tool handling for `exit_plan_mode`

**Files to modify**:
- `backend/lib/rovodev-gateway.js` — Handle `exit_plan_mode` deferred tool events (alongside existing `ask_user_questions` handling)
- `backend/server.js` — Route `exit_plan_mode` deferred tool requests to the frontend as plan card widgets

`exit_plan_mode` raises `CallDeferred()` in RovoDev. The gateway already handles deferred tool requests (see `deferred-request` event parsing in `rovodev-client.js:376-392`). Add:
- When `toolName === "exit_plan_mode"`: extract the markdown plan from `toolInput.plan`, convert to plan widget format, stream as `data-widget-data` with type `"plan"` + an approval prompt
- The plan card renders with approve/reject buttons
- On approval: send deferred tool response with `{ approved: true }` → RovoDev internally switches to DEFAULT mode
- On rejection: send deferred tool response with feedback → RovoDev stays in plan mode, revises

### Phase 3: Plan mode toggle in Future Chat

**Files to modify**:
- `components/projects/future-chat/hooks/use-future-chat.ts` — Add `isPlanMode` state, `togglePlanMode` callback, `PUT /agent-mode` calls
- `components/projects/future-chat/components/future-chat-composer.tsx` — Add "Plan" toggle button (reference Make's `isMakeActive`/`onMakeToggle` pattern)
- `components/projects/future-chat/components/future-chat-shell.tsx` — Wire toggle state

Toggle behavior:
- Button shows "Plan" with icon, highlighted when active
- Disabled while streaming (`chatTabIsStreaming || chatTabIsSubmitPending`)
- On toggle ON: call backend endpoint that calls `PUT /agent-mode { mode: "plan" }` on the thread's RovoDev session
- On toggle OFF: call `PUT /agent-mode { mode: "default" }`
- Auto-resets to OFF when plan is approved (listen for plan approval deferred tool response)

**New backend endpoint** (in `backend/server.js`):
- `POST /api/agent-mode` — Accepts `{ mode, threadId }`, resolves the RovoDev port for the thread's session, calls `PUT /agent-mode`
- Frontend proxy in `app/api/agent-mode/route.ts`

### Phase 4: Plan approval flow in Future Chat

**Files to modify**:
- `components/projects/future-chat/hooks/use-future-chat.ts` — Handle plan approval submission (send deferred tool response for `exit_plan_mode`)
- `components/projects/future-chat/components/future-chat-messages.tsx` — Render plan card widget with approval UI
- `components/projects/future-chat/components/future-chat-shell.tsx` — Wire approval callbacks

Reference Make's existing patterns:
- `components/projects/shared/lib/plan-widget.ts` — Plan parsing (already shared)
- `components/projects/shared/lib/plan-approval.ts` — Approval submission building (already shared)
- `components/projects/make/components/make-card-widget-inline.tsx` — Plan card rendering reference
- `components/blocks/approval-card/page.tsx` — Approval card UI reference

### Phase 5: Plan mode toggle in Make

**Files to modify**:
- `components/projects/make/hooks/use-make-chat.ts` — Replace `planMode: true`/`planModeSource` body params with `PUT /agent-mode` calls
- `app/contexts/context-make.tsx` — Update `toggleMakeMode` to call the new `/api/agent-mode` endpoint
- `components/projects/make/components/make-fullscreen-chat.tsx` — Update toggle behavior (already has `handleMakeToggle`, update the underlying mechanism)

Make's existing toggle UX stays the same — only the underlying mechanism changes from bespoke `planMode` body params to native `PUT /agent-mode`.

### Phase 6: Auto-entry for complex artifact creation

**Files to modify**:
- `backend/lib/smart-generation-intent.js` — Extend schema to include a `complexity` signal (e.g., `"simple"` | `"complex"`)
- `backend/server.js` — When intent is artifact creation + complexity is high, auto-call `PUT /agent-mode { mode: "plan" }` before forwarding to RovoDev

Complexity signals:
- Task is large or risky
- User asks for design before coding
- Changes would span many files
- Ambiguity detected (missing essential details)

### Phase 7: Remove bespoke planning code

**Files to modify/remove**:
- `backend/lib/planning-question-gate.js` — Delete file
- `backend/lib/planning-question-gate.test.js` — Delete file
- `backend/lib/plan-mode-resolution.js` — Delete file (no longer needed; mode managed via `/agent-mode`)
- `backend/server.js` — Remove:
  - `shouldGatePlanningQuestionCard()` call and early return (~lines 4849-4878)
  - `isPostClarificationTurn` check (~line 4077-4079)
  - `extractPlanWidgetPayloadFromStructuredText` fallback (~lines 8399-8404)
  - `planMode`/`planModeSource` body param extraction and `resolvePlanMode()` usage
  - `PLANNING_GATE_SKIP_SOURCES` constant
- `rovo/config.js` — Remove lines 24-25 (plan-mode gating instructions for `create-plan`, `update_todo`, `enter/exit_plan_mode`). These tools are now gated by native plan mode, not system prompt.
- `backend/lib/plan-widget-fallback.test.js` — Update/remove as needed

### Phase 8: Update `ask_user_questions` handling

Both Future Chat and Make already handle `ask_user_questions` via the deferred tool mechanism. Verify:
- Future Chat's deferred tool response path works correctly (it previously had bugs in `submitClarification`)
- Both surfaces correctly send `deferredToolResponse` with `tool_call_id` and `result`
- No bespoke `source: "clarification-submit"` metadata needed (the deferred tool response is the native mechanism)

## Key files

| File | Role |
|------|------|
| `backend/lib/rovodev-agent-mode.js` | **New** — Client for RovoDev Serve `/agent-mode` endpoints |
| `backend/lib/rovodev-client.js` | Existing `request()` helper used by new client |
| `backend/lib/rovodev-gateway.js` | Handle `exit_plan_mode` deferred tool events |
| `backend/server.js` | Route deferred tools, remove bespoke gate, add `/api/agent-mode` endpoint |
| `app/api/agent-mode/route.ts` | **New** — Frontend proxy for `/api/agent-mode` |
| `components/projects/future-chat/hooks/use-future-chat.ts` | Plan mode state, toggle, approval flow |
| `components/projects/future-chat/components/future-chat-composer.tsx` | "Plan" toggle button |
| `components/projects/make/hooks/use-make-chat.ts` | Replace bespoke planMode with native `/agent-mode` |
| `app/contexts/context-make.tsx` | Update `toggleMakeMode` mechanism |
| `backend/lib/smart-generation-intent.js` | Extend with complexity signal for auto-entry |
| `rovo/config.js` | Remove plan-mode gating instructions |
| `backend/lib/planning-question-gate.js` | **Delete** — Replaced by native plan mode |
| `backend/lib/plan-mode-resolution.js` | **Delete** — Replaced by native plan mode |
| `components/projects/shared/lib/plan-widget.ts` | Shared plan parsing (keep, used by plan card rendering) |
| `components/projects/shared/lib/plan-approval.ts` | Shared approval submission (keep, used by approval flow) |
| `components/projects/shared/lib/question-card-widget.ts` | Shared question card parsing (keep, used by `ask_user_questions`) |

## RovoDev Serve API reference

```
GET  /agent-mode      → { mode: "default"|"plan"|"ask", message: string }
PUT  /agent-mode      → { mode: "plan" } → { mode: "plan", message: "Agent mode changed to plan" }
GET  /available-modes → { modes: [{ name, description, tag? }] }
```

Plan mode instructions (from `agent_modes.py`):
```
WORKFLOW:
1. Do quick exploration of the codebase using readonly tools to understand the context
2. Ask clarifying questions using the ask_user_questions tool based on what you learned
3. Think through the plan and call exit_plan_mode with your concise markdown plan
4. If the user approves, you will switch to default mode
5. After approval, IMMEDIATELY create a todolist with update_todo tool to track implementation
6. Then begin implementing the changes
```

`exit_plan_mode` is a deferred tool (`CallDeferred`). Tool signature: `exit_plan_mode(plan: str)` where `plan` is markdown.

## Verification

1. `pnpm run lint` and `pnpm tsc --noEmit`
2. `node --test backend/lib/*.test.js`
3. Start the app: `pnpm run dev`
4. **Future Chat — manual plan mode**:
   - Toggle "Plan" button ON in composer
   - Send a message like "help me build a feature for managing team settings"
   - Verify RovoDev enters plan mode (check backend logs for `PUT /agent-mode`)
   - Verify RovoDev optionally asks questions via `ask_user_questions` deferred tool
   - Verify plan card renders from `exit_plan_mode` deferred tool
   - Approve the plan → verify toggle auto-resets, RovoDev enters default mode
5. **Future Chat — auto-entry**:
   - Send a complex artifact request without toggling plan mode
   - Verify `smart-generation-intent` classifies as complex artifact
   - Verify plan mode is auto-entered
6. **Make — native switch**:
   - Toggle Make mode, submit a prompt
   - Verify the flow uses `PUT /agent-mode` instead of bespoke `planMode`/`planModeSource` body params
7. **Bespoke removal**:
   - Verify `planning-question-gate.js` and `plan-mode-resolution.js` are deleted
   - Verify no remaining references to `shouldGatePlanningQuestionCard`, `resolvePlanMode`, `PLANNING_GATE_SKIP_SOURCES`
   - Verify `rovo/config.js` no longer contains plan-mode gating instructions
