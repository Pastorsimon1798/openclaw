---
name: Complete APEX System Audit
overview: Comprehensive APEX v4.4.1 audit of Liam's entire system covering evolution queue status, latency optimizations, and issues requiring attention using the bug-comorbidity analysis protocol.
todos:
  - id: set-gog-keyring
    content: Set GOG_KEYRING_PASSWORD in systemd service environment
    status: pending
  - id: delete-lock-file
    content: Delete corrupted gateway lock file
    status: pending
  - id: enable-telegram-stream
    content: Change Telegram streamMode to partial
    status: pending
  - id: configure-brave-api
    content: Configure BRAVE_API_KEY for web search
    status: pending
  - id: install-go-blogwatcher
    content: Install Go and blogwatcher CLI
    status: pending
  - id: fix-cron-jobs
    content: Re-register cron jobs (jobs.json is empty)
    status: pending
  - id: cleanup-backups
    content: Remove old config backup files
    status: pending
isProject: false
---

# Complete APEX System Audit

**APEX Version**: v4.4.1
**Audit Date**: 2026-01-25
**System**: Liam (Clawdbot v2026.1.25)

---

## 1. Evolution Queue Status

### CRITICAL Priority

| ID | Item | Status | Blocker |
|----|------|--------|---------|
| 2026-01-25-020 | Web Search API & Browser Automation | PENDING | Missing BRAVE_API_KEY, no browser in WSL2 |

### HIGH Priority (Approved, Waiting on Dependencies)

| ID | Item | Status | Blocker |
|----|------|--------|---------|
| 2026-01-25-002 | Whisper.cpp for Voice Capture | APPROVED | Build tools not installed |
| 2026-01-25-004 | GitHub PR/Issue Monitoring | APPROVED | `gh auth login` not run |

### HIGH Priority (Pending Approval)

| ID | Item | Status | Notes |
|----|------|--------|-------|
| 2026-01-25-019 | Digital Download Business Research | PENDING | Research complete, awaiting decision |
| 2026-01-25-017 | Clawdbot-Native Calendar | PENDING | Full plan at `/home/liam/clawd/plans/calendar-solution-plan.md` |
| 2026-01-25-015 | Data Analytics Capabilities | PENDING | Needs research and planning |

### MEDIUM Priority

| ID | Item | Status | Notes |
|----|------|--------|-------|
| 2026-01-25-018 | Edison Learning Job Tracking | PENDING | Active opportunity |
| 2026-01-25-016 | PuenteWorks Documentation Import | PENDING | Waiting for files from Simon |

### LOW Priority

| ID | Item | Notes |
|----|------|-------|
| 2026-01-25-014 | Blogwatcher Installation | Needs Go |
| 2026-01-25-003 | Instagram Intelligence | Needs API token |
| 2026-01-25-007 | Low-Friction Capture | Depends on Whisper |
| 2026-01-25-010 | NeuroSecond Summarization | Pipeline needed |
| 2026-01-25-011 | Notion PARA Integration | Low priority |
| 2026-01-25-012 | Automated Testing | For overnight builds |

### Already Implemented

- Memory Search (nomic-embed-text)
- Enhanced Calendar Reminders
- PARA Task Management
- Context Cue System
- Visual Timer
- Health Check Suite

---

## 2. Latency Optimization Opportunities

### A. Model Routing (HIGH IMPACT)

**File**: [/home/liam/.clawdbot/clawdbot.json](/home/liam/.clawdbot/clawdbot.json)

**Current**:
```json
"model": {
  "primary": "zai/glm-4.7",      // Cloud - 5-15s latency
  "fallbacks": ["ollama/glm-4.7-flash"]  // Local - 2-5s latency
}
```

**Optimization**: For routine tasks, local model is 3-5x faster. Consider:
- Route simple queries to local first
- Use cloud only for complex reasoning
- Add per-task model routing

### B. Telegram Streaming (HIGH IMPACT)

**Current**: `"streamMode": "off"` (line 233)

**Issue**: User waits for entire response before seeing anything.

