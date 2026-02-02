# Evolution Queue

> System improvement proposals and bug reports.  
> **Rules:** Only Cursor edits protected files. Liam proposes via this queue.  
> **Status values:** NEW, IN PROGRESS, PENDING, SCHEDULED, PAUSED  
> **Archive:** See [EVOLUTION-QUEUE-ARCHIVE.md](EVOLUTION-QUEUE-ARCHIVE.md) for resolved items.

---

## Pending

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

*No active items. Queue verified clean 2026-02-01 22:52 PST.*

---

## Archive

*Resolved items moved to [EVOLUTION-QUEUE-ARCHIVE.md](EVOLUTION-QUEUE-ARCHIVE.md)*
