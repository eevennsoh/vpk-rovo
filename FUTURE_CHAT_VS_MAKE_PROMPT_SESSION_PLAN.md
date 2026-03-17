# Future Chat vs Make: Prompt, Routing, and Session Strategy

## Status

This is an updated decision note and experiment plan based on the current repo state.

- No behavior change is proposed by default.
- The goal is to explain why `future-chat` feels slower than Make when work is routed to RovoDev, then define the right experiments.
- The older version of this document was directionally right about prompt weight and session reuse, but it no longer matched the live architecture closely enough.

## Current Bottom Line

The old two-factor model is now incomplete.

It is still true that:

- `future-chat` chat turns use the heavy shared `/api/chat-sdk` stack
- `future-chat` keeps the RovoDev session alive after a successful turn
- Make run execution uses a lighter prompt contract and `cancelOnComplete: true`

But current `future-chat` now also adds two important latency contributors that were not captured in the earlier plan:

1. An extra `future-chat` pre-router before `/api/chat-sdk`
2. An always-on smart-generation path from `future-chat` into `/api/chat-sdk`, which can trigger an additional intent-classification model call before the actual RovoDev stream

That means prompt weight and session lifetime are still important, but they are no longer the only variables worth isolating.

There is also now a concrete failure mode behind the perceived slowness:

1. `409` in this stack means "RovoDev still has a turn in progress on that same port/session"
2. `future-chat` is more exposed to this because it can pin a panel to a strict `portIndex`
3. post-turn background work can still reuse that same pinned port after the main answer is already visible
4. explicit cancel currently depends on targeting the correct port, so any mismatch leaves the real panel session active

So the current problem is not only "slow answers". It is also "sticky port stays occupied or stale, then the next turn collides and appears hung."

## Important Distinction

There are still two different Make paths, but only one of them is truly lightweight.

### 1. Make chat tab

Relevant files:

- [`components/projects/make/hooks/use-local-rovo-chat.ts`](components/projects/make/hooks/use-local-rovo-chat.ts)
- [`components/projects/make/hooks/use-make-chat.ts`](components/projects/make/hooks/use-make-chat.ts)
- [`app/contexts/context-make.tsx`](app/contexts/context-make.tsx)
- [`backend/server.js`](backend/server.js)
- [`rovo/config.js`](rovo/config.js)

Path:

- Browser
- `/api/chat-sdk`
- Express `app.post("/api/chat-sdk")`
- shared `buildUserMessage(...)` from `rovo/config.js`
- `streamViaRovoDev(...)`

Characteristics:

- still uses the heavy shared chat stack
- still uses the shared instruction bundle from `rovo/config.js`
- does not explicitly set `cancelOnComplete: true`
- is closer to `future-chat` than the older plan implied

### 2. Make run/task execution

Relevant files:

- [`app/api/make/runs/route.ts`](app/api/make/runs/route.ts)
- [`app/api/make/runs/[runId]/stream/route.ts`](app/api/make/runs/[runId]/stream/route.ts)
- [`backend/server.js`](backend/server.js)
- [`backend/make/make-runs.js`](backend/make/make-runs.js)
- [`backend/lib/rovodev-gateway.js`](backend/lib/rovodev-gateway.js)

Path:

- Browser
- `/api/make/runs*`
- `makeRunManager`
- task scheduler in `backend/make/make-runs.js`
- local lightweight prompt builder
- direct `streamViaRovoDev(...)`

Characteristics:

- bypasses `/api/chat-sdk`
- bypasses `rovo/config.js`
- uses a much thinner prompt wrapper
- uses `cancelOnComplete: true` for RovoDev task execution
- is the real lightweight comparison point

## Current Future Chat Design

Relevant files:

