# Symphony

Symphony is implemented as a local Linear-to-Codex daemon under
`backend/lib/symphony`. It follows the OpenAI Symphony service shape: a
workflow file provides YAML front matter plus Markdown instructions, Linear is
the tracker source of truth, each issue gets a dedicated git worktree, and each
run is executed through `codex app-server`.

This is intentionally a Codex-only VPK harness. OpenAI Symphony is the
behavioral reference, but this repo's `WORKFLOW.md` schema is local and
canonical; it is not a provider-neutral or strict upstream Symphony spec
implementation.

Run one polling pass:

```bash
pnpm run symphony -- --workflow WORKFLOW.md --once
```

Required configuration can be in workflow front matter or environment:

```yaml
---
tracker:
  api_key: $LINEAR_API_KEY
  team: $LINEAR_TEAM_KEY
  active_states: [Todo, In Progress]
  terminal_states: [Done, Canceled]
  labels: [Codex]
  in_progress_state: In Progress
  done_state: Human Review
workspace:
  repo: .
  root: /tmp/symphony-workspaces
agent:
  command: codex app-server
  approval_policy: on-request
  approvals_reviewer: auto_review
  sandbox: workspace-write
dispatch:
  max_parallel: infinite
---
```

The CLI loads `.env.local` and then `.env` before it reads the workflow. Both
files are gitignored in this repo, so you can keep local Linear credentials
there instead of exporting them in every shell.

The local Codex app-server may enforce policy requirements from the active
Codex account or workspace. This repo's `WORKFLOW.md` uses
`approval_policy: on-request`, `approvals_reviewer: auto_review`, and
`sandbox: workspace-write` so the daemon can run under those requirements while
still routing approval decisions through app-server.

Recommended Linear flow for this repo:

```text
Backlog -> Todo -> In Progress -> Human Review -> Rework -> Human Review -> Merging -> Done
```

Symphony only starts issues in `Todo`, `In Progress`, or `Rework` that have the
`Codex` label. A successful Codex run validates the work, creates or reuses a
draft GitHub PR, updates the durable `## Codex Workpad` comment, and moves the
issue to `Human Review`, where a human can inspect
`/tmp/symphony-workspaces/<ISSUE-ID>` and the PR. Move the issue to `Rework`
when follow-up changes are needed. Move the issue to `Merging` only when you
want Symphony to verify merge gates, mark the PR ready if needed, merge it,
sync `main`, move the issue to `Done`, remove the worktree, and delete the
local and remote Symphony branch refs.

Each worker prompt includes the issue description, recent Linear comments, the
durable workpad, and the current Symphony run context: branch, workspace, PR,
thread, turn count, validation status, and blockers. Workers get typed Linear
dynamic tools (`linear_issue_get`, `linear_workpad_upsert`, and
`linear_state_set`) plus raw `linear_graphql`, so they can refresh or update
Linear context during a run. Worker turns must not move issues to `Merging` or
`Done`; those states remain the human merge trigger and Symphony's post-merge
transition.

`dispatch.max_parallel` accepts either a positive integer or `infinite`. Use a
number to cap concurrent Codex workers, or `infinite` to let Symphony dispatch
all currently eligible issues in one poll.

Each run appends structured events to
`/tmp/symphony-workspaces/.symphony-events.jsonl` by default. If
`dispatch.status_port` is set, `/status` groups active, queued, retrying,
observed, review, landing, landed, blocked, failed, and cleaned runs from both
in-memory state and the durable event log.

## Harness engineering assessment

This assessment uses OpenAI's
[Harness engineering](https://openai.com/index/harness-engineering/) write-up
as the comparison point. The current repo is a Codex-specific harness with
durable orchestration history and a human-review landing checkpoint.

What is already in place:

- `WORKFLOW.md` keeps the Linear state contract, dispatch policy, sandbox,
  approval policy, and prompt template in version control with the repo.
- Each eligible Linear issue gets a deterministic git worktree and
  `symphony/` branch, so workers have isolated editable state.
- Successful active-state runs validate the branch, prepare a draft PR, and move
  issues to `Human Review`; moving an issue to `Merging` verifies merge gates,
  lands the PR, syncs `main`, moves the issue to `Done`, and removes the
  Symphony worktree and branch refs.
- `AGENTS.md` acts as a repo map and routes agents to deeper `.agents` docs,
  rules, skills, and validation workflows instead of relying on memory.
- Terminal-state polls stop any active Codex run before landing or cleanup, so
  the daemon does not remove or merge a workspace while `codex app-server` is
  still working in it.
- Workflow front matter is re-normalized after reload, so updated labels,
  states, dispatch limits, hooks, and Codex settings affect later polls.
- Worker prompts include recent Linear comments, durable workpad content, and
  run context; typed Linear tools plus `linear_graphql` let Codex refresh or
  update issue context during a run.
- Validation commands run under Symphony after Codex turns, so handoff status is
  based on orchestrator-observed command results instead of agent prose.
- GitHub merge gates check review decision and status checks before merging.
- The durable JSONL event log records dispatch, thread and turn IDs, state
  transitions, retries, landing, cleanup, PR details, and errors.
- The `/status` endpoint groups active, queued, observed, retrying, review,
  landing, landed, blocked, failed, and cleaned runs from memory plus durable
  history.
- Linear handoff comments include Codex thread IDs, workspace paths, branch
  names, validation commands when reported, post-success hook output when
  configured, and UI proof artifacts when reported.
- The Symphony implementation has targeted unit coverage for workflow parsing,
  config normalization, app-server calls, lifecycle cancellation, orchestration,
  workspace creation, landing, status summaries, event history, and branch
  cleanup.

Remaining opportunities are incremental:

1. Add a small documentation freshness check for `AGENTS.md`, `WORKFLOW.md`,
   and `docs/SYMPHONY.md`. The repo has good local guidance, but there is no
   mechanical guard that catches stale commands, missing links, or drift between
   the workflow file and its documentation.
2. Track recurring agent pain points as lightweight quality/debt and plan
   artifacts. `AGENTS-LESSONS.md` captures corrections, but there is no rollup
   that turns repeated failures into prioritized harness improvements or records
   active and completed execution plans for complex agent work.
3. Add optional per-run validation hooks in `WORKFLOW.md` once the team wants a
   stronger gate. A narrow first step is a post-success hook that records
   `pnpm run lint`, `pnpm run typecheck`, and any targeted `node --test`
   commands the worker reports, without blocking human review on unrelated
   existing failures.
