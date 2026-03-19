---
title: User guide
description: User guide
platform: platform
product: rovodev-cli
category: devguide
subcategory: serve
date: '2025-10-09'
---

# Rovo Dev Serve API User Guide

This guide provides practical examples and common usage patterns for the Rovo Dev Serve API.

## Getting Started

### 1. Start the Server

```bash
# Basic usage
rovodev serve 8123

# With GUI mode (serves web interface on port 8123, API on port 9147)
rovodev gui 8123

# With initial message
rovodev serve 8123 "Open the README file"

# With shadow mode enabled
rovodev serve 8123 --shadow
```

### 2. Verify Server is Running

```bash
curl http://localhost:8123/healthcheck
# Response: {"status":"healthy","version":"0.10.7"}
```

## Basic Chat Workflow (V2 API)

### Simple Chat Request

```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "List the files in the current directory", "enable_deep_plan": false}' \
  --no-buffer
```

This returns a stream of Server-Sent Events showing the agent's response in real-time.

### Chat with Deep Planning

```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Refactor the main.py file to use better error handling", "enable_deep_plan": true}' \
  --no-buffer
```

Deep planning creates a technical plan before executing changes, useful for complex modifications.

## Advanced Chat Workflow (V3 API)

V3 provides more control by separating message setting from execution:

### 1. Set the Chat Message

```bash
curl -X POST http://localhost:8123/v3/set_chat_message \
  -H "Content-Type: application/json" \
  -d '{"message": "Open a file and describe it", "enable_deep_plan": false}'
```

### 2. Stream the Response

```bash
curl http://localhost:8123/v3/stream_chat --no-buffer
```

### 3. Pause on Tool Calls (Optional)

```bash
curl "http://localhost:8123/v3/stream_chat?pause_on_call_tools_start=true" --no-buffer
```

When paused, you can approve or deny tool calls:

```bash
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
```

## Session Management

### List All Sessions

```bash
curl http://localhost:8123/v2/sessions/list | jq .
```

### Get Current Session Info

```bash
curl http://localhost:8123/v2/sessions/current_session | jq .
```

### Create New Session

```bash
curl -X POST http://localhost:8123/v2/sessions/create | jq .
```

### Restore Previous Session

```bash
curl -X POST http://localhost:8123/v2/sessions/{session_id}/restore | jq .
```

### Replay Session History

```bash
curl -X POST http://localhost:8123/v2/replay --no-buffer
```

## Tool Management

### List Available Tools

```bash
curl http://localhost:8123/v2/tools | jq .
```

### Execute Tool Directly

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

## File Cache Management

### Get Cached File Path

```bash
curl "http://localhost:8123/v2/cache-file-path?file_path=README.md" | jq .
```

### Invalidate File Cache

```bash
curl -X POST http://localhost:8123/v2/invalidate-file-cache | jq .
```

## Control Operations

### Cancel Ongoing Chat

```bash
curl -X POST http://localhost:8123/v2/cancel | jq .
```

### Reset Agent State

```bash
curl -X POST http://localhost:8123/v2/reset | jq .
# Also available as: curl -X POST http://localhost:8123/v2/clear
```

### Prune Agent History

```bash
curl -X POST http://localhost:8123/v2/prune | jq .
```

## Programming Language Examples

### Python Example

```python
import requests
import json

# Start a chat
response = requests.post(
    "http://localhost:8123/v2/chat",
    json={"message": "List files in the project", "enable_deep_plan": False},
    stream=True
)

# Process streaming response
for line in response.iter_lines():
    if line:
        line = line.decode('utf-8')
        if line.startswith('data: '):
            data = json.loads(line[6:])
            print(f"Event: {data}")
```

### JavaScript Example

```javascript
// Using EventSource for streaming
const eventSource = new EventSource('http://localhost:8123/v2/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Explain the project structure",
    enable_deep_plan: false
  })
});

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

eventSource.onerror = function(event) {
  console.error('Error:', event);
};
```

### cURL with jq for Pretty Output

```bash
# Stream and format JSON events
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me the project structure"}' \
  --no-buffer | while IFS= read -r line; do
    if [[ $line == data:* ]]; then
      echo "$line" | sed 's/^data: //' | jq .
    fi
  done
```

## Common Use Cases

### 1. Code Analysis
```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze the main.py file and suggest improvements"}'
```

### 2. File Operations
```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a new Python file with a basic FastAPI setup"}'
```

### 3. Testing
```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Run the tests and show me any failures"}'
```

### 4. Documentation
```bash
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Generate documentation for the API endpoints"}'
```

## Best Practices

1. **Use V2 for Simple Integrations**: V2 API is simpler and covers most use cases
2. **Use V3 for Tool Control**: When you need to approve/deny tool executions
3. **Enable Deep Planning for Complex Tasks**: Use `enable_deep_plan: true` for refactoring or complex changes
4. **Handle Streaming Properly**: Always use `--no-buffer` with curl and handle SSE events correctly
5. **Manage Sessions**: Create new sessions for different contexts or tasks
6. **Monitor Usage**: Check session info for token usage and request counts

## Troubleshooting

### Server Not Responding
```bash
# Check if server is running
curl http://localhost:8123/healthcheck

# Check server logs
# Look for error messages in the terminal where you started the server
```

### Chat Not Streaming
- Ensure you're using `--no-buffer` with curl
- Check that Content-Type is set to `application/json`
- Verify the request body is valid JSON

### Tool Execution Fails
- Check that the workspace has proper permissions
- Verify file paths are correct and accessible
- Review the tool arguments in the API response

### Session Issues
- Use `/v2/reset` to clear corrupted session state
- Create a new session if the current one is unresponsive
- Check session persistence directory permissions
