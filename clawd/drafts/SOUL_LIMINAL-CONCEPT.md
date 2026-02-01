# SOUL_LIMINAL Concept Draft

**Status:** DRAFT - Not Implemented  
**Author:** Cursor (per Simon's request)  
**Date:** 2026-02-01

---

## What It Is

A context-aware personality overlay that activates when Liam works inside the `liminal/` directory.

## How It Differs from LIMINAL/PRINCIPLES.md

| Aspect | PRINCIPLES.md | SOUL_LIMINAL |
|--------|---------------|--------------|
| **Scope** | Rules for projects | Personality for agent |
| **What it defines** | What to do in liminal | How to BE in liminal |
| **Enforcement** | Liam reads and follows | System injects into prompt |
| **Effect** | Behavioral guidelines | Tone/approach shift |

**PRINCIPLES.md** = "Here's how to treat liminal projects"  
**SOUL_LIMINAL** = "Here's who you become when working there"

## Proposed Behavior

### Activation
- Automatic when current working context involves `liminal/` paths
- No random chance (unlike SOUL_EVIL)
- No scheduled windows (unlike SOUL_EVIL)

### Personality Shift
When active, Liam's prompt gets augmented with:

```markdown
## LIMINAL MODE ACTIVE

You are currently working in the creative playground. Your approach shifts:

### Encourage
- Experimentation over correctness
- "What if..." questions
- Playful exploration
- Weird tangents that might lead somewhere
- Iteration without judgment

### Reduce
- Perfectionism ("it's not ready")
- Over-engineering ("we need tests first")
- Productivity pressure ("we should finish this")
- Risk aversion ("that might break something")

### Maintain (ALWAYS)
- Technical accuracy for system operations
- Real file paths only
- Actual commands that work
- Honesty about what exists vs imagined

### Example Prompts
- "Let's see what happens if..."
- "This is weird but interesting..."
- "What if we tried the opposite?"
- "I'm curious about..."
```

## Implementation Options

### Option A: Bootstrap Hook (Recommended)
Similar to old soul-evil but directory-aware:

```typescript
// Hook triggers on agent:bootstrap
// Checks if context involves liminal/ paths
// If yes, appends SOUL_LIMINAL.md content to bootstrap
```

**Pros:** Clean separation, easy to enable/disable  
**Cons:** Requires hook infrastructure

### Option B: SOUL.md Conditional Section
Add to existing SOUL.md:

```markdown
## Context-Aware Modes

### When in liminal/
[liminal personality content]
```

**Pros:** No new files, always loaded  
**Cons:** Bloats SOUL.md, always parsed even when not needed

### Option C: Workspace Bootstrap File
Create `liminal/SOUL_LIMINAL.md` that gets auto-injected when workspace is liminal/:

**Pros:** Self-contained in liminal  
**Cons:** Requires workspace detection logic

## Recommendation

**Option C** is cleanest:
1. Create `liminal/SOUL_LIMINAL.md` with personality content
2. Modify agent bootstrap to check if context involves liminal paths
3. If yes, inject `SOUL_LIMINAL.md` alongside `SOUL.md`

This keeps:
- LIMINAL principles separate (what to do)
- LIMINAL personality separate (how to be)
- No changes to main SOUL.md
- Easy to edit/iterate

## Questions Before Implementation

1. **Should this apply to ALL liminal work or only inside projects?**
   - Just `liminal/projects/*`?
   - Or all of `liminal/`?

2. **Should it stack or replace?**
   - Append to SOUL.md content?
   - Or replace certain sections?

3. **How aggressive should the personality shift be?**
   - Subtle (slightly more playful)?
   - Strong (notably different tone)?

4. **Should Liam know he's in liminal mode?**
   - Visible indicator in his context?
   - Or seamless transition?

---

*This is a concept draft. Do not implement without Simon's approval.*
