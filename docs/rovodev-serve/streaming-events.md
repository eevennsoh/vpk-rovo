---
title: Streaming events
description: Streaming events
platform: platform
product: rovodev-cli
category: devguide
subcategory: serve
date: '2025-10-09'
---

Serve Mode
# Streaming Events Reference

The Rovo Dev Serve API uses Server-Sent Events (SSE) to provide real-time streaming responses. This document describes all event types and their schemas.

## Event Format

All streaming events follow the SSE format:
```
event: <event_type>
data: <json_data>

```

## Event Types

### 1. user-prompt
Echoes back the user's input message.

**Schema:**
```json
{
  "content": "string",
  "timestamp": "2025-08-15T06:33:29.019496+00:00",
  "part_kind": "user-prompt"
}
```

**Example:**
```
event: user-prompt
data: {"content": "Open a file in the repo and describe it", "timestamp": "2025-08-15T06:33:29.019496+00:00", "part_kind": "user-prompt"}
```

### 2. part_start
Indicates the beginning of a new response part (text or tool call).

**Schema:**
```json
{
  "index": 0,
  "part": {
    "content": "string",           // For text parts
    "part_kind": "text"
  },
  "event_kind": "part_start"
}
```

**For tool calls:**
```json
{
  "index": 1,
  "part": {
    "tool_name": "string",
    "args": null,                  // Initially null, populated via deltas
    "tool_call_id": "string",
    "part_kind": "tool-call"
  },
  "event_kind": "part_start"
}
```

**Examples:**
```
event: part_start
data: {"index": 0, "part": {"content": "I'll help you explore", "part_kind": "text"}, "event_kind": "part_start"}

event: part_start
data: {"index": 1, "part": {"tool_name": "open_files", "args": null, "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP", "part_kind": "tool-call"}, "event_kind": "part_start"}
```

### 3. part_delta
Provides incremental updates to the current part.

**For text parts:**
```json
{
  "index": 0,
  "delta": {
    "content_delta": "string",
    "part_delta_kind": "text"
  },
  "event_kind": "part_delta"
}
```

**For tool calls:**
```json
{
  "index": 1,
  "delta": {
    "tool_name_delta": "",
    "args_delta": "string",        // JSON string being built incrementally
    "tool_call_id": "string",
    "part_delta_kind": "tool_call"
  },
  "event_kind": "part_delta"
}
```

**Examples:**
```
event: part_delta
data: {"index": 0, "delta": {"content_delta": " the repository by", "part_delta_kind": "text"}, "event_kind": "part_delta"}

event: part_delta
data: {"index": 1, "delta": {"tool_name_delta": "", "args_delta": "{\"fi", "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP", "part_delta_kind": "tool_call"}, "event_kind": "part_delta"}
```

### 4. tool-return
Contains the result of a tool execution.

**Schema:**
```json
{
  "tool_name": "string",
  "content": "string",             // Tool execution result
  "tool_call_id": "string",
  "metadata": null,               // Optional metadata
  "timestamp": "2025-08-15T06:33:29.019496+00:00",
  "part_kind": "tool-return"
}
```

**Example:**
```
event: tool-return
data: {"tool_name": "open_files", "content": "Successfully opened README.md:\n\n````markdown\n   0 # ACRA Python Monorepo\n   1 \n   2 This repository contains multiple Python packages:\n...", "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP", "metadata": null, "timestamp": "2025-08-15T06:33:29.019496+00:00", "part_kind": "tool-return"}
```

### 5. usage
Provides token usage statistics for the current request.

**Schema:**
```json
{
  "requests": 1,
  "input_tokens": 28109,
  "output_tokens": 558,
  "total_tokens": 28667,
  "details": {
    "cache_creation_input_tokens": 14971,
    "cache_read_input_tokens": 13130,
    "input_tokens": 8,
    "output_tokens": 558
  },
  "timestamp": "2025-08-15T06:33:29.019496+00:00",
  "part_kind": "usage"
}
```

### 6. ping
Periodic keepalive events to maintain the connection.

**Example:**
```
: ping - 2025-08-15 06:33:43.796176+00:00
```

### 7. exception
Emitted when the system encounters an exception.

**Schema:**
```json
{
  "message": "string",         // Combined title and message (e.g., "Title - Message")
  "title": "string | null",    // Optional error title (can be null)
  "type": "string"             // The error type
}
```

### 8. warning
Emitted when the system generates warning messages during model requests, fallbacks, and error handling.

