---
description: Start Portless on the current git worktree (frontend + backend, no Rovo CLI)
---

Run Portless for the current working directory, deriving a per-worktree URL prefix so it never collides with the user's main checkout or other worktrees.

## Behavior

1. **Detect context.** Run `git rev-parse --show-toplevel` and `git branch --show-current`.
   - If `cwd` is under `.claude/worktrees/<name>/`, the prefix is the worktree dir name (`<name>`).
   - Else if the branch contains a `/` (e.g. `claude/foo`, `feat/bar`), use the segment after the last `/` as the prefix.
   - Else (clean branch in main checkout), bare `portless` works — no explicit prefix needed.

2. **Check for collisions.** Run `portless list`. If the target hostname `https://<prefix>.vpk-rovo.localhost` already shows an active PID, report it to the user and ask whether to override with `--force` or pick a different prefix. **Do not kill** any PID without explicit user confirmation — these may be dev stacks from other agents or worktrees.

3. **Start.** Run the resolved command in the background and capture the output file path:
   - Worktree: `portless <prefix> pnpm run dev`
   - Main checkout: `portless` (no args)
   - Always `pnpm run dev` — frontend + backend via AI Gateway. **Never** add `--script rovo` or `pnpm run rovo` unless the user explicitly asked for the Rovo CLI.

4. **Wait for boot.** After ~20–25 seconds, tail the output file. Look for the printed Portless URL (line starting with `->`) and the Next.js `Ready in` line. If the backend port shows `Port NNNN in use. Using NNNN+1 instead.`, that's expected — worktree port collisions auto-resolve.

5. **Report.** Output a single line: the Portless URL the user should open. If boot is still in progress after 25s, say so and let them know background task ID `<id>` is streaming to the output file.

## Don't

- Don't autonomously kill or `--force` over an active route. Ask first.
- Don't add `--script rovo` — the user has explicitly stated they don't need the Rovo CLI for preview.
- Don't run in the foreground — Portless is a long-running process; backgrounding lets you read the printed URL without blocking the conversation.
- Don't try bare `portless` from a worktree with a slash-bearing branch name (e.g. `claude/foo`). It strips the slash and loses the prefix, colliding with the main checkout's `vpk-rovo.localhost` registration.

## Why this command exists

The repo's `pnpm run rovo` script wraps `portless run --script rovo` and includes the Rovo CLI dance (OAuth, session token, three processes). For visual review of UI changes that don't actively invoke Rovo tools, that's overkill — `pnpm run dev` is two processes and zero OAuth. This command gives you the AI Gateway path with correct per-worktree isolation in one step.
