---
title: Serve Mode
description: Serve Mode
platform: platform
product: rovodev-cli
category: devguide
subcategory: serve
date: '2025-12-01'
---

# Rovo Dev Serve API Documentation

The `rovodev serve` command starts a FastAPI server that provides both REST and Server-Sent Events (SSE) endpoints for interacting with the Rovo Dev agent. This documentation covers both API versions (v2 and v3) and provides comprehensive usage examples.

## Quick Start

Start the server:
```bash
rovodev serve 8123
```

The server will be available at:
- **Base URL**: `http://localhost:8123`
- **Health Check**: `http://localhost:8123/healthcheck`
- **OpenAPI Docs**: `http://localhost:8123/docs`
- **OpenAPI Spec**: `http://localhost:8123/openapi.json`

### Server Options

```bash
# Basic server
rovodev serve 8123

# With GUI mode (web interface on port 8123, API on port 9147)
rovodev gui 8123

# With initial message
rovodev serve 8123 "Open the README file"

# Restore the last session if available
rovodev serve 8123 --restore

# Run with non-interactive mode instructions
rovodev serve 8123 --non-interactive

# With shadow mode (changes applied to temporary clone)
rovodev serve 8123 --shadow

# With XML file content format
rovodev serve 8123 --file-content-render-format xml

# Respect configured tool permissions from config file
rovodev serve 8123 --respect-configured-permissions

# Set Atlassian site URL (billing/integration)
rovodev serve 8123 --site-url https://hello.atlassian.net
```

## API Versions

### V3 API (Primary)
- Base Path: `/v3/`
- Features: Enhanced chat workflow with pause/resume tool execution, separate message setting, agent lifecycle events, comprehensive session management
- Use Case: Recommended for all external integrations; full parity with V2 plus improved control and additional endpoints

### V2 API (Legacy/Internal)
- Base Path: `/v2/`
- Features: Complete chat functionality with streaming, session management, tool execution
- Availability: Exposed only for internal users or when running with a non-default Experience ID (X_Rovodev_Xid != "rovodev-cli")
- Use Case: Backward compatibility for legacy integrations

## Documentation Structure

- **[User Guide](user-guide.md)** - Getting started and common usage patterns
- **[V2 API Reference](v2-api-reference.md)** - Complete V2 endpoint documentation
- **[V3 API Reference](v3-api-reference.md)** - Complete V3 endpoint documentation
- **[Streaming Events](streaming-events.md)** - Detailed SSE event schemas and examples
- **[Examples](examples.md)** - Code examples in various languages

## Experience ID (xid)

Experience ID (xid) identifies which Rovo Dev experience is using the CLI.

- Flag: `--xid`
- Default: `rovodev-cli`
- Deprecated alias: `--application-id` (if used without `--xid`, a warning is logged and the value is treated as xid)

Effects:
- DevAI Axis and AI Gateway requests include `X-RovoDev-Xid: <xid>`
- Analytics include `xid` and `aiFeatureName` derived from xid (e.g. `rovodev-cli` → `RovoDevCLI`)
- Product remains `rovodev`; `applicationId` temporarily set to xid for transition

Examples:
```bash
rovodev serve 8123 --xid rovodev-ide-vscode
rovodev gui --xid rovodev-sessions
```

## Key Features

- Response header: All responses include `X-Session-ID` with the current session ID

- **🔄 Real-time Streaming**: Server-Sent Events for live chat responses
- **🛠️ Tool Integration**: Execute file operations, shell commands, and Atlassian tools
- **💾 Session Management**: Persistent conversation history and state
- **🎯 Deep Planning**: Optional technical planning for complex tasks
- **📝 Context System**: Provide structured context (notes, file references) with messages
- **⏸️ Tool Control**: Pause and resume tool execution (V3)
- **🔀 Agent Modes**: Switch between full agent and read-only exploration modes
- **📊 Usage Tracking**: Token usage and request metrics
- **🌐 Web GUI**: Optional web interface for interactive chat
- **🔒 Shadow Mode**: Safe execution in temporary workspace clones
- **📁 File Caching**: Intelligent file caching for performance
- **🔧 Tool Execution**: Direct tool execution without chat context
- **🔐 MCP Server Management**: Accept/deny third-party MCP server terms
- **🎯 Tour Functionality**: Guided code exploration and explanation (V3)
- **🔧 Model Management**: Switch between different AI models (V3)
- **📊 Usage Analytics**: Token usage and request metrics (V3)
- **🌐 Site Configuration**: Configure Atlassian site URLs for billing (V3)

## Authentication

All API endpoints require Bearer token authentication via the `Authorization` header. When starting the server, a session token is automatically generated and displayed in the startup logs.

```bash
# Example with authentication
curl -H "Authorization: Bearer <session-token>" http://localhost:8123/healthcheck
```

To disable authentication for development purposes:
```bash
rovodev serve 8123 --disable-session-token
```

You can also set a custom session token via environment variable:
```bash
export ROVODEV_SERVE_SESSION_TOKEN=your-custom-token
rovodev serve 8123
```

## Error Handling

### MCP Server Management

#### POST /accept-mcp-terms
Accept or deny terms for third-party MCP servers.

**Request Body:**
```json
{
  "server_name": "example-mcp-server",
  "accept": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Terms accepted for server: example-mcp-server"
}
```

This endpoint allows you to manage third-party MCP (Model Context Protocol) server terms. When a new MCP server is encountered, you can use this endpoint to accept or deny its terms of service.

## Error Handling

All endpoints return standard HTTP status codes:
- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (missing or invalid authentication)
- **409**: Conflict (chat already in progress)
- **422**: Validation Error (invalid request body)
- **500**: Internal Server Error

Error responses include detailed error messages in JSON format.
