# Symphony

VPK-rovo runs OpenAI's upstream Symphony Elixir reference implementation through
`pnpm run symphony`. The local repo owns only the wrapper, workflow template, and
VPK-specific Linear guidance.

Repo-owned files:

- `WORKFLOW.md`: VPK workflow template rendered for upstream Symphony.
- `scripts/symphony.sh`: clones or updates `openai/symphony`, prepares the
  Elixir runtime with `mise`, renders the workflow, and launches
  `./bin/symphony`.
- `.agents/skills/vpk-symphony/SKILL.md`: narrow guidance for the injected
  `linear_graphql` app-server tool.
- `scripts/symphony-merge-guard.js`: optional recovery tool for premature
  `Done` transitions while an attached PR is still open.

## Configuration

Required:

```bash
LINEAR_API_KEY=lin_api_<your-personal-api-key>
SYMPHONY_LINEAR_PROJECT_SLUG=<linear-project-slug>
```

`LINEAR_API_KEY` can live in `.env.local` or the shell environment. The project
slug comes from the Linear project URL.

Optional overrides:

```bash
LINEAR_ASSIGNEE=me
SYMPHONY_SOURCE_REPO_URL=git@github.com:eevennsoh/VPK-rovo.git
SYMPHONY_WORKSPACE_ROOT=/tmp/symphony-workspaces
SYMPHONY_ENV_LOCAL_SOURCE=/absolute/path/to/VPK-rovo/.env.local
SYMPHONY_DIR=.tmp/symphony/openai-symphony
SYMPHONY_RUNTIME_DIR=.tmp/symphony/runtime
SYMPHONY_MERGE_GUARD=1
SYMPHONY_MERGE_GUARD_INTERVAL_MS=10000
```

`SYMPHONY_ENV_LOCAL_SOURCE` is optional. When set, the workspace hook copies it
to each issue workspace as `.env.local`. The hook does not run `pnpm install`;
workers install dependencies only when the issue-specific validation requires
them.

`SYMPHONY_MERGE_GUARD` defaults to off. Set it to `1` only for recovery runs
where premature `Done` transitions should be moved back to `Merging` when an
attached GitHub PR is still open.

## Run

Run with the optional Phoenix dashboard:

```bash
pnpm run symphony -- --port 4567
```

Run without the dashboard:

```bash
pnpm run symphony
```

The wrapper renders `WORKFLOW.md` into `SYMPHONY_RUNTIME_DIR` at startup. After
changing workflow front matter or prompt text, stop and restart Symphony so the
running process uses a fresh rendered workflow.

The wrapper passes upstream Symphony the required
`--i-understand-that-this-will-be-running-without-the-usual-guardrails` flag.
With `--port`, upstream Symphony exposes:

- `/`: Phoenix LiveView dashboard.
- `/api/v1/state`: JSON snapshot of running and retrying work.
- `/api/v1/<issue_identifier>`: one issue's running or retrying status.
- `/api/v1/refresh`: `POST` endpoint that requests an immediate poll.

## Workflow

Recommended Linear flow:

```text
Backlog -> Todo -> In Progress -> Human Review -> Rework -> Human Review -> Merging -> Done
```

`WORKFLOW.md` intentionally stays close to upstream Symphony:

- `Backlog`: not routed for implementation.
- `Todo`: worker moves the issue to `In Progress`, creates or updates the
  `## Codex Workpad`, then starts.
- `In Progress`: worker continues from the workpad.
- `Human Review`: not active; a human decides whether to request rework or
  move to merge.
- `Rework`: active; worker handles reviewer feedback, validates, and returns to
  `Human Review`.
- `Merging`: active; worker lands the reviewed PR and moves the issue to `Done`
  only after GitHub reports the PR merged.
- `Done`, `Closed`, `Canceled`, `Cancelled`, `Duplicate`: terminal.

Workers keep exactly one active `## Codex Workpad` comment. The workpad should
be concise and current: environment stamp, plan, acceptance criteria,
validation, decisions, branch, PR, and handoff.

Upstream Symphony re-dispatches an issue when a Codex turn completes while the
issue is still in an active state. For that reason, VPK workers should not end a
normal turn with completed or blocked work still in `In Progress`; they should
write the handoff or blocker into the workpad and move the issue to
`Human Review`.

Answer-only issues, such as “explain this codebase” or operational questions,
do not need a branch or PR. Workers should do a bounded targeted read, put the
answer in the workpad handoff, and move the issue to `Human Review`.

Validation is issue-specific. Workers should prefer the narrowest proof that
covers the touched behavior. Run dependency installation, `pnpm run lint`,
`pnpm run typecheck`, browser checks, accessibility checks, or PR feedback
sweeps only when the issue, touched surface, existing PR feedback, or merge
state requires them.

Workers should also keep command output bounded. Avoid broad repository
inventories and large file-list dumps; use exact searches and short file ranges
so a small issue does not become a large repeated context window.

## Runtime Knobs

The workflow keeps the upstream defaults visible where local choices matter:

- `polling.interval_ms`: `5000`, matching the upstream sample cadence.
- `agent.max_concurrent_agents`: `10`, matching the upstream sample.
- `agent.max_turns`: `3`, a local cap to stop one issue from running many
  back-to-back Codex turns without human review.
- `agent.max_concurrent_agents_by_state.Merging`: `1`, the only local per-state
  cap, so merge work does not run in parallel across several issues.
- `codex.command`: upstream-style `codex ... app-server` with inherited shell
  environment plus explicit `gpt-5.5` and `xhigh` reasoning settings.
- `codex.approval_policy`: `on-request`, because the local Codex app-server
  cloud requirements currently reject `never` turn overrides. Smooth unattended
  behavior comes from keeping the worker prompt and validation path narrow, not
  from forcing a policy the runtime will refuse.
- `codex.turn_timeout_ms`: `300000`, `codex.read_timeout_ms`: `5000`, and
  `codex.stall_timeout_ms`: `120000`, local guards that prevent long-running or
  silent turns from burning indefinitely.

Upstream also supports SSH workers with `worker.ssh_hosts` and
`worker.max_concurrent_agents_per_host`. VPK-rovo leaves those unset for local
runs.

## Lifecycle Hooks

`after_create` prepares an issue workspace by:

- cloning the configured repo,
- checking out or creating `symphony/<issue-id>`,
- copying `.env.local` when `SYMPHONY_ENV_LOCAL_SOURCE` is configured.

It deliberately does not install dependencies. This avoids pre-agent retry loops
from local Node or package-manager failures and lets each worker install only
what its validation path needs.

`before_remove` writes a small archive note under
`$SYMPHONY_WORKSPACE_ROOT/.archive` with workspace path, branch, commit, and
dirty state before upstream Symphony removes a terminal workspace.

## Debugging

The wrapper writes upstream logs under `.tmp/symphony/runtime/log` by default.
Start with the ticket key, then narrow to the Codex session:

```bash
rg -n "issue_identifier=VEN-123" .tmp/symphony/runtime/log
rg -o "session_id=[^ ;]+" .tmp/symphony/runtime/log | sort -u
rg -n "session_id=<thread>-<turn>" .tmp/symphony/runtime/log
rg -n "Issue stalled|turn_timeout|turn_failed|Codex session failed|Codex session ended with error" .tmp/symphony/runtime/log
```

If a worker repeatedly fails before the first Codex turn, inspect
`hook=after_create` and app-server startup lines first. If a worker burns time
inside a turn, inspect `thread/tokenUsage/updated`, `item/started`,
`item/completed`, and Linear GraphQL errors around the same `session_id`.
