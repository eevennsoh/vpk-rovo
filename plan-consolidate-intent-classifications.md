# Plan: Consolidate Intent Classification Around RovoDev Serve

## Status

**Verdict:** the overall direction is good, but the current draft is **too aggressive in a few places** and assumes some RovoDev agent-loop capabilities that are **not yet proven in this codebase**.

The most realistic path is:

1. **Consolidate and simplify backend heuristics first**
2. **Let RovoDev own more output decisions incrementally**
3. **Keep backend fallbacks for plan widgets, translation, and media until telemetry proves they are safe to remove**

This should be treated as a **phased migration**, not a full immediate architecture flip.

---

## What I verified in the codebase

### Proven today

#### 1. RovoDev Serve already supports deferred clarification well

The current RovoDev bridge has a solid path for `ask_user_questions`:

- `rovo/config.js`
  - injects explicit `ask_user_questions` instructions into every RovoDev prompt
- `backend/lib/rovodev-client.js`
  - parses `deferred-request`, `tool_call_start`, `tool_call_args`, `tool_result`, and `tool_error`
- `backend/lib/rovodev-gateway.js`
  - converts deferred tool requests into UI events and question-card flow
- `backend/lib/ask-user-questions-adapter.js`
  - adapts tool inputs/results to the frontend question-card format

So: **tool-driven clarification is real and already works**.

#### 2. Plan widgets are still backend-owned today

Plan rendering is currently not a native, end-to-end RovoDev planner flow.

Instead, the backend derives plan widgets from:

- explicit planning gate heuristics:
  - `backend/lib/planning-intent.js`
  - `backend/lib/planning-question-gate.js`
- plan-mode gating:
  - `backend/lib/plan-mode-resolution.js`
- fallback parsing from assistant text:
  - `backend/lib/plan-widget-fallback.js`
- fallback parsing from tool observations:
  - `backend/lib/update-todo-plan-payload.js`

So: **planning is not yet something we can fully hand off to RovoDev and delete backend logic for**.

#### 3. The codebase already has a spec-fence contract for GenUI

This is important because it means Phase 2 should build on what already exists.

Relevant files:

- `backend/lib/genui-system-prompt.js`
  - already instructs models to emit exactly one ````spec` block
- `backend/lib/genui-chat-handler.js`
  - already contains spec parsing / cleanup utilities
  - already has `generateGenuiFromRovodevResponse()` for second-pass GenUI generation

So: the plan should **reuse the existing `spec` contract**, not invent a new one.

#### 4. `/api/chat-sdk` still contains multiple backend routing branches

Current route-level logic still includes:

- planning gate
- translation routing
- media preclassification
- smart clarification gating
- smart GenUI generation / fallback routing
- tool-first routing

So: the current backend is still doing meaningful orchestration. The right goal is to **shrink this safely**, not assume it can disappear in one pass.

---

## What is accurate in the original plan

These ideas are directionally correct:

1. **Too many intent decisions are happening in the backend**
2. **Simple conversational turns should not pay for multiple extra LLM calls**
3. **RovoDev should increasingly decide output shape when possible**
4. **Suggestion generation should stay non-blocking**
5. **Heuristic duplication should be consolidated**
6. **GenUI should move toward direct `spec` emission instead of a guaranteed second model pass**

---

## What is inaccurate or too optimistic

### 1. “The backend observes and routes rather than classifying” is not fully achievable yet

This is the end-state aspiration, but it is **not true today** for several important flows:

- planning
- translation
- media generation
- some clarification gating
- GenUI fallbacks

The backend still needs **minimal but meaningful routing** until those flows are fully tool-native and measurable.

### 2. “One LLM call per request” is not a safe guaranteed target yet

Even after improvements, extra model work may still happen for:

- GenUI fallback generation
- suggestions
- recovery flows
- tool-first retries
- translation / media / structured rendering fallbacks

A better statement is:

> Optimize for **one primary model turn** on the happy path, while keeping non-blocking or flagged fallbacks during migration.

### 3. Planning cannot yet be treated as a native RovoDev-only planner flow

The draft currently says planning should come directly from RovoDev plan mode. That is premature.

What exists today is:

- frontend-approved plan mode toggle (`plan-mode-resolution.js`)
- backend plan-question gating
- backend extraction of plan widgets from text and `update_todo` observations

So the migration should say:

> Keep backend plan parsing/gating until RovoDev emits stable, structured plan outputs for this product flow.

### 4. Phase 2 should not start by creating a brand-new skill architecture from scratch

The repository already has:

- `genui-system-prompt.js`
- a ` ```spec` contract
- GenUI post-processing code

