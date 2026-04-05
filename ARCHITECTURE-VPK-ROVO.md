# VPK-Rovo Architecture: Hermes Agent + Future-Chat Integration

> **Status:** Brainstorm / Prototype Design  
> **Date:** 2026-04-05  
> **Goal:** Use VPK-Rovo (cloned from VPK-rovodev) as the primary web GUI for Hermes Agent, with rovo-app as the main messaging interface.

---

## 1. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     VPK-Rovo (Next.js)                       │
│                                                              │
│  ┌──────────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐  │
│  │  rovo-app │  │ Memories  │  │  Skills  │  │  Cron  │  │
│  │  (messaging) │  │ (panel)   │  │ (browser)│  │ (mgmt) │  │
│  └──────┬───────┘  └─────┬─────┘  └────┬─────┘  └───┬────┘  │
│         │                │             │             │       │
│  ┌──────▼────────────────▼─────────────▼─────────────▼────┐  │
│  │              VPK-Rovo Backend (Node.js)                 │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐  │  │
│  │  │  SSE Bridge  │  │ REST Proxy  │  │ Session Mgr   │  │  │
│  │  │  OpenAI →    │  │ /memories   │  │ threadId ↔    │  │  │
│  │  │  AI SDK fmt  │  │ /skills     │  │ hermesSession │  │  │
│  │  │              │  │ /jobs       │  │               │  │  │
│  │  └──────┬───────┘  └──────┬──────┘  └──────┬────────┘  │  │
│  └─────────┼─────────────────┼─────────────────┼───────────┘  │
└────────────┼─────────────────┼─────────────────┼──────────────┘
             │                 │                 │
             ▼                 ▼                 ▼
┌────────────────────────────────────────────────────────────────┐
│                 Hermes Agent (Local, port 8080)                │
│                                                                │
│  POST /v1/chat/completions   (SSE streaming, OpenAI-compat)   │
│  GET  /v1/models             (available models)                │
│  POST /v1/responses          (stored responses)                │
│  GET  /v1/jobs               (cron CRUD)                       │
│  POST /v1/jobs                                                 │
│  PATCH /v1/jobs/{id}                                           │
│  DELETE /v1/jobs/{id}                                           │
│  POST /v1/jobs/{id}/run      (trigger now)                     │
│  GET  /health                                                  │
│  + memory via tool calls in conversation                       │
│  + skills via tool calls + file-based discovery                │
└────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **VPK-Rovo frontend** (Next.js) renders the chat UI, memory panel, skills browser, and cron manager
2. **VPK-Rovo backend** (Node.js/Express) acts as a thin proxy + SSE protocol translator
3. **Hermes Agent** runs locally as the AI backend — handles LLM inference, tool execution, memory, skills, and cron

---

## 2. Authentication (Local Prototype)

Since everything runs locally, **no auth token is needed**.

Hermes API server's `_check_auth()` method allows all requests when no `api_key` is configured:

```python
# gateway/platforms/api_server.py
def _check_auth(self, request):
    if not self._api_key:
        return None  # No key configured — allow all requests
```

**For the prototype:**
- Omit `api_key` from Hermes gateway config (or set it to empty string)
- VPK-Rovo backend connects to `http://localhost:8080` without auth headers
- No CORS issues since backend-to-backend (Node.js → Hermes), not browser-to-Hermes

**If you later want basic security** (e.g., shared machine):
- Set `api_key: "some-local-secret"` in Hermes config
- Store the same secret in VPK-Rovo's `.env.local` as `HERMES_API_KEY`
- Backend passes it as `Authorization: Bearer ${process.env.HERMES_API_KEY}`

---

## 3. SSE Bridge: The Core Integration Piece

The bridge translates Hermes's OpenAI-format SSE into AI SDK's `uiMessageChunkSchema` that rovo-app expects.

### 3.1 Format Translation

