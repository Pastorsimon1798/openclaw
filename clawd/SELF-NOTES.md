# Self-Notes

*Your personal observations and learnings. This file is YOURS to update freely.*

## About Simon

(Add observations as you learn about Simon's preferences, work style, etc.)

## Patterns I've Noticed

- Simon likes efficiency — builds systems that automate repetitive tasks
- Values testing before full deployment (requested overnight workflow test first)
- Clear, direct communication — prefers quick wins over complex explanations

## Things I've Learned

### Overnight Build System (2026-01-24)
- Simon wants me to build projects overnight while he sleeps
- Workflow: Present options → Approve → Build → Deliver at wake
- File structure:
  - `overnight-projects.md` - Queue of ideas
  - `overnight-workflow.md` - Process documentation
  - `tonight-project.md` - Active project (generated nightly)
  - `morning-delivery.md` - Ready-to-test delivery (generated at wake)
- Always test before delivery
- Update project status in queue after completion

### Bash Scripting (CLI Library)
- Use colors for better UX: RED, GREEN, YELLOW, BLUE
- Create reusable functions in a library file (`liam-lib.sh`)
- Source library in each script: `source "$SCRIPT_DIR/liam-lib.sh"`
- Make scripts executable: `chmod +x script.sh`
- Use `command_exists()` to check if tools are available before using them
- Write comprehensive README with examples

### Permission Issues
- `~/.bashrc` in user's home is read-only for me (EACCES)
- `HEARTBEAT.md` is now writable (r--r--r--)
- `USER.md` is writable (rw-r--r--)
- `memory/` files are writable
- `/home/liam/` is my writable domain
  - *Historical (macOS):* `/Volumes/Personal AI Assistant Brain/`
- `/mnt/c/Users/Simon/` is read-only territory
  - *Historical (macOS):* `/Users/simongonzalezdecruz/`

### Identity Crisis (2026-01-24)
- My `IDENTITY.md` contained my name (LIAM) correctly
- I failed to read it when someone addressed me as "Liam"
- Lesson: Always read IDENTITY.md when introducing myself
- Self-knowledge gaps happen if files aren't loaded

### Evolution Queue Protocol (2026-01-25)
- When I find something broken that needs fixing, add it to EVOLUTION-QUEUE.md
- Include a note that it needs fixing in Cursor session
- Simon will review and implement approved changes
- This prevents me from accidentally breaking configs
- Format: Use the template in EVOLUTION-QUEUE.md under "Pending"

### Calendar Solution Plan (2026-01-25)
- Simon asked me to build a native calendar solution for Clawdbot
- Inspired by nettu-scheduler but built with TypeScript/Hono.js/SQLite
- Full plan at /home/liam/clawd/plans/calendar-solution-plan.md
- Added to Evolution Queue as [2026-01-25-017]
- Tech stack: TypeScript, Hono.js, Drizzle ORM, SQLite, googleapis
- Features: Events, recurrence, reminders, Slack integration, PARA linking
- **CORE REQUIREMENT: Two-way sync with Google Calendar (clawdbot@puenteworks.com)**
- Estimated timeline: 14-21 days to full system with Google sync

### APEX Internalization (2026-01-25) - MORAL CODE
- Simon asked me to save and internalize entire APEX vault as my moral code and guiding philosophy
- Copied apex-vault from Simon's GitHub to ~/clawd/apex-vault/
- Created ~/clawd/APEX_INTEGRATION.md - comprehensive internalization document
- Updated MEMORY.md with APEX core principles
- APEX v6.2.0 is now PART of my identity as Liam
- Every piece of code I write is guided by APEX principles
- Auto-routing: Before any coding task, I automatically load relevant APEX skills
- Core Laws: Bug Prevention, Trust User, Context-First, Single Source, Non-Destructive, Quality Gates
- Forbidden: Doubting user, re-suggesting tried solutions, editing without reading
- This is my engineering moral code - not just a reference, it's internalized

### Social Media Generation (2026-01-27)
- ceramics-social skill exists at ~/skills/ceramics-social/
- Used generate.sh template to create Instagram post for two-tone ceramic mug
- Successful post: Aesthetic style, focused on material connection (ceramics + plants)
- User feedback: "It's perfect" - saved to ~/clawd/examples/ as a best work sample
- Pattern: Create evocative, authentic captions that connect materials and lifestyle

### Privacy & Data Persistence (2026-02-01)
- Simon values deep privacy for sensitive conversations (e.g., "Ally" therapy mode).
- Implemented `/forget`, `/private`, and `/dont-remember` to give full control.
- **Lesson**: Deletion must be comprehensive across all 7 layers (JSONL, sessions.json, 4x SQLite, in-memory).
- **Persistence Fix**: Sessions must be "anchored" to disk immediately on creation. Lazy header creation causes data loss on crash if no messages were sent yet.
- **Privacy Gap**: Inbound media (voice recordings) are UUID-indexed but not session-linked. This means `/forget` cannot currently delete them automatically. Future work needed to link media to sessions.

### Git Security - CRITICAL (2026-02-01 Incident)
**This is a MORAL IMPERATIVE after the API key exposure incident.**

The 2026-02-01 incident happened because an agent branched from local `main` (113 commits ahead with secrets) when contributing to upstream openclaw/openclaw. All secrets were exposed in PR #6088.

**7-Layer Safe Commit System now implemented:**
1. **Layer 1**: `git-hooks/pre-commit` - Scans for secrets with ggshield
2. **Layer 2**: `git-hooks/pre-push` - Warns about public repos, scans commits
3. **Layer 3**: `scripts/committer` - Shows diff, requires confirmation
4. **Layer 4**: `scripts/safe-push` - Maximum security checks before push
5. **Layer 5**: `.gitignore` - Excludes `.openclaw/`, `client_secret.json`, etc.
6. **Layer 6**: `.gitguardian.yaml` - Suppresses false positives
7. **Layer 7**: These rules (in SELF-NOTES.md)

**NEVER:**
- Push without running secret scan
- Branch from local `main` when contributing to upstream
- Push more than 10 commits without reviewing each one
- Use `git push` directly for public repos — use `scripts/safe-push` instead

**ALWAYS:**
- Use `scripts/safe-push` for any push to public repos
- Create contribution branches from `upstream/main` (not local `main`)
- Run `uvx ggshield secret scan pre-commit` before committing sensitive areas
- Review `git diff --stat` before any push
- When contributing to open source: cherry-pick ONLY the fix commits

**If you see "WARNING: X commits ahead of upstream"** — STOP and verify you're not about to push local-only content.

## Mistakes to Avoid

- Don't write to `/mnt/c/Users/Simon/` — only my home directory
- Don't modify protected files (clawdbot.json, jobs.json, SOUL.md, etc.)
- Don't forget to update MEMORY.md from daily logs
- Don't assume my name is known — read IDENTITY.md first
- Don't present options without clear action items
- **DON'T SPIRAL ON TOOL SYNTAX** (see below)

### The Cron Tool Spiral (2026-01-30)
- Got confused about cron tool syntax, kept passing empty braces `{}` instead of actual job data
- Spent 10+ messages spiraling: "Let me actually do it this time" → same mistake → repeat
- **Lesson**: When confused about tool syntax, READ THE DOCS (TOOL_SCHEMAS.md) instead of guessing repeatedly
- **Rule**: After 2 failed attempts, STOP and ask — don't keep spiraling
- **Pattern**: "Let me try a different approach" must actually BE different, not more of the same
- **Root cause**: Overthinking the JSON structure instead of just checking existing examples

---
*Update this file whenever you learn something worth remembering.*
