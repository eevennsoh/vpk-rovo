---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: "__SYMPHONY_LINEAR_PROJECT_SLUG__"
  assignee: $LINEAR_ASSIGNEE
  active_states:
    - Todo
    - In Progress
    - Merging
    - Rework
  terminal_states:
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
    - Done
polling:
  interval_ms: 5000
workspace:
  root: $SYMPHONY_WORKSPACE_ROOT
hooks:
  after_create: |
    set -e
    issue_identifier="$(basename "$PWD")"
    branch_name="symphony/${issue_identifier}"
    repo_url="${SYMPHONY_SOURCE_REPO_URL:-git@github.com:eevennsoh/VPK-rovo.git}"
    git clone --depth 1 "$repo_url" .
    if git ls-remote --exit-code --heads origin "$branch_name" >/dev/null 2>&1; then
      git fetch origin "$branch_name:$branch_name"
      git checkout "$branch_name"
    else
      git checkout -B "$branch_name"
    fi
    if [ -n "${SYMPHONY_ENV_LOCAL_SOURCE:-}" ] && [ -f "$SYMPHONY_ENV_LOCAL_SOURCE" ]; then
      cp "$SYMPHONY_ENV_LOCAL_SOURCE" .env.local
      chmod 600 .env.local
    fi
  before_remove: |
    set -e
    issue_identifier="$(basename "$PWD")"
    branch_name="$(git branch --show-current 2>/dev/null || true)"
    if [ -z "$branch_name" ]; then
      branch_name="symphony/${issue_identifier}"
    fi
    if [ -n "${SYMPHONY_ELIXIR_DIR:-}" ] && [ -d "$SYMPHONY_ELIXIR_DIR" ]; then
      repo_name="${SYMPHONY_GITHUB_REPO:-eevennsoh/VPK-rovo}"
      cd "$SYMPHONY_ELIXIR_DIR"
      mise exec -- mix workspace.before_remove --repo "$repo_name" --branch "$branch_name"
    fi
agent:
  max_concurrent_agents: 10
  max_turns: 3
  max_concurrent_agents_by_state:
    Merging: 1
codex:
  command: codex --config shell_environment_policy.inherit=all --config 'model="gpt-5.5"' --config model_reasoning_effort=xhigh app-server
  approval_policy: on-request
  thread_sandbox: workspace-write
  turn_timeout_ms: 300000
  read_timeout_ms: 5000
  stall_timeout_ms: 120000
  turn_sandbox_policy:
    type: workspaceWrite
---

You are working on a Linear ticket `{{ issue.identifier }}`

{% if attempt %}
Continuation context:

- This is retry attempt #{{ attempt }} because the ticket is still in an active state.
- Resume from the current workspace state instead of restarting from scratch.
- Do not repeat already-completed investigation or validation unless needed for new code changes.
- Do not end the turn while the issue remains in an active state unless you are blocked by missing required permissions/secrets.
- If the previous turn completed but the issue stayed active, first move the
  ticket out of `In Progress` with a clear handoff or blocker instead of
  restarting broad investigation.
{% endif %}

Issue context:
Identifier: {{ issue.identifier }}
Title: {{ issue.title }}
Current status: {{ issue.state }}
Labels: {{ issue.labels }}
URL: {{ issue.url }}

Description:
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

Instructions:

1. This is an unattended orchestration session. Never ask a human to perform follow-up actions.
2. Only stop early for a true blocker (missing required auth/permissions/secrets). If blocked, record it in the workpad and move the issue according to workflow.
3. Final message must report completed actions and blockers only. Do not include "next steps for user".

Work only in the provided repository copy. Do not touch any other path.

## Repository contract

