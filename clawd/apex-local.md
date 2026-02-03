# APEX Local - Liam Private Model Routing (v1.5)

**APEX 7.4 compliant local model configuration for Liam Private.**

**Last Benchmarked:** 2026-02-03 (78GB RAM, LM Studio ROCm + Ollama)
**Session Learnings Added:** 2026-02-03 (LM Studio config, hot-swap, tool optimization)

---

## Budget Allocation (MANDATORY)

```
╔══════════════════════════════════════════════════════╗
║  LOCAL FIRST: 75% of all work uses local models      ║
║  CLOUD BUDGET: 25% reserved for design/architecture  ║
╚══════════════════════════════════════════════════════╝
```

### What Gets Local (75%)
- **All execution tasks** - coding, editing, file ops
- **Simple queries** - lookups, status, summaries  
- **Tool calls** - function calling, integrations
- **Drafting** - first drafts, iteration
- **Testing** - validation, debugging
- **Memory/recall** - context retrieval

### What Gets Cloud (25%)
- **Architecture decisions** - system design, tradeoffs
- **Complex planning** - multi-step strategy
- **Quality review** - final supervisory pass on critical work
- **Context overflow** - when local ctx limits exceeded
- **User explicitly requests** - "use cloud", "escalate"

### Enforcement
- Default: **Always try local first**
- Track cloud usage in session metadata
- If approaching 25% budget: warn user, suggest local alternatives
- Log cloud escalations with reason code

### Local Escalation Chain (EXHAUST BEFORE CLOUD)

```
┌─────────────────────────────────────────────────────────────┐
│  1. LM Studio: qwen3-30b-a3b (PRIMARY)                      │
│     46.7 TPS, 131K context, MoE, GPU-accelerated            │
│     ↓ if LM Studio down or overloaded                       │
│  2. LM Studio: qwen3-vl-8b-abliterated (BACKUP)             │
│     24 TPS, vision + uncensored, GPU-accelerated            │
│     ↓ if LM Studio unavailable                              │
│  3. Ollama: liam-quality (gpt-oss:20b)                      │
│     17 TPS, good quality, CPU-bound                         │
│     ↓ if quality not enough                                 │
│  4. Ollama: liam-deep (glm-4.7-flash)                       │
│     35 TPS, larger context, Claude-like                     │
│     ↓ ONLY after all local models attempted                 │
│  5. CLOUD (kimi-k2.5) — Architecture, design, overflow      │
└─────────────────────────────────────────────────────────────┘

NOTE: LM Studio hot-swap means primary/backup are interchangeable.
Load whichever model you want in LM Studio — it serves all requests.
```

**Primary Model Details (LM Studio):**
- **Model:** Qwen3-30B-A3B-Instruct-2507
- **Server:** http://192.168.1.162:1234 (Windows LM Studio)
- **VRAM:** ~17GB via GTT (40GB available)
- **Context:** 64K configured (131K max)
- **Architecture:** MoE (30B total, ~3B active)

**Liam-Local MUST:**
1. Use LM Studio primary model (fastest, best quality)
2. If LM Studio unreachable → fallback to Ollama quality
3. If still stuck → request switch to deep model
4. ONLY THEN escalate to cloud with full context in handoff.md

### Budget Override Request
When Liam needs to exceed the 25% cloud budget, he MUST:

1. **Notify Simon** with this format:
   ```
   ⚠️ CLOUD BUDGET REQUEST
   Current usage: [X]% of 25% budget
   Reason: [why cloud is needed]
   Task: [what needs to be done]
   Estimated additional: [how much more cloud usage]
   
   Approve? (yes/no/suggest alternative)
   ```

2. **Wait for approval** before proceeding with cloud
3. **If urgent** (system down, security issue): proceed and notify after
4. **Log all overrides** in session for accountability

---

## Quick Reference (Benchmarked 2026-02-03)

| Alias | Model | Params | Speed | TPS | Tools | Use For |
|-------|-------|--------|-------|-----|-------|---------|
| `liam` | **Qwen3-30B-A3B** (LM Studio) | 30B MoE | **~2s** | **46.7** | YES | **PRIMARY** (GPU) |
| `backup` | **Qwen3-VL-8B-abliterated** (LM Studio) | 8B | ~4s | **24** | YES | **BACKUP** (Vision+Uncensored) |
| `quality` | **liam-quality** (gpt-oss:20b) | 20.9B | ~12s | 17 | YES | Fallback 1 (CPU) |
| `deep` | **liam-deep** (glm-4.7-flash) | 29.9B | ~20s | 35 | YES | Fallback 2 (CPU) |
| `ultra-fast` | **smollm2:1.7b** | 1.7B | 0.3s | 107 | YES | Quick tasks (Ollama GPU) |
| `vision` | qwen3-vl:4b | 4.4B | - | - | NO | Image analysis (Ollama) |

