#!/usr/bin/env python3
"""
CIS v2.0 - Insight Extractor
Extracts 3-5 quality, actionable insights from archived articles
Uses LLM for synthesis (not random snippet extraction)
"""

import json
import os
import re
import sqlite3
from pathlib import Path
from datetime import datetime

BASE_DIR = Path("/home/liam/clawd/content-intelligence")
SOURCES_DIR = BASE_DIR / "sources"
PARA_DB = "/home/liam/clawd/memory/para.sqlite"

# PARA Categories mapping
PARA_CATEGORIES = {
    "projects": ["ceramics", "stickers", "natural-capture"],
    "areas": ["ef-coaching", "ai-tools", "business-strategy"],
    "resources": ["frameworks", "templates", "best-practices"]
}

def generate_insight_prompt(article_title, article_content, source_name):
    """Generate prompt for LLM insight extraction"""
    # Limit content length for processing
    content_preview = article_content[:8000] if article_content else ""
    
    prompt = f"""You are an expert content analyst. Read this article and extract 3-5 HIGH-QUALITY, ACTIONABLE insights.

ARTICLE SOURCE: {source_name}
ARTICLE TITLE: {article_title}

ARTICLE CONTENT:
{content_preview}

---

EXTRACTION RULES:
1. SYNTHESIZE insights - do NOT extract random sentence fragments
2. Each insight must be actionable (something the reader can DO or APPLY)
3. Identify explicit frameworks, methods, or mental models mentioned
4. Categorize each insight into PARA system:
   - Projects: ceramics, stickers, natural-capture
   - Areas: ef-coaching, ai-tools, business-strategy  
   - Resources: frameworks, templates, best-practices

OUTPUT FORMAT - JSON array:
[
  {{
    "insight": "Clear, synthesized insight statement (1-2 sentences)",
    "action": "Specific action item - what to DO with this insight",
    "framework": "Name of framework/method if mentioned, else null",
    "para_category": "projects|areas|resources",
    "para_target": "specific subcategory (ceramics/stickers/natural-capture/ef-coaching/ai-tools/business-strategy/frameworks/templates/best-practices)",
    "rationale": "Why this insight matters and how it connects to the category",
    "confidence": "high|medium|low"
  }}
]

REQUIREMENTS:
- Maximum 5 insights, minimum 3
- Each must be genuinely actionable
- No generic platitudes
- Explicit framework detection where present
- Quality over quantity"""

    return prompt

def parse_llm_insights_response(response_text):
    """Parse LLM response to extract insights JSON"""
    try:
        # Try to find JSON array in response
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            insights = json.loads(json_match.group())
            return insights
        
        # Try parsing the whole response as JSON
        insights = json.loads(response_text)
        if isinstance(insights, list):
            return insights
        elif isinstance(insights, dict) and 'insights' in insights:
            return insights['insights']
    except json.JSONDecodeError:
        pass
    
    return []

def create_fallback_insights(article_title, article_content, source_name):
    """Create basic fallback insights if LLM fails"""
    return [
        {
            "insight": f"Article '{article_title}' explores key concepts from {source_name}",
            "action": "Review article content for relevant strategies",
            "framework": None,
            "para_category": "resources",
            "para_target": "best-practices",
            "rationale": "Content from curated source warrants review",
            "confidence": "low"
        }
    ]

def save_insights_file(source_name, slug, insights, article_data):
    """Save insights to JSON file"""
    insights_dir = SOURCES_DIR / source_name / "insights"
    insights_dir.mkdir(parents=True, exist_ok=True)
    
    insights_data = {
        "source_name": source_name,
        "source_title": article_data.get('title', ''),
        "source_url": article_data.get('url', ''),
        "slug": slug,
        "insights": insights,
        "insight_count": len(insights),
        "frameworks_detected": list(set([i.get('framework') for i in insights if i.get('framework')])),
        "para_distribution": {
            "projects": len([i for i in insights if i.get('para_category') == 'projects']),
            "areas": len([i for i in insights if i.get('para_category') == 'areas']),
            "resources": len([i for i in insights if i.get('para_category') == 'resources'])
        },
        "extracted_at": datetime.now().isoformat()
    }
    
    filepath = insights_dir / f"{slug}.json"
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(insights_data, f, indent=2, ensure_ascii=False)
    
    return filepath

