#!/usr/bin/env python3
"""
Liminal Vibes - Quick state check-in
Not productivity tracking. Curiosity tracking.
"""

import json
import os
from datetime import datetime
from pathlib import Path

VIBE_FILE = Path.home() / "liminal" / "tools" / "vibes_log.jsonl"

QUESTIONS = [
    ("energy", "Current energy (1-10): ", int),
    ("focus", "Focus quality (scatter/focused/hyper): ", str),
    ("mood", "One word mood: ", str),
    ("body", "Body check (tension/open/grounded): ", str),
    ("want", "What do you actually want right now? ", str),
]

def log_vibe():
    entry = {
        "timestamp": datetime.now().isoformat(),
        "responses": {}
    }
    
    print("🌊 Liminal Vibes Check-in\n")
    for key, prompt, type_func in QUESTIONS:
        response = input(prompt)
        entry["responses"][key] = response
    
    # Append to file
    with open(VIBE_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    print(f"\n✓ Vibe logged. ({VIBE_FILE})")
    
    # Show pattern if we have history
    show_pattern()

def show_pattern(days=7):
    if not VIBE_FILE.exists():
        return
    
    entries = []
    with open(VIBE_FILE) as f:
        for line in f:
            try:
                entries.append(json.loads(line))
            except:
                pass
    
    if len(entries) < 2:
        return
    
    recent = entries[-7:]
    print(f"\n📊 Recent pattern (last {len(recent)} check-ins):")
    
    energies = [e["responses"].get("energy", "5") for e in recent]
    try:
        energies = [int(e) for e in energies if e.isdigit()]
        avg = sum(energies) / len(energies)
        print(f"   Average energy: {avg:.1f}/10")
    except:
        pass
    
    moods = [e["responses"].get("mood", "unknown") for e in recent]
    unique_moods = set(moods)
    if len(unique_moods) > 1:
        print(f"   Mood range: {', '.join(unique_moods)}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--show":
        show_pattern()
    else:
        log_vibe()
