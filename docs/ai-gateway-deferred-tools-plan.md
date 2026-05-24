# AI Gateway Deferred Tools Plan

Status: Implemented by PR #225. Keep this as the design record for the shipped AI Gateway deferred-tool path, not as an active work queue.

## Summary

Build a Rovo-compatible deferred interaction layer for AI Gateway, starting with `ask_user_questions` and `exit_plan_mode`. The goal is to remove the current AI Gateway-only `question-card` text/JSON workaround as the product contract, while still using a model-agnostic structured-output shim instead of depending on native tool calling support from any specific Gateway model.

## Key Changes

- Introduce a model-agnostic deferred tool envelope for AI Gateway responses:
  - `tool_name: "ask_user_questions"` with `input.questions[]`.
  - `tool_name: "exit_plan_mode"` with `input.plan`.
  - Backend generates `tool_call_id`, validates input, strips the raw envelope from assistant text, and emits existing `data-widget-data` parts.
- Use Rovo/acra's public question contract for `ask_user_questions`:
  - Question fields: `question`, `header`, `options`.
  - Option fields: `label`, `description`.
  - Host UI appends `Other`.
  - Tool result format remains `Record<string, string[]>`, keyed by question text.
- Use Claude's lifecycle pattern:
  - Model requests a deferred interaction.
  - Backend pauses the assistant turn.
  - UI collects the user response.
  - Next Gateway call receives a synthetic tool-result context block and continues.
- Reuse existing VPK UI contracts:
  - `QuestionCard` for `ask_user_questions`.
  - Existing plan widget for `exit_plan_mode`.
  - Existing `data-widget-data`, clarification metadata, and answer adaptation paths.

## Implementation Notes

- Add a small Gateway deferred-tool parser/normalizer that replaces the current AI Gateway `question-card` extractor as the preferred path, while keeping the old fenced `question-card` parser as fallback during transition.
- Update the AI Gateway system prompt to tell models to emit deferred tool envelopes, not UI-specific question-card JSON.
- Keep Rovo Serve integration working while it exists, but ensure AI Gateway no longer depends on Rovo Serve for these two interactions.
- Store pending interaction state through existing thread/message metadata where possible; do not introduce a separate persistence system unless the current thread JSON cannot support resume reliably.
- On user submit/dismiss/approve/reject, build a synthetic tool-result message for the next Gateway request instead of calling `/v3/resume_tool_calls`.

## Test Plan

- Unit test deferred-tool envelope parsing for valid, malformed, duplicate, and mixed prose/tool responses.
- Unit test `ask_user_questions` normalization into question-card payloads and answer adaptation back to `Record<string, string[]>`.
- Unit test `exit_plan_mode` normalization into the plan widget payload and approval/rejection result context.
- Backend tests with mocked AI Gateway responses for:
  - Question request pauses and renders a question card.
  - Question answers continue the next Gateway turn with synthetic tool result.
  - Plan request renders a plan widget.
  - Plan approval/rejection continues with the expected context.
- Run targeted existing tests around question-card widgets, deferred clarification, Rovo app hooks, plus `pnpm run lint` and `pnpm run typecheck`.

## Assumptions

- V1 supports `ask_user_questions` and `exit_plan_mode`; other Rovo tools are out of scope.
- Native Gateway tool calling is out of scope for V1 because model swapping must remain safe.
- The current `question-card` fenced JSON behavior stays only as compatibility fallback, not the long-term tool contract.
