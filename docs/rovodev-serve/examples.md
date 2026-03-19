---
title: Examples
description: Examples
platform: platform
product: rovodev-cli
category: devguide
subcategory: serve
date: '2025-10-09'
---

# API Examples

This document provides comprehensive examples for using the Rovo Dev Serve API, including the new context system functionality.

This document provides practical examples for integrating with the Rovo Dev Serve API in various programming languages and scenarios.

## Python Examples

### Basic Chat Client

```python
import requests
import json
import time

class RovoDevClient:
    def __init__(self, base_url="http://localhost:8123"):
        self.base_url = base_url
        
    def health_check(self):
        """Check if the server is running."""
        try:
            response = requests.get(f"{self.base_url}/healthcheck")
            return response.json()
        except requests.RequestException as e:
            return {"error": str(e)}
    
    def chat(self, message, enable_deep_plan=False, version="v2"):
        """Send a chat message and return the complete response."""
        url = f"{self.base_url}/{version}/chat"
        
        response = requests.post(
            url,
            json={"message": message, "enable_deep_plan": enable_deep_plan},
            stream=True
        )
        
        events = []
        current_text = ""
        
        for line in response.iter_lines():
            if not line:
                continue
                
            line = line.decode('utf-8')
            
            if line.startswith('event: '):
                event_type = line[7:]
            elif line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    events.append({"event": event_type, "data": data})
                    
                    # Accumulate text content
                    if event_type == 'part_delta' and data.get('delta', {}).get('part_delta_kind') == 'text':
                        current_text += data['delta']['content_delta']
                        
                except json.JSONDecodeError:
                    continue
        
        return {
            "text": current_text,
            "events": events
        }
    
    def list_sessions(self):
        """List all available sessions."""
        response = requests.get(f"{self.base_url}/v2/sessions/list")
        return response.json()
    
    def get_tools(self):
        """Get available tools."""
        response = requests.get(f"{self.base_url}/v2/tools")
        return response.json()
    
    def execute_tool(self, tool_name, arguments):
        """Execute a tool directly."""
        response = requests.post(
            f"{self.base_url}/v2/tool",
            json={"tool_name": tool_name, "arguments": arguments}
        )
        return response.json()

# Usage example
if __name__ == "__main__":
    client = RovoDevClient()
    
    # Check server health
    health = client.health_check()
    print(f"Server health: {health}")
    
    # Simple chat
    result = client.chat("List the files in the current directory")
    print(f"Response: {result['text']}")
    
    # Chat with deep planning
    result = client.chat("Refactor the main function to be more modular", enable_deep_plan=True)
    print(f"Planned response: {result['text']}")
    
    # List available tools
    tools = client.get_tools()
    print(f"Available tools: {[tool['name'] for tool in tools]}")
    
    # Execute a tool directly
    file_result = client.execute_tool("open_files", {"file_paths": ["README.md"]})
    print(f"File content: {file_result['result'][:200]}...")
```

### Streaming Chat with Real-time Display

```python
import requests
import json
import sys

def stream_chat_realtime(message, enable_deep_plan=False):
    """Stream chat with real-time text display."""
    response = requests.post(
        "http://localhost:8123/v2/chat",
        json={"message": message, "enable_deep_plan": enable_deep_plan},
        stream=True
    )
    
    print(f"User: {message}")
    print("Assistant: ", end="", flush=True)
    
    for line in response.iter_lines():
        if not line:
            continue
            
        line = line.decode('utf-8')
        
        if line.startswith('event: '):
            event_type = line[7:]
        elif line.startswith('data: '):
            try:
                data = json.loads(line[6:])
                
                if event_type == 'part_delta' and data.get('delta', {}).get('part_delta_kind') == 'text':
                    print(data['delta']['content_delta'], end="", flush=True)
                elif event_type == 'tool-return':
                    tool_name = data['tool_name']
                    print(f"\n[Executed: {tool_name}]", flush=True)
                elif event_type == 'usage':
                    tokens = data['total_tokens']
                    print(f"\n[Tokens used: {tokens}]")
                elif event_type == 'close':
                    print("\n")
                    break
                    
            except json.JSONDecodeError:
                continue

# Usage
stream_chat_realtime("Explain the project structure and suggest improvements")
```

### Context System Examples

The context system allows you to provide structured additional information with your messages. Here are comprehensive examples:

