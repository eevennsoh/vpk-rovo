---
name: vpk-git
description: "Use for VPK-rovo git work in three cases: PR creation, PR merge-back, and cleanup. PR creation commits current edits, derives a branch name when needed, pushes, and opens a GitHub PR. PR merge-back merges a PR, branch, or worktree into the default branch and syncs local/remote main. Cleanup deletes merged PR source branches, closes explicitly abandoned PRs, prunes stale refs, and safely removes clean landed worktrees/branches. Bare `vpk-git` with no flag runs all three end-to-end (create PR -> wait for auto-merge -> clean up). Use whenever the user says \"vpk-git\", \"vpk-git --pr\", \"vpk-git --merge\", \"vpk-git --clean\", \"commit and open a PR\", \"ship this branch\", \"merge this PR back to main\", \"land this worktree\", \"delete the branch after merge\", or \"clean up VPK worktrees/branches\"."
---

# VPK Git

Use this skill for interactive VPK-rovo git work where the agent must preserve user edits, confirm GitHub state, and avoid deleting unproven work. Do not use it for Symphony issue work that is already inside the `vpk-symphony` landing flow; follow `vpk-symphony/references/git/land.md` for that path.

## Choose One Workflow

This skill has three workflows, plus a no-flag default that runs them in sequence:

- **Create PR**: commit current edits, derive a branch name when needed, push, and open a GitHub PR.
- **PR merge back**: publish a PR, branch, or worktree into the default branch and sync local/remote `main`.
- **Clean up**: delete merged PR source branches, close explicitly abandoned PRs, prune stale refs, and remove only clean landed worktrees/branches.
- **Full ship sequence** (bare `vpk-git`): run Create PR -> PR Merge Back -> Clean Up end-to-end.

## Flag-Style Invocation

Treat these prompt forms as explicit routing:

- `vpk-git --pr [<optional title hint>]` -> run **Create PR**.
- `vpk-git --merge <PR number | branch | worktree path>` -> run **PR merge back**. Accepts a comma- or space-separated list (e.g. `--merge 303 304 305`) for batch merge-back; route into the **Batch Merge Back** subsection.
- `vpk-git --clean <PR number | branch | worktree path | scope>` -> run **Clean up**.
- `vpk-git` (no flag) -> run the **Full Ship Sequence**: Create PR -> PR Merge Back -> Clean Up against the current branch's work.

Examples:

```text
[$vpk-git] --pr
[$vpk-git] --pr "Add Hermes status panel"
[$vpk-git] --merge PR #321
[$vpk-git] --merge /path/to/vpk-rovo-worktree
[$vpk-git] --clean PR #321
[$vpk-git] --clean stale merged worktrees and branches
[$vpk-git]
```

If the user asks a descriptive question about the skill ("what does vpk-git do?", "vpk-git help"), explain it — do not run the Full Ship Sequence.

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

Runs **Create PR -> PR Merge Back -> Clean Up** against the current branch's work, fully automated. The agent does not pause between steps unless a Stop Rule fires or step 3 of Create PR needs the existing-PR confirmation.

1. Run **Create PR**. Capture the PR number and branch name.

2. Queue auto-merge:
   - `gh pr merge <number> --merge --auto --delete-branch`
   - `--auto` lets GitHub merge as soon as required checks pass. If no required checks are configured, the merge is immediate.

3. Poll PR state until merged or blocked:
   - `gh pr view <number> --json state,mergedAt,mergeStateStatus,statusCheckRollup`
   - First poll after ~10s, then every 30s. Hard timeout: 15 minutes.
   - Report progress concisely (e.g. "checks: 2/3 pending"); do not flood the output with every poll.
   - On any failed check, `BLOCKED`/`DIRTY` merge state, or timeout, stop and report. The PR remains open for the user to resolve manually. Do not retry automatically.

4. After merge confirms:
   - Sync the persistent `main` checkout per **PR Merge Back** step 5.
   - Run **Clean Up** scoped to this PR's branch and (if registered) its worktree.
   - **If the agent is currently inside the worktree being cleaned**: delete the remote and local branch refs and prune tracking refs, but do not attempt to remove the worktree directory. Report: "Worktree at <path> still active because the agent is inside it — exit and run `vpk-git --clean <path>` from the main checkout to remove."

5. Final report: PR URL, merge commit hash, branches deleted (local + remote), tracking refs pruned, worktree status, local main sync state.

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
- **Create PR**: working tree is clean **and** no commits ahead of the default branch (nothing to PR), the derived branch name collides with an existing local or remote branch *and* the SHA-disambiguator fallback also collides, or `gh pr create` / `git push` fails for a non-trivial reason (auth, network, protected branch). Detached HEAD is *not* a stop condition — branch handling step 2 derives a name and attaches a branch automatically. A mismatched-but-locked branch name (current branch name is a poor fit for the diff but an open PR already exists on it) is *not* a stop either — keep the branch, finish the PR, and surface the mismatch in the report.
- **Full Ship Sequence**: auto-merge cannot be queued, required checks fail, merge state goes `DIRTY` (conflict needs human resolution), or the merge poll exceeds the 15-minute timeout.

## Output

Keep the final report concise:

- PR created / updated / merged / closed and its URL.
- Branch created (with derived name), renamed (from old → new, with the reason), or reused as-is; push result. If the branch name was a poor fit for the diff but could not be renamed (open PR already attached), surface the mismatch explicitly so the user can rename next time.
- PR/branch/worktree merged, closed, deleted, removed, or deliberately skipped.
- Merge commit or final commit hash when available.
- Validation performed and result (note when validation was deferred to CI).
- Branches deleted locally/remotely and tracking refs pruned.
- Worktrees removed or left alone, with reasons.
- Final local checkout state and any restored uncommitted edits.
