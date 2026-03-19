---
title: V3 API Reference
description: V3 API Reference
platform: platform
product: rovodev-cli
category: devguide
subcategory: serve
date: '2025-12-01'
---

# V3 API Reference

The V3 API provides enhanced chat functionality with fine-grained control over tool execution, including the ability to pause and approve/deny tool calls before execution.

**Base URL**: `http://localhost:8123/v3/`

## Authentication

All V3 API endpoints require Bearer token authentication. Include the session token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer <session-token>" \
     -H "Content-Type: application/json" \
     -d '{"initial_message": "Hello"}' \
     http://localhost:8123/v3/sessions/create
```

## Key Differences from V2

- **Separated Message Setting**: Use `/set_chat_message` to set the message, then `/stream_chat` to execute
- **Tool Execution Control**: Pause on tool calls and approve/deny them individually
- **Enhanced Workflow**: Better suited for applications requiring human oversight of tool execution
- **Context Support**: Full support for context items (same as V2) in `/set_chat_message`

## Endpoints

### Agent Lifecycle Events

#### GET /v3/agent_lifecycle_events
Stream agent run lifecycle events as Server-Sent Events.

Events:
- `agent_run_start`: Emitted when an agent run starts
- `agent_run_end`: Emitted when an agent run ends (includes task classification data)
- `error`: Emitted when an error occurs

Event data payload example:
```json
{
  "timestamp": 1734312345.123,
  "session_id": "<uuid>",
  "task_status": "TASK_COMPLETED" | "WAITING_FOR_USER",
  "error_message": "string (optional)",
  "error_type": "string (optional)"
}
```

Example:
```bash
curl http://localhost:8123/v3/agent_lifecycle_events --no-buffer
```

### Chat Workflow

#### POST /v3/set_chat_message
Set the chat message to be processed by stream_chat.

**Request Body:**
```json
{
  "message": "string",           // Required: The user's message
  "context": [                   // Optional: Context items to provide additional information
    {
      "type": "note",            // Generic context item
      "content": "string"        // Content of the context item
    },
    {
      "type": "file",            // File context item
      "file_path": "string",     // Path to the file
      "selection": {             // Optional: Specific lines in the file
        "start": 10,             // Start line number
        "end": 20                // End line number
      },
      "note": "string"           // Optional: Description of the file/selection
    }
  ],
  "enable_deep_plan": false      // Optional: Enable technical planning (default: false)
}
```

**Response:**
```json
{
  "response": "Chat message set"  // or "Chat message cleared" if message is empty
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/set_chat_message \
  -H "Content-Type: application/json" \
  -d '{"message": "List files in the project", "enable_deep_plan": false}' | jq .
```

**Example with Context:**
```bash
curl -X POST http://localhost:8123/v3/set_chat_message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Review this code for security issues",
    "context": [
      {
        "type": "instruction",
        "content": "Focus on input validation and authentication"
      },
      {
        "type": "file",
        "file_path": "src/auth/login.py",
        "selection": {
          "start": 25,
          "end": 50
        },
        "note": "Login validation function"
      }
    ],
    "enable_deep_plan": true
  }' | jq .
```

#### GET /v3/stream_chat
Stream chat response for the currently set message.

**Parameters:**
- `pause_on_call_tools_start` (query, optional): Whether to pause when tool execution starts

**Response**: Server-Sent Events stream

**Example:**
```bash
# Basic streaming
curl http://localhost:8123/v3/stream_chat --no-buffer

# With tool execution pausing
curl "http://localhost:8123/v3/stream_chat?pause_on_call_tools_start=true" --no-buffer
```

**Error Responses:**
- **400**: No chat message set (use `/set_chat_message` first)
- **409**: Chat already in progress

#### POST /v3/resume_tool_calls
Resume tool calls that were paused during stream_chat.

**Request Body:**
```json
{
  "decisions": [
    {
      "tool_call_id": "string",           // Required: Tool call ID from pause event
      "deny_message": "string" | null     // Optional: If provided, denies the tool call
    }
  ]
}
```

**Response:**
```json
{
  "message": "resume_tool_calls done"
}
```

**Example:**
```bash
# Approve all tool calls
curl -X POST http://localhost:8123/v3/resume_tool_calls \
  -H "Content-Type: application/json" \
  -d '{
    "decisions": [
      {
        "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP",
        "deny_message": null
      }
    ]
  }' | jq .

