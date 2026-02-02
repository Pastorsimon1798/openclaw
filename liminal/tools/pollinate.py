#!/usr/bin/env python3
"""
Liminal Pollinate - Cross-breed your projects
Ideas from one project feed another. Everything connects.
"""

import os
import random
from pathlib import Path

def find_projects():
    """Scan liminal/projects for active experiments"""
    projects_dir = Path.home() / "liminal" / "projects"
    if not projects_dir.exists():
        return []
    
    projects = []
    for item in projects_dir.iterdir():
        if item.is_dir() and not item.name.startswith("."):
            projects.append(item.name)
    return projects

def get_seeds_from_project(project_path):
    """Extract seed ideas from a project folder"""
    seeds = []
    
    # Look for common seed files
    for filename in ["seeds.txt", "ideas.md", "concepts.txt", "README.md", "notes.txt"]:
        file_path = project_path / filename
        if file_path.exists():
            content = file_path.read_text()
            lines = [l.strip() for l in content.split('\n') if l.strip() and not l.startswith('#')]
            seeds.extend(lines[:10])  # First 10 non-empty lines
    
    return seeds if seeds else [f"The essence of {project_path.name}"]

CONNECTION_TEMPLATES = [
    "Take the core idea from {a} and apply it to {b}.",
    "What would {a} look like if it had the constraints of {b}?",
    "Combine the medium of {a} with the theme of {b}.",
    "The tools from {a} used to create {b}:",
    "A collaboration between {a} and {b}:",
    "Teach {b} using the method of {a}.",
    "If {a} and {b} had a baby, it would be...",
    "The opposite of {a} applied to {b}:",
    "Speed-run {a} using only ideas from {b}.",
]

def pollinate():
    projects = find_projects()
    
    if len(projects) < 2:
        print("🌱 Only one project found. Plant more seeds in liminal/projects/")
        return
    
    a, b = random.sample(projects, 2)
    template = random.choice(CONNECTION_TEMPLATES)
    
    print(f"🐝 Cross-pollination:\n")
    print(f"   {template.format(a=a, b=b)}\n")
    
    # Try to get specific seeds
    a_path = Path.home() / "liminal" / "projects" / a
    b_path = Path.home() / "liminal" / "projects" / b
    
    a_seeds = get_seeds_from_project(a_path)
    b_seeds = get_seeds_from_project(b_path)
    
    if a_seeds:
        print(f"   From {a}: \"{random.choice(a_seeds)}\"")
    if b_seeds:
        print(f"   From {b}: \"{random.choice(b_seeds)}\"")
    
    print("\n(What emerges from this collision?)")

if __name__ == "__main__":
    pollinate()
