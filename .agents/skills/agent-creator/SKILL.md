---
name: agent-creator
description: Create or update repo-local Markdown agent definitions with YAML frontmatter, project memory, structured workspace-agent sections, schedule handoff notes, and validation. Use when the user asks to create, define, draft, improve, or maintain an agent, subagent, workspace agent, scheduled agent, agent profile, or reusable agent persona in `.agents/agents/`.
---

# Agent Creator

Use this skill to create or update canonical repo-local agents at
`.agents/agents/<agent-name>.md`. The agent file is the source of truth. Do not
generate Codex TOML, provider adapters, or UI code in v1 unless the user
explicitly asks for a separate follow-up.

## Core Contract

- Plan first. Before writing or updating an agent, produce an `Agent Plan` and
  wait for approval.
- Keep frontmatter strict and Claude-style. Put only high-signal runtime fields
  there; put workspace-agent concepts in structured Markdown sections.
- Store instructions in the Markdown body, not in a frontmatter `instructions`
  field.
- Default new agents to `memory: project` and use
  `.agents/knowledge/<agent-name>/` for shareable knowledge.
- Create or update existing agents in place. If the agent exists, inspect the
  current file and present a patch-style plan before editing.
- Missing dependent skills are plan-gated. List missing skills in the agent
  plan, then create only approved skills with the normal `skill-creator`
  init/edit/validate flow.
- Time-based schedules may become live Codex automations only after review.
  Event triggers stay declarative unless a concrete connector or polling route
  is available.
- Warn on unavailable or unknown tools; do not block the agent definition solely
  because a tool is unavailable in the current session.

## Agent Plan Checklist

For new agents, include:

1. Name, description, and primary user goal
2. Non-goals and boundaries
3. Instructions outline and expected output style
4. Tools, skills, missing skills to create, and unavailable-tool warnings
5. Knowledge path and initial knowledge files
6. Triggers, schedule handoff, channels, and conversation starters
7. Validation plan, likely failure modes, and files to create

For existing agents, include:

1. Current file path and current frontmatter summary
2. What changes and what stays stable
3. Patch-style body section changes
4. Missing skill or knowledge updates
5. Validation command to run after editing

## File Shape

Use `assets/agent-template.md` as the starting point for new agents. Read
`references/schema.md` before inventing new fields or section names.

Required frontmatter:

- `name`
- `description`

Allowed optional frontmatter:

- `tools`
- `skills`
- `model`
- `memory`
- `background`
- `effort`
- `maxTurns`
- `isolation`
- `color`

Required body sections:

- `## Instructions`
- `## Knowledge`
- `## Triggers`
- `## Channels`
- `## Conversation Starters`
- `## Validation`
- `## Maintenance Notes`

Structured body sections that need machine-readable values should contain a
fenced `yaml` block. Keep prose around those blocks brief.

If the agent will appear in a runtime UI, chat selector, or generated profile,
carry the same frontmatter `description` and `## Conversation Starters` into
that profile data. Do not create a visible agent with an empty description or
empty starters just because the Markdown definition has the canonical fields.

## Build Workflow

1. Inspect existing files:
   - `find .agents/agents -maxdepth 1 -type f -name '*.md'`
   - `find .agents/skills -maxdepth 2 -type f -name 'SKILL.md'`
   - `find .agents/knowledge -maxdepth 2 -type f 2>/dev/null`
2. Draft the `Agent Plan`; include warnings instead of silently resolving
   unknown tools or unavailable connectors.
3. After approval, create or update the agent file and knowledge directory.
4. If the plan approved new dependent skills, invoke `skill-creator` for each
   missing skill and validate those skill folders.
5. Validate the agent definition:

```bash
node .agents/skills/agent-creator/scripts/validate-agent.mjs .agents/agents/<agent-name>.md
```

6. For broad edits, validate all agents:

```bash
node .agents/skills/agent-creator/scripts/validate-agent.mjs .agents/agents
```

## Schedule Handoff

If a schedule is requested, put the schedule in the agent file under
`## Triggers` first. Then ask the user to approve creating or updating the live
Codex automation. The automation prompt should reference the canonical agent
file and the work it should do each run. Do not create background work silently.

## Quality Bar

- The frontmatter description must clearly say when to use the agent.
- Conversation starters must contain at least one concrete user-facing prompt;
  use 2-4 starters for normal interactive agents.
- The body must be operational enough for another agent to run without guessing.
- The knowledge path must match `.agents/knowledge/<agent-name>/` when
  `memory: project`.
- Tool warnings must be explicit in the plan or maintenance notes.
- Validation must pass before marking the agent ready.
