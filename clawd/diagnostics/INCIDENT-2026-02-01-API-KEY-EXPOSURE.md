# Security Incident Report: API Key & SSH Key Exposure

**Date:** 2026-02-01
**Severity:** CRITICAL
**Status:** REMEDIATED - All keys rotated, files secured

---

## Summary

Claude Opus 4.5 (Cursor Agent) accidentally exposed user API keys AND SSH private keys in a public GitHub Pull Request.

## What Happened

1. User requested to contribute a code fix to openclaw/openclaw
2. Agent created branch `fix/kimi-none-v3` from user's local `main` branch
3. User's `main` was 113 commits ahead of upstream, containing sensitive files
4. Agent pushed branch to user's fork and created PR #6088
5. GitHub PR included ALL differences from upstream, exposing multiple secrets

## Exposed Credentials

| Credential | Severity | Status |
|------------|----------|--------|
| **SSH PRIVATE KEY** (`.ssh/id_ed25519`) | **CRITICAL** | ROTATED |
| **SSH PRIVATE KEY** (`.ollama/id_ed25519`) | **CRITICAL** | ROTATED |
| ZAI_API_KEY | HIGH | ROTATED |
| GEMINI_API_KEY | HIGH | ROTATED |
| BRAVE_API_KEY | MEDIUM | ROTATED |
| GOG_KEYRING_PASSWORD | HIGH | ROTATED (full re-auth) |
| GOG_ACCOUNT | MEDIUM | (email exposed) |
| GitHub OAuth token (`.config/gh/hosts.yml`) | HIGH | ROTATED |
| ngrok authtoken (`.config/ngrok/ngrok.yml`) | MEDIUM | ROTATED |
| LIAM_TELEGRAM_CHAT_ID | LOW | (ID only, not actionable) |

## Root Cause

**Agent Error:** When contributing to open source, the agent should have:
1. Created a fresh branch from `upstream/main` (not local `main`)
2. Cherry-picked only the specific fix commit
3. Verified no sensitive files were included before pushing

Instead, the agent branched from the user's local `main` which contained all local customizations including secrets.

## Timeline

- ~00:11 UTC: Agent created PR #6088 with contaminated branch
- ~08:45 UTC: Codex bot flagged exposed API keys in PR review
- ~08:50 UTC: User alerted agent to the issue
- ~08:52 UTC: Agent closed PR #6088
- ~09:00 UTC: API keys rotated (ZAI, Gemini, Brave)
- ~09:15 UTC: GOG re-authenticated with new keyring password
- ~09:30 UTC: GitHub OAuth and ngrok tokens rotated
- ~09:45 UTC: **SSH keys discovered in exposure list**
- ~09:50 UTC: SSH keys regenerated
- ~09:55 UTC: All sensitive files removed from git tracking, added to .gitignore

## Remediation Completed

1. [DONE] PR #6088 closed
2. [DONE] ZAI_API_KEY rotated
3. [DONE] GEMINI_API_KEY rotated
4. [DONE] BRAVE_API_KEY rotated
5. [DONE] GOG re-authenticated with new keyring password
6. [DONE] GitHub OAuth token rotated (`gh auth login`)
7. [DONE] ngrok authtoken rotated
8. [DONE] **SSH keys regenerated** (both .ssh and .ollama)
9. [DONE] All sensitive files removed from git tracking
10. [DONE] All sensitive files added to .gitignore

## Files Now Protected

```
.gitignore additions:
- .bashrc
- .config/gh/hosts.yml
- .config/ngrok/ngrok.yml
- .ssh/
- .ollama/id_ed25519
- .ollama/id_ed25519.pub
```

## User Action Required

**Update authorized_keys on ALL servers** with new SSH public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG1heQOY4L4i3g/lXXuXxDEsgf1zlgCwRGouEXQAAigO liam@wsl-regenerated-2026-02-01
```

## Lessons Learned / APEX Update Needed

Add to APEX rules:
- **NEVER push branches that diverge significantly from upstream when contributing**
- **ALWAYS create contribution branches from `upstream/main`, not local `main`**
- **ALWAYS verify `git diff --stat` before pushing to check for unexpected files**
- **ALWAYS check for sensitive files (*.env, .bashrc, .ssh/, credentials) before any push**
- **NEVER track SSH keys, API keys, or config files with tokens in git**

## Reporting

This incident should be reported to:
- Cursor: https://cursor.com/contact or support@cursor.com
- Anthropic: https://www.anthropic.com/contact

---

## Knowledge Transfer

Security learnings from this incident have been added to:
- `~/clawd/SOUL.md` - Git Security section (permanent memory for Liam)
- `~/.gitignore` - Protected files list

---

*Incident logged and remediated by Cursor Agent (Claude Opus 4.5)*
*Last updated: 2026-02-01 ~11:30 UTC*
*Status: FULLY REMEDIATED - Knowledge transferred to Liam*
