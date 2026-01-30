# Frustration Log - Liam's Observations

**Purpose:** Track patterns that cause Simon frustration so we can improve together.
**Owner:** Liam
**Created:** 2026-01-30
**Related:** `~/clawd/diagnostics/FRUSTRATION-PATTERNS.md` (Cursor's version - DO NOT EDIT)

---

## How to Use This File

**When to log:**
- Simon uses frustration signals (see list below)
- Simon has to repeat himself
- Simon says something "was working" before
- A task takes multiple attempts
- Simon corrects you

**How to log:**
```bash
exec: cat >> ~/clawd/FRUSTRATION-LOG.md << 'EOF'

### [DATE] [Short Description]
**Signal:** [What Simon said]
**Context:** [What were you trying to do]
**Root Cause:** [Why it happened]
**Pattern Match:** [Does this match an existing pattern?]
EOF
```

**Frustration Signals to Watch:**
- "dig deeper"
- "waste of time" / "wasting time"
- "prove it"
- "let me guess"
- "why did you" / "why are you"
- "it was working"
- "I already told you" / "I said"
- "spell it out"
- "exhausted" / "tired of this"
- "disappointed"
- Sighing, short responses after long ones
- Repeated questions you should have answered

---

## Known Patterns (Reference)

These patterns were identified by Cursor. Watch for them:

| # | Pattern | What It Looks Like |
|---|---------|-------------------|
| 1 | Incomplete tracing | Finding one issue, claiming "fixed", missing downstream issues |
| 2 | Incomplete propagation | Updating one file, forgetting others with same data |
| 3 | Deferred instead of doing | Creating TODOs when Simon wanted action |
| 4 | Scattered debugging | Trying random things without systematic approach |
| 5 | Wrong info as fact | Claiming capabilities without verifying |
| 6 | Breaking working systems | Editing something that was fine |
| 7 | Ghost bugs | Reporting issues that don't exist |
| 8 | Asking what you should know | Questions answered in your files |
| 9 | Making Simon repeat | Not reading conversation history |

---

## Log Entries

*Add new entries below. Most recent at top.*

---

### [2026-01-30] Template Entry (Delete This)
**Signal:** [Example: "I already told you that"]
**Context:** [Example: Asked about project status without reading EVOLUTION-QUEUE.md]
**Root Cause:** [Example: Didn't read file before responding]
**Pattern Match:** [Example: #8 - Asking what you should know]
**Self-Correction:** [Example: Always read EVOLUTION-QUEUE.md before status reports]

---

## Weekly Summary Template

*Copy this each week to track progress:*

```markdown
## Week of [DATE]

**Total incidents:** X
**Most common pattern:** #X
**New patterns discovered:** [Any?]
**Self-corrections applied:** [What did you change?]
**Trust level change:** [Better/Same/Worse]
```

---

## Self-Correction Log

*When you catch yourself about to trigger a pattern, log it here:*

| Date | Pattern Avoided | What You Did Instead |
|------|-----------------|---------------------|
| | | |

---

## Notes

- This file is YOURS to update freely (not protected)
- Be honest - the goal is improvement, not looking good
- If you're unsure whether something was frustrating, log it anyway
- Review this file during daily self-assessment
- Share insights with Cursor via EVOLUTION-QUEUE.md if you discover new patterns

---

*"Every frustration is data. Every pattern is an opportunity to improve."*
