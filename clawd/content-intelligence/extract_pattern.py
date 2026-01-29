#!/usr/bin/env python3
"""
CIS v2.0 - Pattern-Based Insight Extractor
Generates quality insights using pattern matching when LLM unavailable
"""

import json
import re
import sqlite3
from pathlib import Path
from datetime import datetime

BASE_DIR = Path("/home/liam/clawd/content-intelligence/sources")
PARA_DB = "/home/liam/clawd/memory/para.sqlite"

# Action patterns for extracting actionable insights
ACTION_PATTERNS = {
    'frameworks': [
        (r'(?:framework|model|method|system|approach)\s+(?:called|named|known as)\s+["\']?([^"\']+)["\']?', 'framework'),
        (r'(?:the|my)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\s+(?:method|framework|system|approach)', 'framework'),
        (r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+(?:Principle|Rule|Law|Method|Framework))', 'framework'),
    ],
    'actions': [
        (r'(?:try|start|use|implement|adopt|apply|build|create)\s+([^,.;]{10,100})', 'action'),
        (r'(?:step|phase|stage)\s+(\d+)[:\s]+([^,.;]{10,100})', 'step'),
        (r'(?:first|next|then|finally)[,:\s]+([^,.;]{10,100})', 'action'),
        (r'(?:here[\'s|s])?\s+(?:how\s+to|what\s+you\s+should|what\s+to)[,:]?\s+([^,.;]{10,150})', 'action'),
    ],
    'principles': [
        (r'(?:key\s+)?principle[:\s]+([^,.;]{10,200})', 'principle'),
        (r'(?:remember|note)[:\s]+([^,.;]{10,200})', 'note'),
        (r'(?:the\s+key\s+is|what\s+matters)[,:]?\s+([^,.;]{10,200})', 'principle'),
    ]
}

# PARA category keywords
PARA_KEYWORDS = {
    'projects': {
        'ceramics': ['ceramic', 'clay', 'pottery', 'glaze', 'kiln', 'firing', 'handmade'],
        'stickers': ['sticker', 'design', 'illustration', 'vector', 'print'],
        'natural-capture': ['photo', 'camera', 'nature', 'capture', 'image', 'wildlife']
    },
    'areas': {
        'ef-coaching': ['coach', 'coaching', 'executive', 'leadership', 'growth', 'development'],
        'ai-tools': ['ai', 'artificial intelligence', 'llm', 'chatgpt', 'claude', 'automation', 'ml', 'machine learning'],
        'business-strategy': ['strategy', 'business', 'startup', 'founder', 'growth', 'revenue', 'market']
    },
    'resources': {
        'frameworks': ['framework', 'model', 'mental model', 'system', 'methodology'],
        'templates': ['template', 'prompt', 'checklist', 'worksheet', 'toolkit'],
        'best-practices': ['best practice', 'recommendation', 'advice', 'tip', 'lesson learned']
    }
}

def detect_para_category(title, content, insight_text):
    """Detect PARA category based on content keywords"""
    text = f"{title} {content} {insight_text}".lower()
    
    scores = {'projects': 0, 'areas': 0, 'resources': 0}
    targets = {}
    
    for category, subcategories in PARA_KEYWORDS.items():
        for subcat, keywords in subcategories.items():
            for keyword in keywords:
                if keyword in text:
                    scores[category] += 1
                    if category not in targets:
                        targets[category] = {}
                    if subcat not in targets[category]:
                        targets[category][subcat] = 0
                    targets[category][subcat] += 1
    
    # Find best category
    best_category = max(scores, key=scores.get)
    if scores[best_category] == 0:
        return 'resources', 'best-practices'
    
    # Find best target within category
    if best_category in targets and targets[best_category]:
        best_target = max(targets[best_category], key=targets[best_category].get)
        return best_category, best_target
    
    return best_category, 'best-practices'

def extract_frameworks(content):
    """Extract framework names from content"""
    frameworks = []
    for pattern, ptype in ACTION_PATTERNS['frameworks']:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                match = match[1] if len(match) > 1 else match[0]
            if match and len(match) > 3:
                frameworks.append(match.strip())
    return frameworks[:3]  # Limit to 3