So the best next step is to **reuse and slim existing prompt/spec infrastructure**, not replace it with an all-new skill before validating behavior.

### 5. Media routing should not be fully delegated first

The current codebase already has working backend media modules:

- `backend/lib/image-generation-routing.js`
- `backend/lib/smart-image-routing.js`
- `backend/lib/smart-audio-routing.js`
- `backend/lib/sound-generation.js`
- `backend/lib/speech-transcription.js`

Those are production assets, not just temporary hacks.

So the better migration is:

> Let RovoDev express media intent more directly over time, but keep backend execution and fallback routing until a stable tool contract exists.

### 6. Translation removal is also too early

Translation currently has dedicated logic and clarification support in `backend/lib/translation-card.js`.

That can probably be simplified later, but removing it immediately would increase risk unless RovoDev tool usage is already deterministic for:

- language detection
- missing target-language clarification
- card rendering

---

## Revised target architecture

### Near-term target

```text
User
→ Backend performs lightweight, deterministic gating only
→ Backend sends turn to RovoDev
→ RovoDev chooses among:
   - plain text
   - ask_user_questions
   - tool calls
   - direct ```spec output
→ Backend observes stream and renders:
   - text
   - question card
   - plan widget fallback
   - GenUI widget
   - media widget
→ Backend keeps deterministic fallbacks for translation, planning, and media while migration is in progress
```

### Long-term target

```text
User
→ Backend applies only safety / product-level gating
→ RovoDev decides output type and tool usage
→ Backend becomes a stream interpreter + widget renderer + fallback layer
```

---

## Recommended phases

## Phase 1: Consolidate heuristic intent logic without changing product behavior

### Goal

Reduce duplicate checks and make routing easier to reason about **without** removing major flows yet.

### Changes

- Create a single helper, for example `backend/lib/prompt-intent.js`, that centralizes lightweight prompt signals such as:
  - conversational vs task-like
  - planning-like
  - likely GenUI ask
  - likely image ask
  - likely audio ask
  - likely translation ask
- Make `server.js` compute these signals once per request and reuse them
- Remove duplicated re-checks where possible
- Keep existing route behavior the same

### Why this phase is safe

This gives us the maintainability win immediately without coupling it to a risky RovoDev migration.

### Suggested output

A normalized per-turn structure such as:

```js
{
  isConversational: boolean,
  isTaskLike: boolean,
  isPlanning: boolean,
  requestedSurface: "text" | "genui" | "image" | "audio" | "translation" | "unknown",
  requestedDeliverable: boolean,
}
```

### Keep in place for now

- `shouldGatePlanningQuestionCard`
- `resolveTranslationRequestState`
- `preClassifyMediaIntent`
- `classifySmartGenerationIntent`
- `shouldGateSmartClarification`

Those can be simplified later, but this phase should not remove them yet.

---

## Phase 2: Make direct RovoDev `spec` output the preferred GenUI path

### Goal

Eliminate the second-pass GenUI call on the happy path.

### Changes

- Reuse the existing ` ```spec` contract already defined in:
  - `backend/lib/genui-system-prompt.js`
  - `backend/lib/genui-chat-handler.js`
