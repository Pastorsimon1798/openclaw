---
name: lint
description: Check code quality with oxlint. Run before completing any task involving code changes.
metadata: { "openclaw": { "emoji": "🔍", "requires": { "bins": ["pnpm"] } } }
---

# Code Linting

Use oxlint to check code quality. **Run this on any files you create or modify.**

## Quick Check (specific files)

```bash
pnpm lint -- path/to/file.js path/to/other.ts
```

## Full Project Lint

```bash
pnpm lint
```

## Common Error Fixes

### curly - Missing braces

```javascript
// BAD:
if (x) doThing();

// GOOD:
if (x) {
  doThing();
}
```

### no-floating-promises - Unhandled async

```javascript
// BAD:
fetchData();

// GOOD (fire and forget):
void fetchData();

// GOOD (need result):
await fetchData();
```

### no-unused-vars - Unused variable

Remove the variable or use it. Prefix with `_` if intentionally unused:

```javascript
const _unusedButIntentional = getValue();
```

## Workflow

1. **Before finishing any task** that touched code:
   ```bash
   pnpm lint -- <files-you-changed>
   ```

2. **If errors exist**, fix them before moving on

3. **Check pending tasks** in `~/clawd/PENDING-TASKS.md`

## Your Code Quality Responsibility

Files you create = your responsibility to lint.

If you see lint errors in files you created, fix them proactively. Don't wait to be asked.
