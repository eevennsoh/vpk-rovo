# Studio Agent Creation Flow Spec

## Summary

Turn the `/studio` empty state into an agent-builder entrypoint. When the default Studio agent is selected and the user submits from the home state, Studio starts an agent-creation flow, asks clarification questions only if needed, streams a structured `data-agent-result`, registers a session-local selectable agent, and selects it in place without clearing the creation thread.

## Product Behavior

- Empty-state Studio submissions always mean "build an agent," not generic chat.
- Creation mode ends once a valid `data-agent-result` is emitted; follow-ups are normal chat with the selected created agent.
- Required v1 profile fields are name, description, instructions/context, and conversation starters.
- Created agents are prompt/persona profiles only; active tool bindings, permissions, edit, delete, and durable persistence are out of scope.
- Refreshing or reopening a thread keeps prior result cards visible but does not restore selectable session agents.
- The existing clarification-card UI is reused when required details are missing; no second Q&A surface is introduced.
- The rollout is scoped to `/studio`; `/agents`, `/rovo`, sidebar chat, and FloatingRovoButton onboarding stay unchanged.

## UX Contract

- Studio's empty-state starter cards and placeholder copy should clearly frame the surface as an agent builder.
- Starter prompts should describe agents to build, not generic one-off tasks.
- The created-agent result card is concise:
	- agent name
	- short description
	- conversation starters
	- "Chat with agent" action
- The result card does not include edit, delete, approval, or full instruction review controls in v1.
- Selecting the result card chooses the created agent for chat while preserving the current creation thread.

## Data And API Contract

- Studio submission payloads support `creationMode?: "agent" | "skill"` and pass `creationMode: "agent"` only for default-agent empty-state submissions.
- `creationMode` is preserved through immediate dispatch, queued prompt actions, and the `DefaultChatTransport` request body.
- The backend emits a structured `data-agent-result` for completed Studio agent creation; no new create-agent persistence API is added for v1.
- `data-agent-result` should include the existing display fields plus the selectable profile fields Studio needs:
	- stable agent id
	- display name
	- byline or generated-agent source label
	- description / summary
	- instructions or context description
	- conversation starters
	- avatar fallback metadata when available
	- action: `"create"`
- If a generated id or name conflicts with an existing static or session-created agent, Studio keeps both by suffixing the new session agent id/name.

## Frontend Implementation

- In `RovoAppShell`, detect default-agent home-state composer submissions and build a Studio-specific creation context with:
	- source: `/studio` prompt input
	- original user brief
	- instruction to ask clarifying questions only when required profile details are missing
	- instruction to produce a structured agent result when ready
- Continue routing clarification answers through the existing `ClarificationQuestionCard` / `ask_user_questions` flow.
- Extend `useRovoApp` prompt dispatch and queue types so creation mode survives both immediate and delayed submissions.
- Extend `RovoChatProvider` with dynamic session-agent registration:
	- normalize `data-agent-result` into a `RovoAgentProfile`
	- merge session agents with static/provider agents
	- keep registration idempotent per agent result
	- support selecting an agent with a preserve-current-thread option
- When a valid agent result appears in the active Studio thread, register it and auto-select it in place without calling the existing reset-chat selection path.
- Render the existing agent result card pattern in Studio messages, adapted to use the generic Studio session-agent registration path instead of RFP-specific behavior.

## Backend Implementation

- Keep the existing creation-mode prefix behavior, but make the agent path capable of returning a structured Studio agent payload.
- Extract or normalize the final agent definition into `data-agent-result` rather than relying on assistant prose.
- Do not require or call a missing `/api/plan/agents` persistence endpoint for this v1.
- If the stream completes in creation mode without a valid agent result, surface a retryable creation failure instead of silently treating the response as normal chat.

## Failure Modes And Edge Cases

- Missing details: ask clarification questions; after answers, continue the same creation flow.
- Missing/invalid `data-agent-result`: keep the thread visible and show a retryable creation error.
- Duplicate generated ids/names: suffix the new session-created agent rather than replacing or rejecting it.
- Browser refresh or old thread reopen: show historical result cards from messages, but do not restore the selectable session agent.
- Non-home follow-up prompt: normal chat, even if it discusses changing the newly created agent.
- Custom agent already selected: normal chat, not a new creation flow.
- Realtime voice submission is out of scope for this v1.

## Test Plan

- Add targeted tests for:
	- Studio home-state submit passes `creationMode: "agent"`.
	- non-home follow-up messages submit normally.
	- queued Studio agent-creation prompts preserve `creationMode`.
	- dynamic session agents are merged into selectable agents.
	- selecting a newly created agent can preserve the current thread.
	- duplicate created-agent ids/names are suffixed.
	- `data-agent-result` renders in Studio messages.
	- generic backend creation-mode output emits `data-agent-result`.
	- missing structured agent result produces a retryable failure state.
- Run targeted `node --test` tests for changed Studio/context/backend coverage.
- Run `pnpm run lint` and `pnpm run typecheck`.
- Browser-check `/studio`:
	- submit an agent brief from the empty state
	- answer clarification if shown
	- confirm a created-agent result card appears
	- confirm the new agent is selected in place
	- send a follow-up and confirm it is normal chat with the selected agent

## Explicit Non-Goals

- Durable backend persistence for created agents.
- Restoring session-created agents after refresh.
- Editing, deleting, approving, or publishing generated agents.
- Creating real tool permission bindings.
- Changing `/agents`, `/rovo`, sidebar chat, or FloatingRovoButton onboarding behavior.
- Supporting realtime voice agent creation in v1.