```python
import requests
import json

def chat_with_context(message, context_items, enable_deep_plan=False):
    """Send a chat message with context items."""
    url = "http://localhost:8123/v2/chat"
    
    payload = {
        "message": message,
        "context": context_items,
        "enable_deep_plan": enable_deep_plan
    }
    
    response = requests.post(url, json=payload, stream=True)
    
    print(f"User: {message}")
    print("Assistant: ", end="", flush=True)
    
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('event: '):
                event_type = line[7:]
            elif line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    if event_type == 'part_delta' and data.get('delta', {}).get('part_delta_kind') == 'text':
                        print(data['delta']['content_delta'], end='', flush=True)
                    elif event_type == 'close':
                        print("\n")
                        break
                except json.JSONDecodeError:
                    pass

# Example 1: Generic context items
context_items = [
    {
        "type": "note",
        "content": "This is a Python project using FastAPI"
    },
    {
        "type": "requirement",
        "content": "Code must follow PEP 8 style guidelines"
    }
]

chat_with_context(
    "Review the code structure and suggest improvements",
    context_items,
    enable_deep_plan=True
)

# Example 2: File context with specific line selection
file_context = [
    {
        "type": "file",
        "file_path": "src/main.py",
        "selection": {
            "start": 15,
            "end": 30
        },
        "note": "Main processing function that needs optimization"
    }
]

chat_with_context(
    "Analyze this function for performance bottlenecks",
    file_context
)

# Example 3: Multiple file references
multi_file_context = [
    {
        "type": "instruction",
        "content": "Focus on the interaction between these components"
    },
    {
        "type": "file",
        "file_path": "src/models.py",
        "note": "Data models"
    },
    {
        "type": "file",
        "file_path": "src/api.py",
        "selection": {
            "start": 45,
            "end": 75
        },
        "note": "API endpoint implementation"
    }
]

chat_with_context(
    "Help me write comprehensive tests for the API endpoints",
    multi_file_context,
    enable_deep_plan=True
)

# Example 4: V3 API with context
def v3_chat_with_context(message, context_items, enable_deep_plan=False):
    """V3 API workflow with context."""
    base_url = "http://localhost:8123/v3"
    
    # Step 1: Set the chat message with context
    set_message_payload = {
        "message": message,
        "context": context_items,
        "enable_deep_plan": enable_deep_plan
    }
    
    response = requests.post(f"{base_url}/set_chat_message", json=set_message_payload)
    print(f"Message set: {response.json()}")
    
    # Step 2: Stream the chat response
    stream_response = requests.get(f"{base_url}/stream_chat", stream=True)
    
    print(f"User: {message}")
    print("Assistant: ", end="", flush=True)
    
    for line in stream_response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('event: '):
                event_type = line[7:]
            elif line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    if event_type == 'part_delta' and data.get('delta', {}).get('part_delta_kind') == 'text':
                        print(data['delta']['content_delta'], end='', flush=True)
                    elif event_type == 'close':
                        print("\n")
                        break
                except json.JSONDecodeError:
                    pass

# V3 Example with debugging context
debugging_context = [
    {
        "type": "error",
        "content": "TypeError: 'NoneType' object is not subscriptable at line 42"
    },
    {
        "type": "file",
        "file_path": "src/processor.py",
        "selection": {
            "start": 35,
            "end": 50
        },
        "note": "Function where error occurs"
    }
]

v3_chat_with_context(
    "Help me debug this error",
    debugging_context,
    enable_deep_plan=True
)

# Context Builder Helper Class
class ContextBuilder:
    """Helper class for building context items."""
    
    def __init__(self):
        self.items = []
    
    def add_note(self, content):
        """Add a generic note."""
        self.items.append({"type": "note", "content": content})
        return self
    
    def add_instruction(self, content):
        """Add an instruction."""
        self.items.append({"type": "instruction", "content": content})
        return self
    
    def add_file(self, file_path, start_line=None, end_line=None, note=None):
        """Add a file reference."""
        item = {"type": "file", "file_path": file_path}
        
        if start_line is not None and end_line is not None:
            item["selection"] = {"start": start_line, "end": end_line}
        
        if note:
            item["note"] = note
            
        self.items.append(item)
        return self
    
    def build(self):
        """Return the context items list."""
        return self.items

# Usage example with ContextBuilder
context = (ContextBuilder()
    .add_instruction("Focus on error handling and edge cases")
    .add_file("src/api.py", 25, 45, "Error-prone function")
    .add_file("tests/test_api.py", note="Existing test coverage")
    .add_note("This function handles user authentication")
    .build())

chat_with_context("Improve error handling in this function", context)
```

