---
name: Name Shortening A/B Test
overview: Design and execute an A/B test comparing token-optimized identifier names vs. current naming, measuring speed, performance, and stability impact on Liam's actual operations.
todos: []
isProject: false
---

# Name Shortening A/B Test Plan

## Strategy: Fragment-Based Testing

Test on a **high-impact, isolated module** rather than system-wide changes. This gives us real data without breaking production.

### Test Target: Auto-Reply Core Module

**Why this module:**

- High token density (loaded in every agent session)
- Self-contained (minimal external dependencies)
- Critical path (directly impacts response latency)
- Easy to swap (runtime module resolution)

**What we'll test:**

- Current: `src/auto-reply/dispatch.ts` (verbose names)
- Variant: `src/auto-reply/dispatch.minified.ts` (shortened names)

---

## Implementation Approach (SIMPLE)

### Phase 1: Create Minified Variant (30 min)

**Target functions in `dispatch.ts`:**

```typescript
// Current (verbose)
dispatchInboundMessageWithBufferedDispatcher → dispatchMsg
consumeAutoReplyProcessorConfig → consumeCfg
buildReplyDispatcherWithTypingOptions → buildDispatcher
```

**Process:**

1. Copy `src/auto-reply/dispatch.ts` → `dispatch.minified.ts`
2. Apply Smart Aliasing taxonomy:
  - `*Dispatcher` → `*Disp`
  - `*Config` → `*Cfg`
  - `*Options` → `*Opts`
  - `get*` → `get` (prefix removal where safe)
3. Keep exports identical (no breaking changes)
4. Update internal references only

### Phase 2: Runtime A/B Switch (15 min)

Add environment variable to toggle between variants:

```typescript
// src/auto-reply/index.ts
const MINIFIED = process.env.OPENCLAW_MINIFIED_DISPATCH === '1';
const dispatch = MINIFIED 
  ? await import('./dispatch.minified.js')
  : await import('./dispatch.js');
```

**Testing setup:**

- Liam Telegram (current): `OPENCLAW_MINIFIED_DISPATCH=0`
- Liam Telegram Test: `OPENCLAW_MINIFIED_DISPATCH=1`

### Phase 3: Metrics Collection (20 min)

**What we measure:**


| Metric                      | How                                     | Goal            |
| --------------------------- | --------------------------------------- | --------------- |
| **Token count per session** | Parse session JSONL, count input tokens | Lower is better |
| **Response latency**        | Timestamp diff (user msg → bot reply)   | Lower is better |
| **Context utilization**     | Max tokens used / context limit         | Lower is better |
| **Error rate**              | Exceptions per 100 messages             | Same or lower   |
| **Memory usage**            | Gateway process RSS                     | Same or lower   |


**Collection script:**

```bash
# scripts/ab-test-metrics.ts
# Reads session files for both variants
# Outputs comparison table
```

### Phase 4: Parallel Testing (24-48 hours)

**Setup:**

1. Run stable Liam on Telegram (control group)
2. Run test Liam on Discord or separate Telegram account (variant group)
3. Both agents handle similar workloads
4. Collect metrics every 6 hours

**Sample size target:**

- 100+ messages per variant
- Mix of short/long conversations
- Mix of tool use and text-only

---

## Measurement Plan

### Baseline Metrics (Collect First)

Before any changes, measure current Liam:

```bash
# Token count per session file
find ~/.clawdbot/agents/liam-telegram/sessions -name "*.jsonl" -mtime -1 \
  | xargs -I {} sh -c 'cat {} | jq ".message.content[0].text" | wc -w'

# Average response latency (last 100 messages)
# Parse timestamps from session JSONL

# Context window usage
# grep "tokens=" in gateway logs
```

### A/B Test Metrics

**Control Group (Verbose names):**

- Avg tokens per session: ???
- Avg response latency: ??? ms
- Avg context utilization: ???%

**Variant Group (Short names):**

- Avg tokens per session: ??? (target: -10-15%)
- Avg response latency: ??? ms (target: -5-10%)
- Avg context utilization: ???% (target: -10%)

### Success Criteria

**Proceed to wider adoption if:**

- ✅ Token reduction: >10% per session
- ✅ Latency improvement: >5% faster
- ✅ Error rate: Same or better
- ✅ Stability: No crashes over 48h

**Abandon if:**

- ❌ Token reduction: <5%
- ❌ Semantic errors increase (model confusion)
- ❌ Any crashes or regressions

