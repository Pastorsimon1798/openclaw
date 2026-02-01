# Ultra-Research Protocol (APEX v7.3)

Invoke this protocol for complex investigations, recurring bugs, or via `/ultrathink`.

## 1. Multi-Pass Investigation
Do not assume the first analysis is complete.

```
[ ] Pass 1: Surface issues.
[ ] Pass 2: Validation pass with fresh data (logs, session files).
[ ] Pass 3: Root cause analysis (Pattern mapping).
```

## 2. Evidence-Based Diagnosis
Quantify the problem before proposing solutions.

```
[ ] Read raw output FIRST (session files, logs).
[ ] Quantify with data (token counts, timestamps, error rates).
[ ] Verify claims with primary sources (code, --help).
```

## 3. Statistical Audit (If failing)
If 2 attempts failed:
1. STOP.
2. Analyze WHY the previous attempts failed.
3. Form a new hypothesis based on evidence.
4. Document the new path to success.

## 4. Output Format
1. **Hypothesis**: What you think is wrong.
2. **Evidence**: Data backing the hypothesis.
3. **Plan**: Multi-step path to success.
4. **Verification**: How we'll know it's fixed.

---

## Test Invocation

Type `/ultrathink` when investigating complex bugs or after 2 failed attempts.

**Triggers:**
- "Why does X keep failing?"
- "audit my rules"
- "deep research on [topic]"

**Example output:**
```
## Ultra-Research: [Issue Name]

1. **Hypothesis**: The config path is incorrect after migration.
2. **Evidence**: 
   - Error log shows `/old/path` not found
   - Config file still references deprecated location
3. **Plan**:
   - [ ] Verify current config path
   - [ ] Update references in 3 files
   - [ ] Test with fresh session
4. **Verification**: Run `doctor --check` after fix
```

---
*Activation: /ultrathink, "deep research", "audit my rules"*
