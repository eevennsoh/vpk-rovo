---
name: vpk-git
description: "Use for VPK-rovo git shipping in two cases: PR creation and PR merge-back. PR creation commits current edits, derives a branch name when needed, pushes, and opens a GitHub PR. PR merge-back merges a PR, branch, or worktree into the default branch and syncs local/remote main. Bare `vpk-git` with no flag runs the full ship end-to-end (create PR -> wait for auto-merge -> merge -> sync main) and then stops — it does NOT remove worktrees or delete local branches, because an agent cannot remove the worktree it is running in; that local cleanup is the separate `vpk-clean` skill, run later from the main checkout. Use whenever the user says \"vpk-git\", \"vpk-git --pr\", \"vpk-git --merge\", \"commit and open a PR\", \"ship this branch\", \"merge this PR back to main\", or \"land this worktree\". For \"vpk-git --clean\", \"clean up worktrees/branches\", \"delete the branch after merge\", or \"prune stale refs\", use the `vpk-clean` skill instead."
---

# VPK Git

Use this skill for interactive VPK-rovo git work where the agent must preserve user edits, confirm GitHub state, and avoid deleting unproven work. Do not use it for Symphony issue work that is already inside the `vpk-symphony` landing flow; follow `vpk-symphony/references/git/land.md` for that path.

## Choose One Workflow

This skill ships work. It has two workflows, plus a no-flag default that runs them in sequence:

- **Create PR**: commit current edits, derive a branch name when needed, push, and open a GitHub PR.
- **PR merge back**: publish a PR, branch, or worktree into the default branch and sync local/remote `main`.
- **Full ship sequence** (bare `vpk-git`): run Create PR -> PR Merge Back, then stop at "merged + main synced". Local cleanup is deliberately not part of this — see [Cleanup is a separate skill](#cleanup-is-a-separate-skill).

## Flag-Style Invocation

Treat these prompt forms as explicit routing:

- `vpk-git --pr [<optional title hint>]` -> run **Create PR**.
- `vpk-git --merge <PR number | branch | worktree path>` -> run **PR merge back**. Accepts a comma- or space-separated list (e.g. `--merge 303 304 305`) for batch merge-back; route into the **Batch Merge Back** subsection.
- `vpk-git --clean <...>` -> this is **not** a vpk-git workflow anymore; hand off to the `vpk-clean` skill (kept here only so old muscle memory routes correctly).
- `vpk-git` (no flag) -> run the **Full Ship Sequence**: Create PR -> PR Merge Back against the current branch's work, then stop.

Examples:

```text
[$vpk-git] --pr
[$vpk-git] --pr "Add Hermes status panel"
[$vpk-git] --merge PR #321
[$vpk-git] --merge /path/to/vpk-rovo-worktree
[$vpk-git]
```

If the user asks a descriptive question about the skill ("what does vpk-git do?", "vpk-git help"), explain it — do not run the Full Ship Sequence.

GitHub PR records generally are not deleted. When the user says "delete the PR once merged", interpret that as deleting the merged source branch and cleaning local worktrees/refs — that is the `vpk-clean` skill's job, run after the merge. If they want to abandon an unmerged PR, close it with `gh pr close --delete-branch` only after explicit confirmation.

## Cleanup is a separate skill

Removing landed worktrees, deleting local branches, and pruning stale tracking refs live in the **`vpk-clean`** skill, not here. This split is intentional and physical, not stylistic: VPK background agents (Codex, Claude) almost always run **inside** a `.claude/worktrees/<x>` checkout, and an agent cannot remove the worktree its own shell is sitting in — git refuses, and deleting the directory out from under a running process corrupts the session. Coupling cleanup to every ship therefore left half-done state in the common case and let worktrees pile up.

So `vpk-git` ships and stops; the user (or a later session) runs `vpk-clean` from the main checkout to sweep what has landed. `vpk-clean` discovers landed worktrees on its own by ancestry and merged-PR evidence, so the ship does not need to hand it a list.

## Baseline Inventory

Start every workflow by proving the repo, default branch, and local safety state:

```bash
pwd
git status --short --branch
git worktree list --porcelain
gh repo view --json nameWithOwner,defaultBranchRef
```

If GitHub reads fail because `GITHUB_TOKEN` is invalid while keyring auth is available, retry read-only `gh` commands with `/usr/bin/env -u GITHUB_TOKEN gh ...` before treating GitHub as unavailable.

## Create PR

Trigger: `vpk-git --pr [<optional title hint>]`.

Use when the user wants to commit current edits, push, and open a PR in one command. Assumes the common VPK-rovo case: the user is already inside a feature branch or worktree. The branch name comes from the **diff**, not from whatever branch the agent happened to be on — background-session worktrees often pre-create branches from the agent's initial framing (the bug symptom, a random word pair, a session id), and those names are not allowed to leak into the PR. The skill always self-serves a name; it never asks the user to pick one.

**Detached HEAD is normal here.** VPK-rovo background worktrees (Codex, Claude) commonly detach after PR merges, so "checkout is detached" is the rule, not the exception. Detached HEAD is NEVER a stop condition on its own — step 2 attaches a fresh branch from the diff. Do not bail at step 1 just because HEAD is detached. If you find yourself about to report "blocked because this checkout is detached", you are misreading the skill — go to step 2.

1. Inspect HEAD state:
   - `git rev-parse --abbrev-ref HEAD` (returns `HEAD` when detached — fine, continue)
   - `git status --porcelain=v1 --untracked-files=all`
   - `git log --oneline origin/main..HEAD` (committed work ahead of the default branch)
   - `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` (missing upstream is expected on fresh branches and on detached HEAD — fine, continue)
   - Stop only when there is genuinely nothing to PR: working tree clean **and** no commits ahead of `origin/main` (both `git status --porcelain` and `git log --oneline origin/main..HEAD` are empty). Missing upstream and detached HEAD are NOT stop conditions on their own — they are expected, and steps 2 and 5 handle them.

2. Derive a contextual branch name from the diff, then decide keep / rename / create. **Always compute the contextual name first** — never trust the current branch name without evaluating it against the change content.

   Signal sources, in order of weight:
   - `git diff origin/main...HEAD` (committed work on the branch)
   - `git status --porcelain` plus targeted `git diff` reads of the largest uncommitted files (uncommitted edits)
   - Commit subjects on the branch: `git log --oneline origin/main..HEAD`
   - The optional title hint the user passed to `vpk-git --pr`

   Naming rules: short kebab-case, 3-5 words, verb-noun phrasing that describes **what the change does**. Avoid timestamps, ticket prefixes, path slugs, and generic placeholders (`fix-bug`, `update-code`, `wip`, `patch-1`). Also avoid names that describe the bug *symptom*, the agent session, or the worktree the change was authored in rather than the change itself.

   - Good: `fix-hermes-panel-overflow`, `add-rovo-app-shell`, `auto-derive-pr-branch-name`, `refactor-message-thread`.
   - Bad: `detached-head` (symptom, not fix), `concurrent-conjuring-firefly` (random worktree slug), `claude/session-3` (agent session id), `wip-foo`, `fixes`.

   Then act based on current HEAD:

   - **On a feature branch**: compare current branch name to the derived name. **Rename** with `git branch -m <derived>` when *any* of these are true, **provided no open PR already exists on the branch** (verify with `gh pr list --head <current> --state open`):
     - The current name describes the bug symptom, the worktree, or the agent session rather than what the change does.
     - The current name shares no meaningful vocabulary with the derived name (no overlapping noun or verb).
     - The current name is generic, random word-pair, or placeholder (`wip`, `fix`, `update`, `patch`, agent-assigned slugs like `claude/<adj>-<adj>-<noun>`).
     If an open PR already exists on the current branch, **keep the branch name** — renaming would orphan the PR. Note the name mismatch in the final report so the user can rename next time. If the current name is already a fair match for the diff (shares the key noun/verb and reads as verb-noun), keep it with no rename.
   - **On `main` with changes**: create the branch with `git switch -c <derived>` to carry the working tree across. Never commit to `main`.
   - **On detached HEAD (any state — clean with commits ahead, dirty, or both)**: attach a new branch at the current commit with `git switch -c <derived>`. The signal is the combined diff against the default branch (`git diff origin/main...HEAD` for committed work plus `git status --porcelain` for uncommitted edits). Do **not** create a branch ref pointing at the SHA while leaving HEAD detached. The only acceptable reason to stop here is if both the diff and the uncommitted set are empty — already covered by the step-1 stop check.
   - **No upstream**: push with `-u origin <branch>` in step 5.
   - **Derived name collision**: if `<derived>` already exists locally or on `origin` (and is not the branch you would be renaming onto itself), append a 2-3 char disambiguator from the short SHA of HEAD (e.g. `auto-derive-pr-branch-name-a1b`). Do not ask the user.

3. Check for an existing PR on this branch:
   - `gh pr list --head <branch> --state open --json number,title,url`
   - If one exists, **ask the user once**: push as an update to PR #N, or close it and open a new PR? Wait for the answer before continuing. This is the only interactive prompt in this workflow.

4. Stage and commit:
   - Prefer `git add -A`. If the diff includes paths clearly outside the intended scope (e.g. unrelated experiments, secrets, `.env*`), stage selectively and surface the skipped paths in the report.
   - Generate a concise imperative commit subject (~50 chars) from the diff. If the user passed a title hint, use it verbatim as the subject. Body is optional — include only when changes span multiple concerns.
   - Follow repo commit style observed in `git log` — no `Co-Authored-By` footer unless the user explicitly asks.

5. Push:
   - `git push` (or `git push -u origin <branch>` if no upstream).

6. Open or update the PR:
   - **New PR**: `gh pr create --title <subject> --body <generated body>`. Body uses the `Validation` checklist template from `.agents/rules/appendix-reference.md`, pre-checked only for items actually verified locally.
   - **Updating existing PR** (user approved in step 3): the push already updates it. Run `gh pr view <number> --json url` to capture the URL.

7. Report: PR URL, branch name (and whether it was newly created), commit hash, CI status URL.

Skip local validation. CI runs `pnpm run lint` and `pnpm run typecheck` on every PR — trust that signal. The Full Ship Sequence depends on CI passing before auto-merge; here, surface the status URL so the user can monitor independently.

## Full Ship Sequence

Trigger: bare `vpk-git`, or prompts like "ship this", "land this work end-to-end", "do the whole git flow".

Runs **Create PR -> PR Merge Back** against the current branch's work, fully automated, then stops at "merged + main synced". The agent does not pause between steps unless a Stop Rule fires or step 3 of Create PR needs the existing-PR confirmation. Local cleanup (worktree removal, local branch deletion) is **not** part of this sequence — see [Cleanup is a separate skill](#cleanup-is-a-separate-skill). The merge still deletes the *remote* branch server-side, because that always succeeds regardless of where the agent is running.

1. Run **Create PR**. Capture the PR number and branch name.

2. Queue auto-merge:
   - `gh pr merge <number> --merge --auto --delete-branch`
   - `--auto` lets GitHub merge as soon as required checks pass. If no required checks are configured, the merge is immediate. `--delete-branch` removes the *remote* branch server-side on merge.

3. Poll PR state until merged or blocked:
   - `gh pr view <number> --json state,mergedAt,mergeStateStatus,statusCheckRollup`
   - First poll after ~10s, then every 30s. Hard timeout: 15 minutes.
   - Report progress concisely (e.g. "checks: 2/3 pending"); do not flood the output with every poll.
   - On any failed check, `BLOCKED`/`DIRTY` merge state, or timeout, stop and report. The PR remains open for the user to resolve manually. Do not retry automatically.

4. After merge confirms, sync `main` and decide whether to switch — but never remove a worktree or force a navigation that loses work:
   - **Sync the persistent `main` checkout.** If you are in the main checkout, `git switch main` (only per the rule below) then `git pull --ff-only origin main`. If you are in a secondary worktree, sync out-of-place instead: `git -C <main-checkout> fetch origin && git -C <main-checkout> pull --ff-only origin main`. You cannot check out `main` from a worktree — it is already checked out in the main checkout, and git forbids the same branch in two worktrees.
   - **Switch to `main` + delete the local branch only when both are true:** you are running in the **main checkout** AND the working tree is clean. Then `git switch main` and `git branch -d <branch>` (the local branch is safe to delete once the remote is merged). This is the tidy, expected end state when shipping from the main repo directory.
   - **Otherwise stay put.** In a secondary worktree (switching is impossible) or with uncommitted edits in the tree (switching would drag that work onto `main`), do not switch and do not delete the local branch. Leave navigation to the user.
   - **Never** remove the current worktree, and never delete a local branch you are still standing on. That is `vpk-clean`'s job, run later from the main checkout.

5. Final report: PR URL, merge commit hash, remote branch deleted (server-side), whether you switched to `main` and deleted the local branch (or why you stayed), local `main` sync state, and a one-line deferred-cleanup pointer — e.g. "Worktree `<path>` has landed; run `vpk-clean` from the main checkout later to remove it and prune refs."

Stop and hand back to the user (do not destroy state) if Create PR is blocked, auto-merge cannot be queued, required checks fail, the merge state goes `DIRTY` (conflict needs human resolution), or the poll times out.

## PR Merge Back

1. Identify the target from the user request: PR number, branch, or exact worktree path. If the request names a path, treat that path as the scope anchor before considering nearby worktrees.
2. Inspect the PR or branch:
   - `gh pr view <number> --json number,title,headRefName,baseRefName,mergeStateStatus,reviewDecision,statusCheckRollup,url,mergedAt`
   - For worktrees, inspect branch, upstream, recent commits, and detached state.
3. Choose the safest path:
   - If the persistent `main` checkout has unrelated edits, stash only when needed, with a message naming the merge task, and restore the edits unstaged after sync.
   - Resolve conflicts in the PR branch/worktree, push, then re-check PR status before merging.
   - Use merge commits unless the user explicitly asks for squash or rebase.
4. Validate before final merge:
   - Prefer required GitHub checks when present.
   - If there are no checks, run relevant local validation from `AGENTS.md`, usually `pnpm run lint`, `pnpm run typecheck`, and focused tests for the changed surface.
   - For UI-visible changes, include browser evidence when practical.
5. Merge and sync:
   - Use `gh pr merge <number> --merge --delete-branch` when the PR is ready and branch deletion is safe.
   - Sync local `main` after the remote merge.
   - Verify `git status --short --branch`, `git rev-parse main`, and `git rev-parse origin/main`.

### Batch Merge Back

Triggered by prompts that list more than one target, e.g. `merge PRs 303, 304, 305 back to main` or `vpk-git --merge 303 304 305`.

1. Parse the full list of PR numbers / branches / worktree paths up front. Echo the parsed list to the user before touching anything.
2. Inspect every target once via `gh pr view ... --json mergeStateStatus,reviewDecision,statusCheckRollup,baseRefName,headRefName` and group them:
   - Ready to merge cleanly.
   - Needs rebase / conflict resolution against current `origin/main`.
   - Blocked (failing checks, draft, missing review) — leave for the user.
3. Stash unrelated edits on the persistent `main` checkout **once**, not per PR. Restore unstaged at the end.
4. Merge ready PRs sequentially in the order the user gave (or ascending PR number if unspecified). After each merge:
   - `git fetch origin && git -C <main-checkout> pull --ff-only origin main` so the next PR rebases against the freshly merged tip.
   - If a later PR was "ready" but now conflicts because of a previous merge, surface the conflict and pause — do not auto-resolve across PRs.
5. After the final merge in the batch, run a single sync + verification pass (`git status --short --branch`, `git rev-parse main`, `git rev-parse origin/main`) and report a one-line status per target: merged / skipped (with reason) / failed.
6. Branch deletion uses `--delete-branch` per PR as in the single-target flow. Do not bulk-delete branches outside the merged set in this workflow — that is the `vpk-clean` skill's job.

## Cleanup (moved to `vpk-clean`)

Worktree removal, local branch deletion, stale tracking-ref pruning, and closing abandoned PRs are no longer part of this skill. Use the **`vpk-clean`** skill, run from the main checkout. If a user asks `vpk-git` to clean up, hand off to `vpk-clean` rather than doing it here — see [Cleanup is a separate skill](#cleanup-is-a-separate-skill) for why.

## Stop Rules

Stop and report instead of changing state when:

- The checkout has overlapping uncommitted user edits and no safe stash/restore path.
- Required checks or blocking reviews are failing and the user did not ask you to fix them.
- Merge conflicts touch files you cannot confidently resolve from source evidence.
- GitHub state, default branch, PR ownership, or branch ancestry is ambiguous.
- **Create PR**: working tree is clean **and** no commits ahead of the default branch (nothing to PR), the derived branch name collides with an existing local or remote branch *and* the SHA-disambiguator fallback also collides, or `gh pr create` / `git push` fails for a non-trivial reason (auth, network, protected branch). Detached HEAD is *not* a stop condition — branch handling step 2 derives a name and attaches a branch automatically. A mismatched-but-locked branch name (current branch name is a poor fit for the diff but an open PR already exists on it) is *not* a stop either — keep the branch, finish the PR, and surface the mismatch in the report.
- **Full Ship Sequence**: auto-merge cannot be queued, required checks fail, merge state goes `DIRTY` (conflict needs human resolution), or the merge poll exceeds the 15-minute timeout.

## Output

Keep the final report concise:

- PR created / updated / merged / closed and its URL.
- Branch created (with derived name), renamed (from old → new, with the reason), or reused as-is; push result. If the branch name was a poor fit for the diff but could not be renamed (open PR already attached), surface the mismatch explicitly so the user can rename next time.
- PR merged or deliberately skipped; merge commit or final commit hash when available.
- Validation performed and result (note when validation was deferred to CI).
- Remote branch deleted on merge (server-side); whether you switched to `main` and deleted the local branch, or stayed put (with the reason).
- Local `main` sync state and any uncommitted edits left in place.
- Deferred-cleanup pointer when a worktree/branch has landed: "run `vpk-clean` from the main checkout to remove `<path>` and prune refs."
