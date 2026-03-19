---
title: V2 API Reference
description: V2 API Reference
platform: platform
product: rovodev-cli
category: devguide
subcategory: serve
date: '2025-12-01'
---

# V2 API Reference

The V2 API is the primary interface for the Rovo Dev Serve API, providing comprehensive chat functionality, session management, and tool execution.

**Base URL**: `http://localhost:8123/v2/`

## Authentication

All V2 API endpoints require Bearer token authentication. Include the session token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer <session-token>" \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}' \
     http://localhost:8123/v2/chat
```

## Endpoints

### Chat

#### POST /v2/chat
Start a chat conversation with streaming response.

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

**Response**: Server-Sent Events stream

**Status Codes:**
- `200`: Success - Returns streaming response
- `409`: Conflict - Chat already in progress
- `422`: Validation Error - Invalid request body

**Example:**
```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "List files in the project", "enable_deep_plan": false}' \
  --no-buffer
```

**Example with Context:**
```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain this code and suggest improvements",
    "context": [
      {
        "type": "note",
        "content": "Focus on performance and readability"
      },
      {
        "type": "file",
        "file_path": "src/main.py",
        "selection": {
          "start": 15,
          "end": 30
        },
        "note": "Main processing function"
      }
    ],
    "enable_deep_plan": true
  }' \
  --no-buffer
