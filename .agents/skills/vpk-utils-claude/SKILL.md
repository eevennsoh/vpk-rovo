---
name: vpk-utils-claude
description: Fix Claude CLI binary path conflicts where cmux's bundled copy or ~/.local/bin symlink points to an older version instead of the latest installed version. Use when the user mentions claude version mismatch, old claude binary, cmux using wrong claude, PATH conflict with claude, updating claude symlink, or "which claude" showing the wrong path. Also trigger when the user says "fix claude path", "update claude binary", or mentions cmux picking up a stale claude.
---

# vpk-utils-claude

Diagnose and fix PATH conflicts between multiple Claude CLI binaries.

## How Claude CLI manages versions

Claude CLI self-manages its binaries at `~/.local/share/claude/versions/<semver>` (e.g. `2.1.89`). The user-facing symlink at `~/.local/bin/claude` should point to the latest version in that directory. This symlink is **not** automatically updated when new versions are downloaded — it can fall behind.

Separately, cmux bundles its own `claude` at `/Applications/cmux.app/Contents/Resources/bin/claude` which never updates and can win in PATH order.

## The problem

| Path | Source | Auto-updates? |
|------|--------|---------------|
| `~/.local/share/claude/versions/*` | Claude CLI self-updater | Yes (downloads new versions) |
| `~/.local/bin/claude` | Symlink to a specific version | No — must be re-pointed |
| `/Applications/cmux.app/Contents/Resources/bin/claude` | cmux bundle | No — stays frozen |

If the symlink is stale or cmux's path wins in `$PATH`, you silently run an older version.

## Quick start

Set the script path using the **skill base directory** shown when this skill loads:

```bash
export CLAUDE_FIX="<skill-base-dir>/scripts/claude_fix.sh"
```

### Check current state

```bash
bash "$CLAUDE_FIX" status
```

Shows all installed versions, which binary wins in PATH, symlink targets, and cmux status. Does **not** run `claude --version` (avoids hangs in sandboxed environments) — reads version from filenames instead.

### Fix the symlink (recommended default)

```bash
bash "$CLAUDE_FIX" fix
```

Points `~/.local/bin/claude` → the latest version in `~/.local/share/claude/versions/`. This is safe — it just redirects the symlink.

### Fix symlink + cmux bundle

```bash
bash "$CLAUDE_FIX" fix-cmux
```

Does the symlink fix above, then copies the latest binary into cmux's `Resources/bin`. The copy will go stale on the next CLI update, so re-run when needed.

## When to run

- After a Claude CLI self-update downloads a new version
- When `claude --version` shows something older than expected
- When cmux sessions behave differently from terminal sessions
- When `which claude` points to the cmux path

## Workflow

1. Run `status` first to see what's happening
2. Run `fix` to point the symlink at the latest version (covers most cases)
3. If cmux is also affected, run `fix-cmux`
4. Verify with `status` again

## Notes

- The `fix` command requires write access to `~/.local/bin/` — if running in a sandbox, you may need to disable it for this command.
- Version detection uses filenames from the versions directory (instant, no subprocess), falling back to `claude --version` with a 3-second timeout only for binaries outside the versions dir.
