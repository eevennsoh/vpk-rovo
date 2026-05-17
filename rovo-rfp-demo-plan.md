# Spec: Rovo RFP Drafting Agent Demo

## Objective

Build the `/agents` prototype narrative for a hybrid internal-leadership demo. The demo should be presenter-led enough to record reliably, but clear enough for people to replay hands-on in the browser.

The story is:

1. Maya opens `RFP-101` from a Jira-style RFP board.
2. Rovo uses the active work item, attachments, subtasks, and fixture-backed Teamwork Graph context to help Maya qualify and draft the RFP response.
3. Rovo generates a polished report artifact in Rovo Canvas.
4. Maya approves, exports a staged PDF, and attaches the approved HTML and PDF artifacts back to `RFP-101`.
5. Rovo proposes turning that successful one-off workflow into a reusable `RFP Drafting Agent`.
6. Maya creates and schedules the agent.
7. Maya moves `RFP-101` straight from `RFP Intake` to `Review`.
8. Maya later drags `RFP-102` into `Drafting`; the RFP Drafting Agent is assigned and starts first-pass prep.

Primary success moment:

> Rovo turns a successful one-off RFP workflow into a reusable, scheduled Drafting agent with very little setup.

## Audience And Demo Mode

- Primary audience: internal leaders.
- Demo mode: hybrid. The golden path must be smooth for a recording and still replayable by hands-on viewers.
- Viewport target: desktop first. Tablet should remain usable where practical. Full mobile kanban optimization is not required.
- The viewer should remember the whole arc: context-aware RFP help, durable report artifact, easy agent creation, recurring schedule, and future ticket assignment.

## Current Surface Anchors

Use the existing `/agents` product prototype shape.

- Route: `/agents`.
- Board project: `Enterprise RFP Response`.
- Key card: `RFP-101 - Qualify enterprise service-management RFP`.
- Automation destination: `Drafting`.
- Future repeated-use card: `RFP-102 - Parse supplier questionnaire and requested files`.
- Existing useful surfaces:
  - Jira-style board and column assignment controls.
  - Work item modal with details, subtasks, attachments, agents, automation, and activity-style sections.
  - Shared Rovo sidebar/floating chat.
  - Existing question-card widget and JSON extractor.
  - Existing Chain of Thought UI for visible staged tool steps.
  - Existing Rovo Canvas component for artifact plus right-side chat.

Implementation should stay route-local to `/agents` unless a small shared prop or component extension is the cleanest way to reuse existing surfaces.

## Non-Goals

- Do not write to real Jira.
- Do not create or update `.agents/agents` files.
- Do not add server-side custom agent persistence.
- Do not implement a production agent harness.
- Do not implement a production scheduler or background worker.
- Do not query a real Teamwork Graph backend.
- Do not generate a real PDF file. PDF is a staged attachment entry and preview.
- Do not require the golden path to work without AI Gateway credentials.
- Do not build a full second RFP completion flow for `RFP-102`.
- Do not log every chat turn or every progress trace line.

## Prototype Truth

The demo combines real chat with staged product behavior.

- AI Gateway is required for core chat.
- Gateway failure appears as an inline chat error.
- Qualification questions are generated live through Gateway.
- The initial bid/no-bid response prose is generated live through Gateway.
- The visible tool-call trace is staged/fake-semi-real UI.
- Teamwork Graph content is fixture-backed.
- The `vpk-html` call is shown as a staged tool/skill call.
- The polished report artifact is deterministic template content.
- The PDF artifact is a staged PDF attachment entry.
- The custom agent, schedule, assignments, canvas stage, attachments, and activity are browser-local state.

Presenter-facing language can be polished, but implementation copy must avoid implying real Jira writes, real server-side agent persistence, real TWG queries, real PDF generation, or production background execution.

## Golden Path

### 1. Start From Board

Initial board:

- `RFP-101` is in `RFP Intake`.
- `RFP Intake` contains several work items to show this is repeatable.
- `Drafting` is visible as the future automation destination.
- A `Reset demo` affordance is visible in the board toolbar or nearby demo controls.

