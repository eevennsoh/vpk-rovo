# Codex Workpad

Use one active Linear comment headed exactly:

```markdown
## Codex Workpad
```

## Required Content

Keep the workpad compact and current:

- Environment stamp: `<host>:<abs-workdir>@<short-sha>`.
- Plan checklist.
- Acceptance criteria copied from issue `Validation`, `Test Plan`, or
  `Testing` sections when present.
- Validation results with exact commands or browser evidence.
- Decisions and assumptions.
- Branch and PR links.
- Handoff summary.

## Update Rules

- Reuse the live unresolved workpad; do not create duplicate progress comments.
- Check off completed items as the run progresses.
- Record sync evidence before edits: merge source, result, and resulting short
  SHA.
- For app-touching work, record browser evidence availability and artifact
  links when available.
- Put uploaded screenshots and WebM links in the workpad `### Evidence` section.
- Use markdown image syntax for screenshots so Linear renders inline previews.
- Put uploaded WebM asset URLs on their own line.

## Answer-Only Issues

For explanation, triage, codebase-tour, or operational-guidance tickets with no
requested repo change, write the answer in the workpad handoff, move the issue
to `Human Review`, and do not create a branch, commit, PR, or follow-up issue.
