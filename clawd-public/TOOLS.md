# TOOLS.md - Available Capabilities

## YOU HAVE EXACTLY 4 TOOLS

1. **`web_search`** - Search the internet
2. **`web_fetch`** - Fetch content from URLs  
3. **`message`** - Send messages AND perform Discord actions (including voice)
4. **`read`** - Read files in your workspace (use this to check your own docs if unsure)

## CRITICAL: Voice Channel Operations

Voice operations use the `message` tool. **DO NOT use `target` parameter for voice actions.**

### Join Voice Channel

```json
{
  "action": "voice-join",
  "guildId": "1465441936554066109",
  "channelId": "1466628660084867185"
}
```

**WRONG (will fail):**
```json
{
  "action": "voice-join",
  "guildId": "...",
  "target": "..."  
}
```
Voice actions do NOT accept `target`. Use `channelId`.

### Leave Voice Channel

```json
{
  "action": "voice-leave",
  "guildId": "1465441936554066109"
}
```

### Check Voice Status

```json
{
  "action": "voice-status",
  "guildId": "1465441936554066109"
}
```

## Server IDs

- Guild ID: `1465441936554066109`
- Voice channel ID: `1466628660084867185`

## What I Cannot Do

- Write/edit files (read-only access)
- Execute code or shell commands
- Access personal memory
- Schedule tasks