**Optimization**: Enable `"streamMode": "partial"` or `"block"` for faster perceived response.

### C. Subagent Model (MEDIUM IMPACT)

**Current**: `"subagents": { "model": "zai/glm-4.7" }` (line 161)

**Issue**: Subagents use slow cloud model.

**Optimization**: Change to `"ollama/glm-4.7-flash"` for faster parallel tasks.

### D. Plugin Timeout (LOW IMPACT)

**Current**: `"timeoutMs": 60000` (llm-task plugin)

**Optimization**: Reduce to 20-30s for local models to fail faster.

### E. Memory Sync (LOW IMPACT)

**Current**: `"sync": { "onSearch": true, "watch": true }`

**Optimization**: Consider `"watch": false` if real-time sync not needed.

### F. Block Streaming Chunks (LOW IMPACT)

**Current**: `"minChars": 100, "maxChars": 500`

**Optimization**: Increase to 200-800 for better throughput.

---

## 3. Issues Requiring Attention (Comorbidity Analysis)

### CRITICAL Issues

#### Issue 1: Web Capabilities Completely Blocked

**Category**: Resource/Configuration

**Symptoms**:
- `missing_brave_api_key` error on web search
- 500 error "No supported browser found" on browser automation

**Comorbidity Analysis**:
| Pattern | Check | Status |
|---------|-------|--------|
| Missing API key | Other API keys missing? | GOG_KEYRING_PASSWORD also missing |
| Browser not found | Other tools expecting GUI? | Chromium not installed in WSL2 |
| WSL2 limitation | Other WSL2 restrictions? | No direct Windows app access |

**Required Action**: Configure BRAVE_API_KEY or install Chromium in WSL2.

---

### HIGH Issues

#### Issue 2: GOG_KEYRING_PASSWORD Not Set

**Category**: Security/Configuration

**Symptoms**: `no TTY available for keyring file backend password prompt`

**Impact**: Gmail/Calendar operations fail in cron jobs and automated tasks.

**Comorbidity Analysis**:
| Pattern | Check | Status |
|---------|-------|--------|
| Missing env var | Other env vars missing? | ZAI_API_KEY is set |
| Keyring access | Other credential stores? | N/A |
| Non-interactive failure | Other TTY-dependent tools? | Check any interactive prompts |

**Required Action**: Set `GOG_KEYRING_PASSWORD` in environment or systemd service.

#### Issue 3: API Rate Limiting (429 Errors)

**Category**: Resource/Concurrency

**Symptoms**: `429 Too many API requests` from ZAI provider

**Comorbidity Analysis**:
| Pattern | Check | Status |
|---------|-------|--------|
| Rate limit hit | Request batching? | maxConcurrent: 4 may be too aggressive |
| No backoff | Retry logic? | Unknown |
| Burst traffic | Cron job storms? | Multiple jobs at same time |

**Required Action**: Add request throttling or increase rate limit with ZAI.

#### Issue 4: Blogwatcher Cron Job Failing

**Category**: Dependency/Configuration

**Symptoms**: Cron job runs but blogwatcher CLI not found

**Comorbidity Analysis**:
| Pattern | Check | Status |
|---------|-------|--------|
| Missing binary | Other binaries missing? | `uv` also needed for image gen skills |
| Go not installed | Other Go tools needed? | None currently |
| Cron job silently fails | Other cron jobs failing? | Check jobs.json is empty |

**Required Action**: Install Go, then `go install blogwatcher@latest`.

---

### MEDIUM Issues

#### Issue 5: Slack missing_scope Error

**Category**: Auth/Configuration

**Symptoms**: Cannot send Slack messages from automated tasks

**Comorbidity Analysis**:
| Pattern | Check | Status |
|---------|-------|--------|
| OAuth scope missing | Other OAuth issues? | Check Slack app permissions |
| Token expired | Other tokens expired? | Check refresh logic |

**Note**: Slack is currently disabled (`"enabled": false`), so this may be intentional.

#### Issue 6: Empty Cron Jobs File

