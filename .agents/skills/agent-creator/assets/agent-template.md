---
name: example-agent
description: Describe exactly when this agent should be used and what work it should take on.
tools: ["Read", "Grep", "Glob"]
skills: []
memory: project
---

# Example Agent

## Instructions

You are Example Agent. Replace this section with the full instructions prompt:
role, scope, workflow, output format, validation expectations, and boundaries.

## Knowledge

```yaml
memory:
  scope: project
  path: .agents/knowledge/example-agent/
  seed_files: []
```

## Triggers

```yaml
triggers:
  schedules: []
  events: []
```

## Channels

```yaml
channels:
  - name: ChatGPT
    mode: interactive
```

## Conversation Starters

```yaml
conversation_starters:
  - Ask Example Agent to handle a narrow task with clear inputs and expected output.
```

## Validation

- Run `node .agents/skills/agent-creator/scripts/validate-agent.mjs .agents/agents/example-agent.md`.
- Dry-run one representative prompt without creating live automations.

## Maintenance Notes

- Unknown tools should be recorded here as warnings until they are configured.