def extract_actionable_insights(content, title):
    """Extract actionable insights from content"""
    insights = []
    
    # Look for numbered lists
    numbered = re.findall(r'(?:\d+[.\)]\s+|<li[^>]*>)([^<\n]{20,200})', content, re.IGNORECASE)
    for item in numbered[:5]:
        clean = re.sub(r'<[^>]+>', '', item).strip()
        if clean and len(clean) > 20:
            insights.append(clean)
    
    # Look for action patterns
    for pattern, itype in ACTION_PATTERNS['actions']:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for match in matches:
            if isinstance(match, tuple):
                match = ' '.join(m for m in match if m)
            clean = re.sub(r'<[^>]+>', '', match).strip()
            if clean and len(clean) > 20 and clean not in insights:
                insights.append(clean)
                if len(insights) >= 5:
                    break
        if len(insights) >= 5:
            break
    
    # Look for principle patterns
    if len(insights) < 3:
        for pattern, itype in ACTION_PATTERNS['principles']:
            matches = re.findall(pattern, content, re.IGNORECASE)
            for match in matches:
                clean = re.sub(r'<[^>]+>', '', match).strip()
                if clean and len(clean) > 20 and clean not in insights:
                    insights.append(clean)
                    if len(insights) >= 5:
                        break
            if len(insights) >= 5:
                break
    
    # Look for key sentences with action verbs
    sentences = re.split(r'[.!?]+', content)
    action_verbs = ['use', 'try', 'implement', 'adopt', 'build', 'create', 'start', 'apply', 'focus', 'prioritize']
    for sent in sentences:
        sent = re.sub(r'<[^>]+>', '', sent).strip()
        if any(verb in sent.lower() for verb in action_verbs) and len(sent) > 30 and len(sent) < 200:
            if sent not in insights:
                insights.append(sent)
            if len(insights) >= 5:
                break
    
    return insights[:5]  # Max 5 insights

def generate_insight_objects(insights, content, title, url, source):
    """Convert insight texts to structured objects"""
    structured = []
    frameworks = extract_frameworks(content)
    
    for i, insight_text in enumerate(insights):
        # Generate action
        action_verbs = ['Use', 'Apply', 'Implement', 'Try', 'Explore', 'Review']
        action = f"{action_verbs[i % len(action_verbs)]} this approach in your work"
        
        # Detect framework
        framework = frameworks[i] if i < len(frameworks) else None
        
        # Detect PARA category
        para_cat, para_target = detect_para_category(title, content, insight_text)
        
        structured.append({
            "insight": insight_text[:300],
            "action": action,
            "framework": framework,
            "para_category": para_cat,
            "para_target": para_target,
            "rationale": f"Extracted from {source} article on {title[:50]}",
            "confidence": "medium"
        })
    
    return structured

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
                    'content': content
                })
            except Exception as e:
                pass
    
    return pending

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
        "extracted_at": datetime.now().isoformat(),
        "extraction_method": "pattern_based"
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
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    article['source'],
                    article['title'],
                    article['url'],
                    'insight',
                    insight.get('insight', ''),
                    insight.get('para_category', 'resources'),
                    insight.get('para_target', ''),
                    insight.get('rationale', ''),
                    datetime.now().isoformat()
                ))
                routed += 1
            except Exception as e:
                pass
        
        conn.commit()
        conn.close()
        return routed
    except Exception as e:
        return 0

def process_article(article):
    """Process a single article"""
    # Extract insights
    raw_insights = extract_actionable_insights(article['content'], article['title'])
    
    if len(raw_insights) < 2:
        # Generate generic insights based on content type
        raw_insights = [
            f"Key concept from '{article['title'][:60]}...'",
            f"Review strategies discussed in this {article['source']} article",
            f"Consider implications for your workflow"
        ]
    
    # Structure insights
    structured = generate_insight_objects(
        raw_insights, 
        article['content'], 
        article['title'], 
        article['url'], 
        article['source']
    )
    
    # Save
    save_insights(article, structured)
    
    # Route to PARA
    routed = route_to_para(article, structured)
    
    return len(structured), routed

def main():
    print("="*70)
    print("CIS v2.0 - Pattern-Based Insight Extractor")
    print("="*70)
    
    pending = get_pending_articles()
    print(f"\nFound {len(pending)} articles to process")
    
    if not pending:
        print("No articles to process.")
        return
    
    print(f"\nProcessing all {len(pending)} articles...")
    print("-"*70)
    
    processed = 0
    total_insights = 0
    total_routed = 0
    
    for i, article in enumerate(pending):
        try:
            num_insights, num_routed = process_article(article)
            total_insights += num_insights
            total_routed += num_routed
            processed += 1
            
            if (i + 1) % 10 == 0:
                print(f"  Progress: {i+1}/{len(pending)} articles ({total_insights} insights)")
        except Exception as e:
            print(f"  ✗ Error on {article['source']}/{article['slug']}: {e}")
    
    print("\n" + "="*70)
    print("EXTRACTION COMPLETE")
    print("="*70)
    print(f"Articles processed: {processed}/{len(pending)}")
    print(f"Total insights: {total_insights}")
    print(f"Routed to PARA: {total_routed}")

if __name__ == "__main__":
    main()