```
Hermes SSE (OpenAI format)                    AI SDK format (VPK expects)
──────────────────────────────────            ──────────────────────────────────
data: {"choices":[{                           data: {"type":"text",
  "delta":{"content":"Hello"}}]}                    "text":"Hello"}

data: {"choices":[{                           data: {"type":"tool-call",
  "delta":{"tool_calls":[{                          "toolName":"bash",
    "index":0,                                      "args":"{\"cmd\":\"ls\"}",
    "function":{                                    "toolCallId":"call_abc123"}
      "name":"bash",
      "arguments":"{\"cmd\":\"ls\"}"
    },
    "id":"call_abc123"
  }]}}]}

data: {"choices":[{                           data: {"type":"tool-result",
  "delta":{"role":"tool",                           "toolName":"bash",
    "tool_call_id":"call_abc123",                   "toolCallId":"call_abc123",
    "content":"file1.txt\nfile2.txt"}}]}            "result":"file1.txt\nfile2.txt"}

data: [DONE]                                  data: {"type":"finish",
                                                    "finishReason":"stop"}
```

### 3.2 Bridge Implementation (Node.js)

Lives in `backend/lib/hermes-sse-bridge.js`:

```javascript
import { Transform } from 'stream';

const HERMES_BASE_URL = process.env.HERMES_URL || 'http://localhost:8080';

/**
 * Proxy a chat request to Hermes and transform the SSE stream
 * from OpenAI format to AI SDK uiMessageChunkSchema format.
 */
export async function streamHermesChat(req, res) {
  const { messages, threadId, model } = req.body;

  const hermesRes = await fetch(`${HERMES_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hermes-Session-Id': threadId || '',
    },
    body: JSON.stringify({
      messages,
      model: model || undefined,
      stream: true,
    }),
  });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const reader = hermesRes.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') {
        res.write(`data: ${JSON.stringify({ type: 'finish', finishReason: 'stop' })}\n\n`);
        continue;
      }

      try {
        const chunk = JSON.parse(data);
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        // Text delta
        if (delta.content) {
          res.write(`data: ${JSON.stringify({ type: 'text', text: delta.content })}\n\n`);
        }

        // Tool call
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            res.write(`data: ${JSON.stringify({
              type: 'tool-call',
              toolName: tc.function?.name || '',
              args: tc.function?.arguments || '',
              toolCallId: tc.id || '',
            })}\n\n`);
          }
        }
      } catch (e) {
        // skip malformed chunks
      }
    }
  }

  res.end();
}
```

### 3.3 Session Mapping

| Concept | VPK-Rovo | Hermes |
|---------|----------|--------|
| Conversation ID | `threadId` (URL path param) | `X-Hermes-Session-Id` header |
| Storage | Backend thread manager | Hermes SessionDB (SQLite) |
| History | Managed by backend | Managed by Hermes |

**Strategy:** Use the VPK thread ID directly as the Hermes session ID. Pass it via the `X-Hermes-Session-Id` header. Hermes will create/resume sessions automatically.

---

## 4. Memory UI Design

### 4.1 How Hermes Memory Works

Hermes uses a simple file-based memory system:

- **Storage:** Plain text files at `~/.hermes/memories/`
- **Two targets (collections):**
  - `MEMORY.md` — Agent's personal notes (environment facts, project conventions, lessons learned). Limit: 2200 chars.
  - `USER.md` — User profile (name, preferences, communication style). Limit: 1375 chars.
- **Entry format:** Plain text entries separated by `\n§\n` delimiters
- **No IDs, timestamps, or tags** — entries are raw text strings
- **Injected into system prompt** at session start as a formatted block

Example on-disk format (`~/.hermes/memories/MEMORY.md`):
```
User prefers TypeScript over JavaScript
§
Project uses pnpm, not npm
§
Always run tests before committing
```

### 4.2 Memory API (New VPK-Rovo Backend Endpoints)

Since Hermes doesn't expose memory via REST, the VPK-Rovo backend reads/writes the memory files directly (they're local files):

```
GET    /api/memories                → List all memory targets with entries
GET    /api/memories/:target        → Get entries for a target (memory | user)
PUT    /api/memories/:target        → Replace all entries for a target
POST   /api/memories/:target/entry  → Add a single entry
DELETE /api/memories/:target/entry  → Remove an entry (by content match)
```

**Response format:**
```json
// GET /api/memories
{
  "targets": [
    {
      "name": "memory",
      "label": "Agent Memory",
      "description": "Personal notes, facts, and lessons learned",
      "maxChars": 2200,
      "usedChars": 847,
      "entries": [
        "User prefers TypeScript over JavaScript",
        "Project uses pnpm, not npm",
        "Always run tests before committing"
      ]
    },
    {
      "name": "user",
      "label": "User Profile",
      "description": "Name, preferences, communication style",
      "maxChars": 1375,
      "usedChars": 234,
      "entries": [
        "Name: Esoh",
        "Prefers concise responses with code examples"
      ]
    }
  ]
}
```

### 4.3 Memory UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│  🧠 Memories                                    [Edit] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Agent Memory ──────────────────── 847/2200 chars ─┐ │
│  │                                          ████░░░░░ │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ User prefers TypeScript over JavaScript   [×]│   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ Project uses pnpm, not npm                [×]│   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ Always run tests before committing        [×]│   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  │                                                     │ │
│  │  [+ Add memory]                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ User Profile ──────────────────── 234/1375 chars ─┐ │
│  │                                          ██░░░░░░░ │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ Name: Esoh                                [×]│   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  │  ┌──────────────────────────────────────────────┐   │ │
│  │  │ Prefers concise responses with code ...   [×]│   │ │
│  │  └──────────────────────────────────────────────┘   │ │
│  │                                                     │ │
│  │  [+ Add entry]                                      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Memory UI Components

| Component | Description | Reusable from VPK |
|-----------|-------------|-------------------|
| `MemoryPanel` | Full memory page/drawer with both targets | New, uses `panel.tsx` shell |
| `MemoryTargetCard` | One collapsible card per target (memory/user) with usage bar | New |
| `MemoryEntry` | Single entry with inline edit and delete | Adapt from `sources.tsx` pattern |
| `MemoryUsageBar` | Character usage progress bar | New, simple `<progress>` |
| `AddMemoryDialog` | Textarea dialog for adding a new entry | Adapt from existing dialog components |

### 4.5 Memory Integration with Chat

The agent can also manage memories during conversation via tool calls. When the agent calls `memory_add`, `memory_replace`, or `memory_remove`, the tool call shows in the chat UI (using the existing `tool.tsx` component), and the Memory Panel can refresh to reflect changes.

```
Chat message:  "I'll remember that you prefer dark mode."
Tool call:     memory_add(target="user", content="Prefers dark mode UI themes")
               → shown as a collapsible tool call card in chat
