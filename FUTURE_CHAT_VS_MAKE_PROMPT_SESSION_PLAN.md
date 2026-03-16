# Future Chat vs Make: Prompt and Session Strategy

## Status

This document is a decision note and experiment plan only.

- No behavioral change is proposed here by default.
- The goal is to compare the current `future-chat` RovoDev integration against the lighter `make` integration patterns before changing code.

## Problem

`future-chat` feels slow on simple turns like `hi`, even when the final answer is correct.

The question is whether the slowdown comes from:

1. The heavier prompt contract used by `future-chat`
2. Keeping the RovoDev port/session alive after each turn
3. Both

## Important Distinction

There are two different "Make" RovoDev paths in this repo.

### 1. Make chat tab

Relevant files:

- [`components/projects/make/hooks/use-local-rovo-chat.ts`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/components/projects/make/hooks/use-local-rovo-chat.ts)
- [`components/projects/make/hooks/use-make-chat.ts`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/components/projects/make/hooks/use-make-chat.ts)
- [`backend/server.js`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/backend/server.js)
- [`rovo/config.js`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/rovo/config.js)

Path:

- Browser
- `/api/chat-sdk`
- Express `app.post("/api/chat-sdk")`
- `buildUserMessage(...)` from `rovo/config.js`
- `streamViaRovoDev(...)`

This path is still part of the heavy shared chat stack.

### 2. Make run/task execution

Relevant files:

- [`backend/make/make-runs.js`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/backend/make/make-runs.js)
- [`backend/lib/rovodev-gateway.js`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/backend/lib/rovodev-gateway.js)

Path:

- Browser
- `/api/make/runs`
- `makeRunManager.createRun(...)`
- task execution in `make-runs.js`
- local lightweight `buildUserMessage(...)`
- `streamViaRovoDev(...)` with `cancelOnComplete: true`

This path is materially different from `future-chat`.

## Current Future Chat Design

Relevant files:

- [`components/projects/future-chat/hooks/use-future-chat.ts`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/components/projects/future-chat/hooks/use-future-chat.ts)
- [`app/api/future-chat/chat/route.ts`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/app/api/future-chat/chat/route.ts)
- [`backend/server.js`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/backend/server.js)
- [`rovo/config.js`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/rovo/config.js)
- [`backend/lib/rovodev-gateway.js`](/Users/esoh/.superset/worktrees/VPK-rovodev/visual-uplift/backend/lib/rovodev-gateway.js)

Path:

- Browser
- `/api/future-chat/chat`
- Future Chat routing wrapper in `backend/server.js`
- proxy to `/api/chat-sdk`
- heavy `buildUserMessage(...)` from `rovo/config.js`
- `streamViaRovoDev(...)`
- default `cancelOnComplete = false`

Characteristics:

- shared tool/question-card/genui/planning protocol bundle on every turn
- persistent RovoDev session state by default
- richer hidden continuity
- heavier latency cost on trivial turns

## Core Design Choices

Two choices are currently bundled together in `future-chat`:

1. Heavy prompt contract
2. Keep session/port alive after the turn

They should be evaluated independently.

## Option Matrix

### Option A: Heavy Prompt + Keep Session Alive

This is the current `future-chat` model.

Pros:

- strongest behavioral consistency across turns
- best fit for deferred tool flows and interactive question-card handling
- richer session continuity beyond serialized UI messages
- one shared contract for many chat capabilities

Cons:

- highest latency on simple chat turns
- largest cognitive load for the model on every request
- hardest to debug because both explicit history and hidden RovoDev state matter
- higher chance of stale per-port state affecting later turns

### Option B: Heavy Prompt + Cancel After Turn

This keeps the same shared chat contract but resets port/session state after completion.

Pros:

- preserves most `future-chat` behavior
- may reduce stale session buildup and 409-style stuck-turn issues
- smaller behavior risk than changing prompt design first

Cons:

- may weaken some deferred-tool or multi-turn session behaviors
- hidden continuity benefit is reduced
- prompt overhead is still paid on every turn

### Option C: Lightweight Prompt + Keep Session Alive

This uses a Make-style prompt builder but keeps RovoDev session continuity.

Pros:

- lower prompt overhead while preserving session continuity
- simpler turns may become noticeably faster
- easier to reason about prompt-level behavior

Cons:

- requires careful reintroduction of critical `future-chat` rules
- may lose important tool/clarification/GenUI guidance if the lightweight contract is too thin
- hidden-state complexity remains

### Option D: Lightweight Prompt + Cancel After Turn

This is closest to the Make run/task path.

Pros:

- best chance of lowering latency
- most deterministic and debuggable behavior
- lowest stale-session risk

Cons:

- highest product-behavior change risk for `future-chat`
- weakest hidden continuity
- deferred/multi-step agent flows may need explicit redesign

## Why Make May Feel Faster

If the comparison is against Make run/task execution, the likely reasons are:

1. Make run/task execution does **not** use the heavy shared `rovo/config.js` message wrapper.
2. Make run/task execution uses `cancelOnComplete: true`.
3. Make run/task prompts are more scoped and deterministic.

If the comparison is against the Make chat tab, the difference is less clear, because the Make chat tab still goes through `/api/chat-sdk` and the shared `rovo/config.js` path.

## Working Hypothesis

The biggest difference is probably not "Future Chat wrapper vs Make wrapper" by itself.

The more likely explanation is:

- `future-chat` pays for the heavy shared prompt contract
- `future-chat` keeps session state alive
- Make run/task execution uses a lighter prompt and explicit cleanup

That combination is a strong candidate for the perceived latency gap.

## Recommended Experiment Sequence

Do these in order, without committing to behavior changes first.

### Experiment 1: Instrumentation Only

Add timing logs for:

- built prompt length
- time to `/v3/set_chat_message` success
- time to first SSE event
- time to first text delta
- total turn duration
- selected RovoDev port

Run this for:

- `future-chat`
- Make chat tab
- Make run/task execution

Goal:

- determine whether the gap is prompt-related, session-related, or both

### Experiment 2: Session Lifecycle Only

Keep the heavy prompt contract.
Test whether `future-chat` improves if it uses `cancelOnComplete: true` on ordinary text turns.

Goal:

- isolate the effect of lingering session state

Success signal:

- materially faster repeated trivial turns on the same surface
- fewer stuck-turn or "chat already in progress" behaviors

### Experiment 3: Prompt Contract Only

Keep session behavior unchanged.
Compare:

- current `rovo/config.js` message builder
- lighter Make-style builder
- hybrid builder with only the `future-chat` capabilities actually needed for the turn

Goal:

- isolate the cost of prompt mass and protocol overhead

### Experiment 4: Hybrid Strategy Evaluation

If experiments 2 and 3 both help, define a hybrid policy:

- heavy prompt only for turns that need rich tool/protocol behavior
- lighter prompt for plain conversational turns
- keep-alive only while the conversation is in an active deferred-tool or multi-step orchestration state

## Decision Criteria

Prefer the `future-chat` approach if:

- deferred tools and question-card continuity are core product requirements
- hidden session continuity clearly improves real user outcomes
- latency is acceptable after cleanup or prompt tuning

Prefer the `make`-style approach if:

- deterministic behavior matters more than hidden continuity
- the surface is primarily task execution, not agent conversation
- repeated-turn latency is the top product concern

## Additional Guardrails for "Lightweight Conversation"

The current plan isolates prompt weight and session lifetime well, but it still needs explicit product guardrails so performance work does not quietly break `future-chat`.

### Non-Regression Baseline

Before shipping any lighter path, define a parity checklist for these current behaviors:

- plain text chat
- question-card clarification
- plan card / todo flows
- artifact creation
- artifact update when the active artifact pill is showing
- GenUI card generation
- cancel / stop behavior
- queued follow-up messages during generation
- thread restore / refresh
- stale-session recovery (`409`, deferred tool cleanup)
- voice delegation into Future Chat

If a candidate optimization cannot preserve these behaviors or cleanly fall back to the current heavy path before streaming begins, it should not ship.

### Proposed Fast-Path Eligibility Rules

A lightweight path should be eligible only when all of the following are true:

- input is typed text, not delegated voice
- no active artifact pill is present
- no unresolved question-card, plan-mode, or deferred-tool state exists
- no attachment or explicit structured-output request is present
- the turn looks conversational or answer-only, not build/edit/generate oriented
- backend can still upgrade to the heavy path before first stream output