- [`components/projects/future-chat/hooks/use-future-chat.ts`](components/projects/future-chat/hooks/use-future-chat.ts)
- [`app/api/future-chat/chat/route.ts`](app/api/future-chat/chat/route.ts)
- [`backend/server.js`](backend/server.js)
- [`backend/lib/resolve-routing-decision.js`](backend/lib/resolve-routing-decision.js)
- [`backend/lib/future-chat-artifact-intent.js`](backend/lib/future-chat-artifact-intent.js)
- [`backend/lib/rovodev-gateway.js`](backend/lib/rovodev-gateway.js)
- [`rovo/config.js`](rovo/config.js)

`future-chat` now has multiple branches, not one.

### A. Future Chat chat/genui branch

Path:

- Browser `useChat(...)`
- `/api/future-chat/chat`
- `proxyFutureChatChatRequest(...)`
- `resolveRoutingDecision(...)`
- internal fetch to `/api/chat-sdk`
- shared `/api/chat-sdk` preprocessing
- shared `buildUserMessage(...)`
- `streamViaRovoDev(...)`

Current characteristics:

- extra backend hop before `/api/chat-sdk`
- active-artifact, delegated-message, voice-summary, and recent-history injection
- heavy shared prompt builder from `rovo/config.js`
- default session keep-alive on successful chat turns

### B. Future Chat artifact branch

Path:

- Browser
- `/api/future-chat/chat`
- `proxyFutureChatChatRequest(...)`
- artifact route decision
- `handleFutureChatArtifactToolRequest(...)`
- artifact-specific generation/persistence flow

Current characteristics:

- may bypass `/api/chat-sdk`
- uses artifact-specific prompting instead of the shared chat builder
- can route through `streamTextViaGateway(...)` directly
- is materially different from ordinary text chat

### C. Future Chat voice delegation branch

Path:

- frontend voice/delegation flow in `use-future-chat.ts`
- `/api/future-chat/chat`
- delegated prompt resolution via `delegatedMessageId`
- optional streaming-artifact checkpointing
- then either artifact handling or `/api/chat-sdk`

Current characteristics:

- adds more orchestration than typed chat
- not a good latency baseline for simple text turns

## Current Failure Mode: Why `409` and Hanging Matter

The backend `409` here is not a generic API conflict.

It specifically means:

- RovoDev still believes a previous chat turn is active on the same port
- the next request for that port cannot start cleanly

This matters much more in `future-chat` than in Make run execution because:

- `future-chat` can send `portIndex` and get strict panel-to-port assignment
- `/api/chat-sdk` uses `wait-for-turn` behavior for interactive chat on that pinned port
- a pinned port cannot simply hop to another healthy port when stale session state remains

The most likely live sequence is:

1. `future-chat` sends a turn on its pinned port
2. the user sees the main answer complete
3. `/api/chat-sdk` starts post-turn follow-up work such as suggested questions
4. that follow-up work can still use the same panel port
5. the user sends the next prompt quickly
6. the next prompt hits `409` because the previous session on that port is still active or still clearing

That produces exactly the "backend keeps 409-ing and RovoDev hangs" symptom.

## Sticky Port Scope: Necessary, But Not For Everything

The newer conclusion is more precise than "sticky ports yes/no".

Sticky-port chat semantics are still justified for the Future Chat flows that actually depend on panel-local hidden RovoDev state:

- native plan mode
- deferred tool flows such as `ask_user_questions`
- deferred plan approval / `exit_plan_mode`
- skip-question resume behavior
- voice delegation / panel-local agent-mode continuity

This aligns with the use cases in [`FUTURE_CHAT_TEST_AUTOMATION_PLAN.md`](FUTURE_CHAT_TEST_AUTOMATION_PLAN.md), especially the deferred-tool and plan-mode paths.

But sticky ports are not obviously necessary for every `future-chat` turn:

- ordinary chat
- simple factual Q&A
- many artifact create/update turns where the source of truth is explicit thread/document state
- suggested-question generation

So the right conclusion is:

- do not remove sticky-port semantics globally
- also do not force every turn and every background task onto sticky pinned ports