Memory Panel:  Auto-refreshes to show the new entry
```

---

## 5. Skills UI Design

### 5.1 How Hermes Skills Work

Skills are markdown documents with YAML frontmatter stored on disk:

- **Location:** `~/.hermes/skills/<category>/<skill-name>/SKILL.md`
- **Discovery:** Recursive scan for `SKILL.md` files
- **Frontmatter fields:**

```yaml
---
name: apple-reminders
description: Manage Apple Reminders via remindctl CLI
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [macos]
metadata:
  hermes:
    tags: [Reminders, tasks, todo, macOS, Apple]
prerequisites:
  commands: [remindctl]
---

# Apple Reminders Skill

Instructions for the agent on how to use this skill...
```

- **Categories** derived from directory structure: `apple`, `creative`, `github`, `mlops`, `productivity`, `research`, etc.
- **Enable/disable** per platform via `config.yaml`

### 5.2 Skills API (New VPK-Rovo Backend Endpoints)

The backend reads skill files directly from `~/.hermes/skills/`:

```
GET    /api/skills                     → List all skills with metadata
GET    /api/skills/:category           → List skills in a category
GET    /api/skills/:category/:name     → Get full skill content
POST   /api/skills/:category/:name/toggle → Enable/disable a skill
POST   /api/skills/install             → Install from Skills Hub (future)
```

**Response format:**
```json
// GET /api/skills
{
  "categories": [
    {
      "name": "apple",
      "skills": [
        {
          "name": "apple-reminders",
          "description": "Manage Apple Reminders via remindctl CLI",
          "version": "1.0.0",
          "author": "Hermes Agent",
          "tags": ["Reminders", "tasks", "todo", "macOS"],
          "platforms": ["macos"],
          "enabled": true,
          "path": "apple/apple-reminders"
        },
        {
          "name": "apple-notes",
          "description": "Read and search Apple Notes",
          "version": "1.0.0",
          "author": "Hermes Agent",
          "tags": ["Notes", "Apple"],
          "platforms": ["macos"],
          "enabled": true,
          "path": "apple/apple-notes"
        }
      ]
    },
    {
      "name": "github",
      "skills": [...]
    }
  ]
}
```

### 5.3 Skills UI Mockup

```
┌──────────────────────────────────────────────────────────────┐
│  🧩 Skills                              [Search...] [Hub ↗] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Categories: [All] [Apple] [Creative] [GitHub] [MLOps] ...   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🍎 apple-reminders                          [Enabled ✓]│  │
│  │ Manage Apple Reminders via remindctl CLI               │  │
│  │ v1.0.0 · by Hermes Agent · macOS                      │  │
│  │ Tags: Reminders, tasks, todo                    [View] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🍎 apple-notes                              [Enabled ✓]│  │
│  │ Read and search Apple Notes                            │  │
│  │ v1.0.0 · by Hermes Agent · macOS                      │  │
│  │ Tags: Notes, Apple                              [View] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 🎨 ascii-art                               [Disabled ○]│  │
│  │ Generate ASCII art from text descriptions              │  │
│  │ v1.0.0 · by Hermes Agent · all platforms              │  │
│  │ Tags: ASCII, art, creative                      [View] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ─────── Showing 12 of 45 skills ─────── [Load more]        │
└──────────────────────────────────────────────────────────────┘
```

**Skill Detail View** (when clicking [View]):

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Skills                                            │
│                                                              │
│  🍎 apple-reminders                            [Enabled ✓]  │
│  Manage Apple Reminders via remindctl CLI                    │
│  ─────────────────────────────────────────────────────────── │
│  Version: 1.0.0    Author: Hermes Agent    License: MIT     │
│  Platforms: macOS   Prerequisites: remindctl                 │
│  Tags: Reminders · tasks · todo · macOS · Apple              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  # Apple Reminders Skill                                     │
│                                                              │
│  This skill allows the agent to manage your Apple            │
│  Reminders. It can:                                          │
│  - List all reminder lists and items                         │
│  - Add new reminders with due dates                          │
│  - Complete or delete existing reminders                     │
│  ...                                                         │
│  (rendered markdown)                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 Skills UI Components

| Component | Description | Reusable from VPK |
|-----------|-------------|-------------------|
| `SkillsPage` | Main skills browser with category filter and search | New page |
| `SkillCategoryTabs` | Horizontal tab/pill filter for categories | Adapt from existing tab components |
| `SkillCard` | Card showing skill name, description, version, toggle | New, similar to `package-info.tsx` |
| `SkillDetailView` | Full skill page with rendered markdown content | Adapt from `artifact.tsx` pattern |
| `SkillToggle` | Enable/disable switch | Use `ui/switch.tsx` |
| `SkillSearch` | Search input filtering skills by name/tag/description | Use `ui/input.tsx` |

---

## 6. Cron Job Manager UI Design

### 6.1 How Hermes Cron Works

Hermes has a full cron job system with REST API:

**Job structure:**
```json
{
  "id": "uuid",
  "name": "Daily standup summary",
  "schedule": {
    "type": "cron",
    "value": "0 9 * * 1-5"
  },
  "action": {
    "type": "agent",
    "prompt": "Summarize my calendar for today and list top priorities",
    "skills": ["google-workspace"],
    "model": "claude-sonnet-4-20250514"
  },
  "delivery": {
    "platform": "slack",
    "channel": "#standup"
  },
  "enabled": true,
  "next_run_at": "2026-04-06T09:00:00Z",
  "last_run_at": "2026-04-05T09:00:00Z",
  "last_error": null
}
```

### 6.2 Cron API (Direct Proxy to Hermes)

These are straight proxies — Hermes already has the REST endpoints:

```
GET    /api/jobs              → Hermes GET  /v1/jobs
POST   /api/jobs              → Hermes POST /v1/jobs
GET    /api/jobs/:id          → Hermes GET  /v1/jobs/:id
PATCH  /api/jobs/:id          → Hermes PATCH /v1/jobs/:id
DELETE /api/jobs/:id          → Hermes DELETE /v1/jobs/:id
POST   /api/jobs/:id/run      → Hermes POST /v1/jobs/:id/run
POST   /api/jobs/:id/pause    → Hermes POST /v1/jobs/:id/pause
POST   /api/jobs/:id/resume   → Hermes POST /v1/jobs/:id/resume
```

### 6.3 Cron UI Mockup

```
┌──────────────────────────────────────────────────────────────┐
│  ⏰ Scheduled Jobs                              [+ New Job]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ● Daily standup summary                    [Enabled ✓] │  │
│  │ "Summarize my calendar for today..."                   │  │
│  │ ⏱ Every weekday at 9:00 AM  · 📤 #standup (Slack)     │  │
│  │ Last run: Today 9:00 AM ✓   · Next: Tomorrow 9:00 AM  │  │
│  │                                    [Run Now] [Edit] [×] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ● Weekly research digest                   [Enabled ✓] │  │
│  │ "Search arxiv for latest papers on..."                 │  │
│  │ ⏱ Every Monday at 8:00 AM  · 📤 #research (Slack)     │  │
│  │ Last run: Mar 31 8:00 AM ✓  · Next: Apr 6 8:00 AM     │  │
│  │                                    [Run Now] [Edit] [×] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ○ Backup reminders                        [Paused ⏸]  │  │
│  │ "Export all Apple Reminders to..."                     │  │
│  │ ⏱ Every 24h  · 📤 local only                          │  │
│  │ Last run: Apr 1 — Error: timeout  · Next: paused      │  │
│  │                                   [Resume] [Edit] [×]  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.4 Create/Edit Job Dialog