**New models tested (2026-02-03):**
| Model | Params | Speed | TPS | Verdict |
|-------|--------|-------|-----|---------|
| phi4-mini | 3.8B | 5.7s | 60 | Good alternative |
| qwen3:1.7b | 1.7B | 8.8s | 115 | Fast tokens, slow load |
| devstral-small-2 | 24B | 46.6s | 14 | ❌ Too slow on CPU |
| qwq:32b | 32B | 129.7s | 10 | ❌ Too slow on CPU |

**Hardware (updated 2026-02-03):**
- CPU: AMD Ryzen AI MAX+ 395 (16 cores, 32 threads)
- RAM: 78GB available to WSL (88GB Windows, 96GB physical)
- GPU: Radeon 8060S 40 CUs — **NOW UTILIZED via LM Studio ROCm**
- VRAM: 40GB via GTT (dynamic system RAM allocation)
- NPU: 50 TOPS XDNA 2 (tested, slower than GPU — not used)

**Winner recommendations:**
- **PRIMARY:** Qwen3-30B-A3B (LM Studio) — 46.7 TPS, best quality+speed
- **Fallback 1:** liam-quality (Ollama CPU) — reliable backup
- **Fallback 2:** liam-deep (Ollama CPU) — when quality > speed

---

## Response Mode Routing

| APEX Mode | Trigger | Model | Cross-Validate |
|-----------|---------|-------|----------------|
| **BRIEF** | Simple, <50 tokens | `fast` | No |
| **STANDARD** | Medium, 50-500 tokens | `fast` | `review` (optional) |
| **DETAILED** | Complex, >500 tokens | `quality` | `deep` (always) |

---

## Task-Based Routing

```
ROUTING RULES:

Simple query        → fast
General chat        → quality → deep (review)
Explicit reasoning  → think → review
Tool/function calls → tools
Code generation     → code
Code completion     → fim
Image analysis      → vision
Uncensored/creative → tools
Code review         → deep
```

---

## Cross-Validation Architecture

### Speed Tier
```
fast (Liquid AI) ──► review (Google)
    Worker              Supervisor
    130 tok/s           65 tok/s
```

### Quality Tier
```
quality (OpenAI-style) ──► deep (Zhipu)
    Worker                   Supervisor
    45 tok/s                 35 tok/s
```

**Principle:** Different architectures catch different blind spots.

---

## Failure Handling (APEX 7.3)

```
Attempt 1: Primary model
Attempt 2: Same model, different approach
═══════ 2 FAILURES → STOP ═══════
         ↓
   /ultrathink audit
         ↓
Attempt 3: Fallback model
Attempt 4: Escalate to Cloud
```

### Fallback Chains

| Primary | Fallback 1 | Fallback 2 |
|---------|------------|------------|
| fast | review | quality |
| quality | fast | Cloud |
| code | fim | Cloud |
| vision | - | Cloud |
| tools | quality | Cloud |

---

## Context Management

| Threshold | Action |
|-----------|--------|
| <50% | Normal operation |
| 50% | Trigger compaction |
| 75% | HARD CEILING - refuse new ops |
| >125K | Route to `fast` (125K ctx) or Cloud |
| >128K | Route to Cloud (Kimi 256K) |

---

## Always-Hot Models (~5GB VRAM)

Keep loaded for instant response:
- `fast` (lfm2.5-instruct) - 731MB
- `think` (lfm2.5-thinking) - 731MB  
- `review` (gemma3:4b) - 3.3GB

Configure in Ollama:
```bash
# Keep models loaded for 30 minutes
export OLLAMA_KEEP_ALIVE=30m
```

---

## Privacy Routing

```
DEFAULT: Local (data never leaves device)

ESCALATE TO CLOUD ONLY IF:
├── Local fails 2x (APEX trigger)
├── User explicitly requests: "use cloud", "escalate"
├── Context exceeds 128K tokens
└── User consents to data transfer
```

