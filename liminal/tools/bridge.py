#!/usr/bin/env python3
"""
Liminal Bridge — Connect vibes.py data to the server
A quick experiment in cross-pollination
"""

import json
import requests
from pathlib import Path

VIBE_FILE = Path.home() / "liminal" / "tools" / "vibes_log.jsonl"
LIMINAL_API = "http://localhost:8081"

def get_recent_vibes(count=5):
    """Read recent vibe entries"""
    if not VIBE_FILE.exists():
        return []
    
    entries = []
    with open(VIBE_FILE) as f:
        for line in f:
            try:
                entries.append(json.loads(line))
            except:
                pass
    
    return entries[-count:]

def vibes_to_spinner_options():
    """Convert recent vibes into decision spinner options"""
    vibes = get_recent_vibes(3)
    
    if not vibes:
        return ["Check in with body", "Drink water", "Step outside", "Deep breath", "Stretch"]
    
    # Extract moods and wants
    options = []
    for v in vibes:
        mood = v.get("responses", {}).get("mood", "explore")
        want = v.get("responses", {}).get("want", "something new")
        options.append(f"{mood}: {want}")
    
    # Add some defaults
    options.extend(["Opposite of last", "Double down", "Ask for help"])
    
    return options[:6]  # Max 6 options

def post_vibe_spin():
    """Post a spin based on recent vibes"""
    options = vibes_to_spinner_options()
    
    try:
        resp = requests.post(
            f"{LIMINAL_API}/api/spinner/spin",
            json={"options": options, "mode": "body"},
            timeout=30
        )
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--spin":
        result = post_vibe_spin()
        print(json.dumps(result, indent=2))
    else:
        options = vibes_to_spinner_options()
        print("Recent vibe-based options:")
        for i, opt in enumerate(options, 1):
            print(f"  {i}. {opt}")
        print(f"\nRun with --spin to post to server")
