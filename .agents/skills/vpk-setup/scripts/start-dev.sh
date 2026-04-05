#!/bin/bash
set -e

# Parse command line arguments
NO_WAIT=false
FORCE_KILL=false
for arg in "$@"; do
    case $arg in
        --no-wait)
            NO_WAIT=true
            shift
            ;;
        --force-kill)
            FORCE_KILL=true
            shift
            ;;
    esac
done

echo "🚀 Starting VPK Development Environment"
echo "======================================"

# Stop only services started by this script
echo "🛑 Cleaning up existing processes..."
if [ -f .dev-pids ]; then
    ./.agents/skills/vpk-setup/scripts/stop-dev.sh
else
    echo "   ℹ️  No PID file found; leaving existing services running."
fi

# Wait a moment for ports to be released
sleep 1

# Force kill zombie processes on default ports if requested
if [ "$FORCE_KILL" = true ]; then
    echo "   🔪 Force killing processes on ports 3000-3019 and 8000-8099..."
    for port in $(seq 3000 3019) $(seq 8000 8099); do
        lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
    done
    sleep 1
    echo "   ✅ Ports cleared"
fi

# Handle stale Next.js dev lock (prevents multiple instances)
if [ -f .next/dev/lock ]; then
    # Check if any Next.js dev server is actually running
    NEXT_RUNNING=false
    for port in $(seq 3000 3019); do
        if lsof -n -P -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; then
            NEXT_RUNNING=true
            break
        fi
    done
    
    if [ "$NEXT_RUNNING" = true ]; then
        echo "⚠️  Next.js dev lock detected and a dev server is already running."
        echo "   Options:"
        echo "   1. Stop it first: ./.agents/skills/vpk-setup/scripts/stop-dev.sh"
        echo "   2. Force kill: ./.agents/skills/vpk-setup/scripts/start-dev.sh --force-kill"
        echo "   3. Let auto-port-finding use next available port (continuing...)"
        echo ""
        # Don't exit - let the port-finding logic handle it
    else
        echo "   ℹ️  Removing stale Next.js dev lock (no server running)"
        rm -f .next/dev/lock
    fi
fi

echo "✅ Environment ready (port auto-discovery enabled: 3000-3019, 8000-8099)"

# Start full stack via the rovodev script (RovoDev Serve + backend + frontend)
echo "🤖 Starting RovoDev Serve + backend + frontend..."
if [ "$NO_WAIT" = true ]; then
    # For AI/automated execution - use nohup to detach
    nohup pnpm run rovodev > /dev/null 2>&1 &
else
    pnpm run rovodev &
fi
STACK_PID=$!
echo "   Stack PID: $STACK_PID"

echo "   Waiting for port files to initialize..."
for i in $(seq 1 20); do
    if [ -f .dev-backend-port ] && [ -f .dev-frontend-port ] && [ -f .dev-rovodev-port ]; then
        break
    fi
    sleep 0.5
done

ROVODEV_PORT=8000
BACKEND_PORT=8080
FRONTEND_PORT=3000

if [ -f .dev-rovodev-port ]; then
    ROVODEV_PORT=$(cat .dev-rovodev-port | tr -d '[:space:]')
fi

if [ -f .dev-backend-port ]; then
    BACKEND_PORT=$(cat .dev-backend-port | tr -d '[:space:]')
fi

if [ -f .dev-frontend-port ]; then
    FRONTEND_PORT=$(cat .dev-frontend-port | tr -d '[:space:]')
fi

echo ""
echo "🎉 All services started!"
echo "   - RovoDev Serve: http://localhost:${ROVODEV_PORT}"
echo "   - Express Backend: http://localhost:${BACKEND_PORT}"
echo "   - Frontend: http://localhost:${FRONTEND_PORT}"
echo "   - Main chat backend: RovoDev Serve"
echo "   - AI Gateway-backed routes: image, sound, suggestions, Realtime voice"
echo ""
echo "💡 Port auto-discovery: If default ports are in use, servers automatically find available ports."
echo "💡 To stop all services: ./.agents/skills/vpk-setup/scripts/stop-dev.sh"

# Save PIDs for cleanup script
echo "$STACK_PID" > .dev-pids

if [ "$NO_WAIT" = true ]; then
    echo ""
    echo "✅ Servers started in background"
else
    # Keep script running to maintain processes (for manual/terminal use)
    wait
fi
