#!/bin/bash
# Liam Startup Script - Called when gateway starts
# Checks pending tasks and sends status summary

set -euo pipefail

TASKS_FILE="/home/liam/clawd/PENDING-TASKS.md"
TELEGRAM_TARGET="886031571"
LOG_FILE="/home/liam/.clawdbot/logs/liam-startup.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

send_telegram() {
    cd /home/liam
    node scripts/run-node.mjs message send -m "$1" --channel telegram --target "$TELEGRAM_TARGET" 2>/dev/null || true
}

# Count pending tasks
count_pending() {
    if [ -f "$TASKS_FILE" ]; then
        grep -c "^\- \[ \]" "$TASKS_FILE" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Get high priority tasks
get_high_priority() {
    if [ -f "$TASKS_FILE" ]; then
        # Extract HIGH priority section tasks
        sed -n '/## Priority: HIGH/,/## Priority: MEDIUM/p' "$TASKS_FILE" | grep "^\- \[ \]" | head -3 | sed 's/^\- \[ \] \*\*/- /' | sed 's/\*\*.*//'
    fi
}

# === MAIN ===
log "=== Liam Startup ==="

PENDING=$(count_pending)
HIGH_TASKS=$(get_high_priority)

# Build startup message
MSG="🟢 **Liam Online**"

if [ "$PENDING" -gt 0 ]; then
    MSG="$MSG

📋 $PENDING pending tasks"
fi

if [ -n "$HIGH_TASKS" ]; then
    MSG="$MSG

⚠️ **Needs attention:**
$HIGH_TASKS"
fi

# Check gateway health
if pgrep -f "openclaw-gateway" > /dev/null; then
    GATEWAY_PID=$(pgrep -f "openclaw-gateway" | head -1)
    MEM_KB=$(ps -p "$GATEWAY_PID" -o rss= 2>/dev/null || echo "0")
    MEM_MB=$((MEM_KB / 1024))
    MSG="$MSG

✅ Gateway: PID $GATEWAY_PID (${MEM_MB}MB)"
fi

log "Sending startup notification"
send_telegram "$MSG"

log "=== Startup complete ==="
