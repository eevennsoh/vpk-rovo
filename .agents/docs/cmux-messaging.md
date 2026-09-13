# cmux Inter-Agent Messaging

Use this document only for agents that already run in separate cmux workspaces.
Codex subagents in one task use the product's collaboration tools; Claude agent
teams use their native team messaging. Do not build a cmux buffer protocol when
the agents already share an orchestrator.

## Discover the Current Topology

Resolve live handles at the time of use. Never keep a workspace, pane, or
surface ref in a saved prompt.

```bash
cmux identify --json
cmux list-workspaces
cmux tree --all
cmux list-panes
cmux list-pane-surfaces
```

cmux prints short refs such as `workspace:2` and `surface:5`. UUIDs are also
accepted when another API already returned one.

## Start an Agent Workspace

The installed cmux CLI owns the supported Codex and Claude team launchers:

```bash
repo_root="$(git rev-parse --show-toplevel)"
cmux new-workspace \
  --name "CODEX" \
  --cwd "$repo_root" \
  --command "cmux codex-teams"

cmux new-workspace \
  --name "CLAUDE" \
  --cwd "$repo_root" \
  --command "cmux claude-teams"
```

Use `cmux codex-teams --help` or `cmux claude-teams --help` before adding model,
resume, or provider flags. Rovo Serve is a repository service started by
`pnpm run rovo`; it is not an inter-agent peer or a replacement for either team
launcher.

## Dispatch to an Existing Workspace

Prefer a workspace's focused agent surface. Inspect it before sending so a
prompt is not typed into a shell, browser, or completed process.

```bash
cmux read-screen --workspace <workspace-ref> --lines 40
cmux send --workspace <workspace-ref> "Inspect backend/ and report the owner. Do not edit."
cmux send-key --workspace <workspace-ref> Enter
```

Use `--surface <surface-ref>` when the workspace has multiple surfaces and the
target must be exact. A successful `send` means text was typed; it does not
prove that an agent accepted or completed the request.

## Notify and Synchronize

Use notifications for attention and `wait-for` only when two independent
workspaces need an explicit shell-level barrier.

```bash
cmux notify \
  --title "Agent handoff" \
  --body "Review request is ready" \
  --workspace <workspace-ref>

# Receiver signals completion.
cmux wait-for --signal review-ready

# Sender waits with a bound.
cmux wait-for review-ready --timeout 120
```

For an attributable payload, put a small envelope in a uniquely named buffer,
then notify the target with the buffer name:

```bash
cmux set-buffer --name "agent-msg-<unique-id>" \
  '<cmux-message from="workspace:1" to="workspace:2" type="request">Run typecheck and report the result.</cmux-message>'
cmux notify --title "agent-msg" --body "agent-msg-<unique-id>" --workspace workspace:2
```

The receiver reads it with `cmux paste-buffer --name <buffer-name>` and removes
or overwrites the buffer after processing. Do not place credentials, tokens, or
private environment values in buffers or notifications.

## Completion Check

Before treating a cross-workspace handoff as complete:

```bash
cmux read-screen --workspace <workspace-ref> --lines 80
cmux surface-health --workspace <workspace-ref>
cmux list-notifications
```

Verify the reported files, Git state, and tests in the owning repository. A
notification or terminal message is coordination evidence, not implementation
proof.

## Rules

- Discover refs dynamically with `identify`, `list-workspaces`, or `tree`.
- Resolve the current repository root with `git rev-parse --show-toplevel`;
  Documents-era checkout paths are historical.
- Use only installed launchers shown by `cmux --help`.
- Inspect the target surface before `send`; use `send-key ... Enter` to submit.
- Bound `wait-for`; do not block indefinitely.
- Keep payloads attributable and secret-free.
- Re-read repository state after any cross-workspace implementation handoff.
