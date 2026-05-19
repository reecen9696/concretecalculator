#!/bin/bash
# Smooth Concrete Calculator - Startup Script with Supervisor
# Includes loop protection, graceful restarts, and health monitoring

set -e

CALC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$CALC_DIR/logs"
PID_FILE="$CALC_DIR/supervisor.pid"

# Create log directory
mkdir -p "$LOG_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Smooth Concrete Calculator - Startup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project Dir: $CALC_DIR"
echo "Logs Dir:    $LOG_DIR"
echo ""

# Check if supervisor is already running
if [ -f "$PID_FILE" ]; then
    EXISTING_PID=$(cat "$PID_FILE")
    if kill -0 "$EXISTING_PID" 2>/dev/null; then
        echo "⚠️  Supervisor already running (PID: $EXISTING_PID)"
        echo "To restart, run: pkill -f supervisor.py"
        exit 0
    else
        echo "⚠️  Stale PID file found. Cleaning up..."
        rm "$PID_FILE"
    fi
fi

# Kill any stale processes on port 8001
echo "Checking for stale processes on port 8001..."
if lsof -i :8001 >/dev/null 2>&1; then
    echo "⚠️  Found process on port 8001. Killing..."
    lsof -ti :8001 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

# Verify venv exists
if [ ! -d "$CALC_DIR/venv" ]; then
    echo "❌ Virtual environment not found at $CALC_DIR/venv"
    echo "Run: cd $CALC_DIR && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Start supervisor in background
echo ""
echo "Starting supervisor (with loop protection)..."
cd "$CALC_DIR"

# Source venv
source venv/bin/activate

# Start supervisor and save PID
python3 supervisor.py &
SUPERVISOR_PID=$!
echo "$SUPERVISOR_PID" > "$PID_FILE"

echo ""
echo "✅ Supervisor started (PID: $SUPERVISOR_PID)"
echo "   Logs: $LOG_DIR/supervisor.log"
echo "   Status: $LOG_DIR/supervisor_status.json"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server should be running at: http://localhost:8001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Monitor logs: tail -f $LOG_DIR/supervisor.log"
echo "Stop server: pkill -f supervisor.py"
echo ""

# Wait a moment for server to start
sleep 3

# Verify server is responding
echo "Verifying server health..."
for i in {1..5}; do
    if curl -s http://localhost:8001/health >/dev/null 2>&1; then
        echo "✅ Server is responding to health checks"
        break
    else
        echo "⏳ Waiting for server (attempt $i/5)..."
        sleep 2
    fi
done

# Keep the process in foreground
wait $SUPERVISOR_PID
