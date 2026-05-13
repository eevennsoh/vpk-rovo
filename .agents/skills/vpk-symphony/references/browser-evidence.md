# Browser Evidence

Use this reference only for Symphony issue evidence. For normal local UI work,
use `/agent-browser` as directed by `AGENTS.md`.

## Policy

1. Check whether `playwright-cli --version` succeeds.
2. If unavailable, skip browser media capture, record the limitation in the
   workpad `Validation` section, and continue with the best non-browser proof.
3. If available, use `playwright-cli` for browser validation and consult
   `references/playwright-cli/quickstart.md` only as needed.
4. Store artifacts under `output/playwright/<issue-identifier>/`.
5. Capture a before artifact only when it proves the bug or requested baseline.
6. Capture an after artifact for app-touching work before handoff.
7. Prefer screenshots for static UI and final state checks.
8. Use short WebM recordings for multi-step interactions, animation,
   timing-sensitive behavior, drag/drop, keyboard flows, or hover/focus states.
9. Inspect artifacts for secrets, tokens, local file paths, private data,
   unrelated browser tabs, terminal panes, and devtools output before upload.
10. Upload only required media through `linear_graphql` using `fileUpload`, then
   update the single `## Codex Workpad` comment.

## Upload Formatting

- Screenshots: `![alt text](<asset-url>)`
- WebM recordings: put the asset URL on its own line.
