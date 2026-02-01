---
name: gitguardian
description: Scan code for leaked secrets using GitGuardian
---

# GitGuardian Secret Scanning

## Scan Current Directory

```bash
source ~/.bw_session
GITGUARDIAN_API_KEY=$(bw-get 'GitGuardian API') uvx ggshield secret scan path .
```

## Scan Specific File

```bash
GITGUARDIAN_API_KEY=$(bw-get 'GitGuardian API') uvx ggshield secret scan path myfile.py
```

## Scan Git Commits

```bash
GITGUARDIAN_API_KEY=$(bw-get 'GitGuardian API') uvx ggshield secret scan commit-range HEAD~5..HEAD
```

## Scan Staged Changes (Pre-commit)

```bash
GITGUARDIAN_API_KEY=$(bw-get 'GitGuardian API') uvx ggshield secret scan pre-commit
```

## Tips

- Run before committing sensitive code
- Detects 500+ secret types (API keys, tokens, passwords)
- Use `--show-secrets` to see redacted values (careful!)
