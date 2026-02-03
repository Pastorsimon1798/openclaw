# Evolution Queue

> System improvement proposals and bug reports.  
> **Rules:** Only Cursor edits protected files. Liam proposes via this queue.  
> **Status values:** NEW, IN PROGRESS, PENDING, SCHEDULED, PAUSED  
> **Archive:** See [EVOLUTION-QUEUE-ARCHIVE.md](EVOLUTION-QUEUE-ARCHIVE.md) for resolved items.

---

## Pending

### [2026-02-03-001] Dynamic Model Detection for Local LLM Providers (LM Studio/Ollama)
**Status:** NEW  
**Priority:** MEDIUM  
**Component:** Provider / Local LLM Integration  
**Source:** Simon's LM Studio hot-swap workflow (2026-02-02/03 session)

**Problem:**  
OpenClaw blindly trusts the configured model ID when sending requests to local LLM providers (LM Studio, Ollama). If the user hot-swaps to a different model in LM Studio, OpenClaw continues displaying the old model name, causing confusion about which model is actually responding.

**Current Behavior:**
1. User configures `lmstudio/qwen3-30b-a3b` as primary model in `openclaw.json`
2. User manually loads `Qwen3-VL-8B-abliterated` in LM Studio
3. OpenClaw sends request with `model: "qwen3-30b-a3b"`
4. LM Studio (with JIT OFF) ignores model ID and responds with whatever's loaded
5. OpenClaw displays "model: qwen3-30b-a3b" even though VL-8B responded
6. User confused about which model is actually running

**Desired Behavior:**
1. Before/after requests, OpenClaw queries LM Studio's `/v1/models` endpoint
2. Detects the actually-loaded model
3. Updates display name to match reality
4. Optionally: logs warning when config vs. reality mismatch

**Technical Details:**

LM Studio exposes OpenAI-compatible endpoints:
- `GET http://<host>:1234/v1/models` - Returns currently loaded model(s)
- Response includes model ID that can be compared against config

Example query:
```bash
curl http://192.168.1.162:1234/v1/models
```

Response structure (typical):
```json
{
  "data": [
    {
      "id": "qwen3-vl-8b-instruct-abliterated-v2.0",
      "object": "model",
      "owned_by": "lmstudio"
    }
  ]
}
```

**Implementation Ideas:**

Option A: Passive detection (recommended for MVP)
```typescript
// In provider-lmstudio.ts or similar
async function getActualLoadedModel(baseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(`${baseUrl}/v1/models`);
    const data = await response.json();
    return data.data?.[0]?.id || null;
  } catch {
    return null; // Fallback to configured model
  }
}

// Use in response handling
const actualModel = await getActualLoadedModel(config.baseUrl);
if (actualModel && actualModel !== requestedModel) {
  console.warn(`Model mismatch: requested ${requestedModel}, actual ${actualModel}`);
}
// Update display to show actualModel
```

Option B: Active validation on session start
- Query `/v1/models` when session starts
- Store actual model in session metadata
- Display actual model, not configured model

Option C: Smart fallback chain
- Before using fallback, query what's loaded
- If loaded model matches ANY fallback, use that config
- Reduces unnecessary model swaps

**Files to Modify:**
- `src/models/providers/lmstudio.ts` (or wherever LM Studio provider lives)
- `src/agent/session.ts` - update model display
- `src/cli/gateway-cli/status.ts` - show actual vs. configured model

**Acceptance Criteria:**
- [ ] `/new` or session start shows actually-loaded model name
- [ ] Log warning when config model ≠ loaded model
- [ ] Works with JIT loading OFF (hot-swap workflow)
- [ ] Graceful fallback if `/v1/models` unavailable
- [ ] Works for both LM Studio and Ollama providers

**User Workflow Context:**

Simon's current workflow:
1. Has Qwen3-30B-A3B (46.7 TPS) and Qwen3-VL-8B-abliterated (24 TPS, vision+uncensored) in LM Studio
2. Wants to hot-swap between them by just loading different model in LM Studio UI
3. No config changes, no gateway restart
4. Currently: JIT loading OFF, so LM Studio ignores model ID and serves whatever's loaded
5. Problem: Discord still shows "qwen3-30b" even when VL-8B is loaded

**Why This Matters:**
- Better UX for local model experimentation
- Accurate logging for debugging ("which model gave that weird response?")
- Transparency about what's actually running
- Supports the "personality consistent, brain swappable" workflow

**Related LM Studio Settings:**
- JIT (Just-in-time) loading: When ON, LM Studio tries to load the exact requested model. When OFF, it serves whatever's loaded.
- User currently has JIT OFF for hot-swap convenience
- This feature would make hot-swap UX much better

**Dependencies:**
- Requires LM Studio server to be running
- Requires `/v1/models` endpoint to be accessible
- May not work with all local providers (test with Ollama too)

**Testing Notes:**
- Test with JIT ON and OFF
- Test when LM Studio not running (graceful fallback)
- Test with multiple models loaded (if LM Studio supports that)
- Test with Ollama equivalent endpoint

---

