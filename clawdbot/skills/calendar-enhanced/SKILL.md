---
name: calendar-enhanced
description: Enhanced Google Calendar integration with natural language parsing, PARA project linking, and smart reminders via Telegram.
metadata: {"clawdbot":{"requires":{"bins":["gog"]}}}
---

# Calendar Enhanced Skill

Enhance Google Calendar interactions with natural language understanding and PARA integration.

## Prerequisites

- `gog` CLI installed and authenticated (`gog auth list --check`)
- Google Calendar API access for `clawdbot@puenteworks.com`

## Commands

### View Events

```bash
# Today's events
gog calendar events primary --from today --to tomorrow --account clawdbot@puenteworks.com

# This week
gog calendar events primary --from today --to "+7d" --account clawdbot@puenteworks.com

# Specific date range
gog calendar events primary --from "2026-01-27" --to "2026-01-30" --account clawdbot@puenteworks.com
```

### Create Events

```bash
# Basic event
gog calendar create "Meeting Title" --start "2026-01-27 10:00" --end "2026-01-27 11:00" --account clawdbot@puenteworks.com

# With description
gog calendar create "Project Review" --start "2026-01-27 14:00" --end "2026-01-27 15:00" --description "Review Q1 goals" --account clawdbot@puenteworks.com
```

## Natural Language Parsing

When Simon says phrases like:
- "Schedule a meeting with John on Tuesday at 2pm"
- "Add dentist appointment tomorrow morning"
- "Block 3 hours for deep work on Friday"
- "Remind me about the Edison interview next week"

Parse the intent and construct the appropriate `gog calendar create` command.

**Parsing rules:**
- "tomorrow" = next day from current date
- "morning" = 9:00 AM (default 1 hour)
- "afternoon" = 2:00 PM (default 1 hour)  
- "evening" = 6:00 PM (default 1 hour)
- "next [day]" = the upcoming occurrence of that weekday
- Duration defaults to 1 hour unless specified

## PARA Project Linking

When creating events related to projects, add `[Project: name]` to the description:
- "Meeting about Cerafica inventory" → description includes `[Project: Cerafica]`
- "Edison interview prep" → description includes `[Project: Edison Job]`

This enables filtering and linking to PARA projects later.

## Smart Reminders (via HEARTBEAT)

Liam checks calendar during heartbeat and provides:
- **24h alert**: "Meeting in 24h: [Title]. Anything I should prep?"
- **2h reminder**: "Meeting starting soon: [Title]"
- **Conflict detection**: Alert if overlapping events found

## Integration with Telegram

All calendar interactions happen via Telegram. Liam:
1. Parses natural language intent
2. Executes `gog` command
3. Confirms with formatted response

**Example responses:**
- "Added 'Dentist' for tomorrow at 9am."
- "You have 3 events today: [list]"
- "Heads up — you've got back-to-back meetings at 2pm and 3pm."