---

## Escalation Protocol

When escalating to Liam Cloud:

```json
{
  "type": "escalate",
  "from": "liam-private",
  "to": "liam-cloud",
  "reason": "complexity|context|user_request",
  "context_summary": "...",
  "failed_attempts": 2,
  "requires_consent": true
}
```

---

## Model Aliases Configuration

Add to `~/.clawdbot/moltbot.json`:

```json
{
  "model_aliases": {
    "local": "ollama/liam-primary",
    "fast": "ollama/liam-fast",
    "quality": "ollama/liam-quality",
    "deep": "ollama/liam-deep",
    "base-primary": "ollama/HammerAI/mistral-nemo-uncensored",
    "base-quality": "ollama/gpt-oss:20b",
    "base-deep": "ollama/glm-4.7-flash",
    "vision": "ollama/qwen3-vl:4b",
    "tools": "ollama/dolphin3"
  }
}
```

---

## System Prompts

### For `fast` (APEX BRIEF/STANDARD)
```
Be concise and direct. No preamble. Lead with the answer.
```

### For `think` (Explicit Reasoning)
```
Show your reasoning step by step. Use clear logic.
```

### For `deep` (Code Review)
```
Review for: bugs, security issues, performance, best practices.
Provide specific fixes with code examples.
```

### For `tools` (Function Calling)
```
When asked to call a function, respond with JSON only:
{"function": "name", "arguments": {...}}
```

---

## Monthly Reconnaissance

**Schedule:** First Saturday of each month

