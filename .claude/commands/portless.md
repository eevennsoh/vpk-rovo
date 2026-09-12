---
description: Start Portless on the current git worktree (frontend + backend, no Rovo CLI)
---

Give the current worktree a stable `.localhost` URL using **vanilla `portless run`**, so it never collides with the main checkout or other worktrees. No custom prefix logic — portless derives the URL from the git branch; the only special case is a detached worktree, which needs an explicit `--name`.

## Naming convention

| HEAD state | Command | URL |
| --- | --- | --- |
| main checkout | `portless run` | `https://<package-name>.localhost` |
| branched worktree | `portless run` | `https://<branch>.<package-name>.localhost` |
| detached worktree | `portless run --name <worktree-dir>` | `https://<worktree-dir>.localhost` |

Bare `portless run` already produces the first two automatically from the current package and Git branch: main is a default branch (no prefix), and a branch is prepended as a subdomain (a slash branch like `claude/foo` uses its last segment → `foo.<package-name>.localhost`). Only a detached worktree has no branch for portless to key on.

## Behavior

1. **Resolve the args from the repo helper** (don't hand-derive detachment). The same logic the tmux launcher uses lives in `scripts/lib/worktree-ports.js`:

   ```bash
   pnpm exec portless run $(node -e 'process.stdout.write(require("./scripts/lib/worktree-ports").getPortlessRunArgs().join(" "))')
   ```

   `getPortlessRunArgs()` returns `[]` on main/branch and `["--name", "<worktree-dir>"]` when detached. `portless run` with no command runs the package.json `dev` script (frontend + backend via AI Gateway). **Never** add `--script rovo` or `pnpm run rovo` unless the user explicitly asked for the Rovo CLI.

2. **Check for collisions.** Run `portless list`. If the target hostname already shows an active PID owned by another process, report it and ask whether to pick a different name or override. **Do not kill** any PID and **do not `--force`** without explicit user confirmation — it may belong to another agent or worktree.

3. **Run it backgrounded** and capture the output file path (Portless is a long-running process; backgrounding lets you read the printed URL without blocking).

4. **Wait for boot** (~20–25s), then tail the output: look for the `-> https://…` Portless URL and the Next.js `Ready in` line. A backend `Port NNNN in use. Using NNNN+1 instead.` is expected — worktree port collisions auto-resolve.

5. **Report** a single line: the Portless URL to open. You can also confirm it via `pnpm ports` (prints `🌐 https://…` per worktree).

## Don't

- Don't hand-roll a prefix or use named mode (`portless <prefix> pnpm run dev`) — that was the old `vpk-portless` wrapper era. Use vanilla `portless run` + the helper above.
- Don't autonomously kill or `--force` over an active route. Ask first.
- Don't add `--script rovo` — `pnpm run dev` (two processes, no OAuth) is the default for visual review. Only pull in Rovo Serve when the surface under test actually invokes Rovo tools.
- Don't run in the foreground.

## Persistence note

This command's backgrounded `portless run` is fine for a quick look. For a preview that survives cleanly across turns, prefer `pnpm run dev:tmux:start` — it runs the same `portless run` under a detached tmux session, and `pnpm run dev:tmux:stop` lets portless remove this worktree's route on teardown (it sends Ctrl-C so `portless run` cleans up its own route — scoped to this worktree, unlike the global `portless prune`).

## Why this command exists

`pnpm run rovo` wraps the full Rovo CLI dance (OAuth, session token, three processes). For visual review of UI changes that don't invoke Rovo tools, that's overkill — `portless run` gives the AI Gateway path with correct per-worktree URL isolation in one step.