## What Still Matches the Older Plan

These statements are still correct:

- normal `future-chat` chat turns still use the heavy shared `/api/chat-sdk` stack
- normal `future-chat` chat turns still use `rovo/config.js` `buildUserMessage(...)`
- main `future-chat` chat turns still keep the RovoDev session alive after completion
- Make run/task execution is still materially lighter and more deterministic than `future-chat`

## What Has Drifted Since the Older Plan

### 1. `future-chat` now has an extra pre-router

The old model treated `future-chat` roughly as:

- `future-chat` wrapper
- proxy to `/api/chat-sdk`
- heavy prompt
- RovoDev

The live code now does more than that before `/api/chat-sdk`:

- delegated prompt lookup
- active-artifact resolution
- recent-history shaping
- voice metadata / conversation-summary injection
- route classification through `resolveRoutingDecision(...)`

### 2. `future-chat` always enables smart generation

This is the biggest architecture change relative to the old plan.

In [`components/projects/future-chat/hooks/use-future-chat.ts`](components/projects/future-chat/hooks/use-future-chat.ts), `future-chat` always sends:

- `smartGeneration.enabled = true`
- `smartGeneration.surface = "future-chat"` or `"future-chat-preview"`

That means `/api/chat-sdk` treats `future-chat` as a smart-generation surface on every turn.

For prompts where the heuristic intent is still `normal`, `/api/chat-sdk` runs `classifySmartGenerationIntent(...)` before the real answer stream. That classifier has an `800ms` timeout budget and calls `generateTextViaGateway(...)`.

When RovoDev is available, `generateTextViaGateway(...)` prefers RovoDev. So in practice, simple `future-chat` turns can pay for:

1. a smart-generation classification model call
2. the actual streamed answer turn

Make chat does not do this by default.

### 3. Make chat is not the lightweight benchmark

Make chat still goes through `/api/chat-sdk` and `rovo/config.js`.

So if users say "Make is faster", the first question must now be:

- do they mean Make chat tab
- or Make run/task execution

Those are no longer comparable in the same way.

### 4. Active artifact changes routing behavior immediately

Current `future-chat` fast-path routing prioritizes `activeArtifact?.id`.

So when an artifact is open, even a short follow-up is more likely to be treated as an artifact update flow than as ordinary chat.

That is a major behavioral difference from the older mental model.

### 5. First-turn Future Chat has extra preflight work

On a fresh thread, the frontend can pay additional work before the streamed turn:

- ensure/create thread
- persist thread metadata
- prepare artifact context

This is not the main cause of repeated-turn slowness, but it matters for first-turn perception.

## What This Means for Simple Turns Like `hi`

The old plan assumed `hi` mainly paid for:

- heavy prompt contract
- kept-alive session state

The live behavior is more nuanced.

### What likely happens now

If no artifact is active:

- `resolveRoutingDecisionFastPath(...)` likely classifies `hi` as normal chat quickly
- so `future-chat` probably avoids its own 1500ms route-classifier fallback

But that still does not mean `hi` is cheap, because the request still goes through:

- frontend `useChat` transport
- Next `/api/future-chat/chat` proxy
- Express `proxyFutureChatChatRequest(...)`
- internal fetch to `/api/chat-sdk`
- shared `/api/chat-sdk` preprocessing
- smart-generation intent classification
- heavy `rovo/config.js` prompt building
- `streamViaRovoDev(...)`

And because `future-chat` always enables smart generation, `hi` can still trigger an extra classifier model call inside `/api/chat-sdk` before the real streamed response.

If an artifact is active:

- the current fast path strongly biases toward `artifact_update`
- so `hi` may not behave like a plain conversational greeting at all

## Updated Hypothesis

The current best hypothesis is no longer just:

- heavy prompt contract
- keep session alive

It is now:

