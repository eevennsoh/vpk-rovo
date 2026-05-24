#!/bin/bash
set -e

echo "🛑 Stopping VPK Development Environment"

if [ -f .dev-pids ]; then
    PIDS=$(cat .dev-pids)
    for pid in $PIDS; do
        if kill -0 $pid 2>/dev/null; then
            echo "   Stopping PID: $pid"
            kill $pid
        fi
    done
    rm .dev-pids
    rm -f .dev-rovo-port
    rm -f .dev-rovo-ports
    rm -f .dev-backend-port
    rm -f .dev-frontend-port
    echo "✅ All services stopped"
else
    echo "⚠️  No PID file found. Manually kill processes if needed."
    echo ""
    echo "To manually stop services:"
    echo "  pkill -f 'node scripts/dev-rovo.js'"
    echo "  pkill -f 'node scripts/dev-backend.js'"
    echo "  pkill -f 'next dev'"
fi

# Clean up stale Next.js lock if present
rm -f .next/dev/lock
