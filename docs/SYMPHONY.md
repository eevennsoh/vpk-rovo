# Symphony

VPK-rovo runs the upstream OpenAI Symphony Elixir reference implementation
through `pnpm run symphony`. The local repo owns only the launcher, workflow
template, and repo-specific Codex skills. The Elixir runtime itself is pulled
from `openai/symphony` at startup.

Upstream reference: <https://github.com/openai/symphony/blob/main/elixir/README.md>

Repo-owned files:

- `WORKFLOW.md`: VPK workflow template rendered for upstream Symphony.
- `scripts/symphony.sh`: prepares a fresh upstream Elixir checkout, builds
  `./bin/symphony`, renders the workflow, and launches the service.
- `.agents/skills/linear/SKILL.md`: upstream-compatible raw Linear GraphQL
  helper for the injected `linear_graphql` app-server tool.
- `.agents/skills/commit`, `.agents/skills/pull`, `.agents/skills/push`,
  `.agents/skills/land`, and `.agents/skills/debug`: repo-local skills used by
  the upstream workflow prompt.

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
SYMPHONY_GITHUB_REPO=eevennsoh/VPK-rovo
SYMPHONY_WORKSPACE_ROOT=/tmp/symphony-workspaces
SYMPHONY_ENV_LOCAL_SOURCE=/absolute/path/to/VPK-rovo/.env.local
SYMPHONY_UPSTREAM_REPO=https://github.com/openai/symphony.git
SYMPHONY_UPSTREAM_REF=main
SYMPHONY_UPSTREAM_DIR=.tmp/symphony/openai-symphony
SYMPHONY_RUNTIME_DIR=.tmp/symphony/runtime
```

`SYMPHONY_UPSTREAM_DIR` is reset to the requested upstream ref on every launch
with `git fetch`, `git checkout --detach FETCH_HEAD`, `git reset --hard`, and
`git clean -fdx`. This intentionally discards local edits inside the cached
upstream checkout.

`SYMPHONY_ENV_LOCAL_SOURCE` is optional. When set, the workspace hook copies it
to each issue workspace as `.env.local`. The hook does not run `pnpm install`;
workers install dependencies only when issue-specific validation requires them.

## Run

Run with the optional Phoenix dashboard:

```bash
pnpm run symphony -- --port 4567
```

Run without the dashboard:

```bash
pnpm run symphony
```

The wrapper follows the upstream Elixir README flow:

```bash
git clone https://github.com/openai/symphony
cd symphony/elixir
mise trust
mise install
mise exec -- mix setup
mise exec -- mix build
mise exec -- ./bin/symphony /path/to/WORKFLOW.md
```

The wrapper also passes upstream Symphony the required
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

`WORKFLOW.md` is based on upstream `elixir/WORKFLOW.md` and keeps VPK-specific
customization in the YAML hooks plus the repository contract section.

- `Backlog`: not routed for implementation.
- `Todo`: worker moves the issue to `In Progress`, creates or updates the
  `## Codex Workpad`, then starts.
- `In Progress`: worker continues from the workpad.
- `Human Review`: waits for human action.
- `Rework`: worker handles reviewer feedback, validates, and returns to
  `Human Review`.
- `Merging`: worker follows the `land` skill and moves the issue to `Done`
  only after GitHub reports the PR merged.
- `Done`, `Closed`, `Canceled`, `Cancelled`, `Duplicate`: terminal.

Workers keep exactly one active `## Codex Workpad` comment. The workpad should
be concise and current: environment stamp, plan, acceptance criteria,
validation, decisions, branch, PR, and handoff.

## Lifecycle Hooks

`after_create` prepares an issue workspace by:

- cloning `SYMPHONY_SOURCE_REPO_URL`,
- checking out or creating `symphony/<issue-id>`,
- copying `.env.local` when `SYMPHONY_ENV_LOCAL_SOURCE` is configured.

`before_remove` delegates terminal-workspace cleanup to upstream
`mix workspace.before_remove` from the fresh Elixir checkout. The hook passes
the VPK GitHub repo slug and issue branch name so upstream cleanup can close
open PRs for branches whose Linear issues reached a terminal state without
merge.

## Debugging

The wrapper writes upstream logs under `.tmp/symphony/runtime/log` by default.
Start with the ticket key, then narrow to the Codex session:

```bash
rg -n "issue_identifier=VEN-123" .tmp/symphony/runtime/log/symphony.log*
rg -o "session_id=[^ ;]+" .tmp/symphony/runtime/log/symphony.log* | sort -u
rg -n "session_id=<thread>-<turn>" .tmp/symphony/runtime/log/symphony.log*
rg -n "Issue stalled|turn_timeout|turn_failed|Codex session failed|Codex session ended with error" .tmp/symphony/runtime/log/symphony.log*
```

If a worker repeatedly fails before the first Codex turn, inspect
`hook=after_create` and app-server startup lines first. If a worker spends time
inside a turn, inspect `thread/tokenUsage/updated`, `item/started`,
`item/completed`, and Linear GraphQL errors around the same `session_id`.