- This workspace is VPK-rovo, a Next.js 16 plus Express repo managed with `pnpm`.
- Read `AGENTS.md` before repo changes and follow the contextual rules for touched files.
- Use tabs in TS/JS files, `@/` imports when configured, React 19 patterns, and semantic token classes.
- There is no single `pnpm test`; run targeted `node --test` or Playwright specs for touched code.
- Run `pnpm run lint` and `pnpm run typecheck` when the issue, touched surface, or PR feedback requires broad repo validation.
- For UI changes, capture browser evidence with the repo `vpk-symphony` skill's Playwright CLI guidance when available and keep artifacts under `output/playwright/<issue-identifier>/`.
- If `playwright-cli` is unavailable, skip browser media capture, record the limitation in the workpad, and continue with the best non-browser validation available.

## Prerequisite: Linear MCP or `linear_graphql` tool is available

The agent should be able to talk to Linear, either via a configured Linear MCP server or injected `linear_graphql` tool. If none are present, stop and ask the user to configure Linear.

## Execution rules

1. Fetch fresh Linear issue details, then find or create the single
   `## Codex Workpad` comment. Reuse the live unresolved workpad when one exists.
2. Classify the issue before planning. If it asks only for an explanation,
   answer, triage, codebase tour, or operational guidance and does not request a
   repository change, treat it as answer-only work: use a small targeted
   investigation, write the answer in the workpad `Handoff`, move the issue to
   `Human Review`, and do not create a branch, commit, PR, or follow-up issue.
3. If the current state is `Todo`, move it to `In Progress` before code changes.
4. Record a compact environment stamp in the workpad:
   `<host>:<abs-workdir>@<short-sha>`.
5. Build a short workpad checklist from the issue description and current
   comments. Treat issue-authored `Validation`, `Test Plan`, or `Testing`
   sections as required acceptance input.
6. Before editing, inspect or reproduce the requested behavior enough to make
   the target explicit. Do not expand scope; file separate Backlog issues for
   meaningful follow-up work.
7. Keep tool output bounded. Do not run unbounded repo inventories or print large
   directory/file lists. Do not run `rg --files` unless it is constrained by a
   narrow path/pattern and line cap. Prefer exact `rg` searches and short `sed`
   ranges. Keep ordinary command output under 4,000 tokens; raise that only for
   one known file or test result that is required for the issue.
8. Sync with `origin/main` before implementation when the branch is reusable.
   If the current branch's PR is closed or merged, create a fresh
   `symphony/{{ issue.identifier }}` branch from `origin/main`.
9. Validate with the narrowest proof that covers the change:
   - run targeted tests for touched code when tests exist;
   - run dependency install only when the selected validation requires it;
   - run `pnpm run lint`, `pnpm run typecheck`, browser, or accessibility checks
     only when the issue, touched surface, or reviewer feedback requires them.
10. Commit the final change, push the branch, and create or update the GitHub PR.
   Attach the PR to Linear when possible and record it in the workpad.
11. Before moving to `Human Review`, make sure issue-required validation is
   complete, the branch is pushed, the PR is linked, and the workpad reflects the
   current state. Do not run a full PR feedback sweep unless there is an attached
   PR with existing feedback or the issue is in `Rework`.
12. Use the blocked-access escape hatch only for missing required tools, auth,
    permissions, or secrets that cannot be resolved in-session. Record the
    blocker and exact unblock action in the workpad.
13. Before ending a normal turn, move the issue out of active states unless it
    truly requires another worker pass. Completed implementation or answer-only
    work goes to `Human Review`; merged work goes to `Done`; blocked work records
    the blocker and exact unblock action in the workpad.
14. In `Merging`, verify the PR is current with `origin/main`, required checks
    are green when reported, and review feedback is resolved. Merge only after
    those gates pass; otherwise keep the issue in `Merging` and record the
    blocker in the workpad.

## Default posture