```
┌──────────────────────────────────────────────────────────┐
│  Create Scheduled Job                                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Name:     [Daily standup summary              ]         │
│                                                          │
│  Prompt:   ┌────────────────────────────────────┐        │
│            │ Summarize my calendar for today    │        │
│            │ and list top priorities from Jira  │        │
│            │                                    │        │
│            └────────────────────────────────────┘        │
│                                                          │
│  Schedule: (●) Cron    ( ) Duration                      │
│            [0 9 * * 1-5        ]                         │
│            → "Every weekday at 9:00 AM"                  │
│                                                          │
│  Model:    [claude-sonnet-4-20250514         ▾]                   │
│  Skills:   [google-workspace ×] [+ add]                  │
│                                                          │
│  Deliver to: [Slack ▾]  Channel: [#standup      ]        │
│                                                          │
│                              [Cancel]  [Create Job]      │
└──────────────────────────────────────────────────────────┘
```

---

## 7. VPK-Rovo Backend Endpoints (Complete)

```
# Chat (SSE bridge to Hermes)
POST   /api/chat                    → Hermes /v1/chat/completions (SSE translated)
GET    /api/chat/stream/:threadId   → Resume/poll active stream

# Sessions / Threads
GET    /api/threads                 → List threads (from Hermes SessionDB)
POST   /api/threads                 → Create new thread
GET    /api/threads/:id             → Get thread with messages
DELETE /api/threads/:id             → Delete thread

# Memory (direct file access to ~/.hermes/memories/)
GET    /api/memories                → All targets with entries
GET    /api/memories/:target        → Entries for one target
PUT    /api/memories/:target        → Replace all entries
POST   /api/memories/:target/entry  → Add entry
DELETE /api/memories/:target/entry  → Remove entry by content

# Skills (direct file access to ~/.hermes/skills/)
GET    /api/skills                  → All skills with metadata
GET    /api/skills/:category/:name  → Full skill content
POST   /api/skills/:category/:name/toggle → Enable/disable

# Cron Jobs (proxy to Hermes)
GET    /api/jobs                    → List jobs
POST   /api/jobs                    → Create job
GET    /api/jobs/:id                → Get job
PATCH  /api/jobs/:id                → Update job
DELETE /api/jobs/:id                → Delete job
POST   /api/jobs/:id/run            → Trigger now
POST   /api/jobs/:id/pause          → Pause
POST   /api/jobs/:id/resume         → Resume

# Config & Status
GET    /api/models                  → Hermes /v1/models
GET    /api/status                  → Hermes /health + local state
```