**File**: [/home/liam/.clawdbot/cron/jobs.json](/home/liam/.clawdbot/cron/jobs.json)

**Current**: `{"version": 1, "jobs": []}`

**Issue**: STATUS.md lists several cron jobs, but jobs.json is empty.

**Comorbidity Analysis**:
| Pattern | Check | Status |
|---------|-------|--------|
| State mismatch | Other state files out of sync? | Gateway lock file corrupted |
| Jobs not persisted | Cron jobs in memory only? | May need re-registration |

**Required Action**: Re-register cron jobs via gateway or investigate why not persisting.

#### Issue 7: Gateway Lock File Corruption

**File**: `/home/liam/.clawdbot/gateway.7f79268c.lock`

**Issue**: Contains TypeScript source code instead of lock data.

**Comorbidity Analysis**:
| Pattern | Check | Status |
|---------|-------|--------|
| File corruption | Other corrupted files? | None found |
| Write to wrong file | File descriptor leak? | Unknown |

**Required Action**: Delete and let gateway recreate on restart.

---

### LOW Issues

| Issue | Location | Status |
|-------|----------|--------|
| Missing Brave API key | Config | Blocks web search |
| Session lock file present | `~/.clawdbot/agents/main/sessions/` | May indicate stuck session |
| Multiple config backups | `~/.clawdbot/` | 9 backup files, needs cleanup |
| Missing favicon | `/home/liam/clawd/canvas/favicon.ico` | Minor UI issue |

---

### Skills Status Mismatch

**File**: [/home/liam/clawd/STATUS.md](/home/liam/clawd/STATUS.md)

**Listed as OK but NOT FOUND in `/home/liam/clawdbot/skills/`**:
- zai-vision
- inventory
- social-media
- gog

**Actually Present and Working**:
- zai-search
- opportunity-lifecycle

**Blocked**:
- blogwatcher (Go not installed)

**Note**: Missing skills may be bundled with Clawdbot core rather than in skills directory.

---

## 4. Recommended Actions (Priority Order)

### Immediate (Do Today)

1. **Set GOG_KEYRING_PASSWORD** - Unblocks Gmail/Calendar cron jobs
2. **Delete corrupted lock file** - `rm /home/liam/.clawdbot/gateway.7f79268c.lock`
3. **Enable Telegram streaming** - Change `streamMode` to `"partial"`

### Short-Term (This Week)

4. **Configure BRAVE_API_KEY** - Unblocks web search
5. **Install Go + blogwatcher** - Unblocks RSS monitoring
6. **Re-register cron jobs** - Fix empty jobs.json
7. **Clean up config backups** - Remove old `.bak` files

### Medium-Term (This Month)

8. **Review model routing** - Consider local-first for speed
9. **Install Chromium in WSL2** - Enable browser automation
10. **Complete approved Evolution Queue items**:
    - Whisper.cpp (needs build tools)
    - GitHub monitoring (needs `gh auth login`)

---

## APEX Audit Verification Commands

```bash
# Check gateway status
systemctl --user status clawdbot-gateway.service

# Check Ollama models
curl -s http://172.26.0.1:11434/api/tags | jq '.models[].name'

# Check cron jobs
cat ~/.clawdbot/cron/jobs.json

# Check for corrupted files
file ~/.clawdbot/gateway.*.lock

# Count config backups
ls -la ~/.clawdbot/*.bak* ~/.clawdbot/*.backup* 2>/dev/null | wc -l

# Verify skills
ls -la ~/clawdbot/skills/*/SKILL.md
```

---

## Final APEX Audit

**Audit Result**: NEEDS ATTENTION

| Category | Status | Count |
|----------|--------|-------|
| Critical Issues | BLOCKED | 1 (web capabilities) |
| High Issues | ACTION NEEDED | 4 |
| Medium Issues | MONITORING | 3 |
| Low Issues | CLEANUP | 4 |
| Evolution Queue | 14 pending, 2 approved, 6 implemented |
| Latency Optimizations | 6 identified |

**Next Steps**: Execute immediate actions, then work through short-term items.