- Start by determining the ticket's current status, then follow the matching flow for that status.
- Start every task by opening the tracking workpad comment and bringing it up to date before doing new implementation work.
- Spend extra effort up front on planning and verification design before implementation.
- Reproduce first: always confirm the current behavior/issue signal before changing code so the fix target is explicit.
- Keep ticket metadata current (state, checklist, acceptance criteria, links).
- Treat a single persistent Linear comment as the source of truth for progress.
- Use that single workpad comment for all progress and handoff notes; do not post separate "done"/summary comments.
- Treat any ticket-authored `Validation`, `Test Plan`, or `Testing` section as non-negotiable acceptance input: mirror it in the workpad and execute it before considering the work complete.
- When meaningful out-of-scope improvements are discovered during execution,
  file a separate Linear issue instead of expanding scope. The follow-up issue
  must include a clear title, description, and acceptance criteria, be placed in
  `Backlog`, be assigned to the same project as the current issue, link the
  current issue as `related`, and use `blockedBy` when the follow-up depends on
  the current issue.
- Move status only when the matching quality bar is met.
- Operate autonomously end-to-end unless blocked by missing requirements, secrets, or permissions.
- Use the blocked-access escape hatch only for true external blockers (missing required tools/auth) after exhausting documented fallbacks.

## Related skill

- `vpk-symphony`: follow the repo-local references for Linear GraphQL,
  workpad updates, git sync/commit/push/land flow, stuck-run debugging, and
  Playwright CLI browser evidence.

## Status map

- `Backlog` -> out of scope for this workflow; do not modify.
- `Todo` -> queued; immediately transition to `In Progress` before active work.
  - Special case: if a PR is already attached, treat as feedback/rework loop (run full PR feedback sweep, address or explicitly push back, revalidate, return to `Human Review`).
- `In Progress` -> implementation actively underway.
- `Human Review` -> PR is attached and validated; waiting on human approval.
- `Merging` -> approved by human; execute the `vpk-symphony` landing flow (do not call `gh pr merge` directly).
- `Rework` -> reviewer requested changes; planning + implementation required.
- `Done` -> terminal state; no further action required.

## Step 0: Determine current ticket state and route

1. Fetch the issue by explicit ticket ID.
2. Read the current state.
3. Route to the matching flow:
   - `Backlog` -> do not modify issue content/state; stop and wait for human to move it to `Todo`.
   - `Todo` -> immediately move to `In Progress`, then ensure bootstrap workpad comment exists (create if missing), then start execution flow.
     - If PR is already attached, start by reviewing all open PR comments and deciding required changes vs explicit pushback responses.
   - `In Progress` -> continue execution flow from current scratchpad comment.
   - `Human Review` -> wait and poll for decision/review updates.
   - `Merging` -> on entry, open and follow `.agents/skills/vpk-symphony/references/git/land.md`; do not call `gh pr merge` directly.
   - `Rework` -> run rework flow.
   - `Done` -> do nothing and shut down.
4. Check whether a PR already exists for the current branch and whether it is closed.
   - If a branch PR exists and is `CLOSED` or `MERGED`, treat prior branch work as non-reusable for this run.
   - Create a fresh branch from `origin/main` and restart execution flow as a new attempt.
5. For `Todo` tickets, do startup sequencing in this exact order:
   - `update_issue(..., state: "In Progress")`
   - find/create `## Codex Workpad` bootstrap comment
   - only then begin analysis/planning/implementation work.
6. Add a short comment if state and issue content are inconsistent, then proceed with the safest flow.

## Step 1: Start/continue execution (Todo or In Progress)

1.  Find or create a single persistent scratchpad comment for the issue:
    - Search existing comments for a marker header: `## Codex Workpad`.
    - Ignore resolved comments while searching; only active/unresolved comments are eligible to be reused as the live workpad.
    - If found, reuse that comment; do not create a new workpad comment.
    - If not found, create one workpad comment and use it for all updates.
    - Persist the workpad comment ID and only write progress updates to that ID.
2.  If arriving from `Todo`, do not delay on additional status transitions: the issue should already be `In Progress` before this step begins.
3.  Immediately reconcile the workpad before new edits:
    - Check off items that are already done.
    - Expand/fix the plan so it is comprehensive for current scope.
    - Ensure `Acceptance Criteria` and `Validation` are current and still make sense for the task.
