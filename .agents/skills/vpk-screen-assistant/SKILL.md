---
name: vpk-screen-assistant
description: Repo-local workflow for building and updating the Clicky AI cursor / web screen-assistant experience shared by /studio and /rovo (voice, pointer context, visual cursor cues, self-moving cursor guidance, target grounding, paintable regions, and app-owned Realtime tools). Use when the user asks to build, update, extend, fix, or consolidate Clicky, the AI cursor, the visual/voice cursor, screen assistant, screen-assistant snapshots, pointer/visible-target context, the paint/region feature, cursor grounding, the OpenAI Realtime voice relay for the cursor, or app-owned Realtime tools like show_screen_cue / set_composer_text / submit_composer / apply_agent_draft_patch / delegate_to_rovo. Also use when working from CLICKY_SCREEN_ASSISTANT_PLAN.md. Do not use for generic AI SDK chat work (use the chat-architecture rule) or Figma-to-code (use vpk-design).
---

# VPK Screen Assistant (Clicky)

Build and update the Clicky AI cursor / web screen-assistant layer shared by
`/studio` and `/rovo` without re-deriving the architecture, re-introducing the
plan's naming drift, or breaking the shared Realtime relay. This skill is a
repo-local router and checklist; defer to broader skills for generic React,
chat, or design theory.

The canonical plan is `CLICKY_SCREEN_ASSISTANT_PLAN.md`. **The plan has known
inaccuracies** — always reconcile against `references/architecture.md` (verified
code map) before writing code.

## Boundary

Use this skill for:

- Building or updating Clicky / the AI cursor in `components/projects/rovo` and
  `components/projects/studio` and the shared pieces between them.
- Consolidating the two diverged Clicky trees into shared hooks/components/types
  with route adapters.
- Extending the OpenAI Realtime relay (`backend/lib/openai-realtime.js`):
  app-owned tools, `function_call_output` plumbing, vision parsing.
- Porting studio's structured `screen_assistant_result` / target grounding back
  into rovo, and adding the paint-region UX.
- Decoupling cursor visibility from the voice/screen-context session.

Do not use this skill as the primary guide for:

- Generic AI SDK `useChat` / streaming / data-parts work; use the
  `chat-architecture` rule and `ai-sdk` skill.
- Figma-to-code or visual design implementation; use `vpk-design`.
- Generic behavior-preserving component refactors with no Clicky surface; use
  `vpk-tidy` / `code-simplification`.
- Deploying the result; use `vpk-deploy`.

## Related Skills

| Need | Prefer | How this skill adds value |
| --- | --- | --- |
| AI SDK chat / streaming | `ai-sdk`, `chat-architecture` rule | Adds the Realtime-relay + Clicky specifics those omit |
| Component refactor mechanics | `vpk-tidy` | Adds the rovo/studio dedup map and route-adapter target shape |
| React composition for shared hooks | `vercel-composition-patterns` | Anchors the API to actual Clicky call sites |
| Realtime/voice protocol questions | `references/architecture.md` | Documents the exact message types and tool wiring |

## Read First (non-negotiable)

1. `references/architecture.md` — verified file map + plan reconciliation.
2. The two trees you will touch, side by side:
   `components/projects/{rovo,studio}/hooks/use-clicky.ts`,
   `.../hooks/use-clicky-voice.ts`, `.../hooks/use-realtime-voice.ts`,
   `.../components/rovo-app-shell.tsx`.
3. `components/projects/studio/lib/studio-screen-assistant.ts` — the model you
   are promoting to shared.
4. `backend/lib/openai-realtime.js` — relay, tools, vision parsing.

## Ground-Truth Corrections (apply before coding)

| Plan says | Reality | Do instead |
| --- | --- | --- |
| Decouple `visualCursorEnabled` from `screenAssistantEnabled` | Neither flag exists; only `isClickyActive` (`state !== "off"`) | Introduce explicit cursor-visibility vs voice/context state; mirror studio's `connectedForClickyRef` decoupling into rovo |
| Preserve `clicky_text_completed` | Dead client code; backend never emits it | Treat removal as cleanup, not a compatibility surface |
| Move studio model "back" to shared types | No shared module exists yet | Promote `studio-screen-assistant.ts` (`Studio*` types) into a route-neutral shared module + adapters |
| Powered by `gpt-realtime-2` (implied hardcode) | Model is config-driven via `getRealtimeConfig()` | Never hardcode the model string |
| Rovo has structured targets | Rovo emits no `data-screen-assistant-target` (no prefix on its composer) | Add the prefix + grounding when porting structured behavior to rovo |

