---
description: Skills, parallel work model, agent teams, behavioral rules
globs: .agents/skills/**, .agents/agents/**
alwaysApply: false
paths:
  - ".agents/skills/**"
  - ".agents/agents/**"
---

# Agent Operations

## Skills and Agents

Primary locations:

- Skills: `.agents/skills/*/SKILL.md`
- Agents: `.agents/agents/*`

Provider mirrors:

- `.cursor/`, `.claude/`, `.codex/`, and `.rovodev/` contain provider-specific config plus symlinks back to `.agents/`

Skill types:

- Workflow: multi-step procedures
- Utility: single-purpose helpers

Current VPK skills (see Appendix for details):

- `/vpk-setup`
- `/vpk-build`
- `/vpk-deploy`
- `/vpk-design`
- `/vpk-html`
- `/vpk-tidy`
- `/vpk-component`
- `/vpk-component-ext`
- `/vpk-symphony`

> **Note:** Slash commands (e.g., `/vpk-deploy`) are Cursor IDE features. In other environments, reference the skill definitions in `.agents/skills/` directly.

## Parallel Work Model

Choose one model based on communication needs:

| Mode        | Best for                                           | Coordination                              | Cost   |
| ----------- | -------------------------------------------------- | ----------------------------------------- | ------ |
| Subagents   | Independent tasks where only results matter        | Main agent coordinates                    | Lower  |
| Agent teams | Cross-area work needing direct teammate discussion | Shared task list + teammate collaboration | Higher |

Subagent rule:

- Always wait for all subagents before yielding results

## Agent Teams Management

Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

Controls:

- In-process mode: select teammate with Shift+Up/Down, toggle task list with Ctrl+T
- Split pane mode: set `"teammateMode": "tmux"`
- Delegate mode: Shift+Tab

Default team lifecycle:

```text
Explore -> Implement -> Test -> Tidy
```

Detailed ownership and phase guidance is in `## Appendix -> Agent Team Workflow Reference`.

## Behavioral Rules

- Verify exact file location before UI edits by searching for distinctive text/classes.
- Use macOS/BSD-safe shell patterns (for example `sed -i ''`).
- For Figma work, front-load key specs: spacing, radius, width constraints, shadow token.
- When editing icons, check consistency across all icons in the component.
- Prefer flexible AI-driven implementations over narrow hardcoded matching.
- Prefer the simplest viable implementation before introducing abstractions.
- If implementation gets unstable, stop and re-plan instead of patching repeatedly.
- Before completion, perform a staff-level quality gate: root-cause fixes, clean architecture, no band-aids.
- When fixing a bug, add a regression test that reproduces the original failure.

## Local Overrides

You can add gitignored local overrides:

```text
.agents/skills/vpk-deploy/SKILL.local.md
.claude.local.md
```

Note: `.claude.local.md` should be added to `.gitignore` if used for personal/local settings.
