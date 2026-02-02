#!/usr/bin/env python3
"""
Liminal Mashup - Randomly combine concepts
The best ideas live in the intersections.
"""

import random
import sys

SEEDS = [
    "ceramics", "AI", "meditation", "street art", "coffee rituals", "sleep science",
    "journaling", "sound design", "forest ecology", "ancient mythology", "typewriters",
    "board games", "quantum physics", " fermentation", "tarot", "coding patterns",
    "sourdough", "neuroscience", "hip-hop", "origami", "bioluminescence", "stargazing",
    "calligraphy", "blockchain", "synesthesia", "lucid dreaming", "urban gardening",
    "podcasting", "minimalism", "maximalism", "haiku", "mechanical keyboards",
    "interior design", "drone photography", "binaural beats", "pottery wheels",
    "machine learning", "poetry", "long exposure", "slow food", "fast fashion critique"
]

PROMPT_TEMPLATES = [
    "What would {a} look like if it was designed by {b}?",
    "How would {a} change if it followed the principles of {b}?",
    "A ritual that combines {a} and {b}:",
    "The {a} of {b}:",
    "What if {a} had the constraints of {b}?",
    "An object that is both {a} and {b}:",
    "The intersection of {a} and {b} smells like...",
    "A business model combining {a} and {b}:",
    "Teach {a} using the techniques of {b}:",
    "A conflict between {a} and {b} becomes..."
]

def mashup():
    a, b = random.sample(SEEDS, 2)
    template = random.choice(PROMPT_TEMPLATES)
    return template.format(a=a, b=b)

if __name__ == "__main__":
    prompt = mashup()
    print(f"💥 {prompt}")
    print("\n(Press Enter for another, Ctrl-C to exit)")
    try:
        while True:
            input()
            print(f"\n💥 {mashup()}")
    except KeyboardInterrupt:
        print("\n\nStay weird.")
