# Agent Creator Schema

Use this reference when creating or updating `.agents/agents/<agent-name>.md`.
The file is the canonical source of truth for the agent. Provider runtime
adapters are out of scope for v1.

## Frontmatter

Only `name` and `description` are required.

Allowed fields:

| Field | Type | Notes |
|---|---|---|
| `name` | string | Lowercase letters, digits, and hyphens. Match the filename stem. |
| `description` | string | When to use this agent. Keep it specific and trigger-oriented. |
| `tools` | list | Tool names. Unknown tools are warnings, not validation failures. |
| `skills` | list | Skill names to preload or intentionally rely on. Missing skills must be plan-gated. |
| `model` | string | Optional model alias or provider-specific model id. |
| `memory` | string | Prefer `project` for repo-local agents. |
| `background` | boolean | Use only when the agent should normally run as a background task. |
| `effort` | string | `low`, `medium`, `high`, `xhigh`, or provider-supported equivalent. |
| `maxTurns` | number | Maximum agentic turns before stopping. |
| `isolation` | string | Use `worktree` when the agent needs isolated repo edits. |
| `color` | string | UI display color if supported by the host. |

Do not add `instructions`, `channels`, `triggers`, `conversation_starters`, or
workspace-agent fields to frontmatter. Put those in body sections.

## Required Body Sections

These sections are required for new `agent-creator`-managed agents. The
validator treats older Claude-style agents without `memory: project` as legacy
definitions and validates only their frontmatter compatibility.

### `## Instructions`

This is the agent prompt. It should define role, workflow, boundaries,
handoff format, and what evidence the agent must return.

### `## Knowledge`

Use a fenced YAML block:

```yaml
memory:
  scope: project
  path: .agents/knowledge/example-agent/
  seed_files: []
```

If `memory: project` appears in frontmatter, `path` must be
`.agents/knowledge/<agent-name>/`.

### `## Triggers`

Use a fenced YAML block:

```yaml
triggers:
  schedules:
    - name: weekly-report
      cadence: Fridays at 12:00 America/New_York
      automation: review-required
      prompt: Run the weekly report using this agent definition.
  events:
    - name: new-pr
      source: github
      status: declarative
      prompt: Review new PRs that match the configured repository filter.
```

Time schedules can be converted to Codex automations after review. Event
triggers stay declarative until there is a concrete connector or polling route.

### `## Channels`

Use a fenced YAML block to list where the agent can operate:

```yaml
channels:
  - name: ChatGPT
    mode: interactive
  - name: Slack
    mode: planned
```

### `## Conversation Starters`

Use a fenced YAML block:

```yaml
conversation_starters:
  - Review this PR for correctness and missing tests.
  - Draft the weekly product metrics summary.
```

### `## Validation`

List manual checks, tests, browser checks, or dry-run prompts that prove the
agent is ready.

### `## Maintenance Notes`

Record known risks, unavailable tools, dependent skills that were created, and
future adapter or automation work.
