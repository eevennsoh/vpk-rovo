# Symphony

VPK-rovo runs the upstream OpenAI Symphony Elixir reference implementation
through `pnpm run symphony`. The local repo owns only the launcher, workflow
template, and repo-specific Codex skill resources. The Elixir runtime itself is pulled
from `openai/symphony` at startup.

Upstream reference: <https://github.com/openai/symphony/blob/main/elixir/README.md>

Repo-owned files:

- `WORKFLOW.md`: VPK workflow template rendered for upstream Symphony.
- `scripts/symphony.sh`: prepares a fresh upstream Elixir checkout, builds
  `./bin/symphony`, renders the workflow, and launches the service.
- `.agents/skills/vpk-symphony/SKILL.md`: repo-local Symphony workflow skill
  covering raw Linear GraphQL, git sync/commit/push/land flow, stuck-run
  debugging, workpad rules, and Playwright CLI browser evidence.

## Configuration

Required:

```bash
LINEAR_API_KEY=<linear-personal-api-key>
SYMPHONY_LINEAR_PROJECT_SLUG=<linear-project-slug>
```

Required local commands:

```bash
mise --version
pnpm --version
```

Optional browser evidence command:

```bash
playwright-cli --version
```

The repo-local `.agents/skills/vpk-symphony/SKILL.md` teaches workers when and
how to use the command; it does not install the command. When `playwright-cli`
is available, UI-visible issues should include the requested screenshot or video
evidence. When it is unavailable, Symphony still starts and workers should skip
browser media capture, record that limitation in the workpad, and continue with
the best non-browser validation available for the issue.

`LINEAR_API_KEY` can live in ignored `.env.local` or the shell environment. Never
commit a real Linear key to `.env.local.example`, docs, issues, or comments. The
project slug comes from the Linear project URL.

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
with `git fetch`, `git checkout --detach FETCH_HEAD`, `git reset --hard`, and a
scoped `git clean -fdx`. This intentionally discards local edits inside the
cached upstream checkout while preserving `elixir/deps`, `elixir/_build`, and
`elixir/bin` so restarts do not re-fetch and recompile Hex dependencies.

If the Elixir cache is already corrupted, remove those preserved directories
from `SYMPHONY_UPSTREAM_DIR/elixir/` once and restart Symphony.

`SYMPHONY_ENV_LOCAL_SOURCE` is optional. When set, the workspace hook copies it
to each issue workspace as `.env.local`. After workspace checkout and optional
env copy, the hook runs `pnpm install` so each Symphony issue workspace starts
with local dependencies available.

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

The wrapper renders `WORKFLOW.md` into `SYMPHONY_RUNTIME_DIR` at startup. After
changing workflow front matter or prompt text, stop and restart Symphony so the
running process uses a fresh rendered workflow.

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
Backlog -> Todo -> In Progress -> Agent Review -> Merging -> Done
```

`WORKFLOW.md` is based on upstream `elixir/WORKFLOW.md` and keeps VPK-specific
customization in the YAML hooks plus the repository contract section.

- `Backlog`: not routed for implementation.
- `Todo`: worker moves the issue to `In Progress`, creates or updates the
  `## Codex Workpad`, then starts.
- `In Progress`: worker continues from the workpad.
- `Agent Review`: worker performs a fresh read-only adversarial code review of
  the linked PR against the issue, workpad, diff, validation proof, evidence,
  comments, and checks. Passing work moves to `Merging`; gaps move back to
  `In Progress`; risk or ambiguity moves to `Human Review`.
- `Human Review`: risk gate for missing proof, product ambiguity,
  security/data concerns, UI judgment, or other human decisions.
- `Merging`: worker follows the `vpk-symphony` landing reference and moves the
  issue to `Done` only after a current-head passing Symphony Agent Review,
  green checks, clean mergeability, and GitHub-reported merge.
- `Done`, `Canceled`, `Duplicate`: terminal.

Symphony PRs should carry the `symphony` label and should not use
`automerge:allowed`; Symphony owns the guarded merge path for this workflow.
GitHub native auto-merge remains disabled because this repo does not rely on
branch-protection-required checks.

Workers keep exactly one active `## Codex Workpad` comment. The workpad should
be concise and current: environment stamp, plan, acceptance criteria,
validation, evidence, decisions, branch, PR, and handoff.

`WORKFLOW.md` also includes compact phase prompts for each Linear state:
`Todo` is kickoff, `In Progress` is implementation, `Agent Review` is fresh
adversarial code review, `Human Review` is a waiting gate, `Merging` is guarded
landing, and terminal states do nothing. These prompts are part of the runtime
worker prompt, not only documentation.

For UI or browser-observable changes, workers use the repo-local `vpk-symphony`
browser evidence reference during `In Progress` when
`playwright-cli` is available. Artifacts are kept under
`output/playwright/<issue-identifier>/` in the issue workspace and only the
required screenshots or short WebM recordings are uploaded to Linear through the
injected `linear_graphql` tool. The uploaded links belong in the single
`## Codex Workpad` comment, not in separate progress comments. A before artifact
is only required when it proves the bug or requested baseline; an after artifact
is expected before moving app-touching work to `Agent Review` when browser media
capture is available. Screenshot uploads should use markdown image syntax
(`![alt text](<asset-url>)`) in the workpad so Linear renders an inline preview.
Uploaded WebM recordings should be placed as standalone asset URLs rather than
hidden behind inline markdown link text, so Linear can render a file/video
preview when supported.

Upstream Symphony re-dispatches an issue when a Codex turn completes while the
issue is still in an active state. For that reason, VPK workers should not end a
normal turn with completed or blocked work still in `In Progress`; they should
write the handoff or blocker into the workpad. Completed implementation work
should move to `Agent Review`; human-risk blockers and answer-only work should
move to `Human Review`.

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
- `agent.max_turns`: `20`, matching the upstream sample so a larger task can
  continue through multiple Codex turns before Symphony returns control to the
  orchestrator.
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

- cloning `SYMPHONY_SOURCE_REPO_URL`,
- checking out or creating `symphony/<issue-id>`,
- copying `.env.local` when `SYMPHONY_ENV_LOCAL_SOURCE` is configured,
- running `pnpm install`.

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
