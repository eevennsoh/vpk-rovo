# SPEC: Hermes Agent Feature Integration

> Cherry-pick Hermes Agent capabilities into RovoDev Serve (ACRA) and VPK-Rovo.
> RovoDev Serve remains the only agent loop. Hermes is a capability substrate.

---

## 1. Objective

Integrate the most valuable Hermes Agent features into the RovoDev ecosystem:

- **ACRA (RovoDev Serve)**: Core runtime features — safety, context management, advanced tools
- **VPK-Rovo**: Orchestration + UI surfaces that expose those capabilities to users

**Target users**: Developers using the VPK-Rovo prototype for AI-assisted work.

**Non-goal**: Replace RovoDev Serve with Hermes. Hermes is never the executor.

---

## 2. Current State

### Already Integrated (VPK-Rovo orchestration layer)

| # | Feature | Implementation |
|---|---------|---------------|
| 1 | File-based identity/memory | `hermes-memory.js` — MEMORY.md, USER.md |
| 2 | Skills discovery + config | `hermes-skills.js` — local ~/.hermes/skills/ |
| 3 | Local jobs scheduler | `hermes-jobs-local.js` — cron, interval, weekday |
| 4 | Jobs provider | `hermes-jobs-provider.js` — JSON persistence |
| 5 | Job-to-thread linking | `hermes-job-links.js` |
| 6 | Memory companion | `hermes-memory-companion.js` — AI-powered review |
| 7 | Context injection | `hermes-rovo-context.js` — memory + skills into prompts |
| 8 | Task executor | `rovo-task-executor.js` — unified RovoDev execution |
| 9 | Runtime status | `hermes-status.js` + `runtime-status.js` |
| 10 | Job result sync | `hermes-rovo-job-sync.js` |

### Not Yet Integrated

84 Hermes features cataloged. 20 selected for integration across 3 tiers.

---

## 3. Features to Integrate

### Tier 1 — High Value, Ship First

| # | Feature | Target | Hermes Source | Description |
|---|---------|--------|---------------|-------------|
| 1 | **Context Compression** | ACRA | `context_compressor.py` | Auto-summarize older turns with structured template (Goal / Progress / Decisions / Files / Next Steps) when approaching context limit. Iterative updates on subsequent compressions. |
| 2 | **Session Search (FTS5)** | Both | `session_search_tool.py` | Full-text search across past sessions with LLM-powered summarization. SQLite FTS5 index. |
| 3 | **Dangerous Command Approval** | ACRA | `approval.py` | Pattern-based detection of destructive commands (rm -rf, sudo, DROP TABLE). Approval flow via existing pause-on-tools. |
| 4 | **Secret Exfiltration Blocking** | ACRA | `redact.py` | Scan tool outputs and responses for API keys, private keys, tokens, connection strings. Redact before reaching LLM or client. |
| 5 | **Checkpoint & Rollback** | Both | `checkpoint_manager.py` | Filesystem snapshots before destructive operations. Named checkpoints with rollback. |
| 6 | **Skills Hub** | Both | `skills_hub.py` | Browse, search, install community skills from agentskills.io. Validation with path traversal protection. |

### Tier 2 — Medium Value, Ship Second

| # | Feature | Target | Hermes Source | Description |
|---|---------|--------|---------------|-------------|
| 7 | **Code Execution Sandbox** | ACRA | `code_execution_tool.py` | Sandboxed Python execution with RPC-based tool calling via Unix Domain Socket. Collapses multi-turn tool chains into single inference pass. |
| 8 | **Mixture of Agents** | ACRA | `mixture_of_agents_tool.py` | Parallel dispatch to N expert models for consensus. Configurable expert count and model selection. |
| 9 | **Credential Pool** | ACRA | `credential_pool.py` | Multiple API keys per provider. Thread-safe least-used rotation. 401 failover. |
| 10 | **Pluggable Memory Providers** | Both | `memory_provider.py` | Abstract MemoryProvider interface. Lifecycle hooks (prefetch, sync, on_write, on_compress). Plugin discovery. |
| 11 | **Prompt Caching** | ACRA | `prompt_caching.py` | Anthropic cache control header injection. Reduce costs on repeated context. |
| 12 | **Extended Thinking** | Both | `prompt_builder.py` | Configurable reasoning effort (none / low / medium / high / xhigh). Thinking block preservation across tool calls. |

### Tier 3 — Nice to Have, Deferred