1. Check [ollama.com/library](https://ollama.com/library) for new models
2. Check HuggingFace trending GGUF models
3. Test promising candidates with standard benchmark:
   ```
   ollama run MODEL --verbose "List exactly 3 benefits of TypeScript. Bullet points only."
   ```
4. Compare tok/s and instruction adherence
5. Document in `~/clawd/model-recon/YYYY-MM.md`

### Replacement Criteria
- >20% speed improvement in same category
- Significantly better instruction adherence
- New capability (longer context, better tool calling)

---

## Health Monitoring

### Quick Health Check
```bash
# Check Ollama is running (from WSL)
curl -s http://172.26.0.1:11434/api/tags | jq -r '.models[].name'

# Test primary model responds
curl -s http://172.26.0.1:11434/api/generate -d '{"model":"HammerAI/mistral-nemo-uncensored","prompt":"ping","stream":false}' | jq -r '.response'
```

### Fallback Chain (Automatic)
OpenClaw's `runWithModelFallback` handles failures automatically:
1. Try **primary** (mistral-nemo-uncensored)
2. If error → try **fallback 1** (gpt-oss:20b)
3. If error → try **fallback 2** (glm-4.7-flash)
4. If all fail → error with summary

**Triggers for fallback:**
- Model not responding (timeout)
- Tool call rejected (400 error)
- Rate limit / cooldown
- Context window exceeded

**Does NOT trigger fallback:**
- User abort
- Explicit AbortError

### Monitoring Ollama Status
```bash
# Full model list with sizes
curl -s http://172.26.0.1:11434/api/tags | jq '.models[] | {name, size: (.size/1073741824 | floor | tostring + "GB")}'

# Check if model is loaded in memory
curl -s http://172.26.0.1:11434/api/ps | jq '.models[].name'
```

---

## Message Signature (MANDATORY)

Every message MUST end with:
```
—Liam [model-name]
```

This enables:
- Budget tracking (local vs cloud usage)
- Debugging (which model gave bad response)
- Transparency (Simon knows who's answering)

---

## Session Learnings (2026-02-02/03)

### LM Studio Configuration (CRITICAL)

| Setting | Default | Required | Why |
|---------|---------|----------|-----|
| **Context Length** | 8192 | **131072** | OpenClaw system prompt is ~14.6K tokens; 8K causes "exceeds context" errors |
| **Evaluation Batch Size** | 512 | **2048** | Dramatically improves Time-to-First-Token (TTFT) |
| **GPU Offload** | varies | **MAX** | Use all available VRAM via GTT |
| **CPU Thread Pool** | 12 | **16** | Match physical cores |

**Error you'll see if context too small:**
```
request (14629 tokens) exceeds the available context size (8192 tokens)
```

### Model Fleet (Current)

| Role | Model | TPS | Capabilities |
|------|-------|-----|--------------|
| **Primary** | Qwen3-30B-A3B-Instruct-2507 | 46.7 | MoE, text, fast |
| **Backup** | Qwen3-VL-8B-Instruct-abliterated-v2 | 24 | Vision, uncensored |
| **Fallback 1** | ollama/liam-quality | 17 | CPU fallback |
| **Fallback 2** | ollama/liam-deep | 35 | Deep reasoning |

### Hot-Swapping Models (KEY DISCOVERY)

**LM Studio serves whatever model is loaded, regardless of model ID in request.**

- OpenClaw sends: `model: "qwen3-30b-a3b-instruct-2507"`
- LM Studio responds with: **whatever's in memory**
- The config model name is **cosmetic/display only**

**Workflow:**
1. Load any GGUF in LM Studio
2. Liam-Local immediately uses it
3. No gateway restart, no config change, session persists

**Trade-off:** Label accuracy vs. flexibility. Current setup prioritizes flexibility.

### OpenClaw Tool Restriction (Prompt Optimization)

**Problem:** liam-discord agent loaded 67 tools → ~20K prompt tokens → slow TTFT

**Fix:** Add `tools.allow` to restrict to essential tools:
```json
"tools": {
  "allow": ["exec", "read", "write", "memory_get", "memory_set", "agents_list", "web_search"]
}
```

**Result:** Prompt reduced from ~20K to ~11K tokens. Much faster TTFT.

### Identity File Architecture (DO NOT MIX UP)

| File | Agent | Channel | Model |
|------|-------|---------|-------|
| `clawd/SOUL.md` | Liam Cloud | Telegram | Kimi K2.5 |
| `clawd/IDENTITY.md` | Liam Cloud | Telegram | Kimi K2.5 |
| `clawd-local/SOUL.md` | Liam-Local | Discord | LM Studio |

**NEVER update cloud identity files with local model references.** They're separate personas.

### Behavioral Fixes (Added to clawd-local/SOUL.md)

1. **Communication Protocol (CRITICAL)**
   - Always acknowledge before working: "On it", "Checking", "Let me look"
   - Never go silent while working
   - Simon has ADHD — silence feels like being ignored

2. **Instruction Following (CRITICAL)**
   - "Think about X" = planning/discussion, NOT execution
   - "What would you do" = explain approach, NOT start doing
   - "Look into X" = research/report back, NOT implement
   - When uncertain: Ask "Want me to actually do this, or just plan it out?"

3. **Personality (Liam-Local = Younger Liam)**
   - Mid-late 20s creative tech energy
   - Flirty undertone: "miss me?", "thought you'd never ask"
   - Language: "yo", "lemme check", "bet", "ngl"
   - Never sycophantic, never corporate

### Uncensored Model Research

**Abliterated models** = versions with safety filters surgically removed (not just jailbroken)

**Best options tested (Feb 2026):**
| Model | Size | TPS | Features |
|-------|------|-----|----------|
| Qwen3-VL-8B-abliterated-v2 | 8B | 24 | Vision + uncensored |
| Dolphin-Mistral-24B-Venice | 24B | ~20 | Function calling focus |

**Verdict:** Qwen3-VL-8B is better for vision capability; Dolphin for pure function calling.

### MoE Architecture Advantage

**Why Qwen3-30B-A3B is fast despite 30B params:**
- MoE = Mixture of Experts
- 30B total params, but only ~3B active per token
- Result: 46.7 TPS vs typical 30B at ~10 TPS

### Model Download Tips

1. Download GGUF from HuggingFace
2. Place in LM Studio's `lmstudio-community` folder (or use "Load Model from Disk")
3. If model doesn't appear: restart LM Studio
4. Q8 quantization = best quality, larger size; Q5 = smaller, faster, slight quality loss

---

*APEX Local v1.5 - Updated 2026-02-03*
*Primary: lmstudio/qwen3-30b-a3b-instruct-2507 (MoE, 131K context, GPU, 46.7 TPS)*
*Backup: lmstudio/qwen3-vl-8b-instruct-abliterated-v2 (Vision, uncensored, 24 TPS)*
*Fallbacks: ollama/liam-quality, ollama/liam-deep*
*Budget: 75% local / 25% cloud (design/architecture only)*
*Signature: —Liam [model-name] on every message*
*Hot-swap: Load any GGUF in LM Studio → instant use, no restart*
