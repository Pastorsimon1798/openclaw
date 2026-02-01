---
name: exa
description: AI-powered web and code search via Exa API
---

# Exa Search

## Web Search

```bash
source ~/.bw_session
curl -s -X POST "https://api.exa.ai/search" \
  -H "x-api-key: $(bw-get 'Exa API')" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR_QUERY", "numResults": 5, "type": "auto"}'
```

## Code Search

```bash
curl -s -X POST "https://api.exa.ai/search" \
  -H "x-api-key: $(bw-get 'Exa API')" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR_QUERY", "numResults": 5, "category": "code"}'
```

## With Content Extraction

```bash
curl -s -X POST "https://api.exa.ai/search" \
  -H "x-api-key: $(bw-get 'Exa API')" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR_QUERY", "numResults": 3, "contents": {"text": true}}'
```

## Tips

- Use specific queries for better results
- `category: "code"` focuses on GitHub, Stack Overflow, technical blogs
- `contents.text: true` returns full page text (useful for summarization)