| # | Feature | Target | Description |
|---|---------|--------|-------------|
| 13 | Personality System | Both | Named persona templates |
| 14 | Smart Model Routing | ACRA | Auto-fallback to alternate providers |
| 15 | Context Files Auto-Discovery | ACRA | Load .hermes/context.md as project context |
| 16 | Toolsets | ACRA | Named tool groupings per scenario |
| 17 | Image Generation (FAL.ai) | Both | FLUX 2 Pro with auto-upscaling |
| 18 | TTS/STT | Both | Multi-provider voice tools |
| 19 | Cross-Platform Messaging | VPK-Rovo | Outbound notifications (Slack, email) |
| 20 | Browser Multi-Provider | ACRA | Browserbase, Camofox backends |

### Out of Scope

- Home Assistant (too specialized)
- Batch trajectory generation (training-only)
- RL training integration (research-only)
- Multi-platform messaging gateway (VPK-Rovo is web-only)
- CLI/TUI features (web UI only)
- Docker/systemd deployment (different infra model)

---

## 4. Architecture

### Principle

```
RovoDev Serve (ACRA)     = agent runtime + tool execution + safety
VPK-Rovo orchestration   = context assembly + scheduling + persistence + UI
Hermes                   = capability substrate (memory files, skills, config)
```

### Integration Boundary

| Concern | Owner | Layer |
|---------|-------|-------|
| Agent loop, LLM calls, tool dispatch | ACRA | Runtime |
| Context compression, safety checks | ACRA | Runtime |
| Session search, checkpoints | ACRA (tool) + VPK-Rovo (UI) | Both |
| Memory/skills injection, jobs | VPK-Rovo | Orchestration |
| Hermes file stores (~/.hermes/) | Hermes | Substrate |

### Request Flow (after integration)

```
User input
  → VPK-Rovo frontend
  → VPK-Rovo backend (context assembly, memory/skills injection)
  → RovoDev Serve
    → [NEW] Safety checks (command approval, secret redaction)
    → [NEW] Context compression (if needed)
    → LLM inference
    → Tool execution
    → [NEW] Checkpoint before destructive tools
  → SSE stream back
  → VPK-Rovo (parse, render, persist)
```

---

## 5. Implementation Plan

### Phase 1: Core Safety & Context (Tier 1)

#### 1. Context Compression (ACRA)

**Create**: `packages/code-nemo/src/nemo/pruners/compression_pruner.py`

- Structured summary template:
  ```
  # Conversation Summary
  ## Goal: {what the user is trying to accomplish}
  ## Progress: {what has been done so far}
  ## Key Decisions: {important choices made}
  ## Files Modified: {list of files touched}
  ## Next Steps: {what remains to be done}
  ```
- Threshold-based trigger (configurable %, default 50% of context window)
- Iterative summary updates on subsequent compressions
- Tool output pruning before summarization (cost optimization)
- Configurable tail protection by token budget

**Modify**: `packages/code-nemo/src/nemo/core/agent_runner.py` — wire into pruner chain

**Config**:
```yaml
agent:
  context_compression:
    enabled: true
    threshold: 0.5  # trigger at 50% of context window
    tail_tokens: 4000  # protect recent messages
```

#### 2. Session Search (ACRA + VPK-Rovo)

**ACRA — Create**: `packages/code-nemo/src/nemo/tools/session_search.py`
- SQLite FTS5 index of session transcripts
- Auto-index on session save
- Top N results (default 3) with LLM summarization via auxiliary model
- Truncation around matches (100K chars max)

**VPK-Rovo — Create**: `backend/lib/hermes-session-search.js`
- `/api/sessions/search?q=` endpoint
- Proxy to RovoDev session search or local FTS implementation

**VPK-Rovo — Modify**: Rovo App sidebar with search input

**Config**:
```yaml
sessions:
  enable_search: true
  search_db_path: ~/.rovodev/sessions.db
```

#### 3. Dangerous Command Approval (ACRA)

**Create**: `packages/code-nemo/src/nemo/safety/command_approval.py`

- Default patterns:
  ```python
  DANGEROUS_PATTERNS = [
      r'rm\s+(-rf?|--recursive)',
      r'sudo\s+',
      r'DROP\s+(TABLE|DATABASE)',
      r'TRUNCATE\s+',
      r'kill\s+-9',
      r'chmod\s+777',
      r'mkfs\.',
      r'dd\s+if=',
      r'>\s*/dev/',
      r'git\s+push\s+.*--force',
      r'git\s+reset\s+--hard',
  ]
  ```
- Hook into `CallToolsNode` — intercept bash/terminal tool calls
- Emit pause event via existing SSE mechanism
- Customizable allowlist for trusted patterns