- Update the RovoDev prompt/skill guidance so that when the request is best answered visually, RovoDev emits one valid ` ```spec` block directly
- In `/api/chat-sdk`, prefer:
  1. direct spec emitted by RovoDev
  2. current GenUI fallback path only when no valid spec exists

### Important implementation note

This phase should be **feature-flagged**.

Suggested flag names:

- `ENABLE_DIRECT_ROVODEV_SPEC`
- `ENABLE_GENUI_SECOND_PASS_FALLBACK`

### Success criteria

For a growing class of requests, the happy path becomes:

```text
RovoDev text/spec stream → backend parses spec → GenUI widget
```

with no second model call.

### Keep as fallback initially

- `generateSmartGenuiResult()`
- `generateGenuiFromRovodevResponse()`
- structured tool-observation fallbacks

Only remove them after telemetry shows the direct-spec path is reliable.

---

## Phase 3: Make tool-observation rendering first-class before deleting special-case branches

### Goal

Use RovoDev tool activity as the source of truth for more UI output types.

### Changes

Build on the stream events already supported by:

- `backend/lib/rovodev-client.js`
- `backend/lib/rovodev-gateway.js`

Prioritize these flows:

1. **Question cards**
   - already working via deferred tools
2. **Plan widgets**
   - prefer parsing `update_todo` observations first
   - keep text-based plan fallback second
3. **Tool-backed data cards**
   - continue using tool observation fallbacks for structured results

### Why this phase matters

This is the real bridge from backend classification to model/tool-driven UX.

It is safer than deleting branches first, because it increases trust in observed tool behavior before removing current routing.

---

## Phase 4: Migrate media routing gradually, not all at once

### Goal

Reduce backend media intent branching while preserving working image/audio behavior.

### Changes

- Keep backend execution modules as the actual media engines
- Teach RovoDev to choose media generation more explicitly
- Let backend interpret tool use / explicit markers / structured outputs to launch:
  - image generation
  - audio generation
- Once stable, simplify:
  - `preClassifyMediaIntent`
  - `classifySmartGenerationIntent`
  - media early-exit branches

### Strong recommendation

Do **not** start by deleting `smart-image-routing`, `smart-audio-routing`, or `translation-card` paths.

Instead:

1. add a new direct path
2. measure it
3. make it default
4. remove old logic last

---

## Phase 5: Shrink backend gating to the minimum viable set

Only after previous phases are proven should we try to reduce the backend to a very small decision set.

### Likely survivors even in the long term

1. `isLocalModelRequest` — hard product routing
2. lightweight conversational / task-like signal — UX optimization
3. planning safety gate — unless RovoDev planning becomes fully structured and reliable
4. fallback routing guards for outages / malformed spec / malformed tool output

So the realistic end-state is probably **not zero backend classification**, but rather:

> a very small deterministic routing layer plus a richer RovoDev decision layer.

---

## Revised file-by-file plan

### Phase 1

| File | Change |
|------|--------|
| `backend/lib/prompt-intent.js` | **NEW** unified lightweight prompt signals |
| `backend/lib/prompt-intent.test.js` | **NEW** regression coverage |
| `backend/server.js` | Compute normalized prompt signals once and reuse them |
| `backend/lib/planning-question-gate.js` | Consume normalized planning signal instead of repeated callback-style re-detection where practical |
| `backend/lib/smart-generation-intent.js` | Optionally narrow scope to media-only classification after prompt-intent centralization |

### Phase 2

| File | Change |
|------|--------|
| `rovo/config.js` | Add clearer direct-spec guidance for visual responses |
| `backend/lib/genui-system-prompt.js` | Extract/align reusable direct-spec rules |
| `backend/lib/genui-chat-handler.js` | Reuse existing spec parsing utilities for direct RovoDev spec path |
| `backend/server.js` | Prefer direct ` ```spec` parsing before second-pass GenUI generation |

### Phase 3

| File | Change |
|------|--------|
| `backend/lib/rovodev-gateway.js` | Strengthen tool observation capture if needed |
| `backend/lib/update-todo-plan-payload.js` | Keep as first-class plan fallback |
| `backend/lib/plan-widget-fallback.js` | Keep as text fallback until structured planning is stable |
| `backend/server.js` | Prefer observation-driven widget emission before specialized recovery branches |

### Phase 4