### V3 API with Tool Approval

```python
import requests
import json

class V3ChatClient:
    def __init__(self, base_url="http://localhost:8123/v3"):
        self.base_url = base_url
        
    def interactive_chat(self, message, enable_deep_plan=False):
        """Interactive chat with tool approval."""
        # Set the message
        response = requests.post(
            f"{self.base_url}/set_chat_message",
            json={"message": message, "enable_deep_plan": enable_deep_plan}
        )
        print(f"Message set: {response.json()}")
        
        # Stream with tool pausing
        response = requests.get(
            f"{self.base_url}/stream_chat?pause_on_call_tools_start=true",
            stream=True
        )
        
        print(f"User: {message}")
        print("Assistant: ", end="", flush=True)
        
        for line in response.iter_lines():
            if not line:
                continue
                
            line = line.decode('utf-8')
            
            if line.startswith('event: '):
                event_type = line[7:]
            elif line.startswith('data: '):
                try:
                    data = json.loads(line[6:])
                    
                    if event_type == 'part_delta' and data.get('delta', {}).get('part_delta_kind') == 'text':
                        print(data['delta']['content_delta'], end="", flush=True)
                        
                    elif event_type == 'on_call_tools_start':
                        print("\n\n--- Tool Execution Requested ---")
                        decisions = []
                        
                        for tool_call in data['parts']:
                            tool_name = tool_call['tool_name']
                            args = tool_call['args']
                            tool_id = tool_call['tool_call_id']
                            
                            print(f"Tool: {tool_name}")
                            print(f"Arguments: {json.dumps(args, indent=2)}")
                            
                            approval = input("Approve this tool execution? (y/n): ").lower() == 'y'
                            
                            decisions.append({
                                "tool_call_id": tool_id,
                                "deny_message": None if approval else "Tool execution denied by user"
                            })
                        
                        # Resume with decisions
                        resume_response = requests.post(
                            f"{self.base_url}/resume_tool_calls",
                            json={"decisions": decisions}
                        )
                        print(f"Resumed: {resume_response.json()}")
                        print("Assistant: ", end="", flush=True)
                        
                    elif event_type == 'tool-return':
                        tool_name = data['tool_name']
                        print(f"\n[Executed: {tool_name}]")
                        print("Assistant: ", end="", flush=True)
                        
                    elif event_type == 'close':
                        print("\n")
                        break
                        
                except json.JSONDecodeError:
                    continue

# Usage
client = V3ChatClient()
client.interactive_chat("Delete all .pyc files in the project")
```

## JavaScript/Node.js Examples

### Basic Chat Client