---

## 8. Frontend Pages & Routes

```
app/
  rovo-app/[[...id]]/     ← Main chat interface (modified for Hermes SSE)
  memories/                   ← NEW: Memory browser/editor
  skills/                     ← NEW: Skills browser with categories
  skills/[category]/[name]/   ← NEW: Skill detail view
  cron/                       ← NEW: Cron job manager
  settings/                   ← NEW: Model selection, Hermes config
```

---

## 9. Reusable VPK Components

Existing components from VPK-rovodev that map well to new features:

| Existing Component | Reuse For |
|--------------------|-----------|
| `panel.tsx` | Memory panel shell, skill detail side panel |
| `artifact.tsx` | Skill detail view (rendered markdown) |
| `sources.tsx` | Memory entry list pattern |
| `schema-display.tsx` | Config/metadata display |
| `queue.tsx` | Cron job list |
| `task.tsx` | Cron job card |
| `model-selector.tsx` | Model picker for settings + cron job form |
| `file-tree.tsx` | Skills category tree |
| `tool.tsx` | Tool call rendering in chat |
| `prompt-input.tsx` | Chat input (voice, attachments, text) |
| `message.tsx` | Chat message rendering |
| `confirmation.tsx` | Delete confirmation dialogs |

---

## 10. Implementation Phases