| File | Change |
|------|--------|
| `backend/server.js` | Add explicit direct-media path behind a flag |
| `backend/lib/smart-image-routing.js` | Simplify only after direct-media path is proven |
| `backend/lib/smart-audio-routing.js` | Simplify only after direct-media path is proven |
| `backend/lib/translation-card.js` | Simplify later, not first |

---

## Things I would change in the original draft immediately

### Replace this claim

> The backend observes and routes rather than classifying.

with:

> The backend should move toward observation-first routing, while retaining a small deterministic gating layer for planning, translation, media fallback, and malformed-output recovery.

### Replace this claim

> After: 1 LLM call per request

with:

> Target the happy path to one primary RovoDev turn. Keep non-blocking or flagged fallback calls during migration until telemetry proves they are unnecessary.

### Replace this claim

> Planning uses existing plan mode flow

with:

> Planning still depends on backend plan-mode gating and plan-widget extraction today. Do not remove that logic until RovoDev emits stable structured planning outputs in production.

### Replace this claim

> Remove translation detection, smart clarification gate, simplifies planning gate.

with:

> Convert each of these flows individually only after a production-ready tool-driven replacement exists and has passed telemetry + regression validation.

---

## Rollout safeguards

Every phase should ship behind flags and instrumentation.

### Recommended instrumentation

Per request, log:

- prompt-intent summary
- whether RovoDev emitted a valid ` ```spec`
- whether fallback GenUI generation ran
- whether a question card came from deferred tools or backend gating
- whether plan widget came from:
  - direct structured tool output
  - `update_todo` observation
  - assistant text fallback
- whether media came from:
  - direct model/tool path
  - backend heuristic path
- time to first delta
- time to first widget
- total turn latency

### Recommended feature flags

- `ENABLE_PROMPT_INTENT_UNIFICATION`
- `ENABLE_DIRECT_ROVODEV_SPEC`
- `ENABLE_GENUI_SECOND_PASS_FALLBACK`
- `ENABLE_DIRECT_ROVODEV_MEDIA_ROUTING`
- `ENABLE_TRANSLATION_TOOL_FIRST`
- `ENABLE_OBSERVATION_FIRST_PLAN_WIDGETS`

---

## Verification plan

### Automated

1. `node --test backend/lib/*.test.js`
2. `pnpm run lint`
3. `pnpm tsc --noEmit`

### Behavioral regression matrix

Validate at minimum:

- `hi`
  - no extra GenUI work
  - plain text fast path
- `show me compound interest`
  - direct spec preferred
  - fallback only if no valid spec
- `build me a calculator`
  - artifact/deliverable path still works
- `generate an image of a cat`
  - image path works with current backend execution
- `translate hello to French`
  - translation still works with clarification if details are missing
- `create a plan for migrating our auth flow`
  - planning gate / plan widget still works
- clarification-required task
  - deferred `ask_user_questions` renders correctly

### Success metrics

Use realistic targets:

- simple conversational turns: materially faster time to first delta
- direct-spec turns: second-pass GenUI call rate drops over time
- plan / translation / media regressions: zero unexpected behavior changes during early rollout

---

## Open questions for you

These are the questions I still want answered before implementation starts:

1. **Planning UX:** do you want planning to remain a distinct product-level mode, or should it eventually become just another tool-observation-driven widget in normal chat?
2. **GenUI risk tolerance:** are you okay with a feature-flagged period where direct RovoDev `spec` output is attempted first but silently falls back to the current second-pass GenUI path?
3. **Media ownership:** do you want image/audio generation to stay backend-executed long term, with RovoDev only deciding intent, or do you want true tool-native execution owned by the agent loop?
4. **Translation:** is translation important enough to preserve as a dedicated polished path, or do you want it absorbed into a generic tool-result-to-card pipeline?
5. **Removal threshold:** what evidence do you want before deleting old branches — test coverage only, telemetry thresholds, or both?

---

## Recommended decision

**Proceed, but revise the program to be incremental.**

The right plan is not:

> delete backend classification and let RovoDev handle everything now.

The right plan is:

> unify backend heuristics, promote direct RovoDev spec/tool-driven paths, keep deterministic backend fallbacks during migration, and delete branches only after telemetry proves the new path is reliable.
