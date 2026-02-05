# Vault Navigator

Your knowledge base lives at `~/obsidian-vault/` (also accessible via `~/clawd/obsidian-vault/`).
This is the single source of truth. Simon drops content here; you gather what you need.

## When to Search the Vault

- Asked about a project → `grep -rl "keyword" ~/obsidian-vault/Projects/`
- Asked about Simon's preferences, history, or context → search `Core/` and `Memory/`
- Need full APEX rules → `read ~/obsidian-vault/APEX.md`
- Need full operational details → `read ~/obsidian-vault/Core/AGENTS.md`
- Need heartbeat schedule details → `read ~/obsidian-vault/Core/HEARTBEAT.md`
- Need curated long-term memory → search `Memory/` folder
- Need sleep/health data → `read ~/obsidian-vault/Memory/sleep/`
- Need email context → search `Memory/email/`
- Need task/progress history → search `Progress/`
- Evolution queue items → `read ~/obsidian-vault/Evolution/EVOLUTION-QUEUE.md`

## Vault Structure

```
~/obsidian-vault/
├── index.md              # Navigation hub (read this first if lost)
├── INDEX.md              # Machine-readable catalog (search targets)
├── APEX.md               # Full APEX v7.4 rules
├── Core/                 # Full versions of workspace stubs
│   ├── AGENTS.md         # Complete workspace rules
│   ├── SOUL.md           # Full operational core
│   ├── IDENTITY.md       # Full identity
│   ├── USER.md           # Full user profile
│   ├── HEARTBEAT.md      # Full heartbeat protocol
│   ├── MEMORY.md         # Full curated memory
│   ├── Simon-Context.md  # Deep Simon profile
│   └── Neurodivergent-Support-Index.md
├── Projects/             # Active and planned work
│   ├── PuenteWorks/      # AI consulting launch
│   ├── Cerafica-Index.md # Ceramics business
│   └── GitHub/           # GitHub project tracking
├── Memory/               # Historical data
│   ├── daily/            # Daily logs (YYYY-MM-DD.md)
│   ├── email/            # Email triage and follow-ups
│   ├── sleep/            # Sleep diary and CBTI protocol
│   └── research/         # Research notes
├── Progress/             # Task tracking and plans
├── Evolution/            # Evolution queue and archive
├── Config/               # STATUS.md, TOOLS.md
├── Archive/              # Old/completed items
└── Inbox/                # Unprocessed items
```

## Search Patterns

```bash
# Find files about a topic
grep -rl "keyword" ~/obsidian-vault/ --include="*.md"

# List recent progress files
ls -lt ~/obsidian-vault/Progress/ | head -10

# Find today's daily log
cat ~/obsidian-vault/Memory/daily/$(date +%Y-%m-%d).md

# Search email context
grep -rl "sender-name" ~/obsidian-vault/Memory/email/

# Find project status
grep -rl "PuenteWorks\|Cerafica" ~/obsidian-vault/Projects/
```

## Writing Back to the Vault

You should write to the vault too -- it's bidirectional.

- **Daily logs**: Write `~/obsidian-vault/Memory/daily/YYYY-MM-DD.md` with session summaries
- **Progress updates**: Update files in `~/obsidian-vault/Progress/`
- **Ideas**: Append to `~/obsidian-vault/Memory/ideas.md`
- **New projects**: Create in `~/obsidian-vault/Projects/`

After writing, commit: `cd ~/obsidian-vault && git add -A && git commit -m "update: description"`

## INDEX.md Maintenance

During heartbeats, verify `~/obsidian-vault/INDEX.md` is current. If new files were added, update the index.
