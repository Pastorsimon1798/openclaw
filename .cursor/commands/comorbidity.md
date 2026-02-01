# Comorbidity Analysis Protocol (APEX v7.3)

Invoke this protocol after completing a task or when explicitly requested via `/comorbidity`.

## 1. Gap Analysis
Scan for related improvements the user likely wants but didn't ask for.

```
[ ] Documentation: README? Docs nav? API reference? Changelog?
[ ] Testing: Unit tests? E2E tests? Edge cases?
[ ] Configuration: Schema? Migration path? Defaults?
[ ] Related Code: Similar patterns? Shared utilities? CLI flags?
[ ] UX: Error messages? Progress feedback? Rollback path?
```

## 2. Blast Radius Check
Identify the true scope of the changes.

```
[ ] What's the scope? (one file? one channel? system-wide?)
[ ] Who else calls this code path?
[ ] Does this affect other agents/consumers?
```

## 3. Output Format
Present findings in a concise table.

### Gaps Identified
| Gap | Impact | Recommendation |
|-----|--------|----------------|
| [Gap] | [Impact] | [Recommendation] |

### Potential Regressions
| Item | Risk | Verification |
|------|------|--------------|
| [Item] | [Risk] | [Verification] |

### Immediate Action Items
Would you like me to address these?
1. [Item 1] (~X min)
2. [Item 2] (~Y min)

---
*Activation: /comorbidity, "check for gaps", task complete*