## Build / Update Workflow

1. **Scope** — confirm which surface(s): `/studio`, `/rovo`, the shared layer,
   or the backend relay. Confirm exact target files and current git status.
2. **Reconcile** — read `references/architecture.md`; restate which plan items
   are real new work vs already-built vs needing correction.
3. **Decide shared-vs-route** — for each change, decide if it belongs in a
   shared module (types, grounding, region math, tool schemas) or a route
   adapter (labels, allowed actions, snapshot assembly). Whitelisted app actions
   only — never raw DOM `click()`/`type()` or OS automation.
4. **Sequence** — prefer this order to keep diffs reviewable:
   1. Shared types (`ScreenAssistantSnapshot/Region/Target/Action/Adapter`).
   2. Promote `studio-screen-assistant.ts` helpers to the shared module behind
      the new types; keep studio working via a thin adapter.
   3. Backend: add app-owned tools + generic `function_call_output` plumbing;
      keep legacy `[POINT]` fallback during migration.
   4. Rovo: adopt the shared module + adapter; add the composer target prefix.
   5. Paint-region UX last, on top of the shared snapshot.
5. **Decouple cursor from voice** — when turning the visual cursor off must keep
   voice alive: do not disconnect a separately-started Realtime session
   (studio's `connectedForClickyRef` is the reference; rovo needs it).
6. **Validate** — run the gates below and add regression tests for each fixed
   behavior.

## Implementation Rules

- Keep tabs, `@/` imports, React 19 patterns (`use(Context)`, `<Context value>`,
  `ref` as a prop), and ternary conditional rendering — per `AGENTS.md`.
- Realtime message contract is the integration seam: client→server
  `function_call_output`, server→client `function_call` /
  `screen_assistant_result` / `response_done`. Extend these explicitly; update
  both `backend/lib/openai-realtime.js` and both `use-realtime-voice.ts` copies
  (or the shared one, if you have consolidated them) in the same change.
- Coordinate spaces are load-bearing: `StudioScreenAssistantPoint` carries
  `coordinateSpace: "screenshot" | "viewport"`; the overlay only renders
  `"viewport"` points. Region storage must keep both viewport and
  screenshot-relative rects.
- App-owned actions go through existing shell handlers (`setPrefillText`,
  submit path, `studioAgentRegistry.updateSessionAgentDraft`). There is no
  imperative composer API — do not invent one unless the task explicitly asks.
- Dedupe per-turn mutations with a turn-id ref (studio uses
  `lastScreenAssistantMutationTurnIdRef`).
- When consolidating the two trees, migrate call sites first, prove no route
  regresses, then delete the duplicate — same discipline as `vpk-tidy`'s
  wrapper-migration gates.

## Validation

Always:

```bash
pnpm run lint
pnpm run typecheck
```

Targeted unit tests (run the ones your change touches):

```bash
node --test backend/lib/openai-realtime.test.js
node --test backend/lib/runtime-socket-security.test.js
node --test components/projects/studio/lib/studio-screen-assistant.test.js
# plus any new shared screen-assistant *.test.js you add
```

Per the plan's test intent, cover with unit tests: Realtime tool schema +
`function_call_output` forwarding + legacy POINT fallback; shared coordinate
mapping, region bounding, target grounding, adapter action filtering; and the
"cursor off does not kill voice" + "painted region appears in next snapshot"
behaviors.

Browser verification (`/agent-browser`, both `/studio` and `/rovo`):

- Enable the AI cursor, speak while pointing at a UI area, confirm the Realtime
  turn receives pointer context.
- Paint a region, ask about "this," confirm the region is included and stays
  highlighted.
- Ask the assistant to direct attention to a visible control; confirm the
  cursor flies to the grounded target.
- Turn the AI cursor off; confirm voice-only can still set/submit composer text
  or delegate through app-owned handlers.

Run `ads_analyze_localhost_a11y` on the affected routes when UI changed.

## References

- `references/architecture.md` — verified code map, the duplicated-tree table,
  backend relay/tool/vision details, and the plan-claim verdicts. Read it
  before any edit.
