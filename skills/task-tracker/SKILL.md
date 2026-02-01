---
name: task-tracker
description: Proactively track and manage pending tasks. Check ~/clawd/PENDING-TASKS.md for work that needs attention.
metadata:
  {
    "openclaw":
      {
        "emoji": "📋",
        "proactive": true,
        "checkInterval": "startup,idle"
      }
  }
---

# Task Tracker

Proactively track and work on pending tasks. Liam should check this skill on startup and during idle periods.

## Task File Location

`~/clawd/PENDING-TASKS.md`

## Task Format

Tasks are organized by priority (HIGH, MEDIUM, LOW) with checkboxes:

```markdown
## Priority: HIGH

- [ ] **Task Name** - Description
  - Action: What to do
  - Impact: Why it matters

## Priority: MEDIUM

- [ ] Another task...

## Recently Completed

- [x] Completed task
```

## Proactive Behaviors

### On Startup
1. Read PENDING-TASKS.md
2. Count pending tasks by priority
3. Alert user if HIGH priority tasks exist

### During Idle
1. Check for tasks that can be done autonomously
2. Attempt LOW priority cleanup tasks
3. Report progress

### Autonomous Actions (Safe)
- Archive old plan files
- Clean stale sessions (keep 20 most recent)
- Check API connectivity
- Update task status after completing work

### Requires User Action
- GOG/OAuth authentication
- Discord token refresh
- Any action requiring external credentials

## Commands

Check tasks:
```bash
cat ~/clawd/PENDING-TASKS.md
```

Count pending:
```bash
grep -c "^\- \[ \]" ~/clawd/PENDING-TASKS.md
```

Mark task complete (edit the file):
```bash
# Change "- [ ]" to "- [x]" for the completed task
```

## Example Proactive Message

```
📋 **Task Check**

6 pending tasks:
- 2 HIGH (GOG auth, Discord token)
- 2 MEDIUM (Tailscale, Kimi output)
- 2 LOW (docs, cleanup)

Would you like me to work on any of these?
```

## Integration

This skill integrates with:
- `~/scripts/liam-watchdog.sh` - Checks task count every 5 minutes
- `~/scripts/liam-startup.sh` - Reports tasks on startup
- Cron at 4 AM daily via `~/bin/liam-refresh`
