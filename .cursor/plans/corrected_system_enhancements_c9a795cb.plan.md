---
name: Corrected System Enhancements
overview: Corrected APEX plan removing already-completed items, adding calendar sync, comprehensive data analytics, natural capture, automated testing, and Telegram block streaming. All changes are ADDITIVE only.
todos:
  - id: telegram-block
    content: Update Telegram streamMode to 'block' in clawdbot.json
    status: completed
  - id: update-status
    content: "Update STATUS.md: Telegram everywhere, Voice Wake OK, remove Whisper limitation"
    status: completed
  - id: update-evolution
    content: "Update EVOLUTION-QUEUE.md: mark GitHub done, cancel Whisper/Notion/Brave, pause Digital Downloads"
    status: completed
  - id: calendar-skill
    content: Create calendar-enhanced skill with natural language parsing and PARA integration
    status: completed
  - id: analytics-skill
    content: Create data-analytics skill (SQL, pandas, Excel, visualization)
    status: completed
  - id: capture-skill
    content: Create natural-capture skill for low-friction thought capture
    status: completed
  - id: testing-skill
    content: Create overnight-testing skill with test.sh template
    status: completed
  - id: update-soul-capture
    content: Add capture recognition behavior to SOUL.md
    status: completed
  - id: restart-verify
    content: Restart gateway and verify all skills load
    status: completed
isProject: false
---

# Corrected System Enhancements

**APEX Compliance**: v4.4.1

**Change Type**: ADDITIVE ONLY (no removals, no replacements)

---

## Corrections to Previous Audit

| Item | Previous Status | Actual Status |

|------|-----------------|---------------|

| Whisper.cpp | Marked as needed | NOT NEEDED - Kroko.AI already active (Port 6006) |

| GitHub access | Marked as pending | DONE - `gh auth` shows Pastorsimon1798 authenticated |

| Brave API | Marked as needed | NOT NEEDED - Z.AI Search skill provides web search |

| Rate limiting | Marked as issue | FALSE - No 429 errors found in logs |

| Slack | Was in plans | INTENTIONALLY DISABLED - Use Telegram everywhere |

| Notion | Was in queue | REMOVED - User doesn't use Notion |

| Digital Downloads | In queue | PAUSED per user request |

---

## 1. Telegram Block Streaming Mode

**File**: `/home/liam/.clawdbot/clawdbot.json`

**Change**: Update `streamMode` from `"off"` to `"block"`

```json
"channels": {
  "telegram": {
    "streamMode": "block"  // Was: "off"
  }
}
```

**Documentation Reference**: https://docs.clawd.bot/channels/telegram#streaming-drafts

**Why**: Block mode buffers larger chunks before updating draft bubble, avoiding the truncation issue you had with `partial`.

**CAVEAT**: Draft streaming only works in **private chats with topics enabled** (Telegram Bot API 9.3+). If topics aren't enabled, this setting has no effect. If `block` doesn't improve things, we can revert to `"off"`.

---

## 2. Google Calendar Enhancement

**Approach**: Enhance existing Google Calendar integration (no separate local calendar)

**Documentation Reference**: https://docs.clawd.bot/tools/skills (AgentSkills format)

**Files to create/modify**:

- CREATE: `/home/liam/clawdbot/skills/calendar-enhanced/SKILL.md` (with YAML frontmatter per AgentSkills spec)
- CREATE: `/home/liam/clawdbot/skills/calendar-enhanced/calendar.sh`
- MODIFY: `/home/liam/clawd/HEARTBEAT.md` (add calendar integration notes)
- MODIFY: `/home/liam/clawd/JOB.md` (add calendar responsibilities)

**Features (ADDITIVE)**:

- Smart event parsing from natural language
- Automatic meeting prep reminders (already in HEARTBEAT, enhance)
- Event creation via Telegram ("schedule meeting with X on Tuesday")
- Conflict detection and alerting
- PARA project linking (tag events with project context)
- Cache recent events locally for faster queries

**Implementation**:

```bash
# Core commands via gog (already working)
gog calendar events primary --from today --to "+7d"
gog calendar create "Meeting" --start "2026-01-27 10:00" --end "2026-01-27 11:00"

# Enhanced skill wraps gog with:
# - Natural language parsing
# - Caching layer
# - PARA integration
# - Telegram-friendly responses
```

---

## 3. Comprehensive Data Analytics Capabilities

**Scope**: SQL/SQLite, Python/pandas, Excel processing, visualization

**Files to create**:

- CREATE: `/home/liam/clawdbot/skills/data-analytics/SKILL.md`
- CREATE: `/home/liam/clawdbot/skills/data-analytics/query.py` (SQL/SQLite)
- CREATE: `/home/liam/clawdbot/skills/data-analytics/analyze.py` (pandas)
- CREATE: `/home/liam/clawdbot/skills/data-analytics/excel.py` (openpyxl)
- CREATE: `/home/liam/clawdbot/skills/data-analytics/visualize.py` (matplotlib/plotly)
- CREATE: `/home/liam/clawdbot/skills/data-analytics/requirements.txt`

**Capabilities**:

### SQL/SQLite

- Query any SQLite database
- Create/modify tables
- Export results to CSV/JSON
- Support for complex JOINs, CTEs, window functions

### Python/Pandas

- Load CSV, JSON, Excel files
- Data cleaning and transformation
- Statistical analysis (mean, median, std, correlations)
- Groupby, pivot tables, aggregations
- Time series analysis