```

**Special Commands:**
- `/clear` - Resets message history (same as `/reset`)
- `/prune` - Prunes message history using tool result pruner

### Context System

The V2 API supports a powerful context system that allows you to provide additional information alongside your message. Context items are formatted and included in the prompt to help the agent provide more relevant and targeted responses.

#### Context Types

**Generic Context Items:**
```json
{
  "type": "string",      // Type identifier (e.g., "note", "instruction", "requirement")
  "content": "string"    // The context content
}
```

**File Context Items:**
```json
{
  "type": "file",                    // Always "file" for file context items
  "file_path": "string",             // Path to the file
  "selection": {                     // Optional: Specific line range
    "start": 10,                     // Start line number (inclusive)
    "end": 20                        // End line number (inclusive)
  },
  "note": "string"                   // Optional: Description or annotation
}
```

#### Context Formatting

Context items are automatically formatted into XML-like structures:

- **Generic items**: `<type>content</type>`
- **File items with selection**: `<file path="..." selection="start-end">note</file>`
- **File items without selection**: `<file path="..." />`
- **File items with note only**: `<file path="...">note</file>`

The formatted context is appended to your message with clear instructions for the agent.

#### Context Examples

**Multiple Context Types:**
```json
{
  "message": "Help me optimize this function",
  "context": [
    {
      "type": "requirement",
      "content": "Must maintain backward compatibility"
    },
    {
      "type": "note",
      "content": "This function is called frequently in production"
    },
    {
      "type": "file",
      "file_path": "src/utils/processor.py",
      "selection": {
        "start": 45,
        "end": 75
      },
      "note": "Performance-critical processing function"
    }
  ]
}
```

**File Reference Only:**
```json
{
  "message": "What does this configuration do?",
  "context": [
    {
      "type": "file",
      "file_path": "config/settings.json",
      "note": "Main application configuration"
    }
  ]
}
```

**Response Events**: See [Streaming Events](streaming-events.md) for detailed event schemas.

#### POST /v2/replay
Replay the current session's chat history and continue streaming new events.

**Response**: Server-Sent Events stream

**Description**: This endpoint streams all buffered conversation events from the current session and continues streaming any new events that occur. Useful for reconnecting to an ongoing conversation.

**Example:**
```bash
curl -X POST http://localhost:8123/v2/replay --no-buffer
```

### Control Operations

#### POST /v2/cancel
Cancel any ongoing chat request.

**Response:**
```json
{
  "message": "string",     // Status message
  "cancelled": boolean     // Whether a chat was actually cancelled
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v2/cancel
```

#### POST /v2/reset
Reset the agent history and MCP servers. Also available as `/v2/clear`.

**Response:**
```json
{
  "message": "Message history reset successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v2/reset
```

#### POST /v2/prune
Prune the agent message history to reduce context size.

**Response:**
```json
{
  "message": "Message history pruned successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v2/prune
```

### Session Management

#### GET /v2/sessions/list
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
curl http://localhost:8123/v2/sessions/list | jq .
```

#### GET /v2/sessions/current_session
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
curl http://localhost:8123/v2/sessions/current_session | jq .
```

#### POST /v2/sessions/create
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
curl -X POST http://localhost:8123/v2/sessions/create | jq .
```

#### GET /v2/sessions/{session_id}
Get information about a specific session.

**Parameters:**
- `session_id` (path): The session ID

**Response**: Same as current_session

**Example:**
```bash
curl http://localhost:8123/v2/sessions/2480ebc2-9eaf-4597-9c19-5ed0b43b45f2 | jq .
```

#### POST /v2/sessions/{session_id}/restore
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
curl -X POST http://localhost:8123/v2/sessions/2480ebc2-9eaf-4597-9c19-5ed0b43b45f2/restore | jq .
```

### Tool Execution

#### GET /v2/tools
Get the list of available tools (both MCP and function tools).

**Response:**
```json
[
  {
    "name": "string",
    "description": "string", 
    "parameters_json_schema": {},
    "strict": boolean
  }
]
```

**Example:**
```bash
curl http://localhost:8123/v2/tools | jq .
```

#### POST /v2/tool
Execute a tool directly without chat context.

**Request Body:**
```json
{
  "tool_name": "string",        // Required: Name of the tool to execute
  "arguments": {}               // Required: Tool arguments as JSON object
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
curl -X POST http://localhost:8123/v2/tool \
  -H "Content-Type: application/json" \
  -d '{"tool_name": "open_files", "arguments": {"file_paths": ["README.md"]}}' | jq .
```

### File Cache Management

#### GET /v2/cache-file-path
Get the cached file path for a given file.

**Parameters:**
- `file_path` (query, required): The original file path

**Response:**
```json
{
  "cached_file_path": "string"  // Path to the cached file
}
```

**Status Codes:**
- `200`: Success
- `404`: Cached file not found

**Example:**
```bash
curl "http://localhost:8123/v2/cache-file-path?file_path=README.md" | jq .
```

#### POST /v2/invalidate-file-cache
Invalidate the file cache by deleting all cached files.

**Response:**
```json
{
  "message": "Cache invalidated"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v2/invalidate-file-cache | jq .
```

### Legacy Tool Management

#### GET /v2/tools (Legacy Format)
Get the list of available tools.

**Response:**
```json
[
  {
    "name": "string",
    "description": "string",
    "parameters_json_schema": {},
    "strict": boolean
  }
]
```

**Example:**
```bash
curl http://localhost:8123/v2/tools | jq .
```

#### POST /v2/tool
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
curl -X POST http://localhost:8123/v2/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "open_files",
    "arguments": {
      "file_paths": ["README.md"]
    }
  }' | jq .
```

### File Cache Management

#### GET /v2/cache-file-path
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
curl "http://localhost:8123/v2/cache-file-path?file_path=README.md" | jq .
```

#### POST /v2/invalidate-file-cache
Invalidate the file cache by deleting all cached files.

**Response:**
```json
{
  "message": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v2/invalidate-file-cache | jq .
```

### Control Operations

#### POST /v2/cancel
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
curl -X POST http://localhost:8123/v2/cancel | jq .
```

#### POST /v2/reset
#### POST /v2/clear
Reset the agent history and MCP servers. Both endpoints are identical.

**Response:**
```json
{
  "message": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v2/reset | jq .
# or
curl -X POST http://localhost:8123/v2/clear | jq .
```

#### POST /v2/prune
Prune the agent history (removes old messages while keeping recent context).

**Response:**
```json
{
  "message": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:8123/v2/prune | jq .
```

## Available Tools

The V2 API provides access to numerous tools for file operations, code analysis, shell commands, and Atlassian integrations:

### File Operations
- `open_files` - Open and view files
- `create_file` - Create new files
- `delete_file` - Delete files
- `move_file` - Move/rename files

### Code Analysis
- `expand_code_chunks` - View specific code sections
- `find_and_replace_code` - Find and replace in files
- `grep` - Search file contents and paths

### System Operations
- `bash` - Execute shell commands
- `create_technical_plan` - Generate technical plans for complex tasks

### Web Operations
- `fetch_url` - Retrieve web page content
- `fetch_urls` - Retrieve multiple web pages

### Atlassian Tools
- `get_similar_issues` - Find similar Jira issues
- `get_linked_content_from_similar_issues` - Get linked content from similar issues
- `get_pr_links_from_issue_link` - Get PR links from Jira issues
- `search_relationships` - Search Atlassian entity relationships
- `search_orchestrated` - Advanced orchestrated search
- `search` - Basic content search
- `get_pr_diff` - Get pull request diffs
- `get_similar_issue_diffs` - Get diffs from similar issues
- `analyze_issue_image_attachments` - Analyze Jira issue image attachments

For detailed tool schemas, use the `/v2/tools` endpoint.

## Error Responses

All endpoints return standard HTTP status codes with JSON error details:

**400 Bad Request:**
```json
{
  "detail": "Invalid request parameters"
}
```

**409 Conflict:**
```json
{
  "detail": "Chat already in progress"
}
```

**422 Validation Error:**
```json
{
  "detail": [
    {
      "loc": ["body", "message"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Internal server error"
}
```

## Usage Patterns

### Basic Chat Flow
1. Send message to `/v2/chat`
2. Process streaming events
3. Handle tool executions automatically
4. Receive final response

### Session Management Flow
1. List sessions with `/v2/sessions/list`
2. Create new session with `/v2/sessions/create` (optional)
3. Restore previous session with `/v2/sessions/{id}/restore` (optional)
4. Use `/v2/replay` to replay session history

### Tool Execution Flow
1. Get available tools with `/v2/tools`
2. Execute tools directly with `/v2/tool`
3. Or let chat handle tool execution automatically

### Error Recovery Flow
1. Use `/v2/cancel` to stop ongoing operations
2. Use `/v2/reset` to clear corrupted state
3. Use `/v2/prune` to clean up history while preserving context

## Global Endpoints

These endpoints are available at the root level (not versioned) and work with both V2 and V3 APIs.

### Health Check

#### GET /healthcheck
Check the health status of the server and MCP servers.

**Response:**
```json
{
  "status": "healthy" | "unhealthy" | "entitlement check failed" | "pending user review",
  "version": "string",
  "detail": {
    "title": "string",
    "message": "string"
  } | null,
  "mcp_servers": {
    "server_name": "running" | "stopped" | "pending user review"
  } | null
}
```

**Status Values:**
- `healthy`: All systems operational
- `unhealthy`: One or more MCP servers stopped
- `entitlement check failed`: User entitlement validation failed
- `pending user review`: Third-party MCP servers require user approval

**Example:**
```bash
curl http://localhost:8123/healthcheck | jq .
```

### Agent Modes

Manage the agent's operational mode. Agent modes control available tools and behavior. The default mode allows read/write/execute operations. The ask mode is read-only and restricts tools.

#### GET /v2/agent-mode
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
curl -X GET http://localhost:8123/v2/agent-mode | jq .
```

#### PUT /v2/agent-mode
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
curl -X PUT http://localhost:8123/v2/agent-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "ask"}' | jq .

# Switch back to default mode
curl -X PUT http://localhost:8123/v2/agent-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "default"}' | jq .
```

#### GET /v2/available-modes
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
curl -X GET http://localhost:8123/v2/available-modes | jq .
```

### Status and Management

Response Headers

All responses from the Serve API include the header `X-Session-ID` containing the current session ID. This is useful for correlating requests, logs, and streamed events to a specific session across clients and retries.

#### Status

V2 does not expose a dedicated HTTP status endpoint. Use either of the following approaches:

- Chat command: send the message `/status` to `/v2/chat` and process the `status` event in the SSE stream.
- V3 endpoint: call `GET /v3/status` for a structured JSON response (recommended if you just need status data).

**Example (chat command):**
```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "/status"}' --no-buffer
```

The stream will include a `status` event with a JSON payload similar to the `GET /v3/status` response.
---

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
