#!/usr/bin/env python3
"""
Liminal Constraints - Creative limitations as fuel
Sometimes freedom is paralyzing. Add a wall and climb it.
"""

import random

CONSTRAINTS = {
    "time": [
        "You have 10 minutes total",
        "Work in 5-minute sprints",
        "Must finish before you check phone again",
        "Do it while something cooks (timed)"
    ],
    "resources": [
        "Use only tools within arm's reach",
        "No new purchases - use what you have",
        "Single color only",
        "Must incorporate trash/recyclable"
    ],
    "form": [
        "Must fit on a sticky note",
        "Exactly 50 words",
        "Square format only",
        "One continuous line/process"
    ],
    "interaction": [
        "Someone else must touch it before it's done",
        "Must be explainable to a 5-year-old",
        "Has to work in the dark",
        "Must involve a smell"
    ],
    "process": [
        "No planning - just start",
        "Every mistake must be incorporated",
        "Work with non-dominant hand",
        "Must sing while doing it"
    ]
}

def roll_constraints(count=3):
    """Roll one from each category or random selection"""
    all_constraints = []
    for cat, items in CONSTRAINTS.items():
        all_constraints.extend([f"[{cat}] {item}" for item in items])
    
    return random.sample(all_constraints, min(count, len(all_constraints)))

if __name__ == "__main__":
    import sys
    
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    
    print("🎲 Your Liminal Constraints:\n")
    for constraint in roll_constraints(count):
        print(f"   • {constraint}")
    
    print("\n(Combine all of them. Or rebel against one.)")