1. `future-chat` pays an extra wrapper/proxy cost before `/api/chat-sdk`
2. `future-chat` pays an always-on smart-generation classification cost that Make chat does not
3. `future-chat` pays the heavy shared `rovo/config.js` prompt cost on ordinary chat turns
4. `future-chat` keeps RovoDev session state alive after successful chat turns
5. sticky pinned ports make `409` conflicts user-visible instead of easily avoidable
6. post-turn background work can still consume interactive panel ports
7. Make run/task execution avoids most of that stack and explicitly cleans up the turn

That combination is a much stronger explanation for the current latency gap.

## Updated Experiment Axes

The older two-axis matrix is no longer enough.

We now need to measure at least four independent variables:

1. transport path
   - `future-chat -> /api/future-chat/chat -> /api/chat-sdk`
   - direct lightweight task-style RovoDev path

2. smart-generation classification
   - enabled
   - disabled

3. prompt tier
   - heavy shared `rovo/config.js`
   - lighter scoped builder

4. session cleanup
   - keep alive
   - `cancelOnComplete: true`

5. sticky-port scope
   - required for all turns
   - required only for deferred/plan/voice flows

6. post-turn background work
   - uses interactive RovoDev ports
   - uses AI Gateway / non-interactive path only

## Recommended Experiment Sequence

### Experiment 1: Instrumentation only

Add timing logs for these exact stages:

- frontend thread-creation time before first send
- `/api/future-chat/chat` request start to route decision
- whether `resolveRoutingDecision(...)` used fast path or classifier fallback
- internal fetch time from `future-chat` to `/api/chat-sdk`
- `/api/chat-sdk` smart-generation classifier latency
- built prompt length from `buildUserMessage(...)`
- RovoDev port-acquire wait time
- time to `/v3/set_chat_message`
- time to first SSE event
- time to first text delta
- total turn duration

Run this for:

- `future-chat`
- Make chat tab
- Make run/task execution

### Experiment 2: Disable smart-generation for obvious conversational Future Chat turns

This is now the highest-value isolation test.

Keep everything else the same, but on clearly conversational typed turns:

- do not send `smartGeneration.enabled = true`

Goal:

- measure whether the extra classifier call is a major part of the observed slowness

### Experiment 3: Session lifecycle only

Keep the current transport path and prompt builder.
Only test:

- current behavior
- `cancelOnComplete: true` for lightweight text chat turns

Goal:

- isolate the effect of lingering session state

### Experiment 3A: Move suggested questions fully off RovoDev

This is no longer just a nice-to-have. It is a direct mitigation for the hanging failure mode.

Change:

- suggested-question generation should never use RovoDev
- suggested-question generation should go directly to AI Gateway only

Goal:

- free interactive RovoDev ports immediately after the main answer
- reduce post-turn `409` collisions on pinned ports

### Experiment 3B: Fix explicit cancel to target the correct pinned port

Current risk:

- `future-chat` turn requests send `portIndex`
- the explicit cancel path can currently fire without that same `portIndex`

Goal:

- ensure Stop/interrupt always cancels the actual panel port
- reduce stale-session carryover after interrupted turns

### Experiment 4: Prompt contract only

Keep the current routing and session behavior.
Compare:

- current `rovo/config.js` builder
- lighter Make-style builder
- hybrid capability-based builder

Goal:

- isolate the cost of prompt mass and protocol overhead

### Experiment 5: Transport-path simplification

Only after experiments 2 to 4.

Test whether lightweight typed chat should:

- stay on the current `future-chat -> /api/chat-sdk` path
- or use a more direct lightweight RovoDev path for plain conversational turns

Goal:

- determine whether the extra wrapper/proxy path itself is worth bypassing

## Immediate Fix Plan

These are no longer just experiments. They are the most justified corrective changes from the current findings.

### Fix 1: Make Future Chat cancel port-aware

Problem:

