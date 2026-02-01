---
name: bitwarden
description: Securely retrieve API keys and secrets from Bitwarden vault
---

# Bitwarden Secret Management

## Setup (run once per session)

```bash
source ~/.bw_session
```

## Retrieve a Secret

```bash
bw-get "Secret Name"
```

## Available Secrets

| Name | Description |
|------|-------------|
| Exa API | AI web/code search |
| Ref API | Documentation search |
| GitGuardian API | Secret scanning |
| Groq API Key | TTS and inference |
| Gemini API Key | Google AI |
| Brave API Key | Web search |
| Ollama Cloud API Key | Ollama inference |
| ZAI API Key | ZAI service |
| Clawdbot Gateway Token | Gateway auth |
| Slack App Token | Slack integration |
| Slack Bot Token | Slack bot |
| Dashboard Password | Dashboard access |
| GOG Keyring Password | Google OAuth |

## Examples

```bash
# Get Exa API key for web search
EXA_KEY=$(bw-get "Exa API")
curl -H "x-api-key: $EXA_KEY" https://api.exa.ai/search ...

# Get Groq API key
GROQ_KEY=$(bw-get "Groq API Key")
```

## Security Notes

- Never log or echo full API keys
- Session expires after some time; re-source ~/.bw_session if needed
- Keys are encrypted at rest in Bitwarden
