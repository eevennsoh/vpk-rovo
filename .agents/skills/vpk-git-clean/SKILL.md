---
name: vpk-git-clean
description: "Remove only proven-landed VPK worktrees and branches, prune stale refs, and close explicitly abandoned PRs. Use when the user says \"vpk-git-clean\", \"clean up worktrees\", \"clean up branches\", \"remove merged worktrees\", \"prune stale refs\", or \"worktrees are piling up\"."
validation_command: git status --short
---

# VPK Git Clean

Use this skill for deferred VPK housekeeping after work has landed. It
removes only targets whose committed work, clean state, PR state, and process
ownership are proven safe; ambiguous or active targets remain untouched.

## When to use

Accept a PR number, branch, worktree path, or a broad landed-work scope. With no
target, inventory all candidates and obtain approval for the proven-safe set.
Run from the persistent main checkout, not from a worktree being removed. If the
current session is inside one candidate, clean other eligible targets and report
that the current one needs a later run from main.

Do not use this to ship changes (`vpk-git-ship`), force-remove abandoned local
work, or clean Symphony issue state managed by `vpk-symphony`.

## Hard invariants

- Prove landing before deletion using ancestry, merged-PR evidence, or the
  patch-equivalence fallback in [evidence.md](references/evidence.md).
- Any uncommitted or untracked file makes a worktree ineligible. Treat it as
  user work, regardless of whether the branch itself merged.
- Never touch the current/default worktree, an open-PR head, an ambiguous path,
  or a worktree whose process ownership cannot be established.
- Use plain `git worktree remove` and `git branch -d`; if either requires force,
  stop and report it. Do not reset, restore, clean, stash, fake ancestry, create
  commits, or use raw filesystem deletion to make a candidate removable.
- Stop only exact-path processes for a candidate that already passed every
  other removal check. Never use global `tmux kill-server` or `portless prune`.

GitHub PR records are not deleted. "Delete the PR after merge" means delete its
merged source branch and local worktree/refs. Close an unmerged PR with
`gh pr close --delete-branch` only after explicit abandonment confirmation.

## Inventory

```bash
git status --short --branch
git branch -v
git worktree list --porcelain
git remote show origin
git symbolic-ref refs/remotes/origin/HEAD
gh auth status
gh pr list --state all \
  --json number,title,headRefName,headRefOid,baseRefName,isDraft,state,mergedAt
gh api repos/:owner/:repo \
  --jq '{full_name,delete_branch_on_merge,default_branch,private}'
```

Treat `git worktree list --porcelain` as authoritative. If injected-token auth
fails while keyring auth exists, retry read-only GitHub commands with
`/usr/bin/env -u GITHUB_TOKEN gh ...`.

## Workflow

1. Establish the current worktree and default branch, then enumerate the exact
   requested candidates.
2. For each candidate, prove clean porcelain status, non-current/non-default
   ownership, landed commits, no open PR by branch or head SHA, registered
   worktree state, and exact-path process ownership. Follow
   [evidence.md](references/evidence.md) for the command sequence.
3. Stop that candidate's dev stack before removal. From main, prefer the tested
   cwd-scoped helper:

   ```bash
   node -e 'require("./scripts/lib/worktree-listener-cleanup").cleanupListeningProcessesForWorktree({ worktreePath: process.argv[1], logger: console }).then((s) => console.log(JSON.stringify(s)))' <worktree>
   ```

   Record `matchedPids`, `signalledCount`, `gracefulCount`, and
   `forceKilledCount`. It matches TCP listeners and the Rovo supervisor by the
   target cwd, so another checkout's stack remains untouched.
4. If the helper is unavailable, read `.dev-frontend-port`,
   `.dev-backend-port`, `.dev-rovo-port`, and `.dev-rovo-ports` before removal.
   Stop a listener only after `lsof -a -d cwd -p <pid> -Fn` reports the exact
   candidate path. Send TERM, recheck, then KILL only the same surviving PID.
5. Remove a registered, clean, landed, process-safe worktree with plain
   `git worktree remove <path>`. Use `git worktree prune --verbose` only when the
   directory is already gone and registered admin metadata is stale.
6. Delete a local merged branch with `git branch -d <branch>` only when no
   worktree uses it. Report branches that would require `-D`.
7. Delete a merged remote source branch only when no open PR uses its name or
   head commit. After remote deletion, prove `git ls-remote --heads` is empty
   before removing a stale local tracking ref with `git update-ref -d`.

Portless routes left by a removed stack may be removed one alias at a time with
`portless alias --remove <name>`. Global pruning can kill a different worktree
that reused the port, so it is outside this per-worktree flow.

## Validation

```bash
git status --short --branch
git worktree list --porcelain
git worktree prune --dry-run --verbose
git branch -v
git branch -r -v
git ls-remote --heads origin <deleted-branch>
```

Report each worktree removed or preserved with its reason; processes and ports
stopped; local, remote, and tracking refs deleted; explicitly abandoned PRs
closed; final inventory; and any dirty, ambiguous, or sync blockers.