---

## Alternative: Prompt-Level Testing (EVEN SIMPLER)

If module-level changes feel too heavy, test at **prompt level** instead:

### Approach: Minified System Prompt

**Current system prompt excerpt:**

```
Tools available:
- dispatchInboundMessageWithBufferedDispatcher
- consumeAutoReplyProcessorConfig
... (verbose names)
```

**Test variant:**

```
Tools available:
- dispatchMsg
- consumeCfg
... (short names)
```

**A/B test:**

- Same agent, same code
- Toggle system prompt template
- Measure: model confusion, hallucination rate, task completion

**Advantage:** Zero code changes, pure token optimization test.

---

## Implementation Phases

### Minimal Viable Test (2 hours)

**If you want the SIMPLEST test:**

1. **Create test script** (`scripts/test-name-length.ts`)
  - Generates identical prompts with verbose vs short names
  - Sends to same model
  - Measures token count, latency, quality
2. **Sample prompts:**
  ```typescript
   // Verbose
   "Call dispatchInboundMessageWithBufferedDispatcher with ctx..."

   // Short
   "Call dispatchMsg with ctx..."
  ```
3. **Run 50 iterations each**
4. **Compare results**

**Output:**

```
Verbose: Avg 1,234 tokens, 2.1s latency, 48/50 correct
Short:   Avg 1,015 tokens, 1.9s latency, 47/50 correct

Savings: 17.8% tokens, 9.5% faster, 2% quality loss
```

### Full Integration Test (1 day)

If minimal test shows promise:

1. Create `dispatch.minified.ts`
2. Add runtime toggle
3. Run parallel Liam instances
4. Collect 48h metrics
5. Analyze results

---

## Risk Mitigation

### Rollback Plan

**If test fails:**

1. Set `OPENCLAW_MINIFIED_DISPATCH=0`
2. Restart gateway
3. Delete `dispatch.minified.ts`
4. Document findings in Evolution Queue

**No persistent changes** - feature flag controls everything.

### Monitoring

**Watch for:**

- Increased error rates in logs
- Model hallucinations (wrong function calls)
- Context overflow (despite shorter names)
- Performance degradation (paradoxically slower)

### Testing Checklist

Before starting:

- Baseline metrics collected
- Test script ready
- Rollback documented
- Monitoring in place

During test:

- Check logs every 6h
- Compare error rates
- Note any anomalies

After test:

- Full metrics comparison
- Decision: proceed or abandon
- Document in Evolution Queue

---

## File Changes Required

### New Files

1. `scripts/ab-test-metrics.ts` - Metrics collection
2. `scripts/test-name-length.ts` - Minimal test script
3. `src/auto-reply/dispatch.minified.ts` - Test variant (if full test)

### Modified Files

1. `src/auto-reply/index.ts` - Add feature flag (if full test)
2. `.env.example` - Document `OPENCLAW_MINIFIED_DISPATCH`

### Documentation

1. `EVOLUTION-QUEUE.md` - Add experiment entry
2. `docs/experiments/name-shortening.md` - Document methodology

---

## Timeline


| Phase               | Duration | Deliverable                  |
| ------------------- | -------- | ---------------------------- |
| **Minimal Test**    | 2 hours  | Token/latency comparison     |
| **Full Test Setup** | 4 hours  | Minified module + metrics    |
| **Data Collection** | 48 hours | Session metrics              |
| **Analysis**        | 2 hours  | Decision: proceed or abandon |


**Total: 2-4 days** for conclusive data.

---

## Questions for You

Before I start building:

1. **Which test approach?**
  - Minimal (script-based, 2h)
  - Full (module variant, 48h data)
2. **Test target?**
  - Auto-reply module (my recommendation)
  - System prompt only
  - Different module?
3. **A/B split?**
  - Two Telegram accounts
  - Telegram vs Discord
  - Sequential (test for 24h, switch, test 24h more)
4. **Success threshold?**
  - What % improvement would justify wider adoption?
  - 5%? 10%? 20%?

---

## My Recommendation

**Start with Minimal Test (2 hours):**

1. Build `test-name-length.ts` script
2. Run 50 iterations verbose vs short
3. Get hard numbers on token/latency savings
4. **If savings >10% → proceed to Full Test**
5. **If savings <5% → abandon theory**

This gives you data fast without risk to production Liam.

Sound good?