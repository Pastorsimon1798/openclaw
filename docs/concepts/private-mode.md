---
title: Private Mode (100% Local)
description: Run OpenClaw entirely locally without any external network calls
---

# Private Mode (100% Local)

Private Mode enables OpenClaw to run **entirely locally** without making any external network calls. This is ideal for:

- **Privacy-sensitive work** (legal, medical, personal documents)
- **Offline environments** (air-gapped networks, limited connectivity)
- **Cost-conscious usage** (no API bills)
- **Learning and experimentation** (no cloud dependencies)

## Quick Start

```bash
# Interactive setup (recommended)
openclaw setup local

# Or manually enable
openclaw config set privacy.strictMode true
```

## How It Works

When `privacy.strictMode` is enabled:

| Feature | Cloud Mode | Private Mode |
|---------|------------|--------------|
| LLM Inference | OpenAI, Anthropic, etc. | Ollama (local) |
| Embeddings | OpenAI, Gemini | Ollama (nomic-embed-text) |
| Speech-to-Text | Whisper API, Deepgram | Sherpa-ONNX (local) |
| Text-to-Speech | ElevenLabs, OpenAI | Sherpa-ONNX (local) |
| Web Search | Brave, Perplexity | Disabled |
| Web Fetch | HTTP requests | Disabled |
| Update Checks | npm registry | Disabled |

## Requirements

### Hardware

| RAM | Max Concurrent Agents | Recommended Models |
|-----|----------------------|-------------------|
| 8GB (minimum) | 1 | Llama 3.1 8B Q4 |
| 16GB | 2 | Llama 3.1 8B Q5, Vision |
| 32GB | 4 | Llama 3.1 13B, Qwen 14B |
| 64GB | 8 | Llama 3.1 70B (quantized) |

### Software

- **Ollama** - Local LLM runtime ([install](https://ollama.com))
- **Node.js 22+** - Required for OpenClaw

## Setup Command

The `openclaw setup local` command guides you through:

1. **Hardware Check** - Verifies RAM and system requirements
2. **Ollama Check** - Ensures Ollama is installed and running
3. **Model Downloads** - Pulls required Ollama models:
   - `llama3.1:8b-instruct-q5_K_M` (primary LLM)
   - `nomic-embed-text` (embeddings)
4. **STT/TTS Models** - Downloads Sherpa-ONNX models:
   - Whisper Large V3 Turbo (speech recognition)
   - Kokoro English (text-to-speech)
5. **Config Creation** - Writes strictMode configuration

### Options

```bash
# Skip hardware requirements check
openclaw setup local --skip-hardware-check

# Skip Ollama model downloads
openclaw setup local --skip-ollama-models

# Skip Sherpa-ONNX downloads
openclaw setup local --skip-sherpa-models

# Non-interactive mode (auto-accept all prompts)
openclaw setup local --non-interactive
```

## Configuration

Private Mode is controlled by the `privacy.strictMode` setting:

```json
{
  "privacy": {
    "strictMode": true,
    "resourceLimits": {
      "maxConcurrentLLM": 2,
      "maxConcurrentVision": 1,
      "maxConcurrentSTT": 2,
      "maxConcurrentTTS": 2
    }
  }
}
```

### Resource Limits

To prevent out-of-memory issues on constrained hardware, you can set resource limits:

| Setting | Default | Description |
|---------|---------|-------------|
| `maxConcurrentLLM` | 2 | Max simultaneous LLM inference calls |
| `maxConcurrentVision` | 1 | Max simultaneous vision model calls |
| `maxConcurrentSTT` | 2 | Max simultaneous speech-to-text operations |
| `maxConcurrentTTS` | 2 | Max simultaneous text-to-speech operations |

## Trade-offs

### What You Gain

- **100% Privacy** - No data leaves your machine
- **Offline Operation** - Works without internet
- **Cost Savings** - No API fees
- **Full Control** - Customize models and behavior

### What You Lose

- **Slower Responses** - 3-5x slower than cloud models
- **Reduced Capability** - Local models are less capable than GPT-4/Claude
- **Limited Context** - 8K-32K tokens vs 128K+ for cloud
- **Hardware Requirements** - Need dedicated GPU/RAM
- **No Web Tools** - Cannot search or fetch web content

## Performance Tips

1. **Keep Ollama Warm** - Set `keep_alive: 5m` to avoid cold-start delays
2. **Use Quantized Models** - Q5_K_M offers best quality/speed balance
3. **Limit Concurrency** - Don't run multiple agents simultaneously on 16GB
4. **Close Other Apps** - Free RAM for model inference
5. **Use SSD** - Model loading is I/O bound
6. **Native Over Docker** - ~20% memory savings running Ollama natively

## Reverting to Cloud Mode

To disable Private Mode and return to cloud providers:

```bash
openclaw config set privacy.strictMode false
```

Or manually edit `~/.openclaw/openclaw.json` and set `privacy.strictMode` to `false`.

## Troubleshooting

### Ollama Not Running

```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/version
```

### Model Not Found

```bash
# Pull required models manually
ollama pull llama3.1:8b-instruct-q5_K_M
ollama pull nomic-embed-text
```

### STT/TTS Not Working

Check that Sherpa-ONNX models are installed:

```bash
ls ~/.openclaw/models/sherpa-stt/
ls ~/.openclaw/models/sherpa-tts/
```

Re-run setup to download missing models:

```bash
openclaw setup local --skip-ollama-models
```

### Out of Memory

Reduce concurrent limits in config:

```json
{
  "privacy": {
    "resourceLimits": {
      "maxConcurrentLLM": 1,
      "maxConcurrentVision": 1
    }
  }
}
```

## Related

- [Ollama Provider](/providers/ollama) - Detailed Ollama configuration
- [Local Models](/gateway/local-models) - Using local language models
- [Configuration Reference](/reference/configuration) - Full config options