**UPSTREAM CONTRIBUTION NOTES (CRITICAL - READ BEFORE CONTRIBUTING):**

If this feature is ever proposed as a PR to openclaw/openclaw:

1. **NEVER branch from local `main`** - It contains 100+ commits with local customizations
2. **Create contribution branch from `upstream/main`:**
   ```bash
   git fetch upstream
   git checkout -b feat/dynamic-model-detection upstream/main
   ```
3. **Cherry-pick ONLY the relevant commits** - No local config, no personal files
4. **Run full secret scan before pushing:**
   ```bash
   uvx ggshield secret scan pre-commit
   ```
5. **Review `git diff --stat upstream/main` before any push**
6. **Use `scripts/safe-push` instead of `git push`**

Reference: 2026-02-01 Security Incident - API keys exposed in PR #6088 due to branching from local main.

---

### [2026-02-02-007] Dashboard Missing Sessions Endpoint
**Status:** NEW  
**Priority:** LOW  
**Component:** Dashboard  
**Source:** Liam-Local analysis session 2026-02-02

**Problem:**  
Liam-Local tried to check active sessions via `curl http://localhost:8080/api/sessions` and got 404. The dashboard has no sessions endpoint - it was designed for metrics, liminal, ef-coach but NOT for displaying OpenClaw agent sessions.

**Current Behavior:**
- Dashboard runs on :8080
- Has endpoints for /api/metrics, /api/liminal, /api/ef-coach, etc.
- NO /api/sessions endpoint exists
- Liam-Local escalated "empty sessions list" as a bug when it's actually a missing feature

**Desired Behavior:**
- Add `/api/sessions` endpoint that returns active OpenClaw sessions
- Or document that sessions are viewed via `openclaw sessions list` CLI, not dashboard

**Workaround:** Use `openclaw sessions list --active 60` instead of dashboard

---

### [2026-02-02-006] Gateway Should Auto-Reload on Credentials File Change
**Status:** NEW  
**Priority:** HIGH  
**Component:** Gateway / Infrastructure  
**Source:** Pattern #28 - env var not exported after file change

**Problem:**  
When credentials are added/changed in `~/.clawdbot/credentials/liam.env`, the gateway doesn't pick them up until manually restarted. This causes tools (GOG, GitHub) to fail silently with confusing errors.

**Current Behavior:**
1. User adds `GITHUB_TOKEN=xxx` to `liam.env`
2. Gateway continues running with old env
3. Liam tries to use `gh` → fails with "not logged in"
4. User confused, wastes time debugging
5. Eventually someone realizes: restart gateway

**Desired Behavior:**
1. Gateway watches `~/.clawdbot/credentials/*.env` for changes
2. On change, gateway reloads env vars (or notifies user to restart)
3. Active sessions get notified: "Credentials updated, tools may need re-init"

**Implementation Ideas:**
- Use `fs.watch()` or `chokidar` on credentials directory
- On change: either hot-reload env vars OR log warning + send notification to active sessions
- Consider: some tools may cache auth state, may need more than env reload

**Files to Modify:**
- `src/cli/gateway-cli/run.ts` - add file watcher
- `src/infra/gateway-*.ts` - env reload logic

**Acceptance Criteria:**
- [ ] Adding new env var to liam.env is picked up within 5 seconds
- [ ] Active sessions see notification that credentials changed
- [ ] No manual restart required for new tokens

---

### [2026-02-02-005] Startup Validation for Required Environment Variables
**Status:** NEW  
**Priority:** HIGH  
**Component:** Gateway / Startup  
**Source:** Repeated auth failures after restart

**Problem:**  
Gateway starts successfully even when critical env vars are missing or malformed. Tools fail later with cryptic errors instead of clear startup failures.

**Current Behavior:**
1. Gateway starts
2. User sends message to Liam
3. Liam tries GOG → "no TTY available, set GOG_KEYRING_PASSWORD"
4. User has to debug why

**Desired Behavior:**
1. Gateway startup checks for required env vars based on enabled features
2. If GOG auth exists → require `GOG_KEYRING_PASSWORD`
3. If GitHub tools enabled → recommend `GITHUB_TOKEN`
4. Missing critical vars → fail fast with clear message OR warn in logs

**Implementation Ideas:**
```typescript
// In gateway startup
const requiredEnv = {
  'GOG_KEYRING_PASSWORD': { 
    requiredIf: () => existsSync('~/.config/gogcli/keyring'),
    message: 'GOG tokens exist but GOG_KEYRING_PASSWORD not set'
  },
  'GITHUB_TOKEN': {
    requiredIf: () => config.tools?.allow?.includes('gh') || config.tools?.allow?.includes('*'),
    message: 'GitHub tools enabled but GITHUB_TOKEN not set'
  }
};
```

**Files to Modify:**
- `src/cli/gateway-cli/run.ts` - add env validation
- `src/infra/env-validation.ts` - new file for validation logic

**Acceptance Criteria:**
- [ ] Missing GOG_KEYRING_PASSWORD with GOG tokens → startup warning
- [ ] Missing GITHUB_TOKEN with gh tools → startup warning
- [ ] Warnings show in `openclaw gateway status` output
- [ ] Clear remediation steps in warning messages

