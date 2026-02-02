# Liminal Exploration Log — 2026-02-02

## What I Explored

Extended the Rust server (port 8081) with real-time WebSocket features and a shader gallery system. Cross-pollinated the Python tools with a bridge script.

## What I Built

### 1. Rust Server v0.2.0 — WebSocket Real-Time System

**New Dependencies:**
- `actix-ws` for WebSocket support
- `futures-util` for async utilities  
- `uuid` for session tracking
- `chrono` for timestamps

**WebSocket Features:**
- `/ws` endpoint for real-time connections
- Broadcast system for spin events (start, tick, complete)
- Auto-reconnect support in frontend
- Session management with cleanup

**Enhanced Spinner API:**
- Server-side spin simulation with visual progress
- `POST /api/spinner/spin` — initiates animated spin
- `GET /api/spinner/history` — last 100 spins with timestamps
- `GET /api/spinner/active` — currently running spins
- Real-time progress broadcasts via WebSocket

**Shader Gallery API:**
- `GET /api/shaders` — list 4 shader presets
- `GET /api/shaders/{id}` — fetch GLSL source code
- Shaders embedded via `include_str!()` at compile time

**New Shader Files Created:**
- `src/shaders/liminal_noise.glsl` — Default purple cyberpunk ambient
- `src/shaders/glitch_waves.glsl` — Digital distortion + scanlines
- `src/shaders/void_particles.glsl` — Ethereal drifting particles  
- `src/shaders/threshold_ripple.glsl` — Binary threshold ripples

### 2. Frontend v2.0 — liminal.js Overhaul

**WebGL Shader System:**
- 5 in-shader-library: liminal-noise, glitch-waves, void-particles, threshold-ripple, spinner-energy
- Runtime shader switching
- `spinner-energy` shader activates during spins (visual feedback)
- Shader energy parameter modulated by spin progress

**WebSocket Integration:**
- Real-time connection to server
- Handles: `spin_start`, `spin_tick`, `spin_complete`
- Visual background shifts during spins
- Terminal shows live spin progress

**Enhanced UI:**
- Shader selector buttons (auto-generated from API)
- Keyboard shortcuts: Space=spin, A=audio toggle
- Better audio: ambient drone + click/spin/win sounds

### 3. Bridge Tool — Cross-Pollination

**tools/bridge.py** — Connects vibes.py to the server:
- Reads `vibes_log.jsonl` for recent check-ins
- Converts mood/want data into spinner options
- Can POST vibe-based spins to server
- Falls back to body-check defaults if no vibes logged

## Architecture Now

```
┌─────────────────────────────────────────────────────────────┐
│                    Liminal Creative Server                  │
│                         (Port 8081)                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend                    Backend                        │
│  ─────────                   ────────                       │
│  WebGL shaders  ←───────→    Shader GLSL (embedded)         │
│  WebSocket client ←─────→    /ws broadcast system           │
│  Web Audio       ←──────→    Spin state machine             │
│  Terminal UI     ←──────→    REST API + history             │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    tools/bridge.py
                              ↕
                    vibes.py data (JSONL)
```

## Key Technical Decisions

1. **Shader embedding**: Used `include_str!()` to embed GLSL at compile time rather than file I/O
2. **WebSocket broadcast**: Spawned async task per message to avoid blocking
3. **Spin simulation**: Server-side with tokio::time::sleep for realistic animation timing
4. **State management**: Arc<Mutex<>> for shared state between HTTP and WebSocket handlers

## What Works Now

- ✅ Server builds and runs (verified: v0.2.0 running on port 8081)
- ✅ WebSocket connects and broadcasts spin events
- ✅ Shader gallery API returns GLSL code
- ✅ Frontend switches shaders and reacts to spins
- ✅ Spin history tracked server-side
- ✅ Bridge script connects Python tools to server

## Next Ideas (if continuing)

1. **Shader parameter modulation** — Map spin result to shader uniforms (color shift based on choice)
2. **Multiplayer sync** — Multiple clients see same spin in real-time
3. **Vibe-aware backgrounds** — Shader selection based on recent mood logs
4. **Generative audio from spins** — Result determines musical scale/notes
5. **Seed number integration** — Use seed_numbers.txt for deterministic art

## Time Spent

~25 minutes focused work. Creative exploration, no pressure to complete.