def route_insights_to_para(source_key, article_title, article_url, insights):
    """Route insights to PARA database"""
    try:
        conn = sqlite3.connect(PARA_DB)
        cursor = conn.cursor()
        
        routed_count = 0
        for insight in insights:
            try:
                cursor.execute('''
                    INSERT INTO cis_routing 
                    (source, source_title, source_url, insight_type, insight_content, 
                     para_category, para_target, rationale, routed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    source_key,
                    article_title,
                    article_url,
                    'insight',
                    insight.get('insight', ''),
                    insight.get('para_category', 'resources'),
                    insight.get('para_target', '') or insight.get('action', ''),
                    insight.get('rationale', ''),
                    datetime.now().isoformat()
                ))
                routed_count += 1
            except Exception as e:
                print(f"    Error routing single insight: {e}")
        
        conn.commit()
        conn.close()
        return routed_count
    except Exception as e:
        print(f"  ❌ Error routing to PARA: {e}")
        return 0

def get_all_archive_files():
    """Get all archive files that need insight extraction"""
    archive_files = []
    
    for source_dir in SOURCES_DIR.iterdir():
        if not source_dir.is_dir():
            continue
        
        archive_dir = source_dir / "archive"
        insights_dir = source_dir / "insights"
        
        if not archive_dir.exists():
            continue
        
        for archive_file in archive_dir.glob("*.json"):
            # Check if insights already exist
            insight_file = insights_dir / archive_file.name
            if insight_file.exists():
                continue
            
            archive_files.append({
                'source': source_dir.name,
                'archive_path': archive_file,
                'insight_path': insight_file,
                'slug': archive_file.stem
            })
    
    return archive_files

def generate_insights_batch_script(archive_files, output_script):
    """Generate a shell script to process insights via llm-task"""
    script_lines = ["#!/bin/bash", "# Auto-generated insight extraction script", ""]
    
    for item in archive_files:
        source = item['source']
        slug = item['slug']
        archive_path = item['archive_path']
        
        # Read article data to build prompt
        try:
            with open(archive_path, 'r', encoding='utf-8') as f:
                article = json.load(f)
        except:
            continue
        
        title = article.get('title', '').replace("'", "'\\''")
        content = article.get('content_text', '')[:6000].replace("'", "'\\''")
        
        # Create a unique prompt file
        prompt_file = f"/tmp/cis_prompt_{source}_{slug}.txt"
        
        prompt_content = f"""Read this article and extract 3-5 HIGH-QUALITY, ACTIONABLE insights.

ARTICLE SOURCE: {source}
ARTICLE TITLE: {title}

ARTICLE CONTENT:
{content}

EXTRACTION RULES:
1. SYNTHESIZE insights - do NOT extract random sentence fragments
2. Each insight must be actionable
3. Identify explicit frameworks, methods, or mental models
4. Categorize each insight:
   - Projects: ceramics, stickers, natural-capture
   - Areas: ef-coaching, ai-tools, business-strategy  
   - Resources: frameworks, templates, best-practices

OUTPUT JSON array:
[{{"insight": "...", "action": "...", "framework": "...", "para_category": "...", "para_target": "...", "rationale": "...", "confidence": "high|medium|low"}}]

Max 5 insights, minimum 3. Quality over quantity."""

        # Write prompt to temp file
        with open(prompt_file, 'w', encoding='utf-8') as pf:
            pf.write(prompt_content)
        
        output_file = f"/tmp/cis_insights_{source}_{slug}.json"
        
        script_lines.append(f"echo 'Processing: {source}/{slug}'")
        script_lines.append(f"clawdbot llm-task --prompt-file '{prompt_file}' --output '{output_file}' --model zai/glm-4.7 2>/dev/null || echo '{{\"error\": \"llm-task failed\"}}' > '{output_file}'")
        script_lines.append("")
    
    with open(output_script, 'w') as f:
        f.write('\n'.join(script_lines))
    
    os.chmod(output_script, 0o755)
    return output_script

def main():
    """Main extraction function - generates batch script"""
    print("\n" + "="*70)
    print("CIS v2.0 - Insight Extractor")
    print("="*70)
    
    # Find all articles needing insights
    archive_files = get_all_archive_files()
    print(f"Found {len(archive_files)} articles needing insight extraction")
    
    if not archive_files:
        print("No new articles to process.")
        return
    
    # Generate batch processing script
    script_path = "/tmp/cis_extract_insights.sh"
    generate_insights_batch_script(archive_files, script_path)
    
    print(f"\nGenerated batch script: {script_path}")
    print(f"Articles to process: {len(archive_files)}")
    print("\nRun the following to extract insights:")
    print(f"  bash {script_path}")
    
    return archive_files

if __name__ == "__main__":
    main()