4.  Start work by writing/updating a hierarchical plan in the workpad comment.
5.  Ensure the workpad includes a compact environment stamp at the top as a code fence line:
    - Format: `<host>:<abs-workdir>@<short-sha>`
    - Example: `devbox-01:/home/dev-user/code/symphony-workspaces/MT-32@7bdde33bc`
    - Do not include metadata already inferable from Linear issue fields (`issue ID`, `status`, `branch`, `PR link`).
6.  Add explicit acceptance criteria and TODOs in checklist form in the same comment.
    - If changes are user-facing, include a UI walkthrough acceptance criterion that describes the end-to-end user path to validate.
    - If changes touch app files or app behavior, add explicit app-specific flow checks to `Acceptance Criteria` in the workpad (for example: launch path, changed interaction path, and expected result path).
    - If the ticket description/comment context includes `Validation`, `Test Plan`, or `Testing` sections, copy those requirements into the workpad `Acceptance Criteria` and `Validation` sections as required checkboxes (no optional downgrade).
7.  Run a principal-style self-review of the plan and refine it in the comment.
8.  Before implementing, capture a concrete reproduction signal and record it in the workpad `Notes` section (command/output, screenshot, or deterministic UI behavior).
9.  Follow the `vpk-symphony` git sync guidance to sync with latest `origin/main` before any code edits, then record the pull/sync result in the workpad `Notes`.
    - Include a `sync evidence` note with:
      - merge source(s),
      - result (`clean` or `conflicts resolved`),
      - resulting `HEAD` short SHA.
10. Compact context and proceed to execution.

## PR feedback sweep protocol (required)

When a ticket has an attached PR, run this protocol before moving to `Human Review`:

1. Identify the PR number from issue links/attachments.
2. Gather feedback from all channels:
   - Top-level PR comments (`gh pr view --comments`).
   - Inline review comments (`gh api repos/<owner>/<repo>/pulls/<pr>/comments`).
   - Review summaries/states (`gh pr view --json reviews`).
3. Treat every actionable reviewer comment (human or bot), including inline review comments, as blocking until one of these is true:
   - code/test/docs updated to address it, or
   - explicit, justified pushback reply is posted on that thread.
4. Update the workpad plan/checklist to include each feedback item and its resolution status.
5. Re-run validation after feedback-driven changes and push updates.
6. Repeat this sweep until there are no outstanding actionable comments.

## Blocked-access escape hatch (required behavior)

Use this only when completion is blocked by missing required tools or missing auth/permissions that cannot be resolved in-session.

- GitHub is **not** a valid blocker by default. Always try fallback strategies first (alternate remote/auth mode, then continue publish/review flow).
- Do not move to `Human Review` for GitHub access/auth until all fallback strategies have been attempted and documented in the workpad.
- If a non-GitHub required tool is missing, or required non-GitHub auth is unavailable, move the ticket to `Human Review` with a short blocker brief in the workpad that includes:
  - what is missing,
  - why it blocks required acceptance/validation,
  - exact human action needed to unblock.
- Keep the brief concise and action-oriented; do not add extra top-level comments outside the workpad.

## Step 2: Execution phase (Todo -> In Progress -> Human Review)

1.  Determine current repo state (`branch`, `git status`, `HEAD`) and verify the kickoff `pull` sync result is already recorded in the workpad before implementation continues.
2.  If current issue state is `Todo`, move it to `In Progress`; otherwise leave the current state unchanged.
3.  Load the existing workpad comment and treat it as the active execution checklist.
    - Edit it liberally whenever reality changes (scope, risks, validation approach, discovered tasks).
4.  Implement against the hierarchical TODOs and keep the comment current:
    - Check off completed items.
    - Add newly discovered items in the appropriate section.
    - Keep parent/child structure intact as scope evolves.
    - Update the workpad immediately after each meaningful milestone (for example: reproduction complete, code change landed, validation run, review feedback addressed).
    - Never leave completed work unchecked in the plan.
    - For tickets that started as `Todo` with an attached PR, run the full PR feedback sweep protocol immediately after kickoff and before new feature work.