Suggested policy:

- fast-path should be decided per turn, not as a sticky thread mode
- hidden RovoDev session state should be treated as an optimization cache, not a correctness dependency

### Prompt Strategy Suggestion

The code paths already show a meaningful structural difference:

- `rovo/config.js` always appends clarification, plan, GenUI, and Figma instructions
- `backend/make/make-runs.js` uses a much thinner wrapper

Suggested direction:

1. Split `buildUserMessage()` into composable instruction bundles.
2. Define turn profiles such as `minimal`, `interactive`, `planning`, and `genui`.
3. Select the smallest valid profile for the turn.
4. Fall back to the current full profile whenever eligibility is uncertain.

This gives a concrete way to reduce prompt mass without deleting `future-chat` capabilities.

### Session Strategy Suggestion

Session reuse should exist only where it creates product value.

- default ordinary lightweight chat turns to `cancelOnComplete: true`
- keep sessions alive only during active tool, deferred, or multi-step orchestration flows
- consider a short TTL-based reuse window for back-to-back plain chat on the same thread only if instrumentation proves it helps
- never rely on hidden port state as the source of truth; explicit history and UI state stay authoritative

### Perceived-Performance Suggestions

Some performance wins should come from UI behavior, not only backend latency:

- render the user message locally immediately
- keep the trivial-turn loading state visually lightweight
- avoid opening artifact or widget containers until `data-route-decision` confirms they are needed
- avoid locking the composer for plain text turns unless a tool workflow is active

The goal is not only lower real latency, but lower felt latency.

### Suggested Performance Budgets

These are proposed starting targets and should be confirmed before implementation:

- trivial typed chat: p50 time-to-first-text-delta under `500ms`
- trivial typed chat: p95 time-to-first-text-delta under `1200ms`
- obvious-turn route selection overhead under `100ms`
- ambiguous-turn fallback to heavy path should add at most one clear loading transition
- cancellation and cleanup should happen off the critical path when safe

### Rollout and Validation Suggestions

Do not jump directly from experiment to full replacement.

1. Shadow-log fast-path eligibility without changing behavior first.
2. Add a regression matrix covering greetings, follow-up chat, question cards, artifact update, GenUI, cancel, queueing, and voice delegation.
3. Compare p50/p95 latency, misroute rate, and stuck-session rate between heavy and lightweight policies.
4. Ship behind a feature flag or internal-only cohort first.

## Regression Boundaries To Protect

Any performance change for lightweight conversational turns must preserve these existing `future-chat` behaviors unless we explicitly decide to narrow scope:

1. Deferred tool clarification flows
   - `ask_user_questions` / question-card rendering
   - deferred tool response submission and resume behavior
   - skip / dismiss behavior for clarification cards

2. Artifact routing and artifact continuity
   - chat vs artifact create/update routing
   - active artifact context injection
   - streaming artifact checkpoint/save behavior
   - document/thread persistence and restoration

3. Voice and delegated chat continuity
   - voice-mode response constraints
   - delegated prompt replay via `delegatedMessageId`
   - `conversationSummary` handoff for voice delegation

4. Thread and session UX
   - thread persistence, reload, and hydration
   - realtime message merge behavior
   - interruption / cancel / retry behavior
   - no increase in stuck-turn or stale deferred-session failures

5. Smart routing outputs
   - chat vs genui vs artifact intent classification
   - suggested questions still work after completion
   - route-decision telemetry remains available

## Assistant Suggestions

These are the current implementation directions that look highest-value before changing product behavior:

### 1. Separate prompt weight from session lifecycle in code and telemetry

Do not treat "lightweight chat" as one switch. Introduce independent experiment flags for:

- prompt tier: `heavy`, `light`, `hybrid`
- session cleanup: `keep_alive`, `cancel_on_complete`
- turn class: `simple_conversation`, `rich_chat`, `artifact`, `voice`, `clarification_resume`

This prevents ambiguous results and makes regressions attributable.

### 2. Add a capability-based hybrid prompt builder

The current `rovo/config.js` builder always injects a large shared instruction bundle. A safer target is:

