#!/usr/bin/env python3
"""
CIS v2.0 - Batch Insight Processor
Processes multiple articles and extracts insights using llm-task
"""

import json
import subprocess
import os
import re
import sqlite3
from pathlib import Path
from datetime import datetime
import time

BASE_DIR = Path("/home/liam/clawd/content-intelligence/sources")
PARA_DB = "/home/liam/clawd/memory/para.sqlite"
TMP_DIR = Path("/tmp/cis_batch")

def get_pending_articles():
    """Get list of articles needing insight extraction"""
    pending = []
    for source_dir in BASE_DIR.iterdir():
        if not source_dir.is_dir():
            continue
        
        archive_dir = source_dir / "archive"
        insights_dir = source_dir / "insights"
        
        if not archive_dir.exists():
            continue
        
        for archive_file in archive_dir.glob("*.json"):
            insight_file = insights_dir / archive_file.name
            if insight_file.exists():
                continue
            
            try:
                with open(archive_file, 'r', encoding='utf-8') as f:
                    article = json.load(f)
                
                pending.append({
                    'source': source_dir.name,
                    'slug': archive_file.stem,
                    'archive_file': archive_file,
                    'insight_file': insight_file,
                    'title': article.get('title', 'Untitled'),
                    'url': article.get('url', ''),
                    'content': article.get('content_text', '')[:4000]  # Limit content
                })
            except Exception as e:
                print(f"Error reading {archive_file}: {e}")
    
    return pending

def call_llm_for_insights(prompt_text):
    """Call llm-task to extract insights"""
    try:
        # Write prompt to temp file
        prompt_file = TMP_DIR / f"prompt_{os.urandom(4).hex()}.txt"
        output_file = TMP_DIR / f"output_{os.urandom(4).hex()}.json"
        
        with open(prompt_file, 'w', encoding='utf-8') as f:
            f.write(prompt_text)
        
        # Call llm-task
        result = subprocess.run(
            ['clawdbot', 'llm-task', '--prompt-file', str(prompt_file), 
             '--output', str(output_file), '--model', 'zai/glm-4.7'],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0 and output_file.exists():
            with open(output_file, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            print(f"  LLM error: {result.stderr[:100]}")
            return None
            
    except Exception as e:
        print(f"  LLM call failed: {e}")
        return None
    finally:
        # Cleanup
        try:
            if prompt_file.exists():
                prompt_file.unlink()
        except:
            pass

def parse_insights_from_response(response_text):
    """Extract insights JSON from LLM response"""
    if not response_text:
        return None
    
    try:
        # Find JSON array
        match = re.search(r'\[[\s\S]*?\]', response_text)
        if match:
            insights = json.loads(match.group())
            if isinstance(insights, list) and len(insights) > 0:
                return insights
        
        # Try full parse
        data = json.loads(response_text)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and 'insights' in data:
            return data['insights']
    except json.JSONDecodeError:
        pass
    
    return None

def create_insight_prompt(article):
    """Create prompt for insight extraction"""
    return f"""Extract 3-5 HIGH-QUALITY, ACTIONABLE insights from this article.

SOURCE: {article['source']}
TITLE: {article['title']}
URL: {article['url']}

CONTENT:
{article['content']}

EXTRACTION RULES:
1. SYNTHESIZE insights - don't extract random sentence fragments
2. Each insight MUST be actionable (what to DO with it)
3. Detect explicit frameworks/methods/mental models mentioned
4. Categorize each insight into PARA:
   - projects: ceramics, stickers, natural-capture
   - areas: ef-coaching, ai-tools, business-strategy
   - resources: frameworks, templates, best-practices

OUTPUT ONLY VALID JSON ARRAY:
[{{"insight": "Clear insight statement", "action": "Specific action to take", "framework": "Framework name or null", "para_category": "projects|areas|resources", "para_target": "specific subcategory", "rationale": "Why this matters", "confidence": "high|medium|low"}}]

IMPORTANT: Output ONLY the JSON array, no other text."""

def save_insights(article, insights):
    """Save insights to file"""
    insights_data = {
        "source_name": article['source'],
        "source_title": article['title'],
        "source_url": article['url'],
        "slug": article['slug'],
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
    
    article['insight_file'].parent.mkdir(parents=True, exist_ok=True)
    with open(article['insight_file'], 'w', encoding='utf-8') as f:
        json.dump(insights_data, f, indent=2, ensure_ascii=False)

def route_insight_to_para(source, title, url, insight):
    """Route single insight to PARA database"""
    try:
        conn = sqlite3.connect(PARA_DB)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO cis_routing 
            (source, source_title, source_url, insight_type, insight_content, 
             para_category, para_target, rationale, routed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            source,
            title,
            url,
            'insight',
            insight.get('insight', ''),
            insight.get('para_category', 'resources'),
            insight.get('para_target', insight.get('action', '')),
            insight.get('rationale', ''),
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"    DB error: {e}")
        return False

def process_article(article):
    """Process a single article"""
    print(f"  Processing: {article['source']}/{article['slug'][:50]}...")
    
    # Create prompt
    prompt = create_insight_prompt(article)
    
    # Call LLM
    response = call_llm_for_insights(prompt)
    
    if not response:
        print(f"    ✗ LLM failed")
        return False
    
    # Parse insights
    insights = parse_insights_from_response(response)
    
    if not insights:
        print(f"    ✗ No valid insights found in response")
        # Try to save what we got for debugging
        insights = [{"insight": "Processing error - manual review needed", "action": "Review article", "para_category": "resources", "para_target": "best-practices", "confidence": "low", "error": "parse_failed"}]
    
    # Validate and clean insights
    valid_insights = []
    for i in insights:
        if isinstance(i, dict) and 'insight' in i:
            # Ensure required fields
            if 'para_category' not in i:
                i['para_category'] = 'resources'
            if 'para_target' not in i:
                i['para_target'] = 'best-practices'
            if 'action' not in i:
                i['action'] = 'Review for application'
            valid_insights.append(i)
    
    if not valid_insights:
        print(f"    ✗ No valid insights after validation")
        return False
    
    # Save insights
    save_insights(article, valid_insights)
    print(f"    ✓ Saved {len(valid_insights)} insights")
    
    # Route to PARA
    routed = 0
    for insight in valid_insights:
        if route_insight_to_para(article['source'], article['title'], article['url'], insight):
            routed += 1
    
    print(f"    ✓ Routed {routed} to PARA")
    return True

def main():
    """Main processing loop"""
    print("="*70)
    print("CIS v2.0 - Batch Insight Extractor")
    print("="*70)
    
    # Setup
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Get pending articles
    pending = get_pending_articles()
    print(f"\nFound {len(pending)} articles needing insight extraction")
    
    if not pending:
        print("No articles to process.")
        return
    
    # Process articles
    processed = 0
    failed = 0
    
    # Limit batch size for testing
    batch_size = min(len(pending), 30)  # Process up to 30 for now
    batch = pending[:batch_size]
    
    print(f"\nProcessing batch of {len(batch)} articles...")
    print("-"*70)
    
    for article in batch:
        if process_article(article):
            processed += 1
        else:
            failed += 1
        time.sleep(0.3)  # Rate limiting
    
    print("\n" + "="*70)
    print("BATCH COMPLETE")
    print("="*70)
    print(f"Processed: {processed}")
    print(f"Failed: {failed}")
    print(f"Remaining: {len(pending) - processed - failed}")

if __name__ == "__main__":
    main()