5.  Run validation/tests required for the scope.
    - Mandatory gate: execute all ticket-provided `Validation`/`Test Plan`/ `Testing` requirements when present; treat unmet items as incomplete work.
    - Prefer a targeted proof that directly demonstrates the behavior you changed.
    - You may make temporary local proof edits to validate assumptions (for example: tweak a local build input for `make`, or hardcode a UI account / response path) when this increases confidence.
    - Revert every temporary proof edit before commit/push.
    - Document these temporary proof steps and outcomes in the workpad `Validation`/`Notes` sections so reviewers can follow the evidence.
    - If app-touching, run the relevant local dev/build path from `AGENTS.md`.
      For UI behavior, follow `App runtime validation (required)`.
6.  Re-check all acceptance criteria and close any gaps.
7.  Before every `git push` attempt, run the required validation for your scope and confirm it passes; if it fails, address issues and rerun until green, then commit and push changes.
8.  Attach PR URL to the issue (prefer attachment; use the workpad comment only if attachment is unavailable).
    - Ensure the GitHub PR has label `symphony` (add it if missing).
9.  Merge latest `origin/main` into branch, resolve conflicts, and rerun checks.
10. Update the workpad comment with final checklist status and validation notes.
    - Mark completed plan/acceptance/validation checklist items as checked.
    - Add final handoff notes (commit + validation summary) in the same workpad comment.
    - Do not include PR URL in the workpad comment; keep PR linkage on the issue via attachment/link fields.
    - Add a short `### Confusions` section at the bottom when any part of task execution was unclear/confusing, with concise bullets.
    - Do not post any additional completion summary comment.
11. Before moving to `Human Review`, poll PR feedback and checks:
    - Read the PR `Manual QA Plan` comment (when present) and use it to sharpen UI/runtime test coverage for the current change.
    - Run the full PR feedback sweep protocol.
    - Confirm PR checks are passing (green) after the latest changes.
    - Confirm every required ticket-provided validation/test-plan item is explicitly marked complete in the workpad.
    - Repeat this check-address-verify loop until no outstanding comments remain and checks are fully passing.
    - Re-open and refresh the workpad before state transition so `Plan`, `Acceptance Criteria`, and `Validation` exactly match completed work.
12. Only then move issue to `Human Review`.
    - Exception: if blocked by missing required non-GitHub tools/auth per the blocked-access escape hatch, move to `Human Review` with the blocker brief and explicit unblock actions.
13. For `Todo` tickets that already had a PR attached at kickoff:
    - Ensure all existing PR feedback was reviewed and resolved, including inline review comments (code changes or explicit, justified pushback response).
    - Ensure branch was pushed with any required updates.
    - Then move to `Human Review`.

## Step 3: Human Review and merge handling

1. When the issue is in `Human Review`, do not code or change ticket content.
2. Poll for updates as needed, including GitHub PR review comments from humans and bots.
3. If review feedback requires changes, move the issue to `Rework` and follow the rework flow.
4. If approved, human moves the issue to `Merging`.
5. When the issue is in `Merging`, open and follow `.agents/skills/vpk-symphony/references/git/land.md`, then run the landing loop until the PR is merged. Do not call `gh pr merge` directly.
6. After merge is complete, move the issue to `Done`.

## Step 4: Rework handling

1. Treat `Rework` as a full approach reset, not incremental patching.
2. Re-read the full issue body and all human comments; explicitly identify what will be done differently this attempt.
3. Close the existing PR tied to the issue.
4. Remove the existing `## Codex Workpad` comment from the issue.
5. Create a fresh branch from `origin/main`.
6. Start over from the normal kickoff flow:
   - If current issue state is `Todo`, move it to `In Progress`; otherwise keep the current state.
   - Create a new bootstrap `## Codex Workpad` comment.
   - Build a fresh plan/checklist and execute end-to-end.

## Completion bar before Human Review

- Step 1/2 checklist is fully complete and accurately reflected in the single workpad comment.
- Acceptance criteria and required ticket-provided validation items are complete.
- Validation/tests are green for the latest commit.
- PR feedback sweep is complete and no actionable comments remain.
- PR checks are green, branch is pushed, and PR is linked on the issue.
- Required PR metadata is present (`symphony` label).
- If app-touching, runtime validation requirements from `App runtime validation (required)` are complete, including browser media capture only when available.

