# Content Intelligence System (CIS) v2.0

**Status:** Operational  
**Last Updated:** 2026-01-28  
**Total Articles:** 130  
**Total Insights:** 544  
**Sources:** 6 active RSS feeds

---

## System Overview

CIS v2.0 is an RSS-based content harvesting and insight extraction system that:
1. Harvests articles from RSS feeds
2. Archives full content with metadata
3. Extracts 3-5 actionable insights per article
4. Routes insights to PARA categories

---

## Source Registry

| Source | RSS Feed | Articles | Insights | Priority |
|--------|----------|----------|----------|----------|
| Nate Jones | https://natesnewsletter.substack.com/feed | 21 | 91 | High |
| Slow AI | https://theslowai.substack.com/feed | 20 | 97 | High |
| Aakash Gupta | https://www.news.aakashg.com/feed | 20 | 90 | Medium |
| NEW ECONOMIES | https://www.neweconomies.co/feed | 19 | 95 | Medium |
| Rhys Morgan | https://rhysmorgan.substack.com/feed | 30 | 78 | High |
| Sabrina Ramonov | https://www.sabrina.dev/feed | 20 | 91 | High |

**Total:** 130 articles, 544 insights

---

## Directory Structure

```
content-intelligence/
├── config/
│   └── sources.json          # Source registry with metadata
├── sources/
│   ├── nate-jones/
│   │   ├── archive/          # Article JSON files
│   │   ├── insights/         # Extracted insights
│   │   └── metadata/
│   │       └── source.json   # Source profile
│   ├── slow-ai/
│   ├── aakash-gupta/
│   ├── new-economies/
│   ├── rhys-morgan/
│   └── sabrina-ramonov/
├── cis_harvester.py          # RSS harvester
├── extract_pattern.py        # Pattern-based insight extraction
├── extract_direct.py         # LLM-based insight extraction (requires API)
└── CIS_README.md             # This file
```

---

## Archive Format

Each article saved as JSON:
```json
{
  "url": "...",
  "slug": "...",
  "title": "...",
  "subtitle": "...",
  "author": "...",
  "published": "...",
  "content_html": "<full HTML content...>",
  "content_text": "Plain text content...",
  "harvested_at": "..."
}
```

---

## Insight Format

Each article's insights saved as JSON:
```json
{
  "source_name": "...",
  "source_title": "...",
  "source_url": "...",
  "slug": "...",
  "insights": [
    {
      "insight": "Clear statement...",
      "action": "What to DO...",
      "framework": "Method name or null",
      "para_category": "projects|areas|resources",
      "para_target": "specific subcategory",
      "rationale": "Why this matters",
      "confidence": "high|medium|low"
    }
  ],
  "insight_count": 5,
  "frameworks_detected": [...],
  "para_distribution": {...},
  "extracted_at": "..."
}
```

---

## PARA Integration

Insights are routed to PARA categories:

### Projects
- ceramics
- stickers  
- natural-capture

### Areas
- ef-coaching
- ai-tools
- business-strategy

### Resources
- frameworks
- templates
- best-practices

**Current Distribution:**
- Areas: 449 insights (71%)
- Resources: 143 insights (23%)
- Projects: 38 insights (6%)

---

## Usage

### Harvest New Articles
```bash
cd ~/clawd/content-intelligence
python3 cis_harvester.py
```

### Extract Insights (Pattern-based)
```bash
python3 extract_pattern.py
```

### Extract Insights (LLM-based - higher quality)
```bash
python3 extract_direct.py
```

### Update PARA Routing
Insights are automatically routed to PARA database during extraction.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `cis_harvester.py` | Fetches RSS feeds, archives articles |
| `extract_pattern.py` | Pattern-based insight extraction (no LLM needed) |
| `extract_direct.py` | LLM-based insight extraction (requires ZAI API) |
| `process_insights.py` | Batch LLM processing via clawdbot llm-task |

---

## Quality Gates

Current extraction quality:
- Pattern-based: Medium quality (automated, fast)
- LLM-based: High quality (requires API access)

**Recommendation:** Run pattern-based for bulk processing, then re-run select articles with LLM for higher quality insights.

---

## Future Enhancements

1. **Automated scheduling:** Set up cron job for daily/weekly harvests
2. **Deduplication:** Skip already-archived articles
3. **Quality scoring:** Rate insight quality and filter low-confidence
4. **LLM batch processing:** Queue for overnight processing
5. **Search indexing:** Add full-text search across archives

---

## Database Schema

PARA database (`~/clawd/memory/para.sqlite`) table `cis_routing`:
```sql
CREATE TABLE cis_routing (
    id INTEGER PRIMARY KEY,
    source TEXT,
    source_title TEXT,
    source_url TEXT,
    insight_type TEXT,
    insight_content TEXT,
    para_category TEXT,
    para_target TEXT,
    rationale TEXT,
    routed_at TEXT
);
```

---

*CIS v2.0 - Built 2026-01-28*