**Schema:**
```json
{
  "message": "string",         // Combined title and message (e.g., "Title - Message")
  "title": "string | null"     // Optional warning title (can be null)
}
```

**Warning Types:**

#### Server Error Warnings
- **Server Error**: Model request failed due to server issues (5xx errors)
- **Rate Limit Exceeded**: General rate limiting warnings
- **You've reached your minute token limit**: Specific per-minute rate limit warnings

#### Context and Token Limit Warnings  
- **Context limit reached**: Request exceeds model's context window, retrying with pruned history
- **LLM response too long**: Response exceeded max output tokens, retrying with additional instructions

#### Connection and Network Warnings
- **Connection Error**: Network connectivity issues or unexpected connection closures
- **Using fallback model**: Primary model failed, switching to fallback model

#### Content Blocking Warnings
- **Binary Content Blocked**: GPT models cannot process binary content (images, files)

**Examples:**
```
event: warning
data: {"message": "You've reached your minute token limit - We'll try again in 60 seconds.", "title": "You've reached your minute token limit"}

event: warning
data: {"message": "Rate limit exceeded - We'll try again in 10 seconds.", "title": "Rate limit exceeded"}

event: warning
data: {"message": "Context limit reached - Retrying using pruned message history", "title": "Context limit reached"}

event: warning
data: {"message": "Server error - Model request ended unexpectedly, retrying.", "title": "Server error"}

event: warning
data: {"message": "LLM response too long - LLM response was cut off because it exceeded the maximum output tokens, retrying with additional instructions.", "title": "LLM response too long"}

event: warning
data: {"message": "Connection to model provider was unexpectedly closed. Retrying...", "title": null}

event: warning
data: {"message": "Using fallback model - Model request failed after multiple attempts, trying fallback model.", "title": "Using fallback model"}
```

### 9. on_call_tools_start (V3 with pause_on_call_tools_start=true)
Emitted when tool execution is about to start and paused for approval.

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

## Event Processing Examples

### Python Event Parser

```python
import json
import requests

def parse_sse_events(response):
    """Parse Server-Sent Events from streaming response."""
    current_parts = {}
    
    for line in response.iter_lines():
        if not line:
            continue
            
        line = line.decode('utf-8')
        
        if line.startswith('event: '):
            event_type = line[7:]
        elif line.startswith('data: '):
            try:
                data = json.loads(line[6:])
                yield event_type, data
            except json.JSONDecodeError:
                continue
        elif line.startswith(': ping'):
            yield 'ping', {'timestamp': line.split(' - ')[1]}

def handle_chat_stream(message):
    """Handle a complete chat stream."""
    response = requests.post(
        "http://localhost:8123/v2/chat",
        json={"message": message, "enable_deep_plan": False},
        stream=True
    )
    
    current_text = ""
    current_tools = {}
    
    for event_type, data in parse_sse_events(response):
        if event_type == 'user-prompt':
            print(f"User: {data['content']}")
            
        elif event_type == 'part_start':
            if data['part']['part_kind'] == 'text':
                current_text = data['part']['content']
            elif data['part']['part_kind'] == 'tool-call':
                tool_id = data['part']['tool_call_id']
                current_tools[tool_id] = {
                    'name': data['part']['tool_name'],
                    'args': ''
                }
                
        elif event_type == 'part_delta':
            if data['delta']['part_delta_kind'] == 'text':
                current_text += data['delta']['content_delta']
                print(data['delta']['content_delta'], end='', flush=True)
            elif data['delta']['part_delta_kind'] == 'tool_call':
                tool_id = data['delta']['tool_call_id']
                current_tools[tool_id]['args'] += data['delta']['args_delta']
                
        elif event_type == 'tool-return':
            tool_name = data['tool_name']
            result = data['content']
            print(f"\n[Tool: {tool_name}] {result[:100]}...")
            
        elif event_type == 'warning':
            message = data['message']
            title = data.get('title')
            if title:
                print(f"\n[WARNING] {title}: {message}")
            else:
                print(f"\n[WARNING] {message}")
            
        elif event_type == 'usage':
            print(f"\nTokens used: {data['total_tokens']}")

# Usage
handle_chat_stream("List the files in the current directory")
```

### JavaScript Event Parser

