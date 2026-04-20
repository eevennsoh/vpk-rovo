# cmux Inter-Agent Messaging

When multiple AI agents run in separate cmux workspaces, use this protocol to coordinate.

## Discovery and Spawn

At session start, discover your identity and find peer agents dynamically:

```bash
# 1. Who am I?
cmux identify                  # returns your workspace/surface refs

# 2. Who else is running?
cmux tree                      # full layout — scan workspace names for agent keywords
```

Scan `cmux tree` output for workspaces named "CODEX", "CLAUDE", "ROVODEV", or similar. These are all AI agent workspaces — any of them can be a peer for task dispatch and messaging. Extract workspace refs dynamically — never hardcode them.

Known agent types:

| Workspace name | Spawn command |
| --- | --- |
| CLAUDE | `vpk-claude-gw` |
| CODEX | `vpk-codex` |
| ROVODEV | `vpk-rovodev` |

If a needed peer agent isn't running, spawn it:

```bash
cmux new-workspace --name "<AGENT-NAME>" --cwd /Users/esoh/Documents/Labs/VPK-rovo \
  --command "<spawn-command>"
```

Then re-run `cmux tree` to get the new workspace's ref. See `.rovodev/skills/codex/SKILL.md` for Codex-specific flags.

To dispatch a task to a running agent workspace, use `cmux send` followed by `send-key Enter` (the send command types text but does not submit it):

```bash
cmux send --workspace <target-ref> "Explore backend/ and broadcast findings via cmux protocol"
cmux send-key --workspace <target-ref> Enter
```

## Message Protocol

All structured messages use XML format in cmux named buffers. Buffer names follow the pattern `agent-msg-{id}` where `{id}` is a monotonic counter or UUID.

### Message envelope

```xml
<cmux-message id="{unique-id}" timestamp="{ISO-8601}">
  <from workspace="{ws-ref}" surface="{sf-ref}" agent="{agent-name}" />
  <to workspace="{ws-ref}" />
  <type>{request|response|broadcast|handoff}</type>
  <body>{payload}</body>
</cmux-message>
```

### Message types

| Type | Purpose | Expected response |
| --- | --- | --- |
| `request` | Ask another agent to do something | `response` with same `id` |
| `response` | Reply to a `request` | None |
| `broadcast` | Inform all agents (no specific target) | None (optional `response`) |
| `handoff` | Transfer ownership of a task | `response` acknowledging receipt |

### Sending a message

```bash
# 1. Discover target workspace ref (never hardcode)
TARGET_WS=$(cmux tree | grep -i "CODEX" | grep -oE 'workspace:[0-9]+')

# 2. Write message to a named buffer
cmux set-buffer --name "agent-msg-001" '<cmux-message id="001" timestamp="...">
  <from workspace="..." surface="..." agent="claude-gw" />
  <to workspace="'"$TARGET_WS"'" />
  <type>request</type>
  <body>Run typecheck and report errors</body>
</cmux-message>'

# 3. Notify the target agent
cmux notify --title "agent-msg" --body "agent-msg-001" --workspace "$TARGET_WS"

# 4. Signal readiness (for sync coordination)
cmux wait-for -S "msg-001-ready"
```

### Receiving a message

When you see a notification with title `agent-msg`, the body contains the buffer name:

```bash
# 1. Read the message buffer
cmux paste-buffer --name "agent-msg-001"

# 2. Parse the XML envelope, execute the request

# 3. Discover sender's workspace ref from the <from> element
SENDER_WS="..."  # extracted from the message

# 4. Write response to a new buffer
cmux set-buffer --name "agent-msg-001-reply" '<cmux-message id="001-reply" timestamp="...">
  <from workspace="..." surface="..." agent="codex" />
  <to workspace="'"$SENDER_WS"'" />
  <type>response</type>
  <body>Typecheck passed, 0 errors</body>
</cmux-message>'

# 5. Notify the sender
cmux notify --title "agent-msg" --body "agent-msg-001-reply" --workspace "$SENDER_WS"

# 6. Signal completion
cmux wait-for -S "msg-001-done"
```

## Synchronization

Use `cmux wait-for` for blocking coordination between agents:

```bash
# Agent A: wait for Agent B to finish setup
cmux wait-for "setup-complete" --timeout 120

# Agent B: signal when ready
cmux wait-for -S "setup-complete"
```

## Rules

- **No hardcoded refs.** Always discover workspace/surface refs via `cmux tree` at runtime.
- **Auto-spawn if missing.** If you need a peer agent and none exists, use `cmux new-workspace` to create one. See `.rovodev/skills/codex/SKILL.md` for Codex CLI usage.
- **Use `cmux send`** to type prompts into a peer agent's terminal for task dispatch.
- Always include `agent` name in the `<from>` element so messages are attributable.
- Use `cmux notify` as the signaling channel — don't rely on polling `list-buffers`.
- Buffer names must be unique per session. Use monotonic IDs or include a timestamp.
- Clean up buffers after processing: the receiver deletes consumed buffers.
- For fire-and-forget updates (build status, progress), use `broadcast` type.
- For tasks that require a response, use `request` and wait on the corresponding `wait-for` signal.