- light tier for plain text conversation
- heavy tier when the turn can realistically need question cards, GenUI, Figma, planning, or specialized guardrails
- explicit escalation from light to heavy based on route, active surface state, or prior turn state

This likely captures most latency win with lower regression risk than replacing `future-chat` wholesale.

### 3. Use session cleanup selectively, not globally

`cancelOnComplete: true` looks promising for trivial text turns, but should not be the default for every turn until proven safe.

Candidate keep-alive cases:

- active deferred tool / question-card sessions
- artifact generation/update turns
- voice delegation or multi-step orchestration
- turns that opened tool-driven follow-up state the backend expects to resume

Candidate cleanup cases:

- plain conversational turns
- greeting / lightweight Q&A
- turns with no tool calls, no artifact routing, and no deferred state

### 4. Define performance targets before implementation

For this work to stay disciplined, pick explicit targets for:

- time to first visible text
- time to first token after `/v3/set_chat_message`
- total completion time for trivial prompts like `hi`
- repeated-turn stability on the same thread/port

Without fixed thresholds, "feels faster" will be hard to evaluate and easy to regress later.

### 5. Add a regression matrix before shipping any optimization

Minimum matrix:

- simple greeting
- short factual Q&A
- question-card clarification turn
- clarification resume turn
- artifact creation
- artifact update on existing document
- voice delegation handoff
- interrupted turn followed by immediate retry
- thread reload after mixed realtime + RovoDev history

### 6. Consider history budgeting separately from prompt protocol size

If lightweight turns still feel slow after prompt-tiering, the next likely contributor is serialized history mass. Test:

- current full mapped history
- capped recent-history budget
- summary + recent turns

This should be measured independently from instruction bundle size.

## Interview Questions: Next Round

These are the decisions that most affect architecture and regression risk.

1. What exact user actions count as "lightweight conversation" for this work?
   - examples: greetings, quick follow-up questions, short factual Q&A, conversational clarification, short brainstorming

2. Which current `future-chat` behaviors are absolutely non-negotiable on day one, even for the lightweight path?
   - examples: question cards, artifact routing, GenUI cards, queued steering, voice delegation, suggested questions, cross-turn hidden continuity

3. For turns like `hi`, `thanks`, or a short factual follow-up, is explicit message history enough, or do you still want hidden RovoDev session continuity preserved?

4. When the router is uncertain, should it always pay the heavy-path cost, or is occasional fallback / clarification acceptable in exchange for much faster obvious turns?

5. Should fast-path eligibility be backend-only, or can the frontend provide a hint that the backend verifies before streaming?

6. Do you want lightweight chat to feel visually different?
   - examples: less spinner-heavy, less composer lockout, faster local echo
   - or should it look identical and only be faster under the hood

7. Are there prompts that must never use the lightweight profile even if they look short?
   - examples: anything that could become a tool flow, a plan, an artifact, or a routed GenUI experience

8. For repeated text-only turns, should eligible sessions be cancelled immediately after each turn, or kept alive for a short TTL reuse window?

9. What performance bar would make this effort successful for you?
   - most important metric: time to first delta, time to usable answer, or total completion
   - rough threshold for `hi` / short follow-up turns

10. What rollout risk is acceptable?
   - internal dogfood only
   - feature flag by user or cohort
   - direct default-on once metrics look good

Prefer a hybrid approach if:

- `future-chat` needs rich orchestration sometimes, but not on every turn
- trivial chat and rich-agent turns should not pay the same cost

## Suggested Near-Term Plan

1. Confirm which Make experience is actually perceived as faster:
   - Make chat tab
   - Make run/task execution

2. Add instrumentation only.

3. Compare four combinations conceptually:
   - heavy + keep alive
   - heavy + cancel
   - light + keep alive
   - light + cancel

4. Only then decide whether `future-chat` should:
   - stay current
   - adopt cleanup only
   - adopt a lighter builder
   - split into a hybrid model

## Recommendation Right Now

Do **not** copy Make blindly into `future-chat`.

The safer path is:

1. measure first
2. test session cleanup separately
3. test prompt-weight reduction separately
4. adopt a hybrid design if both help

That keeps the conversation semantics of `future-chat` intact while making the latency tradeoffs explicit.
