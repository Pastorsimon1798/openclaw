#!/usr/bin/env python3
"""
Liminal Spinner - Decision toy with personality
Never overthink. Spin and go.
"""

import random
import sys
import argparse

SPINNERS = {
    "work": ["Deep work", "Admin tasks", "Creative play", "Learning", "Rest", "Connect with someone"],
    "energy": ["High focus", "Low energy okay", "Body double", "Change location", "Caffeine", "Movement"],
    "creative": ["Constraint-based", "Mashup two ideas", "Opposite approach", "Tiny version", "Wild exaggeration", "Steal from nature"],
    "yesno": ["Hell yes", "Not now", "Modify it", "Ask someone", "Sleep on it", "Flip a coin"],
    "mood": ["Curious", "Playful", "Slightly unhinged", "Gentle", "Fierce", "Mysterious"]
}

def spin(category="work", count=1):
    options = SPINNERS.get(category, SPINNERS["work"])
    picks = random.sample(options, min(count, len(options)))
    return picks

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Spin for decisions")
    parser.add_argument("--category", "-c", default="work", choices=list(SPINNERS.keys()),
                       help="Type of decision (work, energy, creative, yesno, mood)")
    parser.add_argument("--count", "-n", type=int, default=1,
                       help="Number of options to draw")
    args = parser.parse_args()
    
    picks = spin(args.category, args.count)
    for pick in picks:
        print(f"🎲 {pick}")
