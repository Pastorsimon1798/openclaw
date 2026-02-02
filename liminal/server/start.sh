#!/bin/bash
# Liminal Server Launcher
# Starts the creative Rust server on port 8081

cd /home/liam/liminal/server

echo "🌀 Starting Liminal Server..."
echo "   HTTP: http://localhost:8081"
echo "   WebSocket: ws://localhost:8081/ws"
echo ""

./target/release/liminal-server
