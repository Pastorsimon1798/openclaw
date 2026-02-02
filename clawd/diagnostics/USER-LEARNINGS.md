# User Learnings - Things Simon Could Do Better

*No judgment. Just patterns. Each has a "how" that's easy to do.*

---

## Session: 2026-02-01 (Gateway Debug Spiral)

### 1. Say the error out loud

**What happened:** I could see the error but didn't paste it.

**Why it matters:** Cursor was guessing. Guessing = wrong path = wasted context.

**Next time:**
```
"I see this error: [paste exact error]"
```

**That's it.** Copy. Paste. Done.

---

### 2. Stop Cursor earlier

**What happened:** Cursor ran 50+ commands. I let it.

**Why it matters:** Each command burns tokens. Spiral gets worse.

**Next time - say one of these:**
- "Stop. What's your hypothesis?"
- "Stop. You've tried that twice."
- "Stop. Read APEX 7.3 Law 7."

**The word "stop" works.** Use it.

---

### 3. Call out the rule violation immediately

**What happened:** Cursor violated plan mode (made edits). I didn't say "you're in plan mode" until later.

**Why it matters:** Early correction = less waste.

**Next time:**
```
"You're in plan mode. No edits. Research only."
```

**Keep it short.** Cursor responds to direct commands.

---

### 4. Give the key insight earlier

**What happened:** I said "anthropic was never there" late in the session. This was the key clue.

**Why it matters:** That one sentence could have saved 40 commands.

**Next time - lead with what you KNOW:**
```
"The config has always been ollama-cloud. 
Anthropic appearing is a bug, not a config issue."
```

---

### 5. Use the escalation phrase

**What happened:** I got frustrated and used strong words.

**Why it matters:** Strong words work, but there's a faster way.

**Escalation phrases that trigger APEX protocols:**
- `/ultrathink` - Forces deep analysis
- "Stop. Statistical audit." - Forces "why did I fail?" analysis
- "APEX violation: [law number]" - Direct rule citation

**These work better than anger** because they're in the system prompt.

---

---

## Escalation System

### How It Works

**Notice something → Say the phrase → Cursor responds**

You don't need to think. Just pattern-match and copy-paste.

---

### 🟢 Level 1: Gentle Redirect

**You notice:** Cursor going slightly off track

**Phrases:**
```
"Focus on [X] first."
"Not that. [Actual thing]."
"Simpler."
```

---

### 🟡 Level 2: Firm Correction

**You notice:** Wrong approach, wasted effort starting

**Phrases:**
```
"Stop. Wrong path."
"Stop. You're guessing."
"Stop. Read the error: [paste error]"
"Plan mode. No edits."
```

---

### 🟠 Level 3: Protocol Trigger

**You notice:** Multiple failed attempts, spinning

**Phrases:**
```
/ultrathink
"Stop. Statistical audit. Why did you fail?"
"APEX violation: Law [number]"
"Stop after 2 failures. Form new hypothesis."
```

**What these do:**
- `/ultrathink` → Forces deep analysis mode
- "Statistical audit" → Makes Cursor analyze its own failures
- "APEX violation" → Cites specific rule (Cursor knows the rules)

---

### 🔴 Level 4: Hard Stop

**You notice:** Massive context burn, repeated violations, frustration

**Phrases:**
```
"Stop. Full stop. Do not continue."
"Log this to FRUSTRATION-PATTERNS.md"
"/clear and start over"
"This conversation is over."
```

---

### APEX Laws Cheat Sheet

| Law | Name | When to cite |
|-----|------|--------------|
| 1 | Test Before/After | Broke something that worked |
| 2 | Verify First | Making changes without checking state |
| 3 | Trace to Success | Fixed one thing, didn't check downstream |
| 4 | Complete the Job | Missed files that need same change |
| 5 | Respect User | Making you repeat yourself |
| 6 | Stay in Lane | Scope creep, doing unrequested work |
| 7 | Cost Awareness | Burning tokens on retries |

**Usage:** "APEX violation: Law 7. You've retried 5 times."

---

### Quick Decision Tree

```
Is Cursor guessing?
  YES → "Stop. The error is: [paste]"
  
Has it tried this before?
  YES → "Stop. That's attempt [N]. New approach."
  
Are you in plan mode?
  YES → "Plan mode. Research only. No edits."
  
Are you frustrated?
  YES → Pick one:
        - /ultrathink
        - "APEX violation: Law [N]"
        - "Stop. Log this. /clear"
```

---

### The Magic Words

These words trigger specific behaviors:

| Word | Effect |
|------|--------|
| "Stop" | Interrupts current action |
| "Focus" | Narrows scope |
| "Simpler" | Reduces complexity |
| "/ultrathink" | Deep analysis mode |
| "/comorbidity" | Gap analysis mode |
| "APEX" | Rule-following mode |
| "Log this" | Creates documentation |
| "/clear" | Fresh start |

---

## Quick Reference Card

| Situation | What to say |
|-----------|-------------|
| Cursor guessing | "The error is: [paste]" |
| Same approach twice | "Stop. That's attempt 2." |
| Plan mode violated | "Plan mode. No edits." |
| You know something | Lead with it. Don't wait. |
| Getting frustrated | `/ultrathink` or "APEX violation" |
| Massive waste | "Stop. Log this. /clear" |

---

*This file is for Simon. No judgment. Just learnings.*
*Updated: 2026-02-01*
