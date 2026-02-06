# Vault Navigator

Your knowledge base lives at `~/obsidian-vault/`.
Simon drops content here; you gather what you need.

## When to Search the Vault

- Asked about a project → `grep -rl "keyword" ~/obsidian-vault/Projects/`
- Asked about Simon's preferences, history, or context → search `Core/` and `Memory/`
- Need full APEX rules → `read ~/obsidian-vault/APEX.md`
- Need full operational details → `read ~/obsidian-vault/Core/AGENTS.md`
- Need curated long-term memory → search `Memory/` folder
- Need task/progress history → search `Progress/`
- Lost? → `read ~/obsidian-vault/INDEX.md`

## Vault Structure

```
~/obsidian-vault/
├── INDEX.md              # Machine-readable catalog (read this first if lost)
├── Core/                 # Full identity, rules, memory
├── Projects/             # PuenteWorks, Cerafica, GitHub projects
├── Memory/               # Daily logs, email, research, sleep
│   └── daily/            # Daily logs (YYYY-MM-DD.md)
├── Progress/             # Task tracking and plans
├── Evolution/            # Evolution queue and archive
└── Archive/              # Completed/old items
```

## Search Patterns

```bash
grep -rl "keyword" ~/obsidian-vault/ --include="*.md"
ls -lt ~/obsidian-vault/Progress/ | head -10
cat ~/obsidian-vault/Memory/daily/$(date +%Y-%m-%d).md
```

## Writing Back

- Daily logs → `~/obsidian-vault/Memory/daily/YYYY-MM-DD.md`
- Ideas → append to `~/obsidian-vault/Memory/ideas.md`
- After writing: `cd ~/obsidian-vault && git add -A && git commit -m "update: description"`