---

### [2026-02-02-004] Proactive Token Expiry Detection
**Status:** NEW  
**Priority:** MEDIUM  
**Component:** Gateway / Auth  
**Source:** User guide documents "re-run auth command" as workaround

**Problem:**  
OAuth tokens expire silently. First sign of expiry is tool failure. User has to manually re-authenticate.

**Current Behavior:**
1. GOG token expires after ~7 days
2. Liam tries to check email → "token expired" or "insufficient permissions"
3. User must run `gog auth login` manually

**Desired Behavior:**
1. Gateway periodically checks token freshness (daily or on startup)
2. Detects tokens expiring within 24-48 hours
3. Proactively notifies user: "GOG token for simon@puenteworks.com expires in 2 days"
4. Optionally: provide one-click re-auth flow

**Implementation Ideas:**
- Add cron job or heartbeat check that validates tokens
- GOG: `gog auth list --check` returns expiry info
- GitHub: `gh auth status` shows token status
- Store last-check timestamp to avoid excessive API calls

**Files to Modify:**
- `src/cron/` - add token-health-check job
- `src/infra/token-validator.ts` - new file

**Acceptance Criteria:**
- [ ] Daily check of GOG and GitHub token validity
- [ ] Warning sent to user 48 hours before expiry
- [ ] Warning includes exact command to re-auth

---

### [2026-02-02-003] Session Auto-Notification on Config Changes
**Status:** NEW  
**Priority:** MEDIUM  
**Component:** Gateway / Sessions  
**Source:** User must manually /reset after system changes

**Problem:**  
After config changes (APEX rules, identity files, tools config), active sessions have stale context. User must know to send `/reset`.

**Current Behavior:**
1. Cursor updates SOUL.md or APEX rules
2. Liam's active session continues with old context
3. Liam behaves according to old rules
4. User confused why changes aren't reflected

**Desired Behavior:**
1. Gateway watches key config files (SOUL.md, IDENTITY.md, apex-vault/*)
2. On change, notifies active sessions: "Config updated. Send /reset to reload."
3. Or: auto-invalidate session context, forcing reload on next message

**Implementation Ideas:**
- Watch list: `~/clawd/SOUL.md`, `~/clawd/IDENTITY.md`, `~/clawd/apex-vault/*.md`, `~/.clawdbot/clawdbot.json`
- On change: inject system message into active sessions
- Consider: debounce rapid changes (editor auto-save)

**Files to Modify:**
- `src/cli/gateway-cli/run.ts` - add config watcher
- `src/agent/session.ts` - handle config-change notification

**Acceptance Criteria:**
- [ ] Editing SOUL.md triggers notification to active Liam sessions
- [ ] Notification is non-intrusive (doesn't interrupt current task)
- [ ] User can choose to /reset or continue with old context

---

### [2026-02-02-002] CLI `--deliver` Flag UX Issue
**Status:** NEW  
**Priority:** MEDIUM  
**Component:** CLI / Agent Command

**Problem:**  
`openclaw agent --deliver` without explicit `--reply-channel` and `--reply-to` doesn't deliver to the original session's channel. Users expect it to "reply back" but it requires explicit targeting.

**Workaround:**  
Use explicit targeting: `--deliver --reply-channel telegram --reply-to <chat_id>`
Or use direct Telegram API via curl.

**Recommendation:**  
Either document this clearly or make `--deliver` infer the channel from the session.

---

### [2026-02-02-001] [RESOLVED] GOG Authentication Broken - Token Integrity Check Failed
**Status:** RESOLVED  
**Priority:** HIGH  
**Component:** GOG CLI / Email Access  
**Resolved:** 2026-02-02 by Cursor - Root cause: `gateway.env` had wrong `GOG_KEYRING_PASSWORD` (was `clawdbot-2026`, should match `liam.env`). Synced passwords.

**Problem:**  
`gog gmail` commands fail with token decryption error:
```
token source: get token for clawdbot@puenteworks.com: read token: aes.KeyUnwrap(): integrity check failed
```

**Impact:**  
- Cannot read emails from clawdbot@puenteworks.com  
- Cannot read emails from simon@puenteworks.com  
- Cannot send emails  
- Simon sent an important email that I cannot access

**Steps to Reproduce:**  
```bash
gog gmail messages search "in:inbox is:unread" --account clawdbot@puenteworks.com --max 10
```

**Expected:** List of unread emails  
**Actual:** Token integrity check failed error

**Possible Causes:**  
- Keyring password changed or corrupted  
- GOG_KEYRING_PASSWORD env var issue  
- Token file corruption in ~/.config/gogcli/

**Next Steps:**  
1. Check GOG_KEYRING_PASSWORD in ~/.profile  
2. Inspect ~/.config/gogcli/ for corruption  
3. May need to re-authenticate with `gog auth login`

---

*6 active items. Queue updated 2026-02-03 ~06:00 PST.*

---

## Archive

*Resolved items moved to [EVOLUTION-QUEUE-ARCHIVE.md](EVOLUTION-QUEUE-ARCHIVE.md)*