**Config**:
```yaml
safety:
  command_approval:
    enabled: true
    patterns: []  # additional custom patterns
    allowlist: [] # always-allowed commands
```

#### 4. Secret Exfiltration Blocking (ACRA)

**Create**: `packages/code-nemo/src/nemo/safety/redact.py`

- Patterns:
  ```python
  SECRET_PATTERNS = [
      (r'(?:AKIA|ASIA)[A-Z0-9]{16}', 'AWS Access Key'),
      (r'sk-[a-zA-Z0-9]{20,}', 'OpenAI API Key'),
      (r'sk-ant-[a-zA-Z0-9-]{20,}', 'Anthropic API Key'),
      (r'ghp_[a-zA-Z0-9]{36,}', 'GitHub PAT'),
      (r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----', 'Private Key'),
      (r'(?:postgres|mysql|mongodb)://\S+:\S+@', 'Database URL'),
      (r'Bearer\s+[a-zA-Z0-9._-]{20,}', 'Bearer Token'),
  ]
  ```
- Hook into tool result processing (before content reaches LLM)
- Redact with `[REDACTED: {type}]` placeholder
- Configurable: block vs redact vs warn

**Modify**: `packages/code-nemo/src/nemo/core/agent_runner.py` — post-tool-result hook

**Config**:
```yaml
safety:
  redaction:
    enabled: true
    mode: redact  # redact | block | warn
    patterns: []  # additional custom patterns
```

#### 5. Checkpoint & Rollback (ACRA + VPK-Rovo)

**ACRA — Create**: `packages/code-nemo/src/nemo/tools/checkpoint.py`
- Git-based snapshots (git stash create + ref storage)
- Tar-based fallback for non-git workspaces
- Named checkpoints with metadata (timestamp, description, trigger)
- Auto-checkpoint before destructive tool calls
- Max checkpoint retention (default 10, LRU cleanup)

**VPK-Rovo — Create**: `backend/lib/hermes-checkpoints.js`
- `/api/checkpoints` — list, create, rollback, delete
- Checkpoint timeline component in Rovo App

**Config**:
```yaml
tools:
  checkpoint:
    enabled: true
    auto_checkpoint: true  # before destructive ops
    max_checkpoints: 10
```

#### 6. Skills Hub (ACRA + VPK-Rovo)

**ACRA — Create**: `packages/code-nemo/src/nemo/tools/skills_hub.py`
- agentskills.io API client (search, browse, inspect)
- Skill bundle download and extraction
- Path traversal validation
- Fuzzy matching for skill lookup

**VPK-Rovo — Create**: `backend/lib/hermes-skills-hub.js`
- `/api/skills/hub/search?q=` — search hub
- `/api/skills/hub/install` — install skill by name
- `/api/skills/hub/popular` — trending skills

**VPK-Rovo — Modify**: `components/projects/control-plane/skills-surface.tsx`
- New "Hub" tab alongside existing skills list
- Search + install UI with skill cards

### Phase 2: Advanced Capabilities (Tier 2)

#### 7. Code Execution Sandbox (ACRA)

**Create**: `packages/code-nemo/src/nemo/tools/code_sandbox.py`
- Unix Domain Socket RPC server
- Auto-generated `agent_tools.py` stubs with allowed tools
- Resource limits: 300s timeout, 50K stdout, 10K stderr
- Subprocess isolation

#### 8. Mixture of Agents (ACRA)

**Create**: `packages/code-nemo/src/nemo/tools/mixture_of_agents.py`
- Parallel expert dispatch via asyncio.TaskGroup
- Consensus aggregation prompt
- Configurable expert count (default 3) and model selection

#### 9. Credential Pool (ACRA)

**Create**: `packages/code-nemo/src/nemo/providers/credential_pool.py`
- Thread-safe key tracking with usage counts
- Least-used selection strategy
- 401 detection and automatic key rotation
- Config per provider

#### 10. Pluggable Memory Providers (ACRA + VPK-Rovo)

**ACRA — Create**: `packages/code-nemo/src/nemo/memory/provider.py`
- `MemoryProvider` ABC: `prefetch()`, `sync()`, `on_write()`, `on_compress()`, `get_system_block()`
- Built-in file provider
- Plugin discovery via entry points

**VPK-Rovo**: Memory provider selector in settings

#### 11. Prompt Caching (ACRA)

**Modify**: Anthropic provider in `packages/code-nemo/src/nemo/providers/`
- Inject `cache_control: {"type": "ephemeral"}` on system prompt and tool definitions
- Track cache hit/miss in usage metrics

#### 12. Extended Thinking (ACRA + VPK-Rovo)

