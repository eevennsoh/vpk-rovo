---
name: vpk-clean
description: "Use for VPK-rovo git housekeeping: removing landed worktrees, deleting merged PR source branches, pruning stale tracking refs, and closing explicitly abandoned PRs. This is the deferred cleanup step that `vpk-git` intentionally does NOT run during a ship, because an agent cannot remove the worktree it is standing in — so cleanup is a separate, later sweep run from the main checkout. Use whenever the user says \"vpk-clean\", \"vpk-git --clean\", \"clean up worktrees\", \"clean up branches\", \"remove merged worktrees\", \"delete the branch after merge\", \"prune stale refs\", \"tidy worktrees\", \"sweep landed worktrees\", \"my worktrees are piling up\", \"remove this worktree\", or after a `vpk-git` ship reported a worktree was left active for follow-up removal. Run it from the main checkout, not from inside a worktree you want removed."
---

# VPK Clean

Repo-local git housekeeping for VPK-rovo. This skill removes only work that commands **prove** has already landed, and never touches anything still in flight. It is self-contained and interactive: run it on the user-approved scope, surface evidence before destroying state, and leave anything ambiguous alone.

Do not use this for Symphony issue work inside the `vpk-symphony` landing flow; follow `vpk-symphony/references/git/land.md` there.

## Why this is separate from `vpk-git`

`vpk-git` ships work: it creates a PR, waits for CI, merges (deleting the remote branch server-side), and syncs `main`. It deliberately stops there. The reason is physical, not stylistic: VPK background agents (Codex, Claude) almost always run **inside** a `.claude/worktrees/<x>` checkout, and **an agent cannot remove the worktree its own shell is sitting in** — git refuses, and deleting the directory out from under a running process corrupts the session. So per-ship cleanup could never finish in the common case, and half-done cleanup is worse than none.

Decoupling means the ship is predictable and side-effect-light, and the *local* tidying — worktree removal, local branch deletion, tracking-ref pruning — happens here, later, run from the **main checkout** where it can actually complete. This sweep discovers landed worktrees on its own (by ancestry and merged-PR evidence), so it does not need a hand-off list from the ship.

**Run from the main checkout.** If the user invokes this from inside a worktree, you can still clean *other* targets, but you cannot remove the current one — say so and point them to run it from the main repo directory.

## Scope

Accepts a PR number, branch, worktree path, or a descriptive scope ("stale merged worktrees and branches"). With no explicit target, inventory everything and propose the proven-landed candidates for the user to approve before removing. The safety principle is simple: cleanup is allowed only when commands prove the committed work has landed, the target is not current/default, there are no uncommitted or untracked files, and no live process owns the path.

GitHub PR records are not deleted. When the user says "delete the PR once merged", interpret that as deleting the merged source branch and cleaning local worktrees/refs. To abandon an *unmerged* PR, close it with `gh pr close --delete-branch` only after explicit confirmation.

## Cleanup Inventory

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

## Candidate Verification

For each cleanup candidate, verify working-tree status, current/default status, ancestry to default, merged PR evidence when ancestry is not enough, remote state, and process ownership:

```bash
git -C <worktree> status --short --branch --untracked-files=all
git -C <worktree> status --porcelain=v1 --untracked-files=all
git merge-base --is-ancestor <candidate> <default>
git cherry -v <default> <candidate>
lsof +D <worktree>
```

Use `git cherry -v` only as a fallback when ancestry is not enough and merged PR evidence is missing. Patch-equivalent commits can be reported as candidates, but destructive cleanup still needs the working tree to be clean and the user-approved scope to include that target.

## Dirty Or Untracked Hard Stop

If `git -C <worktree> status --porcelain=v1 --untracked-files=all` prints anything, that worktree is not eligible for removal. Record the exact worktree path, branch or detached HEAD, and dirty/untracked file list, then leave it alone.

Do not use `git worktree remove --force`, `git reset`, `git restore`, `git clean`, `git stash`, `rm -rf`, or any equivalent workaround to preserve or remove a dirty worktree. Do not kill processes for a dirty or untracked worktree because the target is already ineligible.

## Worktree Removal

Use plain `git worktree remove <path>` only for registered worktrees that are:

- non-current;
- non-default;
- clean by porcelain status;
- process-safe;
- proven landed by ancestry, merged PR evidence, or patch-equivalence fallback.

Do not use `git worktree remove --force` for an existing worktree path. If plain removal fails because Git says force is required, skip the target and report the exact reason.

If the worktree path is already gone but `git worktree list --porcelain` still reports stale admin metadata, run `git worktree prune --verbose` and re-check. This is metadata cleanup, not filesystem deletion. Preserve unregistered directories, paths whose Git admin metadata is missing, and any worktree whose status/HEAD/branch cannot be inspected.

## Local And Remote Ref Cleanup

Delete local branches with `git branch -d <branch>` only when ancestry proves they are merged and no registered worktree still uses them. Do not use `git branch -D`; report squash-merged or PR-merged local branches that require force deletion instead of deleting them.

Delete remote branches with `git push origin --delete <branch>` only when GitHub shows the branch PR was merged or ancestry proves the remote branch is already in the default branch, and no open PR uses that branch.

If a remote branch was deleted but the local `origin/<branch>` tracking ref remains, first prove `git ls-remote --heads origin <branch>` returns no ref, then delete the stale local tracking ref:

```bash
git update-ref -d refs/remotes/origin/<branch>
```

## Process Handling

For an otherwise eligible clean merged worktree with exact-path live processes:

1. Record PID, PPID, command, and cwd.
2. Send SIGTERM only to PIDs owning that exact path.
3. Recheck `lsof +D <worktree>`.
4. Send SIGKILL only to the same PID if it still owns the path.

Do not kill processes for current, default, dirty, untracked, unmerged, unregistered, or ambiguous worktrees.

## Cleanup Validation

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

- A cleanup candidate has any uncommitted or untracked file.
- A local branch would require `git branch -D` (squash-merged / not fast-forward-merged) — report it for the user to force-delete deliberately, do not force it yourself.
- A worktree removal would require `--force`.
- The target is the current worktree (you are inside it) — clean other targets, and tell the user to re-run from the main checkout to remove this one.
- GitHub state, default branch, PR ownership, or branch ancestry is ambiguous.

## Output

Keep the final report concise:

- Worktrees removed or left alone, with the reason for each (dirty, current, not proven landed, process-owned, ambiguous).
- Local branches deleted, and any reported for manual force-deletion.
- Remote branches deleted and stale tracking refs pruned.
- PRs closed (only abandoned ones the user confirmed), with URLs.
- Final inventory state and any sync blockers.
