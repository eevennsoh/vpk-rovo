# Land

## Goals

- Ensure the PR is conflict-free with main.
- Require a current-head passing Symphony Agent Review.
- Keep CI green and fix failures when they occur.
- Squash-merge the PR once checks pass.
- Do not yield to the user until the PR is merged; keep the watcher loop running
  unless blocked.
- Clean up merged issue branches when GitHub does not auto-delete them.

## Preconditions

- `gh` CLI is authenticated.
- You are on the PR branch with a clean working tree.

## Steps

1. Locate the PR for the current branch.
2. Confirm the issue-required validation and any relevant repo checks are green
   locally before any push.
3. If the working tree has uncommitted changes, follow
   `references/git/commit.md` and `references/git/push.md` before proceeding.
4. Check mergeability and conflicts against main.
5. If conflicts exist, follow `references/git/pull.md` to fetch/merge
   `origin/main` and resolve conflicts, then follow `references/git/push.md` to
   publish the updated branch.
6. Ensure the PR has a current-head root comment in the standardized Symphony
   Agent Review format with `Status: pass`.
7. Watch checks until complete.
8. If checks fail, pull logs, fix the issue, commit, push, and re-run checks.
9. Ensure review comments (human, bot, or Symphony Agent Review) are
   acknowledged and any required fixes are handled before merging.
10. When Agent Review passed, all checks are green, and review feedback is
    addressed, squash-merge using the PR title/body for the merge subject/body,
    then clean up the branch when safe.
11. **Context guard:** Before implementing review feedback, confirm it does not
    conflict with the user’s stated intent or task context. If it conflicts,
    respond inline with a justification and ask the user before changing code.
12. **Pushback template:** When disagreeing, reply inline with: acknowledge +
    rationale + offer alternative.
13. **Ambiguity gate:** When ambiguity blocks progress, use the clarification
    flow (assign PR to current GH user, mention them, wait for response). Do not
    implement until ambiguity is resolved.
    - If you are confident you know better than the reviewer, you may proceed
      without asking the user, but reply inline with your rationale.
14. **Per-comment mode:** For each review comment, choose one of: accept,
    clarify, or push back. Reply inline (or in the issue thread for Codex
    reviews) stating the mode before changing code.
15. **Reply before change:** Always respond with intended action before pushing
    code changes (inline for review comments, issue thread for Codex reviews).

## Commands

```
# Ensure branch and PR context
branch=$(git branch --show-current)
pr_number=$(gh pr view --json number -q .number)
pr_title=$(gh pr view --json title -q .title)
pr_body=$(gh pr view --json body -q .body)
head_sha=$(gh pr view --json headRefOid -q .headRefOid)

# Check mergeability and conflicts
mergeable=$(gh pr view --json mergeable -q .mergeable)

if [ "$mergeable" = "CONFLICTING" ]; then
  # Follow references/git/pull.md for fetch + merge + conflict resolution.
  # Then follow references/git/push.md to publish the updated branch.
fi

# Preferred: use the Async Watch Helper below. The manual loop is a fallback
# when Python cannot run or the helper script is unavailable.
# Wait for a current-head Symphony Agent Review pass.
while true; do
  gh api repos/{owner}/{repo}/issues/"$pr_number"/comments \
    --jq '.[] | select(.body | startswith("[codex] Symphony Agent Review") and (.body | test("Status: pass")) and (.body | contains("'$head_sha'"))) | .id' | rg -q '.' \
    && break
  sleep 10
done

# Watch checks
if ! gh pr checks --watch; then
  gh pr checks
  # Identify failing run and inspect logs
  # gh run list --branch "$branch"
  # gh run view <run-id> --log
  exit 1
fi

# Squash-merge
gh pr merge --squash --subject "$pr_title" --body "$pr_body"
```

## Async Watch Helper

Preferred: use the asyncio watcher to monitor review comments, CI, and head
updates in parallel:

```
python3 .agents/skills/vpk-symphony/scripts/land_watch.py
```

Exit codes:

- 2: Review comments detected (address feedback)
- 3: CI checks failed
- 4: PR head updated or stale Agent Review detected (send back to `Agent Review`)
- 6: Symphony Agent Review requires human review

## Failure Handling

- If checks fail, pull details with `gh pr checks` and `gh run view --log`, then
  fix locally, commit, push, and re-run the watch.
- Use judgment to identify flaky failures. If a failure is a flake (e.g., a
  timeout on only one platform), you may proceed without fixing it.
- If CI pushes an auto-fix commit (authored by GitHub Actions), it does not
  trigger a fresh CI run. Detect the updated PR head, pull locally, merge
  `origin/main` if needed, add a real author commit, and force-push to retrigger
  CI, then restart the checks loop.
- If all jobs fail with corrupted pnpm lockfile errors on the merge commit, the
  remediation is to fetch latest `origin/main`, merge, force-push, and rerun CI.
