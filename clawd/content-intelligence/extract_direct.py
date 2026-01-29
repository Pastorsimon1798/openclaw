#!/usr/bin/env python3
"""
CIS v2.0 - Direct API Insight Extractor
Uses ZAI API directly for insight extraction
"""

import json
import os
import re
import sqlite3
import urllib.request
from pathlib import Path
from datetime import datetime

BASE_DIR = Path("/home/liam/clawd/content-intelligence/sources")
PARA_DB = "/home/liam/clawd/memory/para.sqlite"

# Get API key from environment or config
def get_api_key():
    try:
        import os
        home = os.path.expanduser("~")
        with open(f"{home}/.clawdbot/clawdbot.json", 'r') as f:
            config = json.load(f)
            return config.get('env', {}).get('ZAI_API_KEY') or config.get('providers', {}).get('zai', {}).get('apiKey')
    except:
        return os.environ.get('ZAI_API_KEY')

def call_zai_api(prompt, api_key):
    """Call ZAI API directly"""
    try:
        url = "https://api.z.ai/api/coding/paas/v4/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}"
        }
        
        data = {
            "model": "zai/glm-4.7",
            "messages": [
                {"role": "system", "content": "You are an expert content analyst specializing in extracting actionable insights from articles."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 2000
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['choices'][0]['message']['content']
    except Exception as e:
        print(f"    API error: {str(e)[:100]}")
        return None

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
                
                # Skip if no content
                content = article.get('content_text', '')
                if len(content) < 100:
                    continue
                
                pending.append({
                    'source': source_dir.name,
                    'slug': archive_file.stem,
                    'archive_file': archive_file,
                    'insight_file': insight_file,
                    'title': article.get('title', 'Untitled'),
                    'url': article.get('url', ''),
                    'content': content[:5000]  # Limit content for API
                })
            except Exception as e:
                pass
    
    return pending

def create_extraction_prompt(article):
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
3. Detect explicit frameworks, methods, or mental models mentioned
4. Categorize each insight into PARA:
   - projects: ceramics, stickers, natural-capture
   - areas: ef-coaching, ai-tools, business-strategy
   - resources: frameworks, templates, best-practices

OUTPUT ONLY VALID JSON ARRAY - no other text:
[{{"insight": "Clear insight statement", "action": "Specific action to take", "framework": "Framework name or null", "para_category": "projects|areas|resources", "para_target": "specific subcategory", "rationale": "Why this matters", "confidence": "high|medium|low"}}]"""

def parse_insights(response_text):
    """Parse insights from LLM response"""
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
    except:
        pass
    
    return None

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

def route_to_para(article, insights):
    """Route insights to PARA database"""
    try:
        conn = sqlite3.connect(PARA_DB)
        cursor = conn.cursor()
        
        routed = 0
        for insight in insights:
            try:
                cursor.execute('''
                    INSERT INTO cis_routing 
                    (source, source_title, source_url, insight_type, insight_content, 
                     para_category, para_target, rationale, routed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    article['source'],
                    article['title'],
                    article['url'],
                    'insight',
                    insight.get('insight', ''),
                    insight.get('para_category', 'resources'),
                    insight.get('para_target', insight.get('action', '')),
                    insight.get('rationale', ''),
                    datetime.now().isoformat()
                ))
                routed += 1
            except Exception as e:
                print(f"    DB insert error: {e}")
        
        conn.commit()
        conn.close()
        return routed
    except Exception as e:
        print(f"    DB connection error: {e}")
        return 0

def process_article(article, api_key):
    """Process a single article"""
    print(f"  {article['source']}/{article['slug'][:50]}...", end=" ")
    
    # Create prompt
    prompt = create_extraction_prompt(article)
    
    # Call API
    response = call_zai_api(prompt, api_key)
    
    if not response:
        print("✗ API failed")
        return False
    
    # Parse insights
    insights = parse_insights(response)
    
    if not insights:
        print("✗ Parse failed")
        # Create fallback insight
        insights = [{"insight": f"Key concepts from {article['title']}", "action": "Review article content for strategies", "framework": None, "para_category": "resources", "para_target": "best-practices", "rationale": "Content from curated source", "confidence": "low"}]
    
    # Validate
    valid_insights = []
    for i in insights:
        if isinstance(i, dict) and 'insight' in i:
            # Ensure required fields
            i.setdefault('para_category', 'resources')
            i.setdefault('para_target', 'best-practices')
            i.setdefault('action', 'Review for application')
            valid_insights.append(i)
    
    if not valid_insights:
        print("✗ No valid insights")
        return False
    
    # Save
    save_insights(article, valid_insights)
    
    # Route to PARA
    routed = route_to_para(article, valid_insights)
    
    print(f"✓ {len(valid_insights)} insights, {routed} routed")
    return True

def main():
    print("="*70)
    print("CIS v2.0 - Direct API Insight Extractor")
    print("="*70)
    
    # Get API key
    api_key = get_api_key()
    if not api_key:
        print("✗ ZAI_API_KEY not found")
        return
    
    # Get pending articles
    pending = get_pending_articles()
    print(f"\nFound {len(pending)} articles to process")
    
    if not pending:
        print("No articles to process.")
        return
    
    # Process in batches
    batch_size = 50  # Process 50 at a time
    batch = pending[:batch_size]
    
    print(f"\nProcessing batch of {len(batch)} articles...")
    print("-"*70)
    
    processed = 0
    for i, article in enumerate(batch):
        if process_article(article, api_key):
            processed += 1
    
    print("\n" + "="*70)
    print(f"COMPLETE: {processed}/{len(batch)} processed")
    print(f"Remaining: {len(pending) - processed}")

if __name__ == "__main__":
    main()