### Phase 1: Chat Core (Get messages flowing)
- [ ] Set up VPK-Rovo backend with Hermes SSE bridge
- [ ] Modify rovo-app to use the bridge
- [ ] Thread ID ↔ Hermes session mapping
- [ ] Text streaming + basic tool call rendering
- [ ] Verify: send message → see streamed response with tool calls

### Phase 2: Model & Session Management
- [ ] Model picker connected to Hermes `/v1/models`
- [ ] Thread list backed by Hermes sessions
- [ ] Thread create/delete
- [ ] Settings page with model selection

### Phase 3: Memory UI
- [ ] Backend endpoints for reading/writing `~/.hermes/memories/`
- [ ] Memory panel component with target cards
- [ ] Add/edit/delete memory entries
- [ ] Usage bar showing chars used vs limit
- [ ] Auto-refresh when agent modifies memories via tool calls

### Phase 4: Skills Browser
- [ ] Backend endpoints for reading `~/.hermes/skills/`
- [ ] Skills list page with category filter
- [ ] Skill detail view with rendered markdown
- [ ] Enable/disable toggle
- [ ] Search by name/tag/description

### Phase 5: Cron Manager
- [ ] Backend proxy to Hermes `/v1/jobs`
- [ ] Job list with status indicators
- [ ] Create/edit job dialog
- [ ] Run Now / Pause / Resume actions
- [ ] Execution history display

---

## 11. Open Questions

1. **Hermes startup:** Should VPK-Rovo auto-start Hermes, or expect it to be running? (Recommend: user starts Hermes separately for the prototype)
2. **Memory plugins:** Should the Memory UI support multiple providers (mem0, honcho) or just the built-in file store? (Recommend: built-in only for prototype)
3. **Skills Hub:** Should the Skills UI support installing new skills from the Hermes Skills Hub? (Recommend: defer to Phase 4+)
4. **Multi-user:** Is this single-user only? (Recommend: yes, for prototype)
5. **Cron delivery:** Cron jobs can deliver to Slack/Discord/etc. Should the UI show delivery results? (Recommend: show last run status only for prototype)

