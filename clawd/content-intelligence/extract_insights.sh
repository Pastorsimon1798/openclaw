#!/bin/bash
# CIS v2.0 - Batch Insight Extraction Script
# Processes articles in batches for efficiency

set -e

BASE_DIR="/home/liam/clawd/content-intelligence/sources"
TMP_DIR="/tmp/cis_insights_$$"
mkdir -p "$TMP_DIR"

# Function to process a single article
process_article() {
    local source=$1
    local slug=$2
    local archive_file="$BASE_DIR/$source/archive/$slug.json"
    local insight_file="$BASE_DIR/$source/insights/$slug.json"
    
    # Skip if already has insights
    if [ -f "$insight_file" ]; then
        echo "  ⚠ $source/$slug already processed"
        return 0
    fi
    
    # Extract title and content from archive
    local title=$(python3 -c "import json; print(json.load(open('$archive_file'))['title'])" 2>/dev/null || echo "Untitled")
    local content=$(python3 -c "import json; print(json.load(open('$archive_file'))['content_text'][:5000])" 2>/dev/null || echo "")
    local url=$(python3 -c "import json; print(json.load(open('$archive_file'))['url'])" 2>/dev/null || echo "")
    
    if [ -z "$content" ]; then
        echo "  ✗ $source/$slug - no content"
        return 1
    fi
    
    # Create prompt file
    local prompt_file="$TMP_DIR/${source}_${slug}_prompt.txt"
    local output_file="$TMP_DIR/${source}_${slug}_output.json"
    
    cat > "$prompt_file" << EOFPROMPT
Extract 3-5 HIGH-QUALITY, ACTIONABLE insights from this article.

SOURCE: $source
TITLE: $title
URL: $url

CONTENT:
$content

RULES:
1. SYNTHESIZE insights - don't extract random fragments
2. Each insight MUST be actionable (what to DO)
3. Detect explicit frameworks/methods if mentioned
4. Categorize into PARA:
   - projects: ceramics, stickers, natural-capture
   - areas: ef-coaching, ai-tools, business-strategy
   - resources: frameworks, templates, best-practices

OUTPUT ONLY JSON:
[{"insight": "...", "action": "...", "framework": "...", "para_category": "...", "para_target": "...", "rationale": "...", "confidence": "high"}]
EOFPROMPT

    # Call LLM
    echo "  Processing: $source/$slug"
    if clawdbot llm-task --prompt-file "$prompt_file" --output "$output_file" --model zai/glm-4.7 2>/dev/null; then
        # Create insights JSON
        python3 << EOPYTHON
import json
from datetime import datetime

source = "$source"
slug = "$slug"
title = """$title"""
url = "$url"

# Read LLM output
try:
    with open("$output_file", "r") as f:
        llm_response = f.read()
    
    # Extract JSON array
    import re
    match = re.search(r'\[[\s\S]*\]', llm_response)
    if match:
        insights = json.loads(match.group())
    else:
        insights = json.loads(llm_response)
    
    # Validate insights
    if not isinstance(insights, list):
        insights = [insights] if isinstance(insights, dict) else []
    
    # Ensure required fields
    for i in insights:
        if 'para_category' not in i:
            i['para_category'] = 'resources'
        if 'para_target' not in i:
            i['para_target'] = 'best-practices'
        if 'confidence' not in i:
            i['confidence'] = 'medium'
    
    # Save insights file
    insights_data = {
        "source_name": source,
        "source_title": title,
        "source_url": url,
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
    
    with open("$insight_file", "w") as f:
        json.dump(insights_data, f, indent=2)
    
    print(f"  ✓ Saved {len(insights)} insights: {source}/{slug}")
    
except Exception as e:
    print(f"  ✗ Failed: {source}/{slug} - {e}")
    # Create fallback
    insights_data = {
        "source_name": source,
        "source_title": title,
        "source_url": url,
        "slug": slug,
        "insights": [{"insight": "Article archived for review", "action": "Review content manually", "para_category": "resources", "para_target": "best-practices", "confidence": "low"}],
        "insight_count": 1,
        "extracted_at": datetime.now().isoformat(),
        "error": str(e)
    }
    with open("$insight_file", "w") as f:
        json.dump(insights_data, f, indent=2)
EOPYTHON
        return 0
    else
        echo "  ✗ LLM failed for: $source/$slug"
        return 1
    fi
}

# Count articles needing processing
count_pending() {
    local count=0
    for source_dir in "$BASE_DIR"/*/; do
        source=$(basename "$source_dir")
        [ -d "$source_dir/archive" ] || continue
        for archive in "$source_dir/archive"/*.json; do
            [ -f "$archive" ] || continue
            slug=$(basename "$archive" .json)
            [ -f "$source_dir/insights/$slug.json" ] || ((count++))
        done
    done
    echo "$count"
}

# Process all pending articles
process_all() {
    local processed=0
    local failed=0
    
    for source_dir in "$BASE_DIR"/*/; do
        source=$(basename "$source_dir")
        [ -d "$source_dir/archive" ] || continue
        
        echo ""
        echo "Processing source: $source"
        echo "----------------------------------------"
        
        for archive in "$source_dir/archive"/*.json; do
            [ -f "$archive" ] || continue
            slug=$(basename "$archive" .json)
            
            if process_article "$source" "$slug"; then
                ((processed++))
            else
                ((failed++))
            fi
            
            # Small delay to avoid rate limiting
            sleep 0.5
        done
    done
    
    echo ""
    echo "========================================"
    echo "Processing complete!"
    echo "Processed: $processed"
    echo "Failed: $failed"
}

# Route insights to PARA database
route_to_para() {
    echo "Routing insights to PARA database..."
    python3 << 'EOPYTHON'
import json
import sqlite3
from pathlib import Path
from datetime import datetime

BASE_DIR = Path("/home/liam/clawd/content-intelligence/sources")
PARA_DB = "/home/liam/clawd/memory/para.sqlite"

try:
    conn = sqlite3.connect(PARA_DB)
    cursor = conn.cursor()
    
    routed = 0
    for source_dir in BASE_DIR.iterdir():
        if not source_dir.is_dir():
            continue
        
        insights_dir = source_dir / "insights"
        if not insights_dir.exists():
            continue
        
        for insight_file in insights_dir.glob("*.json"):
            try:
                with open(insight_file, 'r') as f:
                    data = json.load(f)
                
                source_key = data.get('source_name', source_dir.name)
                article_title = data.get('source_title', '')
                article_url = data.get('source_url', '')
                
                for insight in data.get('insights', []):
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
                    routed += 1
            except Exception as e:
                print(f"  Error routing {insight_file}: {e}")
    
    conn.commit()
    conn.close()
    print(f"✓ Routed {routed} insights to PARA database")
except Exception as e:
    print(f"✗ Error: {e}")
EOPYTHON
}

# Main
echo "========================================"
echo "CIS v2.0 - Insight Extraction"
echo "========================================"
echo ""
echo "Pending articles: $(count_pending)"
echo ""

if [ "$1" == "route-only" ]; then
    route_to_para
elif [ "$1" == "process" ]; then
    process_all
    route_to_para
else
    echo "Usage: $0 [process|route-only]"
    echo ""
    echo "  process     - Extract insights from all pending articles"
    echo "  route-only  - Only route existing insights to PARA"
    echo ""
fi

# Cleanup
rm -rf "$TMP_DIR"
