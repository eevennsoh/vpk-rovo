---
name: vpk-git
description: "Use for VPK-rovo git work in exactly two cases: PR merge-back and cleanup. PR merge-back covers ad hoc requests to merge a PR, branch, or worktree back to local/remote main while preserving unrelated edits and syncing final state. Cleanup covers deleting merged PR source branches, closing explicitly abandoned PRs, pruning stale refs, and safely removing clean landed worktrees/branches. Use it whenever the user says \"merge this PR back to main\", \"land this worktree\", \"delete the branch after merge\", \"delete/close this PR\", \"clean up VPK worktrees/branches\", \"vpk-git --merge\", or \"vpk-git --clean.\""
---

# VPK Git

Use this skill for interactive VPK-rovo git work where the agent must preserve user edits, confirm GitHub state, and avoid deleting unproven work. Do not use it for Symphony issue work that is already inside the `vpk-symphony` landing flow; follow `vpk-symphony/references/git/land.md` for that path.

## Choose One Workflow

This skill has only two workflows:

- **PR merge back**: publish a PR, branch, or worktree into the default branch and sync local/remote `main`.
- **Clean up**: delete merged PR source branches, close explicitly abandoned PRs, prune stale refs, and remove only clean landed worktrees/branches.

## Flag-Style Invocation

Treat these prompt forms as explicit routing:

- `vpk-git --merge <PR number | branch | worktree path>` -> run **PR merge back**. Accepts a comma- or space-separated list (e.g. `--merge 303 304 305`) for batch merge-back; route into the **Batch Merge Back** subsection.
- `vpk-git --clean <PR number | branch | worktree path | scope>` -> run **Clean up**.

Examples:

```text
[$vpk-git] --merge PR #321
[$vpk-git] --merge /path/to/vpk-rovo-worktree
[$vpk-git] --clean PR #321
[$vpk-git] --clean stale merged worktrees and branches
```

GitHub PR records generally are not deleted. When the user says "delete the PR once merged", interpret that as deleting the merged source branch and cleaning local worktrees/refs. If they want to abandon an unmerged PR, close it with `gh pr close --delete-branch` only after explicit confirmation.

## Baseline Inventory

Start both workflows by proving the repo, default branch, and local safety state:

```bash
pwd
git status --short --branch
git worktree list --porcelain
gh repo view --json nameWithOwner,defaultBranchRef
```

If GitHub reads fail because `GITHUB_TOKEN` is invalid while keyring auth is available, retry read-only `gh` commands with `/usr/bin/env -u GITHUB_TOKEN gh ...` before treating GitHub as unavailable.

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
6. Branch deletion uses `--delete-branch` per PR as in the single-target flow. Do not bulk-delete branches outside the merged set in this workflow — that is the **Clean Up** workflow's job.

## Clean Up

This workflow is self-contained. Run it interactively and only on the user-approved scope. The safety principle is simple: cleanup is allowed only when commands prove the committed work has landed, the target is not current/default, there are no uncommitted or untracked files, and no live process owns the path.

### Cleanup Inventory

Start with a source-of-truth inventory:

```bash
git status --short --branch
git branch -v
git worktree list --porcelain
git remote show origin
git symbolic-ref refs/remotes/origin/HEAD
gh auth status
gh pr list --state all --json number,title,headRefName,headRefOid,isDraft,state,mergedAt
gh api repos/:owner/:repo --jq '{full_name,delete_branch_on_merge,default_branch,private}'
```

If `gh auth status` or another `gh` command fails because `GITHUB_TOKEN` is invalid while keyring accounts are available, retry GitHub read commands as `/usr/bin/env -u GITHUB_TOKEN gh ...` before declaring GitHub evidence unavailable. Use the same prefix for later `gh pr list`, `gh pr view`, or `gh api` checks in that run.

The repository `delete_branch_on_merge` setting explains whether future merged PR branches should disappear automatically. It is not a blocker for deleting already-proven stale branches; report it separately.

For a merged PR whose source branch remains:

1. Confirm the PR is merged and capture `headRefName`, `headRefOid`, and `baseRefName`.
2. Confirm no open PR still uses the branch.
3. Delete the remote branch with `git push origin --delete <branch>` or `gh pr merge --delete-branch` if the merge is still being performed.
4. If `origin/<branch>` remains locally after remote deletion, prove `git ls-remote --heads origin <branch>` returns no ref, then delete the tracking ref with `git update-ref -d refs/remotes/origin/<branch>`.
5. Delete the local branch with `git branch -d <branch>` only when it is merged and no worktree uses it.

For an abandoned unmerged PR:

- Do not close it from an ambiguous prompt. Confirm the user wants to abandon the PR.
- Use `gh pr close <number> --delete-branch` only after checking for unpushed commits, open dependent PRs, active worktrees, and user edits.

For worktree and branch cleanup:

1. Inventory candidates:
   - `git branch -v`
   - `git worktree list --porcelain`
   - `git remote show origin`
   - `gh pr list --state all --json number,title,headRefName,headRefOid,isDraft,state,mergedAt`
2. For each candidate, verify:
   - It is not current/default.
   - `git -C <worktree> status --porcelain=v1 --untracked-files=all` is empty.
   - Its branch or detached HEAD is proven landed by ancestry, merged PR evidence, or patch-equivalence fallback.
   - No process owns the exact path: `lsof +D <worktree>`.
3. Remove only safe items:
   - Use plain `git worktree remove <path>` for registered, clean, landed, process-safe worktrees.
   - Use `git worktree prune --verbose` only for stale admin metadata after the path is already gone.
   - Use `git branch -d <branch>` only for merged local branches unused by any worktree.
   - Use `git push origin --delete <branch>` only for merged remote branches with no open PR.

### Candidate Verification

For each cleanup candidate, verify working-tree status, current/default status, ancestry to default, merged PR evidence when ancestry is not enough, remote state, and process ownership:

```bash
git -C <worktree> status --short --branch --untracked-files=all
git -C <worktree> status --porcelain=v1 --untracked-files=all
git merge-base --is-ancestor <candidate> <default>
git cherry -v <default> <candidate>
lsof +D <worktree>
```

Use `git cherry -v` only as a fallback when ancestry is not enough and merged PR evidence is missing. Patch-equivalent commits can be reported as candidates, but destructive cleanup still needs the working tree to be clean and the user-approved scope to include that target.

### Dirty Or Untracked Hard Stop

If `git -C <worktree> status --porcelain=v1 --untracked-files=all` prints anything, that worktree is not eligible for removal. Record the exact worktree path, branch or detached HEAD, and dirty/untracked file list, then leave it alone.

Do not use `git worktree remove --force`, `git reset`, `git restore`, `git clean`, `git stash`, `rm -rf`, or any equivalent workaround to preserve or remove a dirty worktree. Do not kill processes for a dirty or untracked worktree because the target is already ineligible.

### Worktree Removal

Use plain `git worktree remove <path>` only for registered worktrees that are:

- non-current;
- non-default;
- clean by porcelain status;
- process-safe;
- proven landed by ancestry, merged PR evidence, or patch-equivalence fallback.

Do not use `git worktree remove --force` for an existing worktree path. If plain removal fails because Git says force is required, skip the target and report the exact reason.

If the worktree path is already gone but `git worktree list --porcelain` still reports stale admin metadata, run `git worktree prune --verbose` and re-check. This is metadata cleanup, not filesystem deletion. Preserve unregistered directories, paths whose Git admin metadata is missing, and any worktree whose status/HEAD/branch cannot be inspected.

### Local And Remote Ref Cleanup

Delete local branches with `git branch -d <branch>` only when ancestry proves they are merged and no registered worktree still uses them. Do not use `git branch -D`; report squash-merged or PR-merged local branches that require force deletion instead of deleting them.

Delete remote branches with `git push origin --delete <branch>` only when GitHub shows the branch PR was merged or ancestry proves the remote branch is already in the default branch, and no open PR uses that branch.

If a remote branch was deleted but the local `origin/<branch>` tracking ref remains, first prove `git ls-remote --heads origin <branch>` returns no ref, then delete the stale local tracking ref:

```bash
git update-ref -d refs/remotes/origin/<branch>
```

### Process Handling

For an otherwise eligible clean merged worktree with exact-path live processes:

1. Record PID, PPID, command, and cwd.
2. Send SIGTERM only to PIDs owning that exact path.
3. Recheck `lsof +D <worktree>`.
4. Send SIGKILL only to the same PID if it still owns the path.

Do not kill processes for current, default, dirty, untracked, unmerged, unregistered, or ambiguous worktrees.

### Cleanup Validation

After cleanup, run:

```bash
git status --short --branch
git worktree list --porcelain
git worktree prune --dry-run --verbose
git branch -v
git branch -r -v
git ls-remote --heads origin <deleted-branch>
```

Report unexpected tracked deletions, dirty state, stale admin metadata, stale local tracking refs, or sync blockers.

## Stop Rules

Stop and report instead of changing state when:

- The checkout has overlapping uncommitted user edits and no safe stash/restore path.
- Required checks or blocking reviews are failing and the user did not ask you to fix them.
- Merge conflicts touch files you cannot confidently resolve from source evidence.
- A cleanup candidate has any uncommitted or untracked file.
- A local branch would require `git branch -D`.
- A worktree removal would require `--force`.
- GitHub state, default branch, PR ownership, or branch ancestry is ambiguous.

## Output

Keep the final report concise:

- PR/branch/worktree merged, closed, deleted, removed, or deliberately skipped.
- Merge commit or final commit hash when available.
- Validation performed and result.
- Branches deleted locally/remotely and tracking refs pruned.
- Worktrees removed or left alone, with reasons.
- Final local checkout state and any restored uncommitted edits.