**Modify**: Agent runner and prompt builder
- `reasoning_effort` parameter (none/low/medium/high/xhigh)
- Thinking block preservation across tool call boundaries
- VPK-Rovo: Toggle in agent mode selector

### Phase 3: Deferred to future spec (Tier 3, items 13-20)

---

## 6. Files Summary

### Create (Phase 1)

| File | Repo | Purpose |
|------|------|---------|
| `nemo/pruners/compression_pruner.py` | ACRA | Context compression |
| `nemo/tools/session_search.py` | ACRA | FTS5 session search |
| `nemo/safety/command_approval.py` | ACRA | Dangerous command detection |
| `nemo/safety/redact.py` | ACRA | Secret exfiltration blocking |
| `nemo/tools/checkpoint.py` | ACRA | Workspace checkpoints |
| `nemo/tools/skills_hub.py` | ACRA | Skills hub client |
| `backend/lib/hermes-session-search.js` | VPK-Rovo | Session search endpoint |
| `backend/lib/hermes-checkpoints.js` | VPK-Rovo | Checkpoints endpoint |
| `backend/lib/hermes-skills-hub.js` | VPK-Rovo | Skills hub endpoint |
| Tests for each module | Both | Verification |

### Modify (Phase 1)

| File | Repo | Change |
|------|------|--------|
| `nemo/core/agent_runner.py` | ACRA | Hook safety checks, compression |
| `nemo/core/agent_definition.py` | ACRA | Register new tools |
| `rovodev/common/config.py` | ACRA | Add config sections |
| `rovodev/commands/serve/v3/endpoints.py` | ACRA | Expose new endpoints |
| `backend/server.js` | VPK-Rovo | Wire new endpoints |
| `control-plane/skills-surface.tsx` | VPK-Rovo | Skills hub tab |
| `rovo-app-sidebar.tsx` | VPK-Rovo | Session search UI |

### Unchanged

All existing Hermes modules stay in place:
- `hermes-memory.js`, `hermes-skills.js`, `hermes-config.js`
- `hermes-jobs-local.js`, `hermes-jobs-provider.js`, `hermes-job-links.js`
- `hermes-rovo-context.js`, `hermes-rovo-job-sync.js`
- `hermes-memory-companion.js`, `rovo-task-executor.js`
- `hermes-status.js`, `runtime-status.js`

---

## 7. Testing Strategy

### ACRA

- Unit tests per module (pytest)
- Safety tests with known secret patterns and dangerous commands
- Compression tests with token counting
- Session search tests with FTS5 queries

### VPK-Rovo

- Backend tests: `node --test backend/lib/hermes-*.test.js`
- Lint: `pnpm run lint`
- Typecheck: `pnpm tsc --noEmit`
- Visual verification via `/agent-browser`

### Integration

- End-to-end: VPK-Rovo → RovoDev Serve with new features enabled
- Safety: Submit fake API keys, verify redaction
- Checkpoints: Create checkpoint, make destructive change, rollback

---

## 8. Boundaries

### Always Do
- Keep RovoDev Serve as the only executor
- Use existing ACRA patterns (PydanticAI, callbacks, config system)
- Use existing VPK-Rovo patterns (hermes-*.js modules, Express endpoints)
- Write tests for every new module
- Make features opt-in via config

### Ask First
- Changes to the agent loop core (`agent_runner.py`)
- New dependencies in either repo
- Changes to SSE event format (affects all clients)
- Breaking changes to existing APIs

### Never Do
- Make Hermes the executor
- Remove or bypass RovoDev Serve
- Clone Hermes wholesale — cherry-pick and adapt
- Add features without config toggles
- Modify existing Hermes integration modules without need

---

## 9. Acceptance Criteria

### Phase 1 Complete When

- [ ] Context compression auto-summarizes at threshold; summary is structured and accurate
- [ ] Session search returns relevant past sessions with summaries
- [ ] Dangerous commands trigger approval flow; approved commands proceed
- [ ] Secrets in tool output are redacted before reaching LLM
- [ ] Checkpoints can be created, listed, and rolled back
- [ ] Skills hub search returns results; install places skill in correct directory
- [ ] All tests pass in both repos
- [ ] All features are opt-in via config with sensible defaults

### Phase 2 Complete When

- [ ] Code sandbox executes Python with tool access via RPC
- [ ] Mixture of agents returns consensus from multiple models
- [ ] Credential pool rotates keys and handles 401s
- [ ] Memory providers are pluggable with built-in file provider
- [ ] Prompt caching reduces token costs on Anthropic
- [ ] Extended thinking is configurable and preserves thinking blocks
