# CIS Disambiguation

## Two Different Systems (Both "CIS")

To avoid confusion, use full names in all documentation:

### 1. Content Intelligence System
- **Location**: `~/clawd/content-intelligence/`
- **Purpose**: Newsletter/article aggregation and insight extraction
- **Short**: "Content Intel" or "Newsletter CIS"
- **Dashboard**: `/cis.html` → labeled "Content Intelligence"
- **What it does**:
  - Harvests RSS feeds from newsletters
  - Extracts insights to PARA database
  - Compiles Tue/Fri digests
  - 12 sources, 630+ insights

### 2. Ceramics Intelligence System  
- **Location**: `~/clawd/skills/ceramics-intelligence/`
- **Purpose**: Ceramics sticker business analytics
- **Short**: "Ceramics Intel" or "Sticker CIS"
- **Dashboard**: `/ceramics-intelligence.html` → labeled "Ceramics"
- **What it does**:
  - Tracks sticker inventory
  - Sales analytics
  - Platform integration (Etsy, etc.)

## Naming Convention Going Forward

| Context | Use This |
|---------|----------|
| Spoken/written | "Content Intelligence" or "Ceramics Intelligence" |
| File paths | `content-intelligence/` or `ceramics-intelligence/` |
| Database tables | `content_intel_*` or `ceramics_intel_*` |
| Quick reference | "Newsletter system" or "Sticker system" |

## Never Use Just "CIS"
Always disambiguate. If you see "CIS" without qualifier in old files, infer from context or update.

---
*Documented: 2026-02-01*