- interactive `future-chat` requests can be pinned to a strict `portIndex`
- explicit cancel must target that same port
- otherwise the UI can think it stopped the turn while the real panel port stays active

Implementation direction:

- include `portIndex` on the Future Chat explicit cancel request
- keep backend `/api/chat-cancel` using that `portIndex` to resolve the correct strict port

Expected outcome:

- fewer stale sessions after Stop / interrupt
- fewer immediate follow-up `409`s on the same panel

### Fix 2: Route suggested questions through AI Gateway only

Problem:

- suggested questions currently run after `data-turn-complete`
- they can still reuse the same interactive panel port
- this keeps RovoDev busy after the user thinks the turn is done

Implementation direction:

- make suggested-question generation use AI Gateway only
- do not fall back to RovoDev for this path

Expected outcome:

- interactive RovoDev ports are freed sooner
- lower chance of `409` on quick follow-up prompts
- less hidden contention on sticky panel ports

### Fix 3: Keep post-turn background tasks off pinned interactive ports

Problem:

- even when interactive chat itself needs stickiness, background tasks should not inherit that requirement

Implementation direction:

- suggested questions: AI Gateway only
- any future background summarization / sidecar work: prefer non-pinned execution paths
- never let best-effort follow-up work block the next user turn on the same panel

Expected outcome:

- panel latency becomes tied to the main response only
- background extras stop behaving like invisible session extenders

### Fix 4: Narrow sticky-port requirements to the flows that truly need them

Problem:

- sticky ports are useful for deferred-tool and plan-mode continuity
- they are expensive when applied to every simple turn

Implementation direction:

- preserve sticky ports for:
  - native plan mode
  - deferred-tool sessions
  - approval / resume flows
  - voice delegation
- consider lighter handling for:
  - plain conversational turns
  - suggested-question generation
  - simple artifact or GenUI turns that do not depend on hidden session state

Expected outcome:

- keep the Future Chat guarantees that matter
- reduce unnecessary exposure to pinned-port contention

### Fix 5: Add instrumentation specifically for stuck-port diagnosis

Add logs for:

- panel `portIndex`
- resolved RovoDev port
- explicit cancel target port
- whether suggested questions ran and on which backend
- time between `data-turn-complete` and port release
- whether the next request on that port hit `409`

Expected outcome:

- verify whether the current dominant issue is lingering main-turn state, post-turn background work, or bad cancel targeting

## Suggested Near-Term Priorities

If the goal is to improve `future-chat` latency without breaking product behavior, the most sensible order now is:

1. instrument everything first
2. fix explicit cancel so it targets the correct pinned port
3. move suggested questions to AI Gateway only
4. test smart-generation off for obvious conversational turns
5. test `cancelOnComplete: true` for those same turns
6. test prompt-tier reduction separately
7. only then consider a direct lightweight path

This order matches the current implementation better than the older plan.

## Regression Boundaries To Protect

Any optimization for lightweight chat must preserve these behaviors unless we explicitly narrow scope:

- deferred tool clarification and question-card resume
- artifact create/update routing and artifact continuity
- voice delegation and `delegatedMessageId` replay
- thread persistence, restore, and refresh
- interruption / cancel / retry behavior
- route-decision telemetry
- genui routing when the user actually wants structured output

## Recommendation Right Now

Do not copy Make blindly into `future-chat`.

The current code says the safer path is:

1. measure the live stages
2. fix the concrete stuck-port bugs first
3. remove post-turn RovoDev usage for suggested questions
4. remove avoidable classifier work next
5. test session cleanup separately
6. test prompt-weight reduction separately
7. only then decide whether lightweight Future Chat needs a new transport path

The updated evidence suggests the first suspect is no longer just prompt size.

It is the combination of:

- always-on smart-generation classification
- heavy shared chat prompting
- persistent RovoDev session state
- sticky pinned-port semantics for interactive chat
- post-turn background work reusing interactive ports
- and the extra `future-chat` wrapper path