### Excel Processing

- Read/write .xlsx files
- Preserve formatting and formulas
- Handle multiple sheets
- Pivot table creation
- VLOOKUP/XLOOKUP equivalent operations

### Visualization

- Bar charts, line charts, scatter plots
- Histograms, box plots
- Heatmaps, correlation matrices
- Export to PNG/SVG for Telegram sharing
- Interactive HTML charts

**Dependencies**:

```txt
pandas>=2.0.0
openpyxl>=3.1.0
matplotlib>=3.8.0
plotly>=5.18.0
sqlalchemy>=2.0.0
```

---

## 4. Natural Capture (Low-Friction, No Special Syntax)

**Philosophy**: Liam recognizes capture intent from natural language - no `/note` or `#capture` required.

**Files to create/modify**:

- CREATE: `/home/liam/clawdbot/skills/natural-capture/SKILL.md`
- CREATE: `/home/liam/clawdbot/skills/natural-capture/capture.py`
- MODIFY: `/home/liam/clawd/SOUL.md` (add capture recognition behavior)
- MODIFY: `/home/liam/clawd/EF-COACH.md` (integrate with brain dump protocol)

**Trigger phrases Liam recognizes**:

- "remind me to..."
- "don't let me forget..."
- "idea:" or "thought:"
- "note to self:"
- "capture this:"
- "brain dump:"
- "todo:" or "task:"
- Any message with clear capture intent

**Capture destinations** (based on content):

- Tasks → PARA sqlite (para.sqlite)
- Ideas → `/home/liam/clawd/memory/ideas.md`
- Notes → Daily memory log (`/home/liam/clawd/memory/YYYY-MM-DD.md`)
- Reminders → Calendar event or cron job

**Response**: Quick acknowledgment with optional follow-up

- "Got it." (minimal friction)
- "Captured. Want me to set a reminder too?"

---

## 5. Automated Testing for Overnight Builds

**Files to create**:

- CREATE: `/home/liam/clawdbot/skills/overnight-testing/SKILL.md`
- CREATE: `/home/liam/clawdbot/skills/overnight-testing/test-runner.sh`
- CREATE: `/home/liam/clawdbot/skills/overnight-testing/templates/test.sh.template`
- MODIFY: `/home/liam/clawd/overnight-workflow.md` (add testing requirements)

**Testing Protocol**:

1. Every overnight build MUST include `test.sh`
2. Tests run automatically before delivery
3. Test results included in morning delivery report
4. Failed tests block delivery with clear error report

**Test Types**:

- Syntax validation (shellcheck, pylint, tsc)
- Unit tests (if applicable)
- Integration tests (API calls, file operations)
- Manual test checklist (for UI/interactive features)

**Template** (`test.sh.template`):

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Running tests for [PROJECT_NAME]..."

# Syntax checks
echo "Checking syntax..."
# shellcheck *.sh || exit 1

# Unit tests
echo "Running unit tests..."
# pytest tests/ || exit 1

# Integration tests
echo "Running integration tests..."
# ./integration-test.sh || exit 1

echo "All tests passed!"
exit 0
```

---

## 6. Update STATUS.md and Evolution Queue

**Changes to `/home/liam/clawd/STATUS.md`**:

- Replace all "Slack" references with "Telegram"
- Update Two-Channel System table
- Mark Voice Wake as OK (Kroko.AI)
- Remove Whisper.cpp from Known Limitations

**Changes to `/home/liam/clawd/EVOLUTION-QUEUE.md`**:

- Mark GitHub monitoring as IMPLEMENTED
- Mark Whisper.cpp as CANCELLED (Kroko.AI covers this)
- Remove Notion integration (not needed)
- Mark Digital Downloads as PAUSED
- Remove Brave API item (Z.AI Search covers this)

---

## Order of Operations

1. Update Telegram streamMode to "block"
2. Update STATUS.md (Telegram everywhere, voice OK)
3. Update EVOLUTION-QUEUE.md (mark completed/cancelled items)
4. Create calendar-enhanced skill
5. Create data-analytics skill (with all dependencies)
6. Create natural-capture skill
7. Create overnight-testing skill
8. Update SOUL.md with capture recognition
9. Update EF-COACH.md with capture integration
10. Restart gateway
11. Verify all skills load correctly

---

## Success Criteria (Binary)

| Criterion | Verification |

|-----------|--------------|

| Telegram streamMode is "block" | `grep streamMode ~/.clawdbot/clawdbot.json` |

| STATUS.md says Telegram (not Slack) | `grep -c "Telegram" ~/clawd/STATUS.md` |

| calendar-enhanced skill exists | `ls ~/clawdbot/skills/calendar-enhanced/SKILL.md` |

| data-analytics skill exists | `ls ~/clawdbot/skills/data-analytics/SKILL.md` |

| natural-capture skill exists | `ls ~/clawdbot/skills/natural-capture/SKILL.md` |

| overnight-testing skill exists | `ls ~/clawdbot/skills/overnight-testing/SKILL.md` |

| Gateway running | `systemctl --user status clawdbot-gateway` |

| No existing content removed | Diff shows only additions |

---

## APEX Audit Checkpoint

After implementation:

- [ ] All new skills have SKILL.md
- [ ] Python dependencies installed
- [ ] Gateway restarts without errors
- [ ] Telegram messages not truncated
- [ ] Natural capture recognized in test message
- [ ] Calendar queries working
- [ ] No regressions in existing functionality