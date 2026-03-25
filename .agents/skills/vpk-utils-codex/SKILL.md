---
name: vpk-utils-codex
description: Switch the Codex CLI between the pinned rollback version `0.107.0` and modern API-key-based versions such as `0.116.0+`, rewrite `~/.codex/config.toml` to the matching profile, and preserve reusable auth and config backups. Use when the user asks to upgrade or downgrade Codex, revert to pre-enterprise-web-policy Codex, move back to `0.107`, move to `0.116` or newer, switch between OAuth and API key login, or verify the installed Codex CLI version, auth mode, and config profile.
---

# Codex Version Switcher

Use the bundled script to switch the globally installed npm Codex CLI on machines where `codex` comes from a global `@openai/codex` install.

This skill manages two operating modes:

- `0.107.0` rollback mode: ChatGPT OAuth, `openai-no-ws`, and the legacy config profile.
- `0.116.0+` modern mode: API key login, `atlassian-proxy`, and the newer config profile.

## Why the rollback path exists

Keep `0.107.0` available because `0.110.0+` introduced enterprise workspace-managed config enforcement. On this account, ChatGPT Business auth can fail closed with `failed to load your workspace-managed config` when no org cloud `requirements.toml` exists. That makes `0.107.0` the safe OAuth-based rollback target.

## Quick start

Set the skill path once. Use the **skill base directory** provided when this skill loads (shown as `Base directory for this skill: <path>`):

```bash
export CODEX_SWITCH="<skill-base-dir>/scripts/codex_switch.sh"
```

For example, if the base directory is `/Users/you/project/.claude/skills/vpk-utils-codex`:

```bash
export CODEX_SWITCH="/Users/you/project/.claude/skills/vpk-utils-codex/scripts/codex_switch.sh"
```

Check current state:

```bash
"$CODEX_SWITCH" status
```

Upgrade to the default modern target `0.116.0` and log in with an API key:

```bash
export OPENAI_API_KEY="..."
"$CODEX_SWITCH" upgrade-latest
```

Upgrade to a specific modern version and apply the `0.116.0+` config profile:

```bash
export OPENAI_API_KEY="..."
"$CODEX_SWITCH" switch 0.116.1
```

Downgrade to `0.107.0` and restore ChatGPT auth if a backup exists:

```bash
"$CODEX_SWITCH" downgrade-0107
```

## Workflow

1. Run `status` first to confirm the binary path, installed version, auth mode, and active config markers.
2. Use `upgrade-latest` for the default modern target, or `switch <version>` for a specific version.
3. For any version other than `0.107.0`, export `OPENAI_API_KEY` first; the script will apply the modern config and run `codex login --with-api-key`.
4. Use `downgrade-0107` to install `0.107.0`, restore the rollback config, and restore the latest saved ChatGPT auth snapshot when available.
5. If no ChatGPT auth backup exists, finish with interactive `codex login` and choose ChatGPT sign-in.

## Script behavior

The bundled script:

- verifies `codex` and `npm` are available
- verifies the active `codex` binary lives under npm's global prefix
- installs `@openai/codex@0.107.0` or any requested modern version
- rewrites `~/.codex/config.toml` from bundled config templates
- backs up both `~/.codex/auth.json` and `~/.codex/config.toml` before changes
- stores labeled snapshots in `~/.codex/auth-backups/vpk-utils-codex/`
- restores the latest ChatGPT auth snapshot on downgrade when possible
- prints the resulting version, auth mode, model provider, and model

## Commands

```bash
"$CODEX_SWITCH" status
"$CODEX_SWITCH" upgrade-latest
"$CODEX_SWITCH" downgrade-0107
"$CODEX_SWITCH" switch 0.107.0
"$CODEX_SWITCH" switch 0.116.0
"$CODEX_SWITCH" switch 0.116.1
```

## Bundled assets

- `assets/config-0.107.0.toml`: rollback profile for OAuth + `openai-no-ws`
- `assets/config-0.116.0-plus.toml`: modern profile for API key + `atlassian-proxy`

## Guardrails

- Prefer the bundled script instead of editing `~/.codex/auth.json` or `~/.codex/config.toml` manually.
- Treat `0.107.0` as the only supported ChatGPT OAuth rollback target.
- Treat `0.116.0+` as API-key-based and modern-profile-based. Do not expect ChatGPT OAuth on that path.
- Do not use this skill if Codex was installed with Homebrew or a standalone tarball unless you first verify the active `codex` binary is not shadowing the npm-global install.
