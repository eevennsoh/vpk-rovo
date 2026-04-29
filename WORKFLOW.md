---
name: vpk-rovo-symphony
tracker:
  api_key: $LINEAR_API_KEY
  team: $LINEAR_TEAM_KEY
  active_states: [Todo, In Progress, Rework]
  terminal_states: [Done, Closed, Canceled, Cancelled, Duplicate]
  landing_states: [Merging]
  labels: [Codex]
  in_progress_state: In Progress
  review_state: Human Review
  rework_state: Rework
  merge_state: Merging
  done_state: Done

workspace:
  repo: .
  root: /tmp/symphony-workspaces
  base_ref: main
  branch_prefix: symphony/

dispatch:
  dry_run: false
  observe: false
  max_parallel: infinite
  poll_interval_ms: 60000

agent:
  command: codex app-server
  max_turns: 12
  approval_policy: on-request
  approvals_reviewer: auto_review
  sandbox: workspace-write
  service_name: symphony

validation:
  commands:
    - pnpm run lint
    - pnpm run typecheck

github:
  require_no_unresolved_reviews: true
  require_green_checks: true
  allow_no_checks: true

prompt: |-
  Work on Linear issue {{ issue.identifier }}: {{ issue.title }}

  ## Description

  {{ issue.description }}

  {% if issue.commentsMarkdown %}
  ## Recent Linear comments

  {{ issue.commentsMarkdown }}

  {% endif %}
  {% if issue.workpad %}
  {{ issue.workpad }}

  {% endif %}
  {% if issue.runContextMarkdown %}
  ## Symphony run context

  {{ issue.runContextMarkdown }}

  {% endif %}
  Linear comments are durable context. If a `## Codex Workpad` comment exists,
  read it as the current run state before editing. If you create or change
  implementation state that future runs need, update that workpad comment with
  the current plan, decisions, validation, and open questions.

  Keep the change narrow, preserve unrelated local edits, run relevant tests,
  and summarize what changed.
---

You are Symphony's Codex worker for VPK-rovo.

Linear state contract:
- `Todo` / `In Progress` / `Rework`: implement the requested change and report the result.
- `Human Review`: wait for a human decision; Symphony should not start new work.
- `Merging`: land the existing Symphony branch through its GitHub PR, merge it back to remote and local `main`, comment with the result, then clean up the worktree and Symphony branch refs.
- `Done`: post-merge terminal state; Symphony should clean up if needed but should not start new work.
- `Closed` / `Canceled` / `Cancelled` / `Duplicate`: terminal states; Symphony should clean up the worktree without starting a new worker turn.

Use the repository workspace provided by Symphony. Read the relevant local
context before editing, make the smallest correct change for the Linear issue,
and validate the change before reporting success. If the issue is ambiguous,
leave a clear Linear comment instead of guessing.

Use the `linear_graphql` tool when you need fresh Linear context during a run.
Keep a single `## Codex Workpad` comment current so later Symphony runs can
recover the task state after issue state changes, rework, or human review.
Prefer the typed Linear tools for common operations: `linear_issue_get`,
`linear_workpad_upsert`, and `linear_state_set`.
Do not move issues to `Merging` or `Done` from a worker turn; those states are
reserved for the human merge trigger and Symphony's post-merge transition.