Maya opens `RFP-101`.

The work item modal shows:

- Description with customer context and RFP scope.
- Subtasks for requirement matrix, platform confirmation, win themes, and legal/security exhibits.
- Existing attachments: RFP packet, compliance matrix, response brief, supplier portal upload image, audio briefing, and walkthrough.
- Rovo chat with an active work item context chip for `RFP-101`.

Framing:

> Maya is not starting from a blank chat. She is starting from the Jira work item where the RFP work already lives.

### 2. Ask Rovo For RFP Help

The `RFP-101` modal stays open for this step. Maya uses the floating Rovo button
available over the modal, keeping the work item as the active context surface
instead of closing the modal to use the board-level demo controls.

Maya prompt:

```text
Help me complete this RFP. Give me a bid/no-bid recommendation first,
then draft a first-pass response strategy covering ITSM, CMDB, asset
management, and AI compliance. Use everything in this ticket and the
attached documents.
```

Expected behavior:

- Floating Rovo opens while the `RFP-101` modal remains visible.
- The chat context chip references `RFP-101`.
- Submit through AI Gateway with active `RFP-101` context.
- Show Chain of Thought tool-call UI while the response is being prepared.
- The staged trace includes Jira, attachment, Teamwork Graph, and response-building steps.
- Gateway should generate a live question card if it needs qualification details.

Staged tool-call trace examples:

- `jira.read_work_item` reads `RFP-101`, parent `RFP-100`, status, priority, due date, and subtasks.
- `jira.scan_attachments` scans the RFP packet, compliance matrix, response brief, supplier portal upload, audio briefing, and walkthrough.
- `teamwork_graph.search` returns fixture-backed account memory, people, and reusable response assets.
- `rfp.map_requirements` maps ITSM, CMDB, asset management, AI, legal, data residency, and security requirements.
- `rfp.check_unfinished_work` flags `RFP-106` and `RFP-108` as validation gaps.

Teamwork Graph fixture content to surface:

| Source | Example | Why it matters |
| --- | --- | --- |
| Confluence | Standard ITSM RFP Response Template | Proven response structure |
| Jira | Prior security review and POC tracker | Evidence for risk handling |
| Loom | Rovo for ITSM demo recording | Demo narrative support |
| People | CSM, SE, legal counsel | Escalation routing |
| Goals | FY26 Enterprise Expansion | Account-strategy context |

### 3. Qualification Questions

Questions should be generated live, but rendered through the existing question-card mechanism when possible.

Transport:

- Prompt Gateway to emit a fenced `question-card` JSON block that matches the existing question-card extractor.
- If a valid question-card payload is extracted, render the shared Question Card UI.
- If extraction fails, show the Gateway text/prose fallback inline in chat. Do not inject a fake default card.

Question content should naturally cover:

- Deal size or ARR estimate.
- Incumbent platform.
- Whether legal/security gaps should be pending or use standard approved language.
- Internal deal desk vs customer-facing audience.
- Hero narrative: unified ITSM/CMDB first vs Rovo AI automation first.
- Whether to reuse TWG-found template and prior pilot notes.

Maya answer pattern:

```text
Assume $2.4M ARR, ServiceNow incumbent, internal deal desk first.
Use standard approved language but mark legal, data residency, audit, and
vulnerability responses as review-required. Lead with unified ITSM and CMDB,
then use Rovo AI automation as the differentiator. Reuse the standard ITSM
template and prior JSM pilot notes.
```

When Maya answers:

- Store the answer summary in demo state.
- Send the answer back through Gateway as the next prompt with active RFP context and prior question context.
- If Maya skips details, proceed with live prose but mark unknowns as assumptions or pending review.

### 4. Live Response Package

Rovo produces live Gateway prose for the first response package. Do not test exact wording.

The response should be shaped by prompt/context toward:

