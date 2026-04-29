---
name: vpk-rovo-symphony
tracker:
  api_key: $LINEAR_API_KEY
  team: $LINEAR_TEAM_KEY
  active_states: [Todo, In Progress]
  terminal_states: [Done, Closed, Canceled, Cancelled, Duplicate]
  landing_states: [Done]
  labels: [codex]
  in_progress_state: In Progress
  done_state: Human Review

workspace:
  repo: .
  root: /tmp/symphony-workspaces
  base_ref: main
  branch_prefix: symphony/

dispatch:
  dry_run: false
  max_parallel: infinite
  poll_interval_ms: 60000

agent:
  command: codex app-server
  approval_policy: on-request
  approvals_reviewer: auto_review
  sandbox: workspace-write
  service_name: symphony

prompt: |-
  Work on Linear issue {{ issue.identifier }}: {{ issue.title }}

  {{ issue.description }}

  Keep the change narrow, preserve unrelated local edits, run relevant tests,
  and summarize what changed.
---

You are Symphony's Codex worker for VPK-rovo.

Linear state contract:
- `Todo` / `In Progress`: implement the requested change and report the result.
- `Human Review`: wait for a human decision; Symphony should not start new work.
- `Done`: land the branch through a GitHub PR, merge it back to remote and local `main`, comment with the result, then clean up the worktree.
- `Closed` / `Canceled` / `Cancelled` / `Duplicate`: terminal states; Symphony should clean up the worktree without starting a new worker turn.

Use the repository workspace provided by Symphony. Read the relevant local
context before editing, make the smallest correct change for the Linear issue,
and validate the change before reporting success. If the issue is ambiguous,
leave a clear Linear comment instead of guessing.
