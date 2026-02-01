---
name: ref
description: Search technical documentation via Ref API
---

# Ref Documentation Search

## Search Docs

```bash
source ~/.bw_session
curl -s -X POST "https://api.ref.dev/v1/search" \
  -H "Authorization: Bearer $(bw-get 'Ref API')" \
  -H "Content-Type: application/json" \
  -d '{"query": "YOUR_QUERY"}'
```

## Use Cases

- Framework documentation (React, Vue, etc.)
- API references
- Technical specifications
- Library usage examples

## Tips

- Best for finding official documentation
- Use alongside Exa for broader web search