- Bid/no-bid recommendation.
- Requirement coverage matrix.
- Win themes.
- First-pass response narrative.
- TWG-sourced reusable asset index.
- Open risks.
- Suggested next actions.

Required narrative beats:

- Strong fit for ITSM, service desk, portal, knowledge, and change workflows.
- Assets and CMDB address customer fragmentation.
- Rovo and Teamwork Graph differentiate the AI narrative.
- Prior JSM pilot notes and reusable RFP templates strengthen the response.
- Legal, data residency, audit, and vulnerability responses remain review-required.

### 5. Generate Report In Rovo Canvas

Maya prompt:

```text
Create an offline HTML report from this work item that I can attach back to the RFP.
```

Expected behavior:

- Show a staged `vpk-html` tool/skill call in Chain of Thought UI.
- Open Rovo Canvas with `kind="report"` mental model.
- Canvas left side shows the report artifact.
- Canvas right rail keeps Rovo chat available for refinement.
- Report content comes from deterministic fixture/template data, not the live Gateway response.

Report sections:

- Executive recommendation.
- Requirement coverage matrix.
- Win themes.
- TWG-sourced account memory and reusable asset index.
- Customer context.
- Open risks.
- Required approvals.
- Next actions.

Rovo Canvas views:

- `Plan`: short generation plan and source summary.
- `Preview`: rendered report preview.
- `HTML`: source-like HTML view or static code preview.

### 6. Refine Report

Maya prompt:

```text
Make the executive summary more customer-facing and add a stronger risk note for legal and data residency review.
```

Expected behavior:

- Rovo chat acknowledges the update.
- Canvas current report updates to deterministic refined fixture content.
- Version history shows two versions:
  - `Initial generated report`.
  - `Refined current report`.

### 7. Approve, Export PDF, Attach

Use separate actions so human control is visible.

Required action sequence:

1. `Approve report`
2. `Export PDF`
3. `Attach to RFP-101`

Behavior:

- Approval marks the HTML report as approved.
- Export PDF creates a staged PDF artifact entry after approval.
- Attach adds both artifacts to `RFP-101` attachments:

```text
RFP response strategy.html
RFP response strategy.pdf
```

Click behavior:

- HTML attachment opens a read-only report preview/canvas view.
- PDF attachment opens a staged PDF preview card or modal.
- No real file download is required.

After attachment, Rovo proposes the reusable agent.

Proposal copy:

```text
This RFP workflow looks repeatable. Want me to create an RFP Drafting Agent
that can help with future tickets moved into Drafting?
```

### 8. Create RFP Drafting Agent

Maya confirms agent creation.

Rovo opens chat in agent creation mode with this prefilled prompt:

```text
Create an RFP Drafting Agent for the Drafting column on the Enterprise RFP Response board.

The agent should read each RFP work item, inspect attachments and subtasks,
use Teamwork Graph to find related account memory and reusable response assets,
ask missing qualification questions, draft a response strategy, generate an
HTML report with vpk-html, stage a PDF export, and wait for human approval
before attaching the report or moving the ticket forward.
```

Creation behavior:

- Persist a browser-local custom agent profile.
- Do not write `.agents/agents`.
- Do not call a real production agent harness.
- Idempotency: if the agent already exists, reuse/reopen the existing `RFP Drafting Agent` instead of creating a duplicate.
- Assign the agent to the `Drafting` workflow/column.
- Do not assign the agent retroactively to `RFP-101`.

Confirmation surface:

| Field | Value |
| --- | --- |
| Agent name | RFP Drafting Agent |
| Trigger | When an RFP ticket enters Drafting |
| Schedule | Weekdays at 9:00 AM |
| Skills | vpk-html |
| Tools | Jira work item reader, attachment scanner, Teamwork Graph search, report generator |
| Knowledge | RFP-101 approved report, Standard ITSM RFP Response Template, prior JSM pilot notes, prior security review |
| Output | HTML response strategy report and staged PDF |
| Guardrail | Human approval required before attachment or status changes |
| Assigned workflow | Drafting column |

Use:

> Rovo is now running with the RFP Drafting Agent selected.

Avoid:

> Rovo has been replaced by the new agent.

### 9. Agent Details Side Panel

Clicking the created agent opens a side panel. It is read-only for v1.

Required tabs or sections:

- `Tasks`: trigger and scheduled job summary.
- `Instructions`: concise operating instructions.
- `Skills`: `vpk-html`.
- `Tools`: Jira work item reader, attachment scanner, Teamwork Graph search, report generator, staged PDF export.
- `Knowledge`: seeded sources listed above.
- `Activity`: custom-agent operations only.

Agent Activity should include:

```text
Rovo created RFP Drafting Agent.
Rovo assigned RFP Drafting Agent to the Drafting workflow.
Maya scheduled RFP Drafting Agent for weekdays at 9:00 AM.
RFP Drafting Agent was assigned to RFP-102.
RFP Drafting Agent started first-pass response prep for RFP-102.
```

Agent Activity should not include:

- Pre-agent report-generation events.
- Every chat message.
- Every staged tool trace line.
- Internal localStorage writes.
- Hover/open/close events.

### 10. Schedule Agent

Scheduler is compact and required.

The scheduled task/job appears in the agent side panel. It follows the Rovo tasks/jobs mental model, but remains browser-local state.

Schedule summary:

| Field | Value |
| --- | --- |
| Job | Drafting column RFP response prep |
| Agent | RFP Drafting Agent |
| Schedule | Weekdays at 9:00 AM |
| Scope | Drafting column |
| Action | Prepare first-pass draft package |
| Guardrail | Approval required for attachments and status changes |

Do not simulate the scheduled job firing automatically during the golden path. The scheduled job proves recurrence; the drag event proves immediate workflow activation.

### 11. Move RFP-101 To Review

After agent creation and scheduling, Maya manually drags `RFP-101` from `RFP Intake` to `Review`.

Framing:

> Maya decides the draft is ready for colleague review and moves it forward.

Do not say:

> The ticket is done.

`RFP-101` should not pass through `Drafting` in the golden path. This is the pre-agent example that proves the workflow. Future tickets use the normal `RFP Intake -> Drafting -> Review` path.

### 12. Repeated Use With RFP-102

Maya drags `RFP-102` from `RFP Intake` to `Drafting`.

Behavior after the agent exists:

- The Drafting column shows the RFP Drafting Agent as assigned.
- `RFP-102` gets the agent avatar or active assignment indicator.
- A toast, activity item, or card-level state appears:

```text
RFP Drafting Agent assigned to RFP-102.
Preparing first-pass response package.
```

Guardrail copy:

```text
Draft workflow started. I will ask before attaching a report or moving the ticket forward.
```

Do not generate a second full report for `RFP-102` in the core flow.

If someone drags a ticket into `Drafting` before creating the custom agent, move the card normally and do not assign automation.

## State Model

Persist `/agents` demo state in versioned localStorage.

Recommended key:

```text
vpk-rovo:agents-rfp-demo:v1
```

State shape:

```ts
interface AgentsRfpDemoState {
	version: 1;
	board: {
		columns: Array<{
			title: string;
			cardCodes: string[];
		}>;
	};
	workItems: Record<string, {
		status: string;
		attachments: Array<{
			id: string;
			displayName: string;
			ext: "html" | "pdf" | string;
			source: "fixture" | "generated";
			approved?: boolean;
			previewKind?: "html-report" | "pdf-preview";
		}>;
		agentAssignmentIds: string[];
	}>;
	report: {
		stage: "none" | "generating" | "generated" | "refined" | "approved" | "pdf-exported" | "attached";
		currentVersionId?: string;
		versions: Array<{
			id: string;
			label: string;
			summary: string;
			createdBy: "Rovo" | "Maya";
			timestampLabel: string;
		}>;
	};
	agent: null | {
		id: "rfp-drafting-agent";
		name: "RFP Drafting Agent";
		selected: boolean;
		assignedColumn: "Drafting";
		createdAt: string;
	};
	schedule: null | {
		id: "rfp-drafting-weekday-0900";
		name: "Drafting column RFP response prep";
		agentId: "rfp-drafting-agent";
		scheduleLabel: "Weekdays at 9:00 AM";
		status: "scheduled";
	};
	customAgentActivity: Array<{
		id: string;
		timestampLabel: string;
		message: string;
		type: "agent-created" | "workflow-assigned" | "scheduled" | "card-assigned" | "draft-started";
	}>;
	canvas: {
		open: boolean;
		activeViewId: "plan" | "preview" | "html";
		mode: "editable" | "read-only";
	};
	chat: {
		selectedAgentId: "rovo" | "rfp-drafting-agent";
		lastRfp101AnswerSummary?: string;
	};
	toasts: Array<{
		id: string;
		message: string;
	}>;
}
```