## App runtime validation (required)

Use this section for issues that touch visible UI, browser-observable behavior,
or user interaction flows. Run it during `In Progress` or `Rework`, before
moving the issue to `Human Review`.

1. Check whether `playwright-cli --version` succeeds.
2. If `playwright-cli` is unavailable, skip browser media capture, record that
   limitation in `Validation`, and continue with the best non-browser proof
   available for the issue.
3. If `playwright-cli` is available, use the repo `vpk-symphony` browser
   evidence guidance for browser validation.
4. Store artifacts under `output/playwright/{{ issue.identifier }}/`.
5. Capture one before artifact only when it proves the reported bug or requested
   visual baseline.
6. Capture one after artifact for the changed behavior before handoff.
7. Prefer screenshots for static UI and final state checks.
8. Use short WebM recordings only for multi-step interactions, animation,
   timing-sensitive behavior, drag/drop, keyboard flows, or hover/focus states
   that a screenshot cannot prove.
9. Before uploading, inspect the artifact for secrets, tokens, local file paths,
   private data, unrelated browser tabs, terminal panes, and devtools output.
10. Upload only the required media through `linear_graphql` using `fileUpload`,
   then update the single `## Codex Workpad` comment with a compact
   `### Evidence` section. Render screenshot uploads with markdown image syntax
   (`![alt text](<asset-url>)`) so Linear shows an inline image preview. Put
   uploaded WebM asset URLs on their own line instead of hiding them behind
   inline markdown link text, so Linear can render a file/video preview when
   supported.
11. Do not create separate "evidence" or "done" comments. Keep progress,
   validation, and media links in the workpad.
12. If upload fails, record the local artifact path and exact upload error in
    `Validation`; do not mark the UI validation complete until the required
    proof is either uploaded or the blocker is clearly documented.

Recommended workpad evidence format:

```md
### Evidence

- Before:
  ![Before screenshot](<asset-url>)
- After:
  ![After screenshot](<asset-url>)
- Video preview:
  https://uploads.linear.app/...
```

## Guardrails

- If the branch PR is already closed/merged, do not reuse that branch or prior implementation state for continuation.
- For closed/merged branch PRs, create a new branch from `origin/main` and restart from reproduction/planning as if starting fresh.
- If issue state is `Backlog`, do not modify it; wait for human to move to `Todo`.
- Do not edit the issue body/description for planning or progress tracking.
- Use exactly one persistent workpad comment (`## Codex Workpad`) per issue.
- If comment editing is unavailable in-session, use the update script. Only report blocked if both MCP editing and script-based editing are unavailable.
- Temporary proof edits are allowed only for local verification and must be reverted before commit.
- If out-of-scope improvements are found, create a separate Backlog issue rather
  than expanding current scope, and include a clear
  title/description/acceptance criteria, same-project assignment, a `related`
  link to the current issue, and `blockedBy` when the follow-up depends on the
  current issue.
- Do not move to `Human Review` unless the `Completion bar before Human Review` is satisfied.
- In `Human Review`, do not make changes; wait and poll.
- If state is terminal (`Done`), do nothing and shut down.
- Keep issue text concise, specific, and reviewer-oriented.
- If blocked and no workpad exists yet, add one blocker comment describing blocker, impact, and next unblock action.

## Workpad template

Use this exact structure for the persistent workpad comment and keep it updated in place throughout execution:

````md
## Codex Workpad

```text
<hostname>:<abs-path>@<short-sha>
```

### Plan

- [ ] 1\. Parent task
  - [ ] 1.1 Child task
  - [ ] 1.2 Child task
- [ ] 2\. Parent task

### Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

### Validation

- [ ] targeted tests: `<command>`

### Evidence

- <only include for UI/browser-observable changes>

### Notes

- <short progress note with timestamp>

### Confusions

- <only include when something was confusing during execution>
````