# Deny a tool call
curl -X POST http://localhost:8123/v3/resume_tool_calls \
  -H "Content-Type: application/json" \
  -d '{
    "decisions": [
      {
        "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP",
        "deny_message": "File operation not approved"
      }
    ]
  }' | jq .
```

#### POST /v3/replay
Replay endpoint to stream buffered chat events and continue streaming new ones.

**Response**: Server-Sent Events stream

**Example:**
```bash
curl -X POST http://localhost:8123/v3/replay --no-buffer
```

### Session Management

#### GET /v3/sessions/list
List all available sessions.

**Response:**
```json
{
  "sessions": [
    {
      "session_context": {
        "id": "string",
        "message_history": null,
        "usage": {
          "requests": 0,
          "input_tokens": 0,
          "output_tokens": 0,
          "total_tokens": 0,
          "details": {}
        },
        "timestamp": 0,
        "initial_prompt": "string",
        "prompts": ["string"],
        "latest_result": "string",
        "workspace_path": "string",
        "log_dir": "string"
      },
      "title": "string",
      "last_saved": "string",
      "context_limit": 200000,
      "path": "string",
      "parent_session_id": null,
      "num_messages": 0
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8123/v3/sessions/list | jq .
```

#### GET /v3/sessions/current_session
Get information about the current session.

**Response:**
```json
{
  "session_context": {
    "id": "string",
    "usage": {
      "requests": 0,
      "input_tokens": 0,
      "output_tokens": 0,
      "total_tokens": 0
    },
    "timestamp": 0,
    "initial_prompt": "string",
    "workspace_path": "string"
  },
  "title": "string",
  "last_saved": "string",
  "num_messages": 0
}
```

**Example:**
```bash
curl http://localhost:8123/v3/sessions/current_session | jq .
```

#### POST /v3/sessions/create
Create a new session.

**Request Body (optional):**
```json
{
  "custom_title": "My Custom Session Title"  // Optional: Session title (default: "Untitled Session")
}
```

**Response:**
```json
{
  "session_id": "string",
  "title": "My Custom Session Title",
  "message": "Session created successfully"
}
```

**Status Codes:**
- `200`: Success
- `409`: Conflict - Chat in progress, cancel before creating new session

**Example:**
```bash
curl -X POST http://localhost:8123/v3/sessions/create | jq .
```

#### GET /v3/sessions/{session_id}
Get information about a specific session.

**Parameters:**
- `session_id` (path): The session ID

**Response**: Same as current_session

**Example:**
```bash
curl http://localhost:8123/v3/sessions/2480ebc2-9eaf-4597-9c19-5ed0b43b45f2 | jq .
```

#### POST /v3/sessions/{session_id}/restore
Restore a previous session.

**Parameters:**
- `session_id` (path): The session ID to restore

**Response:**
```json
{
  "session_id": "string",
  "message": "Session restored successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/sessions/2480ebc2-9eaf-4597-9c19-5ed0b43b45f2/restore | jq .
```

#### POST /v3/sessions/{session_id}/fork
Fork a session by creating a copy with a new ID.

**Parameters:**
- `session_id` (path): The session ID to fork

**Request Body (optional):**
```json
{
  "custom_title": "Forked Session Title"  // Optional: Custom title for the forked session
}
```

**Response:**
```json
{
  "session_id": "string",
  "title": "Forked Session Title", 
  "message": "Session forked successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/sessions/2480ebc2-9eaf-4597-9c19-5ed0b43b45f2/fork \
  -H "Content-Type: application/json" \
  -d '{"custom_title": "My Forked Session"}' | jq .
```

#### DELETE /v3/sessions/{session_id}
Delete a session.

**Parameters:**
- `session_id` (path): The session ID to delete

**Response:**
```json
{
  "session_id": "string",
  "message": "Session deleted successfully"
}
```

**Status Codes:**
- `200`: Success
- `404`: Session not found
- `409`: Cannot delete current session while chat is in progress

**Example:**
```bash
curl -X DELETE http://localhost:8123/v3/sessions/2480ebc2-9eaf-4597-9c19-5ed0b43b45f2 | jq .
```

#### PATCH /v3/sessions/{session_id}
Update a session (currently supports renaming only).

**Parameters:**
- `session_id` (path): The session ID to update

**Request Body:**
```json
{
  "title": "New Session Title"  // Required: New title for the session
}
```

**Response:**
```json
{
  "session_id": "string",
  "message": "Session updated successfully"
}
```

**Example:**
```bash
curl -X PATCH http://localhost:8123/v3/sessions/2480ebc2-9eaf-4597-9c19-5ed0b43b45f2 \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Session Name"}' | jq .
```

### Tool Management

#### GET /v3/tools
Get the list of available tools.

**Response:**
```json
[
  {
    "name": "string",
    "parameters_json_schema": {
      "type": "object",
      "properties": {},
      "required": []
    },
    "description": "string",
    "strict": boolean
  }
]
```

**Example:**
```bash
curl http://localhost:8123/v3/tools | jq .
```

#### POST /v3/tool
Execute a tool directly.

**Request Body:**
```json
{
  "tool_name": "string",        // Required: Name of the tool to execute
  "arguments": {}               // Required: Tool arguments as key-value pairs
}
```

**Response:**
```json
{
  "result": "string"           // Tool execution result
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "open_files",
    "arguments": {
      "file_paths": ["README.md"]
    }
  }' | jq .
```

### File Cache Management

#### GET /v3/cache-file-path
Get the cached file path for a given file.

**Parameters:**
- `file_path` (query): The file path to get cached version for

**Response:**
```json
{
  "cached_file_path": "string"
}
```

**Example:**
```bash
curl "http://localhost:8123/v3/cache-file-path?file_path=README.md" | jq .
```

#### POST /v3/invalidate-file-cache
Invalidate the cache by deleting all cached files.

**Response:**
```json
{
  "message": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/invalidate-file-cache | jq .
```

#### POST /v3/restore-from-file-cache
Restore files from cache based on specified criteria.

**Request Body:**
```json
{
  "file_patterns": ["*.py", "*.md"],  // Optional: File patterns to restore
  "restore_all": false                // Optional: Restore all cached files
}
```

**Response:**
```json
{
  "message": "Files restored from cache",
  "restored_count": 5
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/restore-from-file-cache \
  -H "Content-Type: application/json" \
  -d '{"file_patterns": ["*.py"]}' | jq .
```

### Control Operations

#### POST /v3/cancel
Cancel any ongoing chat request.

**Response:**
```json
{
  "message": "string",
  "cancelled": true
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/cancel | jq .
```

#### POST /v3/reset
Reset the agent history and MCP servers. Also clears any set chat message.

**Response:**
```json
{
  "message": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/reset | jq .
```

#### POST /v3/clear
Clear the agent history and MCP servers. Equivalent to `/v3/reset`.

**Response:**
```json
{
  "message": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/clear | jq .
```

#### POST /v3/prune
Prune the agent message history to reduce context size.

**Response:**
```json
{
  "message": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/prune | jq .
```

#### GET /v3/status
Get the current status information including CLI version, working directory, account details, memory files, and model information.

**Response:**
```json
{
  "cliVersion": {
    "version": "string",
    "sessionId": "string"
  },
  "workingDirectory": "string",
  "account": {
    "email": "string",
    "accountId": "string",
    "orgId": "string", 
    "isServerAvailable": true
  },
  "memory": {
    "memoryPaths": ["string"],
    "hasMemoryFiles": true,
    "errorMessage": "string"
  },
  "model": {
    "modelName": "string",
    "humanReadableName": "string",
    "errorMessage": "string"
  }
}
```

**Status Codes:**
- `200`: Success

**Example:**
```bash
curl -X GET http://localhost:8123/v3/status | jq .
```

#### GET /v3/prompts
Get all available prompts from the prompt configuration.

**Response:**
```json
{
  "prompts": [
    {
      "name": "string",
      "description": "string",
      "content_file": "string"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8123/v3/prompts | jq .
```

#### GET /v3/usage
Get usage information and statistics for the current session.

**Response:**
```json
{
  "content": "string"  // Formatted usage information
}
```

**Example:**
```bash
curl http://localhost:8123/v3/usage | jq .
```

#### GET /v3/agent-mode
Get the current agent mode.

**Response:**
```json
{
  "mode": "default",
  "message": "Current agent mode is default"
}
```

**Example:**
```bash
curl -X GET http://localhost:8123/v3/agent-mode | jq .
```

#### PUT /v3/agent-mode
Set the current agent mode.

**Request Body:**
```json
{ 
  "mode": "ask"
}
```

**Parameters:**
- `mode` (string, required): Valid values: `default`, `ask`
  - `default`: Full agent with read, write, and execute capabilities
  - `ask`: Read-only code exploration mode

**Response:**
```json
{
  "mode": "ask",
  "message": "Agent mode changed to ask"
}
```

**Status Codes:**
- `200`: Success - Mode changed successfully
- `422`: Validation Error - Invalid mode specified

**Examples:**
```bash
# Switch to ask (read-only) mode
curl -X PUT http://localhost:8123/v3/agent-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "ask"}' | jq .

# Switch back to default mode
curl -X PUT http://localhost:8123/v3/agent-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "default"}' | jq .
```

#### PUT /v3/inline-system-prompt
Set an inline system prompt to be used in the next chat interaction.

**Request Body:**
```json
{
  "prompt": "You are an expert code reviewer. Focus on security and performance."
}
```

**Response:**
```json
{
  "message": "Inline system prompt set successfully"
}
```

**Example:**
```bash
curl -X PUT http://localhost:8123/v3/inline-system-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "You are a helpful assistant focused on code quality"}' | jq .
```

#### GET /v3/available-modes
List all available agent modes and their descriptions.

**Response:**
```json
{
  "modes": [
    { 
      "mode": "default", 
      "description": "Full agent with read, write, and execute" 
    },
    { 
      "mode": "ask", 
      "description": "Read-only code exploration" 
    }
  ]
}
```

**Status Codes:**
- `200`: Success - Returns available modes

**Example:**
```bash
curl -X GET http://localhost:8123/v3/available-modes | jq .
```

#### GET /v3/agent_lifecycle_events
Stream agent lifecycle events as Server-Sent Events.

This endpoint emits events during agent runs to help external systems track overall progress, completion, and errors. Unlike chat streaming, these events summarize lifecycle milestones.

- Event names: `agent_run_start`, `agent_run_end`, `error`
- Data payload always includes: `timestamp` (unix seconds), `session_id` (string)
- Additional fields vary by event type

**Response:** Server-Sent Events stream

**Event Schemas:**

- `agent_run_start`
  ```json
  {
    "timestamp": 0.0,
    "session_id": "string"
  }
  ```

- `agent_run_end`
  ```json
  {
    "timestamp": 0.0,
    "session_id": "string",
    "task_status": "TASK_COMPLETED" | "WAITING_FOR_USER",
    "error_message": "string | null"  
  }
  ```
  Notes:
  - `task_status` is derived from the last agent response and indicates whether the current task appears complete or awaiting more user input.

- `error`
  ```json
  {
    "timestamp": 0.0,
    "session_id": "string",
    "error_type": "string",
    "error_message": "string"
  }
  ```

**Example:**
```bash
curl -N http://localhost:8123/v3/agent_lifecycle_events --no-buffer
```

### Configuration

#### POST /v3/set-site-url
Set the user's Atlassian site URL used for billing, analytics, and product integration.

Request Body:
```json
{
  "site_url": "https://<your-site>.atlassian.net"
}
```

Response:
```json
{
  "message": "Site URL updated successfully to: https://<your-site>.atlassian.net"
}
```

Example:
```bash
curl -X POST http://localhost:8123/v3/set-site-url \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "https://hello.atlassian.net"
  }' | jq .
```

Notes:
- Persists the site URL into the user's CLI config file and takes effect for subsequent requests
- Equivalent to passing the CLI flag `--site-url` when starting the server
- Useful when the account has access to multiple Atlassian cloud sites and you need to select the billing site

## V3 Streaming Events

V3 uses the same streaming events as V2, with one additional event type:

### on_call_tools_start
Emitted when tool execution is paused for approval (when `pause_on_call_tools_start=true`).

**Schema:**
```json
{
  "parts": [
    {
      "tool_name": "string",
      "args": {},
      "tool_call_id": "string"
    }
  ],
  "timestamp": "2025-08-15T06:33:29.019496+00:00",
  "part_kind": "on_call_tools_start"
}
```

**Example:**
```
event: on_call_tools_start
data: {"parts": [{"tool_name": "open_files", "args": {"file_paths": ["README.md"]}, "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP"}], "timestamp": "2025-08-15T06:33:29.019496+00:00", "part_kind": "on_call_tools_start"}
```

## Usage Workflows

### Basic V3 Chat Flow

```bash
# 1. Set the message
curl -X POST http://localhost:8123/v3/set_chat_message \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a new Python file", "enable_deep_plan": false}'

# 2. Stream the response
curl http://localhost:8123/v3/stream_chat --no-buffer
```

### Controlled Tool Execution Flow

```bash
# 1. Set the message
curl -X POST http://localhost:8123/v3/set_chat_message \
  -H "Content-Type: application/json" \
  -d '{"message": "Delete the old config file", "enable_deep_plan": false}'

# 2. Stream with tool pausing
curl "http://localhost:8123/v3/stream_chat?pause_on_call_tools_start=true" --no-buffer

# 3. When you receive an on_call_tools_start event, decide whether to approve
# Approve the tool call:
curl -X POST http://localhost:8123/v3/resume_tool_calls \
  -H "Content-Type: application/json" \
  -d '{
    "decisions": [
      {
        "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP",
        "deny_message": null
      }
    ]
  }'

# Or deny the tool call:
curl -X POST http://localhost:8123/v3/resume_tool_calls \
  -H "Content-Type: application/json" \
  -d '{
    "decisions": [
      {
        "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP",
        "deny_message": "Deletion not approved by user"
      }
    ]
  }'
```

### Python Example with Tool Control

```python
import requests
import json

class V3ChatClient:
    def __init__(self, base_url="http://localhost:8123/v3"):
        self.base_url = base_url
        
    def set_message(self, message, enable_deep_plan=False):
        """Set the chat message."""
        response = requests.post(
            f"{self.base_url}/set_chat_message",
            json={"message": message, "enable_deep_plan": enable_deep_plan}
        )
        return response.json()
    
    def stream_chat(self, pause_on_tools=False, tool_approver=None):
        """Stream chat with optional tool approval."""
        url = f"{self.base_url}/stream_chat"
        if pause_on_tools:
            url += "?pause_on_call_tools_start=true"
            
        response = requests.get(url, stream=True)
        
        for line in response.iter_lines():
            if not line:
                continue
                
            line = line.decode('utf-8')
            
            if line.startswith('event: '):
                event_type = line[7:]
            elif line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    
                    if event_type == 'on_call_tools_start':
                        # Handle tool approval
                        decisions = []
                        for tool_call in data['parts']:
                            approve = True
                            deny_message = None
                            
                            if tool_approver:
                                approve, deny_message = tool_approver(tool_call)
                            
                            decisions.append({
                                "tool_call_id": tool_call['tool_call_id'],
                                "deny_message": deny_message if not approve else None
                            })
                        
                        self.resume_tool_calls(decisions)
                    
                    yield event_type, data
                    
                except json.JSONDecodeError:
                    continue
    
    def resume_tool_calls(self, decisions):
        """Resume tool calls with approval decisions."""
        response = requests.post(
            f"{self.base_url}/resume_tool_calls",
            json={"decisions": decisions}
        )
        return response.json()

# Usage example
def tool_approver(tool_call):
    """Example tool approver function."""
    tool_name = tool_call['tool_name']
    args = tool_call['args']
    
    print(f"Tool: {tool_name}")
    print(f"Args: {args}")
    
    # Auto-approve read operations, ask for write operations
    if tool_name in ['open_files', 'grep', 'bash']:
        if tool_name == 'bash' and any(cmd in str(args) for cmd in ['rm', 'delete', 'mv']):
            approval = input("Approve destructive bash command? (y/n): ").lower() == 'y'
            return approval, None if approval else "Destructive command denied"
        return True, None
    
    approval = input(f"Approve {tool_name}? (y/n): ").lower() == 'y'
    return approval, None if approval else "Tool execution denied by user"

# Example usage
client = V3ChatClient()
client.set_message("Clean up the project by removing old files")

for event_type, data in client.stream_chat(pause_on_tools=True, tool_approver=tool_approver):
    if event_type == 'part_delta' and data.get('delta', {}).get('part_delta_kind') == 'text':
        print(data['delta']['content_delta'], end='', flush=True)
```

### Configuration

#### POST /v3/set-site-url
Set the Atlassian site URL for billing and integration purposes.

**Request Body:**
```json
{
  "site_url": "https://hello.atlassian.net"
}
```

**Response:**
```json
{
  "response": "Site URL set successfully"
}
```

**Usage:**
```bash
curl -X POST http://localhost:8123/v3/set-site-url \
  -H "Content-Type: application/json" \
  -d '{"site_url": "https://hello.atlassian.net"}'
```

This endpoint is equivalent to using the `--site-url` command-line flag when starting the server.

#### GET /v3/sites
Get available Atlassian sites for the current user.

**Response:**
```json
{
  "sites": [
    {
      "site_url": "https://company.atlassian.net",
      "display_name": "Company Site",
      "is_default": true
    },
    {
      "site_url": "https://team.atlassian.net", 
      "display_name": "Team Site",
      "is_default": false
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:8123/v3/sites | jq .
```

#### POST /v3/add-jira-project
Add a JIRA project for integration and context.

**Request Body:**
```json
{
  "project_key": "RDA",
  "site_url": "https://company.atlassian.net"
}
```

**Response:**
```json
{
  "message": "JIRA project RDA added successfully",
  "project_key": "RDA",
  "site_url": "https://company.atlassian.net"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v3/add-jira-project \
  -H "Content-Type: application/json" \
  -d '{"project_key": "RDA", "site_url": "https://company.atlassian.net"}' | jq .
```

## Error Handling

The V3 API returns structured error responses for various failure conditions. Errors can be returned as HTTP error responses or streamed as `exception` events during chat.

### HTTP Error Responses

**400 Bad Request:**
```json
{
  "detail": "No chat message set. Use set_chat_message first."
}
```
Occurs when calling `/stream_chat` without first setting a message via `/set_chat_message`.

**401 Unauthorized:**
```json
{
  "detail": "Missing credentials. Provide the session token as a Bearer token in the Authorization header."
}
```
Occurs when the session token is missing or invalid.

**404 Not Found:**
```json
{
  "detail": "Session not found"
}
```
Occurs when referencing a session that doesn't exist.

**409 Conflict:**
```json
{
  "detail": "Chat in progress. Cancel it before restoring a session."
}
```
Occurs when attempting operations that conflict with an ongoing chat.

**422 Validation Error:**
```json
{
  "detail": [{"loc": ["body", "field"], "msg": "field required", "type": "value_error.missing"}]
}
```
Occurs when request body validation fails (Pydantic validation error).

**503 Service Unavailable:**
```json
{
  "detail": "MCP servers failed to start"
}
```
Occurs when MCP servers are not available or failed to start.

### Streamed Exception Events

During chat streaming, errors are emitted as `exception` events:

```
event: exception
data: {"type": "ErrorType", "message": "Error description", "title": "Error Title"}
```

#### Exception Types

| Type | Description | Common Causes |
|------|-------------|---------------|
| `RovoDevError` | Base error for Rovo Dev CLI errors | General application errors |
| `ModelRequestError` | LLM request failed | Server errors, network issues, access denied |
| `UnauthorizedError` | Authentication failed | Invalid API key or expired credentials |
| `EntitlementCheckFailed` | User entitlement validation failed | Product not installed, CLI disabled, user not authorized |
| `RateLimitExceededError` | Rate limit exceeded | Daily, minute, or monthly limits exceeded |
| `RequestTooLargeError` | Context limit exceeded | Message history too large for model |
| `BinaryContentBlockedError` | Binary content restricted | Image/document data not supported by current model |
| `MCPServerError` | MCP server error | Failed to start or communicate with MCP server |
| `MCPConfigurationError` | MCP configuration error | Invalid MCP server configuration |

#### Error Response Structure

All streamed exceptions include:
- `type`: The exception class name
- `message`: Human-readable error description
- `title`: Short error title (optional)

**Example Exception Event:**
```
event: exception
data: {"type": "RateLimitExceededError", "message": "Your daily usage limit of 5,000,000 tokens resets in 2 hours.", "title": "You've reached your daily token limit"}
```

## Best Practices

1. **Always Set Message First**: Call `/set_chat_message` before `/stream_chat`
2. **Handle Tool Pausing**: When using `pause_on_call_tools_start=true`, always handle `on_call_tools_start` events
3. **Implement Tool Approval Logic**: Create clear approval criteria for different tool types
4. **Error Recovery**: Use `/reset` to clear both agent state and any set messages
5. **Security**: Use tool pausing for operations that modify files or execute system commands

## Global Endpoints

Response Headers

All responses from the Serve API include the header `X-Session-ID` containing the current session ID. This is useful for correlating requests, logs, and streamed events to a specific session across clients and retries.

These endpoints are available at the root level (not versioned) and work with both V2 and V3 APIs.

### Health Check

#### GET /healthcheck
Check the health status of the server and MCP servers. This endpoint provides detailed information about server state, entitlement status, and any actions required from the user.

**Response Schema:**
```json
{
  "status": "healthy" | "unhealthy" | "unknown" | "entitlement check failed" | "pending user review",
  "version": "string",
  "detail": {
    "title": "string",
    "message": "string",
    "payload": { ... }  // Present when status is "entitlement check failed"
  } | null,
  "mcp_servers": {
    "server_name": "running" | "starting" | "stopped" | "failed" | "disabled" | "pending user review"
  } | null
}
```

**Status Values:**
- `healthy`: All systems operational and MCP servers running
- `unhealthy`: One or more MCP servers failed to start
- `unknown`: MCP servers are starting or in a transient state
- `entitlement check failed`: User entitlement validation failed (see detail for more info)
- `pending user review`: Third-party MCP servers require user approval before starting

**MCP Server States:**
- `running`: Server is running and available
- `starting`: Server is currently starting up
- `stopped`: Server is not running
- `failed`: Server failed to start
- `disabled`: Server is disabled in user configuration
- `pending user review`: Server requires user approval

#### Entitlement Check Failed Response

When the status is `entitlement check failed`, the `detail` object contains the original entitlement payload from the backend with information about why the check failed.

**Example Response:**
```json
{
  "status": "entitlement check failed",
  "version": "0.13.31",
  "detail": {
    "payload": {
      "status": "USER_NOT_AUTHORIZED",
      "title": "Access Denied",
      "message": "You need permissions to access Rovo Dev. Request access from your administrator.",
      "ctaLink": {
        "url": "https://company.atlassian.net/admin/permissions",
        "text": "Request access"
      }
    }
  },
  "mcp_servers": null
}
```

**Entitlement Status Codes:**

| Status | Description |
|--------|-------------|
| `PRODUCT_NOT_INSTALLED` | Rovo Dev Agents is not installed on the user's site |
| `CLI_DISABLED` | Rovo Dev CLI is disabled on the user's site |
| `USER_NOT_AUTHORIZED` | User lacks required permissions |
| `USER_NOT_AUTHORIZED_FOR_AI` | User not authorized for AI features |
| `BETA_AI_FEATURES_DISABLED` | Beta AI features are disabled |
| `FEATURE_DISABLED_ORG_LEVEL` | Feature disabled at organization level |
| `FEATURE_DISABLED_SITE_LEVEL` | Feature disabled at site level |
| `FEATURE_DISABLED_WORKSPACE_LEVEL` | Feature disabled at workspace level |
| `FEATURE_DISABLED_REPOSITORY_LEVEL` | Feature disabled at repository level |
| `FEATURE_DISABLED_PAID_ONLY` | Feature requires paid subscription |

**CTA Link:**

When present, the `ctaLink` object in the payload provides a call-to-action for the user:
- `url`: The URL to navigate to for resolving the issue
- `text`: Human-readable text describing the action

Clients should display the CTA link to help users resolve entitlement issues.

#### Pending User Review Response

When third-party MCP servers require approval:

```json
{
  "status": "pending user review",
  "version": "0.13.31",
  "detail": {
    "title": "Third-party MCP server",
    "message": "Would you like to allow the use of the following third-party MCP servers:\n\n  my-custom-server\n\nWhen integrating with third-party products, please comply with their terms of use.\n\nTo continue, please call the `/accept-mcp-terms` endpoint to accept or deny the use of third-party MCP servers."
  },
  "mcp_servers": {
    "nautilus": "starting",
    "my-custom-server": "pending user review"
  }
}
```

**Example:**
```bash
curl http://localhost:8123/healthcheck | jq .
```

**Example - Healthy Response:**
```json
{
  "status": "healthy",
  "version": "0.13.31",
  "detail": null,
  "mcp_servers": {
    "nautilus": "running",
    "atlassian-mcp": "running"
  }
}
```

### Model Management

#### GET /v3/agent-models
Get all available models for the agent.

**Response:**
```json
{
  "models": [
    {
      "model": "claude-3-5-sonnet-20241022",
      "provider": "anthropic",
      "display_name": "Claude 3.5 Sonnet",
      "description": "Latest Claude 3.5 Sonnet model"
    }
  ]
}
```

#### GET /v3/agent-model
Get the current agent model configuration.

**Response:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "provider": "anthropic"
}
```

#### PUT /v3/agent-model
Set the agent model configuration.

**Request Body:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "provider": "anthropic"
}
```

**Response:**
```json
{
  "success": true,
  "model": "claude-3-5-sonnet-20241022",
  "provider": "anthropic"
}
```

### Session Management

#### POST /v3/sessions/{session_id}/fork
Fork an existing session with optional modifications.

**Path Parameters:**
- `session_id` (string): The ID of the session to fork

**Request Body:**
```json
{
  "name": "Forked Session Name",        // Optional: New session name
  "initial_message": "Continue from here"  // Optional: Initial message for fork
}
```

**Response:**
```json
{
  "session_id": "new-session-uuid",
  "name": "Forked Session Name",
  "created_at": "2024-01-01T12:00:00Z"
}
```

### Site Configuration

#### POST /v3/set-site-url
Configure the Atlassian site URL for billing and integrations.

**Request Body:**
```json
{
  "site_url": "https://hello.atlassian.net"
}
```

**Response:**
```json
{
  "success": true,
  "site_url": "https://hello.atlassian.net"
}
```

### Usage and Analytics

#### GET /v3/usage
Get usage statistics and metrics.

**Response:**
```json
{
  "total_tokens": 15420,
  "total_requests": 45,
  "session_count": 3,
  "last_request": "2024-01-01T12:00:00Z"
}
```

### Tour Functionality

Tour endpoints provide guided code exploration and explanation functionality.

#### GET /v3/tour/state
Get the current tour state.

**Response:**
```json
{
  "active": true,
  "current_group": "group-1",
  "progress": 0.5
}
```

#### GET /v3/tour/available-sources
Get available tour sources (e.g., pull requests, commits).

**Response:**
```json
{
  "sources": [
    {
      "type": "pull_request",
      "url": "https://github.com/org/repo/pull/123",
      "title": "Feature: Add new functionality"
    }
  ]
}
```

#### POST /v3/tour/analyze
Analyze code changes and generate tour groups.

**Request Body:**
```json
{
  "source": "https://github.com/org/repo/pull/123",
  "options": {
    "include_tests": true,
    "max_groups": 5
  }
}
```

**Response:**
```json
{
  "groups": [
    {
      "id": "group-1",
      "title": "Core Implementation",
      "description": "Main feature implementation",
      "files": ["src/main.py", "src/utils.py"]
    }
  ]
}
```

#### GET /v3/tour/groups/{group_id}/question
Get a question for a specific tour group.

**Path Parameters:**
- `group_id` (string): The tour group ID

**Response:**
```json
{
  "question": "What is the purpose of this implementation?",
  "context": "This code introduces a new feature..."
}
```

#### POST /v3/tour/complete
Mark the tour as completed.

**Response:**
```json
{
  "success": true,
  "completed_at": "2024-01-01T12:00:00Z"
}
```

#### GET /v3/tour/comments
Get tour-related comments.

**Response:**
```json
{
  "comments": [
    {
      "id": "comment-1",
      "content": "This function handles...",
      "file_path": "src/main.py",
      "line_number": 42
    }
  ]
}
```

#### GET /v3/tour/comments/{comment_id}
Get a specific tour comment by ID.

**Path Parameters:**
- `comment_id` (string): The comment ID

**Response:**
```json
{
  "id": "comment-1",
  "content": "This function handles...",
  "file_path": "src/main.py",
  "line_number": 42,
  "created_at": "2024-01-01T12:00:00Z"
}
```

### Status and Management

#### POST /shutdown
Gracefully shutdown the server.

**Response**: Plain text response
```
Shutting down
```

**Status Codes:**
- `200`: Success - Server is shutting down

**Example:**
```bash
curl -X POST http://localhost:8123/shutdown
```

**Notes:**
- This endpoint cancels any ongoing chat requests before shutting down
- The server will exit with code 0 after responding
- Use this for programmatic server shutdown

---

#### POST /accept-mcp-terms
Accept or deny terms for third-party MCP servers.

**Request Body:**
```json
{
  "servers": [
    {
      "server_name": "string",
      "decision": "accept" | "deny"
    }
  ],
  "accept_all": false  // Optional: Accept all pending servers
}
```

**Response:**
```json
{
  "message": "MCP servers updated successfully"
}
```

**Example:**
```bash
# Accept specific servers
curl -X POST http://localhost:8123/accept-mcp-terms \
  -H "Content-Type: application/json" \
  -d '{
    "servers": [
      {
        "server_name": "third-party-server",
        "decision": "accept"
      }
    ]
  }' | jq .

# Accept all pending servers
curl -X POST http://localhost:8123/accept-mcp-terms \
  -H "Content-Type: application/json" \
  -d '{"accept_all": true}' | jq .
```

**Notes:**
- This endpoint is only available when the server is running without entitlement issues
- Use `/healthcheck` to see which servers require approval
- Denied servers will not be loaded or available for tool execution
