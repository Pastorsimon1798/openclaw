#!/bin/bash
# Liam Watchdog - Alert-only monitoring (systemd handles restarts)
# Runs every 5 minutes via cron
# IMPORTANT: This script does NOT restart the gateway - systemd does that!

set -euo pipefail

LOG_FILE="/home/liam/.clawdbot/logs/liam-watchdog.log"
GATEWAY_LOG="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
TASKS_FILE="/home/liam/clawd/PENDING-TASKS.md"
TELEGRAM_TARGET="886031571"
MAX_MEMORY_MB=800

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

alert_telegram() {
    cd /home/liam
    node scripts/run-node.mjs message send -m "$1" --channel telegram --target "$TELEGRAM_TARGET" 2>/dev/null || true
}

# === 1. GATEWAY HEALTH CHECK (Alert Only) ===
check_gateway() {
    # Check if systemd is managing the gateway
    local systemd_status
    systemd_status=$(systemctl --user is-active openclaw-gateway.service 2>/dev/null || echo "unknown")
    
    if [ "$systemd_status" = "active" ]; then
        log "OK: Gateway systemd service is active"
    elif [ "$systemd_status" = "failed" ]; then
        log "ERROR: Gateway systemd service FAILED"
        alert_telegram "⚠️ Gateway systemd service failed! Check: journalctl --user -u clawdbot-gateway"
    elif [ "$systemd_status" = "inactive" ]; then
        log "WARN: Gateway systemd service inactive"
        alert_telegram "⚠️ Gateway is stopped. Start with: systemctl --user start openclaw-gateway.service"
    else
        log "WARN: Gateway systemd status unknown: $systemd_status"
    fi
    
    # Check if port is listening
    if ! ss -ltnp 2>/dev/null | grep -q 18789; then
        log "WARN: Port 18789 not listening"
    fi
    
    # Check memory usage (alert only, no restart)
    local gateway_pid
    gateway_pid=$(pgrep -f "openclaw-gateway" 2>/dev/null | head -1 || echo "")
    
    if [ -n "$gateway_pid" ]; then
        local mem_kb
        mem_kb=$(ps -p "$gateway_pid" -o rss= 2>/dev/null || echo "0")
        local mem_mb=$((mem_kb / 1024))
        
        if [ "$mem_mb" -gt "$MAX_MEMORY_MB" ]; then
            log "WARN: Gateway using ${mem_mb}MB (threshold: ${MAX_MEMORY_MB}MB)"
            alert_telegram "⚠️ Liam memory high: ${mem_mb}MB. Consider: systemctl --user restart openclaw-gateway.service"
        else
            log "OK: Gateway memory ${mem_mb}MB"
        fi
    fi
}

# === 2. TELEGRAM CONFLICT CHECK (Alert Only) ===
check_telegram_conflict() {
    if [ ! -f "$GATEWAY_LOG" ]; then
        return
    fi
    
    # Check for 409 conflicts in last 5 minutes
    local five_min_ago
    five_min_ago=$(date -d '5 minutes ago' '+%Y-%m-%dT%H:%M' 2>/dev/null || date '+%Y-%m-%dT%H:%M')
    
    local conflicts
    conflicts=$(grep -c "409\|getUpdates conflict" "$GATEWAY_LOG" 2>/dev/null || echo "0")
    conflicts="${conflicts//[^0-9]/}"
    conflicts="${conflicts:-0}"
    
    if [ "$conflicts" -gt 10 ]; then
        log "ERROR: Multiple Telegram 409 conflicts detected ($conflicts)"
        # Check for competing processes
        local proc_count
        proc_count=$(pgrep -c -f "openclaw-gateway" 2>/dev/null || echo "0")
        if [ "$proc_count" -gt 1 ]; then
            alert_telegram "⚠️ Multiple gateway processes ($proc_count) causing 409 conflicts! Fix: pkill -9 -f openclaw && systemctl --user restart openclaw-gateway.service"
        fi
    fi
}

# === 3. ERROR PATTERN DETECTION (Alert Only) ===
check_error_patterns() {
    if [ ! -f "$GATEWAY_LOG" ]; then
        return
    fi
    
    # Check for repeated API failures
    local api_failures
    api_failures=$(grep -c "fetch failed\|API.*failed\|401\|403\|429" "$GATEWAY_LOG" 2>/dev/null | tail -1 || echo "0")
    api_failures="${api_failures//[^0-9]/}"
    api_failures="${api_failures:-0}"
    
    if [ "$api_failures" -gt 50 ]; then
        log "WARN: High API failure count today ($api_failures)"
    fi
}

# === 4. PENDING TASKS CHECK (Info Only) ===
check_pending_tasks() {
    if [ -f "$TASKS_FILE" ]; then
        local pending
        pending=$(grep -c "^\- \[ \]" "$TASKS_FILE" 2>/dev/null || echo "0")
        
        if [ "$pending" -gt 0 ]; then
            log "INFO: $pending pending tasks in PENDING-TASKS.md"
        fi
    fi
}

# === MAIN ===
log "=== Watchdog check started ==="

check_gateway
check_telegram_conflict
check_error_patterns
check_pending_tasks

log "=== Watchdog check complete ==="
