# Event-Triggered RFP Drafting Agent

## Summary

Build the `/agents` RFP demo around backend-persisted state and an event-triggered Hermes job. When the RFP Drafting Agent is applied to the `Drafting` column, all current Drafting tickets are reassigned to the agent and processed as an initial event batch. Future tickets moved into `Drafting` trigger the same job flow. Each eligible ticket gets its own visible `/rovo` chat session, deterministic PDF draft attachment, Jira comment, and automatic move to `Review`.

Non-goals: real Jira API integration, live LLM-generated draft content, time-based schedules, human approval gates, and full event-trigger editing in `/rovo Jobs`.

## Public Interfaces And State

- Add backend RFP demo state under `backend/data/agents-rfp-demo/state.json`, managed through a new backend state module.
- Add API routes:
  - `GET /api/agents/rfp-demo/state`
  - `POST /api/agents/rfp-demo/reset`
  - `POST /api/agents/rfp-demo/agent/apply`
  - `POST /api/agents/rfp-demo/events/ticket-entered-column`
- Extend Hermes job metadata with an event trigger:
  - `trigger.type = "jira-column-entered"`
  - `trigger.board = "Enterprise RFP Response"`
  - `trigger.column = "Drafting"`
  - display label: `On event: ticket enters Drafting`
- Extend per-ticket demo state with:
  - `assignee`, `previousAssignee`
  - `agentStatus: "idle" | "queued" | "running" | "completed" | "failed"`
  - `agentSessionThreadId`, `agentJobRunId`
  - `generatedAttachment`, `agentComment`, `completedAt`, `lastError`
- Extend agent state with `jobId`, trigger metadata, and job-run summaries for the agent details sheet.

## Implementation Changes

- Replace browser-only `localStorage` ownership in `useAgentsRfpDemoState` with backend fetch/mutate calls. Keep the pure transition behavior, but make the backend the source of truth.
- On agent apply:
  - create or reuse the RFP Drafting event job
  - assign all current `Drafting` tickets to `RFP Drafting Agent`
  - mark each eligible ticket `running`
  - create one `/rovo` thread per ticket
  - write deterministic per-ticket chat transcript/output
  - attach `RFP-<key> response draft.pdf`
  - add an agent-authored Jira comment
  - move successful tickets to `Review`
- On card drop/status change into `Drafting`:
  - call the event endpoint
  - self-assign the ticket immediately
  - queue/run one per-ticket session for that ticket
- Rerun policy:
  - skip completed tickets with an existing agent-generated PDF/comment
  - retry failed tickets on the next event/run
  - continue other ticket sessions if one fails
- Update `/rovo Jobs` to display event jobs with trigger text, status, run history, and `Run now`; do not add full event-trigger editing.
- Update `/agents` UI:
  - replace `No schedule` / `Schedule weekdays 9:00 AM` with event-trigger language
  - show agent as the ticket assignee on cards and in Details
  - show in-progress state while ticket sessions are running
  - show agent details job-run log with run status, counts, failures, and `/rovo` thread links
- Reset demo:
  - reset backend RFP state
  - delete/unlink the demo Hermes job
  - delete demo-created ticket sessions/artifacts from `/rovo`

## Test Plan

- Backend state tests:
  - default seed loads current board
  - applying agent assigns all current Drafting tickets
  - initial batch creates one session per eligible ticket
  - successful tickets attach/comment/move to Review
  - failed ticket does not block other tickets
  - completed tickets are skipped on rerun
  - reset clears job links and demo-created sessions
- Hermes/job tests:
  - event trigger metadata is preserved through create/list/get/update
  - event jobs render as event-triggered, not scheduled time jobs
  - `Run now` still works for event jobs
  - existing time/manual jobs are unchanged
- Frontend/source tests:
  - `/agents` uses backend state actions instead of local-only persistence
  - schedule wording is replaced by trigger wording
  - work item assignee maps to `RFP Drafting Agent`
  - agent details shows job-run log and session links
- Run validation:
  - targeted `node --test` for new backend and source tests
  - `pnpm run lint`
  - `pnpm run typecheck`
  - browser check on `/agents` for apply-agent, initial batch, ticket move into Drafting, agent details, `/rovo Jobs`, and reset

## Assumptions And Risks

- The PDF draft is represented through the existing local attachment preview model rather than a real binary PDF.
- Deterministic session transcripts are acceptable as the demo's agent session output.
- Event jobs extend Hermes job metadata while keeping existing schedule support intact.
- Main risk is state migration from browser-local storage to backend state; keep the frontend adapter small and preserve existing reset semantics.
