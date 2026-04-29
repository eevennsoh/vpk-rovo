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
- `.agents/skills/linear/SKILL.md`: guidance for the raw `linear_graphql` tool
  that upstream Symphony injects into Codex app-server sessions.

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
SYMPHONY_DIR=.tmp/symphony/openai-symphony
SYMPHONY_RUNTIME_DIR=.tmp/symphony/runtime
```

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

## Workflow

Recommended Linear flow for this repo:

```text
Backlog -> Todo -> In Progress -> Human Review -> Rework -> Human Review -> Merging -> Done
```

`WORKFLOW.md` encodes the worker behavior:

- `Todo`: move to `In Progress`, create or update the `## Codex Workpad`, and
  start work.
- `In Progress`: continue implementation from the workpad.
- `Rework`: inspect reviewer comments and PR feedback, fix the requested
  changes, and return to `Human Review` only after validation.
- `Human Review`: wait for a human decision; do not start new implementation.
- `Merging`: land the already-reviewed PR, sync with `origin/main`, and move
  the Linear issue to `Done` only after the merge succeeds.
- `Done`, `Closed`, `Canceled`, `Cancelled`, `Duplicate`: terminal states.

Workers should keep one active `## Codex Workpad` comment current with plan,
acceptance criteria, validation, decisions, blockers, branch, PR, and final
handoff notes.

Only the upstream `linear` skill is copied into this repo. The upstream
`commit`, `push`, `pull`, and `land` skills are tuned for the `openai/symphony`
repo's own validation commands, so VPK-specific branch, validation, PR, and
merge instructions live directly in `WORKFLOW.md`.
