# Symphony

VPK-rovo uses OpenAI's upstream Symphony reference implementation as its
Symphony harness. The repo keeps only one operational path, exposed through
`pnpm run symphony`.

The repo-owned files are:

- `WORKFLOW.md`: VPK-specific workflow template for upstream Symphony.
- `scripts/symphony.sh`: wrapper that clones or updates `openai/symphony`,
  installs the runtime through `mise`, renders a runtime workflow with your
  Linear project slug, and launches `./bin/symphony`.
- `pnpm run symphony`: default repo entrypoint for Symphony.
- `.playwright/cli.config.json`: Playwright CLI defaults for browser evidence
  produced by Symphony workers.
- `.agents/skills/vpk-symphony/SKILL.md`: guidance for the raw
  `linear_graphql` tool that upstream Symphony injects into Codex app-server
  sessions.

## Configuration

Required local configuration:

```bash
LINEAR_API_KEY=lin_api_<your-personal-api-key>
SYMPHONY_LINEAR_PROJECT_SLUG=<linear-project-slug>
```

`LINEAR_API_KEY` can live in `.env.local` or the shell environment. The project
slug comes from the Linear project URL.

The upstream implementation polls Linear by project slug and state. Use a
dedicated Linear project or set `LINEAR_ASSIGNEE=me` if you need a narrower
evaluation surface.

Optional overrides:

```bash
LINEAR_ASSIGNEE=me
SYMPHONY_SOURCE_REPO_URL=git@github.com:eevennsoh/VPK-rovo.git
SYMPHONY_WORKSPACE_ROOT=/tmp/symphony-workspaces
SYMPHONY_ENV_LOCAL_SOURCE=/absolute/path/to/VPK-rovo/.env.local
SYMPHONY_DIR=.tmp/symphony/openai-symphony
SYMPHONY_RUNTIME_DIR=.tmp/symphony/runtime
SYMPHONY_MERGE_GUARD=0
SYMPHONY_MERGE_GUARD_INTERVAL_MS=10000
```

`SYMPHONY_ENV_LOCAL_SOURCE` is optional, but recommended for local runs. When
set, the workspace hook copies that file into each issue workspace as
`.env.local`, so workers can boot the VPK app and run browser or accessibility
checks instead of relying only on static validation.

## Run

Run with the optional Phoenix dashboard:

```bash
pnpm run symphony -- --port 4567
```

Run without the dashboard:

```bash
pnpm run symphony
```

The current upstream CLI requires the
`--i-understand-that-this-will-be-running-without-the-usual-guardrails` flag.
`scripts/symphony.sh` passes that flag explicitly so the package script
can run unattended after you provide the Linear configuration.

When the dashboard is enabled with `--port`, upstream Symphony exposes:

- `/`: Phoenix LiveView dashboard.
- `/api/v1/state`: JSON snapshot of running and retrying work.
- `/api/v1/<issue_identifier>`: one issue's running or retrying status.
- `/api/v1/refresh`: `POST` endpoint that requests an immediate poll.

## Workflow

Recommended Linear flow for this repo:

```text
Backlog -> Todo -> In Progress -> Human Review -> Rework -> Human Review -> Merging -> Done
```

`WORKFLOW.md` encodes the worker behavior:

- `Backlog`: out of scope; Symphony waits for a human to move the issue to
  `Todo`.
- `Todo`: move to `In Progress`, create or update the `## Codex Workpad`, and
  start work. If a PR is already attached, handle it as feedback or rework
  before adding new product scope.
- `In Progress`: continue implementation from the workpad.
- `Rework`: inspect reviewer comments and PR feedback, fix the requested
  changes, and return to `Human Review` only after validation. If the existing
  PR is stale, closed, merged, or unsuitable for the requested feedback, restart
  from a fresh branch based on `origin/main`.
- `Human Review`: wait for a human decision; do not start new implementation.
- `Merging`: land the already-reviewed PR, sync with `origin/main`, and move
  the Linear issue to `Done` only after the merge succeeds.
- `Done`, `Closed`, `Canceled`, `Cancelled`, `Duplicate`: terminal states.

Workers should keep one active `## Codex Workpad` comment current with selected
skills, plan, acceptance criteria, validation, decisions, blockers, branch, PR,
and final handoff notes.