```javascript
const fetch = require('node-fetch');

class RovoDevClient {
    constructor(baseUrl = 'http://localhost:8123') {
        this.baseUrl = baseUrl;
    }
    
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/healthcheck`);
            return await response.json();
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async chat(message, enableDeepPlan = false) {
        const response = await fetch(`${this.baseUrl}/v2/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                enable_deep_plan: enableDeepPlan
            })
        });
        
        const events = [];
        let currentText = '';
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
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
                        
                        if (currentEvent === 'part_delta' && 
                            data.delta?.part_delta_kind === 'text') {
                            currentText += data.delta.content_delta;
                        }
                    } catch (e) {
                        // Skip malformed JSON
                    }
                }
            }
        }
        
        return { text: currentText, events };
    }
    
    async listSessions() {
        const response = await fetch(`${this.baseUrl}/v2/sessions/list`);
        return await response.json();
    }
    
    async getTools() {
        const response = await fetch(`${this.baseUrl}/v2/tools`);
        return await response.json();
    }
    
    async executeTool(toolName, arguments) {
        const response = await fetch(`${this.baseUrl}/v2/tool`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tool_name: toolName,
                arguments: arguments
            })
        });
        return await response.json();
    }
}

// Usage example
async function main() {
    const client = new RovoDevClient();
    
    // Check server health
    const health = await client.healthCheck();
    console.log('Server health:', health);
    
    // Simple chat
    const result = await client.chat('List the files in the current directory');
    console.log('Response:', result.text);
    
    // List tools
    const tools = await client.getTools();
    console.log('Available tools:', tools.map(tool => tool.name));
    
    // Execute tool
    const fileResult = await client.executeTool('open_files', {
        file_paths: ['README.md']
    });
    console.log('File content:', fileResult.result.substring(0, 200) + '...');
}

main().catch(console.error);
```

### Real-time Streaming with EventSource

```javascript
function streamChat(message, enableDeepPlan = false) {
    return new Promise((resolve, reject) => {
        const events = [];
        let currentText = '';
        
        // Note: EventSource doesn't support POST, so we'll use fetch with ReadableStream
        fetch('http://localhost:8123/v2/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                enable_deep_plan: enableDeepPlan
            })
        })
        .then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            function readStream() {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        resolve({ text: currentText, events });
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
                                
                                if (currentEvent === 'part_delta' && 
                                    data.delta?.part_delta_kind === 'text') {
                                    process.stdout.write(data.delta.content_delta);
                                    currentText += data.delta.content_delta;
                                }
                                
                                if (currentEvent === 'close') {
                                    console.log('\n');
                                    resolve({ text: currentText, events });
                                    return;
                                }
                            } catch (e) {
                                // Skip malformed JSON
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
console.log('User: Explain the project structure');
console.log('Assistant: ');
streamChat('Explain the project structure')
    .then(result => {
        console.log(`\n[Completed with ${result.events.length} events]`);
    })
    .catch(console.error);
```

## Bash/Shell Examples

### Simple Chat Script

```bash
#!/bin/bash

# Simple chat function
chat() {
    local message="$1"
    local deep_plan="${2:-false}"
    
    echo "User: $message"
    echo -n "Assistant: "
    
    curl -X POST http://localhost:8123/v2/chat \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\", \"enable_deep_plan\": $deep_plan}" \
        --no-buffer --silent | while IFS= read -r line; do
        
        if [[ $line == "event: "* ]]; then
            event_type="${line#event: }"
        elif [[ $line == "data: "* ]]; then
            data="${line#data: }"
            
            if [[ "$event_type" == "part_delta" ]]; then
                content_delta=$(echo "$data" | jq -r '.delta.content_delta // empty')
                if [[ -n "$content_delta" ]]; then
                    printf "%s" "$content_delta"
                fi
            elif [[ "$event_type" == "tool-return" ]]; then
                tool_name=$(echo "$data" | jq -r '.tool_name')
                echo ""
                echo "[Executed: $tool_name]"
                echo -n "Assistant: "
            elif [[ "$event_type" == "close" ]]; then
                echo ""
                break
            fi
        fi
    done
}

# Interactive chat loop
interactive_chat() {
    echo "Rovo Dev Chat (type 'exit' to quit)"
    
    while true; do
        echo -n "You: "
        read -r message
        
        if [[ "$message" == "exit" ]]; then
            break
        fi
        
        chat "$message"
        echo ""
    done
}

# Tool execution function
execute_tool() {
    local tool_name="$1"
    local args="$2"
    
    curl -X POST http://localhost:8123/v2/tool \
        -H "Content-Type: application/json" \
        -d "{\"tool_name\": \"$tool_name\", \"arguments\": $args}" \
        --silent | jq -r '.result'
}

# Session management
list_sessions() {
    curl -s http://localhost:8123/v2/sessions/list | jq -r '.sessions[] | "\(.session_context.id): \(.title)"'
}

create_session() {
    curl -X POST http://localhost:8123/v2/sessions/create --silent | jq -r '.session_id'
}

# Usage examples
case "${1:-help}" in
    "chat")
        chat "$2" "$3"
        ;;
    "interactive")
        interactive_chat
        ;;
    "tool")
        execute_tool "$2" "$3"
        ;;
    "sessions")
        list_sessions
        ;;
    "new-session")
        session_id=$(create_session)
        echo "Created session: $session_id"
        ;;
    "help"|*)
        echo "Usage: $0 {chat|interactive|tool|sessions|new-session}"
        echo "  chat 'message' [true|false]  - Send a chat message"
        echo "  interactive                  - Start interactive chat"
        echo "  tool 'name' 'args'          - Execute a tool"
        echo "  sessions                     - List sessions"
        echo "  new-session                  - Create new session"
        ;;
esac
```

### Advanced Streaming Parser

```bash
#!/bin/bash

# Advanced streaming parser with event handling
parse_stream() {
    local url="$1"
    local request_data="$2"
    
    declare -A current_parts
    local event_type=""
    
    curl -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$request_data" \
        --no-buffer --silent | while IFS= read -r line; do
        
        if [[ $line == "event: "* ]]; then
            event_type="${line#event: }"
            
        elif [[ $line == "data: "* ]]; then
            data="${line#data: }"
            
            case "$event_type" in
                "user-prompt")
                    content=$(echo "$data" | jq -r '.content')
                    echo "👤 User: $content"
                    echo -n "🤖 Assistant: "
                    ;;
                    
                "part_start")
                    part_kind=$(echo "$data" | jq -r '.part.part_kind')
                    if [[ "$part_kind" == "tool-call" ]]; then
                        tool_name=$(echo "$data" | jq -r '.part.tool_name')
                        echo ""
                        echo "🔧 Preparing to use tool: $tool_name"
                    fi
                    ;;
                    
                "part_delta")
                    delta_kind=$(echo "$data" | jq -r '.delta.part_delta_kind')
                    if [[ "$delta_kind" == "text" ]]; then
                        content_delta=$(echo "$data" | jq -r '.delta.content_delta')
                        printf "%s" "$content_delta"
                    fi
                    ;;
                    
                "tool-return")
                    tool_name=$(echo "$data" | jq -r '.tool_name')
                    echo ""
                    echo "✅ Tool $tool_name completed"
                    echo -n "🤖 Assistant: "
                    ;;
                    
                "usage")
                    total_tokens=$(echo "$data" | jq -r '.total_tokens')
                    echo ""
                    echo "📊 Tokens used: $total_tokens"
                    ;;
                    
                "close")
                    echo ""
                    echo "✨ Chat completed"
                    break
                    ;;
                    
                "ping")
                    # Keep connection alive
                    ;;
            esac
            
        elif [[ $line == ": ping"* ]]; then
            # Handle ping comments
            :
        fi
    done
}

# Usage
parse_stream "http://localhost:8123/v2/chat" '{"message": "Analyze the project structure", "enable_deep_plan": true}'
```

## cURL Examples

### Basic Operations

```bash
# Health check
curl http://localhost:8123/healthcheck

# Simple chat
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}' \
  --no-buffer

# Chat with deep planning
curl -X POST http://localhost:8123/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Refactor the main.py file", "enable_deep_plan": true}' \
  --no-buffer

# List sessions
curl http://localhost:8123/v2/sessions/list | jq .

# Get current session
curl http://localhost:8123/v2/sessions/current_session | jq .

# Create new session
curl -X POST http://localhost:8123/v2/sessions/create | jq .

# List available tools
curl http://localhost:8123/v2/tools | jq '.[] | .name'

# Execute tool directly
curl -X POST http://localhost:8123/v2/tool \
  -H "Content-Type: application/json" \
  -d '{
    "tool_name": "open_files",
    "arguments": {
      "file_paths": ["README.md"]
    }
  }' | jq -r '.result'

# Reset agent
curl -X POST http://localhost:8123/v2/reset | jq .

# Cancel ongoing chat
curl -X POST http://localhost:8123/v2/cancel | jq .
```

### V3 API Operations

```bash
# Set chat message
curl -X POST http://localhost:8123/v3/set_chat_message \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a new Python file", "enable_deep_plan": false}' | jq .

# Stream chat
curl http://localhost:8123/v3/stream_chat --no-buffer

# Stream with tool pausing
curl "http://localhost:8123/v3/stream_chat?pause_on_call_tools_start=true" --no-buffer

# Resume tool calls (approve)
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

# Resume tool calls (deny)
curl -X POST http://localhost:8123/v3/resume_tool_calls \
  -H "Content-Type: application/json" \
  -d '{
    "decisions": [
      {
        "tool_call_id": "toolu_vrtx_01CtgADk2XWPu4jhKVwiKaeP",
        "deny_message": "File creation not approved"
      }
    ]
  }' | jq .
```

## Integration Patterns

### Web Application Integration

```javascript
// React component example
import React, { useState, useEffect } from 'react';

function ChatInterface() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    
    const sendMessage = async () => {
        if (!message.trim()) return;
        
        setIsStreaming(true);
        setResponse('');
        
        try {
            const response = await fetch('http://localhost:8123/v2/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    enable_deep_plan: false
                })
            });
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                let currentEvent = null;
                
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        currentEvent = line.substring(7);
                    } else if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            
                            if (currentEvent === 'part_delta' && 
                                data.delta?.part_delta_kind === 'text') {
                                setResponse(prev => prev + data.delta.content_delta);
                            }
                            
                            if (currentEvent === 'close') {
                                setIsStreaming(false);
                                return;
                            }
                        } catch (e) {
                            // Skip malformed JSON
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setIsStreaming(false);
        }
    };
    
    return (
        <div>
            <div>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message..."
                    disabled={isStreaming}
                />
                <button onClick={sendMessage} disabled={isStreaming}>
                    {isStreaming ? 'Sending...' : 'Send'}
                </button>
            </div>
            <div>
                <h3>Response:</h3>
                <pre>{response}</pre>
            </div>
        </div>
    );
}

export default ChatInterface;
```

### CLI Tool Integration

```python
#!/usr/bin/env python3
"""
Command-line tool for interacting with Rovo Dev API
"""
import argparse
import requests
import json
import sys

def main():
    parser = argparse.ArgumentParser(description='Rovo Dev CLI Client')
    parser.add_argument('--url', default='http://localhost:8123', help='Server URL')
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Chat command
    chat_parser = subparsers.add_parser('chat', help='Send chat message')
    chat_parser.add_argument('message', help='Message to send')
    chat_parser.add_argument('--deep-plan', action='store_true', help='Enable deep planning')
    chat_parser.add_argument('--stream', action='store_true', help='Stream response')
    
    # Tool command
    tool_parser = subparsers.add_parser('tool', help='Execute tool')
    tool_parser.add_argument('name', help='Tool name')
    tool_parser.add_argument('args', help='Tool arguments (JSON)')
    
    # Session commands
    session_parser = subparsers.add_parser('session', help='Session management')
    session_parser.add_argument('action', choices=['list', 'create', 'current'])
    
    args = parser.parse_args()
    
    if args.command == 'chat':
        if args.stream:
            stream_chat(args.url, args.message, args.deep_plan)
        else:
            result = simple_chat(args.url, args.message, args.deep_plan)
            print(result['text'])
            
    elif args.command == 'tool':
        try:
            arguments = json.loads(args.args)
        except json.JSONDecodeError:
            print("Error: Tool arguments must be valid JSON", file=sys.stderr)
            sys.exit(1)
            
        result = execute_tool(args.url, args.name, arguments)
        print(result['result'])
        
    elif args.command == 'session':
        if args.action == 'list':
            sessions = list_sessions(args.url)
            for session in sessions['sessions']:
                print(f"{session['session_context']['id']}: {session['title']}")
        elif args.action == 'create':
            result = create_session(args.url)
            print(f"Created session: {result['session_id']}")
        elif args.action == 'current':
            session = get_current_session(args.url)
            print(f"Current session: {session['session_context']['id']}")

def stream_chat(url, message, deep_plan):
    response = requests.post(
        f"{url}/v2/chat",
        json={"message": message, "enable_deep_plan": deep_plan},
        stream=True
    )
    
    for line in response.iter_lines():
        if not line:
            continue
            
        line = line.decode('utf-8')
        
        if line.startswith('event: '):
            event_type = line[7:]
        elif line.startswith('data: '):
            try:
                data = json.loads(line[6:])
                
                if event_type == 'part_delta' and data.get('delta', {}).get('part_delta_kind') == 'text':
                    print(data['delta']['content_delta'], end='', flush=True)
                elif event_type == 'close':
                    print()
                    break
                    
            except json.JSONDecodeError:
                continue

def simple_chat(url, message, deep_plan):
    # Implementation similar to previous examples
    pass

def execute_tool(url, tool_name, arguments):
    response = requests.post(
        f"{url}/v2/tool",
        json={"tool_name": tool_name, "arguments": arguments}
    )
    return response.json()

def list_sessions(url):
    response = requests.get(f"{url}/v2/sessions/list")
    return response.json()

def create_session(url):
    response = requests.post(f"{url}/v2/sessions/create")
    return response.json()

def get_current_session(url):
    response = requests.get(f"{url}/v2/sessions/current_session")
    return response.json()

if __name__ == '__main__':
    main()
```

These examples provide a comprehensive foundation for integrating with the Rovo Dev Serve API across different programming languages and use cases.
