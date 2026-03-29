# Deferred Tools in `rovodev serve`: `ask_user_questions` & `exit_plan_mode`

## Overview

In `rovodev serve`, these two tools are **deferred** — the server does NOT resolve them itself. The server pauses the agent, emits the tool call over SSE, and waits for **your client app** to render UI, collect user input, and POST the result back.

---

## How It Works Across Runtimes

| Runtime | Who handles the UI | Mechanism |
|---|---|---|
| **TUI** | TUI itself (Textual widgets) | `@deferred_tool_handler` registry + `threading.Event` |
| **CLI `run`** | CLI itself (prompt-toolkit menus) | Inline `if/elif` in `_handle_deferred_tools()` |
| **`rovodev serve`** | **Your client app** | SSE event → client renders UI → POST result back |

---

## Step-by-Step Flow for `rovodev serve`

### 1. Opt-in to Deferred Tools

When calling `GET /stream_chat` (v3), pass the query parameter:

```
GET /stream_chat?enable_deferred_tools=true
```

Without this flag, both `ask_user_questions` and `exit_plan_mode` are **disabled** (added to the agent's `disabled_tools` set) and will never fire.

---

### 2. Receive the Deferred Tool Request via SSE

The SSE stream emits a `DeferredToolRequests` event. The agent then **pauses** — no further tokens until your client responds.

**For `ask_user_questions`:**
```json
{
  "calls": [
    {
      "tool_name": "ask_user_questions",
      "tool_call_id": "some-uuid",
      "args": {
        "questions": [
          {
            "header": "Scope",
            "question": "What kind of change is this?",
            "options": [
              { "label": "Bug Fix", "description": "Fix a broken thing" },
              { "label": "New Feature", "description": "Add something new" }
            ]
          }
        ]
      }
    }
  ]
}
```

**For `exit_plan_mode`:**
```json
{
  "calls": [
    {
      "tool_name": "exit_plan_mode",
      "tool_call_id": "some-uuid",
      "args": {
        "plan": "## Step 1\nDo X\n\n## Step 2\nDo Y"
      }
    }
  ]
}
```

---

### 3. Your App Renders UI

**For `ask_user_questions`:**
- Parse `args.questions[]` — each item has:
  - `header`: short label shown above the question (this is also the **key** in the result dict)
  - `question`: the question text
  - `options[]`: 1–4 options, each with `label` (short) and `description` (detailed)
- The number of questions per call is unconstrained (can be 1 or many)
- ⚠️ **An "Other (enter custom input)" option is automatically appended to every question by the tool.** Do NOT add your own "Other" option. If the user selects "Other", they type a free-text answer — your result should include that custom string instead of a predefined label.
- Render a multi-choice UI (radio buttons, dropdown, etc.) for each question, one at a time or all at once

**For `exit_plan_mode`:**
- Parse `args.plan` — a markdown string
- Render the plan (e.g. as formatted markdown)
- ⚠️ **This tool only fires when the agent is in PLAN mode.** If called outside PLAN mode the tool raises a `ModelRetry` error internally.
- Show a two-stage UI:
  - **Stage 1 — Approve or Edit:**
    - "Yes, let's do it!" → return `"Accept."` (exact string, canonical accept value)
    - "No, I want to edit the plan" → proceed to Stage 2
  - **Stage 2 — Feedback form:**
    - Show a free-text input for the user to describe what they'd like changed
    - Return the feedback string as the result — the agent stays in PLAN mode and will revise accordingly

---

### 4. Submit the Result Back

#### V3 — Two-step

**Step 1:** POST the result:
```http
POST /set_chat_message
Content-Type: application/json

{
  "message": {
    "tool_call_id": "<tool_call_id from the SSE event>",
    "result": <your result value>
  }
}
```

**Step 2:** Resume streaming:
```
GET /stream_chat?enable_deferred_tools=true
```

#### V2 — One-step

```http
POST /chat
Content-Type: application/json

{
  "message": {
    "tool_call_id": "<tool_call_id from the SSE event>",
    "result": <your result value>
  }
}
```

---

### 5. Result Format by Tool

| Tool | Result type | Example |
|---|---|---|
| `ask_user_questions` | `dict[str, list[str]]` — keyed by `question.header`, value is a list containing the selected `label` (or custom text if "Other" chosen) | `{"Scope": ["Bug Fix"]}` or `{"Scope": ["My custom answer"]}` |
| `exit_plan_mode` | `string` | `"Accept."` (approve), `"Please also handle edge cases"` (feedback), or `"User cancelled plan review"` (cancelled) |

**Cancellation result strings (when user dismisses without responding):**

| Tool | Cancellation result |
|---|---|
| `ask_user_questions` | `"User did not respond to questions"` |
| `exit_plan_mode` | `"User cancelled plan review"` |

> These strings are what the TUI/CLI return when the user hits Escape. For `rovodev serve`, if the user abandons the deferred tool, call `POST /cancel` instead — the server writes `"User cancelled the request"` into message history directly (bypassing `DeferredToolResults`).

---

### 6. Handle Cancellation

If the user dismisses the deferred tool (e.g. starts typing a new message before answering), call:

```http
POST /cancel
```

The server will write synthetic `ToolReturnPart("User cancelled the request")` entries into message history and unblock the agent so it can accept a fresh prompt.

> **Note:** If you call `POST /chat` (v2) or `GET /stream_chat` (v3) while a deferred tool is still pending and you don't provide a `DeferredToolResponse`, the server returns **HTTP 404** with `"Pending deferred tool request found"`.

---

## Key Constraints & Gotchas

- **`enable_deferred_tools=true` is required** on every `stream_chat` call — both when first requesting and when resuming after a deferred tool response.
- **One `tool_call_id` per response** — respond to each deferred tool call individually using its specific `tool_call_id`.
- **`exit_plan_mode` has a server-side side effect:** when `"Accept."` is returned, the server automatically transitions the agent mode from `PLAN` → `DEFAULT`.
- **`exit_plan_mode` is PLAN mode only:** the tool raises `ModelRetry` if called outside PLAN mode, so it will never appear in a normal DEFAULT mode session.
- **Options constraints:** 1–4 options per question; the number of questions per `ask_user_questions` call is not fixed.
- **"Other" is auto-added:** every `ask_user_questions` question gets an automatic "Other (enter custom input)" option — do not add your own.
- **`exit_plan_mode` missing plan:** if the agent calls `exit_plan_mode` without a `plan` arg, `args.plan` will be `null` — your UI should handle this gracefully (e.g. show `"(no plan provided)"`).
- **How deferral works internally:** both tools raise `raise CallDeferred()` (a pydantic-ai mechanism) inside their tool function body. This causes pydantic-ai to emit a `DeferredToolRequests` event and pause the agent run — there is no real tool logic server-side. All resolution is external.

---

## Data Models (Python reference)

```python
# What the server accepts back
class DeferredToolResponse(BaseModel):
    tool_call_id: str
    result: Any  # dict for ask_user_questions, str for exit_plan_mode

class ChatRequest(BaseModel):
    message: str | DeferredToolResponse
    ...

# Shape of ask_user_questions args
class QuestionOption(BaseModel):
    label: str        # Short label, 1–5 words
    description: str  # Detailed explanation

class Question(BaseModel):
    header: str              # Short label shown above the question
    question: str            # The question text
    options: list[QuestionOption]  # 1–4 options

class QuestionsInput(BaseModel):
    questions: list[Question]
```

---

## Minimal Client Implementation Checklist

- [ ] Pass `?enable_deferred_tools=true` on every `GET /stream_chat` call
- [ ] Detect `DeferredToolRequests` events in SSE stream by checking `tool_name`
- [ ] Store `tool_call_id` — needed for the response
- [ ] For `ask_user_questions`: render each question's options and collect selections
- [ ] For `exit_plan_mode`: render markdown plan and show approve/feedback UI
- [ ] POST result back via `DeferredToolResponse` with `{ tool_call_id, result }`
- [ ] Handle cancellation with `POST /cancel` if user abandons the deferred tool
- [ ] Guard against receiving a new chat request while a deferred tool is pending
