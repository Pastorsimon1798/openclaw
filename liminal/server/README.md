# Liminal Server v0.2.0

**The creative showcase** — WebGL shaders, WebSocket real-time, and the Decision Spinner.

## Quick Start

```bash
./start.sh
```

Server runs on http://localhost:8081

## New Features (Built Today)

### 🔄 WebSocket Real-Time
- Endpoint: `ws://localhost:8081/ws`
- Live spin visualization — background reacts to spinner energy
- Broadcasts spin_start, spin_tick, spin_complete events
- Auto-reconnect on disconnect

### 🎨 Shader Gallery
- 5 built-in WebGL shaders:
  1. **Liminal Noise** — Default ambient purple cyberpunk
  2. **Glitch Waves** — Digital distortion, scanlines
  3. **Void Particles** — Ethereal drifting particles
  4. **Threshold Ripple** — Binary aesthetic with ripples
  5. **Spinner Energy** — Reactive burst during spins
- Shader switcher UI in browser
- API endpoints: `/api/shaders`, `/api/shaders/{id}`

### 🎯 Enhanced Decision Spinner
- Real-time server-side spin simulation
- Progress tracking via WebSocket
- Visual feedback: background shifts to "spinner-energy" shader during spins
- History tracking (last 100 spins)
- Duration metrics

### 🎵 Web Audio
- Ambient generative drone (55Hz base)
- UI sounds: clicks, spin, win
- Toggle with button or press 'A'

### ⌨️ Keyboard Shortcuts
- **Space** — Spin (when not typing)
- **A** — Toggle audio

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main HTML page |
| `/static/*` | GET | Static assets |
| `/ws` | WS | WebSocket connection |
| `/api/projects` | GET | List all projects |
| `/api/project/{name}` | GET | Project details |
| `/api/principles` | GET | PRINCIPLES.md content |
| `/api/spinner/spin` | POST | Start a spin |
| `/api/spinner/history` | GET | Recent spins |
| `/api/spinner/active` | GET | Active spins |
| `/api/shaders` | GET | List shaders |
| `/api/shaders/{id}` | GET | Shader GLSL code |
| `/api/health` | GET | Health check |

## Architecture

```
Frontend (liminal.js)
├── WebGL Shader Pipeline
├── WebSocket Client
├── Web Audio System
└── Terminal UI

Backend (main.rs)
├── Actix-web HTTP server
├── WebSocket broadcaster
├── Spin state management
└── Shader code embedding
```

## Shader Files

Located in `src/shaders/`:
- `liminal_noise.glsl` — Default ambient
- `glitch_waves.glsl` — Digital distortion
- `void_particles.glsl` — Particle field
- `threshold_ripple.glsl` — Binary ripples

## Dependencies Added

- `actix-ws` — WebSocket support
- `futures-util` — Async utilities
- `uuid` — Session IDs
- `chrono` — Timestamps

## Next Ideas

- [ ] Vibe logging integration (sync with vibes.py)
- [ ] Seed-based deterministic art generation
- [ ] Multiplayer spin (synchronized across clients)
- [ ] Shader parameter modulation from spin results
- [ ] Record/export spin history to vibes_log.jsonl