Rules:

- Seed defaults when localStorage is missing.
- Auto-reset to defaults when `version` is missing, unsupported, or state validation fails.
- Reset clears only this demo-local state key and any route-local companion keys.
- Reload restores valid state: board, attachments, report stage, canvas stage, agent, selected agent context, schedule, custom-agent activity, and relevant chat state.
- Keep generated attachment payloads small. Store metadata and fixture IDs, not full large HTML/PDF blobs, unless a small inline preview is required.

## Reset Behavior

`Reset demo` must restore the default narrative setup:

- Board columns and card positions.
- Work item statuses.
- Generated report attachments.
- Report/canvas stage and versions.
- Custom RFP Drafting Agent profile.
- Column and card agent assignments.
- Selected agent context.
- Agent chat/conversation state used by the demo.
- Scheduled jobs.
- Custom-agent activity log.
- Staged toasts and in-progress states.

Confirmation copy:

```text
Reset the RFP demo back to its starting state? This clears local demo data for this browser only.
```

After reset, the custom-agent activity log is empty because the custom agent no longer exists.

## Copy Guardrails

Use safer wording:

| Risky | Use instead |
| --- | --- |
| Rovo finished the RFP. | Rovo created a review-ready response package. |
| The agent automatically completes future tickets. | The agent is assigned and prepares a first-pass draft for approval. |
| Rovo is replaced by the new agent. | Rovo is now running with the RFP Drafting Agent selected. |
| The ticket is done. | The draft is ready for colleague review. |
| vpk-html generated the PDF. | Rovo generated the HTML artifact with vpk-html, then staged a PDF export. |
| The scheduler is running production automation. | The demo schedules a local recurring job pattern for this browser session. |

Prototype truth should be presenter notes and careful copy, not prominent UI badges, unless a later review asks for explicit demo-local labels.

## Implementation Boundaries

Always:

- Keep changes narrowly scoped to `/agents` behavior and existing shared component extension points.
- Preserve existing user changes in the dirty worktree.
- Reuse existing Question Card, Chain of Thought, Rovo Canvas, sidebar chat, board, modal, attachment, and agent-assignment primitives.
- Use live Gateway output for chat prose, but do not assert exact generated text in tests.
- Use deterministic fixtures for report HTML/PDF preview and seeded TWG context.
- Use route-local state helpers for localStorage validation, defaults, reset, and idempotent agent creation.

Ask first:

- Adding a new dependency.
- Changing shared chat behavior outside `/agents`.
- Adding real Jira/TWG/backend persistence.
- Reworking the global Rovo Jobs route instead of showing the RFP schedule in the agent panel.
- Making agent details editable.

Never:

- Revert unrelated modified files.
- Write repo-local `.agents/agents` definitions for this product demo.
- Store secrets or credentials in localStorage.
- Build a hidden production scheduler.
- Make durable changes without an explicit user approval action in the UI.

## Testing Strategy

Run focused tests for the touched `/agents`, question-card, and state helpers. Do not assert exact live Gateway prose.

State/unit tests:

