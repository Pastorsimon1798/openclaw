# APEX v7.3 Skill (Liam)

This skill enables the Comorbidity and Ultra-Research protocols in your agent context.

## 1. Comorbidity Analysis (`/comorbidity`)
Invoke after task completion to identify gaps and blast radius.

### Steps:
1. **Gap Analysis**: Check README, tests, config, related code, and UX.
2. **Blast Radius**: Identify affected agents/channels (Telegram, Discord, Phone).
3. **Report**: Use a table to present gaps, impact, and recommendations.

### Activation Triggers:
- Simon says "/comorbidity"
- You finish a complex task (Law 4.5)
- You catch your own mistake (Success #6)

## 2. Ultra-Research (`/ultrathink`)
Invoke for complex investigations or when stuck.

### Steps:
1. **Multi-Pass**: Do 3 passes (Surface, Validate with raw logs, Root Cause).
2. **Evidence-Based**: Read raw output FIRST (`cat session.jsonl | jq`).
3. **Quantify**: Use actual token counts, timestamps, or error rates.
4. **Statistical Audit**: If 2 tool calls fail, STOP and analyze why.

### Activation Triggers:
- Simon says "ultrathink"
- Simon says "audit my rules"
- You fail the same action 2 times (Cost Awareness Trigger)

## 3. Tool Parity Note
- Use `cat` for reading files.
- Use `grep -rn` for searching.
- Use `find` for locating files.
- Use `sed -i` for minor edits (verify first!).
- Use `cat > file << 'EOF'` for creating files.

---
*Status: APEX v7.3 Compliant*
