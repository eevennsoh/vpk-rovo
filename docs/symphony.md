# Symphony

Symphony is implemented as a local Linear-to-Codex daemon under
`backend/lib/symphony`. It follows the OpenAI Symphony service shape: a
workflow file provides YAML front matter plus Markdown instructions, Linear is
the tracker source of truth, each issue gets a dedicated git worktree, and each
run is executed through `codex app-server`.

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
  labels: [symphony, codex]
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
Backlog -> Todo -> In Progress -> Human Review -> Done
```

Symphony only starts issues in `Todo` or `In Progress` that have either the
`symphony` or `codex` label. A successful Codex run moves the issue to
`Human Review`, where a human can inspect `/tmp/symphony-workspaces/<ISSUE-ID>`
or publish a PR before manually moving the issue to `Done`.

`dispatch.max_parallel` accepts either a positive integer or `infinite`. Use a
number to cap concurrent Codex workers, or `infinite` to let Symphony dispatch
all currently eligible issues in one poll.