### Skill routing

`WORKFLOW.md` uses workpad-enforced skill routing. Before edits, each worker
records a `Selected Skills` section in the `## Codex Workpad`, with one line per
skill and a short rationale. The selected skills act as phase checklists for the
work; they do not change the upstream Symphony runtime or add new wrapper
behavior.

VPK-rovo references the globally installed phase skills from
[agent-skills](https://github.com/addyosmani/agent-skills/tree/main/skills) by
name. The repo does not vendor those full skill files. If a named skill is not
available in a worker environment, the worker records the unavailable skill and
continues with the routing policy in `WORKFLOW.md` instead of blocking the run.

The state-to-skill policy is intentionally narrow:

- `Todo`: start with `context-engineering`; add refinement, spec, or planning
  skills only when the issue is vague or broad.
- `In Progress`: start with `incremental-implementation`; add debugging, UI,
  API, or source-driven skills according to the touched surface.
- `Rework`: start with `code-review-and-quality`; add security, performance, or
  debugging skills only when feedback requires them.
- `Merging`: use `git-workflow-and-versioning`; add CI or shipping skills only
  when checks, deployment, or release readiness are in scope.
- `Backlog`, `Human Review`, and terminal states: select no implementation
  skills.
- Any code-changing state includes `test-driven-development` as the default
  validation guardrail. Browser-visible changes also use `playwright-cli`,
  screenshots or WebM recordings, traces for unexpected failures, and
  accessibility checks from `AGENTS.md`.

### Browser evidence

Symphony workers use Playwright CLI for browser-visible proof. The checked-in
`.playwright/cli.config.json` makes Playwright CLI write local artifacts under
`output/playwright/`, which is ignored by git. Workers create issue-scoped
subdirectories such as `output/playwright/VEN-123/` and use an issue-scoped
browser session name such as `symphony-VEN-123`.

Before moving an issue to `Human Review`, browser-visible work must include the
happy path and the meaningful expected failure or error-state scenarios. A short
WebM walkthrough is preferred for successful user-facing flows. Screenshots are
enough for stable states. Traces are preferred for unexpected failures because
they include DOM snapshots, console output, network details, and action timing.

Workers upload the required artifacts to the single active `## Codex Workpad`
comment through the repo-local `vpk-symphony` Linear upload flow. A Playwright
failure caused by the implementation keeps the issue in `In Progress` or
`Rework` while the worker fixes and reruns the scenario. `Human Review` is only
used for a Playwright blocker when the blocker is external, such as missing
browser dependencies, missing credentials, or unavailable required test data.

## Runtime knobs

`WORKFLOW.md` makes the important upstream Elixir runtime controls explicit:

- `polling.interval_ms`: how often Symphony scans Linear for active work.
- `agent.max_concurrent_agents`: total active worker cap.
- `agent.max_concurrent_agents_by_state`: per-state caps. VPK-rovo keeps
  `Merging` at `1` so merge work cannot run in parallel across several issues.
- `agent.max_turns`: how many back-to-back Codex turns one active worker may run
  while the Linear issue remains active.
- `agent.max_retry_backoff_ms`: maximum backoff after failed, stalled, or
  capacity-limited retries.
- `codex.turn_timeout_ms`: maximum wait for Codex turn stream progress before
  treating the turn as timed out.
- `codex.read_timeout_ms`: maximum wait for individual Codex app-server
  request/response handshakes, such as initialize or thread start.
- `codex.stall_timeout_ms`: maximum time since the last Codex activity before
  Symphony stops and retries the issue. Set to `0` to disable stall recovery.
- `observability.refresh_ms` and `observability.render_interval_ms`: terminal
  dashboard refresh/render cadence. They do not enable the Phoenix web dashboard
  by themselves; use `--port` for that.

Upstream also supports remote SSH workers with `worker.ssh_hosts` and
`worker.max_concurrent_agents_per_host`. VPK-rovo leaves those unset because the
current setup runs local workers; adopt them only when we need distributed
capacity.

The workflow also adopts the upstream harness rules that make unattended runs
review-safe:

- Sync with `origin/main` before implementation and again before merge handoff.
- Treat issue-authored `Validation`, `Test Plan`, and `Testing` sections as
  required acceptance input.
- Reproduce or inspect the current behavior before bug or visible UI edits.
- File meaningful out-of-scope improvements as separate Backlog issues instead
  of expanding the current issue.
- Run a PR feedback sweep before `Human Review`: top-level comments, inline
  comments, review summaries, and checks must be resolved or explicitly
  answered.
- Use the blocked-access escape hatch only for missing required tools, auth,
  permissions, or secrets that cannot be resolved in-session.
- Keep progress and handoff notes in the single active workpad comment instead
  of posting separate completion comments.

The local runner also starts `scripts/symphony-merge-guard.js` by default. It
polls for `Done` issues in the configured project whose attached GitHub PR is
still open, and moves them back to `Merging` so a premature terminal transition
does not kill the merge worker. Set `SYMPHONY_MERGE_GUARD=0` to disable it, or
`SYMPHONY_MERGE_GUARD_INTERVAL_MS` to change the guard interval.

## Lifecycle hooks

`WORKFLOW.md` configures the upstream Symphony lifecycle hooks that VPK-rovo
needs locally.

- `after_create`: bootstraps a new issue workspace by cloning the repo, checking
  out or creating `symphony/<issue-id>`, copying `.env.local` when configured,
  and running `pnpm install --frozen-lockfile`.
- `before_remove`: writes a small final workspace snapshot before Symphony
  removes the issue workspace. Snapshots live under
  `$SYMPHONY_WORKSPACE_ROOT/.archive` when the default local workspace layout is
  used.
- `timeout_ms`: applies separately to each hook execution. VPK-rovo sets this
  to `600000` milliseconds because cloning and installing dependencies can take
  longer than upstream Symphony's default.

The upstream runtime also supports `before_run` and `after_run`. VPK-rovo leaves
those unset for now because the worker prompt already performs the run-level
sync, validation, PR feedback, and handoff checks.

## Debugging

The wrapper passes upstream Symphony `--logs-root
.tmp/symphony/runtime/log` by default. Start with the ticket key, then narrow to
the Codex session:

```bash
rg -n "issue_identifier=VEN-123" .tmp/symphony/runtime/log/symphony.log*
rg -o "session_id=[^ ;]+" .tmp/symphony/runtime/log/symphony.log* | sort -u
rg -n "session_id=<thread>-<turn>" .tmp/symphony/runtime/log/symphony.log*
rg -n "Issue stalled|turn_timeout|turn_failed|Codex session failed|Codex session ended with error" .tmp/symphony/runtime/log/symphony.log*
```

Upstream log conventions use `issue_identifier`, `issue_id`, and `session_id`
as the stable join keys for runtime debugging.

## Harness engineering

The Symphony setup treats the repo as the agent harness. `AGENTS.md` defines
the repository map, `WORKFLOW.md` defines the worker loop, and
`scripts/symphony.sh` creates a repeatable workspace before the agent starts.
The goal is to make the app legible, bootable, and verifiable for each worker.

Each issue workspace gets these harness affordances:

- A fresh clone on a predictable `symphony/<issue-id>` branch.
- Dependencies installed with `pnpm install --frozen-lockfile`.
- An optional `.env.local` copy from `SYMPHONY_ENV_LOCAL_SOURCE`.
- A final pre-removal archive note with workspace path, branch, commit, and
  dirty state.
- A persistent Linear `## Codex Workpad` for selected skills, plans, acceptance
  criteria, evidence, validation, decisions, branch, PR, and handoff state.
- Required validation from `AGENTS.md`, plus targeted tests, browser checks,
  screenshots, and accessibility checks for touched surfaces.

When a worker discovers a missing setup step, weak documentation, poor
observability, or a missing regression test, the worker must improve the
harness as part of the issue instead of papering over the gap in a one-off
answer.

Only the upstream `linear` skill is copied into this repo. The upstream
`commit`, `push`, `pull`, and `land` skills are tuned for the `openai/symphony`
repo's own validation commands, so VPK-specific branch, validation, PR, merge,
and phase-skill routing instructions live directly in `WORKFLOW.md`. The
workflow uses Codex's `on-request` approval policy inside the workspace-write
sandbox because the current Codex app-server requirements reject `never`.
