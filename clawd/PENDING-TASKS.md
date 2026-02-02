# Pending Tasks for Liam

> **Assigned by:** Cursor (Systems Check 2026-02-01)
> **Priority Order:** Execute top to bottom

---

## 0. [RESEARCH] Name Shortening A/B Test

**Status:** 📋 Plan Ready  
**Location:** `docs/experiments/name-shortening.md`  
**Next Step:** Decide test approach (Minimal 2h vs Full 48h)

**What it is:**
- Test if shortening identifier names improves speed/performance
- Proven 50-75% token savings per identifier
- Need real-world metrics to validate system-wide impact

**When ready to execute:**
```bash
cat docs/experiments/name-shortening.md
# Choose: Minimal test (2h) or Full test (48h data)
```

---

## 1. [RESOLVED BY CURSOR] Config Schema Fixed

**Status:** ✅ DONE  
**Action:** None needed - Cursor fixed the schema

**What Cursor did:**
- Added `vocalDirection` to core TTS schema (`src/config/types.tts.ts`, `src/config/zod-schema.core.ts`)
- Added `groq` TTS provider to voice-call plugin JSON schema (`extensions/voice-call/openclaw.plugin.json`)
- Config is now valid - `vocalDirection` setting preserved

---

## 2. [CRITICAL] Fix Security Permissions

**Status:** 🔴 Security Issue  
**Time:** 1 minute  
**Commands:**
```bash
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/openclaw.json
```

**Why:** Config contains API keys. Currently group/world readable = security risk.

---

## 3. [HIGH] Restart Gateway (Apply Context Overflow Fix)

**Status:** 🟡 Pending  
**Time:** 2 minutes  
**Prerequisite:** Task 1 completed  
**Command:**
```bash
pnpm openclaw gateway stop
pnpm openclaw gateway run --bind loopback --port 18789 --force
```

**What Changed (Cursor implemented):**
- `reserveTokensFloor: 100000` added to config
- Pre-flight compaction threshold lowered: 70% → 50%
- Hard ceiling lowered: 90% → 75%
- Hallucination detection added to compaction summaries

**Verify:** Check logs for new thresholds being applied.

---

## 4. [HIGH] Fix Dashboard Lint Errors

**Status:** 🟡 Your Code  
**Time:** 15-20 minutes  
**Files:**
- `clawd/dashboard/static/app.js` (~10 errors)
- `clawd/dashboard/static/liminal.js` (~3 errors)

**Error Type:** `no-floating-promises` - async functions called without `await` or `void`

**Fix Pattern:**
```javascript
// BAD:
fetchData();

// GOOD (fire-and-forget):
void fetchData();

// GOOD (wait for result):
await fetchData();
```

**Command to see errors:**
```bash
pnpm lint -- clawd/dashboard/static/app.js clawd/dashboard/static/liminal.js
```

---

## 5. [MEDIUM] Clean Up Legacy Services

**Status:** 🟢 Housekeeping  
**Time:** 2 minutes  
**Commands:**
```bash
# Disable old gateway service
systemctl --user disable --now clawdbot-gateway.service 2>/dev/null || true

# Remove stale service file
rm -f ~/.config/systemd/user/clawdbot-gateway.service

# Reload systemd
systemctl --user daemon-reload
```

**Why:** Old `clawdbot-gateway.service` is orphaned from rebrand. Creates confusion in `gateway status`.

---

## 6. [MEDIUM] Evolution Queue Triage

**Status:** 🟢 Weekly Task  
**Time:** 15-30 minutes  

**Current Count:** 63 items in `EVOLUTION-QUEUE.md`

**Task:** Review each item and:
1. Mark resolved items as `[RESOLVED]`
2. Move truly done items to `EVOLUTION-QUEUE-ARCHIVE.md`
3. Identify items that Cursor should handle (code changes)

**Reference:** Check `CURSOR-RESOLUTIONS.md` for recent fixes.

---

## 7. [LOW] Session Canonicalization

**Status:** 🟢 Maintenance  
**Time:** 1 minute  
**Command:**
```bash
pnpm openclaw doctor --fix
```

This also fixes legacy session key format in `liam-discord/sessions/sessions.json`.

---

## Summary Checklist

| # | Task | Priority | Est. Time |
|---|------|----------|-----------|
| 1 | ~~Fix config~~ | ~~CRITICAL~~ | ✅ Cursor fixed |
| 2 | Fix permissions (chmod) | CRITICAL | 1 min |
| 3 | Restart gateway | HIGH | 2 min |
| 4 | Fix dashboard lint | HIGH | 20 min |
| 5 | Clean legacy services | MEDIUM | 2 min |
| 6 | Evolution queue triage | MEDIUM | 30 min |
| 7 | Session canonicalization | LOW | 1 min |

**Total estimated time:** ~55 minutes (config fix done by Cursor)

---

## Context: What Cursor Has Done

Cursor completed:
- ✅ Fixed `vocalDirection` schema (added to core + voice-call plugin)
- ✅ Added context overflow prevention (thresholds, hallucination detection)
- ✅ Updated SOUL.md and LIMINAL/PRINCIPLES.md with guardrails

Still investigating (pre-existing issues):
- Test failures in `src/auto-reply/reply/agent-runner.reasoning-tags.test.ts` (6 tests)
- Lint errors in `src/` TypeScript files (~60 errors, pre-existing)

**Do not touch:** `src/` files - that's Cursor's domain.

---

## New Guardrails You Should Know About

**Context Overflow Prevention (implemented today):**
- Pre-flight compaction now triggers at 50% (was 70%)
- Hard ceiling now at 75% (was 90%)
- Your SOUL.md has been updated with new "Compaction Summary Awareness" section

**Hallucination Boundaries (implemented today):**
- LIMINAL/PRINCIPLES.md now has section 7: "Hallucination Boundaries"
- Compaction summaries are now sanitized for hallucinated paths
- Read the "Joshua Incident" documentation

**After completing tasks, update this file or delete completed sections.**
