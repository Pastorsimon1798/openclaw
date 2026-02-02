# APEX Local - Liam Private Model Routing (v1.1)

**APEX 7.3 compliant local model configuration for Liam Private.**

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
│  1. liam-primary (mistral-nemo) — Start here                │
│     ↓ if stuck or needs more capability                     │
│  2. liam-quality (gpt-oss:20b) — Deeper reasoning           │
│     ↓ if still stuck or needs larger context                │
│  3. liam-deep (glm-4.7-flash) — Largest local context       │
│     ↓ ONLY after all local models attempted                 │
│  4. CLOUD (kimi-k2.5) — Architecture, design, overflow      │
└─────────────────────────────────────────────────────────────┘
```

**Liam-Local MUST:**
1. Try primary model first
2. If stuck → request switch to quality model
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

## Quick Reference

| Alias | Model | Context | Speed | Tools | Use For |
|-------|-------|---------|-------|-------|---------|
| `local` | **liam-primary** (optimized) | **1M** | ~9s | YES | **Default - uncensored** |
| `quality` | **liam-quality** (optimized) | **128K** | ~16s | YES | Complex tasks, fallback |
| `deep` | **liam-deep** (optimized) | **200K** | ~32s | YES | Large context fallback |
| `fast` | **liam-fast** (optimized) | 125K | ~2s | NO | Chat only (no tools) |
| `base-primary` | HammerAI/mistral-nemo-uncensored | 1M | ~9s | YES | Base model (unoptimized) |
| `base-quality` | gpt-oss:20b | 128K | ~16s | YES | Base fallback |
| `base-deep` | glm-4.7-flash | 200K | ~32s | YES | Base large context |
| `vision` | qwen3-vl:4b | 128K | - | NO | Image analysis |

**Optimized models have:**
- Lower temperature (0.4-0.5) for deterministic code/tools
- Extended num_ctx (131K) for full context usage
- Higher num_predict (8192) for long outputs
- Tuned top_p/top_k for balanced sampling
- Built-in signature system prompt

**Context verified:** 2026-02-02 (via Ollama API)

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

*APEX Local v1.3 - Updated 2026-02-02*
*Primary: HammerAI/mistral-nemo-uncensored (uncensored, 1M context, tools)*
*Fallbacks: gpt-oss:20b, glm-4.7-flash*
*Budget: 75% local / 25% cloud (design/architecture only)*
*Signature: —Liam [model-name] on every message*
