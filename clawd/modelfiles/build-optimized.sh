#!/bin/bash
# Build optimized Ollama models for Liam Private
# Run this from Windows PowerShell with: ollama create <name> -f <Modelfile>

# Note: These commands must be run on Windows where Ollama is installed
# Copy these Modelfiles to Windows and run:

echo "=== Building Optimized Models ==="
echo ""
echo "Run these commands in Windows PowerShell:"
echo ""
echo "cd to the modelfiles directory, then:"
echo ""
echo "ollama create liam-primary -f mistral-nemo-optimized.Modelfile"
echo "ollama create liam-quality -f gpt-oss-optimized.Modelfile"  
echo "ollama create liam-deep -f glm-optimized.Modelfile"
echo "ollama create liam-fast -f lfm-chat-optimized.Modelfile"
echo ""
echo "After creation, update openclaw.json to use these model names:"
echo "- ollama/liam-primary (instead of HammerAI/mistral-nemo-uncensored)"
echo "- ollama/liam-quality (instead of gpt-oss:20b)"
echo "- ollama/liam-deep (instead of glm-4.7-flash)"
echo "- ollama/liam-fast (instead of lfm2.5-instruct)"