```javascript
function parseSSEStream(url, requestBody) {
    return new Promise((resolve, reject) => {
        const events = [];
        
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            function readStream() {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        resolve(events);
                        return;
                    }
                    
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    
                    let currentEvent = null;
                    
                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            currentEvent = line.substring(7);
                        } else if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                events.push({ event: currentEvent, data });
                                
                                // Handle different event types
                                if (currentEvent === 'part_delta' && 
                                    data.delta.part_delta_kind === 'text') {
                                    process.stdout.write(data.delta.content_delta);
                                }
                            } catch (e) {
                                console.error('Failed to parse JSON:', e);
                            }
                        }
                    }
                    
                    return readStream();
                });
            }
            
            return readStream();
        })
        .catch(reject);
    });
}

// Usage
parseSSEStream('http://localhost:8123/v2/chat', {
    message: "Explain the project structure",
    enable_deep_plan: false
}).then(events => {
    console.log('Stream completed with', events.length, 'events');
});
```

### Bash Event Parser

```bash
#!/bin/bash

parse_chat_stream() {
    local message="$1"
    local current_text=""
    
    curl -X POST http://localhost:8123/v2/chat \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\", \"enable_deep_plan\": false}" \
        --no-buffer | while IFS= read -r line; do
        
        if [[ $line == "event: "* ]]; then
            event_type="${line#event: }"
        elif [[ $line == "data: "* ]]; then
            data="${line#data: }"
            
            case "$event_type" in
                "user-prompt")
                    echo "User: $(echo "$data" | jq -r '.content')"
                    ;;
                "part_delta")
                    if [[ $(echo "$data" | jq -r '.delta.part_delta_kind') == "text" ]]; then
                        content_delta=$(echo "$data" | jq -r '.delta.content_delta')
                        printf "%s" "$content_delta"
                    fi
                    ;;
                "tool-return")
                    echo ""
                    tool_name=$(echo "$data" | jq -r '.tool_name')
                    echo "[Tool: $tool_name executed]"
                    ;;
                "warning")
                    echo ""
                    message=$(echo "$data" | jq -r '.message')
                    title=$(echo "$data" | jq -r '.title // empty')
                    if [[ -n "$title" && "$title" != "null" ]]; then
                        echo "[WARNING] $title: $message"
                    else
                        echo "[WARNING] $message"
                    fi
                    ;;
                "usage")
                    echo ""
                    total_tokens=$(echo "$data" | jq -r '.total_tokens')
                    echo "Tokens used: $total_tokens"
                    ;;
            esac
        fi
    done
}

# Usage
parse_chat_stream "List the files in the current directory"
```

## Event Sequence Examples

### Simple Text Response
```
event: user-prompt
data: {"content": "Hello", "timestamp": "...", "part_kind": "user-prompt"}

event: part_start
data: {"index": 0, "part": {"content": "Hello!", "part_kind": "text"}, "event_kind": "part_start"}

event: part_delta
data: {"index": 0, "delta": {"content_delta": " How can I help you today?", "part_delta_kind": "text"}, "event_kind": "part_delta"}
```

### Tool Execution Response
```
event: user-prompt
data: {"content": "List files", "timestamp": "...", "part_kind": "user-prompt"}

event: part_start
data: {"index": 0, "part": {"content": "I'll list", "part_kind": "text"}, "event_kind": "part_start"}

event: part_delta
data: {"index": 0, "delta": {"content_delta": " the files for you.", "part_delta_kind": "text"}, "event_kind": "part_delta"}

event: part_start
data: {"index": 1, "part": {"tool_name": "bash", "args": null, "tool_call_id": "tool_123", "part_kind": "tool-call"}, "event_kind": "part_start"}

event: part_delta
data: {"index": 1, "delta": {"args_delta": "{\"command\": \"ls -la\"}", "tool_call_id": "tool_123", "part_delta_kind": "tool_call"}, "event_kind": "part_delta"}

event: tool-return
data: {"tool_name": "bash", "content": "total 48\ndrwxr-xr-x  12 user  staff   384 Aug 15 06:33 .\n...", "tool_call_id": "tool_123", "part_kind": "tool-return"}

event: part_start
data: {"index": 0, "part": {"content": "Here are", "part_kind": "text"}, "event_kind": "part_start"}

event: part_delta
data: {"index": 0, "delta": {"content_delta": " the files in your directory:", "part_delta_kind": "text"}, "event_kind": "part_delta"}
```

## Best Practices

1. **Buffer Management**: Always handle partial JSON in `args_delta` events
2. **Error Handling**: Gracefully handle malformed JSON in data fields
3. **Connection Management**: Implement reconnection logic for long-running streams
4. **Memory Management**: Clear accumulated text/args when starting new parts
5. **Timeout Handling**: Set appropriate timeouts for streaming connections
6. **Event Ordering**: Process events in the order received to maintain state consistency
