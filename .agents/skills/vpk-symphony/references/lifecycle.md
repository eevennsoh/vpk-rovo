# Symphony Lifecycle

Use this reference when executing or updating the VPK-rovo Symphony workflow.

## States

- `Backlog`: not routed for implementation.
- `Todo`: move to `In Progress`, create or update the workpad, then start.
- `In Progress`: continue from the current workpad.
- `Human Review`: wait for human action.
- `Rework`: address reviewer feedback, validate, and return to `Human Review`.
- `Merging`: follow `references/git/land.md`; move to `Done` only after GitHub
  reports the PR merged.
- `Done`, `Closed`, `Canceled`, `Cancelled`, `Duplicate`: terminal.

## Execution Rules

1. Fetch fresh Linear issue details before planning.
2. Reuse the active `## Codex Workpad` comment if it exists.
3. Classify answer-only issues before creating branches or PRs.
4. Keep project-specific context in issue descriptions and comments, not in the
   shared workflow files.
5. Do not advance dependent work until the previous PR is actually merged to the
   default branch.
6. If an issue becomes terminal while a run is active, stop implementation work
   and let cleanup/landing logic respect the terminal state.

## Merging Rule

`Merging` is a merge-only state. Verify the attached PR, review state, branch
divergence, and GitHub merge result before making additional code changes.
