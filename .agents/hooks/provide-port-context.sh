#!/bin/bash
#
# Hook: Provide port context before browser/agent-browser tools
#
# This hook reads the active dev server ports from the worktree's port files
# and provides them as context to Claude before browser-related tool calls.
#
# Port files:
#   .dev-frontend-port - Contains the frontend port (e.g., 3000, 3020)
#   .dev-backend-port  - Contains the backend port (e.g., 8080, 8100)

# Read the hook input from stdin (JSON with tool info)
INPUT=$(cat)

# Determine project directory
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# Initialize port variables
FRONTEND_PORT=""
BACKEND_PORT=""
CONTEXT_PARTS=()

# Read frontend port if file exists
FRONTEND_PORT_FILE="$PROJECT_DIR/.dev-frontend-port"
if [ -f "$FRONTEND_PORT_FILE" ]; then
    FRONTEND_PORT=$(cat "$FRONTEND_PORT_FILE" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$FRONTEND_PORT" ]; then
        CONTEXT_PARTS+=("Frontend: http://localhost:$FRONTEND_PORT")
    fi
fi

# Read backend port if file exists
BACKEND_PORT_FILE="$PROJECT_DIR/.dev-backend-port"
if [ -f "$BACKEND_PORT_FILE" ]; then
    BACKEND_PORT=$(cat "$BACKEND_PORT_FILE" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$BACKEND_PORT" ]; then
        CONTEXT_PARTS+=("Backend API: http://localhost:$BACKEND_PORT")
    fi
fi

# Read rovo port if file exists
ROVO_PORT_FILE="$PROJECT_DIR/.dev-rovo-port"
if [ -f "$ROVO_PORT_FILE" ]; then
    ROVO_PORT=$(cat "$ROVO_PORT_FILE" 2>/dev/null | tr -d '[:space:]')
    if [ -n "$ROVO_PORT" ]; then
        CONTEXT_PARTS+=("Rovo Serve: http://localhost:$ROVO_PORT")
    fi
fi

# If we found any ports, output context for Claude
if [ ${#CONTEXT_PARTS[@]} -gt 0 ]; then
    # Build the context message
    CONTEXT="Dev servers running in this worktree: ${CONTEXT_PARTS[*]}. Use the frontend URL (http://localhost:$FRONTEND_PORT) when navigating to pages."

    # Escape for JSON
    CONTEXT_ESCAPED=$(echo "$CONTEXT" | sed 's/"/\\"/g' | tr -d '\n')

    # Output JSON with additional context
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "$CONTEXT_ESCAPED"
  }
}
EOF
else
    # No ports found - check if servers might not be running
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "No dev servers detected in this worktree. Start with 'pnpm run dev' if you need to test locally."
  }
}
EOF
fi

exit 0