- If mergeability is `UNKNOWN`, wait and re-check.
- Do not merge while review comments (human, bot, or Symphony Agent Review) are
  outstanding.
- Do not treat older `## Codex Review` comments as the merge approval signal.
  The required approval is a current-head `[codex] Symphony Agent Review`
  comment with `Status: pass`.
- Do not enable GitHub native auto-merge; this repo has no required checks so
  GitHub auto-merge can skip tests. "Auto-merge" means Symphony itself moves a
  passing `Agent Review` issue into `Merging` and runs this guarded landing
  flow.
- If the remote PR branch advanced due to your own prior force-push or merge,
  avoid redundant merges; re-run the formatter locally if needed and
  `git push --force-with-lease`.

## Review Handling

- Symphony Agent Review comments are root-level PR issue comments in this exact
  shape:

  ```md
  [codex] Symphony Agent Review

  Status: pass | changes-requested | needs-human
  Reviewed commit: `<head-sha>`
  Validation reviewed: <short proof summary>
  Findings: <none | short bullets>
  Risk decision: <auto-merge eligible | human review required>
  ```

- Only `Status: pass` for the current PR head permits merge. `changes-requested`
  sends the Linear issue back to `In Progress`; `needs-human` sends it to
  `Human Review`. If the PR head changes after Agent Review, move the issue
  back to `Agent Review`.

- Codex reviews now arrive as issue comments posted by GitHub Actions. They
  start with `## Codex Review — <persona>` and include the reviewer’s
  methodology + guardrails used. Treat these as feedback that must be
  acknowledged before merge.
- Human review comments are blocking and must be addressed (responded to and
  resolved) before requesting a new review or merging.
- If multiple reviewers comment in the same thread, respond to each comment
  (batching is fine) before closing the thread.
- Fetch review comments via `gh api` and reply with a prefixed comment.
- Use review comment endpoints (not issue comments) to find inline feedback:
  - List PR review comments:
    ```
    gh api repos/{owner}/{repo}/pulls/<pr_number>/comments
    ```
  - PR issue comments (top-level discussion):
    ```
    gh api repos/{owner}/{repo}/issues/<pr_number>/comments
    ```
  - Reply to a specific review comment:
    ```
    gh api -X POST /repos/{owner}/{repo}/pulls/<pr_number>/comments \
      -f body='[codex] <response>' -F in_reply_to=<comment_id>
    ```
- `in_reply_to` must be the numeric review comment id (e.g., `2710521800`), not
  the GraphQL node id (e.g., `PRRC_...`), and the endpoint must include the PR
  number (`/pulls/<pr_number>/comments`).
- If GraphQL review reply mutation is forbidden, use REST.
- A 404 on reply typically means the wrong endpoint (missing PR number) or
  insufficient scope; verify by listing comments first.
- All GitHub comments generated by this agent must be prefixed with `[codex]`.
- For Codex review issue comments, reply in the issue thread (not a review
  thread) with `[codex]` and state whether you will address the feedback now or
  defer it (include rationale).
- If feedback requires changes:
  - For inline review comments (human), reply with intended fixes
    (`[codex] ...`) **as an inline reply to the original review comment** using
    the review comment endpoint and `in_reply_to` (do not use issue comments for
    this).
  - Implement fixes, commit, push.
  - Reply with the fix details and commit sha (`[codex] ...`) in the same place
    you acknowledged the feedback (issue comment for Codex reviews, inline reply
    for review comments).
  - The land watcher treats Codex review issue comments as unresolved until a
    newer `[codex]` issue comment is posted acknowledging the findings.
- After pushing new commits, move the Linear issue back to `Agent Review` so
  the fresh read-only review runs against the new head. Post a concise
  root-level summary comment so reviewers have the latest delta:
    ```
    [codex] Changes since last review:
    - <short bullets of deltas>
    Commits: <sha>, <sha>
    Tests: <commands run>
    ```
  Wait for the next current-head Symphony Agent Review comment before merging.

## Scope + PR Metadata

- The PR title and description should reflect the full scope of the change, not
  just the most recent fix.
- If review feedback expands scope, decide whether to include it now or defer
  it. You can accept, defer, or decline feedback. If deferring or declining,
  call it out in the root-level `[codex]` update with a brief reason (e.g.,
  out-of-scope, conflicts with intent, unnecessary).
- Correctness issues raised in review comments should be addressed. If you plan
  to defer or decline a correctness concern, validate first and explain why the
  concern does not apply.
- Classify each review comment as one of: correctness, design, style,
  clarification, scope.
- For correctness feedback, provide concrete validation (test, log, or
  reasoning) before closing it.
- When accepting feedback, include a one-line rationale in the root-level
  update.
- When declining feedback, offer a brief alternative or follow-up trigger.
- Prefer a single consolidated "review addressed" root-level comment after a
  batch of fixes instead of many small updates.
- For doc feedback, confirm the doc change matches behavior (no doc-only edits
  to appease review).