- Missing localStorage seeds default state.
- Valid localStorage resumes board, agent, schedule, report, attachments, and activity.
- Invalid or old localStorage auto-resets.
- `Reset demo` restores defaults.
- Agent creation is idempotent.
- Creating the agent assigns it to Drafting but not retroactively to `RFP-101`.
- Dragging `RFP-102` to Drafting before agent creation only moves the card.
- Dragging `RFP-102` to Drafting after agent creation assigns the agent and adds custom-agent activity.
- Report stages advance in order: generated, refined, approved, pdf-exported, attached.

UI tests:

- Opening `RFP-101` gives Rovo active work item context.
- Valid question-card payload renders the shared Question Card.
- Invalid question-card payload falls back to inline chat text.
- Rovo Canvas report opens with plan, preview, and HTML views.
- Approve, Export PDF, and Attach actions are separate and ordered.
- Attached HTML and staged PDF appear on `RFP-101`.
- Agent side panel shows Tasks, Instructions, Skills, Tools, Knowledge, and Activity.
- Custom-agent Activity excludes report-generation events and chat transcripts.
- Reset clears custom agent, schedule, assignments, attachments, canvas state, and custom-agent activity.

Manual verification:

- Complete the golden path at `/agents` on desktop.
- Verify inline Gateway error behavior.
- Verify reload/resume after agent creation and after attachment.
- Verify reset/replay.
- Verify `RFP-101` moves directly from Intake to Review.
- Verify `RFP-102` repeated-use flow starts but does not complete a second full report.

## Acceptance Scenarios

- Opening `RFP-101` shows active work item context in Rovo chat.
- First RFP prompt calls Gateway and shows staged Jira, attachment, TWG, and response-building trace steps.
- Teamwork Graph appears as fixture-backed source/tool output and contributes reusable account context.
- Live Gateway questions render as a Question Card when valid structured output is available.
- Maya's answer is stored locally and sent back through Gateway.
- The initial bid/no-bid response is live prose with no exact wording dependency.
- Asking for an offline HTML report opens Rovo Canvas and shows a deterministic `vpk-html` report fixture.
- Refinement updates the report fixture and shows two versions.
- Maya approves the report, exports staged PDF, and attaches both HTML and PDF to `RFP-101`.
- After attachment, Rovo proposes the reusable RFP Drafting Agent.
- Creating the agent persists a localStorage-backed `RFP Drafting Agent`.
- Agent details side panel shows tasks, instructions, skills, tools, knowledge, and custom-agent activity.
- Scheduling creates a compact weekday 9:00 AM job summary in the agent side panel.
- Maya moves `RFP-101` directly from `RFP Intake` to `Review`.
- Moving `RFP-102` into `Drafting` after agent creation assigns the agent and starts draft prep.
- The repeated-use state waits for human approval before any attachment or status move.
- Reload restores the demo state.
- Reset restores the starting board and clears browser-local demo state.

## Open Risks

- Live Gateway may produce question-card content that is not valid JSON. Mitigation: existing extractor fallback to text/prose.
- Live Gateway wording may drift from desired sales narrative. Mitigation: tests assert UI state and required staged fixtures, not exact prose.
- Simulated tool calls may look too real. Mitigation: presenter notes and safer copy avoid claims of real Jira/TWG/PDF/scheduler behavior.
- The Rovo Canvas report flow can dominate the demo. Mitigation: keep report actions compact and use deterministic content.
- Scheduler can compete with drag-triggered automation. Mitigation: schedule is proof of recurrence; drag into Drafting is proof of immediate activation.
- localStorage state can become stale during iteration. Mitigation: versioned state and auto-reset on invalid shape.

## Future Extensions

These are out of v1 unless explicitly approved later:

- Separate TWG entity graph panel.
- `Run now` action for the scheduled job.
- Editable agent instructions.
- Full agent details page.
- Real PDF generation/download.
- Real Jira attachment writeback.
- Real TWG integration.
- Full `RFP-102` report generation flow.

---

Spec version: 3.0 - May 2026 - Rewritten as an implementation-ready spec after product/spec interview.
