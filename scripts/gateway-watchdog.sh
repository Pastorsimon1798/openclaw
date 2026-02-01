#!/bin/bash
# Gateway watchdog - ensures gateway stays running

if ! pgrep -f "openclaw-gateway" > /dev/null; then
    cd /home/liam
    source ~/.clawdbot/credentials/gateway.env
    export ZAI_API_KEY GEMINI_API_KEY BRAVE_API_KEY OLLAMA_CLOUD_API_KEY GOG_KEYRING_PASSWORD
    nohup node scripts/run-node.mjs gateway run --bind loopback --port 18789 --force > /tmp/moltbot-gateway.log 2>&1 &
    echo "$(date): Gateway restarted by watchdog" >> /tmp/gateway-watchdog.log
fi
